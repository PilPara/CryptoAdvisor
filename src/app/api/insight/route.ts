import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, votes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  ASSET_TO_COINGECKO,
  VALID_ASSET_IDS,
  VALID_INVESTOR_TYPE_IDS,
  ASSETS,
} from "@/lib/constants";

type InsightBody = {
  assets: string[];
  investorType: string;
};

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
};

function todayId(): string {
  return new Date().toISOString().slice(0, 10);
}

// safely parse json without throwing
function safeJson(response: Response) {
  return response.json().catch(() => null);
}

function extractFirstJsonObject(text: string): string | null {
  // pull out a json object if the model adds extra text
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

async function getOrCreateDbUserId(clerkId: string): Promise<string> {
  // ensure we have a local db user row for vote aggregation
  const found = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (found[0]) return found[0].id;

  const inserted = await db.insert(users).values({ clerkId }).returning();
  return inserted[0].id;
}

async function fetchMarket(assets: string[]): Promise<CoinGeckoMarket[]> {
  // fetch a live market snapshot for the tracked assets
  const ids = assets
    .map((asset) => ASSET_TO_COINGECKO[asset])
    .filter(Boolean)
    .join(",");

  if (!ids) return [];

  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    {
      // allow next to cache this fetch briefly
      next: { revalidate: 60 },
      headers: { "x-cg-demo-key": process.env.COINGECKO_API_KEY || "" },
    },
  );

  if (!response.ok) return [];
  const data = await safeJson(response);
  return Array.isArray(data) ? (data as CoinGeckoMarket[]) : [];
}

function toTicker(cgId: string): string {
  // map coingecko id back to our tickers when possible
  const match = ASSETS.find((asset) => asset.coingeckoId === cgId);
  return match ? match.id : cgId.toUpperCase();
}

function summarizeMarket(coins: CoinGeckoMarket[]) {
  // keep the market context short for the llm prompt
  if (coins.length === 0) return "No market data available.";

  return coins
    .slice(0, 6)
    .map((coin) => {
      const pct =
        typeof coin.price_change_percentage_24h === "number"
          ? `${coin.price_change_percentage_24h >= 0 ? "+" : ""}${coin.price_change_percentage_24h.toFixed(2)}%`
          : "N/A";
      const price =
        typeof coin.current_price === "number"
          ? `$${coin.current_price.toLocaleString("en-US", {
              maximumFractionDigits: 6,
            })}`
          : "N/A";
      return `${coin.name} (${coin.symbol.toUpperCase()}): ${price}, 24h ${pct}`;
    })
    .join(" | ");
}

async function getVoteSignals(dbUserId: string) {
  // convert stored thumbs up/down into lightweight preference signals
  const recent = await db
    .select()
    .from(votes)
    .where(eq(votes.userId, dbUserId))
    .orderBy(desc(votes.createdAt))
    .limit(200);

  const bySection: Record<string, { up: number; down: number }> =
    Object.create(null);

  for (const v of recent) {
    const section = v.section;
    bySection[section] ||= { up: 0, down: 0 };
    if (v.vote === 1) bySection[section].up += 1;
    if (v.vote === -1) bySection[section].down += 1;
  }

  const lines = Object.entries(bySection)
    .slice(0, 6)
    .map(([section, s]) => `${section}: +${s.up}/-${s.down}`);

  return lines.length
    ? `Recent feedback: ${lines.join(" | ")}`
    : "No feedback yet.";
}

function fallbackInsight(opts: {
  investorType: string;
  marketSummary: string;
  feedback: string;
}) {
  // provide a non-llm fallback to keep ux stable
  return `Insight (${todayId()}): ${opts.marketSummary} ${opts.feedback} Tip for ${opts.investorType}: focus on 1–2 assets, set alerts for big 24h moves, and avoid overreacting to single headlines.`;
}

async function callOpenRouter(prompt: string) {
  // keep the openrouter call in one place
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) return null;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "AI Crypto Advisor",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 350,
        messages: [
          {
            role: "user",
            content:
              "IMPORTANT: you output only the final answer in the exact format requested. no analysis. no preamble.\n\n" +
              prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) return null;

  const data = await safeJson(response);
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

async function callHuggingFace(prompt: string) {
  // hugging face fallback when openrouter is rate-limited
  const token = process.env.HF_TOKEN;
  const model = process.env.HF_MODEL;
  if (!token || !model) return null;

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 350,
        messages: [
          {
            role: "user",
            content:
              "IMPORTANT: you output only the final answer in the exact format requested. no analysis. no preamble.\n\n" +
              prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) return null;

  const data = await safeJson(response);
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

async function openRouterInsight(params: {
  investorType: string;
  assets: string[];
  marketSummary: string;
  feedback: string;
}) {
  // force a json-only response so the user never sees model reasoning
  const basePrompt = [
    `generate today's "ai insight of the day" for a crypto dashboard user.`,
    `investor type: ${params.investorType}`,
    `tracked assets: ${params.assets.join(", ")}`,
    `market snapshot: ${params.marketSummary}`,
    `user feedback signals: ${params.feedback}`,
    "",
    "requirements:",
    '- output only valid json like {"insight":"..."} with exactly one key named insight',
    "- no markdown, no code fences, no extra keys, no extra text",
    "- 4 to 6 sentences, around 150-200 words",
    `- reference any of the ${params.assets.length} tracked assets where relevant`,
    "- do NOT quote specific prices or percentages — the user already sees live data on the dashboard. instead describe trends qualitatively (e.g. 'showing strong gains', 'slightly down', 'outperforming')",
    "- include 1 actionable, investor-type-appropriate suggestion",
    "- no financial advice, no price predictions, no guarantees, avoid 'buy'/'sell' directives",
  ].join("\n");

  const first = await callOpenRouter(basePrompt);
  const firstJson = first ? extractFirstJsonObject(first) : null;

  if (firstJson) {
    try {
      const parsed = JSON.parse(firstJson) as { insight?: unknown };
      if (typeof parsed.insight === "string" && parsed.insight.trim()) {
        return parsed.insight.trim();
      }
    } catch {
      // fall through to retry
    }
  }

  const retryPrompt = basePrompt + "\n\nreturn only the json object now.";
  const second = await callOpenRouter(retryPrompt);
  const secondJson = second ? extractFirstJsonObject(second) : null;

  if (secondJson) {
    try {
      const parsed = JSON.parse(secondJson) as { insight?: unknown };
      if (typeof parsed.insight === "string" && parsed.insight.trim()) {
        return parsed.insight.trim();
      }
    } catch {
      // ignore and try hugging face
    }
  }

  // hugging face fallback when openrouter fails
  const hf = await callHuggingFace(basePrompt);
  const hfJson = hf ? extractFirstJsonObject(hf) : null;

  if (hfJson) {
    try {
      const parsed = JSON.parse(hfJson) as { insight?: unknown };
      if (typeof parsed.insight === "string" && parsed.insight.trim()) {
        return parsed.insight.trim();
      }
    } catch {
      // ignore and use hardcoded fallback
    }
  }

  return null;
}

export async function POST(request: Request) {
  // protect the endpoint so insights are personalized per user
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const body = (await request.json()) as InsightBody;
  const assets = body?.assets;
  const investorType = body?.investorType;

  // validate request payload against allowlists
  if (
    !Array.isArray(assets) ||
    assets.length === 0 ||
    !assets.every((a: string) => VALID_ASSET_IDS.includes(a))
  ) {
    return NextResponse.json({ error: "Invalid assets" }, { status: 400 });
  }

  if (!VALID_INVESTOR_TYPE_IDS.includes(investorType)) {
    return NextResponse.json(
      { error: "Invalid investor type" },
      { status: 400 },
    );
  }

  // gather context: market snapshot + user's historical votes
  const dbUserId = await getOrCreateDbUserId(userId);
  const [coins, feedback] = await Promise.all([
    fetchMarket(assets),
    getVoteSignals(dbUserId),
  ]);

  const marketSummary = summarizeMarket(coins);

  // try llm first, then fallback for reliability
  const llm = await openRouterInsight({
    investorType,
    assets,
    marketSummary,
    feedback,
  });

  const insight =
    llm ||
    fallbackInsight({
      investorType,
      marketSummary,
      feedback,
    });

  return NextResponse.json({
    insight,
    source: llm ? "llm" : "fallback",
  });
}

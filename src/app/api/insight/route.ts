import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  VALID_ASSET_IDS,
  VALID_INVESTOR_TYPE_IDS,
  ASSET_TO_COINGECKO,
  ASSETS,
} from "@/lib/constants";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

/** Fetch live market data for the user's tracked assets (with retry) */
async function fetchMarketData(assets: string[]): Promise<CoinData[]> {
  const ids = assets
    .map((a) => ASSET_TO_COINGECKO[a])
    .filter(Boolean)
    .join(",");

  if (!ids) return [];

  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (res.status === 429) continue; // rate-limited, retry
      if (!res.ok) return [];
      return await res.json();
    } catch {
      // retry on network errors
    }
  }
  return [];
}

/** Map a CoinGecko id back to its ticker symbol */
function ticker(cgId: string): string {
  const match = ASSETS.find((a) => a.coingeckoId === cgId);
  return match ? match.id : cgId.toUpperCase();
}

/** Format a price number nicely */
function fmtPrice(p: number): string {
  if (p >= 1)
    return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${p.toPrecision(4)}`;
}

/** Format a percentage */
function fmtPct(p: number): string {
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

/** Pick a random item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Building blocks: small reusable sentence generators ─────────────────────

function priceLine(c: CoinData): string {
  return `${c.name} (${c.symbol.toUpperCase()}) is at ${fmtPrice(c.current_price)}, ${c.price_change_percentage_24h >= 0 ? "up" : "down"} ${fmtPct(c.price_change_percentage_24h)} over 24h.`;
}

function rangeLine(c: CoinData): string {
  if (!c.high_24h || !c.low_24h) return "";
  return `${ticker(c.id)} has traded between ${fmtPrice(c.low_24h)} and ${fmtPrice(c.high_24h)} today.`;
}

function leaderBoard(gainer: CoinData, loser: CoinData): string {
  if (gainer.id === loser.id) return "";
  return `${ticker(gainer.id)} leads your watchlist at ${fmtPct(gainer.price_change_percentage_24h)}, while ${ticker(loser.id)} trails at ${fmtPct(loser.price_change_percentage_24h)}.`;
}

function avgSummary(avg: number, count: number): string {
  if (avg > 3) return `Your ${count} tracked assets are averaging ${fmtPct(avg)} — a solid green day.`;
  if (avg < -3) return `Your ${count} tracked assets are averaging ${fmtPct(avg)} — a rough day across the board.`;
  return `Your ${count} tracked assets are relatively stable, averaging ${fmtPct(avg)} over 24h.`;
}

// ─── Investor-type-specific insight variants ─────────────────────────────────

type Ctx = {
  coins: CoinData[];
  gainer: CoinData;
  loser: CoinData;
  avg: number;
};

const hodlerVariants: ((ctx: Ctx) => string)[] = [
  (ctx) => {
    const { coins, gainer, loser, avg } = ctx;
    const parts = [avgSummary(avg, coins.length)];
    if (coins.length > 1) parts.push(leaderBoard(gainer, loser));
    parts.push(
      pick([
        "Stay focused on the long game — daily swings are noise in a multi-year thesis.",
        "HODLing is a strategy, not laziness. Conviction through volatility is what separates winners.",
        "Zoom out. The best-performing wallets are often the ones that haven't been touched in years.",
        "Remember: time in the market beats timing the market. Keep stacking.",
      ]),
    );
    return parts.filter(Boolean).join(" ");
  },
  (ctx) => {
    const c = pick(ctx.coins);
    const parts = [priceLine(c)];
    if (c.price_change_percentage_24h < -5)
      parts.push("Dips like this have historically been accumulation zones for patient holders.");
    else if (c.price_change_percentage_24h > 5)
      parts.push("Strong move — but don't let FOMO push you to overextend. Stick to your DCA plan.");
    else
      parts.push("Sideways consolidation often precedes the next big move. Patience pays.");
    parts.push(
      pick([
        "Consider whether your current allocation still reflects your conviction levels.",
        "If you believe in the fundamentals, short-term price action shouldn't change your strategy.",
        "The best entry point is the one you can hold through without losing sleep.",
      ]),
    );
    return parts.join(" ");
  },
  (ctx) => {
    const sorted = [...ctx.coins].sort(
      (a, b) => b.market_cap - a.market_cap,
    );
    const top = sorted[0];
    const parts = [
      `Your highest market cap holding is ${top.name} at ${fmtPrice(top.current_price)} (${fmtPct(top.price_change_percentage_24h)}).`,
    ];
    if (sorted.length > 1) {
      const smallest = sorted[sorted.length - 1];
      parts.push(
        `${smallest.name} is your smallest cap asset — higher risk, higher potential reward.`,
      );
    }
    parts.push(
      pick([
        "Portfolio diversity across market caps can smooth out the ride. Balance large caps with your smaller bets.",
        "Large caps tend to recover faster in downturns. Make sure your core position is solid before going deeper.",
        "Long-term holders who rebalance periodically tend to outperform those who set and forget entirely.",
      ]),
    );
    return parts.join(" ");
  },
];

const dayTraderVariants: ((ctx: Ctx) => string)[] = [
  (ctx) => {
    const { coins, gainer, avg } = ctx;
    const highVol = coins.filter(
      (c) => Math.abs(c.price_change_percentage_24h) > 4,
    );
    const parts: string[] = [];
    if (highVol.length > 0) {
      parts.push(
        `Volatility alert: ${highVol.map((c) => `${ticker(c.id)} (${fmtPct(c.price_change_percentage_24h)})`).join(", ")}. Big swings = big opportunity if you manage risk.`,
      );
    } else {
      parts.push(
        "Low volatility across your watchlist today. Tight ranges could break in either direction — set alerts near support and resistance.",
      );
    }
    if (gainer.high_24h && gainer.low_24h) {
      parts.push(rangeLine(gainer));
    }
    parts.push(
      pick([
        "Keep your risk/reward ratio above 2:1 and let your edge play out over many trades.",
        "Don't revenge-trade a loss. Step back, reassess, and wait for your setup.",
        "Volume confirms price moves. Watch for increasing volume on breakouts before committing.",
      ]),
    );
    return parts.filter(Boolean).join(" ");
  },
  (ctx) => {
    const c = pick(ctx.coins);
    const spread =
      c.high_24h && c.low_24h
        ? ((c.high_24h - c.low_24h) / c.low_24h) * 100
        : 0;
    const parts = [priceLine(c)];
    if (spread > 5)
      parts.push(
        `That's a ${spread.toFixed(1)}% intraday range — plenty of room for scalping setups.`,
      );
    else if (spread > 2)
      parts.push(
        `The ${spread.toFixed(1)}% intraday range is moderate. Look for clean breakouts above ${fmtPrice(c.high_24h)} or breakdowns below ${fmtPrice(c.low_24h)}.`,
      );
    else
      parts.push("Tight range — consider smaller position sizes until volatility picks up.");
    parts.push(
      pick([
        "In choppy markets, reducing position size is just as valid as sitting on your hands.",
        "The best traders know when NOT to trade. No setup = no trade.",
        "Remember: preserving capital on flat days means you're ready when opportunity strikes.",
      ]),
    );
    return parts.join(" ");
  },
  (ctx) => {
    const { coins, gainer, loser, avg } = ctx;
    const parts = [avgSummary(avg, coins.length)];
    if (coins.length > 1) parts.push(leaderBoard(gainer, loser));
    if (avg > 3)
      parts.push("Momentum is on the buyers' side. Trail your stops and let winners run.");
    else if (avg < -3)
      parts.push(
        "Sellers are in control. Look for short setups or oversold bounce plays at key support levels.",
      );
    else
      parts.push("Range-bound conditions favor mean reversion strategies. Buy support, sell resistance.");
    return parts.filter(Boolean).join(" ");
  },
];

const nftVariants: ((ctx: Ctx) => string)[] = [
  (ctx) => {
    const eth = ctx.coins.find((c) => c.id === "ethereum");
    const sol = ctx.coins.find((c) => c.id === "solana");
    const parts: string[] = [];
    if (eth)
      parts.push(
        `ETH at ${fmtPrice(eth.current_price)} (${fmtPct(eth.price_change_percentage_24h)}). ${eth.price_change_percentage_24h > 2 ? "Rising ETH often brings more NFT trading volume" : "Lower ETH means cheaper gas — good window for minting and listing"}.`,
      );
    if (sol)
      parts.push(
        `SOL at ${fmtPrice(sol.current_price)} (${fmtPct(sol.price_change_percentage_24h)}). Solana NFT activity tends to ${sol.price_change_percentage_24h > 0 ? "pick up with positive price momentum" : "cool down during pullbacks"}.`,
      );
    if (!eth && !sol) parts.push(priceLine(pick(ctx.coins)));
    parts.push(
      pick([
        "Floor prices often lag behind token price moves by 12-48 hours. Early movers have an edge.",
        "Watch creator activity and upcoming drops — the best NFT alphas comes from tracking builders, not just floors.",
        "Blue-chip NFT collections tend to hold value better in downturns. Consider your collection's risk profile.",
      ]),
    );
    return parts.filter(Boolean).join(" ");
  },
  (ctx) => {
    const c = pick(ctx.coins);
    const parts = [priceLine(c)];
    parts.push(
      pick([
        "NFT sentiment often follows broader crypto with a delay. Position early before the herd reacts.",
        "Look for NFT collections with strong community engagement — floor price is just one metric.",
        "The rarity meta shifts constantly. Focus on art and utility that holds value beyond the current trend.",
        "Minting during market fear can yield the best long-term holds. Smart collectors buy when others aren't paying attention.",
      ]),
    );
    parts.push(
      pick([
        `With ${c.name} ${c.price_change_percentage_24h >= 0 ? "trending up" : "pulling back"}, adjust your bidding strategy accordingly.`,
        "Cross-chain NFT opportunities are growing. Don't limit yourself to a single ecosystem.",
        "Track wallet activity of top collectors for alpha on upcoming hot mints.",
      ]),
    );
    return parts.join(" ");
  },
];

const defiVariants: ((ctx: Ctx) => string)[] = [
  (ctx) => {
    const { coins, avg } = ctx;
    const chains = coins.filter((c) =>
      ["ethereum", "solana", "avalanche-2", "binancecoin"].includes(c.id),
    );
    const parts: string[] = [];
    if (chains.length > 0) {
      parts.push(
        `DeFi chains: ${chains.map((c) => `${ticker(c.id)} ${fmtPrice(c.current_price)} (${fmtPct(c.price_change_percentage_24h)})`).join(" · ")}.`,
      );
      const rising = chains.filter(
        (c) => c.price_change_percentage_24h > 2,
      );
      if (rising.length > 0)
        parts.push(
          `Positive price action on ${rising.map((c) => ticker(c.id)).join(", ")} often correlates with rising TVL and better yield opportunities.`,
        );
    } else {
      parts.push(avgSummary(avg, coins.length));
    }
    parts.push(
      pick([
        "Check your LP positions for impermanent loss — rebalancing in stable conditions is cheaper than during volatility spikes.",
        "Lending rates tend to spike during sell-offs as demand for stablecoins increases. Keep some dry powder ready.",
        "Protocol revenue is a better metric than TVL for evaluating DeFi opportunities. Follow the fees.",
      ]),
    );
    return parts.filter(Boolean).join(" ");
  },
  (ctx) => {
    const c = pick(ctx.coins);
    const parts = [priceLine(c)];
    if (ctx.avg < -3)
      parts.push(
        "Market downturns often push lending APYs higher as leveraged positions unwind. Could be a yield opportunity.",
      );
    else if (ctx.avg > 3)
      parts.push(
        "Rising markets bring more leverage demand. Lending your assets could generate elevated yields right now.",
      );
    else
      parts.push(
        "Stable conditions are ideal for yield farming — impermanent loss risk is low when prices aren't swinging.",
      );
    parts.push(
      pick([
        "Always check protocol audits and TVL trends before depositing. Smart contracts are only as safe as their weakest link.",
        "Diversify across protocols and chains to reduce smart contract risk. Don't put all your yield eggs in one basket.",
        "Real yield > inflationary rewards. Focus on protocols generating actual revenue, not just printing tokens.",
        "Stablecoin farming is boring but effective. In uncertain markets, predictable yield beats speculative APRs.",
      ]),
    );
    return parts.join(" ");
  },
  (ctx) => {
    const { coins, gainer, loser, avg } = ctx;
    const parts = [avgSummary(avg, coins.length)];
    if (coins.length > 1) parts.push(leaderBoard(gainer, loser));
    parts.push(
      pick([
        "Consider using part of your gains to farm stablecoins — lock in profits while still earning yield.",
        "Bridging costs eat into yield. Make sure your DeFi strategy accounts for gas fees across chains.",
        "Keep an eye on governance proposals for your farming protocols. Tokenomics changes can impact yields overnight.",
      ]),
    );
    return parts.filter(Boolean).join(" ");
  },
];

// ─── Main generator ──────────────────────────────────────────────────────────

function generateSmartFallback(
  assets: string[],
  investorType: string,
  coins: CoinData[],
): string {
  if (coins.length === 0) {
    const typeLabels: Record<string, string> = {
      hodler: "long-term holding",
      "day-trader": "short-term trading",
      "nft-collector": "NFT collecting",
      "defi-explorer": "DeFi exploration",
    };
    return `Market data is temporarily unavailable for your tracked assets (${assets.join(", ")}). As someone focused on ${typeLabels[investorType] || investorType}, consider reviewing your portfolio strategy and setting price alerts for key levels.`;
  }

  const gainer = coins.reduce((a, b) =>
    b.price_change_percentage_24h > a.price_change_percentage_24h ? b : a,
  );
  const loser = coins.reduce((a, b) =>
    b.price_change_percentage_24h < a.price_change_percentage_24h ? b : a,
  );
  const avg =
    coins.reduce((sum, c) => sum + c.price_change_percentage_24h, 0) /
    coins.length;

  const ctx: Ctx = { coins, gainer, loser, avg };

  const variants: Record<string, ((c: Ctx) => string)[]> = {
    hodler: hodlerVariants,
    "day-trader": dayTraderVariants,
    "nft-collector": nftVariants,
    "defi-explorer": defiVariants,
  };

  const pool = variants[investorType] || hodlerVariants;
  return pick(pool)(ctx);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { assets, investorType } = body;

  // Validate input
  if (
    !Array.isArray(assets) ||
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

  const safeAssets = assets.join(", ");
  const safeInvestorType = investorType;

  // Always fetch market data — used for AI prompt enrichment AND smart fallback
  const marketData = await fetchMarketData(assets);

  // Build market context string for AI prompt
  const marketContext =
    marketData.length > 0
      ? marketData
          .map(
            (c) =>
              `${c.name} (${c.symbol.toUpperCase()}): $${c.current_price} (${fmtPct(c.price_change_percentage_24h)} 24h)`,
          )
          .join("; ")
      : "Market data unavailable";

  // Try AI-powered insight if API key is configured
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
              {
                role: "system",
                content:
                  "You are a crypto market analyst. Give a short, helpful daily insight (2-3 sentences). Be specific about price movements and tailored to the investor type. Not financial advice.",
              },
              {
                role: "user",
                content: `I'm a ${safeInvestorType} investor tracking: ${safeAssets}. Current prices: ${marketContext}. Give me a personalized insight for today.`,
              },
            ],
            max_tokens: 200,
          }),
        },
      );

      if (!res.ok) throw new Error("OpenRouter API error");

      const data = await res.json();
      const insight = data.choices?.[0]?.message?.content;

      if (!insight) throw new Error("No insight returned");

      return NextResponse.json({ insight });
    } catch {
      // Fall through to smart fallback
    }
  }

  // Smart fallback: data-driven, randomized, personalized insight
  const insight = generateSmartFallback(assets, investorType, marketData);
  return NextResponse.json({ insight });
}

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

/** Fetch live market data for the user's tracked assets */
async function fetchMarketData(assets: string[]): Promise<CoinData[]> {
  const ids = assets
    .map((a) => ASSET_TO_COINGECKO[a])
    .filter(Boolean)
    .join(",");

  if (!ids) return [];

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`,
      { next: { revalidate: 300 } }, // cache 5 min
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Map a CoinGecko id back to its ticker symbol */
function coingeckoIdToTicker(cgId: string): string {
  const match = ASSETS.find((a) => a.coingeckoId === cgId);
  return match ? match.id : cgId.toUpperCase();
}

/** Format a price number nicely */
function fmtPrice(p: number): string {
  if (p >= 1) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${p.toPrecision(4)}`;
}

/** Format a percentage */
function fmtPct(p: number): string {
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

// ─── Investor-type-specific insight templates ────────────────────────────────

type InsightContext = {
  coins: CoinData[];
  investorType: string;
  topGainer: CoinData | null;
  topLoser: CoinData | null;
  avgChange: number;
};

function hodlerInsight(ctx: InsightContext): string {
  const { coins, topGainer, topLoser, avgChange } = ctx;

  const parts: string[] = [];

  if (coins.length === 1) {
    const c = coins[0];
    const dir = c.price_change_percentage_24h >= 0 ? "up" : "down";
    parts.push(
      `${c.name} is currently trading at ${fmtPrice(c.current_price)}, ${dir} ${fmtPct(c.price_change_percentage_24h)} in the last 24 hours.`,
    );
    if (c.price_change_percentage_24h < -5) {
      parts.push(
        `This dip could be a long-term accumulation opportunity — remember, HODLers thrive on buying fear.`,
      );
    } else if (c.price_change_percentage_24h > 5) {
      parts.push(
        `Strong momentum today! As a long-term holder, staying the course during rallies is just as important as holding through dips.`,
      );
    } else {
      parts.push(
        `Sideways action like this is normal. Keep stacking and focusing on the long-term thesis.`,
      );
    }
  } else {
    if (avgChange > 3) {
      parts.push(
        `Your portfolio is having a green day — your tracked assets are averaging ${fmtPct(avgChange)} over 24h.`,
      );
    } else if (avgChange < -3) {
      parts.push(
        `Your portfolio is in the red today, averaging ${fmtPct(avgChange)} across your tracked assets.`,
      );
    } else {
      parts.push(
        `Markets are relatively flat for your tracked assets, with an average 24h change of ${fmtPct(avgChange)}.`,
      );
    }

    if (topGainer && topLoser && topGainer.id !== topLoser.id) {
      parts.push(
        `${coingeckoIdToTicker(topGainer.id)} leads at ${fmtPct(topGainer.price_change_percentage_24h)}, while ${coingeckoIdToTicker(topLoser.id)} lags at ${fmtPct(topLoser.price_change_percentage_24h)}.`,
      );
    }
    parts.push(
      `As a HODLer, focus on the macro trend rather than daily noise. Consistent accumulation beats timing the market.`,
    );
  }

  return parts.join(" ");
}

function dayTraderInsight(ctx: InsightContext): string {
  const { coins, topGainer, topLoser, avgChange } = ctx;

  const parts: string[] = [];

  // Volatility analysis
  const highVol = coins.filter(
    (c) => Math.abs(c.price_change_percentage_24h) > 4,
  );

  if (highVol.length > 0) {
    const names = highVol
      .map(
        (c) =>
          `${coingeckoIdToTicker(c.id)} (${fmtPct(c.price_change_percentage_24h)})`,
      )
      .join(", ");
    parts.push(
      `High volatility detected: ${names}. These swings could present short-term trading opportunities.`,
    );
  } else {
    parts.push(
      `Volatility is relatively low across your watchlist today. Consider tighter ranges for scalping or wait for a breakout.`,
    );
  }

  // Volume & range analysis for top coin
  if (topGainer && coins.length > 1) {
    const range =
      topGainer.high_24h && topGainer.low_24h
        ? `24h range: ${fmtPrice(topGainer.low_24h)} – ${fmtPrice(topGainer.high_24h)}`
        : "";
    parts.push(
      `${coingeckoIdToTicker(topGainer.id)} is your strongest mover at ${fmtPrice(topGainer.current_price)}. ${range}.`,
    );
  } else if (coins.length === 1) {
    const c = coins[0];
    const range =
      c.high_24h && c.low_24h
        ? `Trading in a ${fmtPrice(c.low_24h)} – ${fmtPrice(c.high_24h)} range`
        : "";
    parts.push(
      `${c.name} is at ${fmtPrice(c.current_price)} (${fmtPct(c.price_change_percentage_24h)}). ${range}.`,
    );
  }

  if (avgChange < -3) {
    parts.push(
      `The overall downtrend (avg ${fmtPct(avgChange)}) could offer mean-reversion setups — watch for support bounces.`,
    );
  } else if (avgChange > 3) {
    parts.push(
      `Bullish momentum (avg ${fmtPct(avgChange)}) — consider riding the trend but set tight stop-losses to lock in gains.`,
    );
  }

  return parts.join(" ");
}

function nftCollectorInsight(ctx: InsightContext): string {
  const { coins, topGainer, avgChange } = ctx;

  const parts: string[] = [];

  // ETH & SOL are the main NFT chains
  const ethCoin = coins.find((c) => c.id === "ethereum");
  const solCoin = coins.find((c) => c.id === "solana");

  if (ethCoin) {
    parts.push(
      `ETH is at ${fmtPrice(ethCoin.current_price)} (${fmtPct(ethCoin.price_change_percentage_24h)}). Gas prices generally correlate with network activity — ${ethCoin.price_change_percentage_24h > 2 ? "rising ETH often signals more NFT trading action" : "lower ETH prices can mean cheaper minting opportunities"}.`,
    );
  }

  if (solCoin) {
    parts.push(
      `SOL trades at ${fmtPrice(solCoin.current_price)} (${fmtPct(solCoin.price_change_percentage_24h)}). Solana NFT marketplaces have been ${solCoin.price_change_percentage_24h > 0 ? "gaining momentum" : "cooling off"} alongside price action.`,
    );
  }

  if (!ethCoin && !solCoin) {
    if (topGainer) {
      parts.push(
        `${coingeckoIdToTicker(topGainer.id)} leads your watchlist at ${fmtPrice(topGainer.current_price)} (${fmtPct(topGainer.price_change_percentage_24h)}).`,
      );
    }
    parts.push(
      `Keep an eye on NFT market sentiment — it often follows broader crypto trends with a delay. Your portfolio averaging ${fmtPct(avgChange)} today.`,
    );
  }

  parts.push(
    `Pro tip: NFT floor prices often dip when their native chain tokens drop — it can be a good time to scout for undervalued collectibles.`,
  );

  return parts.join(" ");
}

function defiExplorerInsight(ctx: InsightContext): string {
  const { coins, topGainer, topLoser, avgChange } = ctx;

  const parts: string[] = [];

  // DeFi-relevant coins
  const ethCoin = coins.find((c) => c.id === "ethereum");
  const solCoin = coins.find((c) => c.id === "solana");
  const avaxCoin = coins.find((c) => c.id === "avalanche-2");
  const bnbCoin = coins.find((c) => c.id === "binancecoin");

  const defiChains = [ethCoin, solCoin, avaxCoin, bnbCoin].filter(Boolean) as CoinData[];

  if (defiChains.length > 0) {
    const chainSummary = defiChains
      .map((c) => `${coingeckoIdToTicker(c.id)}: ${fmtPrice(c.current_price)} (${fmtPct(c.price_change_percentage_24h)})`)
      .join(" · ");
    parts.push(`DeFi chain tokens: ${chainSummary}.`);

    const risingChains = defiChains.filter(
      (c) => c.price_change_percentage_24h > 2,
    );
    if (risingChains.length > 0) {
      parts.push(
        `Rising chain tokens often correlate with increased TVL and yield opportunities on ${risingChains.map((c) => coingeckoIdToTicker(c.id)).join(", ")}.`,
      );
    }
  }

  if (avgChange < -3) {
    parts.push(
      `A ${fmtPct(avgChange)} average decline across your assets could mean higher APYs on lending protocols as leveraged positions get unwound. Watch for liquidation cascades creating entry points.`,
    );
  } else if (avgChange > 3) {
    parts.push(
      `With assets averaging ${fmtPct(avgChange)} gains, DeFi activity tends to pick up. Consider rebalancing LP positions to capture increased trading fees.`,
    );
  } else {
    parts.push(
      `Stable markets are ideal for yield farming strategies. Low volatility means less impermanent loss risk for liquidity providers.`,
    );
  }

  return parts.join(" ");
}

/** Generate a rich, data-driven fallback insight */
function generateSmartFallback(
  assets: string[],
  investorType: string,
  coins: CoinData[],
): string {
  if (coins.length === 0) {
    // No market data available — still personalize based on type
    const typeLabels: Record<string, string> = {
      hodler: "long-term holding",
      "day-trader": "short-term trading",
      "nft-collector": "NFT collecting",
      "defi-explorer": "DeFi exploration",
    };
    return `Market data is temporarily unavailable for your tracked assets (${assets.join(", ")}). As someone focused on ${typeLabels[investorType] || investorType}, consider reviewing your portfolio strategy and setting price alerts for key levels.`;
  }

  const topGainer = coins.reduce((a, b) =>
    b.price_change_percentage_24h > a.price_change_percentage_24h ? b : a,
  );
  const topLoser = coins.reduce((a, b) =>
    b.price_change_percentage_24h < a.price_change_percentage_24h ? b : a,
  );
  const avgChange =
    coins.reduce((sum, c) => sum + c.price_change_percentage_24h, 0) /
    coins.length;

  const ctx: InsightContext = {
    coins,
    investorType,
    topGainer,
    topLoser,
    avgChange,
  };

  switch (investorType) {
    case "hodler":
      return hodlerInsight(ctx);
    case "day-trader":
      return dayTraderInsight(ctx);
    case "nft-collector":
      return nftCollectorInsight(ctx);
    case "defi-explorer":
      return defiExplorerInsight(ctx);
    default:
      return hodlerInsight(ctx);
  }
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

  // Sanitized values for prompt (already validated against allowlist)
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

  // Smart fallback: data-driven, personalized insight
  const insight = generateSmartFallback(assets, investorType, marketData);
  return NextResponse.json({ insight });
}

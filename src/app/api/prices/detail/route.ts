import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get("coinId");

  if (!coinId) {
    return NextResponse.json({ error: "Missing coinId" }, { status: 400 });
  }

  // Basic sanitization
  if (!/^[a-z0-9-]+$/.test(coinId)) {
    return NextResponse.json({ error: "Invalid coinId" }, { status: 400 });
  }

  // Use the batch /markets endpoint — much lighter on rate limits than /coins/{id}
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coinId)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));

      const res = await fetch(url, {
        next: { revalidate: 60 },
        headers: { "x-cg-demo-key": process.env.COINGECKO_API_KEY || "" },
      });

      if (res.status === 429) continue; // rate-limited, retry
      if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

      const coins = await res.json();
      if (!Array.isArray(coins) || coins.length === 0) {
        return NextResponse.json(
          { error: "Coin not found" },
          { status: 404 },
        );
      }

      const data = coins[0];
      return NextResponse.json({
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        image: data.image,
        current_price: data.current_price,
        price_change_percentage_24h: data.price_change_percentage_24h,
        market_cap: data.market_cap,
        total_volume: data.total_volume,
        high_24h: data.high_24h,
        low_24h: data.low_24h,
        ath: data.ath,
        atl: data.atl,
      });
    } catch {
      if (attempt === 2) {
        return NextResponse.json(
          { error: "Failed to fetch coin data. Try again in a moment." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json(
    { error: "Failed to fetch coin data" },
    { status: 500 },
  );
}

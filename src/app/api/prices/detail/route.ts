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

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 60 } },
    );

    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

    const data = await res.json();
    return NextResponse.json({
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.large,
      current_price: data.market_data?.current_price?.usd,
      price_change_percentage_24h:
        data.market_data?.price_change_percentage_24h,
      market_cap: data.market_data?.market_cap?.usd,
      total_volume: data.market_data?.total_volume?.usd,
      high_24h: data.market_data?.high_24h?.usd,
      low_24h: data.market_data?.low_24h?.usd,
      ath: data.market_data?.ath?.usd,
      atl: data.market_data?.atl?.usd,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch coin data" },
      { status: 500 },
    );
  }
}

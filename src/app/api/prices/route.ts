import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const ASSET_TO_COINGECKO: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const { assets } = await request.json();

  const ids = (assets as string[])
    .map((a) => ASSET_TO_COINGECKO[a])
    .filter(Boolean)
    .join(",");

  if (!ids) return NextResponse.json({ coins: [] });

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error("CoinGecko API error");

    const coins = await res.json();
    return NextResponse.json({ coins });
  } catch {
    return NextResponse.json({ coins: [], error: "Failed to fetch prices" });
  }
}

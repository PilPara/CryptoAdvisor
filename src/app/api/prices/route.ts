import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ASSET_TO_COINGECKO, VALID_ASSET_IDS } from "@/lib/constants";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { assets } = body;

  if (
    !Array.isArray(assets) ||
    !assets.every((a: string) => VALID_ASSET_IDS.includes(a))
  ) {
    return NextResponse.json({ error: "Invalid assets" }, { status: 400 });
  }

  const ids = assets
    .map((a: string) => ASSET_TO_COINGECKO[a])
    .filter(Boolean)
    .join(",");

  if (!ids) return NextResponse.json({ coins: [] });

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`,
      {
        next: { revalidate: 60 },
        headers: { "x-cg-demo-key": process.env.COINGECKO_API_KEY || "" },
      },
    );

    if (!res.ok) throw new Error("CoinGecko API error");

    const coins = await res.json();
    return NextResponse.json({ coins });
  } catch {
    return NextResponse.json({ coins: [], error: "Failed to fetch prices" });
  }
}

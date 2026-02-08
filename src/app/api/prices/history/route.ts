import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const VALID_DAYS = ["1", "7", "30", "365"];

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get("coinId");
  const days = searchParams.get("days") || "7";

  if (!coinId || typeof coinId !== "string") {
    return NextResponse.json({ error: "Missing coinId" }, { status: 400 });
  }

  // Basic sanitization — only allow alphanumeric and hyphens
  if (!/^[a-z0-9-]+$/.test(coinId)) {
    return NextResponse.json({ error: "Invalid coinId" }, { status: 400 });
  }

  if (!VALID_DAYS.includes(days)) {
    return NextResponse.json(
      { error: "Invalid days parameter" },
      { status: 400 },
    );
  }

  const revalidate = days === "1" ? 60 : 300;
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));

      const res = await fetch(url, {
        next: { revalidate },
        headers: { "x-cg-demo-key": process.env.COINGECKO_API_KEY || "" },
      });

      if (res.status === 429) continue; // rate-limited, retry
      if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

      const data = await res.json();
      return NextResponse.json({ prices: data.prices });
    } catch (err) {
      if (attempt === 2) {
        return NextResponse.json(
          { error: "Failed to fetch price history. Try again in a moment." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json(
    { error: "Failed to fetch price history" },
    { status: 500 },
  );
}

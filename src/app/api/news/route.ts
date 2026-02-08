import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { VALID_ASSET_IDS } from "@/lib/constants";

interface CryptoCompareArticle {
  id: string;
  title: string;
  url: string;
  body: string;
  source: string;
  source_info: { name: string };
  published_on: number;
  imageurl: string;
  categories: string;
}

/** Map our asset IDs to CryptoCompare category strings */
const ASSET_TO_CC_CATEGORY: Record<string, string> = {
  BTC: "BTC",
  ETH: "ETH",
  SOL: "SOL",
  BNB: "BNB",
  XRP: "XRP",
  ADA: "ADA",
  DOGE: "DOGE",
  AVAX: "AVAX",
};

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

  // Build category filter from user's tracked assets
  const categories = assets
    .map((a: string) => ASSET_TO_CC_CATEGORY[a])
    .filter(Boolean)
    .join(",");

  const url = categories
    ? `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${categories}`
    : `https://min-api.cryptocompare.com/data/v2/news/?lang=EN`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) throw new Error("CryptoCompare API error");

    const data = await res.json();
    const articles: CryptoCompareArticle[] = data.Data || [];

    // Transform to our standard format
    const news = articles.slice(0, 20).map((a) => ({
      id: String(a.id),
      title: a.title,
      url: a.url,
      body: a.body?.slice(0, 200) || "",
      source: { title: a.source_info?.name || a.source },
      published_at: new Date(a.published_on * 1000).toISOString(),
      image: a.imageurl || null,
    }));

    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({
      news: [],
      error: "Unable to load news right now. Try refreshing.",
    });
  }
}

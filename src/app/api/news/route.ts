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

// map asset IDs to CryptoCompare category strings
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

  // validate input
  if (
    !Array.isArray(assets) ||
    !assets.every((asset: string) => VALID_ASSET_IDS.includes(asset))
  ) {
    return NextResponse.json({ error: "Invalid assets" }, { status: 400 });
  }

  // build category filter from user's tracked assets
  const categories = assets
    .map((asset: string) => ASSET_TO_CC_CATEGORY[asset])
    .filter(Boolean)
    .join(",");

  const url = categories
    ? `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${categories}`
    : `https://min-api.cryptocompare.com/data/v2/news/?lang=EN`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) throw new Error("CryptoCompare API error");

    const data = await response.json();
    const articles: CryptoCompareArticle[] = data.Data || [];

    // transform to standard format
    const news = articles.slice(0, 20).map((article) => ({
      id: String(article.id),
      title: article.title,
      url: article.url,
      body: article.body?.slice(0, 200) || "",
      source: { title: article.source_info?.name || article.source },
      published_at: new Date(article.published_on * 1000).toISOString(),
      image: article.imageurl || null,
    }));

    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({
      news: [],
      error: "Unable to load news right now. Try refreshing.",
    });
  }
}

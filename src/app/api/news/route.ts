import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { VALID_ASSET_IDS } from "@/lib/constants";

const FALLBACK_NEWS = [
  {
    title: "Bitcoin hits new milestone as institutional adoption grows",
    url: "#",
    source: { title: "CryptoNews" },
    published_at: new Date().toISOString(),
  },
  {
    title: "Ethereum upgrades promise faster transaction speeds",
    url: "#",
    source: { title: "CoinDesk" },
    published_at: new Date().toISOString(),
  },
  {
    title: "DeFi protocols see record total value locked",
    url: "#",
    source: { title: "The Block" },
    published_at: new Date().toISOString(),
  },
];

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

  const currencies = assets.join(",");

  try {
    const res = await fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=demo&currencies=${currencies}&kind=news&public=true`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) throw new Error("CryptoPanic API error");

    const data = await res.json();
    const news = (data.results || []).slice(0, 5);

    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: FALLBACK_NEWS });
  }
}

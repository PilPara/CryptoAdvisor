import { NextResponse } from "next/server";

interface RedditPost {
  data: {
    title: string;
    url: string;
    post_hint?: string;
  };
}

const CRYPTO_CAPTIONS = [
  "When you buy the dip but it keeps dipping",
  "Me explaining Bitcoin to my family",
  "HODL gang checking charts at 3am",
  "When your altcoin finally pumps 2%",
  "Diamond hands vs paper hands",
  "That feeling when gas fees cost more than the transaction",
  "When someone says crypto is a scam",
  "Telling yourself you won't check the charts today",
];

export async function GET() {
  // Try Reddit first
  try {
    const res = await fetch(
      "https://www.reddit.com/r/CryptoCurrencyMemes/hot.json?limit=30",
      {
        headers: { "User-Agent": "crypto-advisor-app/1.0" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error("Reddit API error");

    const data = await res.json();
    const memes = (data?.data?.children || [])
      .map((c: RedditPost) => c.data)
      .filter(
        (p: RedditPost["data"]) =>
          p.post_hint === "image" &&
          (p.url.endsWith(".jpg") ||
            p.url.endsWith(".png") ||
            p.url.endsWith(".gif"))
      )
      .map((p: RedditPost["data"]) => ({
        title: p.title,
        url: p.url,
      }));

    if (memes.length > 0) {
      return NextResponse.json({ memes });
    }

    throw new Error("No image memes found");
  } catch {
    // Fallback: use Imgflip API for reliable meme template URLs + crypto captions
    try {
      const res = await fetch("https://api.imgflip.com/get_memes");
      const data = await res.json();
      const templates = (data?.data?.memes || []).slice(0, CRYPTO_CAPTIONS.length);

      const memes = templates.map(
        (t: { name: string; url: string }, i: number) => ({
          title: CRYPTO_CAPTIONS[i] || t.name,
          url: t.url,
        })
      );

      return NextResponse.json({ memes });
    } catch {
      // Last resort: return captions only with placeholder
      return NextResponse.json({
        memes: CRYPTO_CAPTIONS.map((title) => ({
          title,
          url: "",
        })),
      });
    }
  }
}

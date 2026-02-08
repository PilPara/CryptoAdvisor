import { NextResponse } from "next/server";

interface RedditPost {
  data: {
    title: string;
    url: string;
    post_hint?: string;
  };
}

const SUBREDDITS = [
  "CryptoCurrencyMemes",
  "Bitcoin",
  "CryptoMemes",
  "ethtrader",
];

export async function GET() {
  // Try multiple subreddits for a bigger pool
  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=50`,
        {
          headers: { "User-Agent": "crypto-advisor-app/1.0" },
          next: { revalidate: 3600 },
        },
      );

      if (!res.ok) continue;

      const data = await res.json();
      const memes = (data?.data?.children || [])
        .map((c: RedditPost) => c.data)
        .filter(
          (p: RedditPost["data"]) =>
            p.post_hint === "image" &&
            (p.url.endsWith(".jpg") ||
              p.url.endsWith(".png") ||
              p.url.endsWith(".gif")),
        )
        .map((p: RedditPost["data"]) => ({
          title: p.title,
          url: p.url,
        }));

      if (memes.length >= 5) {
        return NextResponse.json({ memes });
      }
    } catch {
      continue;
    }
  }

  // Fallback: use Imgflip API top memes with crypto captions
  try {
    const res = await fetch("https://api.imgflip.com/get_memes");
    const data = await res.json();
    const templates = (data?.data?.memes || []).slice(0, 25);

    const captions = [
      "When you buy the dip but it keeps dipping",
      "Me explaining Bitcoin to my family at Thanksgiving",
      "HODL gang checking charts at 3am",
      "When your altcoin finally pumps 2% after months",
      "Diamond hands vs paper hands",
      "Gas fees cost more than my transaction",
      "When someone says crypto is a scam",
      "Telling myself I won't check the charts today",
      "When you sold yesterday and it moons today",
      "My portfolio after I said I'd stop trading",
      "When the market crashes right after you buy",
      "Trying to explain NFTs to my boomer dad",
      "When Elon tweets about Doge again",
      "My face when Bitcoin drops 10% in an hour",
      "When you finally break even after 2 years",
      "Staking rewards hitting different at 3am",
      "When the whitepaper is just a PDF of vibes",
      "Me pretending I understand tokenomics",
      "When the airdrop is worth $0.002",
      "The duality of crypto: lambo or ramen",
      "When your friend asks for crypto advice",
      "Portfolio diversification: 12 different shitcoins",
      "When you zoom out and it's still down",
      "That one friend who bought the top",
      "When the exchange goes down during a pump",
    ];

    const memes = templates.map(
      (t: { name: string; url: string }, i: number) => ({
        title: captions[i] || t.name,
        url: t.url,
      }),
    );

    return NextResponse.json({ memes });
  } catch {
    return NextResponse.json({
      memes: [],
    });
  }
}

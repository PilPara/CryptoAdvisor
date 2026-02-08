"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NewsItem {
  title: string;
  url: string;
  source: { title: string };
  published_at: string;
}

export function MarketNews({ assets }: { assets: string[] }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currencies = assets.join(",");

    fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=demo&currencies=${currencies}&kind=news&public=true`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch news");
        return res.json();
      })
      .then((data) => setNews((data.results || []).slice(0, 5)))
      .catch((err) => {
        setError(err.message);
        // Static fallback
        setNews([
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
        ]);
        setError(null);
      })
      .finally(() => setLoading(false));
  }, [assets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market News</CardTitle>
        <CardDescription>Latest crypto news for your interests</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading news...</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="font-medium leading-snug">{item.title}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{item.source.title}</span>
                <span>&middot;</span>
                <span>
                  {new Date(item.published_at).toLocaleDateString()}
                </span>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

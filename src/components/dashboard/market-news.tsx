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
    fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setNews(data.news || []);
      })
      .catch((err) => setError(err.message))
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
          {news.map((item) => (
            <a
              key={item.title}
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

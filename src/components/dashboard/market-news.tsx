"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VoteButtons } from "@/components/dashboard/vote-buttons";

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
            <div
              key={item.title}
              className="flex items-start justify-between gap-2 rounded-lg border p-3"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 transition-colors hover:text-primary"
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
              <VoteButtons section="news" contentId={item.url} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

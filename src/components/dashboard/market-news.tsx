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
  id: string;
  title: string;
  url: string;
  body: string;
  source: { title: string };
  published_at: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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
      .then((response) => response.json())
      .then((data) => {
        if (data.error) setError(data.error);
        setNews(data.news || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assets]);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle>Market News</CardTitle>
        <CardDescription>
          Latest crypto news{news.length > 0 ? ` · ${news.length} stories` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading news...</p>
        )}
        {error && news.length === 0 && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && news.length === 0 && (
          <p className="text-sm text-muted-foreground">No news available.</p>
        )}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {news.map((item, idx) => (
            <a
              key={item.id || `${item.url}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors group block"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium leading-snug group-hover:text-primary group-hover:underline">
                  {item.title}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="inline-block ml-1.5 opacity-0 group-hover:opacity-50 transition-opacity"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                {item.body && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-snug">
                    {item.body}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{item.source.title}</span>
                  <span>&middot;</span>
                  <span>{timeAgo(item.published_at)}</span>
                </div>
              </div>
              <div className="shrink-0" onClick={(e) => e.preventDefault()}>
                <VoteButtons section="news" contentId={item.id || item.url} />
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

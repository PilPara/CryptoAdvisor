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
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setNews(data.news || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assets]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Market News</CardTitle>
        <CardDescription>
          Latest crypto news · {news.length > 0 ? `${news.length} stories` : "Loading..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading news...</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {news.map((item) => (
            <div
              key={item.url + item.title}
              className="flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <a
                  href={item.url !== "#" ? item.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium leading-snug block ${item.url !== "#" ? "hover:text-primary hover:underline cursor-pointer" : ""}`}
                >
                  {item.title}
                  {item.url !== "#" && (
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
                      className="inline-block ml-1 opacity-40"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  )}
                </a>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.source.title}</span>
                  <span>&middot;</span>
                  <span>{timeAgo(item.published_at)}</span>
                </div>
              </div>
              <VoteButtons section="news" contentId={item.url} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

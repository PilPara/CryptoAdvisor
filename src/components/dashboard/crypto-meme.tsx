"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoteButtons } from "@/components/dashboard/vote-buttons";

interface Meme {
  title: string;
  url: string;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = url;
  });
}

export function CryptoMeme() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [meme, setMeme] = useState<Meme | null>(null);
  const [loadingMeme, setLoadingMeme] = useState(false);

  const pickRandom = useCallback(
    async (list: Meme[]) => {
      const pool = list.length > 0 ? list : memes;
      if (pool.length === 0) return;

      setLoadingMeme(true);
      const idx = Math.floor(Math.random() * pool.length);
      const next = pool[idx];

      if (next.url) {
        try {
          await preloadImage(next.url);
        } catch {
          // image failed to load, still show the title
        }
      }

      setMeme(next);
      setLoadingMeme(false);
    },
    [memes],
  );

  useEffect(() => {
    fetch("/api/meme")
      .then((res) => res.json())
      .then((data) => {
        const all: Meme[] = (data.memes || []).filter(
          (m: Meme) => m.url,
        );
        setMemes(all);
        pickRandom(all);
      })
      .catch(() => {});
  }, [pickRandom]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto Meme</CardTitle>
        <CardDescription>Your daily dose of humor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingMeme && (
          <p className="text-sm text-muted-foreground">Loading meme...</p>
        )}
        {!loadingMeme && meme && (
          <>
            <p className="font-medium">{meme.title}</p>
            {meme.url && (
              <img
                src={meme.url}
                alt={meme.title}
                className="w-full rounded-lg"
              />
            )}
          </>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pickRandom(memes)}
            disabled={loadingMeme}
          >
            {loadingMeme ? "Loading..." : "Show another meme"}
          </Button>
          {meme && !loadingMeme && (
            <VoteButtons section="meme" contentId={meme.title} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

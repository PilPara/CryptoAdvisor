"use client";

import { useEffect, useRef, useState } from "react";
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
  const memesRef = useRef<Meme[]>([]);
  const [meme, setMeme] = useState<Meme | null>(null);
  const [loadingMeme, setLoadingMeme] = useState(true);

  async function showRandom(pool?: Meme[]) {
    const list = pool ?? memesRef.current;
    if (list.length === 0) return;

    setLoadingMeme(true);
    const idx = Math.floor(Math.random() * list.length);
    const next = list[idx];

    if (next.url) {
      try {
        await preloadImage(next.url);
      } catch {
        // image failed to load, still show the title
      }
    }

    setMeme(next);
    setLoadingMeme(false);
  }

  useEffect(() => {
    fetch("/api/meme")
      .then((res) => res.json())
      .then((data) => {
        const all: Meme[] = (data.memes || []).filter((m: Meme) => m.url);
        memesRef.current = all;
        showRandom(all);
      })
      .catch(() => setLoadingMeme(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onClick={() => showRandom()}
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

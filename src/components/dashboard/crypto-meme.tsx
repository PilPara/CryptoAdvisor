"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Meme {
  title: string;
  url: string;
}

export function CryptoMeme() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [meme, setMeme] = useState<Meme | null>(null);

  function pickRandom(list: Meme[]) {
    const pool = list.length > 0 ? list : memes;
    if (pool.length === 0) return;
    const idx = Math.floor(Math.random() * pool.length);
    setMeme(pool[idx]);
  }

  useEffect(() => {
    fetch("/api/meme")
      .then((res) => res.json())
      .then((data) => {
        const all: Meme[] = data.memes || [];
        setMemes(all);
        pickRandom(all);
      })
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto Meme</CardTitle>
        <CardDescription>Your daily dose of humor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {meme && (
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
        <Button variant="outline" size="sm" onClick={() => pickRandom(memes)}>
          Show another meme
        </Button>
      </CardContent>
    </Card>
  );
}

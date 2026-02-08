"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VoteButtons } from "@/components/dashboard/vote-buttons";
import { AddCoinButton } from "@/components/dashboard/add-coin-button";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
}

export function CoinPrices({ assets }: { assets: string[] }) {
  const [trackedAssets, setTrackedAssets] = useState<string[]>(assets);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets: trackedAssets }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCoins(data.coins);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [trackedAssets]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Coin Prices</CardTitle>
            <CardDescription>Live prices · 24h change</CardDescription>
          </div>
          <AddCoinButton
            currentAssets={trackedAssets}
            onAssetAdded={setTrackedAssets}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading prices...</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && coins.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No price data available.
          </p>
        )}
        <div className="space-y-3">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <Link
                href={`/coin/${coin.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div className="font-medium hover:underline">
                    {coin.name}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase">
                    {coin.symbol}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/coin/${coin.id}`} className="text-right">
                  <div className="font-medium">
                    ${coin.current_price.toLocaleString()}
                  </div>
                  <div
                    className={`text-sm ${
                      coin.price_change_percentage_24h >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {coin.price_change_percentage_24h >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(coin.price_change_percentage_24h)?.toFixed(2)}%
                    24h
                  </div>
                </Link>
                <VoteButtons section="prices" contentId={coin.id} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

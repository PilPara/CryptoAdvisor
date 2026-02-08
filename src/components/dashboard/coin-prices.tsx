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
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCoins(data.coins);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Prices</CardTitle>
        <CardDescription>Live prices for your tracked assets</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading prices...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && coins.length === 0 && (
          <p className="text-sm text-muted-foreground">No price data available.</p>
        )}
        <div className="space-y-3">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div className="font-medium">{coin.name}</div>
                  <div className="text-sm text-muted-foreground uppercase">
                    {coin.symbol}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
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
                    {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </div>
                <VoteButtons section="prices" contentId={coin.id} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

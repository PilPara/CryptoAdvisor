"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceChart } from "@/components/coin/price-chart";

interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  atl: number;
}

function formatNum(num: number | null | undefined): string {
  if (num == null) return "N/A";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doFetchCoin = useCallback(() => {
    // Use the batch /markets endpoint — same one the dashboard uses.
    // This is a single call that returns all the detail data required.
    // leaving the only other CoinGecko call to the chart history to ease on number of request since rate limit on free tier is really low
    fetch(`/api/prices/detail?coinId=${coinId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCoin(data);
        }
      })
      .catch(() => setError("Failed to load coin data. Try again."))
      .finally(() => setLoading(false));
  }, [coinId]);

  const fetchCoin = useCallback(() => {
    setLoading(true);
    setError(null);
    doFetchCoin();
  }, [doFetchCoin]);

  useEffect(() => {
    doFetchCoin();
  }, [doFetchCoin]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <p className="text-muted-foreground">Loading coin data...</p>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="mx-auto max-w-4xl py-8 space-y-4">
        <p className="text-destructive">{error || "Coin not found."}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCoin}>
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pctChange = coin.price_change_percentage_24h;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      {/* Back button */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </Button>
      </Link>

      {/* Coin header */}
      <div className="flex items-center gap-4">
        {coin.image && (
          <Image
            src={coin.image}
            alt={coin.name}
            width={48}
            height={48}
            className="rounded-full"
            unoptimized
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{coin.name}</h1>
          <span className="text-sm uppercase text-muted-foreground">
            {coin.symbol}
          </span>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-bold">
            {formatNum(coin.current_price)}
          </div>
          {pctChange != null && (
            <div
              className={`text-sm font-medium ${
                pctChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {pctChange >= 0 ? "▲" : "▼"} {Math.abs(pctChange).toFixed(2)}%
              (24h)
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="pt-6">
          <PriceChart coinId={coinId} />
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: "Market Cap", value: formatNum(coin.market_cap) },
          { label: "24h Volume", value: formatNum(coin.total_volume) },
          { label: "24h High", value: formatNum(coin.high_24h) },
          { label: "24h Low", value: formatNum(coin.low_24h) },
          { label: "All-Time High", value: formatNum(coin.ath) },
          { label: "All-Time Low", value: formatNum(coin.atl) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

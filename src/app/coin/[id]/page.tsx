"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

function formatNum(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prices/detail?coinId=${coinId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setCoin(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coinId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <p className="text-muted-foreground">Loading coin data...</p>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <p className="text-destructive">Coin not found.</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
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
          <img
            src={coin.image}
            alt={coin.name}
            className="h-12 w-12 rounded-full"
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
              {pctChange >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(pctChange).toFixed(2)}% (24h)
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

"use client";

import { useEffect, useState, useCallback } from "react";
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
import { ASSETS, ASSET_TO_COINGECKO } from "@/lib/constants";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
}

/** Build placeholder rows from the constants for assets that aren't loaded yet */
function getPlaceholderRows(assetIds: string[]) {
  return assetIds.map((id) => {
    const meta = ASSETS.find((a) => a.id === id);
    return {
      assetId: id,
      coingeckoId: ASSET_TO_COINGECKO[id] || id.toLowerCase(),
      name: meta ? meta.label.replace(/ \(.*\)/, "") : id,
      symbol: id,
    };
  });
}

export function CoinPrices({ assets }: { assets: string[] }) {
  const [trackedAssets, setTrackedAssets] = useState<string[]>(assets);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets: trackedAssets }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          // Keep any previously loaded coins as cache
          if (data.coins?.length) setCoins(data.coins);
        } else {
          setCoins(data.coins || []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [trackedAssets]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Build a lookup map from coingecko id → CoinData for loaded coins
  const coinMap = new Map(coins.map((c) => [c.id, c]));
  const placeholders = getPlaceholderRows(trackedAssets);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Coin Prices</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-destructive">
                  Failed to load prices ·{" "}
                  <button
                    onClick={fetchPrices}
                    className="underline hover:text-destructive/80"
                  >
                    Retry
                  </button>
                </span>
              ) : (
                "Live prices · 24h change"
              )}
            </CardDescription>
          </div>
          <AddCoinButton
            currentAssets={trackedAssets}
            onAssetAdded={setTrackedAssets}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading && coins.length === 0
            ? /* Skeleton rows while first load */
              placeholders.map((p) => (
                <div
                  key={p.assetId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground uppercase">
                        {p.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-12 bg-muted animate-pulse rounded mt-1" />
                  </div>
                </div>
              ))
            : /* Render rows for each tracked asset — show real data or fallback */
              placeholders.map((p) => {
                const coin = coinMap.get(p.coingeckoId);
                if (coin) {
                  return (
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
                        <Link
                          href={`/coin/${coin.id}`}
                          className="text-right"
                        >
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
                            {coin.price_change_percentage_24h >= 0
                              ? "▲"
                              : "▼"}{" "}
                            {Math.abs(
                              coin.price_change_percentage_24h,
                            )?.toFixed(2)}
                            % 24h
                          </div>
                        </Link>
                        <VoteButtons section="prices" contentId={coin.id} />
                      </div>
                    </div>
                  );
                }
                // Fallback card — no price data available for this coin
                return (
                  <div
                    key={p.assetId}
                    className="flex items-center justify-between rounded-lg border p-3 opacity-60"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {p.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground uppercase">
                          {p.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      Price unavailable
                    </div>
                  </div>
                );
              })}
        </div>
      </CardContent>
    </Card>
  );
}

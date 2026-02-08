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
import { VoteButtons } from "@/components/dashboard/vote-buttons";

interface AiInsightProps {
  assets: string[];
  investorType: string;
}

const TYPE_LABELS: Record<string, string> = {
  hodler: "HODLer",
  "day-trader": "Day Trader",
  "nft-collector": "NFT Collector",
  "defi-explorer": "DeFi Explorer",
};

export function AiInsight({ assets, investorType }: AiInsightProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  function fetchInsight() {
    setLoading(true);
    fetch("/api/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets, investorType }),
    })
      .then((res) => res.json())
      .then((data) => setInsight(data.insight))
      .catch(() =>
        setInsight(
          "Unable to generate insight right now. Please try again in a moment.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, investorType]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Insight of the Day</CardTitle>
            <CardDescription>
              Personalized for{" "}
              <span className="font-medium text-foreground">
                {TYPE_LABELS[investorType] || investorType}
              </span>{" "}
              · Tracking {assets.join(", ")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Analyzing market data for your portfolio...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="leading-relaxed">{insight}</p>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInsight}
                disabled={loading}
              >
                Refresh insight
              </Button>
              <VoteButtons
                section="insight"
                contentId={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

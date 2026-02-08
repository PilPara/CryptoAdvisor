"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AiInsightProps {
  assets: string[];
  investorType: string;
}

export function AiInsight({ assets, investorType }: AiInsightProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets, investorType }),
    })
      .then((res) => res.json())
      .then((data) => setInsight(data.insight))
      .catch(() =>
        setInsight(
          "Markets are showing mixed signals today. Consider reviewing your portfolio allocation and staying updated with the latest developments in your tracked assets."
        )
      )
      .finally(() => setLoading(false));
  }, [assets, investorType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insight of the Day</CardTitle>
        <CardDescription>
          Personalized analysis based on your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Generating your insight...
          </p>
        ) : (
          <p className="leading-relaxed">{insight}</p>
        )}
      </CardContent>
    </Card>
  );
}

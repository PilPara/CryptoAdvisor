"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ASSETS = [
  { id: "BTC", label: "Bitcoin (BTC)" },
  { id: "ETH", label: "Ethereum (ETH)" },
  { id: "SOL", label: "Solana (SOL)" },
  { id: "BNB", label: "BNB (BNB)" },
  { id: "XRP", label: "Ripple (XRP)" },
  { id: "ADA", label: "Cardano (ADA)" },
  { id: "DOGE", label: "Dogecoin (DOGE)" },
  { id: "AVAX", label: "Avalanche (AVAX)" },
];

const INVESTOR_TYPES = [
  { id: "hodler", label: "HODLer", description: "Buy and hold long-term" },
  {
    id: "day-trader",
    label: "Day Trader",
    description: "Short-term trades for quick gains",
  },
  {
    id: "nft-collector",
    label: "NFT Collector",
    description: "Focused on digital collectibles",
  },
  {
    id: "defi-explorer",
    label: "DeFi Explorer",
    description: "Yield farming, staking, and protocols",
  },
];

const CONTENT_TYPES = [
  { id: "news", label: "Market News" },
  { id: "prices", label: "Coin Prices & Charts" },
  { id: "social", label: "Social & Community" },
  { id: "fun", label: "Fun & Memes" },
];

export default function OnboardingPage() {
  const [assets, setAssets] = useState<string[]>([]);
  const [investorType, setInvestorType] = useState<string>("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleAsset(id: string) {
    setAssets((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function toggleContentType(id: string) {
    setContentTypes((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const isValid =
    assets.length > 0 && investorType !== "" && contentTypes.length > 0;

  async function submit() {
    if (!isValid) return;
    setLoading(true);

    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets, investorType, contentTypes }),
    });

    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Welcome! Let&apos;s personalize your experience
        </h1>
        <p className="mt-2 text-muted-foreground">
          Answer a few quick questions so we can tailor your dashboard.
        </p>
      </div>

      {/* Step 1: Assets */}
      <Card>
        <CardHeader>
          <CardTitle>What crypto assets are you interested in?</CardTitle>
          <CardDescription>Select one or more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {ASSETS.map((asset) => (
              <Label
                key={asset.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent ${
                  assets.includes(asset.id)
                    ? "border-primary bg-accent"
                    : "border-border"
                }`}
              >
                <Checkbox
                  checked={assets.includes(asset.id)}
                  onCheckedChange={() => toggleAsset(asset.id)}
                />
                {asset.label}
              </Label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Investor Type */}
      <Card>
        <CardHeader>
          <CardTitle>What type of investor are you?</CardTitle>
          <CardDescription>Pick the one that fits you best</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {INVESTOR_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setInvestorType(type.id)}
                className={`cursor-pointer rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                  investorType === type.id
                    ? "border-primary bg-accent"
                    : "border-border"
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Content Types */}
      <Card>
        <CardHeader>
          <CardTitle>What content would you like to see?</CardTitle>
          <CardDescription>Select one or more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {CONTENT_TYPES.map((content) => (
              <Label
                key={content.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent ${
                  contentTypes.includes(content.id)
                    ? "border-primary bg-accent"
                    : "border-border"
                }`}
              >
                <Checkbox
                  checked={contentTypes.includes(content.id)}
                  onCheckedChange={() => toggleContentType(content.id)}
                />
                {content.label}
              </Label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        onClick={submit}
        disabled={!isValid || loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Saving..." : "Continue to Dashboard"}
      </Button>
    </div>
  );
}

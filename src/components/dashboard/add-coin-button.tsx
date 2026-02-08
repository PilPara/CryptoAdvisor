"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ASSETS } from "@/lib/constants";

interface AddCoinButtonProps {
  currentAssets: string[];
  onAssetAdded: (newAssets: string[]) => void;
}

export function AddCoinButton({
  currentAssets,
  onAssetAdded,
}: AddCoinButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const availableCoins = ASSETS.filter(
    (asset) => !currentAssets.includes(asset.id),
  );

  async function addCoin(assetId: string) {
    setSaving(true);
    const newAssets = [...currentAssets, assetId];

    // Optimistic update
    onAssetAdded(newAssets);
    setOpen(false);

    try {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: newAssets }),
      });

      if (!response.ok) {
        // Rollback on failure
        onAssetAdded(currentAssets);
      } else {
        // Refresh server components so MarketNews, AiInsight update too
        router.refresh();
      }
    } catch {
      onAssetAdded(currentAssets);
    } finally {
      setSaving(false);
    }
  }

  if (availableCoins.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={saving}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add coin
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {availableCoins.map((asset) => (
            <button
              key={asset.id}
              onClick={() => addCoin(asset.id)}
              disabled={saving}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
            >
              {asset.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface VoteButtonsProps {
  section: string;
  contentId: string;
  initialVote?: number | null;
}

export function VoteButtons({
  section,
  contentId,
  initialVote = null,
}: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState<number | null>(initialVote);
  const [loading, setLoading] = useState(false);

  async function handleVote(vote: number) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, contentId, vote }),
      });

      const data = await res.json();
      setCurrentVote(data.vote ?? null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`h-7 w-7 p-0 ${currentVote === 1 ? "text-green-600 bg-green-50" : "text-muted-foreground"}`}
      >
        👍
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`h-7 w-7 p-0 ${currentVote === -1 ? "text-red-600 bg-red-50" : "text-muted-foreground"}`}
      >
        👎
      </Button>
    </div>
  );
}

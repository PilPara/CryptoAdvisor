"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setCurrentVote(null);
    fetch(`/api/vote?section=${section}`)
      .then((res) => res.json())
      .then((data) => {
        const vote = data.votes?.[contentId];
        setCurrentVote(vote ?? null);
      })
      .catch(() => {});
  }, [section, contentId]);

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
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`h-7 w-7 p-0 rounded-full ${currentVote === 1 ? "text-green-500 bg-green-500/10" : "text-muted-foreground hover:text-green-500"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={currentVote === 1 ? "3" : "2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`h-7 w-7 p-0 rounded-full ${currentVote === -1 ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={currentVote === -1 ? "3" : "2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Button>
    </div>
  );
}

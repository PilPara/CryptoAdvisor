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
      .then((response) => response.json())
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
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, contentId, vote }),
      });

      const data = await response.json();
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
        title="Upvote"
        className={`h-7 w-7 p-0 rounded-full ${currentVote === 1 ? "text-green-500 bg-green-500/10" : "text-muted-foreground hover:text-green-500"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={currentVote === 1 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={loading}
        title="Downvote"
        className={`h-7 w-7 p-0 rounded-full ${currentVote === -1 ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={currentVote === -1 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
      </Button>
    </div>
  );
}

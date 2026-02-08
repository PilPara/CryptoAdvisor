"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Two-column row where the LEFT column determines the height
 * and the RIGHT column is constrained to match (scrolls internally).
 */
export function SyncedRow({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    const sync = () => {
      const h = leftEl.offsetHeight;
      rightRef.current!.style.height = `${h}px`;
    };

    // Initial sync
    sync();

    // Watch for left column size changes (coins loading, add coin, etc.)
    const ro = new ResizeObserver(sync);
    ro.observe(leftEl);

    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div ref={leftRef} className="md:w-1/2">
        {left}
      </div>
      <div ref={rightRef} className="md:w-1/2 overflow-hidden">
        {right}
      </div>
    </div>
  );
}

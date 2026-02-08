"use client";

import { useCallback, useRef, type ReactNode } from "react";

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
  const rightRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Ref callback on the left column — fires when the DOM node mounts/unmounts
  const leftCallbackRef = useCallback((node: HTMLDivElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const sync = () => {
      if (rightRef.current && node.isConnected) {
        rightRef.current.style.height = `${node.offsetHeight}px`;
      }
    };

    // Initial sync
    sync();

    // Watch for size changes
    observerRef.current = new ResizeObserver(sync);
    observerRef.current.observe(node);
  }, []);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div ref={leftCallbackRef} className="md:w-1/2">
        {left}
      </div>
      <div ref={rightRef} className="md:w-1/2 overflow-hidden">
        {right}
      </div>
    </div>
  );
}

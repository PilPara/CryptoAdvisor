"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

// Dynamic import with SSR disabled — lightweight-charts requires browser APIs
const PriceChartInner = dynamic(
  () => import("@/components/coin/price-chart-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    ),
  },
);

// Error boundary to catch any residual lightweight-charts disposal errors
interface ErrorBoundaryState {
  hasError: boolean;
}

class ChartErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Chart failed to render.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface PriceChartProps {
  coinId: string;
}

export function PriceChart({ coinId }: PriceChartProps) {
  return (
    <ChartErrorBoundary>
      <PriceChartInner coinId={coinId} />
    </ChartErrorBoundary>
  );
}

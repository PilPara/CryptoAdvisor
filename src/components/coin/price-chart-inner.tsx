"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";

const TIME_RANGES = [
  { label: "1D", days: "1" },
  { label: "1W", days: "7" },
  { label: "1M", days: "30" },
  { label: "1Y", days: "365" },
] as const;

interface PriceChartInnerProps {
  coinId: string;
}

export default function PriceChartInner({ coinId }: PriceChartInnerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [selectedRange, setSelectedRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Initialize chart on mount
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(156, 163, 175, 0.1)" },
        horzLines: { color: "rgba(156, 163, 175, 0.1)" },
      },
      width: container.clientWidth,
      height: 400,
      timeScale: {
        borderColor: "rgba(156, 163, 175, 0.2)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(156, 163, 175, 0.2)",
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#3b82f6",
      topColor: "rgba(59, 130, 246, 0.3)",
      bottomColor: "rgba(59, 130, 246, 0.02)",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartRef.current && container.isConnected) {
        try {
          chart.applyOptions({ width: container.clientWidth });
        } catch {
          // Chart may be disposed
        }
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      // Null refs FIRST so any in-flight async callbacks see null
      chartRef.current = null;
      seriesRef.current = null;
      // Then remove the chart (this cancels its internal subscriptions)
      try {
        chart.remove();
      } catch {
        // Already disposed or DOM detached
      }
    };
  }, []);

  // Fetch data when range changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/prices/history?coinId=${coinId}&days=${selectedRange}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const chart = chartRef.current;
        const series = seriesRef.current;
        if (data.prices && chart && series) {
          try {
            const formatted = data.prices.map(
              ([timestamp, price]: [number, number]) => ({
                time: (timestamp / 1000) as Time,
                value: price,
              }),
            );
            series.setData(formatted);
            chart.timeScale().fitContent();
            setHasData(true);
            setError(null);
          } catch {
            // Chart was disposed between check and setData
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load chart data");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [coinId, selectedRange]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-1">
        {TIME_RANGES.map((range) => (
          <button
            key={range.days}
            onClick={() => setSelectedRange(range.days)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedRange === range.days
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {range.label}
          </button>
        ))}
        {error && (
          <span className="ml-2 text-xs text-destructive">{error}</span>
        )}
      </div>
      <div className="relative">
        {loading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        )}
        {loading && hasData && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Updating...
            </span>
          </div>
        )}
        <div ref={chartContainerRef} />
      </div>
    </div>
  );
}

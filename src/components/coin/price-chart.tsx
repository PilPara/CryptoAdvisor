"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
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
  { label: "5Y", days: "1825" },
  { label: "Max", days: "max" },
] as const;

interface PriceChartProps {
  coinId: string;
}

export function PriceChart({ coinId }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [selectedRange, setSelectedRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(156, 163, 175, 0.1)" },
        horzLines: { color: "rgba(156, 163, 175, 0.1)" },
      },
      width: chartContainerRef.current.clientWidth,
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

    const series = chart.addAreaSeries({
      lineColor: "#3b82f6",
      topColor: "rgba(59, 130, 246, 0.3)",
      bottomColor: "rgba(59, 130, 246, 0.02)",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Fetch data when range changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/prices/history?coinId=${coinId}&days=${selectedRange}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        if (data.prices && seriesRef.current) {
          const formatted = data.prices.map(
            ([timestamp, price]: [number, number]) => ({
              time: (timestamp / 1000) as Time,
              value: price,
            }),
          );
          seriesRef.current.setData(formatted);
          chartRef.current?.timeScale().fitContent();
        }
      })
      .catch(() => setError("Failed to load chart data"))
      .finally(() => setLoading(false));
  }, [coinId, selectedRange]);

  return (
    <div>
      <div className="mb-4 flex gap-1">
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
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <div ref={chartContainerRef} />
      </div>
    </div>
  );
}

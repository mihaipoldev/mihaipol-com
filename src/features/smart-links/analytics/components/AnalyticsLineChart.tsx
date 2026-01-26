"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type DailyPoint = { date: string; count: number };

type AnalyticsLineChartProps = {
  title?: string;
  description?: string;
  data: DailyPoint[];
  className?: string;
  strokeColorVar?: string;
  hideAxes?: boolean;
  hideYAxis?: boolean;
  height?: number;
  hideGrid?: boolean;
  valueLabel?: string;
};

export function AnalyticsLineChart({
  title,
  description,
  data,
  className,
  strokeColorVar = "hsl(var(--primary))",
  hideAxes = false,
  hideYAxis = false,
  height = 240,
  hideGrid = false,
  valueLabel = "visits",
}: AnalyticsLineChartProps) {
  const formatted = React.useMemo(
    () =>
      data.map((d) => {
        // Parse date - handle both ISO format and YYYY-MM-DD format
        let date: Date;
        if (d.date.includes('T')) {
          // ISO format with time
          date = new Date(d.date);
        } else {
          // YYYY-MM-DD format - add time to ensure proper parsing
          date = new Date(d.date + 'T00:00:00.000Z');
        }
        
        // Validate date
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', d.date);
          date = new Date(); // Fallback to current date
        }
        
        return {
          ...d,
          // label for tooltip and axis
          dayLabel: format(date, "MMM d"),
          fullDate: format(date, "MMM d, yyyy"),
        };
      }),
    [data]
  );

  // Build sparse ticks for the x-axis (about ~7 ticks, ensuring start/middle/end)
  // Skip the first tick to avoid corner overlap
  const ticks = React.useMemo(() => {
    const count = formatted.length;
    if (count === 0) return [];
    const desired = 10;
    const positions = new Set<number>();
    for (let i = 0; i < desired; i++) {
      const idx = Math.round((i * (count - 1)) / (desired - 1));
      positions.add(Math.max(0, Math.min(count - 1, idx)));
    }
    const uniqueSorted = Array.from(positions).sort((a, b) => a - b);
    // Remove the first tick (index 0) to avoid corner overlap
    const filteredTicks = uniqueSorted.filter((i) => i > 0);
    return filteredTicks.map((i) => formatted[i].dayLabel);
  }, [formatted]);

  const gradientId = React.useId();

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            {!hideGrid && <CartesianGrid stroke="hsl(var(--border))" vertical={false} />}
            {!hideAxes && (
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                ticks={ticks}
                interval={0}
              />
            )}
            {!hideAxes && !hideYAxis && (
              <YAxis
                allowDecimals={false}
                width={36}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
            )}
            <Tooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
              content={({ active, payload }) =>
                active && payload && payload.length ? (
                  <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-sm">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {payload[0].payload.fullDate}
                    </div>
                    <div className="text-lg font-semibold tabular-nums">
                      {payload[0].value as number} {valueLabel}
                    </div>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={strokeColorVar}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
};

export function AnalyticsLineChart({
  title,
  description,
  data,
  className,
  strokeColorVar = "hsl(var(--primary))",
}: AnalyticsLineChartProps) {
  const formatted = React.useMemo(
    () =>
      data.map((d) => ({
        ...d,
        // label for tooltip and axis
        dayLabel: format(new Date(d.date), "MMM d"),
      })),
    [data]
  );

  // Build sparse ticks for the x-axis (about ~7 ticks, ensuring start/middle/end)
  const ticks = React.useMemo(() => {
    const count = formatted.length;
    if (count === 0) return [];
    const desired = 7;
    const positions = new Set<number>();
    for (let i = 0; i < desired; i++) {
      const idx = Math.round((i * (count - 1)) / (desired - 1));
      positions.add(Math.max(0, Math.min(count - 1, idx)));
    }
    const uniqueSorted = Array.from(positions).sort((a, b) => a - b);
    return uniqueSorted.map((i) => formatted[i].dayLabel);
  }, [formatted]);

  const gradientId = React.useId();

  return (
    <div className={cn("w-full", className)}>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              ticks={ticks}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              width={36}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
              content={({ active, payload, label }) =>
                active && payload && payload.length ? (
                  <div className="rounded-md border bg-popover px-2 py-1 text-popover-foreground shadow-sm">
                    <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
                    <div className="text-sm font-semibold tabular-nums">
                      {payload[0].value as number}
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

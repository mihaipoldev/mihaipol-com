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
  Legend,
} from "recharts";
import { format } from "date-fns";
import type { SectionClicksData, SectionItemVisitsData } from "@/features/admin/dashboard/data";

type SectionClicksChartProps = {
  data: SectionClicksData | SectionItemVisitsData;
};

export function SectionClicksChart({ data }: SectionClicksChartProps) {
  // Combine all three datasets into one, ensuring all dates are present
  const combinedData = React.useMemo(() => {
    const dateMap = new Map<
      string,
      { albums: number; updates: number; events: number; date: string }
    >();

    // Initialize all dates with 0 values
    data.albums.forEach((point) => {
      dateMap.set(point.date, { albums: 0, updates: 0, events: 0, date: point.date });
    });
    data.updates.forEach((point) => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { albums: 0, updates: 0, events: 0, date: point.date });
      }
    });
    data.events.forEach((point) => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { albums: 0, updates: 0, events: 0, date: point.date });
      }
    });

    // Fill in the actual values
    data.albums.forEach((point) => {
      const entry = dateMap.get(point.date);
      if (entry) entry.albums = point.count;
    });
    data.updates.forEach((point) => {
      const entry = dateMap.get(point.date);
      if (entry) entry.updates = point.count;
    });
    data.events.forEach((point) => {
      const entry = dateMap.get(point.date);
      if (entry) entry.events = point.count;
    });

    // Convert to array and sort by date
    return Array.from(dateMap.values())
      .map((d) => ({
        ...d,
        dayLabel: format(new Date(d.date), "MMM d"),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Build sparse ticks for the x-axis
  const ticks = React.useMemo(() => {
    const count = combinedData.length;
    if (count === 0) return [];
    const desired = 7;
    const positions = new Set<number>();
    for (let i = 0; i < desired; i++) {
      const idx = Math.round((i * (count - 1)) / (desired - 1));
      positions.add(Math.max(0, Math.min(count - 1, idx)));
    }
    const uniqueSorted = Array.from(positions).sort((a, b) => a - b);
    return uniqueSorted.map((i) => combinedData[i].dayLabel);
  }, [combinedData]);

  const albumsGradientId = React.useId();
  const updatesGradientId = React.useId();
  const eventsGradientId = React.useId();

  return (
    <div className="w-full">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={albumsGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={updatesGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={eventsGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
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
                    <div className="text-[11px] font-medium text-muted-foreground mb-1">
                      {label}
                    </div>
                    {payload.map((entry, index) => (
                      <div
                        key={index}
                        className="text-sm font-semibold tabular-nums flex items-center gap-2"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>
                          {entry.name}: {entry.value as number}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null
              }
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="albums"
              name="Albums"
              stroke="#3b82f6"
              strokeWidth={2}
              fill={`url(#${albumsGradientId})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="updates"
              name="Updates"
              stroke="#10b981"
              strokeWidth={2}
              fill={`url(#${updatesGradientId})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="events"
              name="Events"
              stroke="#f97316"
              strokeWidth={2}
              fill={`url(#${eventsGradientId})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

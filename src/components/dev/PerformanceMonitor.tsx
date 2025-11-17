"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PerformanceMetric = {
  name: string;
  duration: number;
  timestamp: number;
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for performance logs from data fetching
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      originalLog(...args);

      const message = args.join(" ");
      if (message.includes("[DB]")) {
        const match = message.match(/(\d+)ms/);
        if (match) {
          const duration = parseInt(match[1]);
          const name = message.split("query")[0]?.replace("🔍 [DB]", "").trim() || "Unknown";

          setMetrics((prev) => [
            ...prev.slice(-19), // Keep last 20
            { name, duration, timestamp: Date.now() },
          ]);
        }
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);

      const message = args.join(" ");
      if (message.includes("SLOW QUERY")) {
        const match = message.match(/(\d+)ms/);
        if (match) {
          const duration = parseInt(match[1]);
          const name =
            message.split("took")[0]?.replace("⚠️ [DB] SLOW QUERY:", "").trim() || "Slow Query";

          setMetrics((prev) => [
            ...prev.slice(-19),
            { name: `⚠️ ${name}`, duration, timestamp: Date.now() },
          ]);
        }
      }
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  const avgDuration =
    metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length)
      : 0;

  const maxDuration = metrics.length > 0 ? Math.max(...metrics.map((m) => m.duration)) : 0;

  const slowQueries = metrics.filter((m) => m.duration > 1000).length;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        📊 Show Performance
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Performance Monitor</CardTitle>
            <CardDescription className="text-xs">
              Real-time query performance tracking
            </CardDescription>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{avgDuration}ms</div>
            <div className="text-xs text-muted-foreground">Avg</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">{maxDuration}ms</div>
            <div className="text-xs text-muted-foreground">Max</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{slowQueries}</div>
            <div className="text-xs text-muted-foreground">Slow</div>
          </div>
        </div>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {metrics.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No queries logged yet
            </div>
          ) : (
            metrics
              .slice()
              .reverse()
              .map((metric, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    metric.duration > 1000
                      ? "bg-red-500/10 text-red-500"
                      : metric.duration > 500
                        ? "bg-orange-500/10 text-orange-500"
                        : "bg-muted"
                  }`}
                >
                  <span className="truncate flex-1 mr-2">{metric.name}</span>
                  <span className="font-mono font-semibold">{metric.duration}ms</span>
                </div>
              ))
          )}
        </div>

        {metrics.length > 0 && (
          <button
            onClick={() => setMetrics([])}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
          >
            Clear metrics
          </button>
        )}
      </CardContent>
    </Card>
  );
}

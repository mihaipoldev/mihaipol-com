import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCardGradient } from "@/lib/gradient-presets";
import { ReactNode } from "react";

type DashboardMetricCardProps = {
  title: string;
  value: number | string;
  icon?: ReactNode;
  iconColor?: string;
  hoverGradient?: string;
  stats?: Array<{ label: string; value: number | string }>;
  className?: string;
};

export function DashboardMetricCard({
  title,
  value,
  icon,
  iconColor,
  hoverGradient,
  stats,
  className,
}: DashboardMetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl group",
        className
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Sparkle decorations */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
      <div
        className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
        style={{ animationDelay: "300ms" }}
      />

      {/* Hover gradient overlay */}
      {hoverGradient && (
        <div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br",
            hoverGradient
          )}
        />
      )}

      <CardContent className="p-6 relative">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <p className="text-4xl font-bold tabular-nums text-foreground">{value}</p>
            </div>
            {icon && (
              <div
                className={cn(
                  "opacity-80 transition-opacity duration-300 group-hover:opacity-100",
                  iconColor || "text-muted-foreground/50"
                )}
              >
                {icon}
              </div>
            )}
          </div>
          {stats && stats.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCardGradient } from "@/lib/gradient-presets";
import { ReactNode } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
    <Card
      className={cn(
        "relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl group",
        className
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Sparkle decorations */}
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm"
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
      />

      {/* Hover gradient overlay */}
      {hoverGradient && (
          <motion.div
          className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none bg-gradient-to-br",
            hoverGradient
          )}
            transition={{ duration: 0.3 }}
        />
      )}

      <CardContent className="p-6 relative">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
                <motion.p
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wide"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                {title}
                </motion.p>
                <motion.p
                  className="text-4xl font-bold tabular-nums text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {value}
                </motion.p>
            </div>
            {icon && (
                <motion.div
                className={cn(
                  "opacity-80 transition-opacity duration-300 group-hover:opacity-100",
                  iconColor || "text-muted-foreground/50"
                )}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
              >
                {icon}
                </motion.div>
            )}
          </div>
          {stats && stats.length > 0 && (
              <motion.div
                className="pt-4 border-t border-border/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      className="space-y-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                    >
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
                    </motion.div>
                ))}
              </div>
              </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

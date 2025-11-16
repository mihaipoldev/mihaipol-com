'use client'

import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type AdminMetricTabProps = {
  value: string
  label: string
  metric: number | string
  subtitle?: string
  className?: string
}

export function AdminMetricTab({ value, label, metric, subtitle, className }: AdminMetricTabProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "min-h-[88px] rounded-none text-base bg-sidebar text-sidebar-foreground/90 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2 flex flex-col items-center justify-center gap-1.5 border-sidebar-border text-center w-full whitespace-normal",
        className
      )}
    >
      <span className="text-xs md:text-sm text-sidebar-foreground/70">{label}</span>
      <span className="text-2xl md:text-3xl font-semibold leading-none tabular-nums">{metric}</span>
      {subtitle && (
        <span className="text-xs text-emerald-500">{subtitle}</span>
      )}
    </TabsTrigger>
  )
}



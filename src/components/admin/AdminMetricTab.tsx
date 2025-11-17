'use client'

import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getGradient } from "@/lib/gradient-presets"

type AdminMetricTabProps = {
  value: string
  label: string
  metric: number | string
  subtitle?: string
  className?: string
}

export function AdminMetricTab({ value, label, metric, subtitle, className }: AdminMetricTabProps) {
  const subtleGradient = getGradient()
  const beforeGradientClasses = subtleGradient.split(' ').map(cls => `before:${cls}`).join(' ')
  
  return (
    <TabsTrigger
      value={value}
      className={cn(
        `min-h-[88px] rounded-t-none rounded-b-none text-base relative ${subtleGradient} text-sidebar-foreground/90 data-[state=active]:backdrop-blur-none data-[state=active]:bg-transparent data-[state=active]:bg-none data-[state=active]:text-foreground px-4 py-2 flex flex-col items-center justify-center gap-1.5 text-center w-full whitespace-normal transition-all duration-300 ease-in-out`,
        `before:absolute before:inset-0 ${beforeGradientClasses} before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none`,
        "data-[state=active]:before:opacity-0",
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent after:transition-colors after:duration-300 after:pointer-events-none",
        "data-[state=active]:after:bg-primary",
        className
      )}
    >
      <span className="relative z-10 text-xs md:text-sm text-sidebar-foreground/70 data-[state=active]:text-foreground/70 transition-colors duration-300">{label}</span>
      <span className="relative z-10 text-2xl md:text-3xl font-semibold leading-none tabular-nums transition-colors duration-300">{metric}</span>
      {subtitle && (
        <span className="relative z-10 text-xs text-emerald-500">{subtitle}</span>
      )}
    </TabsTrigger>
  )
}



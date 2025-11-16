'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type ChartConfig = {
  [key: string]: {
    label?: string
    color?: string
  }
}

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config?: ChartConfig
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const cssVars: React.CSSProperties = {}
  if (config) {
    Object.entries(config).forEach(([key, value]) => {
      if (value?.color) {
        ;(cssVars as any)[`--chart-${key}`] = value.color
      }
    })
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-sidebar-border bg-background p-4 md:p-6',
        className
      )}
      style={cssVars}
      {...props}
    >
      {children}
    </div>
  )
}

export function ChartHeader({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  if (!title && !description) return null
  return (
    <div className="mb-4">
      {title ? <div className="text-sm font-medium text-muted-foreground">{title}</div> : null}
      {description ? (
        <div className="text-2xl font-semibold leading-none tracking-tight">{description}</div>
      ) : null}
    </div>
  )
}

export function ChartTooltip({
  label,
  value,
  className,
}: {
  label?: string
  value?: string | number
  className?: string
}) {
  if (label === undefined) return null
  return (
    <div
      className={cn(
        'rounded-md border bg-popover px-2 py-1 text-popover-foreground shadow-sm',
        className
      )}
    >
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      {value !== undefined ? (
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      ) : null}
    </div>
  )
}

export type { ChartConfig }



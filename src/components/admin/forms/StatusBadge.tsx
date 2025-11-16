import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
  status: string
  variant?: "event" | "publish"
}

export function StatusBadge({ status, variant = "publish" }: StatusBadgeProps) {
  const statusColors: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    // Publish status
    draft: { variant: "outline", label: "Draft" },
    scheduled: { variant: "secondary", label: "Scheduled" },
    published: { variant: "default", label: "Published" },
    archived: { variant: "outline", label: "Archived" },
    // Event status
    upcoming: { variant: "default", label: "Upcoming" },
    past: { variant: "outline", label: "Past" },
    cancelled: { variant: "destructive", label: "Cancelled" },
  }

  const config = statusColors[status.toLowerCase()] || { variant: "outline" as const, label: status }

  return (
    <Badge variant={config.variant} className={cn("capitalize")}>
      {config.label}
    </Badge>
  )
}


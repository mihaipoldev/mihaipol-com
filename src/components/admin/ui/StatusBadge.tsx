import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  variant?: "event" | "publish";
};

export function StatusBadge({ status, variant = "publish" }: StatusBadgeProps) {
  const statusColors: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
      className?: string;
    }
  > = {
    // Publish status
    draft: { variant: "secondary", label: "Draft", className: "bg-muted text-muted-foreground" },
    scheduled: {
      variant: "outline",
      label: "Scheduled",
      className: "border-border bg-background text-foreground/70",
    },
    published: {
      variant: "default",
      label: "Published",
      className: "bg-primary text-primary-foreground",
    },
    archived: {
      variant: "outline",
      label: "Archived",
      className: "border-border bg-background text-foreground/70",
    },
    // Event status
    upcoming: {
      variant: "default",
      label: "Upcoming",
      className: "bg-primary text-primary-foreground",
    },
    past: {
      variant: "outline",
      label: "Past",
      className: "border-border bg-background text-foreground/70",
    },
    cancelled: { variant: "destructive", label: "Cancelled" },
  };

  const config = statusColors[status.toLowerCase()] || {
    variant: "outline" as const,
    label: status,
    className: "border-border bg-background text-foreground/70",
  };

  return (
    <Badge variant={config.variant} className={cn("capitalize", config.className)}>
      {config.label}
    </Badge>
  );
}

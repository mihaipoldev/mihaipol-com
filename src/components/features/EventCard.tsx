import Link from "next/link";
import { formatEventDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type EventCardProps = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  venue?: string | null;
  date: string;
  className?: string;
};

export default function EventCard({
  id,
  slug,
  title,
  city,
  venue,
  date,
  className,
}: EventCardProps) {
  const location = city && venue ? `${city} – ${venue}` : city || venue || "Location TBA";

  return (
    <Link href={`/dev/events/${slug}`} className={cn("block group", className)}>
      <div className="flex items-center gap-6 md:gap-8 py-4 border-l-2 border-border pl-6 hover:border-foreground transition-colors">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground mb-1.5">{location}</div>
          <h3 className="text-lg font-semibold group-hover:underline">{title}</h3>
        </div>
        <div className="text-sm font-medium whitespace-nowrap text-muted-foreground group-hover:text-foreground transition-colors">
          {formatEventDate(date)}
        </div>
      </div>
    </Link>
  );
}

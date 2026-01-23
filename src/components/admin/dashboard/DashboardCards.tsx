import { DashboardMetricCard } from "./DashboardMetricCard";
import type { DashboardData } from "@/features/admin/dashboard/data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompactDisc, faCalendarDays, faNewspaper } from "@fortawesome/free-solid-svg-icons";

type DashboardCardsProps = {
  data: DashboardData;
};

export function DashboardCards({ data }: DashboardCardsProps) {
  const { albums, events, updates } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Albums Card */}
      <DashboardMetricCard
        title="Albums"
        value={albums.total}
        icon={<FontAwesomeIcon icon={faCompactDisc} className="w-6 h-6" />}
        iconColor="text-blue-500"
        hoverGradient="hover:from-blue-500/10 hover:via-blue-500/5 hover:to-transparent"
        stats={[
          { label: "Upcoming", value: albums.upcoming },
          { label: "Past 12 Months", value: albums.past12Months },
        ]}
      />

      {/* Events Card */}
      <DashboardMetricCard
        title="Events"
        value={events.past + events.upcoming}
        icon={<FontAwesomeIcon icon={faCalendarDays} className="w-6 h-6" />}
        iconColor="text-orange-500"
        hoverGradient="hover:from-orange-500/10 hover:via-orange-500/5 hover:to-transparent"
        stats={[
          { label: "Upcoming", value: events.upcoming },
          { label: "Past", value: events.past },
        ]}
      />

      {/* Updates Card */}
      <DashboardMetricCard
        title="Updates"
        value={updates.total}
        icon={<FontAwesomeIcon icon={faNewspaper} className="w-6 h-6" />}
        iconColor="text-emerald-500"
        hoverGradient="hover:from-emerald-500/10 hover:via-emerald-500/5 hover:to-transparent"
        stats={Object.entries(updates.byStatus).map(([status, count]) => ({
          label: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
        }))}
      />
    </div>
  );
}

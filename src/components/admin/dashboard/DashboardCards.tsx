"use client";

import { DashboardMetricCard } from "./DashboardMetricCard";
import type { DashboardData } from "@/features/admin/dashboard/data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompactDisc, faCalendarDays, faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

type DashboardCardsProps = {
  data: DashboardData;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export function DashboardCards({ data }: DashboardCardsProps) {
  const { albums, events, updates } = data;

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Albums Card */}
      <motion.div variants={cardVariants}>
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
      </motion.div>

      {/* Events Card */}
      <motion.div variants={cardVariants}>
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
      </motion.div>

      {/* Updates Card */}
      <motion.div variants={cardVariants}>
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
      </motion.div>
    </motion.div>
  );
}

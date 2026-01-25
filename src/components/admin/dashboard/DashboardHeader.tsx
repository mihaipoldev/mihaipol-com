"use client";

import { motion } from "framer-motion";
import { AdminPageTitle } from "@/components/admin/ui/AdminPageTitle";
import { DashboardTimeScope } from "./DashboardTimeScope";
import { Suspense } from "react";

export function DashboardHeader() {
  return (
    <motion.div
      className="mb-4 md:mb-8 relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <AdminPageTitle
            title="Admin Dashboard"
            description="Overview of your content, analytics, and engagement metrics."
          />
        </div>
        <Suspense fallback={<div className="w-[140px] h-9" />}>
          <DashboardTimeScope />
        </Suspense>
      </div>
    </motion.div>
  );
}

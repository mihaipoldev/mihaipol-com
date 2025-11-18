"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSettings } from "./AccountSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsSection = "account" | "appearance" | "preferences";

interface SettingsContentProps {
  activeSection: SettingsSection;
}

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden shadow-lg">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
        <div
          className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
          style={{ animationDelay: "300ms" }}
        />

        <CardHeader className="relative">
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsContent({ activeSection }: SettingsContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [displaySection, setDisplaySection] = useState<SettingsSection>(activeSection);

  useEffect(() => {
    // Show loading when section changes
    if (activeSection !== displaySection) {
      setIsLoading(true);
      // Small delay to show loading state, then switch content
      const timer = setTimeout(() => {
        setDisplaySection(activeSection);
        setIsLoading(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [activeSection, displaySection]);

  const getContent = () => {
    switch (displaySection) {
      case "account":
        return <AccountSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "preferences":
        return <PreferencesSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <SettingsLoadingSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key={displaySection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {getContent()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

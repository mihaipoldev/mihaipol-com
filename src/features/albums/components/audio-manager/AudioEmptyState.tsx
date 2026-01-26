"use client";

import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

export function AudioEmptyState() {
  return (
    <div
      className={cn(
        "text-sm text-muted-foreground py-12 border-2 border-dashed rounded-lg text-center bg-muted/20 dark:bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
      )}
    >
      <Music className="h-8 w-8 text-muted-foreground" />
      <span>Click to add audio tracks</span>
    </div>
  );
}

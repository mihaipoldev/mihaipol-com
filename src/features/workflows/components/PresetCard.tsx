"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkflowPreset } from "../presets/types";
import { Loader2, Play, Settings } from "lucide-react";
import { toast } from "sonner";

type PresetCardProps = {
  preset: WorkflowPreset;
  albumId: string;
  onRun?: () => void;
  onConfigure?: (preset: WorkflowPreset) => void;
};

function PresetCardComponent({ preset, albumId, onRun, onConfigure }: PresetCardProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/workflows/presets/${preset.id}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_type: "albums",
          entity_id: albumId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to run preset");
      }

      const data = await response.json();
      toast.success(`Preset started: ${data.total_videos} video(s) will be generated`);
      onRun?.();
    } catch (error: any) {
      console.error("Error running preset:", error);
      toast.error(error.message || "Failed to run preset");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className={cn(
        "relative p-5 rounded-xl bg-card/50 dark:bg-card/30 backdrop-blur-sm",
        "bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent",
        "shadow-lg overflow-hidden",
        "hover:shadow-xl transition-all duration-300",
        "group"
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Sparkle decorations */}
      <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" />
      <div
        className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse"
        style={{ animationDelay: "300ms" }}
      />

      {/* Top-left Icon */}
      {preset.icon && (
        <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center text-base z-10 group-hover:bg-primary/15 transition-colors duration-300">
          {preset.icon}
        </div>
      )}

      {/* Content */}
      <div className={cn("space-y-2.5 relative z-10", preset.icon ? "pt-10" : "pt-0")}>
        {/* Title */}
        <h3 className="text-xl font-bold text-foreground">{preset.name}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {preset.description || "No description available."}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onConfigure && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onConfigure(preset)}
              disabled={isRunning}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Configure & Run
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className={onConfigure ? "flex-1" : "flex-1"}
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Run Preset
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Optimized: Memoize component to prevent unnecessary re-renders
export const PresetCard = memo(PresetCardComponent);

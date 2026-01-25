"use client";

import { useState } from "react";
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

export function PresetCard({ preset, albumId, onRun, onConfigure }: PresetCardProps) {
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
        "relative p-5 rounded-lg bg-muted/50 border border-border",
        "hover:bg-muted/70 hover:shadow-md transition-all duration-200"
      )}
    >
      {/* Top-left Icon */}
      {preset.icon && (
        <div className="absolute top-4 left-4 w-7 h-7 rounded-md bg-background/60 flex items-center justify-center text-base">
          {preset.icon}
        </div>
      )}

      {/* Content */}
      <div className={cn("space-y-2.5", preset.icon ? "pt-10" : "pt-0")}>
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

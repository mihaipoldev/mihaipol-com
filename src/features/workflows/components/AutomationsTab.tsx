"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WorkflowCard } from "./WorkflowCard";
import { PresetCard } from "./PresetCard";
import { ConfigurationSidePanel } from "./ConfigurationSidePanel";
import { RunHistory } from "./RunHistory";
import { useEntityWorkflows } from "../hooks/useEntityWorkflows";
import { usePresets } from "../hooks/usePresets";
import { useWorkflowRuns } from "../hooks/useWorkflowRuns";
import { useRunWorkflow } from "../hooks/useRunWorkflow";
import { Loader2 } from "lucide-react";
import type { Workflow } from "../types";
import type { WorkflowPreset } from "../presets/types";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";
import { toast } from "sonner";

type AutomationsTabProps = {
  entityType: string;
  entityId: string;
  images: AlbumImage[];
  tracks: AlbumAudio[];
};

export function AutomationsTab({
  entityType,
  entityId,
  images,
  tracks,
}: AutomationsTabProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [defaultInputData, setDefaultInputData] = useState<Record<string, any> | undefined>(undefined);

  const { workflows, isLoading: workflowsLoading, error: workflowsError } =
    useEntityWorkflows(entityType);
  const { presets, isLoading: presetsLoading, error: presetsError } =
    usePresets(entityType);
  const { runs, isLoading: runsLoading, error: runsError } =
    useWorkflowRuns(entityType, entityId, 10); // No polling - will use Supabase subscriptions later
  const { runWorkflow, isRunning } = useRunWorkflow();

  const handleConfigure = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setDefaultInputData(undefined);
    setConfigPanelOpen(true);
  };

  const handleConfigurePreset = async (preset: WorkflowPreset) => {
    try {
      // Find the workflow for this preset
      const workflow = workflows.find((w) => w.id === preset.workflow_id);
      if (!workflow) {
        toast.error("Workflow not found for this preset");
        return;
      }

      // Get preview to build default input data
      const response = await fetch(`/api/workflows/presets/${preset.id}/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity_id: entityId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to preview preset");
      }

      const previewData = await response.json();
      
      // Build input data from preset settings and preview
      const inputData: Record<string, any> = {
        quality: preset.video_settings.quality,
        aspect_ratio: preset.video_settings.aspect_ratio,
        format: preset.video_settings.format,
        background_color: preset.video_settings.background_color,
        videos: previewData.matched_videos.map((video: any) => ({
          image_id: video.image_id,
          track_ids: video.track_ids,
          video_type: preset.video_settings.video_type,
        })),
      };

      // Set workflow and default values, then open panel
      setSelectedWorkflow(workflow);
      setDefaultInputData(inputData);
      setConfigPanelOpen(true);
    } catch (error: any) {
      console.error("Error configuring preset:", error);
      toast.error(error.message || "Failed to configure preset");
    }
  };

  const handleRunWorkflow = async (inputData: Record<string, any>) => {
    if (!selectedWorkflow) return;

    await runWorkflow({
      workflow_id: selectedWorkflow.id,
      entity_type: entityType,
      entity_id: entityId,
      input_data: inputData,
    });

    // Note: No auto-refetch - will use Supabase subscriptions later for real-time updates
  };

  const handleToggleRun = (runId: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return next;
    });
  };

  const handlePresetRun = () => {
    // Refresh runs after preset execution
    // Note: Will use Supabase subscriptions later for real-time updates
  };

  return (
    <div className="space-y-8">
      {/* Quick Presets Section */}
      {(presetsLoading || presets.length > 0 || presetsError) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Presets</h2>
          {presetsLoading ? (
            <div className="w-full flex items-center justify-center min-h-[200px]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading presets...</p>
              </div>
            </div>
          ) : presetsError ? (
            <div className="text-center py-12">
              <p className="text-sm text-destructive mb-2">Error loading presets</p>
              <p className="text-xs text-muted-foreground">{presetsError}</p>
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No presets available for this entity type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  albumId={entityId}
                  onRun={handlePresetRun}
                  onConfigure={handleConfigurePreset}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Available Workflows Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Workflows</h2>
        {workflowsLoading ? (
          <div className="w-full flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading workflows...</p>
            </div>
          </div>
        ) : workflowsError ? (
          <div className="text-center py-12">
            <p className="text-sm text-destructive mb-2">Error loading workflows</p>
            <p className="text-xs text-muted-foreground">{workflowsError}</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No workflows available for this entity type.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onConfigure={() => handleConfigure(workflow)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Runs Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <RunHistory
          runs={runs}
          isLoading={runsLoading}
          expandedRuns={expandedRuns}
          onToggleRun={handleToggleRun}
        />
        {runsError && (
          <div className="mt-4 text-center">
            <p className="text-sm text-destructive">{runsError}</p>
          </div>
        )}
      </div>

      {/* Configuration Side Panel */}
      <ConfigurationSidePanel
        workflow={selectedWorkflow}
        open={configPanelOpen}
        onOpenChange={(open) => {
          setConfigPanelOpen(open);
          if (!open) {
            setDefaultInputData(undefined);
          }
        }}
        onRunWorkflow={handleRunWorkflow}
        images={images}
        tracks={tracks}
        entityType={entityType}
        entityId={entityId}
        defaultValues={defaultInputData}
      />
    </div>
  );
}

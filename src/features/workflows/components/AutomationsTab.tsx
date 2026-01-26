"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowCard } from "./WorkflowCard";
import { PresetCard } from "./PresetCard";
import { ConfigurationSidePanel } from "./ConfigurationSidePanel";
import { RunHistory } from "./RunHistory";
import { useEntityWorkflowData } from "../hooks/useEntityWorkflowData";
import { useWorkflowRuns } from "../hooks/useWorkflowRuns";
import { useRunWorkflow } from "../hooks/useRunWorkflow";
import { Loader2 } from "lucide-react";
import type { Workflow } from "../types";
import type { WorkflowPreset } from "../presets/types";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";
import type { EntityWorkflowData } from "../data-server";
import { toast } from "sonner";

type AutomationsTabProps = {
  entityType: string;
  entityId: string;
  images?: AlbumImage[]; // Optional - will be fetched when needed
  tracks?: AlbumAudio[]; // Optional - will be fetched when needed
  initialWorkflowData?: EntityWorkflowData; // Pre-fetched data for instant loading
};

export function AutomationsTab({
  entityType,
  entityId,
  images,
  tracks,
  initialWorkflowData,
}: AutomationsTabProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [defaultInputData, setDefaultInputData] = useState<Record<string, any> | undefined>(undefined);

  // Optimized: Use pre-fetched data if available, otherwise fetch client-side
  // This allows server-side pre-fetching for instant loading (like Content tab)
  const { workflows, presets, runs: initialRuns, isLoading, error } =
    useEntityWorkflowData(entityType, entityId, 10, initialWorkflowData);
  
  // Optimized: Skip initial fetch in useWorkflowRuns since we already have initialRuns from useEntityWorkflowData
  // This prevents duplicate API calls - we only use this hook for realtime updates
  // Pass initialRuns so the hook can initialize its state properly
  const { runs: realtimeRuns, isLoading: runsLoading, error: runsError } =
    useWorkflowRuns(entityType, entityId, 10, undefined, initialRuns.length > 0, initialRuns);
  
  // Optimized: Use realtime runs directly since they're initialized with initialRuns
  // The realtime subscription will keep them updated
  const runs = realtimeRuns;
  
  // Optimized: Create workflow lookup map for O(1) access
  const workflowMap = useMemo(() => {
    return new Map(workflows.map((w) => [w.id, w]));
  }, [workflows]);
  
  const { runWorkflow, isRunning } = useRunWorkflow();

  // Optimized: Memoize handlers to prevent unnecessary re-renders
  const handleConfigure = useCallback((workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setDefaultInputData(undefined);
    setConfigPanelOpen(true);
  }, []);

  const handleConfigurePreset = useCallback(async (preset: WorkflowPreset) => {
    try {
      // Optimized: O(1) lookup instead of O(n) array search
      const workflow = workflowMap.get(preset.workflow_id);
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
  }, [workflowMap, entityId]);

  const handleRunWorkflow = useCallback(async (inputData: Record<string, any>) => {
    if (!selectedWorkflow) return;

    await runWorkflow({
      workflow_id: selectedWorkflow.id,
      entity_type: entityType,
      entity_id: entityId,
      input_data: inputData,
    });

    // Note: No auto-refetch - will use Supabase subscriptions later for real-time updates
  }, [selectedWorkflow, entityType, entityId, runWorkflow]);

  const handleToggleRun = useCallback((runId: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return next;
    });
  }, []);

  const handlePresetRun = useCallback(() => {
    // Refresh runs after preset execution
    // Note: Will use Supabase subscriptions later for real-time updates
  }, []);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Quick Presets Section */}
      <AnimatePresence>
        {(isLoading || presets.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <motion.div
              className="mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
                Quick Presets
              </h2>
              <p className="text-sm text-muted-foreground mt-2 ml-5">
                Pre-configured automation templates ready to use with one click
              </p>
            </motion.div>
            {isLoading ? (
              <motion.div
                className="w-full flex items-center justify-center min-h-[200px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading presets...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-destructive mb-2">Error loading presets</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </motion.div>
            ) : presets.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-muted-foreground">
                  No presets available for this entity type.
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                {presets.map((preset, index) => {
                  // Optimized: Cap animation delay to prevent performance issues with many items
                  const animationDelay = Math.min(0.2 + index * 0.05, 0.5);
                  return (
                    <motion.div
                      key={preset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: animationDelay,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    >
                      <PresetCard
                        preset={preset}
                        albumId={entityId}
                        onRun={handlePresetRun}
                        onConfigure={handleConfigurePreset}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available Workflows Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          className="mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
            Available Workflows
          </h2>
          <p className="text-sm text-muted-foreground mt-2 ml-5">
            Customize and execute advanced automation workflows
          </p>
        </motion.div>
        {isLoading ? (
          <motion.div
            className="w-full flex items-center justify-center min-h-[300px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading workflows...</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-destructive mb-2">Error loading workflows</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </motion.div>
        ) : workflows.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">
              No workflows available for this entity type.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {workflows.map((workflow, index) => {
              // Optimized: Cap animation delay to prevent performance issues with many items
              const animationDelay = Math.min(0.25 + index * 0.05, 0.5);
              return (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: animationDelay,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <WorkflowCard
                    workflow={workflow}
                    onConfigure={() => handleConfigure(workflow)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Recent Runs Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <motion.div
          className="mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
            Recent Activity
          </h2>
          <p className="text-sm text-muted-foreground mt-2 ml-5">
            View and monitor your automation execution history
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <RunHistory
            runs={runs}
            isLoading={runsLoading}
            expandedRuns={expandedRuns}
            onToggleRun={handleToggleRun}
          />
        </motion.div>
        {runsError && runsError !== null && (
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-destructive">{runsError}</p>
          </motion.div>
        )}
      </motion.div>

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
    </motion.div>
  );
}

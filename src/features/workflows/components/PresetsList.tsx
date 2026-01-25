"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import type { WorkflowPreset } from "../presets/types";
import { CreateEditPresetForm } from "./CreateEditPresetForm";
import { PresetTestModal } from "./PresetTestModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

type PresetsListProps = {
  workflowId: string;
};

type PresetItemProps = {
  preset: WorkflowPreset;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
};

function PresetItem({ preset, onEdit, onDelete, onTest }: PresetItemProps) {
  const matchingConfig = preset.matching_config;
  const videoSettings = preset.video_settings;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {preset.icon && (
            <div className="text-2xl flex-shrink-0">{preset.icon}</div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{preset.name}</h3>
            {preset.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {preset.description}
              </p>
            )}
          </div>
        </div>
        {!preset.enabled && (
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            Disabled
          </span>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          <strong>Image Filter:</strong>{" "}
          {matchingConfig.image_selection.filter?.content_type || "All images"}
          {matchingConfig.image_selection.filter?.content_group &&
            ` (${matchingConfig.image_selection.filter.content_group})`}
        </div>
        <div>
          <strong>Track Strategy:</strong>{" "}
          {matchingConfig.track_grouping.strategy === "one_video_per_track"
            ? "One video per track"
            : matchingConfig.track_grouping.strategy === "one_video_per_group"
              ? "One video per group"
              : "All tracks in one video"}
          {matchingConfig.track_grouping.group_by &&
            ` (grouped by ${matchingConfig.track_grouping.group_by})`}
        </div>
        <div>
          <strong>Video Settings:</strong> {videoSettings.quality}, {videoSettings.aspect_ratio},{" "}
          {videoSettings.format}, {videoSettings.background_color}, {videoSettings.video_type}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onTest}>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Test
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </div>
    </Card>
  );
}

export function PresetsList({ workflowId }: PresetsListProps) {
  const [presets, setPresets] = useState<WorkflowPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<WorkflowPreset | null | undefined>(undefined);
  const [testingPreset, setTestingPreset] = useState<WorkflowPreset | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<WorkflowPreset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPresets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/presets`);
      if (!response.ok) {
        throw new Error("Failed to fetch presets");
      }
      const data = await response.json();
      setPresets(data.presets || []);
    } catch (err: any) {
      console.error("Error fetching presets:", err);
      setError(err.message || "Failed to load presets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workflowId) {
      fetchPresets();
    }
  }, [workflowId]);

  const handleCreate = () => {
    setEditingPreset(null);
  };

  const handleEdit = (preset: WorkflowPreset) => {
    setEditingPreset(preset);
  };

  const handleDelete = async () => {
    if (!deletingPreset) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workflows/presets/${deletingPreset.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete preset");
      }

      toast.success("Preset deleted successfully");
      setDeletingPreset(null);
      fetchPresets();
    } catch (err: any) {
      console.error("Error deleting preset:", err);
      toast.error(err.message || "Failed to delete preset");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTest = (preset: WorkflowPreset) => {
    setTestingPreset(preset);
  };

  const handleFormSuccess = () => {
    setEditingPreset(null);
    fetchPresets();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading presets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive mb-2">Error loading presets</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Presets for this workflow</h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Preset
        </Button>
      </div>

      {presets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">No presets yet</p>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Preset
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <PresetItem
              key={preset.id}
              preset={preset}
              onEdit={() => handleEdit(preset)}
              onDelete={() => setDeletingPreset(preset)}
              onTest={() => handleTest(preset)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {editingPreset !== undefined && (
        <CreateEditPresetForm
          open={true}
          onOpenChange={(open) => !open && setEditingPreset(undefined)}
          workflowId={workflowId}
          preset={editingPreset || null}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Test Modal */}
      {testingPreset && (
        <PresetTestModal
          open={!!testingPreset}
          onOpenChange={(open) => !open && setTestingPreset(null)}
          preset={testingPreset}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPreset} onOpenChange={(open) => !open && setDeletingPreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

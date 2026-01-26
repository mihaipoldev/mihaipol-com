"use client";

import { useState, useEffect, useRef } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Workflow } from "../types";
import type { FormData } from "../types/form.types";
import {
  DynamicFormRenderer,
  type DynamicFormRendererRef,
} from "./DynamicFormRenderer";
import { formatCurrency } from "../utils";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";

type ConfigurationSidePanelProps = {
  workflow: Workflow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunWorkflow: (inputData: Record<string, any>) => Promise<void>;
  images?: AlbumImage[]; // Made optional - will be fetched if not provided
  tracks?: AlbumAudio[]; // Made optional - will be fetched if not provided
  entityType: string;
  entityId: string;
  defaultValues?: Record<string, any>;
};

export function ConfigurationSidePanel({
  workflow,
  open,
  onOpenChange,
  onRunWorkflow,
  images: initialImages = [],
  tracks: initialTracks = [],
  entityType,
  entityId,
  defaultValues,
}: ConfigurationSidePanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<DynamicFormRendererRef>(null);
  const [images, setImages] = useState<AlbumImage[]>(initialImages);
  const [tracks, setTracks] = useState<AlbumAudio[]>(initialTracks);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Sync state when props change (if images/tracks are provided)
  useEffect(() => {
    if (initialImages.length > 0) {
      setImages(initialImages);
    }
    if (initialTracks.length > 0) {
      setTracks(initialTracks);
    }
  }, [initialImages, initialTracks]);

  // Lazy load images/tracks when panel opens if not provided
  useEffect(() => {
    if (open && entityType === "albums" && (initialImages.length === 0 || initialTracks.length === 0)) {
      setIsLoadingContent(true);
      fetch(`/api/admin/albums/content?album_id=${entityId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch album content");
          return res.json();
        })
        .then((data) => {
          if (initialImages.length === 0 && data.images) {
            setImages(data.images);
          }
          if (initialTracks.length === 0 && data.audios) {
            setTracks(data.audios);
          }
        })
        .catch((error) => {
          console.error("Error fetching album content:", error);
        })
        .finally(() => {
          setIsLoadingContent(false);
        });
    }
  }, [open, entityType, entityId, initialImages.length, initialTracks.length]);

  // Reset form when modal opens/closes or workflow changes
  useEffect(() => {
    if (open && workflow) {
      // Force form re-render by changing key
      setFormKey((prev) => prev + 1);
    }
  }, [open, workflow]);

  if (!workflow) return null;

  // Parse input_schema - handle both array and object formats
  let inputSchema = workflow.input_schema;
  if (inputSchema && typeof inputSchema === "object" && !Array.isArray(inputSchema)) {
    // If it's an object with input_schema key, unwrap it
    if ("input_schema" in inputSchema && Array.isArray(inputSchema.input_schema)) {
      inputSchema = inputSchema.input_schema;
    }
  }

  // Build description with workflow description, cost, and time
  const descriptionParts: string[] = [];
  if (workflow.description) {
    descriptionParts.push(workflow.description);
  }
  if (workflow.estimated_cost !== null) {
    descriptionParts.push(`Cost: ${formatCurrency(workflow.estimated_cost)}`);
  }
  if (workflow.estimated_time_minutes !== null) {
    descriptionParts.push(`Time: ${workflow.estimated_time_minutes} min`);
  }
  const workflowDescription =
    descriptionParts.length > 0 ? descriptionParts.join(" • ") : undefined;

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onRunWorkflow(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error running workflow:", error);
      // Error is handled by useRunWorkflow hook (toast notification)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title={workflow.name}
      description={workflowDescription}
      titleIcon={
        workflow.icon ? <div className="text-2xl">{workflow.icon}</div> : undefined
      }
      maxWidth="2xl"
      maxHeight="90vh"
      showScroll={true}
      footer={
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => formRef.current?.submit()}
            disabled={isSubmitting || !Array.isArray(inputSchema) || inputSchema.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Run Workflow"
            )}
          </Button>
        </DialogFooter>
      }
    >
      {isLoadingContent ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading content...</p>
          </div>
        </div>
      ) : !Array.isArray(inputSchema) || inputSchema.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>This workflow has no configuration options.</p>
          <p className="text-sm mt-2">
            Click "Run Workflow" to execute it with default settings.
          </p>
        </div>
      ) : (
        <div key={formKey}>
          <DynamicFormRenderer
            ref={formRef}
            schema={inputSchema}
            entityType={entityType}
            entityId={entityId}
            images={images}
            tracks={tracks}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            defaultValues={defaultValues}
          />
        </div>
      )}
    </ModalShell>
  );
}

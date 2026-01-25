"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { EntityTypeWorkflowsManager, type EntityTypeWorkflowsManagerRef } from "./EntityTypeWorkflowsManager";
import type { EntityType } from "../types";
import type { Workflow } from "@/features/workflows/types";

const entityTypeSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  enabled: z.boolean(),
});

type EntityTypeFormData = z.infer<typeof entityTypeSchema>;

type EditEntityTypeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType | null; // null for creating new entity type
  onSuccess?: () => void;
};

export function EditEntityTypeModal({
  open,
  onOpenChange,
  entityType: initialEntityType,
  onSuccess,
}: EditEntityTypeModalProps) {
  const isNew = !initialEntityType;
  const [isLoading, setIsLoading] = useState(false);
  const [linkedWorkflows, setLinkedWorkflows] = useState<Workflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const workflowsManagerRef = useRef<EntityTypeWorkflowsManagerRef>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EntityTypeFormData>({
    resolver: zodResolver(entityTypeSchema),
    defaultValues: {
      enabled: true,
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Initialize form and fetch related data when modal opens
  useEffect(() => {
    if (open) {
      if (initialEntityType) {
        // Set form values from initial entity type
        reset({
          slug: initialEntityType.slug || "",
          name: initialEntityType.name || "",
          description: initialEntityType.description || "",
          icon: initialEntityType.icon || "",
          enabled: initialEntityType.enabled !== undefined ? initialEntityType.enabled : true,
        });
        fetchWorkflows();
      } else {
        // Reset to defaults for new entity type
        reset({
          slug: "",
          name: "",
          description: "",
          icon: "",
          enabled: true,
        });
      }
    }
  }, [open, initialEntityType, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setLinkedWorkflows([]);
    }
  }, [open, reset]);

  // Auto-generate slug from name
  useEffect(() => {
    if (open && nameValue && (isNew || !slugValue || slugValue === "")) {
      const autoSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (autoSlug !== slugValue) {
        setValue("slug", autoSlug, { shouldValidate: false });
      }
    }
  }, [nameValue, setValue, isNew, slugValue, open]);

  const fetchWorkflows = async () => {
    if (!initialEntityType) return;
    
    console.log("Fetching workflows for entity type:", initialEntityType.id);
    setIsLoadingWorkflows(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const url = `/api/admin/entity-types/${initialEntityType.id}/workflows`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      console.log("Fetch response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch workflows");
      }

      const workflows = await response.json();
      console.log("Fetched workflows:", workflows, "count:", workflows?.length);
      setLinkedWorkflows(workflows || []);
    } catch (error) {
      console.error("Error loading workflows:", error);
      setLinkedWorkflows([]);
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const onSubmit = async (data: EntityTypeFormData) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const payload = {
        slug: data.slug.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        enabled: data.enabled,
      };

      let result;
      if (isNew) {
        const response = await fetch("/api/admin/entity-types", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create entity type");
        }

        result = await response.json();
        toast.success("Entity type created successfully");
      } else {
        const response = await fetch("/api/admin/entity-types", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            id: initialEntityType.id,
            ...payload,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update entity type");
        }

        result = await response.json();
        toast.success("Entity type updated successfully");

        // Save workflow associations before closing
        if (!isNew) {
          console.log("Attempting to save workflow associations, ref available:", !!workflowsManagerRef.current);
          if (workflowsManagerRef.current) {
            try {
              await workflowsManagerRef.current.saveWorkflows();
              console.log("Workflow associations saved successfully");
            } catch (workflowError: any) {
              console.error("Error saving workflow associations:", workflowError);
              toast.error(workflowError.message || "Failed to save workflow associations");
              // Don't close modal if workflow save fails
              return;
            }
          } else {
            console.warn("WorkflowsManagerRef is not available, skipping workflow save");
          }
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} entity type:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} entity type`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialEntityType?.name || "Edit Entity Type"}
        maxWidth="4xl"
        maxHeight="90vh"
        showScroll={true}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={watch("name") || initialEntityType?.name || (isNew ? "Create New Entity Type" : "Edit Entity Type")}
      titleIcon={(watch("icon") || initialEntityType?.icon) || <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5 md:w-6 md:h-6" />}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="entity-type-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Entity Type" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <form id="entity-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <FormField label="Name" required error={errors.name?.message}>
            <ShadowInput
              {...register("name")}
              placeholder="e.g., Albums, Artists, Events"
            />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <ShadowInput
              {...register("slug")}
              placeholder="e.g., albums, artists, events"
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register("description")}
              placeholder="Describe this entity type..."
              rows={3}
              className="resize-none"
            />
          </FormField>

          <FormField label="Icon" error={errors.icon?.message}>
            <ShadowInput
              {...register("icon")}
              placeholder="e.g., 📊, 📁, 🏢"
            />
          </FormField>

          <FormField label="Status" error={errors.enabled?.message}>
            <Select
              value={watch("enabled") ? "enabled" : "disabled"}
              onValueChange={(value) => setValue("enabled", value === "enabled")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {/* Workflow Linking Section - Only in edit mode */}
        {!isNew && initialEntityType && (
          <Card className="p-6">
            <EntityTypeWorkflowsManager
              ref={workflowsManagerRef}
              entityTypeId={initialEntityType.id}
              initialWorkflows={linkedWorkflows}
              isLoading={isLoadingWorkflows}
            />
          </Card>
        )}

      </form>
    </ModalShell>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WorkflowPreset } from "../presets/types";
import {
  CONTENT_TYPE_OPTIONS,
  GROUP_BY_OPTIONS,
  STRATEGY_OPTIONS,
  QUALITY_OPTIONS,
  FORMAT_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  BACKGROUND_COLOR_OPTIONS,
  VIDEO_TYPE_OPTIONS,
} from "../presets/constants";
import { validatePreset } from "../presets/validation";

type CreateEditPresetFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  preset: WorkflowPreset | null; // null for creating new
  onSuccess?: () => void;
};

export function CreateEditPresetForm({
  open,
  onOpenChange,
  workflowId,
  preset,
  onSuccess,
}: CreateEditPresetFormProps) {
  const isNew = !preset;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Image selection
  const [contentType, setContentType] = useState<string>("");
  const [contentGroup, setContentGroup] = useState<string>("");
  const [noFilterType, setNoFilterType] = useState(true);
  const [noFilterGroup, setNoFilterGroup] = useState(true);

  // Track grouping
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"one_video_per_track" | "one_video_per_group" | "all_tracks_one_video">(
    "one_video_per_track"
  );

  // Video settings
  const [quality, setQuality] = useState<"720p" | "1080p" | "4k">("1080p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [format, setFormat] = useState<"mp4" | "mov" | "webm">("mp4");
  const [backgroundColor, setBackgroundColor] = useState<"blur" | "black" | "white">("blur");
  const [videoType, setVideoType] = useState<"short" | "long">("long");

  // Initialize form when preset changes
  useEffect(() => {
    if (open) {
      if (preset) {
        // Edit mode - populate from preset
        setName(preset.name);
        setDescription(preset.description || "");
        setIcon(preset.icon || "");
        setEnabled(preset.enabled);

        const filter = preset.matching_config.image_selection.filter;
        if (filter?.content_type) {
          setContentType(filter.content_type);
          setNoFilterType(false);
        } else {
          setContentType("");
          setNoFilterType(true);
        }

        if (filter?.content_group) {
          setContentGroup(filter.content_group);
          setNoFilterGroup(false);
        } else {
          setContentGroup("");
          setNoFilterGroup(true);
        }

        setGroupBy(preset.matching_config.track_grouping.group_by || "none");
        setStrategy(preset.matching_config.track_grouping.strategy);

        setQuality(preset.video_settings.quality);
        setAspectRatio(preset.video_settings.aspect_ratio);
        setFormat(preset.video_settings.format);
        setBackgroundColor(preset.video_settings.background_color);
        setVideoType(preset.video_settings.video_type);
      } else {
        // New preset - reset to defaults
        setName("");
        setDescription("");
        setIcon("");
        setEnabled(true);
        setContentType("");
        setContentGroup("");
        setNoFilterType(true);
        setNoFilterGroup(true);
        setGroupBy("none");
        setStrategy("one_video_per_track");
        setQuality("1080p");
        setAspectRatio("16:9");
        setFormat("mp4");
        setBackgroundColor("blur");
        setVideoType("long");
      }
      setErrors({});
    }
  }, [open, preset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      name,
      description: description || null,
      icon: icon || null,
      enabled,
      matching_config: {
        image_selection: {
          filter: {
            content_type: noFilterType ? null : contentType || null,
            content_group: noFilterGroup ? null : contentGroup || null,
          },
        },
        track_grouping: {
          group_by: groupBy === "none" ? null : groupBy,
          strategy,
        },
      },
      video_settings: {
        quality,
        aspect_ratio: aspectRatio,
        format,
        background_color: backgroundColor,
        video_type: videoType,
      },
      no_filter_type: noFilterType,
      no_filter_group: noFilterGroup,
    };

    // Validate
    const validationErrors = validatePreset(formData);
    if (validationErrors) {
      setErrors(validationErrors as Record<string, string | undefined>);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isNew
        ? `/api/workflows/${workflowId}/presets`
        : `/api/workflows/presets/${preset.id}`;
      const method = isNew ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isNew ? "create" : "update"} preset`);
      }

      toast.success(`Preset ${isNew ? "created" : "updated"} successfully`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Error saving preset:", err);
      toast.error(err.message || `Failed to ${isNew ? "create" : "update"} preset`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? "Create Preset" : "Edit Preset"}
      maxWidth="2xl"
      maxHeight="90vh"
      showScroll={true}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="preset-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Preset" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
    >
      <form id="preset-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <FormField label="Preset Name" required error={errors.name}>
            <ShadowInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., YouTube - Vinyl Circles"
              maxLength={100}
            />
          </FormField>

          <FormField label="Description" error={errors.description}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this preset does..."
              rows={3}
              className="resize-none"
              maxLength={500}
            />
          </FormField>

          <FormField label="Icon (emoji)" error={errors.icon}>
            <ShadowInput
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📹"
              maxLength={2}
            />
          </FormField>
        </div>

        {/* Image Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Image Selection</h3>

          <FormField label="Filter images by" error={errors.content_type}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="no-filter-type"
                  checked={noFilterType}
                  onCheckedChange={(checked) => setNoFilterType(checked === true)}
                />
                <Label htmlFor="no-filter-type" className="font-normal cursor-pointer">
                  No filter (use all images)
                </Label>
              </div>

              {!noFilterType && (
                <div>
                  <Label className="text-sm mb-2 block">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="no-filter-group"
                  checked={noFilterGroup}
                  onCheckedChange={(checked) => setNoFilterGroup(checked === true)}
                />
                <Label htmlFor="no-filter-group" className="font-normal cursor-pointer">
                  No filter
                </Label>
              </div>

              {!noFilterGroup && (
                <div>
                  <Label className="text-sm mb-2 block">Content Group</Label>
                  <ShadowInput
                    value={contentGroup}
                    onChange={(e) => setContentGroup(e.target.value)}
                    placeholder="e.g., side_a, side_b, main"
                  />
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Track Grouping */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Track Grouping</h3>

          <FormField label="Group tracks by field" error={errors.group_by}>
            <Select
              value={groupBy || "none"}
              onValueChange={(value) => setGroupBy(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_BY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Video creation strategy" required error={errors.strategy}>
            <RadioGroup value={strategy} onValueChange={(value: any) => setStrategy(value)}>
              {STRATEGY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </FormField>
        </div>

        {/* Video Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Video Settings</h3>

          <FormField label="Quality" required error={errors.quality}>
            <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Aspect Ratio" required error={errors.aspect_ratio}>
            <RadioGroup value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
              <div className="flex gap-4">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`aspect-${option.value}`} />
                    <Label htmlFor={`aspect-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>

          <FormField label="Output Format" required error={errors.format}>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Background Color" required error={errors.background_color}>
            <RadioGroup
              value={backgroundColor}
              onValueChange={(value: any) => setBackgroundColor(value)}
            >
              <div className="flex gap-4">
                {BACKGROUND_COLOR_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`bg-${option.value}`} />
                    <Label htmlFor={`bg-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>

          <FormField label="Video Type" required error={errors.video_type}>
            <RadioGroup value={videoType} onValueChange={(value: any) => setVideoType(value)}>
              <div className="flex gap-4">
                {VIDEO_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`type-${option.value}`} />
                    <Label htmlFor={`type-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>

          <FormField label="Status">
            <Select
              value={enabled ? "enabled" : "disabled"}
              onValueChange={(value) => setEnabled(value === "enabled")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </form>
    </ModalShell>
  );
}

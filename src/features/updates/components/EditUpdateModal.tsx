"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { Loader2, X, Plus } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const embedSchema = z.object({
  type: z.enum(["youtube", "spotify", "bandcamp", "soundcloud", "instagram"]),
  url: z.string().url().optional(),
  embed_code: z.string().optional(),
});

const externalLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const updateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  date: z.string().optional(),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]),
  read_more_url: z.string().url().optional().or(z.literal("")),
  embeds: z.array(embedSchema).optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  show_cover_image: z.boolean().optional(),
  og_image_url: z.string().url().optional().or(z.literal("")),
  meta_description: z.string().optional(),
  external_links: z.array(externalLinkSchema).optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

type Update = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  date: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
  read_more_url: string | null;
  embeds?: Array<{
    type: "youtube" | "spotify" | "bandcamp" | "soundcloud" | "instagram";
    url?: string;
    embed_code?: string;
  }> | null;
  tags?: string[] | null;
  is_featured?: boolean | null;
  show_cover_image?: boolean | null;
  og_image_url?: string | null;
  meta_description?: string | null;
  external_links?: Array<{
    label: string;
    url: string;
  }> | null;
};

type EditUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  update: Update | null; // null for creating new update
  onSuccess?: () => void;
};

export function EditUpdateModal({
  open,
  onOpenChange,
  update: initialUpdate,
  onSuccess,
}: EditUpdateModalProps) {
  const isNew = !initialUpdate;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    setError,
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      image_url: "",
      date: "",
      publish_status: "draft",
      read_more_url: "",
      embeds: [],
      tags: [],
      is_featured: false,
      show_cover_image: true,
      og_image_url: "",
      meta_description: "",
      external_links: [],
    },
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (initialUpdate) {
        const normalizeStatus = (v: unknown) => {
          const s = (v as any)?.toString?.().trim?.().toLowerCase?.();
          return s === "scheduled" || s === "published" || s === "archived" ? s : "draft";
        };
        const formData: Partial<UpdateFormData> = {
          title: initialUpdate.title || "",
          slug: initialUpdate.slug || "",
          subtitle: initialUpdate.subtitle || "",
          description: initialUpdate.description || "",
          image_url: initialUpdate.image_url || "",
          read_more_url: initialUpdate.read_more_url || "",
          publish_status: normalizeStatus(initialUpdate.publish_status),
          embeds: Array.isArray(initialUpdate.embeds) ? initialUpdate.embeds : [],
          tags: Array.isArray(initialUpdate.tags) ? initialUpdate.tags : [],
          is_featured: Boolean(initialUpdate.is_featured),
          show_cover_image: initialUpdate.show_cover_image !== false, // Default to true if null/undefined
          og_image_url: initialUpdate.og_image_url || "",
          meta_description: initialUpdate.meta_description || "",
          external_links: Array.isArray(initialUpdate.external_links) ? initialUpdate.external_links : [],
        };

        if (initialUpdate.date) {
          const date = new Date(initialUpdate.date);
          const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          formData.date = localDateTime;
        }

        reset(formData, { keepDefaultValues: false });
        setValue("publish_status", formData.publish_status as any, {
          shouldValidate: true,
          shouldDirty: false,
        });
      } else {
        reset({
          title: "",
          slug: "",
          subtitle: "",
          description: "",
          image_url: "",
          date: "",
          publish_status: "draft",
          read_more_url: "",
          embeds: [],
          tags: [],
          is_featured: false,
          show_cover_image: true,
          og_image_url: "",
          meta_description: "",
          external_links: [],
        });
      }
    }
  }, [open, initialUpdate, reset, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
    }
  }, [open, reset]);

  // Auto-generate slug from title
  const titleValue = watch("title");
  const slugValue = watch("slug");
  useEffect(() => {
    if (open && titleValue) {
      const autoSlug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const initialAutoSlug = initialUpdate?.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (isNew || !slugValue || slugValue === initialAutoSlug) {
        if (autoSlug !== slugValue) {
          setValue("slug", autoSlug, { shouldValidate: false });
        }
      }
    }
  }, [titleValue, slugValue, isNew, initialUpdate?.title, setValue, open]);

  const validateImageUrl = async (url: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/admin/upload/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await response.json();
      return { valid: data.valid || false, error: data.error };
    } catch (error: any) {
      return { valid: false, error: error.message || "Failed to validate image" };
    }
  };

  const onSubmit = async (data: UpdateFormData) => {
    console.log("[UPDATE IMAGE DEBUG] onSubmit called", {
      selectedFile: selectedFile?.name || "null",
      image_url: data.image_url,
    });
    try {
      const newImageUrl = data.image_url?.trim() || null;
      const oldImageUrl = initialUpdate?.image_url || null;

      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      console.log("[UPDATE IMAGE DEBUG]", {
        newImageUrl,
        oldImageUrl,
        normalizedNewUrl,
        normalizedOldUrl,
        imageUrlChanged,
        hasSelectedFile: !!selectedFile,
        selectedFileName: selectedFile?.name,
      });

      // Default to existing image URL (will be updated if changed)
      let finalImageUrl = normalizedOldUrl;

      // Check if we need to upload: file selected OR URL changed
      // IMPORTANT: Check selectedFile first, because when a file is selected,
      // the URL gets cleared (becomes null), so imageUrlChanged might be false
      // even though we need to upload
      const needsUpload = selectedFile || (imageUrlChanged && normalizedNewUrl);
      
      console.log("[UPDATE IMAGE DEBUG] needsUpload:", needsUpload, {
        hasSelectedFile: !!selectedFile,
        imageUrlChanged,
        hasNormalizedNewUrl: !!normalizedNewUrl,
      });

      if (needsUpload) {
        console.log("[UPDATE IMAGE DEBUG] Entering upload flow");
        if (selectedFile) {
          console.log("[UPDATE IMAGE DEBUG] Uploading file:", selectedFile.name);
          try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("folderPath", isNew ? "updates/temp" : `updates/${initialUpdate.id}`);
            const uploadResponse = await fetch("/api/admin/upload", {
              method: "POST",
              body: formData,
            });
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              throw new Error(error.error || "Failed to upload image");
            }
            const uploadData = await uploadResponse.json();
            console.log("[UPDATE IMAGE DEBUG] File upload success:", uploadData);
            finalImageUrl = uploadData.url;
          } catch (uploadError: any) {
            console.error("[UPDATE IMAGE DEBUG] Error uploading image:", uploadError);
            toast.error(uploadError.message || "Failed to upload image");
            return;
          }
        } else if (normalizedNewUrl && !normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          console.log("[UPDATE IMAGE DEBUG] Uploading from external URL:", normalizedNewUrl);
          const validation = await validateImageUrl(normalizedNewUrl);
          console.log("[UPDATE IMAGE DEBUG] URL validation result:", validation);
          if (!validation.valid) {
            console.log("[UPDATE IMAGE DEBUG] URL validation failed");
            toast.error(
              validation.error ||
                "Image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
          try {
            const formData = new FormData();
            formData.append("imageUrl", normalizedNewUrl);
            formData.append("folderPath", isNew ? "updates/temp" : `updates/${initialUpdate.id}`);
            console.log("[UPDATE IMAGE DEBUG] Sending upload request for URL:", {
              imageUrl: normalizedNewUrl,
              folderPath: isNew ? "updates/temp" : `updates/${initialUpdate.id}`,
            });
            const uploadResponse = await fetch("/api/admin/upload", {
              method: "POST",
              body: formData,
            });
            console.log("[UPDATE IMAGE DEBUG] Upload response status:", uploadResponse.status);
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              console.error("[UPDATE IMAGE DEBUG] Upload failed:", error);
              throw new Error(error.error || "Failed to upload image from URL");
            }
            const uploadData = await uploadResponse.json();
            console.log("[UPDATE IMAGE DEBUG] URL upload success:", uploadData);
            finalImageUrl = uploadData.url;
          } catch (uploadError: any) {
            console.error("[UPDATE IMAGE DEBUG] Error uploading image from URL:", uploadError);
            toast.error(uploadError.message || "Failed to upload image from URL");
            return;
          }
        } else if (normalizedNewUrl && normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          console.log("[UPDATE IMAGE DEBUG] URL already on CDN, validating:", normalizedNewUrl);
          const validation = await validateImageUrl(normalizedNewUrl);
          console.log("[UPDATE IMAGE DEBUG] CDN URL validation result:", validation);
          if (!validation.valid) {
            console.log("[UPDATE IMAGE DEBUG] CDN URL validation failed");
            toast.error(
              validation.error ||
                "Image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
          // URL is already on CDN and valid, use it directly
          console.log("[UPDATE IMAGE DEBUG] Using existing CDN URL");
          finalImageUrl = normalizedNewUrl;
        }

        if (!isNew && normalizedOldUrl && normalizedOldUrl.includes("mihaipol-com.b-cdn.net")) {
          try {
            await fetch("/api/admin/upload/trash", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: normalizedOldUrl }),
            });
          } catch (trashError) {
            console.error("Failed to move old image to trash:", trashError);
          }
        }
      } else if (imageUrlChanged && !normalizedNewUrl) {
        // User explicitly cleared the image field
        console.log("[UPDATE IMAGE DEBUG] Image field cleared by user");
        finalImageUrl = null;
      } else {
        console.log("[UPDATE IMAGE DEBUG] Image URL unchanged, keeping existing:", normalizedOldUrl);
      }
      
      console.log("[UPDATE IMAGE DEBUG] Final image URL:", finalImageUrl);

      // Filter out invalid embeds (must have url or embed_code, and not empty strings)
      const validEmbeds = (data.embeds || [])
        .filter((embed) => {
          if (embed.type === "spotify") {
            return (embed.embed_code && embed.embed_code.trim()) || (embed.url && embed.url.trim());
          }
          return embed.url && embed.url.trim();
        })
        .map((embed) => ({
          type: embed.type,
          ...(embed.url && embed.url.trim() ? { url: embed.url.trim() } : {}),
          ...(embed.embed_code && embed.embed_code.trim() ? { embed_code: embed.embed_code.trim() } : {}),
        }));

      // Filter out invalid external links (must have both label and url, and not empty strings)
      const validExternalLinks = (data.external_links || []).filter(
        (link) => link.label && link.label.trim() && link.url && link.url.trim()
      ).map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      }));

      const submitData = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : null,
        image_url: finalImageUrl,
        read_more_url: data.read_more_url || null,
        subtitle: data.subtitle || null,
        description: data.description || null,
        embeds: validEmbeds.length > 0 ? validEmbeds : undefined,
        tags: (data.tags || []).length > 0 ? data.tags : undefined,
        is_featured: data.is_featured || false,
        show_cover_image: data.show_cover_image !== false, // Default to true if undefined
        og_image_url: data.og_image_url || null,
        meta_description: data.meta_description || null,
        external_links: validExternalLinks.length > 0 ? validExternalLinks : undefined,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      let result;
      if (isNew) {
        const response = await fetch("/api/admin/updates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(submitData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to create update";
          if (errorData.details) {
            const details = errorData.details;
            if (details.fieldErrors) {
              Object.entries(details.fieldErrors).forEach(([field, errors]: [string, any]) => {
                const errorMessages = Array.isArray(errors) ? errors : [errors];
                setError(field as keyof UpdateFormData, {
                  type: "server",
                  message: errorMessages[0],
                });
              });
              toast.error(errorMessage);
              return;
            }
          }
          throw new Error(errorMessage);
        }
        result = await response.json();
        if (finalImageUrl && finalImageUrl.includes("/updates/temp/") && result?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `updates/${result.id}`,
              }),
            });
            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              await fetch("/api/admin/updates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: result.id, image_url: moveData.url }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }
        toast.success("Update created successfully");
      } else {
        const response = await fetch("/api/admin/updates", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id: initialUpdate.id, ...submitData }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to update update";
          if (errorData.details) {
            const details = errorData.details;
            if (details.fieldErrors) {
              Object.entries(details.fieldErrors).forEach(([field, errors]: [string, any]) => {
                const errorMessages = Array.isArray(errors) ? errors : [errors];
                setError(field as keyof UpdateFormData, {
                  type: "server",
                  message: errorMessages[0],
                });
              });
              toast.error(errorMessage);
              return;
            }
          }
          throw new Error(errorMessage);
        }
        result = await response.json();
        toast.success("Update updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} update:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} update`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialUpdate?.title || "Edit Update"}
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
      title={watch("title") || initialUpdate?.title || (isNew ? "Create New Update" : "Edit Update")}
      titleIcon={(watch("image_url") || initialUpdate?.image_url) || <FontAwesomeIcon icon={faNewspaper} className="w-5 h-5 md:w-6 md:h-6" />}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="update-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Update" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <form id="update-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Title" required error={errors.title?.message}>
            <ShadowInput {...register("title")} placeholder="Update title" />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <ShadowInput {...register("slug")} placeholder="update-slug" />
          </FormField>
        </div>

        <FormField label="Subtitle" error={errors.subtitle?.message}>
          <ShadowInput {...register("subtitle")} placeholder="Update subtitle" />
        </FormField>

        {/* Tags Section */}
        <FormField label="Tags" error={errors.tags?.message}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(watch("tags") || []).map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const currentTags = watch("tags") || [];
                      setValue("tags", currentTags.filter((_, i) => i !== index));
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <ShadowInput
              placeholder="Type a tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value) {
                    const currentTags = watch("tags") || [];
                    if (!currentTags.includes(value)) {
                      setValue("tags", [...currentTags, value]);
                    }
                    input.value = "";
                  }
                }
              }}
            />
          </div>
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register("description")} placeholder="Update description" rows={6} />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Date" error={errors.date?.message}>
            <ShadowInput type="datetime-local" {...register("date")} />
          </FormField>

          <FormField label="Read More URL" error={errors.read_more_url?.message}>
            <ShadowInput
              type="url"
              {...register("read_more_url")}
              placeholder="https://example.com/read-more"
            />
          </FormField>
        </div>

        <FormField label="Image" error={errors.image_url?.message}>
          <ImageUploadField
            value={watch("image_url") || null}
            onChange={(url) => setValue("image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={isNew ? "updates/temp" : `updates/${initialUpdate.id}`}
            error={errors.image_url?.message}
            placeholder="https://example.com/image.jpg"
          />
        </FormField>

        <FormField label="Publish Status" required error={errors.publish_status?.message}>
          <Select
            value={watch("publish_status") || "draft"}
            onValueChange={(value) =>
              setValue("publish_status", value as "draft" | "scheduled" | "published" | "archived")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select publish status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Is Featured Toggle */}
        <FormField label="Featured Update" error={errors.is_featured?.message}>
          <div className="flex items-center gap-2">
            <Switch
              checked={watch("is_featured") || false}
              onCheckedChange={(checked) => setValue("is_featured", checked)}
            />
            <span className="text-sm text-muted-foreground">
              Highlight this update as featured
            </span>
          </div>
        </FormField>

        {/* Show Cover Image Toggle */}
        <FormField label="Show Cover Image" error={errors.show_cover_image?.message}>
          <div className="flex items-center gap-2">
            <Switch
              checked={watch("show_cover_image") !== false}
              onCheckedChange={(checked) => setValue("show_cover_image", checked)}
            />
            <span className="text-sm text-muted-foreground">
              Display the cover image on the detail page. Turn off when an embed (like YouTube) serves the same visual purpose.
            </span>
          </div>
        </FormField>

        {/* Embeds Section */}
        <FormField label="Embeds" error={errors.embeds?.message}>
          <div className="space-y-3">
            {(watch("embeds") || []).map((embed, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Embed {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentEmbeds = watch("embeds") || [];
                      setValue("embeds", currentEmbeds.filter((_, i) => i !== index));
                    }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Select
                  value={embed.type}
                  onValueChange={(value) => {
                    const currentEmbeds = watch("embeds") || [];
                    const updated = [...currentEmbeds];
                    updated[index] = { ...updated[index], type: value as any };
                    setValue("embeds", updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="spotify">Spotify</SelectItem>
                    <SelectItem value="bandcamp">Bandcamp</SelectItem>
                    <SelectItem value="soundcloud">SoundCloud</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
                {embed.type === "spotify" ? (
                  <Textarea
                    placeholder="Paste Spotify embed code here"
                    value={embed.embed_code || ""}
                    onChange={(e) => {
                      const currentEmbeds = watch("embeds") || [];
                      const updated = [...currentEmbeds];
                      updated[index] = { ...updated[index], embed_code: e.target.value };
                      setValue("embeds", updated);
                    }}
                    rows={4}
                  />
                ) : (
                  <ShadowInput
                    type="url"
                    placeholder={`Enter ${embed.type} URL`}
                    value={embed.url || ""}
                    onChange={(e) => {
                      const currentEmbeds = watch("embeds") || [];
                      const updated = [...currentEmbeds];
                      updated[index] = { ...updated[index], url: e.target.value };
                      setValue("embeds", updated);
                    }}
                  />
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentEmbeds = watch("embeds") || [];
                setValue("embeds", [
                  ...currentEmbeds,
                  { type: "youtube", url: "" },
                ]);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Embed
            </Button>
          </div>
        </FormField>

        {/* External Links Section */}
        <FormField label="External Links" error={errors.external_links?.message}>
          <div className="space-y-3">
            {(watch("external_links") || []).map((link, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Link {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentLinks = watch("external_links") || [];
                      setValue("external_links", currentLinks.filter((_, i) => i !== index));
                    }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ShadowInput
                  placeholder="Link label (e.g., Listen on Spotify)"
                  value={link.label}
                  onChange={(e) => {
                    const currentLinks = watch("external_links") || [];
                    const updated = [...currentLinks];
                    updated[index] = { ...updated[index], label: e.target.value };
                    setValue("external_links", updated);
                  }}
                />
                <ShadowInput
                  type="url"
                  placeholder="https://example.com"
                  value={link.url}
                  onChange={(e) => {
                    const currentLinks = watch("external_links") || [];
                    const updated = [...currentLinks];
                    updated[index] = { ...updated[index], url: e.target.value };
                    setValue("external_links", updated);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentLinks = watch("external_links") || [];
                setValue("external_links", [
                  ...currentLinks,
                  { label: "", url: "" },
                ]);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add External Link
            </Button>
          </div>
        </FormField>

        {/* SEO Section */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="seo">
            <AccordionTrigger>SEO Settings</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField label="OG Image URL" error={errors.og_image_url?.message}>
                <ShadowInput
                  {...register("og_image_url")}
                  placeholder="https://example.com/og-image.jpg"
                />
              </FormField>
              <FormField label="Meta Description" error={errors.meta_description?.message}>
                <Textarea
                  {...register("meta_description")}
                  placeholder="SEO meta description for search engines and social previews"
                  rows={3}
                />
              </FormField>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </form>
    </ModalShell>
  );
}

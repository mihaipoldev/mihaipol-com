"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { ShadowButton } from "@/components/admin/ShadowButton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const platformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  base_url: z.string().url().optional().or(z.literal("")),
  icon_url: z.string().url().optional().or(z.literal("")),
  icon_horizontal_url: z.string().url().optional().or(z.literal("")),
  default_cta_label: z.string().optional().or(z.literal("")),
});

type PlatformFormData = z.infer<typeof platformSchema>;

type CreatePlatformModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (platform: {
    id: string;
    name: string;
    icon_url: string | null;
    icon_horizontal_url: string | null;
    default_cta_label: string | null;
  }) => void;
};

export function CreatePlatformModal({ open, onOpenChange, onSuccess }: CreatePlatformModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHorizontalFile, setSelectedHorizontalFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<PlatformFormData>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: "",
      slug: "",
      base_url: "",
      icon_url: "",
      icon_horizontal_url: "",
      default_cta_label: "",
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
      setSelectedHorizontalFile(null);
    }
  }, [open, reset]);

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

  const nameValue = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue && open) {
      const autoSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const currentSlug = watch("slug");
      if (!currentSlug || currentSlug === autoSlug) {
        setValue("slug", autoSlug, { shouldValidate: false });
      }
    }
  }, [nameValue, watch, setValue, open]);

  const onSubmit = async (data: PlatformFormData) => {
    try {
      const newImageUrl = data.icon_url?.trim() || null;
      const newHorizontalImageUrl = data.icon_horizontal_url?.trim() || null;
      let finalImageUrl = newImageUrl;
      let finalHorizontalImageUrl = newHorizontalImageUrl;

      // If there's a selected file, upload it to Bunny
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("folderPath", "platforms/temp");
          const uploadResponse = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || "Failed to upload image");
          }
          const uploadData = await uploadResponse.json();
          finalImageUrl = uploadData.url;
        } catch (uploadError: any) {
          console.error("Error uploading image:", uploadError);
          toast.error(uploadError.message || "Failed to upload image");
          return;
        }
      } else if (newImageUrl && !newImageUrl.includes("mihaipol-com.b-cdn.net")) {
        // If URL is provided and it's not from our CDN, validate and upload it to Bunny
        const validation = await validateImageUrl(newImageUrl);
        if (!validation.valid) {
          toast.error(
            validation.error ||
              "Image not supported or not accessible. Please check the URL or upload a file."
          );
          return;
        }
        try {
          const formData = new FormData();
          formData.append("imageUrl", newImageUrl);
          formData.append("folderPath", "platforms/temp");
          const uploadResponse = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || "Failed to upload image from URL");
          }
          const uploadData = await uploadResponse.json();
          finalImageUrl = uploadData.url;
        } catch (uploadError: any) {
          console.error("Error uploading image from URL:", uploadError);
          toast.error(uploadError.message || "Failed to upload image from URL");
          return;
        }
      }

      // Handle horizontal icon upload
      if (selectedHorizontalFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedHorizontalFile);
          formData.append("folderPath", "platforms/temp");
          const uploadResponse = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || "Failed to upload horizontal image");
          }
          const uploadData = await uploadResponse.json();
          finalHorizontalImageUrl = uploadData.url;
        } catch (uploadError: any) {
          console.error("Error uploading horizontal image:", uploadError);
          toast.error(uploadError.message || "Failed to upload horizontal image");
          return;
        }
      } else if (newHorizontalImageUrl && !newHorizontalImageUrl.includes("mihaipol-com.b-cdn.net")) {
        const validation = await validateImageUrl(newHorizontalImageUrl);
        if (!validation.valid) {
          toast.error(
            validation.error ||
              "Horizontal image not supported or not accessible. Please check the URL or upload a file."
          );
          return;
        }
        try {
          const formData = new FormData();
          formData.append("imageUrl", newHorizontalImageUrl);
          formData.append("folderPath", "platforms/temp");
          const uploadResponse = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || "Failed to upload horizontal image from URL");
          }
          const uploadData = await uploadResponse.json();
          finalHorizontalImageUrl = uploadData.url;
        } catch (uploadError: any) {
          console.error("Error uploading horizontal image from URL:", uploadError);
          toast.error(uploadError.message || "Failed to upload horizontal image from URL");
          return;
        }
      }

      const submitData = {
        name: data.name,
        slug: data.slug,
        base_url: data.base_url && data.base_url.trim() ? data.base_url.trim() : null,
        icon_url: finalImageUrl || null,
        icon_horizontal_url: finalHorizontalImageUrl || null,
        default_cta_label:
          data.default_cta_label && data.default_cta_label.trim()
            ? data.default_cta_label.trim()
            : null,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to create platform";
        if (errorData.details) {
          const details = errorData.details;
          if (details.fieldErrors) {
            const fieldErrors = Object.entries(details.fieldErrors)
              .map(
                ([field, errors]: [string, any]) =>
                  `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
              )
              .join("\n");
            throw new Error(`${errorMessage}\n${fieldErrors}`);
          }
        }
        throw new Error(errorMessage);
      }

      const created = await response.json();

      let updatedIconUrl = finalImageUrl;
      let updatedHorizontalIconUrl = finalHorizontalImageUrl;

      // Move from temp to permanent if needed
      if (finalImageUrl && finalImageUrl.includes("/platforms/temp/") && created?.id) {
        try {
          const moveResponse = await fetch("/api/admin/upload/move", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              imageUrl: finalImageUrl,
              newFolderPath: `platforms/${created.id}`,
            }),
          });
          if (moveResponse.ok) {
            const moveData = await moveResponse.json();
            updatedIconUrl = moveData.url;
          }
        } catch (moveError) {
          console.error("Failed to move image from temp folder:", moveError);
        }
      }

      // Move horizontal icon from temp to permanent if needed
      if (finalHorizontalImageUrl && finalHorizontalImageUrl.includes("/platforms/temp/") && created?.id) {
        try {
          const moveResponse = await fetch("/api/admin/upload/move", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              imageUrl: finalHorizontalImageUrl,
              newFolderPath: `platforms/${created.id}`,
            }),
          });
          if (moveResponse.ok) {
            const moveData = await moveResponse.json();
            updatedHorizontalIconUrl = moveData.url;
          }
        } catch (moveError) {
          console.error("Failed to move horizontal image from temp folder:", moveError);
        }
      }

      // Update both icons if any were moved
      if ((updatedIconUrl !== finalImageUrl || updatedHorizontalIconUrl !== finalHorizontalImageUrl) && created?.id) {
        try {
          await fetch("/api/admin/platforms", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ 
              id: created.id, 
              icon_url: updatedIconUrl,
              icon_horizontal_url: updatedHorizontalIconUrl,
            }),
          });
          finalImageUrl = updatedIconUrl;
          finalHorizontalImageUrl = updatedHorizontalIconUrl;
        } catch (updateError) {
          console.error("Failed to update moved image URLs:", updateError);
        }
      }

      toast.success("Platform created successfully");
      onSuccess({
        id: created.id,
        name: created.name,
        icon_url: finalImageUrl,
        icon_horizontal_url: finalHorizontalImageUrl,
        default_cta_label: created.default_cta_label || null,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating platform:", error);
      const errorMessage = error?.message || "Failed to create platform";
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Platform</DialogTitle>
          <DialogDescription>
            Add a new music streaming platform or distribution channel. It will be available
            immediately for selection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Name" required error={errors.name?.message}>
              <ShadowInput {...register("name")} placeholder="Platform name" />
            </FormField>

            <FormField label="Slug" required error={errors.slug?.message}>
              <ShadowInput
                {...register("slug")}
                placeholder="platform-slug"
                className="font-mono text-sm"
              />
            </FormField>
          </div>

          <FormField label="Base URL" error={errors.base_url?.message}>
            <ShadowInput type="url" {...register("base_url")} placeholder="https://example.com" />
          </FormField>

          <FormField label="Icon Image" error={errors.icon_url?.message}>
            <ImageUploadField
              value={watch("icon_url") || null}
              onChange={(url) => setValue("icon_url", url || "")}
              onFileChange={(file) => setSelectedFile(file)}
              folderPath="platforms/temp"
              error={errors.icon_url?.message}
              placeholder="https://example.com/icon.png"
            />
          </FormField>

          <FormField label="Icon Horizontal Image" error={errors.icon_horizontal_url?.message}>
            <ImageUploadField
              value={watch("icon_horizontal_url") || null}
              onChange={(url) => setValue("icon_horizontal_url", url || "")}
              onFileChange={(file) => setSelectedHorizontalFile(file)}
              folderPath="platforms/temp"
              error={errors.icon_horizontal_url?.message}
              placeholder="https://example.com/icon-horizontal.png"
            />
          </FormField>

          <FormField label="Default CTA Label" error={errors.default_cta_label?.message}>
            <ShadowInput
              {...register("default_cta_label")}
              placeholder="e.g., Listen, Stream, Buy, Download"
            />
          </FormField>

          <div className="flex gap-4 justify-end pt-4">
            <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </ShadowButton>
            <ShadowButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Platform"}
            </ShadowButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

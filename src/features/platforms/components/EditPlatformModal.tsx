"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRadio } from "@fortawesome/free-solid-svg-icons";
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

type Platform = {
  id: string;
  name: string;
  slug: string;
  base_url: string | null;
  icon_url: string | null;
  icon_horizontal_url: string | null;
  default_cta_label: string | null;
};

type EditPlatformModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: Platform | null; // null for creating new platform
  onSuccess?: () => void;
};

export function EditPlatformModal({
  open,
  onOpenChange,
  platform: initialPlatform,
  onSuccess,
}: EditPlatformModalProps) {
  const isNew = !initialPlatform;
  const [isLoading, setIsLoading] = useState(false);
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
      slug: "",
      default_cta_label: "",
    },
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (initialPlatform) {
        reset({
          name: initialPlatform.name || "",
          slug: initialPlatform.slug || "",
          base_url: initialPlatform.base_url || "",
          icon_url: initialPlatform.icon_url || "",
          icon_horizontal_url: initialPlatform.icon_horizontal_url || "",
          default_cta_label: initialPlatform.default_cta_label || "",
        });
      } else {
        reset({
          name: "",
          slug: "",
          base_url: "",
          icon_url: "",
          icon_horizontal_url: "",
          default_cta_label: "",
        });
      }
    }
  }, [open, initialPlatform, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
      setSelectedHorizontalFile(null);
    }
  }, [open, reset]);

  // Auto-generate slug from name
  const nameValue = watch("name");
  const slugValue = watch("slug");
  useEffect(() => {
    if (open && nameValue) {
      const autoSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const initialAutoSlug = initialPlatform?.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (isNew || !slugValue || slugValue === initialAutoSlug) {
        if (autoSlug !== slugValue) {
          setValue("slug", autoSlug, { shouldValidate: false });
        }
      }
    }
  }, [initialPlatform?.name, isNew, nameValue, setValue, slugValue, open]);

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

  const onSubmit = async (data: PlatformFormData) => {
    try {
      const newImageUrl = data.icon_url?.trim() || null;
      const oldImageUrl = initialPlatform?.icon_url || null;
      const newHorizontalImageUrl = data.icon_horizontal_url?.trim() || null;
      const oldHorizontalImageUrl = initialPlatform?.icon_horizontal_url || null;

      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      const normalizedNewHorizontalUrl = newHorizontalImageUrl || null;
      const normalizedOldHorizontalUrl = oldHorizontalImageUrl || null;
      const horizontalImageUrlChanged = normalizedNewHorizontalUrl !== normalizedOldHorizontalUrl;

      let finalImageUrl = normalizedNewUrl;
      let finalHorizontalImageUrl = normalizedNewHorizontalUrl;

      // Handle icon upload
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("folderPath", isNew ? "platforms/temp" : `platforms/${initialPlatform.id}`);
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
      } else if (imageUrlChanged) {
        if (normalizedNewUrl && !normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl);
          if (!validation.valid) {
            toast.error(
              validation.error ||
                "Image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
          try {
            const formData = new FormData();
            formData.append("imageUrl", normalizedNewUrl);
            formData.append("folderPath", isNew ? "platforms/temp" : `platforms/${initialPlatform.id}`);
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
        } else if (normalizedNewUrl && normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl);
          if (!validation.valid) {
            toast.error(
              validation.error ||
                "Image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
        }
      }

      // Handle horizontal icon upload
      if (selectedHorizontalFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedHorizontalFile);
          formData.append("folderPath", isNew ? "platforms/temp" : `platforms/${initialPlatform.id}`);
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
      } else if (horizontalImageUrlChanged) {
        if (
          normalizedNewHorizontalUrl &&
          !normalizedNewHorizontalUrl.includes("mihaipol-com.b-cdn.net")
        ) {
          const validation = await validateImageUrl(normalizedNewHorizontalUrl);
          if (!validation.valid) {
            toast.error(
              validation.error ||
                "Horizontal image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
          try {
            const formData = new FormData();
            formData.append("imageUrl", normalizedNewHorizontalUrl);
            formData.append("folderPath", isNew ? "platforms/temp" : `platforms/${initialPlatform.id}`);
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
        } else if (
          normalizedNewHorizontalUrl &&
          normalizedNewHorizontalUrl.includes("mihaipol-com.b-cdn.net")
        ) {
          const validation = await validateImageUrl(normalizedNewHorizontalUrl);
          if (!validation.valid) {
            toast.error(
              validation.error ||
                "Horizontal image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
        }
      }

      // Move old images to trash if needed
      if (
        !isNew &&
        normalizedOldUrl &&
        normalizedOldUrl.includes("mihaipol-com.b-cdn.net") &&
        finalImageUrl !== normalizedOldUrl
      ) {
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

      if (
        !isNew &&
        normalizedOldHorizontalUrl &&
        normalizedOldHorizontalUrl.includes("mihaipol-com.b-cdn.net") &&
        finalHorizontalImageUrl !== normalizedOldHorizontalUrl
      ) {
        try {
          await fetch("/api/admin/upload/trash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: normalizedOldHorizontalUrl }),
          });
        } catch (trashError) {
          console.error("Failed to move old horizontal image to trash:", trashError);
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

      let result;
      if (isNew) {
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
          throw new Error(errorMessage);
        }
        result = await response.json();
        let updatedIconUrl = finalImageUrl;
        let updatedHorizontalIconUrl = finalHorizontalImageUrl;

        if (finalImageUrl && finalImageUrl.includes("/platforms/temp/") && result?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `platforms/${result.id}`,
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

        if (
          finalHorizontalImageUrl &&
          finalHorizontalImageUrl.includes("/platforms/temp/") &&
          result?.id
        ) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalHorizontalImageUrl,
                newFolderPath: `platforms/${result.id}`,
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
        if (
          (updatedIconUrl !== finalImageUrl || updatedHorizontalIconUrl !== finalHorizontalImageUrl) &&
          result?.id
        ) {
          try {
            await fetch("/api/admin/platforms", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
              body: JSON.stringify({
                id: result.id,
                icon_url: updatedIconUrl,
                icon_horizontal_url: updatedHorizontalIconUrl,
              }),
            });
          } catch (updateError) {
            console.error("Failed to update moved image URLs:", updateError);
          }
        }
        toast.success("Platform created successfully");
      } else {
        const response = await fetch("/api/admin/platforms", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id: initialPlatform.id, ...submitData }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to update platform";
          throw new Error(errorMessage);
        }
        result = await response.json();
        toast.success("Platform updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} platform:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} platform`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialPlatform?.name || "Edit Platform"}
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
      title={watch("name") || initialPlatform?.name || (isNew ? "Create New Platform" : "Edit Platform")}
      titleIcon={(watch("icon_url") || initialPlatform?.icon_url) || <FontAwesomeIcon icon={faRadio} className="w-5 h-5 md:w-6 md:h-6" />}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="platform-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Platform" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <form id="platform-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Name" required error={errors.name?.message}>
            <ShadowInput {...register("name")} placeholder="Platform name (unique)" />
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
          <ShadowInput
            type="url"
            {...register("base_url")}
            placeholder="https://example.com"
          />
        </FormField>

        <FormField label="Default CTA Label" error={errors.default_cta_label?.message}>
          <ShadowInput
            {...register("default_cta_label")}
            placeholder="e.g., Listen, Stream, Buy, Download"
          />
        </FormField>

        <FormField label="Icon Image" error={errors.icon_url?.message}>
          <ImageUploadField
            value={watch("icon_url") || null}
            onChange={(url) => setValue("icon_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={isNew ? "platforms/temp" : `platforms/${initialPlatform.id}`}
            error={errors.icon_url?.message}
            placeholder="https://example.com/icon.png"
          />
        </FormField>

        <FormField label="Icon Horizontal Image" error={errors.icon_horizontal_url?.message}>
          <ImageUploadField
            value={watch("icon_horizontal_url") || null}
            onChange={(url) => setValue("icon_horizontal_url", url || "")}
            onFileChange={(file) => setSelectedHorizontalFile(file)}
            folderPath={isNew ? "platforms/temp" : `platforms/${initialPlatform.id}`}
            error={errors.icon_horizontal_url?.message}
            placeholder="https://example.com/icon-horizontal.png"
          />
        </FormField>

      </form>
    </ModalShell>
  );
}

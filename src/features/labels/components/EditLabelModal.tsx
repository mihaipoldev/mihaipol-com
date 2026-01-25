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
import { ShadowTextarea } from "@/components/admin/forms/ShadowTextarea";
import { Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const labelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z
    .string()
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val)),
  website_url: z
    .union([z.string().url("Please enter a valid URL"), z.literal("")])
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val)),
  logo_image_url: z
    .union([z.string().url("Please enter a valid URL"), z.literal("")])
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val)),
});

type LabelFormData = z.infer<typeof labelSchema>;

type Label = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  logo_image_url: string | null;
};

type EditLabelModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: Label | null; // null for creating new label
  onSuccess?: () => void;
};

export function EditLabelModal({
  open,
  onOpenChange,
  label: initialLabel,
  onSuccess,
}: EditLabelModalProps) {
  const isNew = !initialLabel;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema) as any,
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (initialLabel) {
        reset({
          name: initialLabel.name || "",
          slug: initialLabel.slug || "",
          description: initialLabel.description || "",
          website_url: initialLabel.website_url || "",
          logo_image_url: initialLabel.logo_image_url || "",
        });
      } else {
        reset({
          name: "",
          slug: "",
          description: "",
          website_url: "",
          logo_image_url: "",
        });
      }
    }
  }, [open, initialLabel, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
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

      if (
        isNew ||
        !slugValue ||
        slugValue ===
          (initialLabel?.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "")
      ) {
        if (autoSlug !== slugValue) {
          setValue("slug", autoSlug, { shouldValidate: false });
        }
      }
    }
  }, [nameValue, setValue, isNew, slugValue, initialLabel?.name, open]);

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

  const onSubmit = async (data: LabelFormData) => {
    try {
      const newImageUrl = data.logo_image_url?.trim() || null;
      const oldImageUrl = initialLabel?.logo_image_url || null;

      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      let finalImageUrl = normalizedNewUrl;

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("folderPath", isNew ? "labels/temp" : `labels/${initialLabel.id}`);

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
        } else if (normalizedNewUrl && !normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
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
            formData.append("folderPath", isNew ? "labels/temp" : `labels/${initialLabel.id}`);
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
      }

      const submitData = {
        name: data.name,
        slug: data.slug,
        description: data.description && data.description.trim() ? data.description.trim() : null,
        website_url: data.website_url && data.website_url.trim() ? data.website_url.trim() : null,
        logo_image_url: finalImageUrl,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      let result;
      if (isNew) {
        const response = await fetch("/api/admin/labels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(submitData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to create label";
          throw new Error(errorMessage);
        }
        result = await response.json();
        // Move from temp to permanent if needed
        if (finalImageUrl && finalImageUrl.includes("/labels/temp/") && result?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `labels/${result.id}`,
              }),
            });
            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              await fetch("/api/admin/labels", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: result.id, logo_image_url: moveData.url }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }
        toast.success("Label created successfully");
      } else {
        const response = await fetch("/api/admin/labels", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id: initialLabel.id, ...submitData }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to update label";
          throw new Error(errorMessage);
        }
        result = await response.json();
        toast.success("Label updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} label:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} label`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialLabel?.name || "Edit Label"}
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
      title={watch("name") || initialLabel?.name || (isNew ? "Create New Label" : "Edit Label")}
      titleIcon={(watch("logo_image_url") || initialLabel?.logo_image_url) || <FontAwesomeIcon icon={faTag} className="w-5 h-5 md:w-6 md:h-6" />}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="label-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Label" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <form id="label-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Name" required error={errors.name?.message}>
            <ShadowInput {...register("name")} placeholder="Label name" />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <ShadowInput
              {...register("slug")}
              placeholder="label-slug"
              className="font-mono text-sm"
            />
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          <ShadowTextarea
            {...register("description")}
            placeholder="Enter a brief description of the label..."
            rows={4}
            className="resize-none"
          />
        </FormField>

        <FormField label="Website URL" error={errors.website_url?.message}>
          <ShadowInput type="url" {...register("website_url")} placeholder="https://example.com" />
        </FormField>

        <FormField label="Logo Image" error={errors.logo_image_url?.message}>
          <ImageUploadField
            value={watch("logo_image_url") || null}
            onChange={(url) => setValue("logo_image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={isNew ? "labels/temp" : `labels/${initialLabel.id}`}
            error={errors.logo_image_url?.message}
            placeholder="https://example.com/logo.jpg"
          />
        </FormField>

      </form>
    </ModalShell>
  );
}

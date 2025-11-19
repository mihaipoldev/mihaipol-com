"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { ShadowTextarea } from "@/components/admin/ShadowTextarea";
import { ShadowButton } from "@/components/admin/ShadowButton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Transform empty strings to undefined for optional fields
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

type LabelFormData = {
  name: string;
  slug: string;
  description?: string;
  website_url?: string;
  logo_image_url?: string;
};

type Label = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  logo_image_url: string | null;
};

type EditLabelFormProps = {
  id: string;
  isNew: boolean;
  initialLabel: Label | null;
};

export function EditLabelForm({ id, isNew, initialLabel }: EditLabelFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema),
  });

  useEffect(() => {
    if (initialLabel && !isNew) {
      const formData: Partial<LabelFormData> = {
        name: initialLabel.name || "",
        slug: initialLabel.slug || "",
        description: initialLabel.description || "",
        website_url: initialLabel.website_url || "",
        logo_image_url: initialLabel.logo_image_url || "",
      };
      reset(formData);
      setSelectedFile(null);
    }
  }, [initialLabel, isNew, reset]);

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
            formData.append("folderPath", id === "new" ? "labels/temp" : `labels/${id}`);

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
            formData.append("folderPath", id === "new" ? "labels/temp" : `labels/${id}`);
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

      // Prepare submit data - transform empty strings to null
      const submitData = {
        name: data.name,
        slug: data.slug,
        description: data.description && data.description.trim() ? data.description.trim() : null,
        website_url: data.website_url && data.website_url.trim() ? data.website_url.trim() : null,
        logo_image_url: finalImageUrl,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

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
          // If there are validation errors in details, show them
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
            } else if (details.formErrors) {
              throw new Error(
                `${errorMessage}\n${Array.isArray(details.formErrors) ? details.formErrors.join(", ") : details.formErrors}`
              );
            }
          }
          throw new Error(errorMessage);
        }
        const created = await response.json();
        // Move from temp to permanent if needed
        if (finalImageUrl && finalImageUrl.includes("/labels/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `labels/${created.id}`,
              }),
            });
            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              await fetch("/api/admin/labels", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: created.id, logo_image_url: moveData.url }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }
        toast.success("Label created successfully");
        router.push("/admin/labels");
      } else {
        const response = await fetch("/api/admin/labels", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id, ...submitData }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to update label";
          // If there are validation errors in details, show them
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
            } else if (details.formErrors) {
              throw new Error(
                `${errorMessage}\n${Array.isArray(details.formErrors) ? details.formErrors.join(", ") : details.formErrors}`
              );
            }
          }
          throw new Error(errorMessage);
        }
        toast.success("Label updated successfully");
        router.push("/admin/labels");
      }
    } catch (error: any) {
      console.error("Error saving label:", error);
      const errorMessage = error?.message || "Failed to save label";
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  };

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Auto-generate slug from name (only if slug is empty or matches the old name)
  useEffect(() => {
    if (nameValue) {
      const autoSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Only auto-update slug if:
      // 1. It's a new label, OR
      // 2. The current slug is empty, OR
      // 3. The current slug matches the old auto-generated slug
      if (
        isNew ||
        !slugValue ||
        slugValue ===
          (initialLabel?.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "")
      ) {
        setValue("slug", autoSlug, { shouldValidate: false });
      }
    }
  }, [nameValue, setValue, isNew, slugValue, initialLabel?.name]);

  const displayName = isNew ? undefined : initialLabel?.name || nameValue;

  return (
    <div className="w-full max-w-7xl relative">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title={isNew ? "Create Label" : "Edit Label"}
          entityName={displayName}
          description={
            isNew
              ? "Add a new record label or distributor with logo and website information."
              : "Update label information, logo, and website details."
          }
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative">
        <Card className={cn("relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl group")}>
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          
          {/* Sparkle decorations */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
          
          <div className="p-6 space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <ShadowInput
                type="url"
                {...register("website_url")}
                placeholder="https://example.com"
              />
            </FormField>

            <FormField label="Logo Image" error={errors.logo_image_url?.message}>
              <ImageUploadField
                value={watch("logo_image_url") || null}
                onChange={(url) => setValue("logo_image_url", url || "")}
                onFileChange={(file) => setSelectedFile(file)}
                folderPath={id === "new" ? "labels/temp" : `labels/${id}`}
                error={errors.logo_image_url?.message}
                placeholder="https://example.com/logo.jpg"
              />
            </FormField>
          </div>
        </Card>

        <div className="flex gap-4 justify-end">
          <ShadowButton
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/labels")}
          >
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNew ? "Create" : "Save"}
          </ShadowButton>
        </div>
      </form>
    </div>
  );
}

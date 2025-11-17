"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPlatform, updatePlatform } from "@/features/platforms/mutations";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { ShadowButton } from "@/components/admin/ShadowButton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const platformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  display_name: z.string().min(1, "Display name is required"),
  base_url: z.string().url().optional().or(z.literal("")),
  icon_url: z.string().url().optional().or(z.literal("")),
  default_cta_label: z.string().optional().or(z.literal("")),
});

type PlatformFormData = z.infer<typeof platformSchema>;

type Platform = {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  base_url: string | null;
  icon_url: string | null;
  default_cta_label: string | null;
};

type EditPlatformFormProps = {
  id: string;
  isNew: boolean;
  initialPlatform: Platform | null;
};

export function EditPlatformForm({ id, isNew, initialPlatform }: EditPlatformFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  useEffect(() => {
    if (initialPlatform && !isNew) {
      const formData: Partial<PlatformFormData> = {
        name: initialPlatform.name || "",
        slug: initialPlatform.slug || "",
        display_name: initialPlatform.display_name || "",
        base_url: initialPlatform.base_url || "",
        icon_url: initialPlatform.icon_url || "",
        default_cta_label: initialPlatform.default_cta_label || "",
      };
      reset(formData);
      setSelectedFile(null);
    }
  }, [initialPlatform, isNew, reset]);

  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    if (!nameValue) return;

    const autoSlug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const initialAutoSlug = initialPlatform?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (isNew || !slugValue || slugValue === initialAutoSlug) {
      setValue("slug", autoSlug, { shouldValidate: false });
    }
  }, [initialPlatform?.name, isNew, nameValue, setValue, slugValue]);

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

      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      let finalImageUrl = normalizedNewUrl;

      // If there's a selected file, upload it to Bunny (always check this first)
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("folderPath", id === "new" ? "platforms/temp" : `platforms/${id}`);
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
      }
      // If URL changed and no file was selected, handle URL-based upload
      else if (imageUrlChanged) {
        // If URL is provided and it's not from our CDN, validate and upload it to Bunny
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
            formData.append("folderPath", id === "new" ? "platforms/temp" : `platforms/${id}`);
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

      // Move old image to trash if it's from our CDN and we're replacing it
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
          // Don't fail the save if trash fails
        }
      }

      const submitData = {
        name: data.name,
        slug: data.slug,
        display_name: data.display_name,
        base_url: data.base_url && data.base_url.trim() ? data.base_url.trim() : null,
        icon_url: finalImageUrl || null,
        default_cta_label:
          data.default_cta_label && data.default_cta_label.trim()
            ? data.default_cta_label.trim()
            : null,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

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
        if (finalImageUrl && finalImageUrl.includes("/platforms/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `platforms/${created.id}`,
              }),
            });
            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              const { data: sessionData } = await supabase.auth.getSession();
              const accessToken = sessionData?.session?.access_token;
              await fetch("/api/admin/platforms", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ id: created.id, icon_url: moveData.url }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }
        toast.success("Platform created successfully");
        router.push("/admin/platforms");
      } else {
        const response = await fetch("/api/admin/platforms", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id, ...submitData }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to update platform";
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
        toast.success("Platform updated successfully");
        router.push("/admin/platforms");
      }
    } catch (error: any) {
      console.error("Error saving platform:", error);
      const errorMessage = error?.message || "Failed to save platform";
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  };

  const displayNameValue = watch("display_name");
  const displayName = isNew ? undefined : initialPlatform?.display_name || displayNameValue;

  return (
    <div className="w-full max-w-7xl relative">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title={isNew ? "Create Platform" : "Edit Platform"}
          entityName={displayName}
          description={
            isNew
              ? "Add a new music streaming platform or distribution channel."
              : "Update platform information, icon, and base URL settings."
          }
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative">
        <div className="relative rounded-xl border border-border/30 overflow-hidden bg-gradient-to-br from-card/30 to-transparent backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <FormField label="Display Name" required error={errors.display_name?.message}>
              <ShadowInput {...register("display_name")} placeholder="Display name" />
            </FormField>

            <FormField label="Base URL" error={errors.base_url?.message}>
              <ShadowInput type="url" {...register("base_url")} placeholder="https://example.com" />
            </FormField>

            <FormField label="Icon Image" error={errors.icon_url?.message}>
              <ImageUploadField
                value={watch("icon_url") || null}
                onChange={(url) => setValue("icon_url", url || "")}
                onFileChange={(file) => setSelectedFile(file)}
                folderPath={id === "new" ? "platforms/temp" : `platforms/${id}`}
                error={errors.icon_url?.message}
                placeholder="https://example.com/icon.png"
              />
            </FormField>

            <FormField label="Default CTA Label" error={errors.default_cta_label?.message}>
              <ShadowInput
                {...register("default_cta_label")}
                placeholder="e.g., Listen, Stream, Buy, Download"
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <ShadowButton
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/platforms")}
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

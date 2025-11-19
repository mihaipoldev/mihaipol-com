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
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

type EditPlatformFormProps = {
  id: string;
  isNew: boolean;
  initialPlatform: Platform | null;
};

export function EditPlatformForm({ id, isNew, initialPlatform }: EditPlatformFormProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
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

  useEffect(() => {
    if (initialPlatform && !isNew) {
      const formData: Partial<PlatformFormData> = {
        name: initialPlatform.name || "",
        slug: initialPlatform.slug || "",
        base_url: initialPlatform.base_url || "",
        icon_url: initialPlatform.icon_url || "",
        icon_horizontal_url: initialPlatform.icon_horizontal_url || "",
        default_cta_label: initialPlatform.default_cta_label || "",
      };
      reset(formData);
      setSelectedFile(null);
      setSelectedHorizontalFile(null);
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

      // Handle horizontal icon upload
      if (selectedHorizontalFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedHorizontalFile);
          formData.append("folderPath", id === "new" ? "platforms/temp" : `platforms/${id}`);
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
            formData.append("folderPath", id === "new" ? "platforms/temp" : `platforms/${id}`);
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

      // Move old horizontal image to trash if it's from our CDN and we're replacing it
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
          // Don't fail the save if trash fails
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
        let updatedIconUrl = finalImageUrl;
        let updatedHorizontalIconUrl = finalHorizontalImageUrl;

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
              updatedIconUrl = moveData.url;
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }

        if (
          finalHorizontalImageUrl &&
          finalHorizontalImageUrl.includes("/platforms/temp/") &&
          created?.id
        ) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
        if (
          (updatedIconUrl !== finalImageUrl ||
            updatedHorizontalIconUrl !== finalHorizontalImageUrl) &&
          created?.id
        ) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
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
          } catch (updateError) {
            console.error("Failed to update moved image URLs:", updateError);
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

  const displayName = isNew ? undefined : initialPlatform?.name || nameValue;

  return (
    <div className="w-full max-w-7xl relative">
      <div className="mb-6 md:mb-10 relative">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative">
        <Card
          className={cn(
            "relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl group"
          )}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

          {/* Sparkle decorations */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />

          <div className="p-6 space-y-4 md:space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                folderPath={id === "new" ? "platforms/temp" : `platforms/${id}`}
                error={errors.icon_url?.message}
                placeholder="https://example.com/icon.png"
              />
            </FormField>

            <FormField label="Icon Horizontal Image" error={errors.icon_horizontal_url?.message}>
              <ImageUploadField
                value={watch("icon_horizontal_url") || null}
                onChange={(url) => setValue("icon_horizontal_url", url || "")}
                onFileChange={(file) => setSelectedHorizontalFile(file)}
                folderPath={id === "new" ? "platforms/temp" : `platforms/${id}`}
                error={errors.icon_horizontal_url?.message}
                placeholder="https://example.com/icon-horizontal.png"
              />
            </FormField>
          </div>
        </Card>

        <div className="flex gap-4 justify-end">
          <ShadowButton
            type="button"
            variant="outline"
            size={isMobile ? "lg" : undefined}
            onClick={() => router.push("/admin/platforms")}
          >
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" size={isMobile ? "lg" : undefined} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNew ? "Create" : "Save Changes"}
          </ShadowButton>
        </div>
      </form>
    </div>
  );
}

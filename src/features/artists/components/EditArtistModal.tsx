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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const artistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  bio: z.string().optional(),
  profile_image_url: z.string().url().optional().or(z.literal("")),
  city: z.string().optional(),
  country: z.string().optional(),
});

type ArtistFormData = z.infer<typeof artistSchema>;

type Artist = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  profile_image_url: string | null;
  city: string | null;
  country: string | null;
};

type EditArtistModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: Artist | null; // null for creating new artist
  onSuccess?: () => void;
};

export function EditArtistModal({
  open,
  onOpenChange,
  artist: initialArtist,
  onSuccess,
}: EditArtistModalProps) {
  const isNew = !initialArtist;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (initialArtist) {
        reset({
          name: initialArtist.name || "",
          slug: initialArtist.slug || "",
          bio: initialArtist.bio || "",
          profile_image_url: initialArtist.profile_image_url || "",
          city: initialArtist.city || "",
          country: initialArtist.country || "",
        });
      } else {
        reset({
          name: "",
          slug: "",
          bio: "",
          profile_image_url: "",
          city: "",
          country: "",
        });
      }
    }
  }, [open, initialArtist, reset]);

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
          (initialArtist?.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "")
      ) {
        if (autoSlug !== slugValue) {
          setValue("slug", autoSlug, { shouldValidate: false });
        }
      }
    }
  }, [nameValue, setValue, isNew, slugValue, initialArtist?.name, open]);

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

  const onSubmit = async (data: ArtistFormData) => {
    try {
      const newImageUrl = data.profile_image_url?.trim() || null;
      const oldImageUrl = initialArtist?.profile_image_url || null;

      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      let finalImageUrl = normalizedNewUrl;

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("folderPath", isNew ? "artists/temp" : `artists/${initialArtist.id}`);

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
            setValue("profile_image_url", oldImageUrl || "", { shouldValidate: false });
            return;
          }

          try {
            const formData = new FormData();
            formData.append("imageUrl", normalizedNewUrl);
            formData.append("folderPath", isNew ? "artists/temp" : `artists/${initialArtist.id}`);

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
            setValue("profile_image_url", oldImageUrl || "", { shouldValidate: false });
            return;
          }
        }
      }

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

      const submitData = {
        name: data.name,
        slug: data.slug,
        profile_image_url: finalImageUrl || null,
        bio: data.bio && data.bio.trim() ? data.bio.trim() : null,
        city: data.city && data.city.trim() ? data.city.trim() : null,
        country: data.country && data.country.trim() ? data.country.trim() : null,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      let result;
      if (isNew) {
        const response = await fetch("/api/admin/artists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create artist");
        }

        result = await response.json();

        // If image is in temp folder, move it to the actual artist folder
        if (finalImageUrl && finalImageUrl.includes("/artists/temp/")) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `artists/${result.id}`,
              }),
            });

            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              await fetch("/api/admin/artists", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                  id: result.id,
                  profile_image_url: moveData.url,
                }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }

        toast.success("Artist created successfully");
      } else {
        const response = await fetch("/api/admin/artists", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id: initialArtist.id, ...submitData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Failed to update artist";
          throw new Error(errorMessage);
        }

        result = await response.json();
        toast.success("Artist updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} artist:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} artist`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialArtist?.name || "Edit Artist"}
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
      title={watch("name") || initialArtist?.name || (isNew ? "Create New Artist" : "Edit Artist")}
      titleIcon={(watch("profile_image_url") || initialArtist?.profile_image_url) || <FontAwesomeIcon icon={faUsers} className="w-5 h-5 md:w-6 md:h-6" />}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="artist-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Artist" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <form id="artist-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Name" required error={errors.name?.message}>
            <ShadowInput {...register("name")} placeholder="Artist name" />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <ShadowInput
              {...register("slug")}
              placeholder="artist-slug"
              className="font-mono text-sm"
            />
          </FormField>
        </div>

        <FormField label="Bio" error={errors.bio?.message}>
          <Textarea {...register("bio")} placeholder="Artist biography" rows={6} />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="City" error={errors.city?.message}>
            <ShadowInput {...register("city")} placeholder="City" />
          </FormField>

          <FormField label="Country" error={errors.country?.message}>
            <ShadowInput {...register("country")} placeholder="Country" />
          </FormField>
        </div>

        <FormField label="Profile Image" error={errors.profile_image_url?.message}>
          <ImageUploadField
            value={watch("profile_image_url") || null}
            onChange={(url) => setValue("profile_image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={isNew ? "artists/temp" : `artists/${initialArtist.id}`}
            error={errors.profile_image_url?.message}
          />
        </FormField>

      </form>
    </ModalShell>
  );
}

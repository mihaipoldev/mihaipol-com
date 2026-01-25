"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { AlbumArtist } from "@/features/artists/components/ArtistSelect";

type AlbumFormData = {
  title: string;
  slug: string;
  catalog_number?: string;
  album_type?: string;
  format_type?: string;
  description?: string;
  cover_image_url?: string;
  release_date?: string;
  label_id?: string;
  publish_status: "draft" | "published";
  cover_shape?: "square" | "circle";
};

type UseAlbumDetailsSaveParams = {
  isNew: boolean;
  initialAlbumId?: string;
};

export function useAlbumDetailsSave({ isNew, initialAlbumId }: UseAlbumDetailsSaveParams) {
  const [isSaving, setIsSaving] = useState(false);

  const saveAlbumDetails = async (
    data: AlbumFormData,
    albumArtists: AlbumArtist[],
    selectedFile: File | null
  ): Promise<string | null> => {
    try {
      setIsSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Helper to convert empty strings or "none" to null
      const toNullIfEmpty = (value: string | undefined | null): string | null => {
        if (value === undefined || value === null) return null;
        const trimmed = value.trim();
        return trimmed === "" || trimmed === "none" ? null : trimmed;
      };

      // For new albums, create first to get the ID
      let albumId = initialAlbumId;
      if (isNew) {
        const createData = {
          title: data.title,
          slug: data.slug,
          catalog_number: toNullIfEmpty(data.catalog_number),
          album_type: toNullIfEmpty(data.album_type),
          format_type: toNullIfEmpty(data.format_type),
          description: toNullIfEmpty(data.description),
          cover_image_url: null, // Will be updated after upload
          release_date: toNullIfEmpty(data.release_date),
          label_id: toNullIfEmpty(data.label_id),
          publish_status: data.publish_status as "draft" | "published",
          cover_shape: data.cover_shape ?? "square",
        };

        const createResponse = await fetch("/api/admin/albums", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(createData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || "Failed to create album");
        }

        const createdAlbum = await createResponse.json();
        albumId = createdAlbum.id;
      }

      const submitData = {
        id: albumId!,
        title: data.title,
        slug: data.slug,
        catalog_number: toNullIfEmpty(data.catalog_number),
        album_type: toNullIfEmpty(data.album_type),
        format_type: toNullIfEmpty(data.format_type),
        description: toNullIfEmpty(data.description),
        cover_image_url: toNullIfEmpty(data.cover_image_url),
        release_date: toNullIfEmpty(data.release_date),
        label_id: toNullIfEmpty(data.label_id),
        publish_status: data.publish_status as "draft" | "published",
        cover_shape: data.cover_shape ?? null,
      };

      // Handle file upload if selected
      let finalImageUrl = data.cover_image_url;
      if (selectedFile && albumId) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("folderPath", `albums/${albumId}`);
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
          submitData.cover_image_url = finalImageUrl || null;
        } catch (uploadError: any) {
          console.error("Error uploading image:", uploadError);
          toast.error(uploadError.message || "Failed to upload image");
          throw uploadError;
        }
      }

      // Update album (for both new and existing)
      if (!isNew || selectedFile) {
        const response = await fetch("/api/admin/albums", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update album");
        }
      }

      // Save album artists
      if (albumId) {
        try {
          const artistsResponse = await fetch("/api/admin/albums/artists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              albumId: albumId,
              artists: albumArtists.map((aa) => ({
                id: aa.id.startsWith("temp-") ? undefined : aa.id,
                artist_id: aa.artist_id,
                role: aa.role,
                sort_order: aa.sort_order,
              })),
            }),
          });
          if (!artistsResponse.ok) {
            const error = await artistsResponse.json();
            throw new Error(error.error || "Failed to save artists");
          }
        } catch (artistError: any) {
          console.error("Error saving artists:", artistError);
          toast.error(artistError.message || "Album updated but failed to save artists");
          throw artistError;
        }
      }

      toast.success(isNew ? "Album created successfully" : "Album updated successfully");
      return albumId || null;
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} album:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} album`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveAlbumDetails,
    isSaving,
  };
}

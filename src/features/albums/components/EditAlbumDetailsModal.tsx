"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { DatePicker } from "@/components/admin/forms/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/admin/forms/AdminSelect";
import { Plus, Loader2, Square, Circle } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompactDisc } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { PublishStatusControl } from "@/components/admin/PublishStatusControl";
import { CreateLabelModal } from "@/features/labels/components/CreateLabelModal";
import { getAllLabels } from "@/features/labels/data";
import { getAllArtists } from "@/features/artists/data";
import { ArtistSelect, type Artist, type AlbumArtist } from "@/features/artists/components/ArtistSelect";
import type { Album, Label } from "@/features/albums/types";
import { toast } from "sonner";
import { useAlbumDetailsSave } from "../hooks/useAlbumDetailsSave";

const albumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  catalog_number: z.string().optional(),
  album_type: z.string().optional(),
  format_type: z.string().optional(),
  description: z.string().optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  release_date: z.string().optional(),
  label_id: z.string().optional().or(z.literal("")),
  publish_status: z.enum(["draft", "published"]), // Only draft and published for switch
  cover_shape: z.enum(["square", "circle"]).optional(),
});

type AlbumFormData = z.infer<typeof albumSchema>;

type EditAlbumDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: Album | null; // null for creating new album
  onSuccess?: () => void;
};

export function EditAlbumDetailsModal({
  open,
  onOpenChange,
  album: initialAlbum,
  onSuccess,
}: EditAlbumDetailsModalProps) {
  const isNew = !initialAlbum;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albumArtists, setAlbumArtists] = useState<AlbumArtist[]>([]);
  const [isCreateLabelModalOpen, setIsCreateLabelModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const labelIdToSelectRef = useRef<string | null>(null);

  const { saveAlbumDetails, isSaving } = useAlbumDetailsSave({
    isNew,
    initialAlbumId: initialAlbum?.id,
  });

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    reset,
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
      defaultValues: {
        title: "",
        slug: "",
        catalog_number: "",
        album_type: "none",
        format_type: "none",
        description: "",
        cover_image_url: "",
        release_date: "",
        label_id: "",
        publish_status: "draft",
        cover_shape: "square",
      },
  });

  // Initialize form and fetch related data when modal opens
  useEffect(() => {
    if (open) {
      if (initialAlbum) {
        // Normalize album_type and format_type: convert null/empty to "none" for Select components
        const normalizedAlbumType = initialAlbum.album_type && initialAlbum.album_type.trim() !== "" 
          ? initialAlbum.album_type 
          : "none";
        const normalizedFormatType = initialAlbum.format_type && initialAlbum.format_type.trim() !== "" 
          ? initialAlbum.format_type 
          : "none";
        
        console.log("Initializing form with:", {
          album_type: initialAlbum.album_type,
          normalizedAlbumType,
          format_type: initialAlbum.format_type,
          normalizedFormatType,
        });
        
        // Set form values from initial album
        reset({
          title: initialAlbum.title || "",
          slug: initialAlbum.slug || "",
          catalog_number: initialAlbum.catalog_number || "",
          album_type: normalizedAlbumType,
          format_type: normalizedFormatType,
          description: initialAlbum.description || "",
          cover_image_url: initialAlbum.cover_image_url || "",
          release_date: initialAlbum.release_date || "",
          label_id: initialAlbum.label_id || "",
          publish_status: (() => {
            const s = (initialAlbum.publish_status as any)?.toString?.().trim?.().toLowerCase?.();
            // Map to draft (unpublished) or published
            return s === "published" ? "published" : "draft";
          })(),
          cover_shape: initialAlbum.cover_shape || "square",
        });
        
        // Explicitly set values after reset to ensure Select components update
        setTimeout(() => {
          setValue("album_type", normalizedAlbumType, { shouldValidate: false });
          setValue("format_type", normalizedFormatType, { shouldValidate: false });
        }, 0);
        
        fetchAlbumArtists();
      } else {
        // Reset to defaults for new album
        reset({
          title: "",
          slug: "",
          catalog_number: "",
          album_type: "none",
          format_type: "none",
          description: "",
          cover_image_url: "",
          release_date: "",
          label_id: "",
          publish_status: "draft",
          cover_shape: "square",
        });
      }
      
      fetchLabels();
      fetchArtists();
    }
  }, [open, initialAlbum, reset, setValue]);

  // Auto-generate slug from title when title changes (only for new albums or if slug is empty)
  const titleValue = watch("title");
  const slugValue = watch("slug");
  useEffect(() => {
    if (titleValue && (isNew || !slugValue)) {
      const generatedSlug = generateSlug(titleValue);
      if (generatedSlug) {
        setValue("slug", generatedSlug, { shouldValidate: false });
      }
    }
  }, [titleValue, isNew, slugValue, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
      labelIdToSelectRef.current = null;
    }
  }, [open, reset]);

  const fetchLabels = async () => {
    try {
      const labelsData = await getAllLabels();
      setLabels(labelsData);
    } catch (error) {
      console.error("Error fetching labels:", error);
    }
  };

  const fetchArtists = async () => {
    try {
      const artistsData = await getAllArtists();
      setArtists(artistsData);
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
  };

  const fetchAlbumArtists = async () => {
    if (!initialAlbum) return; // Skip for new albums
    
    setIsLoadingArtists(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/albums/artists?albumId=${initialAlbum.id}`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // The API returns { data: [...] } format, so extract the data
        const artistsData = result.data || result || [];
        console.log("Fetched album artists:", artistsData);
        setAlbumArtists(artistsData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch album artists:", errorData);
      }
    } catch (error) {
      console.error("Error fetching album artists:", error);
    } finally {
      setIsLoadingArtists(false);
    }
  };

  const handleLabelCreated = async (newLabel: { id: string; name: string }) => {
    labelIdToSelectRef.current = newLabel.id;
    try {
      const updatedLabels = await getAllLabels();
      setLabels(updatedLabels);
      toast.success(`Label "${newLabel.name}" created and selected`);
    } catch (error) {
      console.error("Error refreshing labels:", error);
    }
  };

  // Select the newly created label after labels are updated
  useEffect(() => {
    if (labelIdToSelectRef.current && labels.length > 0) {
      const labelExists = labels.some((l) => l.id === labelIdToSelectRef.current);
      if (labelExists) {
        setValue("label_id", labelIdToSelectRef.current);
        labelIdToSelectRef.current = null;
      }
    }
  }, [labels, setValue]);

  const onSubmit = async (data: AlbumFormData) => {
    try {
      const albumId = await saveAlbumDetails(data, albumArtists, selectedFile);
      if (albumId) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialAlbum?.title || "Edit Album Details"}
        titleIcon={initialAlbum?.cover_image_url || <FontAwesomeIcon icon={faCompactDisc} className="w-5 h-5 md:w-6 md:h-6" />}
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
    <>
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={watch("title") || initialAlbum?.title || (isNew ? "Create New Album" : "Edit Album Details")}
        titleIcon={(watch("cover_image_url") || initialAlbum?.cover_image_url) || <FontAwesomeIcon icon={faCompactDisc} className="w-5 h-5 md:w-6 md:h-6" />}
        footer={
          <DialogFooter>
            <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </ShadowButton>
            <ShadowButton type="submit" form="album-form" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </ShadowButton>
          </DialogFooter>
        }
        maxWidth="4xl"
        maxHeight="90vh"
        showScroll={true}
      >
        <form id="album-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <FormField label="Title" required error={errors.title?.message}>
              <ShadowInput {...register("title")} placeholder="Album title" />
            </FormField>

            <FormField label="Slug" required error={errors.slug?.message}>
              <ShadowInput {...register("slug")} placeholder="album-slug" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <FormField label="Release Date" error={errors.release_date?.message}>
              <Controller
                name="release_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select release date"
                  />
                )}
              />
            </FormField>

            <FormField label="Label" error={errors.label_id?.message}>
              <Controller
                name="label_id"
                control={control}
                render={({ field }) => {
                  const currentId = field.value || "";
                  const hasCurrentInList = labels.some((l) => l.id === currentId);
                  return (
                    <Select
                      key={`label-select-${labels.length}`}
                      value={currentId || "none"}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setIsCreateLabelModalOpen(true);
                          return;
                        }
                        const next = value === "none" ? "" : value;
                        field.onChange(next);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select label (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {labels.map((label) => (
                          <SelectItem key={label.id} value={label.id}>
                            <div className="flex items-center gap-2">
                              {label.logo_image_url ? (
                                <img
                                  src={label.logo_image_url}
                                  alt={label.name}
                                  className="w-5 h-5 rounded object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] shrink-0">
                                  {label.name?.[0] || "?"}
                                </div>
                              )}
                              <span>{label.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {!hasCurrentInList && currentId && (
                          <SelectItem value={currentId}>Unknown label</SelectItem>
                        )}
                        <SelectSeparator />
                        <SelectItem
                          value="new"
                          className="px-2 py-1.5 rounded-sm bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary text-primary text-xs font-medium transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                            <span>Create New Label</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </FormField>
          </div>

          <FormField label="Artists" error={undefined}>
            <ArtistSelect
              artists={artists}
              selectedArtists={albumArtists}
              onChange={setAlbumArtists}
              onArtistsChange={setArtists}
              disabled={false}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <FormField label="Catalog" error={errors.catalog_number?.message}>
              <ShadowInput {...register("catalog_number")} placeholder="Catalog number" />
            </FormField>

            <FormField label="Album Type" error={errors.album_type?.message}>
              <Controller
                name="album_type"
                control={control}
                render={({ field }) => {
                  // Use watch to get the current form value, fallback to field.value, then to "none"
                  const formValue = watch("album_type");
                  const currentValue = formValue || field.value || "none";
                  
                  console.log("Album Type Select render:", { formValue, fieldValue: field.value, currentValue });
                  
                  return (
                    <Select
                      key={`album-type-${initialAlbum?.id || 'new'}-${open}`}
                      value={currentValue}
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? "" : value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select album type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Album">Album</SelectItem>
                        <SelectItem value="Edit">Edit</SelectItem>
                        <SelectItem value="EP">EP</SelectItem>
                        <SelectItem value="LP">LP</SelectItem>
                        <SelectItem value="Remix">Remix</SelectItem>
                        <SelectItem value="VA">VA</SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </FormField>

            <FormField label="Format Type" error={errors.format_type?.message}>
              <Controller
                name="format_type"
                control={control}
                render={({ field }) => {
                  // Use watch to get the current form value, fallback to field.value, then to "none"
                  const formValue = watch("format_type");
                  const currentValue = formValue || field.value || "none";
                  
                  console.log("Format Type Select render:", { formValue, fieldValue: field.value, currentValue });
                  
                  return (
                    <Select
                      key={`format-type-${initialAlbum?.id || 'new'}-${open}`}
                      value={currentValue}
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? "" : value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Vinyl">Vinyl</SelectItem>
                        <SelectItem value="Digital">Digital</SelectItem>
                        <SelectItem value="USB">USB</SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </FormField>
          </div>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea {...register("description")} placeholder="Album description" rows={4} />
          </FormField>

          <FormField label="Cover Image" error={errors.cover_image_url?.message}>
            <Controller
              name="cover_shape"
              control={control}
              defaultValue="square"
              render={({ field }) => (
                <ImageUploadField
                  value={watch("cover_image_url") || null}
                  onChange={(url) => setValue("cover_image_url", url || "")}
                  onFileChange={(file) => setSelectedFile(file)}
                  folderPath={isNew ? "albums/temp" : `albums/${initialAlbum.id}`}
                  error={errors.cover_image_url?.message}
                  placeholder="https://example.com/cover.jpg"
                  shapeControl={{
                    value: field.value || "square",
                    onChange: field.onChange,
                  }}
                />
              )}
            />
          </FormField>

          {/* Publish Status Card */}
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">Publish Status</span>
                <span className="text-xs text-muted-foreground">
                  Control whether this album is visible to the public
                </span>
              </div>
              <PublishStatusControl
                control={control}
                defaultValue={(() => {
                  if (!initialAlbum) return "draft";
                  const s = (initialAlbum.publish_status as any)?.toString?.().trim?.().toLowerCase?.();
                  return s === "published" ? "published" : "draft";
                })()}
                className="pt-0"
              />
            </div>
          </div>

        </form>
      </ModalShell>

      <CreateLabelModal
        open={isCreateLabelModalOpen}
        onOpenChange={setIsCreateLabelModalOpen}
        onSuccess={handleLabelCreated}
      />
    </>
  );
}

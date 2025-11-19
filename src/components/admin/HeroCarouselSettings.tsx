"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Image, Plus, Trash2, Loader2, GripVertical, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { ShadowButton } from "@/components/admin/ShadowButton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type HeroCarouselImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const heroImageSchema = z.object({
  image_url: z
    .union([z.string().url("Please enter a valid URL"), z.literal("")])
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val))
    .or(z.undefined()),
  alt_text: z
    .string()
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val))
    .or(z.undefined()),
});

type HeroImageFormData = {
  image_url?: string;
  alt_text?: string;
};

async function fetchImages(): Promise<HeroCarouselImage[]> {
  const response = await fetch("/api/admin/hero-carousel");
  if (!response.ok) {
    throw new Error("Failed to fetch hero carousel images");
  }
  return response.json();
}

async function createImage(data: {
  image_url: string;
  alt_text?: string | null;
  sort_order?: number;
  is_active?: boolean;
}): Promise<HeroCarouselImage> {
  const response = await fetch("/api/admin/hero-carousel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create image");
  }

  return response.json();
}

async function updateImage(
  id: string,
  data: {
    image_url?: string;
    alt_text?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<HeroCarouselImage> {
  const response = await fetch("/api/admin/hero-carousel", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update image");
  }

  return response.json();
}

async function deleteImage(id: string): Promise<void> {
  const response = await fetch(`/api/admin/hero-carousel?id=${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete image");
  }
}

async function updateImageOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  // Update all images in parallel
  await Promise.all(
    updates.map((update) =>
      fetch("/api/admin/hero-carousel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: update.id, sort_order: update.sort_order }),
      })
    )
  );
}

function SortableImageCard({
  image,
  index,
  onUpdate,
  onDelete,
  isUpdating,
}: {
  image: HeroCarouselImage;
  index: number;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-start gap-4 p-4 px-2 rounded-sm w-full",
        "hover:bg-background/80 focus:bg-background/80",
        isDragging && "shadow-lg z-50"
      )}
    >
      {/* Column 1: Image and drag handle */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        <div className="w-24 h-24 rounded overflow-hidden bg-muted">
          <img
            src={image.image_url}
            alt={image.alt_text || "Carousel image"}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Drag handle - square, centered below image */}
        <div className="flex justify-center">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none w-10 h-10 rounded flex items-center justify-center transition-colors"
            style={{ touchAction: "none" }}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Column 2: Fields, switch, delete button */}
      <div className="flex-1 min-w-0 max-w-full space-y-3 pr-0">
        <div className="flex items-center gap-2">
          <Switch
            checked={image.is_active}
            onCheckedChange={(checked) => {
              onUpdate(image.id, { is_active: checked });
            }}
            disabled={isUpdating}
          />
        </div>
        <div className="w-full">
          <Label className="text-xs">Image URL</Label>
          <Input
            value={image.image_url}
            onChange={(e) => {
              onUpdate(image.id, { image_url: e.target.value });
            }}
            className="text-xs w-full"
            style={{ maxWidth: "100%" }}
            disabled={isUpdating}
          />
        </div>
        <div className="w-full">
          <Label className="text-xs">Alt Text</Label>
          <Input
            value={image.alt_text || ""}
            onChange={(e) => {
              onUpdate(image.id, { alt_text: e.target.value || null });
            }}
            placeholder="Optional"
            className="text-xs w-full"
            style={{ maxWidth: "100%" }}
            disabled={isUpdating}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(image.id)}
        disabled={isUpdating}
        className="absolute top-4 right-4 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export type HeroCarouselSaveRef = {
  hasChanges: boolean;
  save: () => Promise<void>;
};

type HeroCarouselSettingsProps = {
  onSaveRef?: (ref: HeroCarouselSaveRef | null) => void;
};

export function HeroCarouselSettings({ onSaveRef }: HeroCarouselSettingsProps = {}) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localImages, setLocalImages] = useState<HeroCarouselImage[]>([]);
  const [originalImages, setOriginalImages] = useState<HeroCarouselImage[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<HeroCarouselImage | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<HeroImageFormData>({
    resolver: zodResolver(heroImageSchema),
    defaultValues: {
      image_url: "",
      alt_text: "",
    },
  });

  const { data: images, isLoading } = useQuery({
    queryKey: ["hero-carousel-images"],
    queryFn: fetchImages,
  });

  // Initialize local images when data loads
  useEffect(() => {
    if (images) {
      const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
      setLocalImages(sorted);
      setOriginalImages(sorted.map((img) => ({ ...img }))); // Deep copy for comparison
      setHasChanges(false);
    }
  }, [images]);

  // Check if there are changes
  useEffect(() => {
    if (originalImages.length === 0) {
      setHasChanges(false);
      return;
    }

    const hasOrderChanged = localImages.some(
      (img, index) => img.id !== originalImages[index]?.id || img.sort_order !== index + 1
    );

    const hasDataChanged = localImages.some((img) => {
      const original = originalImages.find((orig) => orig.id === img.id);
      if (!original) return false;
      return (
        img.image_url !== original.image_url ||
        img.alt_text !== original.alt_text ||
        img.is_active !== original.is_active
      );
    });

    const hasAnyChanges = hasOrderChanged || hasDataChanged;
    setHasChanges(hasAnyChanges);
  }, [localImages, originalImages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createMutation = useMutation({
    mutationFn: createImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-carousel-images"] });
      toast.success("Image added successfully");
      setIsModalOpen(false);
      reset();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add image");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateImage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-carousel-images"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update image");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-carousel-images"] });
      toast.success("Image deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete image");
    },
  });

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      // Save order changes
      const orderUpdates = localImages.map((img, index) => ({
        id: img.id,
        sort_order: index + 1,
      }));
      await updateImageOrder(orderUpdates);

      // Save data changes (image_url, alt_text, is_active)
      const dataUpdates = localImages
        .map((img) => {
          const original = originalImages.find((orig) => orig.id === img.id);
          if (!original) return null;

          const changes: any = {};
          if (img.image_url !== original.image_url) changes.image_url = img.image_url;
          if (img.alt_text !== original.alt_text) changes.alt_text = img.alt_text;
          if (img.is_active !== original.is_active) changes.is_active = img.is_active;

          if (Object.keys(changes).length === 0) return null;

          return { id: img.id, data: changes };
        })
        .filter((update): update is { id: string; data: any } => update !== null);

      // Update all changed images
      await Promise.all(
        dataUpdates.map((update) => updateImage(update.id, update.data))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-carousel-images"] });
      // Update originalImages to match current state after save
      setOriginalImages(localImages.map((img) => ({ ...img })));
      setHasChanges(false);
    },
    onError: (error: Error) => {
      throw error; // Re-throw so parent can handle
    },
  });

  // Create stable save function
  const handleSave = useCallback(async () => {
    await saveAllMutation.mutateAsync();
  }, [saveAllMutation]);

  // Store callbacks in refs to avoid dependency issues
  const onSaveRefRef = useRef(onSaveRef);
  const handleSaveRef = useRef(handleSave);
  
  useEffect(() => {
    onSaveRefRef.current = onSaveRef;
  }, [onSaveRef]);
  
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // Expose save function and hasChanges to parent - only update when hasChanges changes
  useEffect(() => {
    if (onSaveRefRef.current) {
      onSaveRefRef.current({
        hasChanges,
        save: handleSaveRef.current,
      });
    }
    return () => {
      onSaveRefRef.current?.(null);
    };
  }, [hasChanges]);

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

  const onSubmit = async (data: HeroImageFormData) => {
    try {
      // Validate that either a file is selected or an image URL is provided
      if (!selectedFile && !data.image_url?.trim()) {
        toast.error("Please upload an image file or provide an image URL");
        return;
      }

      const newImageUrl = data.image_url?.trim() || null;
      let finalImageUrl = newImageUrl;

      // If there's a selected file, upload it to Bunny
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("folderPath", "hero-images");
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
          formData.append("folderPath", "hero-images");
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

      const maxSortOrder = images?.length ? Math.max(...images.map((img) => img.sort_order)) : -1;
      
      // Create the image record - image is already in permanent location
      await createImage({
        image_url: finalImageUrl!,
        alt_text: data.alt_text || null,
        sort_order: maxSortOrder + 1,
        is_active: true,
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["hero-carousel-images"] });
      toast.success("Image added successfully");
      setIsModalOpen(false);
      reset();
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Error creating hero image:", error);
      toast.error(error?.message || "Failed to create image");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sorted = [...localImages].sort((a, b) => a.sort_order - b.sort_order);
      const oldIndex = sorted.findIndex((s) => s.id === active.id);
      const newIndex = sorted.findIndex((s) => s.id === over.id);

      const newImages = arrayMove(sorted, oldIndex, newIndex);
      // Update order numbers based on new positions
      const updatedImages = newImages.map((img, index) => ({
        ...img,
        sort_order: index + 1,
      }));

      setLocalImages(updatedImages);
    }
  };

  const handleSaveChanges = () => {
    saveAllMutation.mutate();
  };

  const handleUpdateImage = (id: string, data: any) => {
    // Only update local state, don't save to server yet
    setLocalImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...data } : img))
    );
  };

  const handleDeleteImage = (id: string) => {
    const image = localImages.find((img) => img.id === id);
    if (image) {
      setImageToDelete(image);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    deleteMutation.mutate(imageToDelete.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setImageToDelete(null);
      },
    });
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      reset();
      setSelectedFile(null);
    }
  }, [isModalOpen, reset]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <div className="font-medium text-lg">Hero Carousel Images</div>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            size="sm"
            className={cn(isMobile && "h-9 w-9 p-0")}
          >
            <Plus className={cn("h-4 w-4", !isMobile && "mr-2")} />
            {!isMobile && "Add Image"}
          </Button>
        </div>

        {/* Existing images with drag and drop */}
        <div className="space-y-4">
          {localImages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images added yet.</p>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localImages.map((img) => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {localImages.map((image, index) => (
                      <SortableImageCard
                        key={image.id}
                        image={image}
                        index={index}
                        onUpdate={handleUpdateImage}
                        onDelete={handleDeleteImage}
                        isUpdating={saveAllMutation.isPending}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </div>

      {/* Add Image Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hero Image</DialogTitle>
            <DialogDescription>
              Add a new image to the hero carousel. It will be added to the end of the carousel.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-6 mt-4"
          >
            <FormField label="Image" required error={errors.image_url?.message}>
              <ImageUploadField
                value={watch("image_url") || null}
                onChange={(url) => setValue("image_url", url || "")}
                onFileChange={(file) => setSelectedFile(file)}
                folderPath="hero-images"
                error={errors.image_url?.message}
                placeholder="/hero images/image.jpg"
              />
            </FormField>

            <FormField label="Alt Text" error={errors.alt_text?.message}>
              <ShadowInput
                {...register("alt_text")}
                placeholder="Description of the image (optional)"
              />
            </FormField>

            <div className="flex gap-4 justify-end pt-4">
              <ShadowButton type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </ShadowButton>
              <ShadowButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Image"}
              </ShadowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this hero carousel image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => {
                setShowDeleteDialog(false);
                setImageToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

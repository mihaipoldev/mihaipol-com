"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, GripVertical, Pencil, Trash2, Circle, Square, ZoomIn, Loader2, Upload, Download, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { MediaPreviewModal } from "@/features/workflows/components/ImagePreviewModal";
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
import { ContentImageUploadField } from "@/components/admin/forms/ContentImageUploadField";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { ActionMenu, type CustomMenuItem } from "@/components/admin/ui/ActionMenu";
import { cn } from "@/lib/utils";
import type { AlbumImage } from "@/features/albums/types";

type AlbumImagesManagerProps = {
  images: AlbumImage[];
  onChange: (images: AlbumImage[]) => void;
  folderPath: string;
  coverImageUrl?: string | null;
};

type SortableImageItemProps = {
  image: AlbumImage;
  onEdit: (image: AlbumImage) => void;
  onDelete: (id: string) => void;
  onView: (image: AlbumImage) => void;
  onTitleUpdate: (id: string, title: string | null) => void;
  albumId: string | null;
};

type ImageMetadata = {
  dimensions: string | null;
  fileSize: string | null;
};

function SortableImageItem({
  image,
  onEdit,
  onDelete,
  onView,
  onTitleUpdate,
  albumId,
}: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(image.title || "");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [metadata, setMetadata] = useState<ImageMetadata>({ dimensions: null, fileSize: null });
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Fetch image dimensions and file size
  useEffect(() => {
    if (!image.image_url) {
      setIsLoadingMetadata(false);
      return;
    }

    setIsLoadingMetadata(true);
    const img = new Image();
    
    img.onload = () => {
      const dimensions = `${img.naturalWidth}x${img.naturalHeight}`;
      
      // Try to get file size from fetch
      fetch(image.image_url, { method: "HEAD" })
        .then((response) => {
          const contentLength = response.headers.get("content-length");
          let fileSize = null;
          
          if (contentLength) {
            const bytes = parseInt(contentLength, 10);
            if (bytes < 1024) {
              fileSize = `${bytes} B`;
            } else if (bytes < 1024 * 1024) {
              fileSize = `${(bytes / 1024).toFixed(1)} KB`;
            } else {
              fileSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            }
          }
          
          setMetadata({ dimensions, fileSize });
          setIsLoadingMetadata(false);
        })
        .catch(() => {
          setMetadata({ dimensions, fileSize: null });
          setIsLoadingMetadata(false);
        });
    };
    
    img.onerror = () => {
      setIsLoadingMetadata(false);
    };
    
    img.src = image.image_url;
  }, [image.image_url]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditingTitle(image.title || "");
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleTitleSave = async () => {
    if (isSavingTitle) return;
    
    const newTitle = editingTitle.trim() || null;
    if (newTitle === (image.title || null)) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    
    // Update local state immediately
    onTitleUpdate(image.id, newTitle);

    // Save to database if album ID is available
    if (albumId && albumId !== "new" && albumId !== "temp" && !image.id.startsWith("temp-")) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        const response = await fetch("/api/admin/albums/images", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            id: image.id,
            title: newTitle,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update title");
        }
      } catch (error: any) {
        console.error("Error updating title:", error);
        toast.error(error.message || "Failed to update title");
        // Revert on error
        setEditingTitle(image.title || "");
      }
    }

    setIsSavingTitle(false);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditingTitle(image.title || "");
      setIsEditingTitle(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow",
        isDragging && "shadow-lg"
      )}
    >
      {/* Drag Handle - Top Left */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded p-1 opacity-0 group-hover:opacity-100"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Thumbnail Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
        {image.image_url ? (
          <div 
            className="relative w-full h-full cursor-pointer"
            onClick={() => onView(image)}
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            <img
              src={image.image_url}
              alt={image.title || "Content image"}
              className="w-full h-full object-cover"
            />
            {/* Hover Overlay with Actions */}
            <div 
              className={cn(
                "absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center gap-3",
                isImageHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(image);
                }}
                className="p-2 bg-background/90 rounded-full hover:bg-background transition-colors"
                aria-label="Edit image"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(image);
                }}
                className="p-2 bg-background/90 rounded-full hover:bg-background transition-colors"
                aria-label="View full size"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
                className="p-2 bg-background/90 rounded-full hover:bg-background transition-colors text-destructive"
                aria-label="Delete image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Circle className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-1">
        {/* Title - Editable with ActionMenu */}
        <div className="flex items-center justify-between gap-2">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 text-sm font-medium bg-transparent border-b border-primary focus:outline-none focus:border-primary"
              placeholder="Click to add title..."
              disabled={isSavingTitle}
              aria-label="Edit image title"
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onClick={handleTitleClick}
              onMouseDown={(e) => e.stopPropagation()}
              className={cn(
                "flex-1 text-sm font-medium cursor-text hover:text-primary transition-colors",
                !image.title && "text-muted-foreground italic"
              )}
              title="Click to edit title"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTitleClick();
                }
              }}
              aria-label={`Edit title for ${image.title || "Untitled"}`}
            >
              {image.title || "Untitled"}
            </div>
          )}
          {/* ActionMenu */}
          <div className="flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
            <ActionMenu
              itemId={image.id}
              customItems={[
                {
                  label: "View",
                  icon: <ZoomIn className="h-4 w-4" />,
                  onClick: () => onView(image),
                  disabled: !image.image_url,
                },
                {
                  label: "Edit",
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: () => onEdit(image),
                  disabled: !image.image_url,
                },
                {
                  label: "Download",
                  icon: <Download className="h-4 w-4" />,
                  onClick: () => {
                    if (image.image_url) {
                      try {
                        // Create a temporary anchor element to trigger download
                        const link = document.createElement("a");
                        link.href = image.image_url;
                        link.download = image.title || `image-${image.id}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (error) {
                        console.error("Error downloading image:", error);
                        toast.error("Failed to download image");
                      }
                    }
                  },
                  disabled: !image.image_url,
                },
                {
                  label: "Copy URL",
                  icon: <Copy className="h-4 w-4" />,
                  onClick: async () => {
                    if (image.image_url) {
                      try {
                        await navigator.clipboard.writeText(image.image_url);
                        toast.success("URL copied to clipboard");
                      } catch (error) {
                        console.error("Error copying URL to clipboard:", error);
                        // Fallback for older browsers
                        try {
                          const textArea = document.createElement("textarea");
                          textArea.value = image.image_url;
                          textArea.style.position = "fixed";
                          textArea.style.opacity = "0";
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand("copy");
                          document.body.removeChild(textArea);
                          toast.success("URL copied to clipboard");
                        } catch (fallbackError) {
                          console.error("Fallback copy failed:", fallbackError);
                          toast.error("Failed to copy URL");
                        }
                      }
                    }
                  },
                  disabled: !image.image_url,
                },
                {
                  separator: true,
                  label: "",
                  onClick: () => {},
                },
                {
                  label: "Delete",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => onDelete(image.id),
                  destructive: true,
                  disabled: !image.image_url,
                },
              ]}
              showDelete={false}
              disabled={!image.image_url}
            />
          </div>
        </div>

        {/* Metadata */}
        {isLoadingMetadata ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {metadata.dimensions && metadata.fileSize
                ? `${metadata.dimensions} · ${metadata.fileSize}`
                : metadata.dimensions || metadata.fileSize || "—"}
            </div>
            {(image.content_type || image.content_group) && (
              <div className="flex flex-wrap gap-1">
                {image.content_type && (
                  <Badge variant="secondary" className="text-xs">
                    {image.content_type.replace(/_/g, " ")}
                  </Badge>
                )}
                {image.content_group && (
                  <Badge variant="outline" className="text-xs">
                    {image.content_group}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AlbumImagesManager({
  images,
  onChange,
  folderPath,
  coverImageUrl,
}: AlbumImagesManagerProps) {
  // Extract album ID from folderPath (format: "albums/{id}")
  const albumId = folderPath.startsWith("albums/") 
    ? folderPath.replace("albums/", "") 
    : null;

  const [localImages, setLocalImages] = useState<AlbumImage[]>(
    [...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<AlbumImage | null>(null);
  const [editingImage, setEditingImage] = useState<AlbumImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editShape, setEditShape] = useState<"circle" | "square">("circle");
  const [editContentType, setEditContentType] = useState<string | null>(null);
  const [editContentGroup, setEditContentGroup] = useState<string>("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [imageToDelete, setImageToDelete] = useState<AlbumImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local images when prop changes
  useEffect(() => {
    setLocalImages([...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
  }, [images]);

  // Notify parent of changes
  const updateImages = (updatedImages: AlbumImage[]) => {
    setLocalImages(updatedImages);
    onChange(updatedImages);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localImages.findIndex((img) => img.id === active.id);
      const newIndex = localImages.findIndex((img) => img.id === over.id);

      const reorderedImages = arrayMove(localImages, oldIndex, newIndex);
      // Update sort_order for all images
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        sort_order: index,
      }));

      // Update local state immediately for responsive UI
      updateImages(updatedImages);

      // Save to database immediately if album ID is available
      if (albumId && albumId !== "new" && albumId !== "temp") {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              albumId: albumId,
              images: updatedImages
                .filter((img) => !img.id.startsWith("temp-")) // Only save real images
                .map((img) => ({
                  id: img.id,
                  title: img.title || null,
                  image_url: img.image_url,
                  crop_shape: img.crop_shape,
                  content_type: img.content_type || null,
                  content_group: img.content_group || null,
                  sort_order: img.sort_order,
                })),
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Error saving image order:", error);
            toast.error("Failed to save image order");
          }
        } catch (error: any) {
          console.error("Error saving image order:", error);
          toast.error("Failed to save image order");
        }
      }
    }
  };

  const handleDelete = (id: string) => {
    const image = localImages.find((img) => img.id === id);
    if (image) {
      setImageToDelete(image);
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    
    // Skip API call for temporary/optimistic items (they're not in the database yet)
    if (imageToDelete.id.startsWith("temp-")) {
      const updatedImages = localImages.filter((img) => img.id !== imageToDelete.id);
      const reorderedImages = updatedImages.map((img, index) => ({
        ...img,
        sort_order: index,
      }));
      updateImages(reorderedImages);
      setImageToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/albums/images?id=${imageToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete image");
      }

      // Remove from local state after successful deletion
      const updatedImages = localImages.filter((img) => img.id !== imageToDelete.id);
      // Recalculate sort_order after deletion
      const reorderedImages = updatedImages.map((img, index) => ({
        ...img,
        sort_order: index,
      }));
      updateImages(reorderedImages);
      
      toast.success("Image deleted successfully");
      setImageToDelete(null);
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error(error.message || "Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = (image: AlbumImage) => {
    setViewingImage(image);
    setIsViewModalOpen(true);
  };

  const handleEdit = (image: AlbumImage) => {
    setEditingImage(image);
    setEditTitle(image.title || "");
    setEditShape(image.crop_shape);
    setEditContentType(image.content_type || null);
    setEditContentGroup(image.content_group || "");
    setEditImageUrl(image.image_url);
    setEditSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingImage(null);
    setEditTitle("");
    setEditShape("circle");
    setEditContentType(null);
    setEditContentGroup("");
    setEditImageUrl(null);
    setEditSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editImageUrl && !editSelectedFile) {
      return; // Need either URL or file
    }

    let finalImageUrl = editImageUrl;

    // Upload file if selected
    if (editSelectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", editSelectedFile);
        formData.append("folderPath", folderPath);
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
        // Show error but don't block - user can retry
        alert(uploadError.message || "Failed to upload image");
        return;
      }
    }

    if (!finalImageUrl) {
      return; // Need a valid image URL
    }

    if (editingImage) {
      // Update existing image - save to database immediately if it has a real ID
      if (editingImage.id && !editingImage.id.startsWith("temp-")) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/images", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              id: editingImage.id,
              title: editTitle || null,
              image_url: finalImageUrl!,
              crop_shape: editShape,
              content_type: editContentType || null,
              content_group: editContentGroup.trim() || null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update image");
          }

          const updatedImageData = await response.json();

          // Update local state with response data
          const updatedImages = localImages.map((img) =>
            img.id === editingImage.id
              ? {
                  ...updatedImageData,
                  // Preserve any local state
                  title: editTitle || null,
                  crop_shape: editShape,
                  content_type: editContentType || null,
                  content_group: editContentGroup.trim() || null,
                  image_url: finalImageUrl!,
                }
              : img
          );
          updateImages(updatedImages);
          toast.success("Image updated successfully");
        } catch (updateError: any) {
          console.error("Error updating image:", updateError);
          toast.error(updateError.message || "Failed to update image");
          return;
        }
      } else {
        // Temporary image - just update local state
        const updatedImages = localImages.map((img) =>
          img.id === editingImage.id
            ? {
                ...img,
                title: editTitle || null,
                crop_shape: editShape,
                content_type: editContentType || null,
                content_group: editContentGroup.trim() || null,
                image_url: finalImageUrl!,
              }
            : img
        );
        updateImages(updatedImages);
      }
    } else {
      // Create new image - save to database immediately if album ID is available
      if (albumId && albumId !== "new" && albumId !== "temp") {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              album_id: albumId,
              title: editTitle || null,
              image_url: finalImageUrl!,
              crop_shape: editShape,
              content_type: editContentType || null,
              content_group: editContentGroup.trim() || null,
              sort_order: localImages.length,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create image");
          }

          const createdImage = await response.json();

          // Add the new image with real database ID
          const updatedImages = [...localImages, {
            ...createdImage,
            // Preserve any local state
            title: editTitle || null,
            image_url: finalImageUrl!,
            crop_shape: editShape,
            content_type: editContentType || null,
            content_group: editContentGroup.trim() || null,
          }];
          updateImages(updatedImages);
          toast.success("Image added successfully");
        } catch (createError: any) {
          console.error("Error creating image:", createError);
          toast.error(createError.message || "Failed to create image");
          return;
        }
      } else {
        // No album ID yet (new album) - just update local state
        const newImage: AlbumImage = {
          id: `temp-${Date.now()}`,
          album_id: "", // Will be set by parent
          title: editTitle || null,
          image_url: finalImageUrl!,
          crop_shape: editShape,
          content_type: editContentType || null,
          content_group: editContentGroup.trim() || null,
          sort_order: localImages.length,
        };
        const updatedImages = [...localImages, newImage];
        updateImages(updatedImages);
      }
    }

    // Reset and close
    setIsEditModalOpen(false);
    setEditingImage(null);
    setEditTitle("");
    setEditShape("circle");
    setEditContentType(null);
    setEditContentGroup("");
    setEditImageUrl(null);
    setEditSelectedFile(null);
  };

  const handleCancel = () => {
    setIsEditModalOpen(false);
    setEditingImage(null);
    setEditTitle("");
    setEditShape("circle");
    setEditImageUrl(null);
    setEditSelectedFile(null);
  };

  const handleTitleUpdate = (id: string, title: string | null) => {
    const updatedImages = localImages.map((img) =>
      img.id === id ? { ...img, title } : img
    );
    updateImages(updatedImages);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Label className="text-base font-semibold">Content Images</Label>
        <Button type="button" onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>

      {localImages.length === 0 ? (
        <div
          className={cn(
            "text-sm text-muted-foreground py-12 border-2 border-dashed rounded-lg text-center bg-muted/20 dark:bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span>Click to add images</span>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localImages.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localImages.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onTitleUpdate={handleTitleUpdate}
                  albumId={albumId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Add Modal */}
      <ModalShell
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={editingImage ? "Edit Image" : "Add New Image"}
        maxWidth="2xl"
        maxHeight="90vh"
        showScroll={true}
        footer={
          <DialogFooter>
            <ShadowButton type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </ShadowButton>
            <ShadowButton
              type="button"
              onClick={handleSave}
              disabled={!editImageUrl && !editSelectedFile}
            >
              {editingImage ? "Update" : "Add"}
            </ShadowButton>
          </DialogFooter>
        }
      >
        <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <ShadowInput
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Vinyl 1 Side A"
              />
            </div>

            <div className="space-y-2">
              <Label>Crop Shape</Label>
              <RadioGroup value={editShape} onValueChange={(value) => setEditShape(value as "circle" | "square")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="circle" id="circle" />
                  <Label htmlFor="circle" className="flex items-center gap-2 cursor-pointer">
                    <Circle className="h-4 w-4" />
                    Circle
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="square" id="square" />
                  <Label htmlFor="square" className="flex items-center gap-2 cursor-pointer">
                    <Square className="h-4 w-4" />
                    Square
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Content Type (optional)</Label>
              <Select
                value={editContentType || "__none__"}
                onValueChange={(value) => setEditContentType(value === "__none__" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="vinyl_circle">Vinyl Circle</SelectItem>
                  <SelectItem value="vinyl_cover">Vinyl Cover</SelectItem>
                  <SelectItem value="album_cover">Album Cover</SelectItem>
                  <SelectItem value="booklet">Booklet</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                  <SelectItem value="digital_cover">Digital Cover</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Group (optional)</Label>
              <Select
                value={editContentGroup || "__none__"}
                onValueChange={(value) => setEditContentGroup(value === "__none__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="side_a">Side A</SelectItem>
                  <SelectItem value="side_b">Side B</SelectItem>
                  <SelectItem value="side_c">Side C</SelectItem>
                  <SelectItem value="side_d">Side D</SelectItem>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <ContentImageUploadField
                value={editImageUrl}
                onChange={(url) => setEditImageUrl(url)}
                onFileChange={(file) => setEditSelectedFile(file)}
                folderPath={folderPath}
                coverImageUrl={coverImageUrl}
                cropShape={editShape}
                placeholder="https://example.com/content-image.jpg"
              />
            </div>
          </div>
      </ModalShell>

      {/* View Image Modal */}
      {viewingImage && (
        <MediaPreviewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          mediaUrl={viewingImage.image_url}
          mediaName={viewingImage.title || undefined}
          mediaType="image"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{imageToDelete?.title || "Untitled"}"? This action cannot be undone and the image file will be moved to trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

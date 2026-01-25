"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, FileImage, ZoomIn, ZoomOut, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ShadowInput } from "./ShadowInput";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ContentImageUploadFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  onFileChange?: (file: File | null) => void;
  folderPath: string;
  error?: string;
  placeholder?: string;
  coverImageUrl?: string | null; // Cover image URL to use as source
  cropShape: "circle" | "square"; // Shape of the crop
};

const CROP_SIZE = 2048; // Output size for the cropped image (high quality for YouTube and other uses)

// Helper function to create a cropped image (circle or square)
async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  shape: "circle" | "square"
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas size to crop size
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

  // Create clipping path based on shape
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
  } else {
    // Square: no clipping needed, just draw the image
  }

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    CROP_SIZE,
    CROP_SIZE
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob"));
          return;
        }
        const fileName = shape === "circle" ? "circle_image.png" : "square_image.png";
        const file = new File([blob], fileName, { type: "image/png" });
        resolve(file);
      },
      "image/png"
    );
  });
}

export function ContentImageUploadField({
  value,
  onChange,
  onFileChange,
  folderPath,
  error,
  placeholder = "https://example.com/content-image.jpg",
  coverImageUrl,
  cropShape,
}: ContentImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [hideSurrounding, setHideSurrounding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const zoomIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moveAnimationRef = useRef<number | null>(null);
  const moveDirectionRef = useRef<{ x: number; y: number } | null>(null);
  const isMovingRef = useRef(false);

  // Update preview when value changes (but not if we have a selected file)
  useEffect(() => {
    // Only update if we don't have a selected file (to prevent overriding cropped preview)
    if (!selectedFile) {
      setPreviewUrl(value || null);
      setUrlInput(value || "");
      setImageLoadError(false);
    }
  }, [value, selectedFile]);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload an image file (JPG, PNG, WebP, or GIF)."
        );
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size exceeds 10MB limit.");
        return;
      }

      // Open crop modal with the selected file
      const preview = URL.createObjectURL(file);
      setCropImageSrc(preview);
      setIsCropModalOpen(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setUrlInput(""); // Clear URL input when file is selected
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      setUrlInput(newUrl);
      setImageLoadError(false);
      // Clear file selection when URL is entered
      if (newUrl) {
        setSelectedFile(null);
        onFileChange?.(null);
        setPreviewUrl(newUrl);
        onChange(newUrl || null);
      } else {
        setPreviewUrl(null);
        onChange(null);
      }
    },
    [onChange, onFileChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setPreviewUrl(null);
    setUrlInput("");
    setSelectedFile(null);
    setImageLoadError(false);
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Clean up object URL if it exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (cropImageSrc && cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }
  }, [onChange, onFileChange, previewUrl, cropImageSrc]);

  const handleImageError = useCallback(() => {
    setImageLoadError(true);
    setPreviewUrl(null);
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditClick = () => {
    if (previewUrl) {
      // If we have a preview URL, we need to fetch it and open crop modal
      setCropImageSrc(previewUrl);
      setIsCropModalOpen(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const handleUseCoverImage = () => {
    if (coverImageUrl) {
      setCropImageSrc(coverImageUrl);
      setIsCropModalOpen(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } else {
      toast.error("No cover image available to use");
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCommitCrop = useCallback(async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      toast.error("Please adjust the crop before committing");
      return;
    }

    try {
      // Create cropped image
      const croppedFile = await createCroppedImage(cropImageSrc, croppedAreaPixels, cropShape);
      
      // Store the file
      setSelectedFile(croppedFile);
      const preview = URL.createObjectURL(croppedFile);
      setPreviewUrl(preview);
      onChange(null); // Clear the URL value, file will be uploaded on save
      onFileChange?.(croppedFile);

      // Close modal and clean up
      setIsCropModalOpen(false);
      if (cropImageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(cropImageSrc);
      }
      setCropImageSrc(null);
      
      toast.success("Image cropped successfully");
    } catch (error: any) {
      console.error("Error cropping image:", error);
      toast.error(error.message || "Failed to crop image");
    }
  }, [cropImageSrc, croppedAreaPixels, cropShape, onChange, onFileChange]);

  const handleCancelCrop = useCallback(() => {
    setIsCropModalOpen(false);
    if (cropImageSrc && cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    // Clear any active intervals and animations
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
    if (moveAnimationRef.current !== null) {
      cancelAnimationFrame(moveAnimationRef.current);
      moveAnimationRef.current = null;
    }
    isMovingRef.current = false;
    moveDirectionRef.current = null;
  }, [cropImageSrc]);

  // Keyboard shortcuts for crop modal
  useEffect(() => {
    if (!isCropModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default if we're handling the key
      if (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "_" || 
          e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Don't prevent if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
      }

      // Zoom in with + or =
      if (e.key === "+" || e.key === "=") {
        setZoom((prev) => Math.min(3, prev + 0.001));
        // Start continuous zoom if not already started
        if (!zoomIntervalRef.current) {
          zoomIntervalRef.current = setInterval(() => {
            setZoom((prev) => {
              const newZoom = Math.min(3, prev + 0.001);
              if (newZoom >= 3) {
                if (zoomIntervalRef.current) {
                  clearInterval(zoomIntervalRef.current);
                  zoomIntervalRef.current = null;
                }
              }
              return newZoom;
            });
          }, 16); // Update every ~16ms (60fps) for very smooth continuous zoom
        }
      }

      // Zoom out with - or _
      if (e.key === "-" || e.key === "_") {
        setZoom((prev) => Math.max(0.95, prev - 0.001));
        // Start continuous zoom out if not already started
        if (!zoomIntervalRef.current) {
          zoomIntervalRef.current = setInterval(() => {
            setZoom((prev) => {
              const newZoom = Math.max(0.95, prev - 0.001);
              if (newZoom <= 0.95) {
                if (zoomIntervalRef.current) {
                  clearInterval(zoomIntervalRef.current);
                  zoomIntervalRef.current = null;
                }
              }
              return newZoom;
            });
          }, 16); // Update every ~16ms (60fps) for very smooth continuous zoom
        }
      }

      // Move crop position with arrow keys (smooth continuous movement using requestAnimationFrame)
      const moveStep = 0.5; // pixels to move per frame
      let direction = { x: 0, y: 0 };
      
      if (e.key === "ArrowUp") {
        direction = { x: 0, y: -moveStep };
      } else if (e.key === "ArrowDown") {
        direction = { x: 0, y: moveStep };
      } else if (e.key === "ArrowLeft") {
        direction = { x: -moveStep, y: 0 };
      } else if (e.key === "ArrowRight") {
        direction = { x: moveStep, y: 0 };
      }

      if (direction.x !== 0 || direction.y !== 0) {
        // Update direction
        moveDirectionRef.current = direction;
        
        // Start continuous movement using requestAnimationFrame for smooth animation
        if (!isMovingRef.current) {
          isMovingRef.current = true;
          const animate = () => {
            if (moveDirectionRef.current && isMovingRef.current) {
              const direction = moveDirectionRef.current;
              if (direction) {
                setCrop((prev) => ({ 
                  x: prev.x + direction.x, 
                  y: prev.y + direction.y 
                }));
                moveAnimationRef.current = requestAnimationFrame(animate);
              }
            }
          };
          moveAnimationRef.current = requestAnimationFrame(animate);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Stop continuous zoom when key is released
      if (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "_") {
        if (zoomIntervalRef.current) {
          clearInterval(zoomIntervalRef.current);
          zoomIntervalRef.current = null;
        }
      }
      
      // Stop continuous movement when arrow key is released
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || 
          e.key === "ArrowLeft" || e.key === "ArrowRight") {
        isMovingRef.current = false;
        if (moveAnimationRef.current !== null) {
          cancelAnimationFrame(moveAnimationRef.current);
          moveAnimationRef.current = null;
        }
        moveDirectionRef.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Clean up intervals and animations on unmount
      if (zoomIntervalRef.current) {
        clearInterval(zoomIntervalRef.current);
        zoomIntervalRef.current = null;
      }
      if (moveAnimationRef.current !== null) {
        cancelAnimationFrame(moveAnimationRef.current);
        moveAnimationRef.current = null;
      }
      isMovingRef.current = false;
      moveDirectionRef.current = null;
    };
  }, [isCropModalOpen]);

  const previewClassName = cropShape === "circle" ? "rounded-full" : "rounded-lg";
  const cropShapeValue = cropShape === "circle" ? "round" : "rect";
  const modalTitle = `Crop Image to ${cropShape === "circle" ? "Circle" : "Square"}`;

  return (
    <>
      <div className="space-y-3">
        {/* Compact Layout: Preview + Upload button */}
        <div className="flex gap-4 items-start">
          {/* Image Preview - Shape based on cropShape */}
          <Card
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={previewUrl ? handleEditClick : handleBrowseClick}
            className={cn(
              "relative border-2 border-dashed transition-all cursor-pointer overflow-hidden",
              "flex-shrink-0 w-32 h-32",
              previewClassName,
              isDragging
                ? "border-primary bg-primary/10 scale-105"
                : "border-muted-foreground/25 hover:border-primary/40 hover:bg-primary/5",
              previewUrl && !imageLoadError && "border-solid border-primary/20",
              previewUrl &&
                !imageLoadError &&
                "[&:hover_.image-overlay]:opacity-100 [&:hover_.image-remove-btn]:opacity-100"
            )}
          >
            {previewUrl && !imageLoadError ? (
              <>
                <img
                  src={previewUrl}
                  alt={`${cropShape} preview`}
                  className={cn("w-full h-full object-cover pointer-events-none", previewClassName)}
                  onError={handleImageError}
                />
                <div className={cn("image-overlay absolute inset-0 bg-black/60 opacity-0 transition-opacity flex items-center justify-center pointer-events-none", previewClassName)}>
                  <div className="text-center text-white">
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Edit</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="image-remove-btn absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity pointer-events-auto rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-3 text-center">
                <FileImage className="h-6 w-6 text-muted-foreground mb-1.5" />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {isDragging ? "Drop here" : "Click to upload"}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </Card>

          {/* URL Input - Compact */}
          <div className="flex-1 space-y-2">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ShadowInput
                type="url"
                placeholder={placeholder}
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>or</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                className="h-7 text-xs"
              >
                <Upload className="h-3 w-3 mr-1.5" />
                Browse
              </Button>
              {coverImageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseCoverImage();
                  }}
                  className="h-7 text-xs"
                >
                  Use Cover Image
                </Button>
              )}
              <span className="text-[10px]">
                Image will be cropped to a perfect {cropShape}
              </span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Crop Modal */}
      <ModalShell
        open={isCropModalOpen}
        onOpenChange={setIsCropModalOpen}
        title={modalTitle}
        maxWidth="2xl"
        contentClassName="[&:focus-visible]:outline-none [&:focus-visible]:ring-0"
      >
        <div className="space-y-4">
            {cropImageSrc && (
              <div 
                className="relative w-full crop-container flex items-center justify-center" 
                style={{ height: "400px", minWidth: "400px" }}
                tabIndex={-1}
              >
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .crop-container * {
                      outline: none !important;
                    }
                    .crop-container *:focus,
                    .crop-container *:focus-visible {
                      outline: none !important;
                      box-shadow: none !important;
                      ring: none !important;
                    }
                    .crop-container .reactEasyCrop_Container * {
                      outline: none !important;
                    }
                    .crop-container .reactEasyCrop_Container *:focus,
                    .crop-container .reactEasyCrop_Container *:focus-visible {
                      outline: none !important;
                      box-shadow: none !important;
                      ring: none !important;
                    }
                    .crop-container .reactEasyCrop_Container {
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                    }
                    ${cropShape === "circle" ? `
                    .crop-container .reactEasyCrop_CropAreaRound {
                      height: 400px !important;
                      width: 400px !important;
                    }
                    ` : `
                    .crop-container .reactEasyCrop_CropArea {
                      height: 400px !important;
                      width: 400px !important;
                    }
                    `}
                  `
                }} />
                
                {/* Floating toggle for hiding surrounding area */}
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-4 right-4 z-10">
                        <Switch
                          checked={hideSurrounding}
                          onCheckedChange={setHideSurrounding}
                          className="data-[state=checked]:bg-primary shadow-lg"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Hide surrounding area</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape={cropShapeValue as any}
                  minZoom={0.95}
                  maxZoom={3}
                  restrictPosition={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    },
                    mediaStyle: {
                      objectFit: "contain",
                    },
                    cropAreaStyle: hideSurrounding ? {
                      border: "none",
                      color: "rgba(0, 0, 0, 1)",
                    } : undefined,
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={0.95}
                  max={3}
                  step={0.001}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Use +/- keys or arrow keys to adjust
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCrop}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCommitCrop}
              disabled={!croppedAreaPixels}
            >
              <Check className="h-4 w-4 mr-2" />
              Commit
            </Button>
          </DialogFooter>
      </ModalShell>
    </>
  );
}

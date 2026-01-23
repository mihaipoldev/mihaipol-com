"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { cn } from "@/lib/utils";

type ArtworkUploaderProps = {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
};

const ALLOWED_TYPES = ["image/png", "image/jpg", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ArtworkUploader({
  onFileSelect,
  selectedFile,
  disabled = false,
}: ArtworkUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    dimensions: string;
    size: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Get image dimensions
      try {
        const dimensions = await getImageDimensions(file);
        setFileInfo({
          name: file.name,
          dimensions: `${dimensions.width} × ${dimensions.height}`,
          size: formatFileSize(file.size),
        });
      } catch (error) {
        setFileInfo({
          name: file.name,
          dimensions: "Unknown",
          size: formatFileSize(file.size),
        });
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

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

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect, disabled]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileInfo(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl, onFileSelect]);

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={cn(
          "relative border-2 border-dashed transition-all overflow-hidden",
          "min-h-[300px] rounded-lg",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer",
          isDragging && !disabled
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/40 hover:bg-primary/5",
          previewUrl && "border-solid border-primary/20"
        )}
      >
        {previewUrl ? (
          <div className="relative w-full h-full min-h-[300px]">
            <img
              src={previewUrl}
              alt="Artwork preview"
              className="w-full h-full object-contain pointer-events-none"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Replace</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
            <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging ? "Drop artwork here" : "Drag & drop artwork"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">or</p>
            <ShadowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </ShadowButton>
            <p className="text-xs text-muted-foreground mt-4">
              PNG, JPG, JPEG (max 10MB)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </Card>

      {fileInfo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">File:</span>
            <span className="font-medium">{fileInfo.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dimensions:</span>
            <span className="font-medium">{fileInfo.dimensions}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium">{fileInfo.size}</span>
          </div>
          {!disabled && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

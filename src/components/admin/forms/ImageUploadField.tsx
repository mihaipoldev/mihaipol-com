"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Link as LinkIcon, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ImageUploadFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  onFileChange?: (file: File | null) => void; // Callback for file changes
  folderPath: string; // e.g., "artists/123" or "albums/456"
  error?: string;
  placeholder?: string;
};

export function ImageUploadField({
  value,
  onChange,
  onFileChange,
  folderPath,
  error,
  placeholder = "https://example.com/image.jpg",
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Update preview when value changes
  useEffect(() => {
    setPreviewUrl(value || null);
    setUrlInput(value || "");
    setImageLoadError(false); // Reset error when value changes
  }, [value]);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload an image file (JPG, PNG, WebP, GIF, or SVG).");
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size exceeds 10MB limit.");
        return;
      }

      // Store the file and create a preview URL
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setUrlInput(""); // Clear URL input when file is selected
      setImageLoadError(false); // Reset error when file is selected
      onChange(null); // Clear the URL value, file will be uploaded on save
      onFileChange?.(file);
    },
    [onChange, onFileChange]
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
      setImageLoadError(false); // Reset error when URL changes
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
  }, [onChange, onFileChange, previewUrl]);

  const handleImageError = useCallback(() => {
    setImageLoadError(true);
    setPreviewUrl(null);
    // Don't clear the URL input or onChange - let user see the URL and fix it
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Compact Layout: Preview + URL Input side by side */}
      <div className="flex gap-4 items-start">
        {/* Image Preview - Compact */}
        <Card
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={cn(
            "relative border-2 border-dashed transition-all cursor-pointer overflow-hidden group",
            "flex-shrink-0 w-32 h-32 rounded-lg",
            isDragging
              ? "border-primary bg-primary/10 scale-105"
              : "border-muted-foreground/25 hover:border-primary/40 hover:bg-primary/5",
            previewUrl && !imageLoadError && "border-solid border-primary/20"
          )}
        >
          {previewUrl && !imageLoadError ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover pointer-events-none"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center text-white">
                  <Upload className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Replace</p>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
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
            <span className="text-[10px]">JPG, PNG, WebP, GIF, SVG (max 10MB)</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

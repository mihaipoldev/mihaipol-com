"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, Link as LinkIcon, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ImageUploadFieldProps = {
  value: string | null
  onChange: (url: string | null) => void
  onFileChange?: (file: File | null) => void // Callback for file changes
  folderPath: string // e.g., "artists/123" or "albums/456"
  error?: string
  placeholder?: string
}

export function ImageUploadField({
  value,
  onChange,
  onFileChange,
  folderPath,
  error,
  placeholder = "https://example.com/image.jpg",
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Update preview when value changes
  useEffect(() => {
    setPreviewUrl(value || null)
    setUrlInput(value || "")
    setImageLoadError(false) // Reset error when value changes
  }, [value])

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload an image file (JPG, PNG, WebP, or GIF).")
        return
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error("File size exceeds 10MB limit.")
        return
      }

      // Store the file and create a preview URL
      setSelectedFile(file)
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
      setUrlInput("") // Clear URL input when file is selected
      setImageLoadError(false) // Reset error when file is selected
      onChange(null) // Clear the URL value, file will be uploaded on save
      onFileChange?.(file)
    },
    [onChange, onFileChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [handleFileSelect]
  )

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      setUrlInput(newUrl)
      setImageLoadError(false) // Reset error when URL changes
      // Clear file selection when URL is entered
      if (newUrl) {
        setSelectedFile(null)
        onFileChange?.(null)
        setPreviewUrl(newUrl)
        onChange(newUrl || null)
      } else {
        setPreviewUrl(null)
        onChange(null)
      }
    },
    [onChange, onFileChange]
  )

  const handleRemove = useCallback(() => {
    onChange(null)
    setPreviewUrl(null)
    setUrlInput("")
    setSelectedFile(null)
    setImageLoadError(false)
    onFileChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    // Clean up object URL if it exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [onChange, onFileChange, previewUrl])

  const handleImageError = useCallback(() => {
    setImageLoadError(true)
    setPreviewUrl(null)
    // Don't clear the URL input or onChange - let user see the URL and fix it
  }, [])

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* URL Input - shown first */}
      <div className="space-y-2">
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder={placeholder}
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Upload Area - always shown, with image preview inside if available */}
      <Card
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={cn(
          "relative border-2 border-dashed transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          previewUrl && !imageLoadError && "border-solid"
        )}
        style={{ minHeight: '272px' }}
      >
        {previewUrl && !imageLoadError ? (
          <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '272px' }}>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[272px] w-auto object-contain pointer-events-none"
              onError={handleImageError}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Overlay hint when hovering */}
            <div className="absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click or drop to replace image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: '272px' }}>
            <div className="mb-4 rounded-full bg-muted p-4">
              <FileImage className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mb-2 text-sm font-medium">
              Drag and drop an image here, or click to browse
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Supports JPG, PNG, WebP, GIF (max 10MB)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseClick()
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}


"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Music, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AudioUploadFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  onFileChange?: (file: File | null) => void;
  onMetadataChange?: (metadata: { duration: number; fileSize: number }) => void;
  folderPath: string;
  error?: string;
  placeholder?: string;
};

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/flac",
  "audio/mp4",
  "audio/m4a",
  "audio/ogg",
  "audio/opus",
];

// Helper function to extract audio duration
async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.floor(audio.duration));
    });

    audio.addEventListener("error", (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load audio metadata"));
    });

    audio.src = objectUrl;
  });
}

export function AudioUploadField({
  value,
  onChange,
  onFileChange,
  onMetadataChange,
  folderPath,
  error,
  placeholder = "Upload audio file",
}: AudioUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Update preview when value changes (but not if we have a selected file)
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(value || null);
    }
  }, [value, selectedFile]);

  // Cleanup audio element
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload an audio file (MP3, WAV, FLAC, M4A, or OGG)."
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`);
        return;
      }

      // Extract metadata
      try {
        const audioDuration = await getAudioDuration(file);
        setDuration(audioDuration);
        setFileSize(file.size);
        onMetadataChange?.({ duration: audioDuration, fileSize: file.size });
      } catch (error) {
        console.error("Error extracting audio metadata:", error);
        // Continue anyway, just without duration
        setFileSize(file.size);
        onMetadataChange?.({ duration: 0, fileSize: file.size });
      }

      // Store the file and create a preview URL
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      onChange(null); // Clear the URL value, file will be uploaded on save
      onFileChange?.(file);
    },
    [onChange, onFileChange, onMetadataChange]
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

  const handleRemove = useCallback(() => {
    onChange(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setDuration(null);
    setFileSize(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onFileChange?.(null);
    onMetadataChange?.({ duration: 0, fileSize: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Clean up object URL if it exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [onChange, onFileChange, onMetadataChange, previewUrl]);

  const handlePlayPause = useCallback(() => {
    if (!previewUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(previewUrl);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audio.addEventListener("error", () => {
        toast.error("Failed to play audio");
        setIsPlaying(false);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        toast.error("Failed to play audio");
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [previewUrl, isPlaying]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Compact Layout: Preview + Upload button */}
      <div className="flex gap-4 items-start">
        {/* Audio Preview Card */}
        <Card
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={previewUrl ? undefined : handleBrowseClick}
          className={cn(
            "relative border-2 border-dashed transition-all overflow-hidden",
            "flex-shrink-0 w-32 h-32 rounded-lg",
            isDragging
              ? "border-primary bg-primary/10 scale-105"
              : "border-muted-foreground/25 hover:border-primary/40 hover:bg-primary/5",
            previewUrl && "border-solid border-primary/20 cursor-default",
            !previewUrl && "cursor-pointer"
          )}
        >
          {previewUrl ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  className="h-12 w-12 rounded-full bg-background/80 hover:bg-background"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 hover:opacity-100 transition-opacity rounded-full"
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
              <Music className="h-6 w-6 text-muted-foreground mb-1.5" />
              <p className="text-[10px] text-muted-foreground leading-tight">
                {isDragging ? "Drop here" : "Click to upload"}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/mp4,audio/m4a,audio/ogg"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </Card>

        {/* Info and Upload Button */}
        <div className="flex-1 space-y-2">
          {previewUrl && (
            <div className="space-y-1">
              {selectedFile && (
                <p className="text-sm font-medium">{selectedFile.name}</p>
              )}
              {duration !== null && (
                <p className="text-xs text-muted-foreground">
                  Duration: {formatDuration(duration)}
                </p>
              )}
              {fileSize !== null && (
                <p className="text-xs text-muted-foreground">
                  Size: {formatFileSize(fileSize)}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBrowseClick}
              className="h-7 text-xs"
            >
              <Upload className="h-3 w-3 mr-1.5" />
              {previewUrl ? "Replace" : "Browse"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Max 1GB • MP3, WAV, FLAC, M4A, OGG
            </span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

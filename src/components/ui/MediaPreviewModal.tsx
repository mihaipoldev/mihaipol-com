"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Play, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

type MediaPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  mediaName?: string;
  mediaType?: string;
};

export function ImagePreviewModal({
  open,
  onOpenChange,
  imageUrl,
  imageName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName?: string;
}) {
  // Legacy wrapper for backward compatibility
  return (
    <MediaPreviewModal
      open={open}
      onOpenChange={onOpenChange}
      mediaUrl={imageUrl}
      mediaName={imageName}
      mediaType="image"
    />
  );
}

export function MediaPreviewModal({
  open,
  onOpenChange,
  mediaUrl,
  mediaName,
  mediaType,
}: MediaPreviewModalProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Detect media type from URL if not provided
  const detectedType = mediaType || (() => {
    if (/\.(mp4|webm|mov|avi|mkv)$/i.test(mediaUrl)) return "video";
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(mediaUrl)) return "image";
    return "unknown";
  })();

  const isVideo = detectedType === "video" || detectedType?.startsWith("video/");
  const isImage = detectedType === "image" || detectedType?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-6 border-b border-border">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            {isVideo && <Play className="h-5 w-5" />}
            {isImage && <ImageIcon className="h-5 w-5" />}
            {mediaName || (isVideo ? "Video Preview" : "Preview")}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-auto max-h-[calc(90vh-100px)] flex flex-col bg-muted/30">
          <div className="flex-1 flex items-center justify-center">
            {isVideo ? (
              <div className="w-full flex items-center justify-center">
                <video
                  src={mediaUrl}
                  controls
                  autoPlay={isVideoPlaying}
                  className="max-w-full max-h-[calc(90vh-200px)] rounded-md"
                  onLoadedData={() => setIsVideoPlaying(true)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : isImage ? (
              <div className="w-full flex items-center justify-center">
                <img
                  src={mediaUrl}
                  alt={mediaName || "Preview"}
                  className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded-md"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-4">
                  Preview not available for this file type
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(mediaUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open File
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

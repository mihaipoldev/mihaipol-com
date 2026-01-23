"use client";

import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessingPreviewProps = {
  originalImageUrl?: string | null;
  processedImageUrl?: string | null;
  isProcessing?: boolean;
};

export function ProcessingPreview({
  originalImageUrl,
  processedImageUrl,
  isProcessing = false,
}: ProcessingPreviewProps) {
  return (
    <div className="space-y-4">
      <Card className="relative border-2 border-dashed min-h-[300px] rounded-lg overflow-hidden">
        {processedImageUrl ? (
          <div className="relative w-full h-full min-h-[300px]">
            <img
              src={processedImageUrl}
              alt="Processed artwork"
              className={cn(
                "w-full h-full object-contain pointer-events-none",
                isProcessing && "opacity-50"
              )}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Processed Preview
            </p>
            <p className="text-xs text-muted-foreground">
              Upload artwork to see preview
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

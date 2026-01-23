"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { FormField } from "@/components/admin/forms/FormField";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ArtworkUploader } from "./artwork-uploader";
import { ProcessingPreview } from "./processing-preview";
import { ProcessingStatus } from "./processing-status";
import type { ProcessingState, ProcessedImageResult, ArtworkShape } from "../../types";

type ArtworkProcessorProps = {
  albumId: string;
};

export function ArtworkProcessor({ albumId }: ArtworkProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ProcessedImageResult["metadata"] | null>(null);
  const [selectedShape, setSelectedShape] = useState<ArtworkShape>("circle");
  const [processingMethod, setProcessingMethod] = useState<"n8n" | "ai" | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setProcessedImageUrl(null);
    setError(null);
    setMetadata(null);
    
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
    } else {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
      setOriginalImageUrl(null);
    }
  };

  const handleProcess = async (method: "n8n" | "server") => {
    if (!selectedFile) return;

    setProcessingState("processing");
    setError(null);
    setProcessedImageUrl(null);
    setProcessingMethod(method);

    try {
      const formData = new FormData();
      formData.append("artwork", selectedFile);
      formData.append("format", "youtube");
      formData.append("shape", selectedShape);
      formData.append("processingMethod", method);

      const response = await fetch(
        `/api/albums/${albumId}/automations/process-artwork`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process artwork");
      }

      const result: ProcessedImageResult = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Processing failed");
      }

      setProcessedImageUrl(result.processedImageUrl);
      setMetadata(result.metadata);
      setProcessingMethod(result.method || method);
      setProcessingState("success");
      
      const methodLabel = result.method === "n8n" ? "n8n workflow" : "AI (Server)";
      toast.success(`Artwork processed successfully (${methodLabel})!`);
    } catch (err: any) {
      console.error("Error processing artwork:", err);
      setError(err.message || "Failed to process artwork");
      setProcessingState("error");
      setProcessingMethod(null);
      toast.error(err.message || "Failed to process artwork");
    }
  };

  const handleDownload = () => {
    if (!processedImageUrl) return;

    const link = document.createElement("a");
    link.href = processedImageUrl;
    link.download = `youtube-artwork-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessAgain = () => {
    setProcessedImageUrl(null);
    setError(null);
    setMetadata(null);
    setProcessingState("idle");
  };

  return (
    <div className="space-y-6">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div>
          <h3 className="text-sm font-medium mb-4">Upload Artwork</h3>
          <ArtworkUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            disabled={processingState === "processing"}
          />
        </div>

        {/* Right: Preview */}
        <div>
          <h3 className="text-sm font-medium mb-4">Processed Preview</h3>
          <ProcessingPreview
            originalImageUrl={originalImageUrl}
            processedImageUrl={processedImageUrl}
            isProcessing={processingState === "processing"}
          />
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Process Artwork for YouTube Format</CardTitle>
          <CardDescription>
            {selectedShape === "circle"
              ? "Circle: Extracts circular artwork or creates circle from square. Then: Resize to 1000px height, Center on 1920x1080 black canvas"
              : "Square: Preserves original square shape, removes background. Then: Resize to 1000px height, Center on 1920x1080 black canvas"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Shape Selector */}
      <FormField label="Artwork Shape">
        <RadioGroup
          value={selectedShape}
          onValueChange={(value) => setSelectedShape(value as ArtworkShape)}
          className="flex flex-row gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="circle" id="circle" />
            <Label htmlFor="circle" className="font-normal cursor-pointer">
              Circle
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="square" id="square" />
            <Label htmlFor="square" className="font-normal cursor-pointer">
              Square
            </Label>
          </div>
        </RadioGroup>
      </FormField>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <ShadowButton
          type="button"
          onClick={() => handleProcess("n8n")}
          disabled={!selectedFile || processingState === "processing"}
        >
          {processingState === "processing" && processingMethod === "n8n" ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing with n8n...
            </>
          ) : (
            "Process with n8n"
          )}
        </ShadowButton>
        <ShadowButton
          type="button"
          onClick={() => handleProcess("server")}
          disabled={!selectedFile || processingState === "processing"}
        >
          {processingState === "processing" && processingMethod === "server" ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing with AI...
            </>
          ) : (
            "Process with AI"
          )}
        </ShadowButton>

        {processingState === "success" && processedImageUrl && (
          <>
            <ShadowButton type="button" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </ShadowButton>
            <ShadowButton type="button" variant="outline" onClick={handleProcessAgain}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Process Again
            </ShadowButton>
          </>
        )}

        {processingState === "error" && (
          <ShadowButton type="button" variant="outline" onClick={handleProcessAgain}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </ShadowButton>
        )}
      </div>

      {/* Processing Status */}
      {processingState !== "idle" && (
        <ProcessingStatus
          state={processingState}
          error={error || undefined}
        />
      )}

      {/* Metadata Display */}
      {metadata && processingState === "success" && (
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {metadata.originalSize && (
                <div>
                  <p className="text-muted-foreground mb-1">Original Size</p>
                  <p className="font-medium">
                    {metadata.originalSize.width} × {metadata.originalSize.height}
                  </p>
                </div>
              )}
              {metadata.trimmedSize && (
                <div>
                  <p className="text-muted-foreground mb-1">Trimmed Size</p>
                  <p className="font-medium">
                    {metadata.trimmedSize.width} × {metadata.trimmedSize.height}
                  </p>
                </div>
              )}
              {metadata.finalSize && (
                <div>
                  <p className="text-muted-foreground mb-1">Final Size</p>
                  <p className="font-medium">
                    {metadata.finalSize.width} × {metadata.finalSize.height}
                  </p>
                </div>
              )}
              {metadata.processingTime !== undefined && (
                <div>
                  <p className="text-muted-foreground mb-1">Processing Time</p>
                  <p className="font-medium">{metadata.processingTime}ms</p>
                </div>
              )}
              {metadata.shapeProcessing && (
                <>
                  <div>
                    <p className="text-muted-foreground mb-1">Shape</p>
                    <p className="font-medium capitalize">{metadata.shapeProcessing.shape}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Processing Method</p>
                    <p className="font-medium capitalize">
                      {metadata.shapeProcessing.method === "extracted"
                        ? "Extracted Circle"
                        : metadata.shapeProcessing.method === "masked"
                          ? "Applied Circular Mask"
                          : "Preserved Square"}
                    </p>
                  </div>
                </>
              )}
              {processingMethod && (
                <div>
                  <p className="text-muted-foreground mb-1">Processing Method</p>
                  <p className="font-medium capitalize">
                    {processingMethod === "n8n" ? (
                      <span className="text-primary">n8n Workflow</span>
                    ) : (
                      <span className="text-primary">AI-Powered</span>
                    )}
                  </p>
                </div>
              )}
              {metadata.aiCropInfo && (
                <>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">AI Cropping</p>
                    <p className="font-medium">
                      {metadata.aiCropInfo.used ? (
                        <span className="text-primary">✓ AI-Powered</span>
                      ) : (
                        <span className="text-muted-foreground">Geometric Fallback</span>
                      )}
                    </p>
                    {metadata.aiCropInfo.cropCoordinates && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Crop: top={metadata.aiCropInfo.cropCoordinates.top.toFixed(3)}, bottom={metadata.aiCropInfo.cropCoordinates.bottom.toFixed(3)}, left={metadata.aiCropInfo.cropCoordinates.left.toFixed(3)}, right={metadata.aiCropInfo.cropCoordinates.right.toFixed(3)}
                      </p>
                    )}
                    {metadata.aiCropInfo.reasoning && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Reasoning: {metadata.aiCropInfo.reasoning}
                      </p>
                    )}
                    {metadata.aiCropInfo.rawResponse && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Show AI Raw Response
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                          {metadata.aiCropInfo.rawResponse}
                        </pre>
                      </details>
                    )}
                    {metadata.aiCropInfo.fallbackReason && (
                      <p className="text-xs text-muted-foreground mt-1 text-orange-500">
                        ⚠ Fallback: {metadata.aiCropInfo.fallbackReason}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

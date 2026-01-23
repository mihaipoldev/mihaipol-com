import { NextRequest } from "next/server";
import { badRequest, serverError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import sharp from "sharp";
import { processArtworkForYouTube } from "@/features/automations/lib/image-processing";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpg", "image/jpeg"];
const N8N_ARTWORK_WEBHOOK_URL = process.env.N8N_ARTWORK_WEBHOOK_URL;
const N8N_REQUEST_TIMEOUT = 30000; // 30 seconds

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { albumId } = await params;

    // Parse form data
    const formData = await request.formData();
    const artworkFile = formData.get("artwork") as File | null;
    const format = formData.get("format") as string | null;
    const shape = (formData.get("shape") as string | null) || "circle";
    const processingMethod = (formData.get("processingMethod") as string | null) || "n8n"; // "n8n" or "server"

    // Validate inputs
    if (!artworkFile) {
      return badRequest("No artwork file provided");
    }

    if (!format || format !== "youtube") {
      return badRequest("Invalid format. Only 'youtube' is supported.");
    }

    // Validate shape
    if (shape !== "circle" && shape !== "square") {
      return badRequest("Invalid shape. Must be 'circle' or 'square'.");
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(artworkFile.type)) {
      return badRequest(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (artworkFile.size > MAX_FILE_SIZE) {
      return badRequest(
        `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Convert file to buffer
    const arrayBuffer = await artworkFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Get image metadata (width and height)
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width || 0;
    const imageHeight = imageMetadata.height || 0;

    // Log original file info
    console.log(`[${processingMethod}] Received file:`, {
      name: artworkFile.name,
      size: artworkFile.size,
      mimetype: artworkFile.type,
      width: imageWidth,
      height: imageHeight,
    });

    // Route to appropriate processing method
    if (processingMethod === "server") {
      // Server-side processing with Gemini 2.5 Pro
      console.log("[Server] Using server-side AI processing...");
      const { buffer, metadata } = await processArtworkForYouTube(
        imageBuffer,
        shape as "circle" | "square"
      );

      // Convert to base64 data URL
      const base64 = buffer.toString("base64");
      const mimeType = "image/jpeg";
      const processedImageUrl = `data:${mimeType};base64,${base64}`;

      return ok({
        success: true,
        processedImageUrl,
        metadata,
        method: "ai",
      });
    }

    // n8n processing (default)
    if (!N8N_ARTWORK_WEBHOOK_URL) {
      return badRequest("N8N_ARTWORK_WEBHOOK_URL is not configured. Please set the environment variable.");
    }

    // Create FormData for n8n webhook
    const n8nFormData = new FormData();
    const fileBlob = new Blob([imageBuffer], { type: artworkFile.type });
    n8nFormData.append("artwork", fileBlob, artworkFile.name);
    n8nFormData.append("format", format);
    n8nFormData.append("shape", shape);
    n8nFormData.append("albumId", albumId);
    n8nFormData.append("imageWidth", imageWidth.toString());
    n8nFormData.append("imageHeight", imageHeight.toString());

    // Send to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_REQUEST_TIMEOUT);

    try {
      console.log("[n8n] Sending request to webhook:", N8N_ARTWORK_WEBHOOK_URL);
      
      const n8nResponse = await fetch(N8N_ARTWORK_WEBHOOK_URL, {
        method: "POST",
        body: n8nFormData,
        signal: controller.signal,
        // Don't set Content-Type header - let FormData set it with boundary
      });

      clearTimeout(timeoutId);

      console.log("[n8n] Response status:", n8nResponse.status, n8nResponse.statusText);
      console.log("[n8n] Response content-type:", n8nResponse.headers.get("content-type"));

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error("[n8n] Error response:", errorText);
        throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${errorText}`);
      }

      // Check content type to determine if response is binary image or JSON
      const contentType = n8nResponse.headers.get("content-type") || "";
      const isImage = contentType.startsWith("image/");

      console.log("[n8n] Is image response:", isImage, "Content-Type:", contentType);

      if (isImage) {
        // Handle binary image response
        console.log("[n8n] Processing binary image response");
        try {
          const imageBuffer = Buffer.from(await n8nResponse.arrayBuffer());
          const base64 = imageBuffer.toString("base64");
          const processedImageUrl = `data:${contentType};base64,${base64}`;

          console.log("[n8n] Successfully converted binary image to base64, size:", imageBuffer.length);

          return ok({
            success: true,
            processedImageUrl,
            metadata: {},
            method: "n8n",
          });
        } catch (imageError: any) {
          console.error("[n8n] Error processing binary image:", imageError);
          throw new Error(`Failed to process binary image: ${imageError.message}`);
        }
      } else {
        // Handle JSON response
        console.log("[n8n] Processing JSON response");
        try {
          const n8nResult = await n8nResponse.json();

          if (!n8nResult.success) {
            throw new Error(n8nResult.error || "n8n processing failed");
          }

          if (!n8nResult.imageUrl && !n8nResult.base64Image) {
            throw new Error("n8n response missing imageUrl or base64Image");
          }

          console.log("[n8n] Processing successful");

          // Use imageUrl (CDN) if available, otherwise use base64Image
          const processedImageUrl = n8nResult.imageUrl || n8nResult.base64Image;

          // Return n8n result directly
          return ok({
            success: true,
            processedImageUrl,
            metadata: n8nResult.metadata || {},
            method: "n8n",
          });
        } catch (jsonError: any) {
          console.error("[n8n] Error parsing JSON response:", jsonError);
          throw new Error(`Failed to parse n8n JSON response: ${jsonError.message}`);
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.error("[n8n] Fetch error:", fetchError);
      
      if (fetchError.name === "AbortError") {
        throw new Error("n8n webhook request timed out");
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Error processing artwork:", error);
    return serverError(
      "Failed to process artwork",
      error?.message || "Unknown error"
    );
  }
}

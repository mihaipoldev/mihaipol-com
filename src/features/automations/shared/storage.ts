import { uploadToBunny } from "@/lib/bunny";

/**
 * Upload a file buffer to storage (Bunny CDN)
 * @param buffer - The file buffer to upload
 * @param path - The storage path (e.g., "processed-images/run-id-image-id.jpg")
 * @param contentType - The content type (default: "image/jpeg")
 * @returns The full CDN URL of the uploaded file
 */
export async function uploadToStorage(
  buffer: Buffer,
  path: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  console.log(`[Storage] Uploading file to: ${path}`);
  const url = await uploadToBunny(buffer, path);
  console.log(`[Storage] Uploaded file to: ${url}`);
  return url;
}

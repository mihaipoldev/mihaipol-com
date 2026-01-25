import { formatDistanceToNow } from "date-fns";

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

/**
 * Format a cost amount as currency (e.g., "$0.15")
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Calculate duration between two timestamps
 */
export function formatDuration(started: string, completed: string | null): string {
  if (!completed) return "—";
  try {
    const start = new Date(started);
    const end = new Date(completed);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds % 60}s`;
    } else {
      return `${diffSeconds}s`;
    }
  } catch {
    return "—";
  }
}

/**
 * Parse and format output files from jsonb
 */
export function parseOutputFiles(outputFiles: Record<string, any> | null): Array<{
  name: string;
  url: string;
  type?: string;
}> {
  if (!outputFiles) return [];

  // Handle static video renderer output format: { videos: [{ video_url, processed_image_url, ... }] }
  if (outputFiles.videos && Array.isArray(outputFiles.videos)) {
    const files: Array<{ name: string; url: string; type?: string }> = [];
    
    outputFiles.videos.forEach((video: any, index: number) => {
      // Add video URL if available
      if (video.video_url) {
        files.push({
          name: video.track_name 
            ? `Video ${index + 1} - ${video.track_name}`
            : `Video ${index + 1}`,
          url: video.video_url,
          type: "video/mp4",
        });
      }
      // Add processed image URL if available (for preview)
      if (video.processed_image_url) {
        files.push({
          name: video.track_name 
            ? `Image ${index + 1} - ${video.track_name}`
            : `Processed Image ${index + 1}`,
          url: video.processed_image_url,
          type: "image/jpeg",
        });
      }
    });
    
    return files;
  }

  // Handle different output file formats
  if (Array.isArray(outputFiles)) {
    return outputFiles.map((file: any) => ({
      name: file.name || file.filename || "File",
      url: file.url || file.download_url || file.processed_image_url || "",
      type: file.type || file.mime_type,
    }));
  }

  if (typeof outputFiles === "object") {
    // If it's an object with files array
    if (outputFiles.files && Array.isArray(outputFiles.files)) {
      return outputFiles.files.map((file: any) => ({
        name: file.name || file.filename || "File",
        url: file.url || file.download_url || file.processed_image_url || "",
        type: file.type || file.mime_type,
      }));
    }

    // If it's a flat object with file URLs
    return Object.entries(outputFiles).map(([key, value]) => ({
      name: key,
      url: typeof value === "string" ? value : (value as any)?.url || (value as any)?.processed_image_url || "",
      type: (value as any)?.type,
    }));
  }

  return [];
}

import { formatDistanceToNow } from "date-fns";

/**
 * Format a timestamp as relative time (e.g., "2 months ago")
 * @param dateString - ISO date string or null
 * @returns Formatted relative time string or empty string if null
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

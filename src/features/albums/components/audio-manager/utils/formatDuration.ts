/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds (can be null)
 * @returns Formatted string like "3:45" or "0:00" if null
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

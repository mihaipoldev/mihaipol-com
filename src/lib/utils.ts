import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to "Day Month" format (e.g., "15 March")
 * @param dateString - Date string or null
 * @returns Formatted date string or empty string if null
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
}

/**
 * Formats an event date string to "Day Month" format (e.g., "15 March")
 * @param dateString - Date string (required for events)
 * @returns Formatted date string
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
}

/**
 * Formats a date string to "Day Mon Year" format (e.g., "1 Mar 2025")
 * Used for blog-style detail pages
 * @param dateString - Date string or null
 * @returns Formatted date string or empty string if null
 */
export function formatDetailDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

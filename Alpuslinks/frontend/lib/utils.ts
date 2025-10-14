import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a URL by adding https:// prefix if missing
 * Examples:
 * - "portotheme.com" -> "https://portotheme.com"
 * - "https://portotheme.com" -> "https://portotheme.com"
 * - "http://portotheme.com" -> "http://portotheme.com"
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url
  }

  const trimmedUrl = url.trim()
  
  // If URL already has a protocol, return as is
  if (trimmedUrl.match(/^https?:\/\//)) {
    return trimmedUrl
  }
  
  // If URL doesn't have a protocol, add https://
  return `https://${trimmedUrl}`
}
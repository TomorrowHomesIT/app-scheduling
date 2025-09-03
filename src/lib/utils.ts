import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

export function getGoogleDriveWebViewLink(googleDriveId: string): string {
  return `https://drive.google.com/file/d/${googleDriveId}/view`;
}

export function isValidGoogleDriveId(id: string): boolean {
  // Google Drive IDs are typically alphanumeric strings with hyphens and underscores
  // They're usually 28-33 characters long but can vary
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

/**
 * Extract ID from various Google Drive URL formats
 * Handles:
 * - https://drive.google.com/file/d/{id}/view
 * - https://drive.google.com/file/d/{id}/edit
 * - https://drive.google.com/uc?id={id}&export=download
 * - https://drive.google.com/open?id={id}
 * - Direct ID input
 * @param url
 * @returns
 */
export function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    // webViewLink format: /file/d/{id}/view or /file/d/{id}/edit
    /\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/,
    // webContentLink format: ?id={id} or &id={id}
    /[?&]id=([a-zA-Z0-9_-]+)(?:&|$)/,
    // open link format: /open?id={id}
    /\/open\?id=([a-zA-Z0-9_-]+)(?:&|$)/,
    // Direct ID (if someone just pastes the ID)
    /^([a-zA-Z0-9_-]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

import type { IJobTaskUrl } from "@/models/job.model";

/**
 * Validates that a IJobTaskUrl object has the correct structure
 * Must have:
 * - name (string)
 * - Either googleDriveId (string) OR url (string)
 */
export function isValidJobTaskUrl(link: unknown): link is IJobTaskUrl {
  if (!link || typeof link !== "object") {
    return false;
  }

  const obj = link as Record<string, unknown>;

  // Must have a name
  if (typeof obj.name !== "string" || !obj.name.trim()) {
    return false;
  }

  // Must have either googleDriveId or url (but not necessarily both)
  const hasGoogleDriveId = typeof obj.googleDriveId === "string" && obj.googleDriveId.trim().length > 0;
  const hasUrl = typeof obj.url === "string" && obj.url.trim().length > 0;

  if (!hasGoogleDriveId && !hasUrl) {
    return false;
  }

  // If it has extra properties besides name, googleDriveId, and url, that's okay
  // We only care that the required properties are present and valid
  return true;
}

/**
 * Validates an array of IJobTaskUrl objects
 * Returns an error message if validation fails, or null if valid
 */
export function validateJobTaskUrls(links: unknown): string | null {
  if (!Array.isArray(links)) {
    return "Links must be an array";
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (!isValidJobTaskUrl(link)) {
      return `Invalid link at index ${i}: must have a name and either a googleDriveId or url`;
    }
  }

  return null; // Valid
}

import { put, del } from '@vercel/blob';

// Vercel serverless body limit is 4.5 MB. Keep a safety margin under that so
// requests don't 413 at the platform edge before we ever see them.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface SaveFileResult {
  success: boolean;
  /** Full HTTPS URL of the uploaded blob (returned by Vercel Blob). */
  url?: string;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 4MB' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File must be a JPG or PNG image' };
  }
  return { valid: true };
}

/**
 * Upload a file to Vercel Blob under the given prefix (e.g. `competitors`,
 * `duels`). Returns the full HTTPS URL to store in the DB. The Blob SDK reads
 * `BLOB_READ_WRITE_TOKEN` from env automatically.
 */
export async function saveUploadedFile(
  file: File,
  prefix: string = 'competitors'
): Promise<SaveFileResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safePrefix = prefix.replace(/^\/+|\/+$/g, '');
    // `addRandomSuffix: true` lets Blob avoid collisions; the returned URL is
    // the source of truth (the pathname embeds the random part).
    const blob = await put(`${safePrefix}/upload.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}

/**
 * Delete a previously uploaded blob by its full URL. No-op if URL is empty or
 * doesn't look like a blob URL (e.g. legacy `/uploads/...` paths from before
 * the migration — those have no Blob to delete).
 */
export async function deleteUploadedFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  if (!url.startsWith('http')) {
    // Legacy local /uploads/... path. Not in Blob; nothing to delete remotely.
    return false;
  }
  try {
    await del(url);
    return true;
  } catch (error: any) {
    console.error('Error deleting blob:', error);
    return false;
  }
}

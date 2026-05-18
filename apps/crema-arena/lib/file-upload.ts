import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'competitors');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface SaveFileResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

/**
 * Validate uploaded file size and type
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 5MB',
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be a JPG or PNG image',
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  return `${timestamp}-${randomString}${extension}`;
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(file: File): Promise<SaveFileResult> {
  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.name);
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Convert file to buffer and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    return {
      success: true,
      fileName,
    };
  } catch (error: any) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: 'Failed to save file to disk',
    };
  }
}

/**
 * Delete file from disk
 */
export async function deleteUploadedFile(fileName: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);

    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get public URL for uploaded file
 */
export function getFileUrl(fileName: string): string {
  return `/uploads/competitors/${fileName}`;
}

/**
 * Extract filename from photo URL
 */
export function getFileNameFromUrl(photoUrl: string): string {
  return path.basename(photoUrl);
}

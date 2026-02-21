/**
 * File system utilities for CLI operations.
 * Provides atomic file writes and safe file operations.
 */

import { readFile, writeFile, mkdir, access, stat, rename, unlink } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Reads a file and returns its contents as a string.
 * @param filePath - Path to the file
 * @returns File contents
 * @throws Error if file cannot be read
 */
export async function readTextFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString('utf-8');
}

/**
 * Reads a file and parses it as JSON.
 * @param filePath - Path to the file
 * @returns Parsed JSON object
 * @throws Error if file cannot be read or parsed
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readTextFile(filePath);
  return JSON.parse(content) as T;
}

/**
 * Writes text content to a file.
 * @param filePath - Path to the file
 * @param content - Content to write
 */
export async function writeTextFile(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, 'utf-8');
}

/**
 * Writes an object as JSON to a file.
 * @param filePath - Path to the file
 * @param data - Data to write
 * @param pretty - Whether to format with indentation
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  pretty = true
): Promise<void> {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeTextFile(filePath, content);
}

/**
 * Checks if a file exists.
 * @param filePath - Path to check
 * @returns Whether the file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures a directory exists.
 * @param dirPath - Directory path
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Reads file content safely, returning null if file doesn't exist.
 * @param filePath - Path to the file
 * @returns File content or null if not exists
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Gets file stats (size and modification time).
 * @param filePath - Path to the file
 * @returns File stats or null if not exists
 */
export async function getFileStats(
  filePath: string
): Promise<{ size: number; mtime: Date } | null> {
  try {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * Writes file atomically (write to temp, then rename).
 * This ensures that readers never see a partially written file.
 * @param filePath - Final destination path
 * @param content - Content to write
 */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  
  // Ensure destination directory exists
  await ensureDir(dir);
  
  // Create temp file in the same directory for reliable rename
  const uniqueId = randomBytes(8).toString('hex');
  const baseName = basename(filePath);
  const tempPath = join(dir, `.tmp-${uniqueId}-${baseName}`);
  
  try {
    // Write to temp file
    await writeFile(tempPath, content, 'utf-8');
    
    // Atomic rename (on same filesystem)
    await rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Writes JSON file atomically.
 * @param filePath - Final destination path
 * @param data - Data to write
 * @param pretty - Whether to format with indentation
 */
export async function writeJsonFileAtomic<T>(
  filePath: string,
  data: T,
  pretty = true
): Promise<void> {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeFileAtomic(filePath, content);
}

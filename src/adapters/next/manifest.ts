/**
 * Manifest generation for Next.js static exports.
 */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ManifestItem, SiteManifest, PageManifest, BuildManifest } from '../../schema/manifest.schema.js';

/**
 * Next.js content manifest structure for fromNextContentManifest.
 */
export interface NextContentManifest {
  items: Array<{
    slug: string;
    locales?: string[];
    publishedAt?: string;
    updatedAt?: string;
    title?: string;
    description?: string;
    priority?: number;
    canonicalOverride?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Options for fromNextContentManifest.
 */
export interface FromNextContentManifestOptions {
  /** Prefix to add to all slugs */
  slugPrefix?: string;
  /** Default locale if not specified */
  defaultLocale?: string;
}

/**
 * Converts Next.js content manifest to llm-seo ManifestItem[].
 *
 * @param manifest - Next.js content manifest
 * @param options - Conversion options
 * @returns Normalized ManifestItem[] for use in config
 */
export function fromNextContentManifest(
  manifest: NextContentManifest,
  options: FromNextContentManifestOptions = {}
): ManifestItem[] {
  const { slugPrefix = '', defaultLocale } = options;

  return manifest.items.map((item): ManifestItem => {
    const result: ManifestItem = {
      slug: slugPrefix + item.slug,
    };

    if (item.locales !== undefined) {
      result.locales = item.locales;
    } else if (defaultLocale !== undefined) {
      result.locales = [defaultLocale];
    }

    if (item.publishedAt !== undefined) {
      result.publishedAt = item.publishedAt;
    }

    if (item.updatedAt !== undefined) {
      result.updatedAt = item.updatedAt;
    }

    if (item.title !== undefined) {
      result.title = item.title;
    }

    if (item.description !== undefined) {
      result.description = item.description;
    }

    if (item.priority !== undefined) {
      result.priority = item.priority;
    }

    if (item.canonicalOverride !== undefined) {
      result.canonicalOverride = item.canonicalOverride;
    }

    return result;
  });
}

/**
 * Options for createManifestFromPagesDir.
 */
export interface CreateManifestFromPagesDirOptions {
  /** Path to pages directory */
  pagesDir: string;
  /** Prefix to add to all routes */
  routePrefix?: string;
  /** Default locale for items */
  defaultLocale?: string;
  /** File extensions to include */
  extensions?: string[];
}

/**
 * Parsed frontmatter from a file.
 */
interface ParsedFrontmatter {
  title?: string;
  description?: string;
  date?: string;
  updated?: string;
  locale?: string;
  locales?: string[];
  priority?: number;
  [key: string]: unknown;
}

/**
 * Parses YAML-like frontmatter from content.
 * Simple implementation for basic frontmatter extraction.
 *
 * @param content - File content with potential frontmatter
 * @returns Parsed frontmatter and body content
 */
function parseFrontmatter(content: string): { frontmatter: ParsedFrontmatter; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1] ?? '';
  const body = match[2] ?? content;
  const frontmatter: ParsedFrontmatter = {};

  // Simple YAML-like parsing
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | string[] = line.slice(colonIndex + 1).trim();

    // Handle arrays in format [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter((item) => item.length > 0);
    } else {
      // Remove quotes
      value = value.replace(/^['"]|['"]$/g, '');
    }

    // Map to frontmatter fields
    if (key === 'title') frontmatter.title = value as string;
    else if (key === 'description') frontmatter.description = value as string;
    else if (key === 'date' || key === 'publishedAt') frontmatter.date = value as string;
    else if (key === 'updated' || key === 'updatedAt') frontmatter.updated = value as string;
    else if (key === 'locale') frontmatter.locale = value as string;
    else if (key === 'locales') frontmatter.locales = value as string[];
    else if (key === 'priority') frontmatter.priority = parseInt(value as string, 10);
    else frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Converts file path to URL slug.
 *
 * @param filePath - File path relative to pages dir
 * @param extensions - File extensions to strip
 * @returns URL slug
 */
function filePathToSlug(filePath: string, extensions: string[]): string {
  let slug = filePath;

  // Remove extension
  for (const ext of extensions) {
    if (slug.endsWith(ext)) {
      slug = slug.slice(0, -ext.length);
      break;
    }
  }

  // Handle index files
  if (slug.endsWith('/index')) {
    slug = slug.slice(0, -6);
  }
  if (slug === 'index') {
    slug = '';
  }

  // Ensure leading slash
  if (!slug.startsWith('/')) {
    slug = '/' + slug;
  }

  return slug || '/';
}

/**
 * Recursively scans directory for content files.
 *
 * @param dir - Directory to scan
 * @param extensions - File extensions to include
 * @param basePath - Base path for relative paths
 * @returns Array of relative file paths
 */
async function scanDirectory(
  dir: string,
  extensions: string[],
  basePath: string = ''
): Promise<string[]> {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? join(basePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath, extensions, relativePath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const hasValidExtension = extensions.some((ext) => entry.name.endsWith(ext));
      if (hasValidExtension) {
        files.push(relativePath);
      }
    }
  }

  return files;
}

/**
 * Creates manifest from Next.js pages directory.
 * Scans for .mdx, .md files and extracts frontmatter.
 *
 * @param options - Options for manifest creation
 * @returns Promise resolving to ManifestItem[]
 */
export async function createManifestFromPagesDir(
  options: CreateManifestFromPagesDirOptions
): Promise<ManifestItem[]> {
  const {
    pagesDir,
    routePrefix = '',
    defaultLocale,
    extensions = ['.mdx', '.md'],
  } = options;

  const files = await scanDirectory(pagesDir, extensions);
  const items: ManifestItem[] = [];

  for (const file of files) {
    const fullPath = join(pagesDir, file);
    const content = await readFile(fullPath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    const slug = routePrefix + filePathToSlug(file, extensions);

    const item: ManifestItem = {
      slug,
    };

    if (frontmatter.locales !== undefined) {
      item.locales = frontmatter.locales;
    } else if (frontmatter.locale !== undefined) {
      item.locales = [frontmatter.locale];
    } else if (defaultLocale !== undefined) {
      item.locales = [defaultLocale];
    }

    if (frontmatter.date !== undefined) {
      item.publishedAt = frontmatter.date;
    }

    if (frontmatter.updated !== undefined) {
      item.updatedAt = frontmatter.updated;
    }

    if (frontmatter.title !== undefined) {
      item.title = frontmatter.title;
    }

    if (frontmatter.description !== undefined) {
      item.description = frontmatter.description;
    }

    if (frontmatter.priority !== undefined) {
      item.priority = frontmatter.priority;
    }

    items.push(item);
  }

  // Sort by slug for deterministic output
  return items.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Options for createManifestFromData.
 */
export interface CreateManifestFromDataOptions {
  /** Prefix to add to all slugs */
  slugPrefix?: string;
  /** Default locale if not specified */
  defaultLocale?: string;
}

/**
 * Creates manifest from Next.js data (getStaticProps data).
 *
 * @param items - Array of items from getStaticProps
 * @param options - Options for manifest creation
 * @returns ManifestItem[]
 */
export function createManifestFromData(
  items: Array<{
    params: { slug: string | string[] };
    locale?: string;
    publishedAt?: string;
    updatedAt?: string;
    title?: string;
    description?: string;
    priority?: number;
    [key: string]: unknown;
  }>,
  options: CreateManifestFromDataOptions = {}
): ManifestItem[] {
  const { slugPrefix = '', defaultLocale } = options;

  return items.map((item): ManifestItem => {
    // Convert slug array or string to path
    const slugPath = Array.isArray(item.params.slug)
      ? '/' + item.params.slug.join('/')
      : item.params.slug.startsWith('/')
        ? item.params.slug
        : '/' + item.params.slug;

    const result: ManifestItem = {
      slug: slugPrefix + slugPath,
    };

    if (item.locale !== undefined) {
      result.locales = [item.locale];
    } else if (defaultLocale !== undefined) {
      result.locales = [defaultLocale];
    }

    if (item.publishedAt !== undefined) {
      result.publishedAt = item.publishedAt;
    }

    if (item.updatedAt !== undefined) {
      result.updatedAt = item.updatedAt;
    }

    if (item.title !== undefined) {
      result.title = item.title;
    }

    if (item.description !== undefined) {
      result.description = item.description;
    }

    if (item.priority !== undefined) {
      result.priority = item.priority;
    }

    return result;
  });
}

// ============================================================================
// Legacy functions - kept for backwards compatibility
// ============================================================================

/**
 * Options for Next.js manifest generation.
 */
export interface NextManifestOptions {
  /** Base URL for the site */
  baseUrl: string;
  /** Site title */
  title: string;
  /** Site description */
  description?: string;
  /** Path to the Next.js build manifest */
  buildManifestPath?: string;
}

/**
 * Extracts page paths from Next.js build manifest.
 * @param buildManifest - The Next.js build manifest
 * @returns Array of page paths
 */
export function extractPagePaths(buildManifest: BuildManifest): string[] {
  const pages: string[] = [];

  // Extract from static pages
  for (const pagePath of Object.keys(buildManifest.pages)) {
    // Skip Next.js internal routes
    if (pagePath.startsWith('/_')) {
      continue;
    }

    // Normalize the path
    const normalizedPath = normalizeNextPath(pagePath);
    pages.push(normalizedPath);
  }

  // Sort for deterministic output
  return pages.sort((a, b) => a.localeCompare(b));
}

/**
 * Normalizes a Next.js page path.
 * @param path - The page path
 * @returns Normalized path
 */
function normalizeNextPath(path: string): string {
  // Remove file extension if present
  let normalized = path.replace(/\.(html|json)$/, '');

  // Handle index pages
  if (normalized === '/index' || normalized === '') {
    normalized = '/';
  }

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

/**
 * Generates a site manifest from Next.js build output.
 * @param options - Manifest generation options
 * @param buildManifest - Optional build manifest
 * @returns Generated site manifest
 */
export function generateNextManifest(
  options: NextManifestOptions,
  buildManifest?: BuildManifest
): SiteManifest {
  const pages: PageManifest[] = [];

  if (buildManifest) {
    const pagePaths = extractPagePaths(buildManifest);

    for (const path of pagePaths) {
      pages.push({
        path,
        title: undefined, // Will be filled by crawler or manually
        description: undefined,
        optional: false,
      });
    }
  }

  return {
    baseUrl: options.baseUrl,
    title: options.title,
    description: options.description,
    pages,
  };
}

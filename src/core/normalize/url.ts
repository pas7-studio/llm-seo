/**
 * URL normalization utilities for deterministic SEO processing.
 */

/**
 * Options for URL normalization.
 */
export interface NormalizeUrlOptions {
  /** Base URL e.g., "https://example.com" */
  baseUrl: string;
  /** Path e.g., "/blog/my-post" */
  path: string;
  /** Trailing slash policy */
  trailingSlash: 'always' | 'never' | 'preserve';
  /** Strip query string (default: true) */
  stripQuery?: boolean;
  /** Strip hash/fragment (default: true) */
  stripHash?: boolean;
}

/**
 * Normalizes a path by removing double slashes and normalizing dots.
 * @param path - The path to normalize
 * @param preserveTrailingSlash - Whether to preserve trailing slash (default: false)
 * @returns The normalized path
 */
export function normalizePath(path: string, preserveTrailingSlash = false): string {
  // Handle empty path
  if (!path || path === '/') {
    return '/';
  }

  // Track if original path had trailing slash
  const hadTrailingSlash = path.endsWith('/') && path !== '/';

  // Ensure path starts with /
  let normalized = path.startsWith('/') ? path : `/${path}`;

  // Collapse multiple consecutive slashes into one
  normalized = normalized.replace(/\/{2,}/g, '/');

  // Handle . and .. segments
  const segments: string[] = [];
  const parts = normalized.split('/');

  for (const part of parts) {
    if (part === '.' || part === '') {
      // Skip current directory references and empty parts
      continue;
    } else if (part === '..') {
      // Go up one directory
      if (segments.length > 0) {
        segments.pop();
      }
    } else {
      segments.push(part);
    }
  }

  // Reconstruct path
  let result = '/' + segments.join('/');
  
  // Restore trailing slash if needed
  if (preserveTrailingSlash && hadTrailingSlash && result !== '/') {
    result += '/';
  }
  
  return result;
}

/**
 * Joins URL parts safely, handling slashes between parts.
 * @param parts - URL parts to join
 * @returns Joined path string
 */
export function joinUrlParts(...parts: string[]): string {
  if (parts.length === 0) {
    return '/';
  }

  // Filter out empty parts
  const filteredParts = parts.filter((part) => part.length > 0);

  if (filteredParts.length === 0) {
    return '/';
  }

  // Join parts, ensuring single slashes between them
  const joined = filteredParts
    .map((part) => {
      // Remove leading slash from all parts
      let p = part.replace(/^\/+/, '');
      // Remove trailing slash from all parts except we'll add at the end if needed
      p = p.replace(/\/+$/, '');
      return p;
    })
    .filter((p) => p.length > 0)
    .join('/');

  return joined.length > 0 ? `/${joined}` : '/';
}

/**
 * Validates that a URL is absolute with http/https protocol.
 * @param url - The URL string to validate
 * @returns True if the URL is a valid absolute http/https URL
 */
export function isValidAbsoluteUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes URL according to policy:
 * - No // in path (collapse to single /)
 * - Strip query and hash by default
 * - Apply trailing slash policy
 * - Lowercase hostname
 * - Remove default ports (80, 443)
 * @param options - Normalization options
 * @returns The normalized URL string
 */
export function normalizeUrl(options: NormalizeUrlOptions): string {
  const { baseUrl, path, trailingSlash, stripQuery = true, stripHash = true } = options;

  // Parse base URL
  let parsedBase: URL;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    throw new TypeError(`Invalid baseUrl: ${baseUrl}`);
  }

  // Normalize the path with trailing slash preservation flag
  const shouldPreserveTrailingSlash = trailingSlash === 'preserve';
  const normalizedPath = normalizePath(path, shouldPreserveTrailingSlash);

  // Apply trailing slash policy
  let finalPath = normalizedPath;
  if (trailingSlash === 'always') {
    // Always add trailing slash (except for root which already has it)
    if (!finalPath.endsWith('/')) {
      finalPath = `${finalPath}/`;
    }
  } else if (trailingSlash === 'never') {
    // Remove trailing slash (except for root)
    if (finalPath !== '/' && finalPath.endsWith('/')) {
      finalPath = finalPath.slice(0, -1);
    }
  }
  // 'preserve' - already handled by normalizePath

  // Build the full URL
  const protocol = parsedBase.protocol.toLowerCase();
  let hostname = parsedBase.hostname.toLowerCase();

  // Handle port - remove default ports
  let port = parsedBase.port;
  if (port) {
    const isDefaultPort =
      (protocol === 'http:' && port === '80') ||
      (protocol === 'https:' && port === '443');
    if (!isDefaultPort) {
      hostname = `${hostname}:${port}`;
    }
  }

  // Build the final URL
  let fullUrl = `${protocol}//${hostname}${finalPath}`;

  // Add query string if not stripped
  if (!stripQuery && parsedBase.search) {
    fullUrl += parsedBase.search;
  }

  // Add hash if not stripped
  if (!stripHash && parsedBase.hash) {
    fullUrl += parsedBase.hash;
  }

  return fullUrl;
}

/**
 * Sorts URLs deterministically for consistent output ordering.
 * @param urls - Array of URLs to sort
 * @returns Sorted array of URLs
 */
export function sortUrls(urls: readonly string[]): string[] {
  return [...urls].sort((a, b) => a.localeCompare(b));
}

/**
 * Deterministic sorting utilities for SEO artifacts.
 */

/**
 * Comparator function type for sorting operations.
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Creates a deterministic string comparator for consistent ordering.
 * Uses localeCompare with specific locale for reproducibility.
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'case', numeric: true });
}

/**
 * Sorts an array of strings deterministically.
 * @param items - Array of strings to sort
 * @returns New sorted array
 */
export function sortStrings(items: readonly string[]): string[] {
  return [...items].sort(compareStrings);
}

/**
 * Sorts an array of objects by a string key deterministically.
 * @param items - Array of objects to sort
 * @param keyFn - Function to extract the comparison key
 * @returns New sorted array
 */
export function sortBy<T>(items: readonly T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => compareStrings(keyFn(a), keyFn(b)));
}

/**
 * Sorts strings in a deterministic way (localeCompare with numeric).
 * Alias for sortStrings for API consistency.
 * @param items - Array of strings to sort
 * @returns New sorted array
 */
export function stableSortStrings(items: string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'case', numeric: true }));
}

/**
 * Sorts objects by key in a deterministic way.
 * @param items - Array of objects to sort
 * @param keyFn - Function to extract the comparison key
 * @returns New sorted array
 */
export function stableSortBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);
    return keyA.localeCompare(keyB, 'en', { sensitivity: 'case', numeric: true });
  });
}

/**
 * Counts the number of path segments in a URL.
 * @param url - The URL to count segments for
 * @returns Number of path segments
 */
function countPathSegments(url: string): number {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!path) return 0;
    return path.split('/').length;
  } catch {
    // If not a valid URL, count slashes in the string
    const cleaned = url.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!cleaned) return 0;
    return cleaned.split('/').length;
  }
}

/**
 * Sorts URLs by path segments (shorter first, then alphabetically).
 * This ensures deterministic ordering with root paths first.
 * @param urls - Array of URLs to sort
 * @returns New sorted array
 */
export function sortUrlsByPath(urls: string[]): string[] {
  return [...urls].sort((a, b) => {
    const segmentsA = countPathSegments(a);
    const segmentsB = countPathSegments(b);

    // First sort by number of segments (shorter paths first)
    if (segmentsA !== segmentsB) {
      return segmentsA - segmentsB;
    }

    // Then sort alphabetically
    return a.localeCompare(b, 'en', { sensitivity: 'case', numeric: true });
  });
}

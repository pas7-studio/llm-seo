/**
 * Text normalization utilities for deterministic SEO processing.
 */

/**
 * Normalizes whitespace in text by collapsing multiple spaces and trimming.
 * @param text - The text to normalize
 * @returns Normalized text with single spaces
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes line endings to the specified format.
 * @param text - The text to normalize
 * @param lineEndings - Target line endings format ('lf' or 'crlf')
 * @returns Text with normalized line endings
 */
export function normalizeLineEndings(text: string, lineEndings: 'lf' | 'crlf'): string {
  // First normalize all line endings to \n
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Then convert to target format
  return lineEndings === 'crlf' ? normalized.replace(/\n/g, '\r\n') : normalized;
}

/**
 * Normalizes whitespace in lines - trims trailing whitespace and removes multiple consecutive spaces.
 * @param text - The text to normalize
 * @returns Text with normalized line whitespace
 */
export function normalizeLineWhitespace(text: string): string {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => line.trimEnd().replace(/[ \t]+/g, (match) => ' '.repeat(match.length === 0 ? 0 : match.length)))
    .map((line) => line.replace(/  +/g, ' '))
    .join('\n');
}

/**
 * Normalizes text for use in SEO meta descriptions or titles.
 * Collapses whitespace and truncates to a maximum length.
 * @param text - The text to normalize
 * @param maxLength - Maximum allowed length
 * @returns Normalized text
 */
export function normalizeSeoText(text: string, maxLength: number): string {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  // Truncate at word boundary
  const truncated = normalized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? `${truncated.slice(0, lastSpace)}…` : `${truncated.slice(0, -1)}…`;
}

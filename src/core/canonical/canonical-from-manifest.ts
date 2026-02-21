/**
 * Canonical URL generation from site manifests.
 */

import type { SiteManifest, ManifestItem } from '../../schema/manifest.schema.js';
import { normalizeUrl, joinUrlParts } from '../normalize/url.js';
import { sortUrlsByPath } from '../normalize/sort.js';
import { selectCanonicalLocale } from './locale.js';

/**
 * Options for canonical URL generation.
 */
export interface CanonicalOptions {
  /** Whether to include trailing slash (default: false) */
  trailingSlash?: boolean;
  /** Whether to use lowercase (default: true) */
  lowercase?: boolean;
}

/**
 * Locale strategy for URL generation.
 */
export type LocaleStrategy = 'prefix' | 'subdomain' | 'none';

/**
 * Trailing slash policy.
 */
export type TrailingSlashPolicy = 'always' | 'never' | 'preserve';

/**
 * Options for creating canonical URLs from manifest.
 */
export interface CreateCanonicalUrlsOptions {
  /** Array of manifest items */
  items: ManifestItem[];
  /** Base URL e.g., "https://example.com" */
  baseUrl: string;
  /** Route prefix e.g., "/blog" for blog posts */
  routePrefix?: string;
  /** Default locale code */
  defaultLocale: string;
  /** Trailing slash policy */
  trailingSlash: TrailingSlashPolicy;
  /** Locale URL strategy */
  localeStrategy: LocaleStrategy;
}

/**
 * Generates a canonical URL for a given path from the site manifest.
 * @param manifest - The site manifest containing base URL information
 * @param path - The path to generate canonical URL for
 * @param options - Canonical URL options
 * @returns The canonical URL
 */
export function generateCanonicalUrl(
  manifest: SiteManifest,
  path: string,
  options: CanonicalOptions = {}
): string {
  const { trailingSlash = false, lowercase = true } = options;
  const basePath = path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = trailingSlash
    ? `${basePath}${basePath.endsWith('/') ? '' : '/'}`
    : basePath.replace(/\/+$/, '') || '/';
  const fullUrl = `${manifest.baseUrl}${normalizedPath}`;
  return lowercase ? fullUrl.toLowerCase() : fullUrl;
}

/**
 * Extracts all canonical URLs from a site manifest.
 * @param manifest - The site manifest
 * @param options - Canonical URL options
 * @returns Array of canonical URLs
 */
export function extractCanonicalUrls(
  manifest: SiteManifest,
  options: CanonicalOptions = {}
): string[] {
  return manifest.pages.map((page) => generateCanonicalUrl(manifest, page.path, options));
}

/**
 * Deduplicates URLs by converting to Set and back.
 * @param urls - Array of URLs to deduplicate
 * @returns Array of unique URLs
 */
export function dedupeUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}

/**
 * Builds locale prefix based on strategy.
 * @param locale - The locale code
 * @param strategy - The locale strategy
 * @param defaultLocale - The default locale code
 * @returns Locale prefix string or empty string
 */
function buildLocalePrefix(
  locale: string,
  strategy: LocaleStrategy,
  defaultLocale: string
): string {
  // No prefix for 'none' strategy
  if (strategy === 'none') {
    return '';
  }

  // Subdomain strategy doesn't add path prefix
  if (strategy === 'subdomain') {
    return '';
  }

  // For prefix strategy, don't prefix default locale
  if (strategy === 'prefix' && locale === defaultLocale) {
    return '';
  }

  return `/${locale}`;
}

/**
 * Builds base URL with subdomain if needed.
 * @param baseUrl - The base URL
 * @param locale - The locale code
 * @param strategy - The locale strategy
 * @param defaultLocale - The default locale code
 * @returns Base URL with subdomain if applicable
 */
function buildBaseUrlWithSubdomain(
  baseUrl: string,
  locale: string,
  strategy: LocaleStrategy,
  defaultLocale: string
): string {
  if (strategy !== 'subdomain' || locale === defaultLocale) {
    return baseUrl;
  }

  try {
    const parsed = new URL(baseUrl);
    return `${parsed.protocol}//${locale}.${parsed.host}`;
  } catch {
    return baseUrl;
  }
}

/**
 * Creates a single canonical URL for a manifest item.
 * @param item - The manifest item
 * @param options - Options for URL creation (without items array)
 * @returns The canonical URL string
 */
export function createCanonicalUrlForItem(
  item: ManifestItem,
  options: Omit<CreateCanonicalUrlsOptions, 'items'>
): string {
  const { baseUrl, routePrefix, defaultLocale, trailingSlash, localeStrategy } = options;

  // If item has canonicalOverride, use it directly
  if (item.canonicalOverride && typeof item.canonicalOverride === 'string') {
    return item.canonicalOverride;
  }

  // Select canonical locale for this item
  const availableLocales = item.locales ?? [defaultLocale];
  const canonicalLocale = selectCanonicalLocale({
    defaultLocale,
    availableLocales,
  });

  // If no locale available, use default
  const locale = canonicalLocale ?? defaultLocale;

  // Build URL parts
  const localePrefix = buildLocalePrefix(locale, localeStrategy, defaultLocale);
  const effectiveBaseUrl = buildBaseUrlWithSubdomain(baseUrl, locale, localeStrategy, defaultLocale);

  // Build the path
  const parts: string[] = [];
  if (localePrefix) {
    parts.push(localePrefix);
  }
  if (routePrefix) {
    parts.push(routePrefix);
  }
  parts.push(item.slug);

  const fullPath = joinUrlParts(...parts);

  // Normalize the URL
  return normalizeUrl({
    baseUrl: effectiveBaseUrl,
    path: fullPath,
    trailingSlash,
    stripQuery: true,
    stripHash: true,
  });
}

/**
 * Creates canonical URLs from manifest items:
 * 1. For each item, select canonical locale
 * 2. Build URL: baseUrl + localePrefix (if strategy=prefix) + routePrefix + slug
 * 3. Apply trailing slash policy
 * 4. Normalize URL
 * 5. Dedupe (by URL string)
 * 6. Sort stably
 * @param options - Options for URL creation
 * @returns Sorted array of canonical URLs
 */
export function createCanonicalUrlsFromManifest(options: CreateCanonicalUrlsOptions): string[] {
  const { items } = options;

  // Handle empty items
  if (!items || items.length === 0) {
    return [];
  }

  // Create URLs for each item
  const urls = items.map((item) => createCanonicalUrlForItem(item, options));

  // Deduplicate
  const deduped = dedupeUrls(urls);

  // Sort stably by path
  return sortUrlsByPath(deduped);
}

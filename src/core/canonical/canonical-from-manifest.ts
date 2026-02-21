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
 * Section-level route style for canonical path generation.
 */
export type RouteStyle = 'prefix' | 'suffix' | 'locale-segment' | 'custom';

/**
 * Arguments for custom pathname generation.
 */
export interface CanonicalPathnameArgs {
  item: ManifestItem;
  sectionName: string;
  slug: string;
  locale: string;
  defaultLocale: string;
  sectionPath: string;
}

/**
 * Custom path function used when routeStyle="custom".
 */
export type CanonicalPathnameFor = (args: CanonicalPathnameArgs) => string;

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
  /** Route style for this manifest block */
  routeStyle?: RouteStyle;
  /** Optional section name (used in custom pathname args) */
  sectionName?: string;
  /** Optional section path prefix */
  sectionPath?: string;
  /** Optional custom pathname override for routeStyle="custom" */
  pathnameFor?: CanonicalPathnameFor;
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
  const {
    baseUrl,
    routePrefix,
    defaultLocale,
    trailingSlash,
    localeStrategy,
    routeStyle,
    sectionName,
    sectionPath,
    pathnameFor,
  } = options;

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

  const sectionBase = normalizeSectionPath(sectionPath ?? routePrefix ?? '');
  const effectiveRouteStyle = routeStyle ?? inferRouteStyleFromLocaleStrategy(localeStrategy);
  const normalizedSlug = normalizeItemSlug(item.slug, sectionBase);

  const customPath = effectiveRouteStyle === 'custom'
    ? pathnameFor?.({
      item,
      sectionName: sectionName ?? '',
      slug: normalizedSlug,
      locale,
      defaultLocale,
      sectionPath: sectionBase,
    })
    : undefined;

  const resolvedPath = customPath ?? buildPathFromRouteStyle({
    routeStyle: effectiveRouteStyle,
    sectionPath: sectionBase,
    slug: normalizedSlug,
    locale,
    defaultLocale,
  });

  // Keep existing subdomain support from localeStrategy.
  const effectiveBaseUrl = buildBaseUrlWithSubdomain(baseUrl, locale, localeStrategy, defaultLocale);

  // Normalize the URL
  return normalizeUrl({
    baseUrl: effectiveBaseUrl,
    path: resolvedPath,
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

function inferRouteStyleFromLocaleStrategy(strategy: LocaleStrategy): RouteStyle {
  if (strategy !== 'prefix') {
    return 'custom';
  }
  return 'prefix';
}

function buildPathFromRouteStyle(args: {
  routeStyle: RouteStyle;
  sectionPath: string;
  slug: string;
  locale: string;
  defaultLocale: string;
}): string {
  const { routeStyle, sectionPath, slug, locale, defaultLocale } = args;
  const includeLocale = locale !== defaultLocale;

  if (routeStyle === 'locale-segment') {
    return joinUrlParts(sectionPath, locale, slug);
  }

  if (routeStyle === 'suffix') {
    if (includeLocale) {
      return joinUrlParts(sectionPath, slug, locale);
    }
    return joinUrlParts(sectionPath, slug);
  }

  if (routeStyle === 'custom') {
    // Legacy localeStrategy="none" fallback when custom builder is not provided.
    return joinUrlParts(sectionPath, slug);
  }

  // "prefix"
  if (includeLocale) {
    return joinUrlParts(locale, sectionPath, slug);
  }
  return joinUrlParts(sectionPath, slug);
}

function normalizeSectionPath(sectionPath: string): string {
  if (!sectionPath || sectionPath === '/') {
    return '';
  }
  return sectionPath.startsWith('/') ? sectionPath : `/${sectionPath}`;
}

function normalizeItemSlug(slug: string, sectionPath: string): string {
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
  if (!sectionPath) {
    return normalizedSlug;
  }

  if (normalizedSlug === sectionPath) {
    return '/';
  }

  const withSlash = `${sectionPath}/`;
  if (normalizedSlug.startsWith(withSlash)) {
    const relative = normalizedSlug.slice(withSlash.length);
    return relative ? `/${relative}` : '/';
  }

  return normalizedSlug;
}

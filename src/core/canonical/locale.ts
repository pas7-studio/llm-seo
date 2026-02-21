/**
 * Locale handling utilities for canonical URL generation.
 */

import type { ManifestItem } from '../../schema/manifest.schema.js';
import { stableSortStrings } from '../normalize/sort.js';

/**
 * Represents a locale configuration for a site.
 */
export interface LocaleConfig {
  /** Default locale code (e.g., 'en') */
  default: string;
  /** Supported locale codes */
  supported: readonly string[];
  /** URL strategy for locales */
  strategy: 'subdirectory' | 'subdomain' | 'domain';
}

/**
 * Options for selecting canonical locale.
 */
export interface SelectCanonicalLocaleOptions {
  /** Default locale code (e.g., 'en') */
  defaultLocale: string;
  /** Available locale codes for the item */
  availableLocales: string[];
}

/**
 * Selects canonical locale using deterministic algorithm:
 * 1. If defaultLocale is in availableLocales → return defaultLocale
 * 2. Otherwise, sort availableLocales and return first
 * 3. If no locales available → return null
 * @param options - Selection options
 * @returns The canonical locale or null if none available
 */
export function selectCanonicalLocale(options: SelectCanonicalLocaleOptions): string | null {
  const { defaultLocale, availableLocales } = options;

  // Handle empty/null cases
  if (!availableLocales || availableLocales.length === 0) {
    return null;
  }

  // Filter out any null/undefined/empty values
  const validLocales = availableLocales.filter(
    (locale): locale is string => typeof locale === 'string' && locale.length > 0
  );

  if (validLocales.length === 0) {
    return null;
  }

  // If defaultLocale is available, use it
  if (defaultLocale && validLocales.includes(defaultLocale)) {
    return defaultLocale;
  }

  // Otherwise, sort and return first (deterministic)
  const sorted = stableSortStrings(validLocales);
  return sorted[0] ?? null;
}

/**
 * Determines if a locale is available for an item.
 * @param locale - The locale to check
 * @param availableLocales - Array of available locales
 * @returns True if the locale is available
 */
export function isLocaleAvailable(locale: string, availableLocales: string[]): boolean {
  if (!locale || !availableLocales || availableLocales.length === 0) {
    return false;
  }
  return availableLocales.includes(locale);
}

/**
 * Gets all unique locales from manifest items.
 * @param items - Array of manifest items
 * @returns Array of unique locale codes
 */
export function extractAllLocales(items: ManifestItem[]): string[] {
  const localeSet = new Set<string>();

  for (const item of items) {
    if (item.locales && Array.isArray(item.locales)) {
      for (const locale of item.locales) {
        if (typeof locale === 'string' && locale.length > 0) {
          localeSet.add(locale);
        }
      }
    }
  }

  return stableSortStrings([...localeSet]);
}

/**
 * Generates locale-prefixed path.
 * @param path - The base path
 * @param locale - The locale code
 * @param config - Locale configuration
 * @returns Path with locale prefix if applicable
 */
export function localizePath(
  path: string,
  locale: string,
  config: LocaleConfig
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Default locale may not need prefix
  if (locale === config.default && config.strategy === 'subdirectory') {
    return normalizedPath;
  }
  
  if (config.strategy === 'subdirectory') {
    return `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`;
  }
  
  return normalizedPath;
}

/**
 * Extracts locale from a path.
 * @param path - The path to extract locale from
 * @param config - Locale configuration
 * @returns Tuple of [locale, pathWithoutLocale]
 */
export function extractLocaleFromPath(
  path: string,
  config: LocaleConfig
): readonly [string, string] {
  if (config.strategy !== 'subdirectory') {
    return [config.default, path];
  }
  
  const match = path.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/);
  
  if (match?.[1] && config.supported.includes(match[1])) {
    const locale = match[1];
    const remainingPath = path.slice(locale.length + 1) || '/';
    return [locale, remainingPath] as const;
  }
  
  return [config.default, path];
}

/**
 * Generates alternate locale URLs for a page.
 * @param baseUrl - Base URL of the site
 * @param path - Page path
 * @param config - Locale configuration
 * @returns Map of locale to full URL
 */
export function generateAlternateUrls(
  baseUrl: string,
  path: string,
  config: LocaleConfig
): Map<string, string> {
  const urlMap = new Map<string, string>();
  
  for (const locale of config.supported) {
    const localePath = localizePath(path, locale, config);
    const fullUrl = `${baseUrl}${localePath}`;
    urlMap.set(locale, fullUrl);
  }
  
  return urlMap;
}

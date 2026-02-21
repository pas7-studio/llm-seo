/**
 * Helpers for resolving manifest sections from LlmsSeoConfig
 * and building canonical URL bundles with per-section routing rules.
 */

import type {
  LlmsSeoConfig,
  ManifestConfigValue,
  ManifestPathnameFor,
  RouteStyle,
} from '../../schema/config.schema.js';
import type { ManifestItem } from '../../schema/manifest.schema.js';
import {
  createCanonicalUrlForItem,
  dedupeUrls,
  type LocaleStrategy,
  type TrailingSlashPolicy,
} from './canonical-from-manifest.js';
import { sortBy, sortUrlsByPath } from '../normalize/sort.js';

/**
 * One resolved manifests section from config.
 */
export interface ResolvedManifestSection {
  /** Key from config.manifests */
  key: string;
  /** Display name for content section */
  sectionName: string;
  /** Section items */
  items: ManifestItem[];
  /** Optional section path prefix */
  sectionPath?: string;
  /** Optional per-section route style */
  routeStyle?: RouteStyle;
  /** Optional locale override for canonical locale selection */
  defaultLocaleOverride?: string;
  /** Optional custom pathname builder */
  pathnameFor?: ManifestPathnameFor;
}

/**
 * A canonical URL entry paired with source manifest item and section.
 */
export interface CanonicalManifestEntry {
  sectionKey: string;
  sectionName: string;
  item: ManifestItem;
  canonicalUrl: string;
}

/**
 * Aggregate canonical generation bundle.
 */
export interface CanonicalManifestBundle {
  /** Deduplicated canonical URLs (sorted) */
  canonicalUrls: string[];
  /** Flattened manifest items (sorted in same order as entries) */
  manifestItems: ManifestItem[];
  /** Rich entries with canonical URL per item */
  entries: CanonicalManifestEntry[];
}

/**
 * Resolve manifests configuration into normalized sections.
 */
export function resolveManifestSections(config: LlmsSeoConfig): ResolvedManifestSection[] {
  const sections: ResolvedManifestSection[] = [];

  const manifestEntries = Object.entries(config.manifests).sort((a, b) =>
    a[0].localeCompare(b[0], 'en', { sensitivity: 'base', numeric: true })
  );

  for (const [key, rawValue] of manifestEntries) {
    const value = rawValue as ManifestConfigValue;
    const resolved = resolveOneManifestSection(key, value);
    sections.push(resolved);
  }

  return sections;
}

/**
 * Build canonical URLs and item entries from full config.
 */
export function createCanonicalBundleFromConfig(config: LlmsSeoConfig): CanonicalManifestBundle {
  const sections = resolveManifestSections(config);
  const entries: CanonicalManifestEntry[] = [];

  const defaultLocale = config.site.defaultLocale ?? config.brand.locales[0] ?? 'en';
  const trailingSlash: TrailingSlashPolicy = config.format?.trailingSlash ?? 'never';
  const localeStrategy: LocaleStrategy = config.format?.localeStrategy ?? 'prefix';

  for (const section of sections) {
    const sectionDefaultLocale = section.defaultLocaleOverride ?? defaultLocale;

    const sortedItems = sortBy(section.items, (item) => {
      const localesKey = (item.locales ?? []).join(',');
      return `${item.slug}|${localesKey}`;
    });

    for (const item of sortedItems) {
      const itemOptions = {
        baseUrl: config.site.baseUrl,
        sectionName: section.sectionName,
        defaultLocale: sectionDefaultLocale,
        trailingSlash,
        localeStrategy,
        ...(section.sectionPath && {
          routePrefix: section.sectionPath,
          sectionPath: section.sectionPath,
        }),
        ...(section.routeStyle && { routeStyle: section.routeStyle }),
        ...(section.pathnameFor && { pathnameFor: section.pathnameFor }),
      };
      const canonicalUrl = createCanonicalUrlForItem(item, itemOptions);

      entries.push({
        sectionKey: section.key,
        sectionName: section.sectionName,
        item,
        canonicalUrl,
      });
    }
  }

  const sortedEntries = sortBy(entries, (entry) => {
    return `${entry.canonicalUrl}|${entry.sectionKey}|${entry.item.slug}`;
  });

  const canonicalUrls = sortUrlsByPath(dedupeUrls(sortedEntries.map((entry) => entry.canonicalUrl)));
  const manifestItems = sortedEntries.map((entry) => entry.item);

  return {
    canonicalUrls,
    manifestItems,
    entries: sortedEntries,
  };
}

function resolveOneManifestSection(key: string, value: ManifestConfigValue): ResolvedManifestSection {
  if (Array.isArray(value)) {
    return {
      key,
      sectionName: key,
      items: normalizeManifestItems(value),
    };
  }

  return {
    key,
    sectionName: value.sectionName ?? key,
    items: normalizeManifestItems(value.items),
    ...(value.sectionPath && { sectionPath: value.sectionPath }),
    ...(value.routeStyle && { routeStyle: value.routeStyle }),
    ...(value.defaultLocaleOverride && { defaultLocaleOverride: value.defaultLocaleOverride }),
    ...(value.pathnameFor && { pathnameFor: value.pathnameFor }),
  };
}

function normalizeManifestItems(items: ManifestItem[]): ManifestItem[] {
  return items.map((item) => {
    const normalizedSlug = item.slug.startsWith('/') ? item.slug : `/${item.slug}`;
    return { ...item, slug: normalizedSlug };
  });
}

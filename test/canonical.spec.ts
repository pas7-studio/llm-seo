/**
 * Tests for canonical URL generation.
 */

import { describe, it, expect } from 'vitest';
import {
  generateCanonicalUrl,
  extractCanonicalUrls,
  createCanonicalUrlsFromManifest,
  createCanonicalUrlForItem,
  dedupeUrls,
} from '../src/core/canonical/canonical-from-manifest.js';
import {
  localizePath,
  extractLocaleFromPath,
  selectCanonicalLocale,
  isLocaleAvailable,
  extractAllLocales,
} from '../src/core/canonical/locale.js';
import {
  normalizeUrl,
  normalizePath,
  joinUrlParts,
  isValidAbsoluteUrl,
} from '../src/core/normalize/url.js';
import {
  stableSortStrings,
  stableSortBy,
  sortUrlsByPath,
} from '../src/core/normalize/sort.js';
import type { SiteManifest, ManifestItem } from '../src/schema/manifest.schema.js';
import type { LocaleConfig } from '../src/core/canonical/locale.js';

// ============================================
// URL Normalization Tests
// ============================================

describe('normalizePath', () => {
  it('should handle empty path', () => {
    expect(normalizePath('')).toBe('/');
  });

  it('should handle root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('should collapse double slashes in path', () => {
    expect(normalizePath('//blog//my-post')).toBe('/blog/my-post');
    expect(normalizePath('/blog//post')).toBe('/blog/post');
  });

  it('should normalize dots (current directory)', () => {
    expect(normalizePath('/blog/./post')).toBe('/blog/post');
  });

  it('should normalize double dots (parent directory)', () => {
    expect(normalizePath('/blog/sub/../post')).toBe('/blog/post');
  });

  it('should add leading slash if missing', () => {
    expect(normalizePath('blog/post')).toBe('/blog/post');
  });
});

describe('joinUrlParts', () => {
  it('should join multiple parts with single slashes', () => {
    expect(joinUrlParts('blog', 'post')).toBe('/blog/post');
  });

  it('should handle parts with leading slashes', () => {
    expect(joinUrlParts('/blog', '/post')).toBe('/blog/post');
  });

  it('should handle parts with trailing slashes', () => {
    expect(joinUrlParts('blog/', 'post/')).toBe('/blog/post');
  });

  it('should return root for empty input', () => {
    expect(joinUrlParts()).toBe('/');
  });

  it('should filter empty parts', () => {
    expect(joinUrlParts('', 'blog', '', 'post', '')).toBe('/blog/post');
  });
});

describe('isValidAbsoluteUrl', () => {
  it('should return true for valid http URL', () => {
    expect(isValidAbsoluteUrl('http://example.com')).toBe(true);
  });

  it('should return true for valid https URL', () => {
    expect(isValidAbsoluteUrl('https://example.com')).toBe(true);
  });

  it('should return false for relative URL', () => {
    expect(isValidAbsoluteUrl('/blog/post')).toBe(false);
  });

  it('should return false for ftp protocol', () => {
    expect(isValidAbsoluteUrl('ftp://example.com')).toBe(false);
  });

  it('should return false for invalid URL', () => {
    expect(isValidAbsoluteUrl('not-a-url')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidAbsoluteUrl('')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('should lowercase hostname', () => {
    const result = normalizeUrl({
      baseUrl: 'https://Example.com',
      path: '/blog',
      trailingSlash: 'never',
    });
    expect(result).toBe('https://example.com/blog');
  });

  it('should remove default port 80', () => {
    const result = normalizeUrl({
      baseUrl: 'http://example.com:80',
      path: '/blog',
      trailingSlash: 'never',
    });
    expect(result).toBe('http://example.com/blog');
  });

  it('should remove default port 443', () => {
    const result = normalizeUrl({
      baseUrl: 'https://example.com:443',
      path: '/blog',
      trailingSlash: 'never',
    });
    expect(result).toBe('https://example.com/blog');
  });

  it('should keep non-default port', () => {
    const result = normalizeUrl({
      baseUrl: 'https://example.com:8443',
      path: '/blog',
      trailingSlash: 'never',
    });
    expect(result).toBe('https://example.com:8443/blog');
  });

  it('should apply trailingSlash="always" (adds slash)', () => {
    const result = normalizeUrl({
      baseUrl: 'https://example.com',
      path: '/blog',
      trailingSlash: 'always',
    });
    expect(result).toBe('https://example.com/blog/');
  });

  it('should apply trailingSlash="never" (removes slash)', () => {
    const result = normalizeUrl({
      baseUrl: 'https://example.com',
      path: '/blog/',
      trailingSlash: 'never',
    });
    expect(result).toBe('https://example.com/blog');
  });

  it('should apply trailingSlash="preserve" (keeps as is)', () => {
    const withSlash = normalizeUrl({
      baseUrl: 'https://example.com',
      path: '/blog/',
      trailingSlash: 'preserve',
    });
    const withoutSlash = normalizeUrl({
      baseUrl: 'https://example.com',
      path: '/blog',
      trailingSlash: 'preserve',
    });
    expect(withSlash).toBe('https://example.com/blog/');
    expect(withoutSlash).toBe('https://example.com/blog');
  });

  it('should keep root path with slash', () => {
    const result = normalizeUrl({
      baseUrl: 'https://example.com',
      path: '/',
      trailingSlash: 'never',
    });
    expect(result).toBe('https://example.com/');
  });

  it('should collapse double slashes in path', () => {
    const result = normalizeUrl({
      baseUrl: 'https://example.com',
      path: '//blog//post',
      trailingSlash: 'never',
    });
    expect(result).toBe('https://example.com/blog/post');
  });
});

// ============================================
// Stable Sorting Tests
// ============================================

describe('stableSortStrings', () => {
  it('should sort strings alphabetically', () => {
    const input = ['zebra', 'apple', 'banana'];
    const result = stableSortStrings(input);
    expect(result).toEqual(['apple', 'banana', 'zebra']);
  });

  it('should be deterministic (same output for same input)', () => {
    const input = ['de', 'en', 'uk', 'fr'];
    const result1 = stableSortStrings(input);
    const result2 = stableSortStrings(input);
    expect(result1).toEqual(result2);
  });

  it('should handle numeric sorting', () => {
    const input = ['item10', 'item2', 'item1'];
    const result = stableSortStrings(input);
    expect(result).toEqual(['item1', 'item2', 'item10']);
  });

  it('should not mutate original array', () => {
    const input = ['c', 'b', 'a'];
    stableSortStrings(input);
    expect(input).toEqual(['c', 'b', 'a']);
  });
});

describe('stableSortBy', () => {
  it('should sort objects by key function', () => {
    const input = [{ name: 'zebra' }, { name: 'apple' }, { name: 'banana' }];
    const result = stableSortBy(input, (item) => item.name);
    expect(result.map((i) => i.name)).toEqual(['apple', 'banana', 'zebra']);
  });

  it('should not mutate original array', () => {
    const input = [{ name: 'c' }, { name: 'b' }, { name: 'a' }];
    stableSortBy(input, (item) => item.name);
    expect(input.map((i) => i.name)).toEqual(['c', 'b', 'a']);
  });
});

describe('sortUrlsByPath', () => {
  it('should sort URLs by path depth (shorter first)', () => {
    const input = [
      'https://example.com/blog/category/post',
      'https://example.com/',
      'https://example.com/blog',
    ];
    const result = sortUrlsByPath(input);
    expect(result).toEqual([
      'https://example.com/',
      'https://example.com/blog',
      'https://example.com/blog/category/post',
    ]);
  });

  it('should sort URLs with same depth alphabetically', () => {
    const input = [
      'https://example.com/zebra',
      'https://example.com/apple',
      'https://example.com/banana',
    ];
    const result = sortUrlsByPath(input);
    expect(result).toEqual([
      'https://example.com/apple',
      'https://example.com/banana',
      'https://example.com/zebra',
    ]);
  });
});

// ============================================
// Canonical Locale Selection Tests
// ============================================

describe('selectCanonicalLocale', () => {
  it('should return defaultLocale if available', () => {
    const result = selectCanonicalLocale({
      defaultLocale: 'en',
      availableLocales: ['uk', 'en', 'de'],
    });
    expect(result).toBe('en');
  });

  it('should return first sorted locale if defaultLocale not available', () => {
    const result = selectCanonicalLocale({
      defaultLocale: 'fr',
      availableLocales: ['uk', 'de', 'en'],
    });
    expect(result).toBe('de'); // 'de' comes first alphabetically
  });

  it('should return null if no locales available', () => {
    const result = selectCanonicalLocale({
      defaultLocale: 'en',
      availableLocales: [],
    });
    expect(result).toBeNull();
  });

  it('should be deterministic (same result every time)', () => {
    const options = {
      defaultLocale: 'en',
      availableLocales: ['uk', 'de', 'fr'],
    };
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(selectCanonicalLocale(options));
    }
    expect(results.every((r) => r === 'de')).toBe(true);
  });

  it('should handle null/undefined in availableLocales', () => {
    const result = selectCanonicalLocale({
      defaultLocale: 'en',
      availableLocales: [null, undefined, ''] as string[],
    });
    expect(result).toBeNull();
  });
});

describe('isLocaleAvailable', () => {
  it('should return true if locale is available', () => {
    expect(isLocaleAvailable('en', ['en', 'uk', 'de'])).toBe(true);
  });

  it('should return false if locale is not available', () => {
    expect(isLocaleAvailable('fr', ['en', 'uk', 'de'])).toBe(false);
  });

  it('should return false for empty availableLocales', () => {
    expect(isLocaleAvailable('en', [])).toBe(false);
  });
});

describe('extractAllLocales', () => {
  it('should get all unique locales from manifest items', () => {
    const items: ManifestItem[] = [
      { slug: '/post1', locales: ['en', 'uk'] },
      { slug: '/post2', locales: ['de', 'en'] },
      { slug: '/post3', locales: ['fr'] },
    ];
    const result = extractAllLocales(items);
    expect(result).toEqual(['de', 'en', 'fr', 'uk']);
  });

  it('should return empty array for items without locales', () => {
    const items: ManifestItem[] = [
      { slug: '/post1' },
      { slug: '/post2' },
    ];
    const result = extractAllLocales(items);
    expect(result).toEqual([]);
  });
});

// ============================================
// Locale Path Tests
// ============================================

describe('localizePath', () => {
  const config: LocaleConfig = {
    default: 'en',
    supported: ['en', 'uk', 'de'],
    strategy: 'subdirectory',
  };

  it('should not prefix default locale', () => {
    const result = localizePath('/about', 'en', config);
    expect(result).toBe('/about');
  });

  it('should prefix non-default locale', () => {
    const result = localizePath('/about', 'uk', config);
    expect(result).toBe('/uk/about');
  });

  it('should handle root path', () => {
    const result = localizePath('/', 'uk', config);
    expect(result).toBe('/uk');
  });
});

describe('extractLocaleFromPath', () => {
  const config: LocaleConfig = {
    default: 'en',
    supported: ['en', 'uk', 'de'],
    strategy: 'subdirectory',
  };

  it('should extract locale from path', () => {
    const [locale, path] = extractLocaleFromPath('/uk/about', config);
    expect(locale).toBe('uk');
    expect(path).toBe('/about');
  });

  it('should return default locale for unlocalized path', () => {
    const [locale, path] = extractLocaleFromPath('/about', config);
    expect(locale).toBe('en');
    expect(path).toBe('/about');
  });

  it('should return default locale for unsupported locale', () => {
    const [locale, path] = extractLocaleFromPath('/fr/about', config);
    expect(locale).toBe('en');
    expect(path).toBe('/fr/about');
  });
});

// ============================================
// Canonical URLs from Manifest Tests
// ============================================

describe('generateCanonicalUrl (legacy)', () => {
  const manifest: SiteManifest = {
    baseUrl: 'https://example.com',
    title: 'Test Site',
    pages: [],
  };

  it('should generate canonical URL for root path', () => {
    const result = generateCanonicalUrl(manifest, '/');
    expect(result).toBe('https://example.com/');
  });

  it('should generate canonical URL for nested path', () => {
    const result = generateCanonicalUrl(manifest, '/about/team');
    expect(result).toBe('https://example.com/about/team');
  });

  it('should normalize paths without leading slash', () => {
    const result = generateCanonicalUrl(manifest, 'about');
    expect(result).toBe('https://example.com/about');
  });
});

describe('extractCanonicalUrls (legacy)', () => {
  it('should extract URLs for all pages', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      pages: [
        { path: '/' },
        { path: '/about' },
        { path: '/contact' },
      ],
    };

    const result = extractCanonicalUrls(manifest);

    expect(result).toHaveLength(3);
    expect(result).toContain('https://example.com/');
    expect(result).toContain('https://example.com/about');
    expect(result).toContain('https://example.com/contact');
  });
});

describe('dedupeUrls', () => {
  it('should remove duplicate URLs', () => {
    const input = [
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/a',
    ];
    const result = dedupeUrls(input);
    expect(result).toEqual(['https://example.com/a', 'https://example.com/b']);
  });
});

describe('createCanonicalUrlForItem', () => {
  const baseOptions = {
    baseUrl: 'https://example.com',
    defaultLocale: 'en',
    trailingSlash: 'never' as const,
    localeStrategy: 'none' as const,
  };

  it('should create URL with slug', () => {
    const item: ManifestItem = { slug: '/blog/my-post' };
    const result = createCanonicalUrlForItem(item, baseOptions);
    expect(result).toBe('https://example.com/blog/my-post');
  });

  it('should use canonicalOverride if present', () => {
    const item: ManifestItem = {
      slug: '/blog/my-post',
      canonicalOverride: 'https://custom.com/override',
    };
    const result = createCanonicalUrlForItem(item, baseOptions);
    expect(result).toBe('https://custom.com/override');
  });

  it('should apply routePrefix correctly', () => {
    const item: ManifestItem = { slug: 'my-post' };
    const result = createCanonicalUrlForItem(item, {
      ...baseOptions,
      routePrefix: '/blog',
    });
    expect(result).toBe('https://example.com/blog/my-post');
  });

  it('should apply localeStrategy="prefix"', () => {
    const item: ManifestItem = { slug: 'my-post', locales: ['uk', 'en'] };
    const result = createCanonicalUrlForItem(item, {
      ...baseOptions,
      localeStrategy: 'prefix',
      routePrefix: '/blog',
    });
    // Should use defaultLocale 'en' which is available, no prefix for default
    expect(result).toBe('https://example.com/blog/my-post');
  });

  it('should apply localeStrategy="prefix" with non-default locale', () => {
    const item: ManifestItem = { slug: 'my-post', locales: ['uk', 'de'] };
    const result = createCanonicalUrlForItem(item, {
      ...baseOptions,
      localeStrategy: 'prefix',
      routePrefix: '/blog',
    });
    // Should use first sorted locale 'de', with prefix
    expect(result).toBe('https://example.com/de/blog/my-post');
  });

  it('should apply localeStrategy="subdomain"', () => {
    const item: ManifestItem = { slug: 'my-post', locales: ['uk'] };
    const result = createCanonicalUrlForItem(item, {
      ...baseOptions,
      localeStrategy: 'subdomain',
    });
    expect(result).toBe('https://uk.example.com/my-post');
  });

  it('should apply localeStrategy="none"', () => {
    const item: ManifestItem = { slug: 'my-post', locales: ['uk', 'de'] };
    const result = createCanonicalUrlForItem(item, {
      ...baseOptions,
      localeStrategy: 'none',
    });
    expect(result).toBe('https://example.com/my-post');
  });

  it('should apply trailingSlash="always"', () => {
    const item: ManifestItem = { slug: 'my-post' };
    const result = createCanonicalUrlForItem(item, {
      ...baseOptions,
      trailingSlash: 'always',
    });
    expect(result).toBe('https://example.com/my-post/');
  });
});

describe('createCanonicalUrlsFromManifest', () => {
  const baseOptions = {
    baseUrl: 'https://example.com',
    defaultLocale: 'en',
    trailingSlash: 'never' as const,
    localeStrategy: 'none' as const,
  };

  it('should create URLs for all items', () => {
    const items: ManifestItem[] = [
      { slug: '/about' },
      { slug: '/contact' },
    ];
    const result = createCanonicalUrlsFromManifest({ ...baseOptions, items });
    expect(result).toHaveLength(2);
    expect(result).toContain('https://example.com/about');
    expect(result).toContain('https://example.com/contact');
  });

  it('should deduplicate URLs', () => {
    const items: ManifestItem[] = [
      { slug: '/about' },
      { slug: '/about' },
      { slug: '/contact' },
    ];
    const result = createCanonicalUrlsFromManifest({ ...baseOptions, items });
    expect(result).toHaveLength(2);
  });

  it('should sort URLs stably', () => {
    const items: ManifestItem[] = [
      { slug: '/zebra' },
      { slug: '/apple' },
      { slug: '/banana' },
    ];
    const result = createCanonicalUrlsFromManifest({ ...baseOptions, items });
    expect(result).toEqual([
      'https://example.com/apple',
      'https://example.com/banana',
      'https://example.com/zebra',
    ]);
  });

  it('should return empty array for empty items', () => {
    const result = createCanonicalUrlsFromManifest({ ...baseOptions, items: [] });
    expect(result).toEqual([]);
  });

  it('should apply routePrefix correctly', () => {
    const items: ManifestItem[] = [
      { slug: 'my-post' },
      { slug: 'another-post' },
    ];
    const result = createCanonicalUrlsFromManifest({
      ...baseOptions,
      items,
      routePrefix: '/blog',
    });
    expect(result).toContain('https://example.com/blog/my-post');
    expect(result).toContain('https://example.com/blog/another-post');
  });

  it('should handle localeStrategy="prefix" with mixed locales', () => {
    const items: ManifestItem[] = [
      { slug: 'post-1', locales: ['en', 'uk'] },
      { slug: 'post-2', locales: ['de', 'fr'] },
    ];
    const result = createCanonicalUrlsFromManifest({
      ...baseOptions,
      items,
      localeStrategy: 'prefix',
    });
    // post-1: en is default and available -> no prefix
    // post-2: de is first sorted locale -> /de prefix
    expect(result).toContain('https://example.com/post-1');
    expect(result).toContain('https://example.com/de/post-2');
  });
});

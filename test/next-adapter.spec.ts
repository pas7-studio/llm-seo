import { describe, it, expect } from 'vitest';
import {
  createSectionManifest,
  applySectionCanonicalOverrides,
} from '../src/adapters/next/manifest.js';

describe('createSectionManifest', () => {
  const blogInput = [
    {
      slug: 'first-post',
      locales: ['en', 'uk'],
      updatedAt: '2026-02-10',
      title: 'First',
    },
    {
      slug: '/second-post',
      locales: ['en'],
      publishedAt: '2026-02-01',
      title: 'Second',
    },
  ];

  it('maps Next items into section manifest (prefix)', () => {
    const section = createSectionManifest({
      items: blogInput,
      sectionPath: '/blog',
      routeStyle: 'prefix',
      defaultLocale: 'en',
    });

    expect(section.routeStyle).toBe('prefix');
    expect(section.sectionPath).toBe('/blog');
    expect(section.items[0]?.slug).toBe('/first-post');
    expect(section.items[1]?.slug).toBe('/second-post');
  });

  it('supports suffix routing config', () => {
    const section = createSectionManifest({
      items: [{ slug: '/contact', locales: ['en', 'uk'] }],
      routeStyle: 'suffix',
    });

    expect(section.routeStyle).toBe('suffix');
    expect(section.items).toHaveLength(1);
  });

  it('supports locale-segment routing config', () => {
    const section = createSectionManifest({
      items: [{ slug: '/guide', locales: ['en', 'uk'] }],
      sectionPath: '/blog',
      routeStyle: 'locale-segment',
    });

    expect(section.routeStyle).toBe('locale-segment');
    expect(section.sectionPath).toBe('/blog');
  });

  it('supports custom routing config', () => {
    const section = createSectionManifest({
      items: [{ slug: '/faq', locales: ['uk'] }],
      routeStyle: 'custom',
      pathnameFor: ({ locale, slug }) => `/custom/${locale}${slug}`,
    });

    expect(section.routeStyle).toBe('custom');
    expect(typeof section.pathnameFor).toBe('function');
  });

  it('supports field mapping with keys/functions', () => {
    const section = createSectionManifest({
      items: [
        {
          path: 'mapped',
          langs: ['en'],
          heading: 'Mapped title',
          summary: 'Mapped description',
        },
      ],
      slugKey: 'path',
      localesKey: 'langs',
      titleFrom: 'heading',
      descriptionFrom: (item) => String(item.summary ?? ''),
      defaultLocale: 'en',
    });

    expect(section.items[0]?.slug).toBe('/mapped');
    expect(section.items[0]?.title).toBe('Mapped title');
    expect(section.items[0]?.description).toBe('Mapped description');
  });
});

describe('applySectionCanonicalOverrides', () => {
  it('applies canonicalOverride values for prefix', () => {
    const section = createSectionManifest({
      items: [{ slug: '/post', locales: ['en', 'uk'] }],
      sectionPath: '/blog',
      routeStyle: 'prefix',
    });

    const withOverrides = applySectionCanonicalOverrides({
      section,
      baseUrl: 'https://example.com',
      defaultLocale: 'en',
    });

    expect(withOverrides.items[0]?.canonicalOverride).toBe('https://example.com/blog/post');
  });

  it('applies canonicalOverride values for suffix', () => {
    const section = createSectionManifest({
      items: [{ slug: '/contact', locales: ['uk'] }],
      routeStyle: 'suffix',
    });

    const withOverrides = applySectionCanonicalOverrides({
      section,
      baseUrl: 'https://example.com',
      defaultLocale: 'en',
    });

    expect(withOverrides.items[0]?.canonicalOverride).toBe('https://example.com/contact/uk');
  });

  it('applies canonicalOverride values for locale-segment', () => {
    const section = createSectionManifest({
      items: [{ slug: '/post', locales: ['en', 'uk'] }],
      sectionPath: '/blog',
      routeStyle: 'locale-segment',
    });

    const withOverrides = applySectionCanonicalOverrides({
      section,
      baseUrl: 'https://example.com',
      defaultLocale: 'en',
    });

    expect(withOverrides.items[0]?.canonicalOverride).toBe('https://example.com/blog/en/post');
  });

  it('applies canonicalOverride values for custom', () => {
    const section = createSectionManifest({
      items: [{ slug: '/faq', locales: ['uk'] }],
      routeStyle: 'custom',
      pathnameFor: ({ locale, slug }) => `/custom/${locale}${slug}`,
    });

    const withOverrides = applySectionCanonicalOverrides({
      section,
      baseUrl: 'https://example.com',
      defaultLocale: 'en',
    });

    expect(withOverrides.items[0]?.canonicalOverride).toBe('https://example.com/custom/uk/faq');
  });
});

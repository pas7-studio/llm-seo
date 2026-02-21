/**
 * Tests for citations.json generation.
 * Tests createCitationsJson function with full LlmsSeoConfig.
 */

import { describe, it, expect } from 'vitest';
import {
  createCitationsJson,
  createCitationsJsonString,
  createCitation,
  citationToMarkdown,
  citationToJsonLd,
  generateReferenceList,
} from '../src/core/generate/citations.js';
import type { LlmsSeoConfig } from '../src/schema/config.schema.js';
import type { ManifestItem } from '../src/schema/manifest.schema.js';

/**
 * Creates a minimal valid config for testing.
 */
function createMinimalConfig(): LlmsSeoConfig {
  return {
    site: {
      baseUrl: 'https://example.com',
    },
    brand: {
      name: 'Test Brand',
      locales: ['en'],
    },
    output: {
      paths: {
        llmsTxt: 'public/llms.txt',
        llmsFullTxt: 'public/llms-full.txt',
      },
    },
  };
}

/**
 * Creates a full config with all optional fields.
 */
function createFullConfig(): LlmsSeoConfig {
  return {
    site: {
      baseUrl: 'https://example.com',
      defaultLocale: 'en',
    },
    brand: {
      name: 'Acme Corporation',
      tagline: 'Building the future, today',
      locales: ['en', 'uk', 'de'],
    },
    policy: {
      geoPolicy: 'Services available in North America and Europe only.',
      citationRules: 'Always cite original sources with proper attribution.',
      restrictedClaims: {
        enable: true,
        forbidden: ['best', '#1', 'guaranteed'],
        whitelist: ['industry-leading'],
      },
    },
    output: {
      paths: {
        llmsTxt: 'public/llms.txt',
        llmsFullTxt: 'public/llms-full.txt',
        citations: 'public/citations.json',
      },
    },
  };
}

/**
 * Creates sample manifest items for testing.
 */
function createManifestItems(): ManifestItem[] {
  return [
    {
      slug: '/services/web-development',
      title: 'Web Development Services',
      locales: ['en', 'uk'],
      priority: 100,
    },
    {
      slug: '/blog/post-1',
      title: 'First Blog Post',
      locales: ['en'],
      priority: 80,
      publishedAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      slug: '/about',
      title: 'About Us',
      priority: 50,
    },
  ];
}

describe('createCitationsJson', () => {
  describe('with minimal config', () => {
    it('should generate citations.json with required fields only', () => {
      const config = createMinimalConfig();
      const result = createCitationsJson({
        config,
        manifestItems: [],
        sectionName: 'pages',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.version).toBe('1.0');
      expect(result.generated).toBe('2024-01-15T10:00:00Z');
      expect(result.site.baseUrl).toBe('https://example.com');
      expect(result.site.name).toBe('Test Brand');
      expect(result.sources).toEqual([]);
    });

    it('should have restrictedClaimsEnabled false by default', () => {
      const config = createMinimalConfig();
      const result = createCitationsJson({
        config,
        manifestItems: [],
        sectionName: 'pages',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.policy.restrictedClaimsEnabled).toBe(false);
    });
  });

  describe('with full config', () => {
    it('should include all policy fields', () => {
      const config = createFullConfig();
      const result = createCitationsJson({
        config,
        manifestItems: [],
        sectionName: 'pages',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.policy.geoPolicy).toBe('Services available in North America and Europe only.');
      expect(result.policy.citationRules).toBe('Always cite original sources with proper attribution.');
      expect(result.policy.restrictedClaimsEnabled).toBe(true);
    });

    it('should include all manifest items as sources', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources.length).toBe(3);
    });

    it('should include correct URL for each source', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.url).toBe('https://example.com/services/web-development');
      expect(result.sources[1]?.url).toBe('https://example.com/blog/post-1');
      expect(result.sources[2]?.url).toBe('https://example.com/about');
    });

    it('should include priority from manifest item', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.priority).toBe(100);
      expect(result.sources[1]?.priority).toBe(80);
      expect(result.sources[2]?.priority).toBe(50);
    });

    it('should include section name from options', () => {
      const config = createFullConfig();
      const manifestItems: ManifestItem[] = [{ slug: '/test', title: 'Test' }];
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'blog',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.section).toBe('blog');
    });

    it('should include locale from manifest item', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.locale).toBe('en');
      expect(result.sources[1]?.locale).toBe('en');
      expect(result.sources[2]?.locale).toBe('en'); // Falls back to default
    });

    it('should include publishedAt and updatedAt when present', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[1]?.publishedAt).toBe('2024-01-01T00:00:00Z');
      expect(result.sources[1]?.updatedAt).toBe('2024-01-15T00:00:00Z');
    });

    it('should include title when present', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.title).toBe('Web Development Services');
    });

    it('should use default priority of 50 when not specified', () => {
      const config = createFullConfig();
      const manifestItems: ManifestItem[] = [{ slug: '/no-priority' }];
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.priority).toBe(50);
    });
  });

  describe('sorting', () => {
    it('should sort sources by priority descending', () => {
      const config = createMinimalConfig();
      const manifestItems: ManifestItem[] = [
        { slug: '/low', priority: 10 },
        { slug: '/high', priority: 90 },
        { slug: '/medium', priority: 50 },
      ];
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.priority).toBe(90);
      expect(result.sources[1]?.priority).toBe(50);
      expect(result.sources[2]?.priority).toBe(10);
    });

    it('should sort by URL when priorities are equal', () => {
      const config = createMinimalConfig();
      const manifestItems: ManifestItem[] = [
        { slug: '/zebra', priority: 50 },
        { slug: '/alpha', priority: 50 },
        { slug: '/beta', priority: 50 },
      ];
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.url).toBe('https://example.com/alpha');
      expect(result.sources[1]?.url).toBe('https://example.com/beta');
      expect(result.sources[2]?.url).toBe('https://example.com/zebra');
    });
  });

  describe('canonicalOverride', () => {
    it('should use canonicalOverride when present', () => {
      const config = createMinimalConfig();
      const manifestItems: ManifestItem[] = [
        { slug: '/original', canonicalOverride: 'https://cdn.example.com/page' },
      ];
      const result = createCitationsJson({
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      });

      expect(result.sources[0]?.url).toBe('https://cdn.example.com/page');
    });
  });

  describe('determinism', () => {
    it('should produce identical output for same input', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const options = {
        config,
        manifestItems,
        sectionName: 'content',
        fixedTimestamp: '2024-01-15T10:00:00Z',
      };

      const result1 = createCitationsJson(options);
      const result2 = createCitationsJson(options);

      expect(result1).toEqual(result2);
    });

    it('should use fixed timestamp when provided', () => {
      const config = createMinimalConfig();
      const result = createCitationsJson({
        config,
        manifestItems: [],
        sectionName: 'pages',
        fixedTimestamp: '2024-06-15T14:30:00Z',
      });

      expect(result.generated).toBe('2024-06-15T14:30:00Z');
    });
  });
});

describe('createCitationsJsonString', () => {
  it('should return valid JSON string', () => {
    const config = createMinimalConfig();
    const result = createCitationsJsonString({
      config,
      manifestItems: [],
      sectionName: 'pages',
      fixedTimestamp: '2024-01-15T10:00:00Z',
    });

    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should use 2-space indentation', () => {
    const config = createMinimalConfig();
    const result = createCitationsJsonString({
      config,
      manifestItems: [],
      sectionName: 'pages',
      fixedTimestamp: '2024-01-15T10:00:00Z',
    });

    expect(result).toContain('\n  "version"');
  });

  it('should match parsed object from createCitationsJson', () => {
    const config = createFullConfig();
    const manifestItems = createManifestItems();
    const options = {
      config,
      manifestItems,
      sectionName: 'content',
      fixedTimestamp: '2024-01-15T10:00:00Z',
    };

    const obj = createCitationsJson(options);
    const str = createCitationsJsonString(options);

    expect(JSON.parse(str)).toEqual(obj);
  });
});

describe('createCitation (legacy)', () => {
  it('should create citation with required fields', () => {
    const page = { path: '/test', title: 'Test Page' };
    const manifest = { baseUrl: 'https://example.com' };

    const result = createCitation(page, manifest);

    expect(result.url).toBe('https://example.com/test');
    expect(result.title).toBe('Test Page');
  });

  it('should include description when present', () => {
    const page = { path: '/test', title: 'Test', description: 'A test page' };
    const manifest = { baseUrl: 'https://example.com' };

    const result = createCitation(page, manifest);

    expect(result.description).toBe('A test page');
  });

  it('should use path as title when title is missing', () => {
    const page = { path: '/untitled' };
    const manifest = { baseUrl: 'https://example.com' };

    const result = createCitation(page, manifest);

    expect(result.title).toBe('/untitled');
  });
});

describe('citationToMarkdown', () => {
  it('should format citation as markdown link', () => {
    const citation = {
      url: 'https://example.com/test',
      title: 'Test Page',
    };

    const result = citationToMarkdown(citation);

    expect(result).toBe('[Test Page](https://example.com/test)');
  });

  it('should include description when present', () => {
    const citation = {
      url: 'https://example.com/test',
      title: 'Test Page',
      description: 'A test page',
    };

    const result = citationToMarkdown(citation);

    expect(result).toBe('[Test Page](https://example.com/test) - A test page');
  });
});

describe('citationToJsonLd', () => {
  it('should create valid JSON-LD object', () => {
    const citation = {
      url: 'https://example.com/test',
      title: 'Test Page',
    };

    const result = citationToJsonLd(citation);

    expect(result['@type']).toBe('WebPage');
    expect(result.name).toBe('Test Page');
    expect(result.url).toBe('https://example.com/test');
  });

  it('should include description when present', () => {
    const citation = {
      url: 'https://example.com/test',
      title: 'Test Page',
      description: 'A test page',
    };

    const result = citationToJsonLd(citation);

    expect(result.description).toBe('A test page');
  });
});

describe('generateReferenceList', () => {
  it('should generate numbered reference list', () => {
    const citations = [
      { url: 'https://example.com/one', title: 'First' },
      { url: 'https://example.com/two', title: 'Second' },
    ];

    const result = generateReferenceList(citations);

    expect(result).toContain('## References');
    expect(result).toContain('1. [First](https://example.com/one)');
    expect(result).toContain('2. [Second](https://example.com/two)');
  });

  it('should handle empty citations array', () => {
    const result = generateReferenceList([]);

    expect(result).toContain('## References');
  });
});

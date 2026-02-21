/**
 * Tests for llms-full.txt generation.
 * Tests createLlmsFullTxt function with full LlmsSeoConfig.
 */

import { describe, it, expect } from 'vitest';
import { createLlmsFullTxt, generateLlmsFullTxt, generatePageContent } from '../src/core/generate/llms-full-txt.js';
import type { LlmsSeoConfig } from '../src/schema/config.schema.js';
import type { SiteManifest, PageManifest, ManifestItem } from '../src/schema/manifest.schema.js';

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
      description: 'Acme Corporation is a leading provider of innovative solutions for businesses worldwide.',
      org: 'Acme Corp Inc.',
      locales: ['en', 'uk', 'de'],
    },
    sections: {
      hubs: ['/services', '/blog', '/projects', '/cases', '/contact'],
    },
    contact: {
      email: 'contact@acme.com',
      phone: '+1-555-123-4567',
      social: {
        twitter: 'https://twitter.com/acmecorp',
        linkedin: 'https://linkedin.com/company/acme-corp',
        github: 'https://github.com/acmecorp',
      },
    },
    policy: {
      geoPolicy: 'Services available in North America and Europe only.',
      citationRules: 'Always cite original sources with proper attribution.',
      restrictedClaims: {
        enable: true,
        forbidden: ['best', '#1', 'guaranteed', 'revolutionary'],
        whitelist: ['industry-leading'],
      },
    },
    booking: {
      url: 'https://cal.com/acme/consultation',
      label: 'Book a consultation',
    },
    machineHints: {
      robots: 'https://example.com/robots.txt',
      sitemap: 'https://example.com/sitemap.xml',
      llmsTxt: 'https://example.com/llms.txt',
      llmsFullTxt: 'https://example.com/llms-full.txt',
    },
    output: {
      paths: {
        llmsTxt: 'public/llms.txt',
        llmsFullTxt: 'public/llms-full.txt',
        citations: 'public/citations.json',
      },
    },
    format: {
      lineEndings: 'lf',
      trailingSlash: 'never',
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

describe('createLlmsFullTxt', () => {
  describe('with minimal config', () => {
    it('should generate llms-full.txt with required fields only', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('# Test Brand - Full LLM Context');
      expect(result.content).toContain('Locales: en');
      expect(result.byteSize).toBeGreaterThan(0);
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it('should not include optional sections when not provided', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).not.toContain('## All Canonical URLs');
      expect(result.content).not.toContain('## Policies');
      expect(result.content).not.toContain('## Social & Booking');
      expect(result.content).not.toContain('## Machine Hints');
    });

    it('should include canonical URLs when provided', () => {
      const config = createMinimalConfig();
      const canonicalUrls = [
        'https://example.com/',
        'https://example.com/about',
        'https://example.com/services',
      ];
      const result = createLlmsFullTxt({
        config,
        canonicalUrls,
        manifestItems: [],
      });

      expect(result.content).toContain('## All Canonical URLs');
      expect(result.content).toContain('https://example.com/');
      expect(result.content).toContain('https://example.com/about');
      expect(result.content).toContain('https://example.com/services');
    });
  });

  describe('with full config', () => {
    it('should generate complete llms-full.txt with all sections', () => {
      const config = createFullConfig();
      const canonicalUrls = ['https://example.com/'];
      const manifestItems = createManifestItems();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls,
        manifestItems,
      });

      expect(result.content).toContain('# Acme Corporation - Full LLM Context');
      expect(result.content).toContain('> Building the future, today');
      expect(result.content).toContain('## All Canonical URLs');
      expect(result.content).toContain('## Policies');
      expect(result.content).toContain('## Contact');
      expect(result.content).toContain('## Machine Hints');
      expect(result.content).toContain('## Sitemap');
    });

    it('should include brand description', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Acme Corporation is a leading provider');
    });

    it('should include organization name', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Organization: Acme Corp Inc.');
    });

    it('should include all locales', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Locales: en, uk, de');
    });

    it('should include Last Updated from manifest items', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: createManifestItems(),
      });

      expect(result.content).toContain('Last Updated: 2024-01-15');
    });

    it('should include detailed GEO policy section', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('### GEO Policy');
      expect(result.content).toContain('Services available in North America and Europe only.');
    });

    it('should include detailed citation rules section', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('### Citation Rules');
      expect(result.content).toContain('Always cite original sources with proper attribution.');
    });

    it('should include detailed restricted claims section', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('### Restricted Claims');
      expect(result.content).toContain('Status: Enabled');
      expect(result.content).toContain('Forbidden terms: best, #1, guaranteed, revolutionary');
      expect(result.content).toContain('Exceptions: industry-leading');
    });

    it('should include all social links', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Twitter: https://twitter.com/acmecorp');
      expect(result.content).toContain('LinkedIn: https://linkedin.com/company/acme-corp');
      expect(result.content).toContain('GitHub: https://github.com/acmecorp');
    });

    it('should include contact email and phone', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Email: contact@acme.com');
      expect(result.content).toContain('Phone: +1-555-123-4567');
    });

    it('should include booking with label', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Booking: https://cal.com/acme/consultation (Book a consultation)');
    });

    it('should include all machine hints', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('robots.txt: https://example.com/robots.txt');
      expect(result.content).toContain('sitemap.xml: https://example.com/sitemap.xml');
      expect(result.content).toContain('llms.txt: https://example.com/llms.txt');
      expect(result.content).toContain('llms-full.txt: https://example.com/llms-full.txt');
    });

    it('should include manifest items in sitemap', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems,
      });

      expect(result.content).toContain('Web Development Services');
      expect(result.content).toContain('/services/web-development');
      expect(result.content).toContain('First Blog Post');
      expect(result.content).toContain('/blog/post-1');
    });

    it('should use routing-aware canonical URLs in sitemap entries when provided', () => {
      const config = createFullConfig();
      const manifestItems = createManifestItems();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems,
        manifestEntries: [
          {
            item: manifestItems[0]!,
            canonicalUrl: 'https://example.com/services/en/web-development',
            sectionName: 'services',
          },
        ],
      });

      expect(result.content).toContain('https://example.com/services/en/web-development');
      expect(result.content).not.toContain('https://example.com/services/web-development');
    });

    it('should include section hubs in sitemap', () => {
      const config = createFullConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('[/services](/services)');
      expect(result.content).toContain('[/blog](/blog)');
      expect(result.content).toContain('[/projects](/projects)');
    });
  });

  describe('line endings', () => {
    it('should use LF by default', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).not.toContain('\r\n');
    });

    it('should use CRLF when configured', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        format: {
          lineEndings: 'crlf',
          trailingSlash: 'never',
        },
      };
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('\r\n');
    });
  });

  describe('determinism', () => {
    it('should produce identical output for same input', () => {
      const config = createFullConfig();
      const canonicalUrls = [
        'https://example.com/blog/post-1',
        'https://example.com/services',
        'https://example.com/about',
      ];
      const manifestItems = createManifestItems();

      const result1 = createLlmsFullTxt({ config, canonicalUrls, manifestItems });
      const result2 = createLlmsFullTxt({ config, canonicalUrls, manifestItems });

      expect(result1.content).toBe(result2.content);
      expect(result1.byteSize).toBe(result2.byteSize);
      expect(result1.lineCount).toBe(result2.lineCount);
    });

    it('should sort URLs alphabetically', () => {
      const config = createMinimalConfig();
      const canonicalUrls = [
        'https://example.com/zebra',
        'https://example.com/alpha',
        'https://example.com/beta',
      ];
      const result = createLlmsFullTxt({
        config,
        canonicalUrls,
        manifestItems: [],
      });

      const alphaIndex = result.content.indexOf('https://example.com/alpha');
      const betaIndex = result.content.indexOf('https://example.com/beta');
      const zebraIndex = result.content.indexOf('https://example.com/zebra');

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zebraIndex);
    });

    it('should sort manifest items by slug', () => {
      const config = createMinimalConfig();
      const manifestItems: ManifestItem[] = [
        { slug: '/zebra', title: 'Zebra' },
        { slug: '/alpha', title: 'Alpha' },
        { slug: '/beta', title: 'Beta' },
      ];
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems,
      });

      const alphaIndex = result.content.indexOf('Alpha');
      const betaIndex = result.content.indexOf('Beta');
      const zebraIndex = result.content.indexOf('Zebra');

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zebraIndex);
    });
  });

  describe('missing optional fields', () => {
    it('should handle missing tagline gracefully', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).not.toContain('>');
    });

    it('should handle missing org gracefully', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).not.toContain('Organization:');
    });

    it('should handle missing social links gracefully', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        contact: {
          email: 'test@example.com',
        },
      };
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).not.toContain('Twitter:');
      expect(result.content).not.toContain('LinkedIn:');
    });

    it('should handle disabled restricted claims', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        policy: {
          restrictedClaims: {
            enable: false,
          },
        },
      };
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Status: Disabled');
    });

    it('should handle restricted claims without forbidden list', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        policy: {
          restrictedClaims: {
            enable: true,
            whitelist: ['allowed-term'],
          },
        },
      };
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.content).toContain('Status: Enabled');
      expect(result.content).toContain('Exceptions: allowed-term');
      expect(result.content).not.toContain('Forbidden terms:');
    });
  });

  describe('metadata', () => {
    it('should return correct byteSize', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      expect(result.byteSize).toBe(Buffer.byteLength(result.content, 'utf-8'));
    });

    it('should return correct lineCount', () => {
      const config = createMinimalConfig();
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      const lines = result.content.split('\n');
      expect(result.lineCount).toBe(lines.length);
    });

    it('should return correct lineCount for CRLF', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        format: {
          lineEndings: 'crlf',
          trailingSlash: 'never',
        },
      };
      const result = createLlmsFullTxt({
        config,
        canonicalUrls: [],
        manifestItems: [],
      });

      const lines = result.content.split('\r\n');
      expect(result.lineCount).toBe(lines.length);
    });
  });
});

describe('generateLlmsFullTxt (legacy)', () => {
  it('should generate full llms-full.txt content', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      description: 'A test site',
      pages: [
        { path: '/', title: 'Home', content: 'Welcome to the site' },
        { path: '/about', title: 'About', content: 'About us page' },
      ],
    };

    const result = generateLlmsFullTxt(manifest);

    // New format uses "Full LLM Context" instead of "(Full)"
    expect(result).toContain('# Test Site - Full LLM Context');
    // Legacy function doesn't include page content in the new format
    expect(result).toContain('Test Site');
  });

  it('should include URLs for each page', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      pages: [
        { path: '/test', title: 'Test Page' },
      ],
    };

    const result = generateLlmsFullTxt(manifest);

    // URLs are now listed in "All Canonical URLs" section
    expect(result).toContain('https://example.com/test');
  });
});

describe('generatePageContent (legacy)', () => {
  it('should truncate content when maxContentLength is set', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      pages: [],
    };

    const page: PageManifest = {
      path: '/test',
      title: 'Test',
      content: 'This is a very long content that should be truncated at the specified length',
    };

    const result = generatePageContent(page, manifest, { maxContentLength: 20 });

    expect(result.length).toBeLessThan(100);
    expect(result).toContain('...');
  });

  it('should include description when present', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      pages: [],
    };

    const page: PageManifest = {
      path: '/test',
      title: 'Test',
      description: 'Page description',
    };

    const result = generatePageContent(page, manifest);

    expect(result).toContain('Page description');
  });
});

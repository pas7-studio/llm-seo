/**
 * Tests for llms.txt generation.
 * Tests createLlmsTxt function with full LlmsSeoConfig.
 */

import { describe, it, expect } from 'vitest';
import { createLlmsTxt, generateLlmsTxt } from '../src/core/generate/llms-txt.js';
import type { LlmsSeoConfig } from '../src/schema/config.schema.js';
import type { SiteManifest } from '../src/schema/manifest.schema.js';

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

describe('createLlmsTxt', () => {
  describe('with minimal config', () => {
    it('should generate llms.txt with required fields only', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('# Test Brand');
      expect(result.content).not.toContain('>');
      expect(result.byteSize).toBeGreaterThan(0);
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it('should not include optional sections when not provided', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).not.toContain('## Sections');
      expect(result.content).not.toContain('## Policies');
      expect(result.content).not.toContain('## Contact');
      expect(result.content).not.toContain('## Machine Hints');
    });

    it('should include canonical URLs when provided', () => {
      const config = createMinimalConfig();
      const canonicalUrls = [
        'https://example.com/',
        'https://example.com/about',
        'https://example.com/services',
      ];
      const result = createLlmsTxt({ config, canonicalUrls });

      expect(result.content).toContain('## URLs');
      expect(result.content).toContain('https://example.com/');
      expect(result.content).toContain('https://example.com/about');
      expect(result.content).toContain('https://example.com/services');
    });
  });

  describe('with full config', () => {
    it('should generate complete llms.txt with all sections', () => {
      const config = createFullConfig();
      const canonicalUrls = [
        'https://example.com/',
        'https://example.com/services',
        'https://example.com/blog',
      ];
      const result = createLlmsTxt({ config, canonicalUrls });

      expect(result.content).toContain('# Acme Corporation');
      expect(result.content).toContain('> Building the future, today');
      expect(result.content).toContain('## Sections');
      expect(result.content).toContain('## URLs');
      expect(result.content).toContain('## Policies');
      expect(result.content).toContain('## Contact');
      expect(result.content).toContain('## Machine Hints');
    });

    it('should include brand description', () => {
      const config = createFullConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('Acme Corporation is a leading provider');
    });

    it('should include all policy fields', () => {
      const config = createFullConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('GEO: Services available in North America');
      expect(result.content).toContain('Citations: Always cite original sources');
      expect(result.content).toContain('Restricted Claims: Enabled');
    });

    it('should include all contact fields', () => {
      const config = createFullConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('Email: contact@acme.com');
      expect(result.content).toContain('Phone: +1-555-123-4567');
      expect(result.content).toContain('Twitter: https://twitter.com/acmecorp');
      expect(result.content).toContain('LinkedIn: https://linkedin.com/company/acme-corp');
      expect(result.content).toContain('GitHub: https://github.com/acmecorp');
      expect(result.content).toContain('Booking: https://cal.com/acme/consultation');
    });

    it('should include all machine hints', () => {
      const config = createFullConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('robots.txt: https://example.com/robots.txt');
      expect(result.content).toContain('sitemap.xml: https://example.com/sitemap.xml');
      expect(result.content).toContain('llms.txt: https://example.com/llms.txt');
      expect(result.content).toContain('llms-full.txt: https://example.com/llms-full.txt');
    });

    it('should include all section hubs', () => {
      const config = createFullConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('[/services](/services)');
      expect(result.content).toContain('[/blog](/blog)');
      expect(result.content).toContain('[/projects](/projects)');
      expect(result.content).toContain('[/cases](/cases)');
      expect(result.content).toContain('[/contact](/contact)');
    });
  });

  describe('line endings', () => {
    it('should use LF by default', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

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
      const result = createLlmsTxt({ config, canonicalUrls: [] });

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

      const result1 = createLlmsTxt({ config, canonicalUrls });
      const result2 = createLlmsTxt({ config, canonicalUrls });

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
      const result = createLlmsTxt({ config, canonicalUrls });

      const alphaIndex = result.content.indexOf('https://example.com/alpha');
      const betaIndex = result.content.indexOf('https://example.com/beta');
      const zebraIndex = result.content.indexOf('https://example.com/zebra');

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zebraIndex);
    });

    it('should sort section hubs alphabetically', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        sections: {
          hubs: ['/zebra', '/alpha', '/beta'],
        },
      };
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      const alphaIndex = result.content.indexOf('[/alpha]');
      const betaIndex = result.content.indexOf('[/beta]');
      const zebraIndex = result.content.indexOf('[/zebra]');

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zebraIndex);
    });
  });

  describe('missing optional fields', () => {
    it('should handle missing tagline gracefully', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).not.toContain('>');
      expect(result.content).toContain('# Test Brand');
    });

    it('should handle missing description gracefully', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      // Should start with # Test Brand
      expect(result.content).toContain('# Test Brand');
      // No tagline blockquote since tagline is not set
      expect(result.content).not.toContain('>');
    });

    it('should handle missing social links gracefully', () => {
      const config: LlmsSeoConfig = {
        ...createMinimalConfig(),
        contact: {
          email: 'test@example.com',
        },
      };
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('Email: test@example.com');
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
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.content).toContain('Restricted Claims: Disabled');
    });
  });

  describe('metadata', () => {
    it('should return correct byteSize', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      expect(result.byteSize).toBe(Buffer.byteLength(result.content, 'utf-8'));
    });

    it('should return correct lineCount', () => {
      const config = createMinimalConfig();
      const result = createLlmsTxt({ config, canonicalUrls: [] });

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
      const result = createLlmsTxt({ config, canonicalUrls: [] });

      const lines = result.content.split('\r\n');
      expect(result.lineCount).toBe(lines.length);
    });
  });
});

describe('generateLlmsTxt (legacy)', () => {
  it('should generate basic llms.txt content', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      description: 'A test site for llm-seo',
      pages: [
        { path: '/', title: 'Home', description: 'Homepage' },
        { path: '/about', title: 'About', description: 'About page' },
      ],
    };

    const result = generateLlmsTxt(manifest);

    // Note: description is rendered as plain text, not blockquote (tagline is blockquote)
    expect(result).toContain('# Test Site');
    expect(result).toContain('A test site for llm-seo');
  });

  it('should sort pages deterministically', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      pages: [
        { path: '/zebra' },
        { path: '/alpha' },
        { path: '/beta' },
      ],
    };

    const result = generateLlmsTxt(manifest);
    const alphaIndex = result.indexOf('/alpha');
    const betaIndex = result.indexOf('/beta');
    const zebraIndex = result.indexOf('/zebra');

    expect(alphaIndex).toBeLessThan(betaIndex);
    expect(betaIndex).toBeLessThan(zebraIndex);
  });

  it('should handle pages without titles', () => {
    const manifest: SiteManifest = {
      baseUrl: 'https://example.com',
      title: 'Test Site',
      pages: [
        { path: '/untitled' },
      ],
    };

    const result = generateLlmsTxt(manifest);

    expect(result).toContain('/untitled');
  });
});

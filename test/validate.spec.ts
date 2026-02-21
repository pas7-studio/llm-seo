/**
 * Tests for schema validation.
 */

import { describe, it, expect } from 'vitest';
import { validate, validateOrThrow, formatValidationErrors, validateLlmsSeoConfig, normalizeHubPaths } from '../src/schema/validate.js';
import { SiteManifestSchema, ConfigSchema, LlmsSeoConfigSchema } from '../src/schema/index.js';

/**
 * Creates a valid full config for testing.
 */
function createValidConfig() {
  return {
    site: {
      baseUrl: 'https://example.com',
      defaultLocale: 'en',
    },
    brand: {
      name: 'Test Brand',
      locales: ['en', 'uk', 'de'],
    },
    sections: {
      hubs: ['/services', '/blog', '/projects'],
    },
    manifests: {
      blog: [
        { slug: '/blog/post-1', title: 'First Post' },
        { slug: '/blog/post-2', title: 'Second Post' },
      ],
    },
    contact: {
      email: 'test@example.com',
      social: {
        twitter: 'testbrand',
      },
    },
    output: {
      paths: {
        llmsTxt: 'public/llms.txt',
        llmsFullTxt: 'public/llms-full.txt',
      },
    },
    format: {
      trailingSlash: 'never' as const,
      lineEndings: 'lf' as const,
    },
  };
}

describe('validate', () => {
  describe('SiteManifestSchema', () => {
    it('should validate a valid manifest', () => {
      const data = {
        baseUrl: 'https://example.com',
        title: 'Test Site',
        pages: [
          { path: '/' },
          { path: '/about', title: 'About' },
        ],
      };

      const result = validate(SiteManifestSchema, data);

      expect(result.success).toBe(true);
      expect(result.data?.baseUrl).toBe('https://example.com');
    });

    it('should reject manifest without baseUrl', () => {
      const data = {
        title: 'Test Site',
        pages: [{ path: '/' }],
      };

      const result = validate(SiteManifestSchema, data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => e.path === 'baseUrl')).toBe(true);
    });

    it('should reject manifest without pages', () => {
      const data = {
        baseUrl: 'https://example.com',
        title: 'Test Site',
        pages: [],
      };

      const result = validate(SiteManifestSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const data = {
        baseUrl: 'not-a-url',
        title: 'Test Site',
        pages: [{ path: '/' }],
      };

      const result = validate(SiteManifestSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('ConfigSchema', () => {
    it('should validate a valid config', () => {
      const data = {
        baseUrl: 'https://example.com',
        title: 'Test Site',
      };

      const result = validate(ConfigSchema, data);

      expect(result.success).toBe(true);
      expect(result.data?.outputDir).toBe('./public');
    });

    it('should apply default values', () => {
      const data = {
        baseUrl: 'https://example.com',
        title: 'Test Site',
      };

      const result = validate(ConfigSchema, data);

      expect(result.success).toBe(true);
      expect(result.data?.outputDir).toBe('./public');
      expect(result.data?.includeOptionalSections).toBe(false);
    });
  });
});

describe('validateOrThrow', () => {
  it('should return data on success', () => {
    const data = {
      baseUrl: 'https://example.com',
      title: 'Test',
      pages: [{ path: '/' }],
    };

    const result = validateOrThrow(SiteManifestSchema, data);

    expect(result.baseUrl).toBe('https://example.com');
  });

  it('should throw on failure', () => {
    const data = {
      title: 'Missing baseUrl',
      pages: [{ path: '/' }],
    };

    expect(() => validateOrThrow(SiteManifestSchema, data)).toThrow();
  });
});

describe('formatValidationErrors', () => {
  it('should format errors into readable string', () => {
    const issues = [
      { path: 'baseUrl', message: 'Invalid URL', code: 'invalid_string', severity: 'error' as const },
      { path: 'pages.0.path', message: 'Required', code: 'invalid_type', severity: 'error' as const },
    ];

    const result = formatValidationErrors(issues);

    expect(result).toContain('Validation failed:');
    expect(result).toContain('baseUrl: Invalid URL');
    expect(result).toContain('pages.0.path: Required');
  });
});

describe('LlmsSeoConfigSchema', () => {
  describe('Valid full config', () => {
    it('should validate a valid full config', () => {
      const data = createValidConfig();

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(true);
    });
  });

  describe('site.baseUrl validation', () => {
    it('should reject baseUrl without protocol', () => {
      const data = {
        ...createValidConfig(),
        site: {
          baseUrl: 'example.com',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.path === 'site.baseUrl' && e.code === 'invalid_string'
      )).toBe(true);
    });

    it('should reject baseUrl with trailing slash', () => {
      const data = {
        ...createValidConfig(),
        site: {
          baseUrl: 'https://example.com/',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.path === 'site.baseUrl' && e.message.includes('trailing slash')
      )).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const data = {
        ...createValidConfig(),
        site: {
          baseUrl: 'not-a-url',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('site.defaultLocale validation', () => {
    it('should reject defaultLocale not in locales', () => {
      const data = {
        ...createValidConfig(),
        site: {
          baseUrl: 'https://example.com',
          defaultLocale: 'fr',
        },
        brand: {
          name: 'Test Brand',
          locales: ['en', 'uk', 'de'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'invalid_default_locale'
      )).toBe(true);
    });

    it('should accept defaultLocale that exists in locales', () => {
      const data = {
        ...createValidConfig(),
        site: {
          baseUrl: 'https://example.com',
          defaultLocale: 'uk',
        },
        brand: {
          name: 'Test Brand',
          locales: ['en', 'uk', 'de'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(true);
    });
  });

  describe('sections.hubs validation', () => {
    it('should reject hub path without leading slash', () => {
      const data = {
        ...createValidConfig(),
        sections: {
          hubs: ['services', '/blog'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'invalid_hub_path' && e.message.includes('leading slash')
      )).toBe(true);
    });

    it('should reject hub path with query string', () => {
      const data = {
        ...createValidConfig(),
        sections: {
          hubs: ['/services?param=value'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'invalid_hub_path' && e.message.includes('query string')
      )).toBe(true);
    });

    it('should reject hub path with hash', () => {
      const data = {
        ...createValidConfig(),
        sections: {
          hubs: ['/services#section'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'invalid_hub_path' && e.message.includes('hash')
      )).toBe(true);
    });

    it('should reject hub path with double slashes', () => {
      const data = {
        ...createValidConfig(),
        sections: {
          hubs: ['//services'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'invalid_hub_path' && e.message.includes('double slash')
      )).toBe(true);
    });

    it('should accept valid hub paths', () => {
      const data = {
        ...createValidConfig(),
        sections: {
          hubs: ['/services', '/blog', '/projects'],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(true);
    });
  });

  describe('manifest items validation', () => {
    it('should reject duplicate manifest items (same slug + locale)', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: [
            { slug: '/blog/post-1', locales: ['en', 'uk'] },
            { slug: '/blog/post-1', locales: ['en'] },
          ],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'duplicate_manifest_item'
      )).toBe(true);
    });

    it('should allow same slug with different locales', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: [
            { slug: '/blog/post-1', locales: ['en'] },
            { slug: '/blog/post-1', locales: ['uk'] },
          ],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty slug', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: [
            { slug: '', title: 'Empty Slug' },
          ],
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'empty_slug' || e.code === 'too_small'
      )).toBe(true);
    });

    it('should accept section-level manifest config with routing fields', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: {
            items: [
              { slug: '/llm-seo', locales: ['en', 'uk'] },
            ],
            sectionName: 'Blog',
            routeStyle: 'locale-segment',
            sectionPath: '/blog',
            defaultLocaleOverride: 'en',
          },
        },
      };

      const result = validateLlmsSeoConfig(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid defaultLocaleOverride not in brand.locales', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: {
            items: [{ slug: '/llm-seo' }],
            defaultLocaleOverride: 'fr',
          },
        },
      };

      const result = validateLlmsSeoConfig(data);
      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => e.code === 'invalid_default_locale_override')).toBe(true);
    });

    it('should reject custom routeStyle without pathnameFor', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          legal: {
            items: [{ slug: '/terms' }],
            routeStyle: 'custom',
          },
        },
      };

      const result = validateLlmsSeoConfig(data);
      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => e.code === 'missing_custom_pathname')).toBe(true);
    });

    it('should reject slug that already includes sectionPath', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: {
            sectionPath: '/blog',
            routeStyle: 'prefix',
            items: [{ slug: '/blog/post-1' }],
          },
        },
      };

      const result = validateLlmsSeoConfig(data);
      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => e.code === 'incompatible_slug')).toBe(true);
    });

    it('should reject locale-prefixed slug for routeStyle prefix', () => {
      const data = {
        ...createValidConfig(),
        manifests: {
          blog: {
            sectionPath: '/blog',
            routeStyle: 'prefix',
            items: [{ slug: '/uk/post-1' }],
          },
        },
      };

      const result = validateLlmsSeoConfig(data);
      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => e.code === 'incompatible_slug')).toBe(true);
    });
  });

  describe('contact validation', () => {
    it('should reject missing contact (no email, no social)', () => {
      const data = {
        ...createValidConfig(),
        contact: {},
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(false);
      expect(result.issues?.some((e) => 
        e.code === 'missing_contact'
      )).toBe(true);
    });

    it('should accept contact with only email', () => {
      const data = {
        ...createValidConfig(),
        contact: {
          email: 'test@example.com',
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(true);
    });

    it('should accept contact with only social', () => {
      const data = {
        ...createValidConfig(),
        contact: {
          social: {
            twitter: 'testbrand',
          },
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(true);
    });

    it('should accept contact with github social', () => {
      const data = {
        ...createValidConfig(),
        contact: {
          social: {
            github: 'testorg',
          },
        },
      };

      const result = validateLlmsSeoConfig(data);

      expect(result.success).toBe(true);
    });
  });

  describe('output.paths validation', () => {
    it('should reject empty llmsTxt path', () => {
      const data = {
        ...createValidConfig(),
        output: {
          paths: {
            llmsTxt: '',
            llmsFullTxt: 'public/llms-full.txt',
          },
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject empty llmsFullTxt path', () => {
      const data = {
        ...createValidConfig(),
        output: {
          paths: {
            llmsTxt: 'public/llms.txt',
            llmsFullTxt: '',
          },
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
    });

    it('should require output.paths', () => {
      const data = {
        ...createValidConfig(),
        output: {},
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('format.trailingSlash validation', () => {
    it('should accept "always" trailingSlash', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'always',
          lineEndings: 'lf',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(true);
    });

    it('should accept "never" trailingSlash', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'never',
          lineEndings: 'lf',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(true);
    });

    it('should accept "preserve" trailingSlash', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'preserve',
          lineEndings: 'lf',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid trailingSlash value', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'invalid',
          lineEndings: 'lf',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('format.lineEndings validation', () => {
    it('should accept "lf" lineEndings', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'never',
          lineEndings: 'lf',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(true);
    });

    it('should accept "crlf" lineEndings', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'never',
          lineEndings: 'crlf',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid lineEndings value', () => {
      const data = {
        ...createValidConfig(),
        format: {
          trailingSlash: 'never',
          lineEndings: 'cr',
        },
      };

      const result = validate(LlmsSeoConfigSchema, data);

      expect(result.success).toBe(false);
    });
  });
});

describe('normalizeHubPaths', () => {
  it('should remove query strings from paths', () => {
    const result = normalizeHubPaths(['/services?param=value']);

    expect(result[0]).toBe('/services');
  });

  it('should remove hashes from paths', () => {
    const result = normalizeHubPaths(['/services#section']);

    expect(result[0]).toBe('/services');
  });

  it('should remove double slashes', () => {
    const result = normalizeHubPaths(['//services']);

    expect(result[0]).toBe('/services');
  });

  it('should trim whitespace', () => {
    const result = normalizeHubPaths(['  /services  ']);

    expect(result[0]).toBe('/services');
  });

  it('should handle multiple normalizations', () => {
    const result = normalizeHubPaths(['/services//path?param=value#section']);

    expect(result[0]).toBe('/services/path');
  });
});

/**
 * @pas7/llm-seo Configuration Example
 * 
 * Copy this file to llm-seo.config.ts and customize for your site.
 * 
 * Documentation: https://github.com/pas7studio/llm-seo#readme
 */

import type { LlmsSeoConfig } from '@pas7/llm-seo';

export default {
  // ===========================================
  // Site Configuration
  // ===========================================
  site: {
    /** Your site's base URL (required) - no trailing slash */
    baseUrl: 'https://example.com',
    
    /** Default locale for canonical URLs (optional) */
    defaultLocale: 'en',
  },

  // ===========================================
  // Brand Information
  // ===========================================
  brand: {
    /** Brand name (required) */
    name: 'Your Brand Name',
    
    /** Short tagline (optional) */
    tagline: 'Your tagline here',
    
    /** Longer description (optional) */
    description: 'Your brand description. This helps LLMs understand what your site is about.',
    
    /** Organization name (optional) - for structured data */
    org: 'Your Organization',
    
    /** Supported locales (required) - e.g., ["en", "uk", "de"] */
    locales: ['en', 'uk', 'de'],
  },

  // ===========================================
  // Section Hubs
  // ===========================================
  sections: {
    /**
     * Main navigation paths/sections of your site.
     * These appear in llms.txt as important entry points.
     */
    hubs: [
      '/services',
      '/blog',
      '/projects',
      '/cases',
      '/contact',
    ],
  },

  // ===========================================
  // Content Manifests
  // ===========================================
  /**
   * Your content manifests - define pages/posts for each section.
   * This is used to generate canonical URLs and citations.
   * 
   * Structure:
   * manifests: {
   *   [sectionName]: PageManifest[]
   * }
   */
  manifests: {
    blog: {
      sectionName: 'Blog',
      sectionPath: '/blog',
      routeStyle: 'locale-segment',
      items: [
        {
          slug: '/getting-started-with-llm-seo',
          locales: ['en'],
          publishedAt: '2024-01-15',
          updatedAt: '2024-02-01',  // optional
          priority: 80,             // optional, 0-100
          title: 'Getting Started with LLM SEO',  // optional
          description: 'Learn how to optimize for LLMs',  // optional
        },
        {
          slug: '/ai-search-optimization',
          locales: ['en', 'uk'],
          publishedAt: '2024-02-10',
          priority: 90,
        },
      ],
    },
    services: {
      sectionPath: '/services',
      routeStyle: 'prefix',
      items: [
        {
          slug: '/web-development',
          locales: ['en', 'uk', 'de'],
          priority: 100,
        },
        {
          slug: '/ai-consulting',
          locales: ['en'],
          priority: 95,
        },
      ],
    },
    contactPages: {
      routeStyle: 'suffix',
      items: [
        {
          slug: '/contact',
          locales: ['en', 'uk'],
          priority: 100,
        },
      ],
    },
  },

  // ===========================================
  // Contact Information
  // ===========================================
  contact: {
    /** Contact email (optional) */
    email: 'contact@example.com',
    
    /** Social media links (optional) */
    social: {
      twitter: 'https://twitter.com/yourbrand',
      linkedin: 'https://linkedin.com/company/yourbrand',
      github: 'https://github.com/yourbrand',
    },
    
    /** Phone number (optional) */
    phone: '+1-555-123-4567',
  },

  // ===========================================
  // Content Policies
  // ===========================================
  policy: {
    /**
     * Geographic policy statement.
     * Helps LLMs understand your service area.
     */
    geoPolicy: 'We operate globally, serving clients worldwide with focus on Europe and North America.',
    
    /**
     * Citation rules for your content.
     * Guides how others should cite your content.
     */
    citationRules: 'Prefer canonical URLs when citing. Avoid UTM parameters in citations.',
    
    /**
     * Restricted claims configuration.
     * Lints content for forbidden marketing language.
     */
    restrictedClaims: {
      /** Enable restricted claims checking */
      enable: true,
      
      /** Forbidden words/phrases */
      forbidden: [
        'best',        // subjective superlative
        '#1',          // ranking claim
        'guaranteed',  // absolute promise
        'cheapest',    // price comparison
        'revolutionary', // overused hype
      ],
      
      /** Allowlisted phrases (won't be flagged even if they contain forbidden words) */
      whitelist: [
        'best practices',
        'industry best practices',
      ],
    },
  },

  // ===========================================
  // Booking/CTA
  // ===========================================
  booking: {
    /** Booking URL - e.g., Cal.com or Calendly link */
    url: 'https://cal.com/yourbrand/consultation',
    
    /** CTA label */
    label: 'Book a consultation',
  },

  // ===========================================
  // Machine Hints (URLs for bots)
  // ===========================================
  machineHints: {
    /** URL to robots.txt */
    robots: 'https://example.com/robots.txt',
    
    /** URL to sitemap.xml */
    sitemap: 'https://example.com/sitemap.xml',
    
    /** URL to llms.txt */
    llmsTxt: 'https://example.com/llms.txt',
    
    /** URL to llms-full.txt */
    llmsFullTxt: 'https://example.com/llms-full.txt',
  },

  // ===========================================
  // Output Configuration
  // ===========================================
  output: {
    paths: {
      /** Output path for llms.txt (required) */
      llmsTxt: 'public/llms.txt',
      
      /** Output path for llms-full.txt (required) */
      llmsFullTxt: 'public/llms-full.txt',
      
      /** Output path for citations.json (optional) */
      citations: 'public/citations.json',
    },
  },

  // ===========================================
  // Format Options
  // ===========================================
  format: {
    /**
     * Trailing slash handling for URLs.
     * - 'always': Add trailing slash (e.g., /blog/)
     * - 'never': Remove trailing slash (e.g., /blog)
     * - 'preserve': Keep as-is
     */
    trailingSlash: 'never',
    
    /**
     * Line endings format.
     * - 'lf': Unix-style (\n)
     * - 'crlf': Windows-style (\r\n)
     */
    lineEndings: 'lf',
    
    /**
     * Locale URL strategy.
     * - 'prefix': /en/blog, /uk/blog
     * - 'subdomain': en.example.com, uk.example.com
     * - 'none': No locale in URL
     */
    localeStrategy: 'prefix',
  },
} satisfies LlmsSeoConfig;

/**
 * Type exports for your manifests
 * 
 * You can import PageManifest type for type-safe manifest definitions:
 * 
 * import type { PageManifest } from '@pas7/llm-seo';
 * 
 * const blogItems: PageManifest[] = [
 *   { slug: '/blog/post-1', locales: ['en'], publishedAt: '2024-01-01' },
 * ];
 */

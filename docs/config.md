# Configuration Reference

Complete configuration reference for `@pas7/llm-seo`.

## Configuration File

Create a `llm-seo.config.ts` file in your project root:

```typescript
import type { LlmsSeoConfig } from '@pas7/llm-seo';

export default {
  // ... configuration
} satisfies LlmsSeoConfig;
```

## LlmsSeoConfig

### site

Site configuration. Required.

```typescript
site: {
  /** Your site's base URL - must be valid URL with http/https, no trailing slash */
  baseUrl: string;
  
  /** Default locale for canonical URLs (optional) */
  defaultLocale?: string;
}
```

**Example:**

```typescript
site: {
  baseUrl: 'https://example.com',
  defaultLocale: 'en',
}
```

### brand

Brand information. Required.

```typescript
brand: {
  /** Brand name - required */
  name: string;
  
  /** Short tagline (optional) */
  tagline?: string;
  
  /** Longer description (optional) */
  description?: string;
  
  /** Organization name (optional) */
  org?: string;
  
  /** Supported locales - required, at least one */
  locales: string[];
}
```

**Example:**

```typescript
brand: {
  name: 'Pas7 Studio',
  tagline: 'AI Automation & Web Development',
  description: 'We build AI-powered solutions for businesses worldwide',
  org: 'Pas7 Studio',
  locales: ['en', 'uk', 'de'],
}
```

### sections

Section hubs configuration. Optional.

```typescript
sections: {
  /** Main navigation paths */
  hubs?: string[];
}
```

**Example:**

```typescript
sections: {
  hubs: ['/services', '/blog', '/projects', '/contact'],
}
```

### manifests

Content manifests. Optional, defaults to `{}`.

```typescript
manifests: {
  [sectionName: string]: PageManifest[] | ManifestSectionConfig;
}

interface PageManifest {
  /** Page path/slug - required */
  slug: string;
  
  /** Available locales - required */
  locales: string[];
  
  /** Publication date (ISO 8601) */
  publishedAt?: string;
  
  /** Last update date (ISO 8601) */
  updatedAt?: string;
  
  /** Priority score (0-100) */
  priority?: number;
  
  /** Page title */
  title?: string;
  
  /** Page description */
  description?: string;
}

type RouteStyle = 'prefix' | 'suffix' | 'locale-segment' | 'custom';

interface ManifestSectionConfig {
  items: PageManifest[];
  sectionName?: string;
  routeStyle?: RouteStyle;
  sectionPath?: string;
  defaultLocaleOverride?: string;
  pathnameFor?: (args: {
    item: PageManifest;
    sectionName: string;
    slug: string;
    locale: string;
    defaultLocale: string;
    sectionPath: string;
  }) => string;
}
```

**Example:**

```typescript
manifests: {
  blog: {
    sectionPath: '/blog',
    routeStyle: 'locale-segment',
    items: [
      {
        slug: '/getting-started',
        locales: ['en', 'uk'],
        publishedAt: '2024-01-15',
        updatedAt: '2024-02-01',
        priority: 80,
        title: 'Getting Started with LLM SEO',
      },
    ],
  },
  contactPages: {
    routeStyle: 'suffix',
    items: [{ slug: '/contact', locales: ['en', 'uk'] }],
  },
}
```

### contact

Contact information. Optional.

```typescript
contact: {
  /** Contact email */
  email?: string;
  
  /** Social media links */
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  
  /** Phone number */
  phone?: string;
}
```

**Example:**

```typescript
contact: {
  email: 'contact@example.com',
  social: {
    twitter: 'https://twitter.com/yourbrand',
    linkedin: 'https://linkedin.com/company/yourbrand',
    github: 'https://github.com/yourbrand',
  },
  phone: '+1-555-123-4567',
}
```

### policy

Content policies. Optional.

```typescript
policy: {
  /** Geographic policy statement */
  geoPolicy?: string;
  
  /** Citation rules */
  citationRules?: string;
  
  /** Restricted claims configuration */
  restrictedClaims?: {
    /** Enable checking */
    enable: boolean;
    
    /** Forbidden words/phrases */
    forbidden?: string[];
    
    /** Allowlisted phrases */
    whitelist?: string[];
  };
}
```

**Example:**

```typescript
policy: {
  geoPolicy: 'We operate globally, serving clients in Europe, North America, and Asia.',
  citationRules: 'Prefer canonical URLs when citing. Avoid UTM parameters.',
  restrictedClaims: {
    enable: true,
    forbidden: ['best', '#1', 'guaranteed', 'cheapest'],
    whitelist: ['best practices'],
  },
}
```

### booking

Booking/CTA configuration. Optional.

```typescript
booking: {
  /** Booking URL */
  url?: string;
  
  /** CTA label */
  label?: string;
}
```

**Example:**

```typescript
booking: {
  url: 'https://cal.com/yourbrand/consultation',
  label: 'Book a consultation',
}
```

### machineHints

Machine hints (URLs for bots). Optional.

```typescript
machineHints: {
  /** URL to robots.txt */
  robots?: string;
  
  /** URL to sitemap.xml */
  sitemap?: string;
  
  /** URL to llms.txt */
  llmsTxt?: string;
  
  /** URL to llms-full.txt */
  llmsFullTxt?: string;
}
```

**Example:**

```typescript
machineHints: {
  robots: 'https://example.com/robots.txt',
  sitemap: 'https://example.com/sitemap.xml',
  llmsTxt: 'https://example.com/llms.txt',
  llmsFullTxt: 'https://example.com/llms-full.txt',
}
```

### output

Output configuration. Required.

```typescript
output: {
  paths: {
    /** Path to llms.txt output - required */
    llmsTxt: string;
    
    /** Path to llms-full.txt output - required */
    llmsFullTxt: string;
    
    /** Path to citations.json output - optional */
    citations?: string;
  };
}
```

**Example:**

```typescript
output: {
  paths: {
    llmsTxt: 'public/llms.txt',
    llmsFullTxt: 'public/llms-full.txt',
    citations: 'public/citations.json',
  },
}
```

### format

Format options. Optional.

```typescript
format: {
  /** Trailing slash handling - default: 'never' */
  trailingSlash?: 'always' | 'never' | 'preserve';
  
  /** Line endings format - default: 'lf' */
  lineEndings?: 'lf' | 'crlf';
  
  /** Locale URL strategy */
  localeStrategy?: 'prefix' | 'subdomain' | 'none';
}
```

**Example:**

```typescript
format: {
  trailingSlash: 'never',
  lineEndings: 'lf',
  localeStrategy: 'prefix',
}
```

## Type Definitions

### LlmsSeoConfig

Full type definition:

```typescript
interface LlmsSeoConfig {
  site: SiteConfig;
  brand: BrandConfig;
  sections?: SectionsConfig;
  manifests?: Record<string, PageManifest[]>;
  contact?: ContactConfig;
  policy?: PolicyConfig;
  booking?: BookingConfig;
  machineHints?: MachineHintsConfig;
  output: OutputConfig;
  format?: FormatConfig;
}
```

### SiteConfig

```typescript
interface SiteConfig {
  baseUrl: string;
  defaultLocale?: string;
}
```

### BrandConfig

```typescript
interface BrandConfig {
  name: string;
  tagline?: string;
  description?: string;
  org?: string;
  locales: string[];
}
```

### PageManifest

```typescript
interface PageManifest {
  slug: string;
  locales: string[];
  publishedAt?: string;
  updatedAt?: string;
  priority?: number;
  title?: string;
  description?: string;
}
```

### ContactConfig

```typescript
interface ContactConfig {
  email?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  phone?: string;
}
```

### PolicyConfig

```typescript
interface PolicyConfig {
  geoPolicy?: string;
  citationRules?: string;
  restrictedClaims?: {
    enable: boolean;
    forbidden?: string[];
    whitelist?: string[];
  };
}
```

### OutputConfig

```typescript
interface OutputConfig {
  paths: {
    llmsTxt: string;
    llmsFullTxt: string;
    citations?: string;
  };
}
```

### FormatConfig

```typescript
interface FormatConfig {
  trailingSlash?: 'always' | 'never' | 'preserve';
  lineEndings?: 'lf' | 'crlf';
  localeStrategy?: 'prefix' | 'subdomain' | 'none';
}
```

## Validation

The configuration is validated using Zod schemas. Common validation errors:

### Base URL Issues

```
❌ Base URL must not have a trailing slash
✅ baseUrl: 'https://example.com'

❌ Must be a valid URL with http or https protocol
✅ baseUrl: 'https://example.com'
```

### Brand Name Issues

```
❌ Brand name is required
✅ name: 'Your Brand'

❌ At least one locale is required
✅ locales: ['en']
```

### Output Path Issues

```
❌ llmsTxt output path is required
✅ llmsTxt: 'public/llms.txt'
```

## Related

- [Format Reference](./format.md) - Output format documentation
- [Policies](./policies.md) - Content policies in detail
- [Next.js Integration](./nextjs.md) - Setup with Next.js

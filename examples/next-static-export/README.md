# Next.js Static Export Example

This example demonstrates how to use `@pas7/llm-seo` with a Next.js static export.

## Overview

This project shows a complete integration of `@pas7/llm-seo` with Next.js for generating LLM-optimized SEO artifacts:

- **`llms.txt`** - Short brand profile for LLMs
- **`llms-full.txt`** - Full context with all content
- **`citations.json`** - Machine-readable citations

## Project Structure

```
next-static-export/
├── README.md              # This file
├── llm-seo.config.ts      # LLM SEO configuration
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js config for static export
├── manifests/
│   ├── blog.ts            # Blog posts manifest
│   ├── services.ts        # Services manifest
│   └── cases.ts           # Case studies manifest
└── public/
    └── (generated files)
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Generate LLM SEO artifacts:

```bash
pnpm build:seo
```

3. Check artifacts for issues:

```bash
pnpm check:seo
```

## Integration

### package.json Scripts

The following scripts are pre-configured:

```json
{
  "scripts": {
    "build:seo": "llm-seo generate --config llm-seo.config.ts",
    "postbuild": "pnpm build:seo && llm-seo check --fail-on error",
    "check:seo": "llm-seo check --fail-on warn"
  }
}
```

### Configuration File

The `llm-seo.config.ts` file contains all settings:

```typescript
import type { LlmsSeoConfig } from '@pas7/llm-seo';
import { blogManifest } from './manifests/blog';
import { servicesManifest } from './manifests/services';
import { casesManifest } from './manifests/cases';

export default {
  site: {
    baseUrl: 'https://example.pas7.studio',
    defaultLocale: 'en',
  },
  brand: {
    name: 'Pas7 Studio',
    tagline: 'AI Automation & Web Development',
    locales: ['en', 'uk'],
  },
  // ... more config
} satisfies LlmsSeoConfig;
```

### Manifests

Manifests define your content structure:

```typescript
// manifests/blog.ts
export const blogManifest = {
  items: [
    {
      slug: '/blog/ai-automation-guide',
      locales: ['en'],
      publishedAt: '2024-01-15T00:00:00Z',
      title: 'Complete Guide to AI Automation',
      priority: 90,
    },
  ] satisfies ManifestItem[],
};
```

## Generated Files

After running `pnpm build:seo`, the following files are generated:

### `public/llms.txt`

```
# Pas7 Studio

> AI Automation & Web Development

We build AI-powered solutions and modern web applications for businesses worldwide

- /services
- /blog
- /projects
- /cases
- /contact

## Blog
- /blog/ai-automation-guide (2024-01-15)
- /blog/nextjs-seo-best-practices (2024-02-10)
...
```

### `public/llms-full.txt`

Full context document with all content, policies, and citations.

### `public/citations.json`

```json
{
  "canonical_urls": [
    "https://example.pas7.studio/blog/ai-automation-guide",
    "https://example.pas7.studio/services/ai-automation"
  ],
  "generated_at": "2024-03-15T12:00:00Z"
}
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Build Next.js
  run: pnpm build

- name: Verify LLM SEO artifacts
  run: pnpm check:seo
```

The `postbuild` script automatically runs after `next build`, generating and verifying SEO artifacts.

## Next.js Config Helper

You can use the helper from the adapter:

```typescript
import { createNextConfig, createRobotsLlmsPolicySnippet } from '@pas7/llm-seo/adapters/next';

const config = createNextConfig({
  baseUrl: 'https://example.pas7.studio',
  locales: ['en', 'uk'],
  defaultLocale: 'en',
  trailingSlash: false,
});

module.exports = config;
```

## Robots.txt Integration

Add LLM policy to your robots.txt:

```typescript
import { createRobotsLlmsPolicySnippet } from '@pas7/llm-seo/adapters/next';

const policy = createRobotsLlmsPolicySnippet({
  baseUrl: 'https://example.pas7.studio',
  allowLlmsTxt: true,
  allowLlmsFullTxt: true,
  allowSitemap: true,
});
```

Output:

```
# LLM SEO
Host: example.pas7.studio
User-agent: *
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /sitemap.xml
```

## Learn More

- [@pas7/llm-seo Documentation](../../docs/README.md)
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [llms.txt Specification](https://llmstxt.org/)

# Next.js Integration

This guide explains how to integrate `@pas7/llm-seo` with Next.js for static export (SSG).

## Overview

Next.js with static export is a perfect match for LLM SEO:

- **Static files** - `llms.txt` served directly from `public/`
- **Build-time generation** - Artifacts generated during build
- **No runtime overhead** - Everything is pre-generated

## Installation

```bash
pnpm add -D @pas7/llm-seo
```

## Project Structure

```
your-nextjs-project/
├── public/
│   ├── llms.txt          # Generated
│   ├── llms-full.txt     # Generated
│   └── citations.json    # Generated (optional)
├── manifests/
│   ├── blog.ts
│   ├── services.ts
│   └── index.ts
├── llm-seo.config.ts
├── next.config.js
└── package.json
```

## Configuration

### 1. Create Config File

`llm-seo.config.ts`:

```typescript
import type { LlmsSeoConfig } from '@pas7/llm-seo';
import { blogManifest } from './manifests/blog';
import { servicesManifest } from './manifests/services';

export default {
  site: {
    baseUrl: 'https://yourdomain.com',
    defaultLocale: 'en',
  },
  brand: {
    name: 'Your Brand',
    tagline: 'Your tagline',
    description: 'Your description',
    locales: ['en', 'uk'],
  },
  sections: {
    hubs: ['/services', '/blog', '/contact'],
  },
  manifests: {
    blog: blogManifest.items,
    services: servicesManifest.items,
  },
  contact: {
    email: 'contact@yourdomain.com',
  },
  output: {
    paths: {
      llmsTxt: 'public/llms.txt',
      llmsFullTxt: 'public/llms-full.txt',
      citations: 'public/citations.json',
    },
  },
  format: {
    trailingSlash: 'never',
    lineEndings: 'lf',
    localeStrategy: 'prefix',
  },
} satisfies LlmsSeoConfig;
```

### 2. Create Manifests

`manifests/blog.ts`:

```typescript
import type { PageManifest } from '@pas7/llm-seo';

export const blogManifest = {
  items: [
    {
      slug: '/blog/getting-started-with-llm-seo',
      locales: ['en'],
      publishedAt: '2024-01-15',
      priority: 90,
      title: 'Getting Started with LLM SEO',
      description: 'Complete guide to optimizing for LLMs',
    },
    {
      slug: '/blog/ai-search-optimization',
      locales: ['en', 'uk'],
      publishedAt: '2024-02-10',
      priority: 80,
    },
  ] satisfies PageManifest[],
};
```

`manifests/services.ts`:

```typescript
import type { PageManifest } from '@pas7/llm-seo';

export const servicesManifest = {
  items: [
    {
      slug: '/services/web-development',
      locales: ['en', 'uk'],
      priority: 100,
    },
    {
      slug: '/services/ai-consulting',
      locales: ['en'],
      priority: 95,
    },
  ] satisfies PageManifest[],
};
```

## Build Integration

### Option 1: package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build": "npx llm-seo generate && next build",
    "build:static": "npx llm-seo generate && next build && next export",
    "lint:seo": "npx llm-seo check --fail-on error"
  }
}
```

### Option 2: Next.js Build Hook (Advanced)

For dynamic manifest generation from your Next.js app data:

```typescript
// lib/llm-seo-build.ts
import { createLlmsTxt, createLlmsFullTxt } from '@pas7/llm-seo';
import fs from 'fs';
import path from 'path';

export async function generateLlmSeoFiles() {
  // Get your content data
  const posts = await getAllPosts();
  const pages = await getAllPages();
  
  // Build manifests
  const manifests = {
    blog: posts.map(post => ({
      slug: `/blog/${post.slug}`,
      locales: post.locales,
      publishedAt: post.publishedAt,
      title: post.title,
      description: post.excerpt,
    })),
    pages: pages.map(page => ({
      slug: page.path,
      locales: page.locales,
    })),
  };
  
  // Generate files
  const config = {
    site: { baseUrl: process.env.NEXT_PUBLIC_SITE_URL },
    brand: { name: 'Your Brand', locales: ['en'] },
    manifests,
    output: { paths: { llmsTxt: 'public/llms.txt', llmsFullTxt: 'public/llms-full.txt' } },
  };
  
  const llmsTxt = createLlmsTxt(config);
  const llmsFullTxt = createLlmsFullTxt(config);
  
  fs.writeFileSync(path.join(process.cwd(), 'public/llms.txt'), llmsTxt.content);
  fs.writeFileSync(path.join(process.cwd(), 'public/llms-full.txt'), llmsFullTxt.content);
}
```

### Option 3: Using Next.js Adapter

The package includes a Next.js adapter for build hooks:

```typescript
// next.config.js
const { withLlmSeo } = require('@pas7/llm-seo/adapters/next');

module.exports = withLlmSeo({
  // Your Next.js config
  output: 'export',
  images: {
    unoptimized: true,
  },
}, {
  // llm-seo options
  configPath: './llm-seo.config.ts',
  emitCitations: true,
});
```

## Static Export Configuration

### next.config.js

For static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: false, // Match llm-seo config
};

module.exports = nextConfig;
```

### Environment Variables

`.env.production`:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Use in config:

```typescript
// llm-seo.config.ts
export default {
  site: {
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
  },
  // ...
} satisfies LlmsSeoConfig;
```

## Multi-Locale Setup

### Next.js i18n Config

```javascript
// next.config.js
module.exports = {
  output: 'export',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'uk', 'de'],
    localeDetection: false,
  },
};
```

### Match llm-seo Config

```typescript
// llm-seo.config.ts
format: {
  localeStrategy: 'prefix', // /en/blog, /uk/blog
  trailingSlash: false,
}
```

### Locale-aware Manifests

```typescript
// manifests/blog.ts
{
  slug: '/blog/multi-language-post',
  locales: ['en', 'uk', 'de'],
  // LLM SEO will generate canonical URLs for each locale
}
```

## Output Verification

### Check Generated Files

```bash
# After build
ls -la public/llms*.txt

# Verify content
head -20 public/llms.txt
```

### Test Locally

```bash
# Serve static files
npx serve out

# Check files
curl http://localhost:3000/llms.txt
curl http://localhost:3000/llms-full.txt
```

## Deployment

### Vercel

Static files in `public/` are automatically deployed:

```bash
# Build command in vercel.json or dashboard
npx llm-seo generate && next build
```

### Other Platforms

For `next export` output to `out/`:

```bash
npx llm-seo generate
next build
next export
# Files are in out/llms.txt, out/llms-full.txt
```

## Complete Example

See the full example at [`examples/next-static-export/`](../examples/next-static-export/).

### Example package.json

```json
{
  "name": "my-nextjs-site",
  "scripts": {
    "dev": "next dev",
    "build": "npx llm-seo generate && next build",
    "start": "next start",
    "export": "npx llm-seo generate && next build && next export",
    "lint": "next lint",
    "lint:seo": "npx llm-seo check --fail-on error"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@pas7/llm-seo": "^0.1.0",
    "typescript": "^5.0.0"
  }
}
```

### Example Build Output

```
$ pnpm build

> npx llm-seo generate

✓ Generated public/llms.txt (2.3KB)
✓ Generated public/llms-full.txt (15.7KB)
✓ Generated public/citations.json (4.2KB)

> next build

✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Compiled successfully

Route (app)                              Size     First Load JS
┌ ○ /                                    1.2kB         85kB
├ ○ /blog                                1.5kB         87kB
└ ○ /services                            1.1kB         85kB

+ First Load JS shared by all            84kB

✓ Build completed successfully
```

## Troubleshooting

### Files Not Generated

**Problem:** `llms.txt` not in output directory.

**Solution:** Ensure `public/` directory exists and is writable:

```bash
mkdir -p public
npx llm-seo generate
```

### Trailing Slash Mismatch

**Problem:** URLs have inconsistent trailing slashes.

**Solution:** Match Next.js config with llm-seo config:

```javascript
// next.config.js
trailingSlash: false

// llm-seo.config.ts
format: { trailingSlash: 'never' }
```

### Static Export Issues

**Problem:** `next export` fails with images.

**Solution:** Disable image optimization:

```javascript
// next.config.js
images: {
  unoptimized: true,
}
```

### Config Not Found

**Problem:** Build can't find config file.

**Solution:** Use absolute path or ensure correct working directory:

```bash
# From project root
npx llm-seo generate -c ./llm-seo.config.ts
```

## Best Practices

1. **Generate on every build** - Keep artifacts updated
2. **Commit manifests** - Track content changes
3. **Don't commit generated files** - Add to `.gitignore`:
   ```
   public/llms.txt
   public/llms-full.txt
   public/citations.json
   ```
4. **Run check in CI** - Validate before deploying
5. **Use environment variables** - For different environments

## Related

- [CI Integration](./ci.md) - GitHub Actions setup
- [Config Reference](./config.md) - Configuration options
- [Format Reference](./format.md) - Output formats

# @pas7/llm-seo

[![npm version](https://badge.fury.io/js/@pas7/llm-seo.svg)](https://badge.fury.io/js/@pas7/llm-seo)
[![CI](https://github.com/pas7studio/llm-seo/actions/workflows/ci.yml/badge.svg)](https://github.com/pas7studio/llm-seo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Deterministic LLM SEO artifacts generator & validator for modern static sites (Next.js/SSG-ready).**

## Why LLM/GEO SEO Artifacts?

LLMs like ChatGPT, Claude, and Gemini are becoming major sources of traffic. 
Providing structured `llms.txt` and `llms-full.txt` files helps these models 
understand and cite your content correctly.

## Features

- ✅ Generate `llms.txt` and `llms-full.txt` from a single config
- ✅ Build canonical URLs from content manifests
- ✅ Lint content policies (restricted claims, geo policy)
- ✅ CI-friendly exit codes for automated checks
- ✅ Next.js adapter for static export
- ✅ Multi-locale support with canonical URL generation
- ✅ Citations.json generation for structured data

## Quick Start

### Install

```bash
pnpm add -D @pas7/llm-seo
# or
npm install --save-dev @pas7/llm-seo
```

### Create Config

```typescript
// llm-seo.config.ts
import type { LlmsSeoConfig } from '@pas7/llm-seo';

export default {
  site: {
    baseUrl: 'https://yourdomain.com',
    defaultLocale: 'en',
  },
  brand: {
    name: 'Your Brand',
    tagline: 'Your tagline',
    description: 'Your description',
    locales: ['en'],
  },
  sections: {
    hubs: ['/services', '/blog', '/contact'],
  },
  manifests: {
    // Your content manifests
  },
  contact: {
    email: 'contact@yourdomain.com',
  },
  output: {
    paths: {
      llmsTxt: 'public/llms.txt',
      llmsFullTxt: 'public/llms-full.txt',
    },
  },
  format: {
    trailingSlash: 'never',
    lineEndings: 'lf',
  },
} satisfies LlmsSeoConfig;
```

### Generate

```bash
npx llm-seo generate
```

### Check (for CI)

```bash
npx llm-seo check --fail-on error
```

## CLI Reference

### `llm-seo generate`

Generate LLM SEO artifacts.

```bash
llm-seo generate [options]

Options:
  -c, --config <path>     Config file path (default: "llm-seo.config.ts")
  --dry-run               Output to stdout instead of files
  --emit-citations        Generate citations.json
  -v, --verbose           Enable verbose output
```

### `llm-seo check`

Validate generated files against expected output.

```bash
llm-seo check [options]

Options:
  -c, --config <path>     Config file path
  --fail-on <level>       Fail on 'warn' or 'error' (default: 'error')
  -v, --verbose           Enable verbose output
```

### `llm-seo doctor`

Diagnose site configuration.

```bash
llm-seo doctor [options]

Options:
  -s, --site <url>        Site URL to check
  -c, --config <path>     Config file path
  -v, --verbose           Enable verbose output
```

## Library API

```typescript
import {
  // Generation
  createLlmsTxt,
  createLlmsFullTxt,
  createCitationsJson,
  generateCanonicalUrl,
  
  // Validation
  checkManifest,
  validate,
  
  // Types
  type LlmsSeoConfig,
  type PageManifest,
} from '@pas7/llm-seo';
```

### Example: Generate llms.txt programmatically

```typescript
import { createLlmsTxt, type LlmsSeoConfig } from '@pas7/llm-seo';

const config: LlmsSeoConfig = {
  // ... your config
};

const result = createLlmsTxt(config);
console.log(result.content);
```

### Example: Generate canonical URLs from manifest

```typescript
import { generateCanonicalUrl, type PageManifest } from '@pas7/llm-seo';

const page: PageManifest = {
  slug: '/blog/my-post',
  locales: ['en', 'uk'],
  publishedAt: '2024-01-15',
};

const canonicalUrl = generateCanonicalUrl({
  baseUrl: 'https://example.com',
  page,
  locale: 'en',
});
// https://example.com/blog/my-post
```

## Documentation

- [Format Reference](./docs/format.md) - llms.txt vs llms-full.txt formats
- [Config Reference](./docs/config.md) - Full configuration options
- [Policies](./docs/policies.md) - Content policies and restricted claims
- [CI Integration](./docs/ci.md) - GitHub Actions setup
- [Next.js Integration](./docs/nextjs.md) - Static export setup

## Examples

See the [`examples/next-static-export`](./examples/next-static-export/) directory for a complete Next.js static export example with:
- Configuration setup
- Content manifests
- Build integration

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © Pas7 Studio

---

**Need automation or SEO infra?** Contact [Pas7 Studio](https://pas7.studio)

# @pas7/llm-seo

[![CI](https://github.com/pas7-studio/llm-seo/actions/workflows/ci.yml/badge.svg)](https://github.com/pas7-studio/llm-seo/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40pas7%2Fllm-seo.svg)](https://www.npmjs.com/package/@pas7/llm-seo)
[![npm downloads](https://img.shields.io/npm/dm/%40pas7%2Fllm-seo.svg)](https://www.npmjs.com/package/@pas7/llm-seo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Deterministic LLM SEO artifacts generator & validator for modern static sites (Next.js/SSG-ready).

## Value Proposition

One config in, deterministic artifacts out:
- generate `llms.txt` and `llms-full.txt`
- build canonical URLs from manifest items
- lint policy constraints (restricted claims, duplicates, empty sections)
- check generated files in CI with explicit exit codes

## Install

```bash
pnpm add @pas7/llm-seo
```

## Quick Start

```ts
// llm-seo.config.ts
import type { LlmsSeoConfig } from '@pas7/llm-seo';

export default {
  site: {
    baseUrl: 'https://example.com',
    defaultLocale: 'en',
  },
  brand: {
    name: 'Pas7 Studio',
    tagline: 'Automation and SEO infra for modern products',
    description: 'Deterministic LLM/GEO SEO artifacts for static and hybrid sites.',
    locales: ['en', 'uk'],
  },
  sections: {
    hubs: ['/services', '/blog', '/projects', '/cases', '/contact'],
  },
  manifests: {
    blog: [
      { slug: '/blog/llm-seo-basics', locales: ['en', 'uk'] },
      { slug: '/blog/canonical-strategy', locales: ['en'] },
    ],
  },
  contact: {
    email: 'contact@example.com',
  },
  policy: {
    citationRules: 'Prefer canonical URLs. Avoid query params and tracking tags.',
    restrictedClaims: {
      enable: true,
      forbidden: ['best', '#1', 'guaranteed'],
      whitelist: ['best practices'],
    },
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

```bash
pnpm llm-seo generate --config llm-seo.config.ts
pnpm llm-seo check --config llm-seo.config.ts --fail-on error
pnpm llm-seo doctor --site https://example.com
```

## CLI

### `llm-seo generate`

```bash
llm-seo generate [options]

Options:
  -c, --config <path>   Path to config file
  --dry-run             Print output to stdout, do not write files
  --emit-citations      Emit citations.json
  -v, --verbose         Verbose logs
```

### `llm-seo check`

```bash
llm-seo check [options]

Options:
  -c, --config <path>   Path to config file
  --fail-on <level>     fail threshold: warn|error (default: error)
  -v, --verbose         Verbose logs
```

### `llm-seo doctor`

```bash
llm-seo doctor [options]

Options:
  -s, --site <url>      Site URL to check
  -c, --config <path>   Path to config file
  -v, --verbose         Verbose logs
```

## Exit Codes

- `0` OK
- `1` warnings (only when `--fail-on warn`)
- `2` errors
- `3` doctor network/availability failure

## API (Core)

```ts
import {
  createLlmsTxt,
  createLlmsFullTxt,
  createCanonicalUrlsFromManifest,
  createCitationsJson,
  checkGeneratedFiles,
} from '@pas7/llm-seo';
```

## Docs

- [`docs/format.md`](./docs/format.md)
- [`docs/config.md`](./docs/config.md)
- [`docs/policies.md`](./docs/policies.md)
- [`docs/ci.md`](./docs/ci.md)
- [`docs/nextjs.md`](./docs/nextjs.md)

## Next.js

Use helpers from `@pas7/llm-seo/adapters/next` to normalize manifest items and build scripts.
See [`examples/next-static-export`](./examples/next-static-export).

## Contributing and Security

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)

## Support

Need custom SEO automation infra? Contact PAS7 Studio:
- https://pas7.com.ua/
- https://pas7.com.ua/contact

## License

MIT

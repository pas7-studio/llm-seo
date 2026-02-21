# @pas7/llm-seo Documentation

This directory contains documentation for the `@pas7/llm-seo` package.

## Contents

- [Getting Started](./getting-started.md) - Quick start guide
- [Configuration](./configuration.md) - Configuration options
- [CLI Reference](./cli-reference.md) - Command line interface
- [API Reference](./api-reference.md) - Programmatic API

## Overview

`@pas7/llm-seo` is a deterministic LLM SEO artifacts generation and validation tool for modern static sites.

### Features

- Generate `llms.txt` and `llms-full.txt` files
- SEO validation and checking
- Next.js/SSG integration
- Deterministic output (no Date.now(), no random)
- TypeScript, strict mode, no `any` types
- ESM-only

### Quick Example

```typescript
import { generateLlmsTxt } from '@pas7/llm-seo';
import { SiteManifestSchema } from '@pas7/llm-seo/schema';

const manifest = {
  baseUrl: 'https://example.com',
  title: 'My Site',
  pages: [
    { path: '/', title: 'Home' },
    { path: '/about', title: 'About' },
  ],
};

const llmsTxt = generateLlmsTxt(manifest);
console.log(llmsTxt);
```

### CLI Usage

```bash
# Generate llms.txt
llm-seo generate

# Check SEO health
llm-seo check

# Diagnose issues
llm-seo doctor
```

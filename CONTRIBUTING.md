# Contributing to @pas7/llm-seo

Thank you for your interest in contributing to `@pas7/llm-seo`! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Adding a New Adapter](#adding-a-new-adapter)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/llm-seo.git
cd llm-seo
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/pas7studio/llm-seo.git
```

### Install Dependencies

```bash
pnpm install
```

### Verify Setup

```bash
# Run tests
pnpm test

# Build the project
pnpm build

# Verify CLI
node dist/cli/bin.js --help
```

## Project Structure

```
llm-seo/
├── src/
│   ├── index.ts              # Main exports
│   ├── cli/                  # CLI implementation
│   │   ├── bin.ts            # CLI entry point
│   │   ├── exit-codes.ts     # Exit code constants
│   │   ├── commands/         # CLI commands
│   │   │   ├── generate.ts
│   │   │   ├── check.ts
│   │   │   └── doctor.ts
│   │   └── io/               # CLI utilities
│   │       ├── fs.ts
│   │       ├── load-config.ts
│   │       └── report.ts
│   ├── core/                 # Core functionality
│   │   ├── index.ts          # Core exports
│   │   ├── canonical/        # URL generation
│   │   ├── check/            # Validation
│   │   ├── generate/         # Artifact generation
│   │   └── normalize/        # Normalization utilities
│   ├── schema/               # Zod schemas
│   │   ├── config.schema.ts
│   │   ├── manifest.schema.ts
│   │   └── validate.ts
│   └── adapters/             # Framework adapters
│       ├── index.ts
│       └── next/             # Next.js adapter
├── test/                     # Test files
│   ├── canonical.spec.ts
│   ├── checker.spec.ts
│   ├── llms-txt.spec.ts
│   └── ...
├── docs/                     # Documentation
├── examples/                 # Example projects
│   └── next-static-export/
├── llm-seo.config.example.ts # Example config
├── package.json
├── tsconfig.json
├── tsup.config.ts           # Build config
└── vitest.config.ts         # Test config
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-astro-adapter`
- `fix/url-normalization`
- `docs/update-readme`
- `test/add-canonical-tests`

### 2. Make Changes

- Write clean, documented code
- Follow existing patterns
- Add/update tests as needed

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test test/canonical.spec.ts

# Run tests in watch mode
pnpm test:watch
```

### 4. Build

```bash
pnpm build
```

### 5. Type Check

```bash
pnpm typecheck
```

### 6. Commit Changes

We use conventional commits:

```
feat: add Astro adapter
fix: correct URL normalization for trailing slashes
docs: update configuration reference
test: add tests for locale URL generation
refactor: simplify manifest validation
```

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Testing

### Test Structure

Tests are located in the `test/` directory, mirroring the `src/` structure:

```
test/
├── canonical.spec.ts     # Tests for canonical URL generation
├── checker.spec.ts       # Tests for validation/checking
├── citations.spec.ts     # Tests for citations generation
├── llms-txt.spec.ts      # Tests for llms.txt generation
├── llms-full.spec.ts     # Tests for llms-full.txt generation
├── validate.spec.ts      # Tests for schema validation
└── snapshots/            # Test snapshots
```

### Writing Tests

Use Vitest for testing:

```typescript
import { describe, it, expect } from 'vitest';
import { generateCanonicalUrl } from '../src/core/canonical/canonical-from-manifest';

describe('generateCanonicalUrl', () => {
  it('should generate URL without trailing slash', () => {
    const url = generateCanonicalUrl({
      baseUrl: 'https://example.com',
      page: { slug: '/blog/post', locales: ['en'] },
      locale: 'en',
    });
    
    expect(url).toBe('https://example.com/blog/post');
  });
  
  it('should handle locale prefix strategy', () => {
    const url = generateCanonicalUrl({
      baseUrl: 'https://example.com',
      page: { slug: '/blog/post', locales: ['en', 'uk'] },
      locale: 'uk',
      localeStrategy: 'prefix',
    });
    
    expect(url).toBe('https://example.com/uk/blog/post');
  });
});
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test -- --coverage
```

## Adding a New Adapter

Adapters allow `llm-seo` to integrate with different frameworks.

### 1. Create Adapter Directory

```bash
mkdir -p src/adapters/astro
```

### 2. Create Adapter Files

`src/adapters/astro/index.ts`:

```typescript
/**
 * Astro adapter for @pas7/llm-seo
 */

import type { LlmsSeoConfig } from '../../schema/index.js';
import { generateLlmsTxt, generateLlmsFullTxt } from '../../core/index.js';

export interface AstroLlmSeoOptions {
  config: LlmsSeoConfig;
  outputDir?: string;
}

export function withLlmSeo(astroConfig: any, options: AstroLlmSeoOptions) {
  // Implementation
  return {
    ...astroConfig,
    vite: {
      ...astroConfig.vite,
      plugins: [
        ...(astroConfig.vite?.plugins || []),
        llmSeoPlugin(options),
      ],
    },
  };
}

function llmSeoPlugin(options: AstroLlmSeoOptions) {
  return {
    name: 'llm-seo',
    buildStart() {
      // Generate files at build start
    },
    buildEnd() {
      // Optionally validate after build
    },
  };
}

export { generateLlmsTxt, generateLlmsFullTxt };
```

### 3. Export from Adapters Index

`src/adapters/index.ts`:

```typescript
export * from './next/index.js';
export * from './astro/index.js';  // Add new adapter
```

### 4. Add Tests

`test/adapters/astro.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { withLlmSeo } from '../../src/adapters/astro';

describe('Astro adapter', () => {
  it('should integrate with Astro config', () => {
    // Test implementation
  });
});
```

### 5. Document

Create `docs/astro.md` with usage instructions.

## Pull Request Process

### Before Submitting

- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests added/updated
- [ ] All tests pass

## Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback
3. Once approved, a maintainer will merge

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use Zod schemas for runtime validation

### File Naming

- Use kebab-case for files: `canonical-url.ts`
- Use `.ts` extension (not `.tsx` unless using JSX)
- Test files: `*.spec.ts`

### Code Style

- Use ES modules (`import`/`export`)
- Use explicit `.js` extensions in imports for ESM compatibility
- Prefer `async`/`await` over raw promises
- Use `const` over `let` when possible

### Documentation

- Add JSDoc comments for public APIs
- Update README.md for user-facing changes
- Update relevant docs in `docs/`

### Example Code Style

```typescript
/**
 * Generates a canonical URL for a page.
 * 
 * @param options - URL generation options
 * @param options.baseUrl - Site base URL
 * @param options.page - Page manifest entry
 * @param options.locale - Target locale
 * @returns Canonical URL string
 * 
 * @example
 * ```typescript
 * const url = generateCanonicalUrl({
 *   baseUrl: 'https://example.com',
 *   page: { slug: '/blog/post', locales: ['en'] },
 *   locale: 'en',
 * });
 * // https://example.com/blog/post
 * ```
 */
export function generateCanonicalUrl(options: CanonicalOptions): string {
  const { baseUrl, page, locale, localeStrategy = 'none' } = options;
  
  // Implementation
  return normalizedUrl;
}
```

## Getting Help

- Open a [GitHub Issue](https://github.com/pas7studio/llm-seo/issues) for bugs
- Start a [Discussion](https://github.com/pas7studio/llm-seo/discussions) for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉

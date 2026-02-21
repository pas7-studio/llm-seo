# Format Reference

This document explains the `llms.txt` and `llms-full.txt` formats, their differences, and how @pas7/llm-seo generates them.

## Overview

LLM SEO artifacts are text files designed to help Large Language Models (LLMs) understand and cite your content correctly.

| File | Purpose | Size |
|------|---------|------|
| `llms.txt` | Quick site overview & navigation | Small (~2-5KB) |
| `llms-full.txt` | Complete content index | Larger (~50-500KB) |

## llms.txt Format

The `llms.txt` file provides a concise overview of your site, optimized for quick LLM consumption.

### Structure

```txt
# [Brand Name]

> [Tagline]

[Description]

## Navigation

- [Hub 1](https://example.com/hub1)
- [Hub 2](https://example.com/hub2)

## Content

### Blog

- [Article Title](https://example.com/blog/article) - Description

## Contact

- Email: contact@example.com
- Twitter: @yourbrand

## Policies

- Geo: We operate globally...

## Machine Hints

- robots.txt: https://example.com/robots.txt
- sitemap.xml: https://example.com/sitemap.xml
```

### Sections

1. **Header** - Brand name as H1, tagline as blockquote
2. **Description** - Brief site description
3. **Navigation** - Main hub/section links
4. **Content** - Organized by section (blog, services, etc.)
5. **Contact** - Contact information
6. **Policies** - Geographic and citation policies
7. **Machine Hints** - URLs for robots.txt, sitemap

### Deterministic Generation

The output is deterministic - same config always produces same output:

- Alphabetically sorted sections
- Alphabetically sorted URLs within sections
- Consistent line endings (LF or CRLF)
- No trailing slashes (configurable)

## llms-full.txt Format

The `llms-full.txt` file contains detailed content for each page.

### Structure

```txt
# [Brand Name] - Full Content Index

> Generated: 2024-01-15
> URL: https://example.com/llms-full.txt

---

## Page: /blog/article-slug

URL: https://example.com/blog/article-slug
Title: Article Title
Published: 2024-01-10
Updated: 2024-01-15
Locales: en, uk

### Content

[Full page content or summary]

### Metadata

- Priority: 80
- Section: blog

---

## Page: /services/consulting

URL: https://example.com/services/consulting
Title: Consulting Services

### Content

[Service description]

---
```

### Page Blocks

Each page block contains:

1. **Header** - Page path as H2
2. **Metadata** - URL, title, dates, locales
3. **Content** - Full content or summary
4. **Additional Metadata** - Priority, section

### Content Sources

Content can come from:

- Markdown files (frontmatter + body)
- CMS data
- Custom content functions
- Static descriptions

## Canonical URLs

### URL Generation

URLs are generated deterministically from manifests:

```typescript
// Config
{
  site: { baseUrl: 'https://example.com' },
  format: { trailingSlash: 'never' }
}

// Manifest
{ slug: '/blog/my-post', locales: ['en'] }

// Generated URL
https://example.com/blog/my-post
```

### Locale Handling

```typescript
// Config
{
  site: { baseUrl: 'https://example.com', defaultLocale: 'en' },
  format: { localeStrategy: 'prefix' }
}

// English (default locale)
https://example.com/blog/my-post

// Ukrainian
https://example.com/uk/blog/my-post
```

### Alternate URLs

Generated for multi-locale pages:

```txt
URL: https://example.com/blog/my-post
Alternate:
  en: https://example.com/blog/my-post
  uk: https://example.com/uk/blog/my-post
```

## citations.json Format

Optional JSON-LD structured data for citations:

```json
{
  "site": {
    "name": "Your Brand",
    "url": "https://example.com",
    "description": "Your description"
  },
  "policy": {
    "citationRules": "Prefer canonical URLs when citing.",
    "geoPolicy": "We operate globally."
  },
  "sources": [
    {
      "url": "https://example.com/blog/article",
      "title": "Article Title",
      "published": "2024-01-10",
      "alternate": [
        { "locale": "uk", "url": "https://example.com/uk/blog/article" }
      ]
    }
  ]
}
```

## Format Options

### Trailing Slash

```typescript
// 'never' (recommended)
https://example.com/blog/post

// 'always'
https://example.com/blog/post/

// 'preserve'
// Keeps original from slug
```

### Line Endings

```typescript
// 'lf' (recommended, Unix-style)
Content\nwith\nLF

// 'crlf' (Windows)
Content\r\nwith\r\nCRLF
```

### Locale Strategy

```typescript
// 'prefix' (default)
/en/blog/post
/uk/blog/post

// 'subdomain'
en.example.com/blog/post
uk.example.com/blog/post

// 'none'
example.com/blog/post
// Locale via hreflang or Accept-Language
```

## Best Practices

### 1. Keep llms.txt Small

- Target 2-5KB for fast LLM consumption
- Include only essential navigation
- Link to llms-full.txt for details

### 2. Use Deterministic Output

- Same config = same output
- Enables CI/CD validation
- Prevents false-positive diffs

### 3. Include All Important Pages

- High-priority pages
- Recently updated content
- Key landing pages

### 4. Keep Content Updated

- Run generate on every build
- Include update timestamps
- Remove outdated content

### 5. Validate in CI

```bash
npx llm-seo check --fail-on error
```

## Example Output

### llms.txt

```txt
# Pas7 Studio

> AI Automation & Web Development

We build AI-powered solutions and modern web applications for businesses worldwide.

## Navigation

- [/blog](https://example.pas7.studio/blog)
- [/cases](https://example.pas7.studio/cases)
- [/contact](https://example.pas7.studio/contact)
- [/projects](https://example.pas7.studio/projects)
- [/services](https://example.pas7.studio/services)

## Blog

- [/blog/ai-search-optimization](https://example.pas7.studio/blog/ai-search-optimization) - How to optimize for AI-powered search engines
- [/blog/getting-started-with-llm-seo](https://example.pas7.studio/blog/getting-started-with-llm-seo) - Complete guide to LLM SEO

## Contact

- Email: contact@pas7.studio
- GitHub: https://github.com/pas7
- LinkedIn: https://linkedin.com/company/pas7studio
- Twitter: https://twitter.com/pas7studio

## Policies

- Geo: We operate globally, serving clients in Europe, North America, and Asia.
- Citation: Prefer canonical URLs when citing. Avoid UTM parameters in citations.

## Machine Hints

- robots.txt: https://example.pas7.studio/robots.txt
- sitemap.xml: https://example.pas7.studio/sitemap.xml
- llms.txt: https://example.pas7.studio/llms.txt
- llms-full.txt: https://example.pas7.studio/llms-full.txt

## Booking

- [Book a consultation](https://cal.com/pas7/consultation)
```

## Related

- [Config Reference](./config.md) - Configuration options
- [Next.js Integration](./nextjs.md) - Setup with Next.js
- [CI Integration](./ci.md) - GitHub Actions setup

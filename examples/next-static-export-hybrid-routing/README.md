# Next Static Export Hybrid Routing

Example for mixed canonical routing strategies per manifest section.

## Goal

Use one shared `settings.siteUrl` across:
- `llm-seo` config
- `robots.txt` generation
- `@pas7/nextjs-sitemap-hreflang`

This example uses only official adapter helpers:
- `createSectionManifest(...)`
- `applySectionCanonicalOverrides(...)`

## Routing Mix

- Blog: `routeStyle: "locale-segment"` -> `/blog/en/slug`
- Contact pages: `routeStyle: "suffix"` -> `/contact`, `/contact/uk`
- Services: `routeStyle: "prefix"` -> `/services/slug`, `/uk/services/slug`

## Files

- `settings.ts`: single source of truth for `siteUrl`
- `llm-seo.config.ts`: LLM SEO config with section-level routing via adapters
- `manifests/*`: content manifests

## Pipeline

```bash
llm-seo generate --config llm-seo.config.ts
next build
nextjs-sitemap-hreflang check --in out/sitemap.xml --fail-on-missing
llm-seo check --config llm-seo.config.ts --fail-on error
```

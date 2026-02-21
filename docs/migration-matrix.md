# Migration Matrix

Versioned migration notes for unified SEO pipeline integration.

## Matrix

| From | To | Required changes |
|---|---|---|
| `<=0.2.x` | `0.3.x` | Switch manifests to section-based routing where needed (`sectionPath`, `routeStyle`). |
| `0.3.x` | `0.4.x` | Use `--check-live` (or deprecated `--check-machine-hints-live`) and adopt `--emit-report` JSON contract. |

## v0.4.0 Contract

- Recommended pipeline:
  1. `llm-seo generate --config llm-seo.config.ts`
  2. `next build`
  3. `nextjs-sitemap-hreflang check --fail-on-missing --prefer out`
  4. `llm-seo check --config llm-seo.config.ts --check-live --emit-report .artifacts/llm-seo-report.json`
- Unified report keys:
  - `status`
  - `issues`
  - `summary`
  - `files`

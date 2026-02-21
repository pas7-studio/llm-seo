---
"@pas7/llm-seo": minor
---

Add first-class Next adapter helpers for section-based hybrid routing:

- `createSectionManifest(...)` to map common Next content manifests into section config with key/function field mapping.
- `applySectionCanonicalOverrides(...)` to precompute `canonicalOverride` values per section based on routing rules.

Also add optional live endpoint verification in `llm-seo check`:

- `--check-machine-hints-live` checks robots/sitemap/llms endpoints over HTTP and reports CI errors when unavailable.

Includes adapter tests for `prefix`, `suffix`, `locale-segment`, and `custom` routing styles, plus updated hybrid Next example and documentation.

---
"@pas7/llm-seo": minor
---

Ship config-first Next integration improvements for v0.4.0 pipeline readiness:

- Add first-class Next manifest adapters:
  - `fromManifestArray(items, mapping, sectionOptions)`
  - `fromRouteManifest(routes, options)`
- Keep `createSectionManifest` and `applySectionCanonicalOverrides` for section routing and canonical override precomputation.
- Extend `llm-seo check` with:
  - `--check-live`
  - `--timeout-ms`
  - `--retries`
  - `--emit-report <path>`
- Emit unified JSON report contract with keys:
  - `status`
  - `issues`
  - `summary`
  - `files`
- Add strict cross-validation for section routing compatibility (`sectionPath`, `routeStyle`, `slug`).
- Update docs and hybrid Next static export example to work config-first without custom generator scripts.

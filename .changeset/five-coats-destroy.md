---
"@pas7/llm-seo": minor
---

Add routing-aware canonical generation with per-manifest section controls, including `routeStyle` (`prefix`, `suffix`, `locale-segment`, `custom`), `sectionPath`, and optional `defaultLocaleOverride`/`pathnameFor`.

Improve `llms-full.txt` output with deterministic `Last Updated: YYYY-MM-DD`, explicit `Contact` block, and sitemap entries that use resolved canonical URLs.

Update CLI canonical pipeline to use config-level section routing consistently in both `generate` and `check`.

Add hybrid Next.js example and docs for cross-package pipeline with `@pas7/nextjs-sitemap-hreflang`.

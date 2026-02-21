/**
 * @pas7/llm-seo
 * Deterministic LLM SEO artifacts generation and validation for modern static sites.
 */

// Core functionality
export * from './core/index.js';

// Schema definitions (excluding LocaleConfig which is already exported from core)
export {
  ConfigSchema,
  CheckConfigSchema,
  FullConfigSchema,
  RouteStyleSchema,
  ManifestSectionConfigSchema,
  ManifestConfigValueSchema,
  ManifestsConfigSchema,
  type Config,
  type CheckConfig,
  type FullConfig,
  type RouteStyle,
  type ManifestPathnameArgs,
  type ManifestPathnameFor,
  type ManifestSectionConfig,
  type ManifestConfigValue,
  type ManifestsConfig,
} from './schema/config.schema.js';

export {
  OptionalSectionSchema,
  PageManifestSchema,
  SiteManifestSchema,
  BuildManifestSchema,
  type OptionalSection,
  type PageManifest,
  type SiteManifest,
  type BuildManifest,
} from './schema/manifest.schema.js';

export {
  validate,
  validateOrThrow,
  formatValidationErrors,
  type ValidationResult,
  type ValidationError,
} from './schema/validate.js';

// Adapters
export * from './adapters/index.js';

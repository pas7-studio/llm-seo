/**
 * Schema module barrel export.
 * Re-exports all schemas and validation utilities.
 */

// Config schemas
export {
  SiteConfigSchema,
  BrandConfigSchema,
  SectionsConfigSchema,
  RouteStyleSchema,
  ManifestSectionConfigSchema,
  ManifestConfigValueSchema,
  ManifestsConfigSchema as LlmsManifestsConfigSchema,
  SocialConfigSchema,
  ContactConfigSchema,
  RestrictedClaimsConfigSchema,
  PolicyConfigSchema,
  BookingConfigSchema,
  MachineHintsConfigSchema,
  OutputPathsConfigSchema,
  OutputConfigSchema,
  FormatConfigSchema,
  LlmsSeoConfigSchema,
  ConfigSchema,
  LocaleConfigSchema,
  CheckConfigSchema,
  FullConfigSchema,
  type SiteConfig,
  type BrandConfig,
  type SectionsConfig,
  type RouteStyle,
  type ManifestPathnameArgs,
  type ManifestPathnameFor,
  type ManifestSectionConfig,
  type ManifestConfigValue,
  type ManifestsConfig as LlmsManifestsConfig,
  type SocialConfig,
  type ContactConfig,
  type RestrictedClaimsConfig,
  type PolicyConfig,
  type BookingConfig,
  type MachineHintsConfig,
  type OutputPathsConfig,
  type OutputConfig,
  type FormatConfig,
  type LlmsSeoConfig,
  type Config,
  type LocaleConfigSchemaType as LocaleConfig,
  type CheckConfig,
  type FullConfig,
} from './config.schema.js';

// Manifest schemas
export {
  ManifestItemSchema,
  ManifestSourceSchema,
  ManifestValueSchema,
  ManifestsConfigSchema,
  OptionalSectionSchema,
  PageManifestSchema,
  SiteManifestSchema,
  BuildManifestSchema,
  type ManifestItem,
  type ManifestSource,
  type ManifestValue,
  type ManifestsConfig,
  type OptionalSection,
  type PageManifest,
  type SiteManifest,
  type BuildManifest,
} from './manifest.schema.js';

// Validation utilities
export {
  validate,
  validateOrThrow,
  formatValidationErrors,
  validateLlmsSeoConfig,
  normalizeHubPaths,
  type ValidationResult,
  type ValidationIssue,
  type ValidationError,
} from './validate.js';

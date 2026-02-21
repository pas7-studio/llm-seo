/**
 * Configuration schema for llm-seo.
 * Full LlmsSeoConfig schema with all required fields and validation rules.
 */

import { z } from 'zod';

/**
 * Schema for site configuration.
 */
export const SiteConfigSchema = z.object({
  /** Site base URL - must be valid URL with http/https, no trailing slash */
  baseUrl: z
    .string()
    .url({ message: 'Must be a valid URL with http or https protocol' })
    .refine(
      (url) => !url.endsWith('/'),
      { message: 'Base URL must not have a trailing slash' }
    ),
  /** Default locale - must be in locales if provided */
  defaultLocale: z.string().min(2).optional(),
});

/**
 * Type for site configuration.
 */
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

/**
 * Schema for brand configuration.
 */
export const BrandConfigSchema = z.object({
  /** Brand name - required */
  name: z.string().min(1, { message: 'Brand name is required' }),
  /** Optional tagline */
  tagline: z.string().optional(),
  /** Optional description */
  description: z.string().optional(),
  /** Optional organization name */
  org: z.string().optional(),
  /** Supported locales - e.g., ["en", "uk", "de"] */
  locales: z.array(z.string().min(2)).min(1, { message: 'At least one locale is required' }),
});

/**
 * Type for brand configuration.
 */
export type BrandConfig = z.infer<typeof BrandConfigSchema>;

/**
 * Schema for sections configuration.
 */
export const SectionsConfigSchema = z.object({
  /** Hub paths - e.g., ["/services", "/blog", "/projects"] */
  hubs: z.array(z.string()).default([]),
});

/**
 * Type for sections configuration.
 */
export type SectionsConfig = z.infer<typeof SectionsConfigSchema>;

/**
 * Schema for social links configuration.
 */
export const SocialConfigSchema = z.object({
  /** Twitter handle or URL */
  twitter: z.string().optional(),
  /** LinkedIn URL */
  linkedin: z.string().optional(),
  /** GitHub URL */
  github: z.string().optional(),
});

/**
 * Type for social links configuration.
 */
export type SocialConfig = z.infer<typeof SocialConfigSchema>;

/**
 * Schema for contact configuration.
 * At least email or one social field required.
 */
export const ContactConfigSchema = z.object({
  /** Contact email */
  email: z.string().email().optional(),
  /** Social links */
  social: SocialConfigSchema.optional(),
  /** Phone number */
  phone: z.string().optional(),
});

/**
 * Type for contact configuration.
 */
export type ContactConfig = z.infer<typeof ContactConfigSchema>;

/**
 * Schema for restricted claims configuration.
 */
export const RestrictedClaimsConfigSchema = z.object({
  /** Enable restricted claims checking */
  enable: z.boolean(),
  /** Forbidden words/phrases - e.g., ["best", "#1", "guaranteed"] */
  forbidden: z.array(z.string()).optional(),
  /** Allowlisted phrases */
  whitelist: z.array(z.string()).optional(),
});

/**
 * Type for restricted claims configuration.
 */
export type RestrictedClaimsConfig = z.infer<typeof RestrictedClaimsConfigSchema>;

/**
 * Schema for policy configuration.
 */
export const PolicyConfigSchema = z.object({
  /** Geographic policy statement */
  geoPolicy: z.string().optional(),
  /** Citation rules */
  citationRules: z.string().optional(),
  /** Restricted claims configuration */
  restrictedClaims: RestrictedClaimsConfigSchema.optional(),
});

/**
 * Type for policy configuration.
 */
export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;

/**
 * Schema for booking configuration.
 */
export const BookingConfigSchema = z.object({
  /** Booking URL - e.g., Cal.com link */
  url: z.string().url().optional(),
  /** Booking label - e.g., "Book a consultation" */
  label: z.string().optional(),
});

/**
 * Type for booking configuration.
 */
export type BookingConfig = z.infer<typeof BookingConfigSchema>;

/**
 * Schema for machine hints configuration.
 */
export const MachineHintsConfigSchema = z.object({
  /** URL to robots.txt */
  robots: z.string().url().optional(),
  /** URL to sitemap.xml */
  sitemap: z.string().url().optional(),
  /** URL to llms.txt */
  llmsTxt: z.string().url().optional(),
  /** URL to llms-full.txt */
  llmsFullTxt: z.string().url().optional(),
});

/**
 * Type for machine hints configuration.
 */
export type MachineHintsConfig = z.infer<typeof MachineHintsConfigSchema>;

/**
 * Schema for output paths configuration.
 */
export const OutputPathsConfigSchema = z.object({
  /** Path to llms.txt output - e.g., "public/llms.txt" */
  llmsTxt: z.string().min(1, { message: 'llmsTxt output path is required' }),
  /** Path to llms-full.txt output - e.g., "public/llms-full.txt" */
  llmsFullTxt: z.string().min(1, { message: 'llmsFullTxt output path is required' }),
  /** Path to citations.json output - e.g., "public/citations.json" */
  citations: z.string().optional(),
});

/**
 * Type for output paths configuration.
 */
export type OutputPathsConfig = z.infer<typeof OutputPathsConfigSchema>;

/**
 * Schema for output configuration.
 */
export const OutputConfigSchema = z.object({
  /** Output paths */
  paths: OutputPathsConfigSchema,
});

/**
 * Type for output configuration.
 */
export type OutputConfig = z.infer<typeof OutputConfigSchema>;

/**
 * Schema for format configuration.
 */
export const FormatConfigSchema = z.object({
  /** Trailing slash handling */
  trailingSlash: z.enum(['always', 'never', 'preserve']).default('never'),
  /** Line endings format */
  lineEndings: z.enum(['lf', 'crlf']).default('lf'),
  /** Locale URL strategy */
  localeStrategy: z.enum(['prefix', 'subdomain', 'none']).optional(),
});

/**
 * Type for format configuration.
 */
export type FormatConfig = z.infer<typeof FormatConfigSchema>;

/**
 * Full LlmsSeoConfig schema with all required fields.
 */
export const LlmsSeoConfigSchema = z.object({
  /** Site configuration */
  site: SiteConfigSchema,
  /** Brand configuration */
  brand: BrandConfigSchema,
  /** Sections configuration */
  sections: SectionsConfigSchema.optional(),
  /** Manifests configuration */
  manifests: z.record(z.unknown()).default({}),
  /** Contact configuration */
  contact: ContactConfigSchema.optional(),
  /** Policy configuration */
  policy: PolicyConfigSchema.optional(),
  /** Booking configuration */
  booking: BookingConfigSchema.optional(),
  /** Machine hints configuration */
  machineHints: MachineHintsConfigSchema.optional(),
  /** Output configuration */
  output: OutputConfigSchema,
  /** Format configuration */
  format: FormatConfigSchema.optional(),
});

/**
 * Type for full LlmsSeoConfig.
 */
export type LlmsSeoConfig = z.infer<typeof LlmsSeoConfigSchema>;

// Legacy exports for backwards compatibility
export const ConfigSchema = z.object({
  baseUrl: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  outputDir: z.string().default('./public'),
  includeOptionalSections: z.boolean().default(false),
  maxContentLength: z.number().int().nonnegative().default(0),
});

export type Config = z.infer<typeof ConfigSchema>;

export const LocaleConfigSchema = z.object({
  default: z.string().min(2),
  supported: z.array(z.string().min(2)).min(1),
  strategy: z.enum(['subdirectory', 'subdomain', 'domain']),
});

export type LocaleConfigSchemaType = z.infer<typeof LocaleConfigSchema>;

export const CheckConfigSchema = z.object({
  strict: z.boolean().default(false),
  maxTitleLength: z.number().int().positive().default(60),
  maxDescriptionLength: z.number().int().positive().default(160),
  enableLint: z.boolean().default(true),
});

export type CheckConfig = z.infer<typeof CheckConfigSchema>;

export const FullConfigSchema = z.object({
  site: ConfigSchema,
  locale: LocaleConfigSchema.optional(),
  check: CheckConfigSchema.optional(),
});

export type FullConfig = z.infer<typeof FullConfigSchema>;

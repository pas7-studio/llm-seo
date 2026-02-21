/**
 * Manifest schema for site pages.
 */

import { z } from 'zod';

/**
 * Schema for ManifestItem - a single page entry in a manifest.
 */
export const ManifestItemSchema = z.object({
  /** URL path slug - required */
  slug: z.string().min(1, { message: 'Slug is required and cannot be empty' }),
  /** Available locales for this page */
  locales: z.array(z.string().min(2)).optional(),
  /** Publication date (ISO 8601) */
  publishedAt: z.string().datetime({ message: 'publishedAt must be a valid ISO 8601 date' }).optional(),
  /** Last update date (ISO 8601) */
  updatedAt: z.string().datetime({ message: 'updatedAt must be a valid ISO 8601 date' }).optional(),
  /** Override canonical URL */
  canonicalOverride: z.string().url().optional(),
  /** Priority for citations (0-100) */
  priority: z.number().int().min(0).max(100).optional(),
  /** Title for display */
  title: z.string().optional(),
  /** Description for display */
  description: z.string().optional(),
});

/**
 * Type for ManifestItem.
 */
export type ManifestItem = z.infer<typeof ManifestItemSchema>;

/**
 * Schema for ManifestSource - external manifest reference.
 */
export const ManifestSourceSchema = z.object({
  /** Source type */
  type: z.enum(['file', 'url', 'module']),
  /** Source location */
  source: z.string(),
  /** Optional transform function */
  transform: z.string().optional(),
});

/**
 * Type for ManifestSource.
 */
export type ManifestSource = z.infer<typeof ManifestSourceSchema>;

/**
 * Schema for manifest value - can be array of items or source reference.
 */
export const ManifestValueSchema = z.union([
  z.array(ManifestItemSchema),
  ManifestSourceSchema,
]);

/**
 * Type for manifest value.
 */
export type ManifestValue = z.infer<typeof ManifestValueSchema>;

/**
 * Schema for manifests configuration.
 */
export const ManifestsConfigSchema = z.record(z.string(), ManifestValueSchema);

/**
 * Type for manifests configuration.
 */
export type ManifestsConfig = z.infer<typeof ManifestsConfigSchema>;

// Legacy schemas for backwards compatibility

/**
 * Schema for optional section in llms.txt.
 */
export const OptionalSectionSchema = z.object({
  /** Section title */
  title: z.string().min(1),
  /** Section content */
  content: z.string().optional(),
});

/**
 * Type for optional section.
 */
export type OptionalSection = z.infer<typeof OptionalSectionSchema>;

/**
 * Schema for a page manifest entry (legacy).
 */
export const PageManifestSchema = z.object({
  /** Page path (e.g., /about) */
  path: z.string().startsWith('/'),
  /** Page title */
  title: z.string().optional(),
  /** Page description */
  description: z.string().optional(),
  /** Page content for llms-full.txt */
  content: z.string().optional(),
  /** Whether page is optional (included only in full) */
  optional: z.boolean().default(false),
  /** Last modified timestamp (ISO 8601) */
  lastModified: z.string().datetime().optional(),
});

/**
 * Type for page manifest.
 */
export type PageManifest = z.infer<typeof PageManifestSchema>;

/**
 * Schema for site manifest.
 */
export const SiteManifestSchema = z.object({
  /** Site base URL */
  baseUrl: z.string().url(),
  /** Site title */
  title: z.string().min(1),
  /** Site description */
  description: z.string().optional(),
  /** List of pages */
  pages: z.array(PageManifestSchema).min(1),
  /** Optional sections for llms.txt */
  optionalSections: z.array(OptionalSectionSchema).optional(),
  /** Site version */
  version: z.string().optional(),
  /** Generation timestamp (ISO 8601) */
  generatedAt: z.string().datetime().optional(),
});

/**
 * Type for site manifest.
 */
export type SiteManifest = z.infer<typeof SiteManifestSchema>;

/**
 * Schema for build manifest (Next.js compatible).
 */
export const BuildManifestSchema = z.object({
  /** Build ID */
  buildId: z.string(),
  /** List of static pages */
  pages: z.record(z.string(), z.array(z.string())),
  /** Dynamic routes */
  dynamicRoutes: z.record(z.string(), z.object({
    routeRegex: z.string(),
    dataRoute: z.string(),
    dataRouteRegex: z.string(),
  })).optional(),
});

/**
 * Type for build manifest.
 */
export type BuildManifest = z.infer<typeof BuildManifestSchema>;

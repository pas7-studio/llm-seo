/**
 * Validation utilities using Zod schemas.
 */

import { ZodType, ZodError } from 'zod';
import {
  LlmsSeoConfigSchema,
  type LlmsSeoConfig,
  type ContactConfig,
  type ManifestConfigValue,
  type ManifestSectionConfig,
} from './config.schema.js';
import type { ManifestItem } from './manifest.schema.js';

/**
 * Result of a validation operation.
 */
export interface ValidationResult<T> {
  /** Whether validation passed */
  success: boolean;
  /** Validated data (only present if success is true) */
  data?: T;
  /** Validation issues (errors and warnings) */
  issues?: ValidationIssue[];
}

/**
 * Represents a single validation issue (error or warning).
 */
export interface ValidationIssue {
  /** Path to the invalid field */
  path: string;
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Issue severity */
  severity: 'error' | 'warning';
}

/**
 * Legacy ValidationError type for backwards compatibility.
 */
export type ValidationError = Omit<ValidationIssue, 'severity'>;

/**
 * Validates data against a Zod schema.
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Validation result
 */
export function validate<T>(
  schema: ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      issues: [],
    };
  }
  
  return {
    success: false,
    issues: formatZodErrors(result.error),
  };
}

/**
 * Formats Zod errors into ValidationIssues.
 * @param error - The Zod error
 * @returns Array of validation issues
 */
function formatZodErrors(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
    severity: 'error' as const,
  }));
}

/**
 * Validates and throws on error.
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Validated data
 * @throws Error if validation fails
 */
export function validateOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = validate(schema, data);
  
  if (!result.success || !result.data) {
    const messages = result.issues?.map((e) => `${e.path}: ${e.message}`).join('; ') ?? 'Unknown validation error';
    throw new Error(`Validation failed: ${messages}`);
  }
  
  return result.data;
}

/**
 * Creates a human-readable error message from validation issues.
 * @param issues - Array of validation issues
 * @returns Formatted error message
 */
export function formatValidationErrors(issues: readonly ValidationIssue[]): string {
  const lines: string[] = ['Validation failed:', ''];
  
  for (const issue of issues) {
    lines.push(`  - ${issue.path || '(root)'}: ${issue.message}`);
  }
  
  return lines.join('\n');
}

/**
 * Normalizes a hub path by removing double slashes, query strings, and hashes.
 * @param path - The path to normalize
 * @returns Normalized path
 */
function normalizeHubPath(path: string): string {
  let normalized = path.trim();
  
  // Remove query strings
  const queryIndex = normalized.indexOf('?');
  if (queryIndex !== -1) {
    normalized = normalized.substring(0, queryIndex);
  }
  
  // Remove hashes
  const hashIndex = normalized.indexOf('#');
  if (hashIndex !== -1) {
    normalized = normalized.substring(0, hashIndex);
  }
  
  // Remove double slashes (but keep leading slash)
  normalized = normalized.replace(/\/+/g, '/');
  
  return normalized;
}

/**
 * Validates hub paths according to the rules.
 * @param hubs - Array of hub paths
 * @returns Array of validation issues
 */
function validateHubPaths(hubs: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (let i = 0; i < hubs.length; i++) {
    const hub = hubs[i];
    if (!hub) continue;
    
    const path = `sections.hubs.${i}`;
    
    // Check for leading slash
    if (!hub.startsWith('/')) {
      issues.push({
        path,
        code: 'invalid_hub_path',
        message: `Hub path "${hub}" must start with a leading slash (/)`,
        severity: 'error',
      });
    }
    
    // Check for double slashes
    if (hub.includes('//')) {
      issues.push({
        path,
        code: 'invalid_hub_path',
        message: `Hub path "${hub}" contains double slashes (//)`,
        severity: 'error',
      });
    }
    
    // Check for query strings
    if (hub.includes('?')) {
      issues.push({
        path,
        code: 'invalid_hub_path',
        message: `Hub path "${hub}" must not contain query strings (?)`,
        severity: 'error',
      });
    }
    
    // Check for hashes
    if (hub.includes('#')) {
      issues.push({
        path,
        code: 'invalid_hub_path',
        message: `Hub path "${hub}" must not contain hashes (#)`,
        severity: 'error',
      });
    }
  }
  
  return issues;
}

/**
 * Validates manifest items for uniqueness by slug + locale.
 * @param manifests - The manifests record
 * @returns Array of validation issues
 */
function validateManifestItems(manifests: Record<string, ManifestConfigValue>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const [manifestName, manifestValue] of Object.entries(manifests)) {
    const items = getManifestItems(manifestValue);
    const seen = new Map<string, number>();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      
      const locales = item.locales || [''];
      
      for (const locale of locales) {
        const key = `${item.slug}:${locale}`;
        const path = `manifests.${manifestName}.${i}`;
        
        if (item.slug === undefined || item.slug === '') {
          issues.push({
            path,
            code: 'empty_slug',
            message: 'Manifest item slug cannot be empty',
            severity: 'error',
          });
          continue;
        }
        
        if (seen.has(key)) {
          const firstIndex = seen.get(key);
          issues.push({
            path,
            code: 'duplicate_manifest_item',
            message: `Duplicate manifest item with slug "${item.slug}" and locale "${locale || 'default'}" (first occurrence at index ${firstIndex})`,
            severity: 'error',
          });
        } else {
          seen.set(key, i);
        }
      }
    }
  }
  
  return issues;
}

function getManifestItems(manifestValue: ManifestConfigValue): ManifestItem[] {
  if (Array.isArray(manifestValue)) {
    return manifestValue;
  }
  return manifestValue.items;
}

/**
 * Validates contact configuration.
 * At least email or one social field required.
 * @param contact - The contact configuration
 * @returns Array of validation issues
 */
function validateContact(contact: ContactConfig | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!contact) {
    return issues;
  }
  
  const hasEmail = Boolean(contact.email);
  const hasSocial = Boolean(
    contact.social?.twitter ||
    contact.social?.linkedin ||
    contact.social?.github
  );
  
  if (!hasEmail && !hasSocial) {
    issues.push({
      path: 'contact',
      code: 'missing_contact',
      message: 'At least email or one social field (twitter, linkedin, github) is required',
      severity: 'error',
    });
  }
  
  return issues;
}

/**
 * Validates that defaultLocale exists in brand.locales.
 * @param defaultLocale - The default locale
 * @param locales - Available locales
 * @returns Array of validation issues
 */
function validateDefaultLocale(defaultLocale: string | undefined, locales: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (defaultLocale && !locales.includes(defaultLocale)) {
    issues.push({
      path: 'site.defaultLocale',
      code: 'invalid_default_locale',
      message: `Default locale "${defaultLocale}" must exist in brand.locales [${locales.join(', ')}]`,
      severity: 'error',
    });
  }
  
  return issues;
}

function validateManifestLocaleOverrides(config: LlmsSeoConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [sectionName, sectionValue] of Object.entries(config.manifests)) {
    if (Array.isArray(sectionValue)) {
      continue;
    }

    const section = sectionValue as ManifestSectionConfig;
    if (section.defaultLocaleOverride && !config.brand.locales.includes(section.defaultLocaleOverride)) {
      issues.push({
        path: `manifests.${sectionName}.defaultLocaleOverride`,
        code: 'invalid_default_locale_override',
        message: `defaultLocaleOverride "${section.defaultLocaleOverride}" must exist in brand.locales [${config.brand.locales.join(', ')}]`,
        severity: 'error',
      });
    }

    if (section.sectionPath) {
      if (!section.sectionPath.startsWith('/')) {
        issues.push({
          path: `manifests.${sectionName}.sectionPath`,
          code: 'invalid_section_path',
          message: `sectionPath "${section.sectionPath}" must start with "/"`,
          severity: 'error',
        });
      }
      if (section.sectionPath.includes('?') || section.sectionPath.includes('#') || section.sectionPath.includes('//')) {
        issues.push({
          path: `manifests.${sectionName}.sectionPath`,
          code: 'invalid_section_path',
          message: `sectionPath "${section.sectionPath}" must not contain query/hash/double-slash`,
          severity: 'error',
        });
      }
    }

    if (section.routeStyle === 'custom' && !section.pathnameFor) {
      issues.push({
        path: `manifests.${sectionName}.pathnameFor`,
        code: 'missing_custom_pathname',
        message: 'pathnameFor is required when routeStyle is "custom"',
        severity: 'error',
      });
    }

    const items = section.items;
    const defaultLocale = section.defaultLocaleOverride ?? config.site.defaultLocale ?? config.brand.locales[0] ?? 'en';
    const localeSet = new Set(config.brand.locales);

    if (section.routeStyle === 'locale-segment' && !section.sectionPath) {
      issues.push({
        path: `manifests.${sectionName}.sectionPath`,
        code: 'missing_section_path',
        message: 'sectionPath is required when routeStyle is "locale-segment"',
        severity: 'error',
      });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item?.slug) {
        continue;
      }
      const slug = item.slug;
      const segments = slug.split('/').filter(Boolean);
      const first = segments[0];
      const last = segments[segments.length - 1];
      const hasSectionPrefix = section.sectionPath
        ? slug === section.sectionPath || slug.startsWith(`${section.sectionPath}/`)
        : false;

      if (section.sectionPath && hasSectionPrefix) {
        issues.push({
          path: `manifests.${sectionName}.items.${i}.slug`,
          code: 'incompatible_slug',
          message: `Slug "${slug}" already includes sectionPath "${section.sectionPath}". Use section-relative slug like "/post".`,
          severity: 'error',
        });
      }

      if (section.routeStyle === 'prefix' && first && localeSet.has(first) && first !== defaultLocale) {
        issues.push({
          path: `manifests.${sectionName}.items.${i}.slug`,
          code: 'incompatible_slug',
          message: `Slug "${slug}" appears locale-prefixed for routeStyle "prefix". Provide section-relative slug without locale segment.`,
          severity: 'error',
        });
      }

      if (section.routeStyle === 'locale-segment' && first && localeSet.has(first)) {
        issues.push({
          path: `manifests.${sectionName}.items.${i}.slug`,
          code: 'incompatible_slug',
          message: `Slug "${slug}" includes locale segment but routeStyle "locale-segment" generates locale automatically.`,
          severity: 'error',
        });
      }

      if (section.routeStyle === 'suffix' && last && localeSet.has(last) && last !== defaultLocale) {
        issues.push({
          path: `manifests.${sectionName}.items.${i}.slug`,
          code: 'incompatible_slug',
          message: `Slug "${slug}" includes locale suffix but routeStyle "suffix" generates locale suffix automatically.`,
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

/**
 * Validates the full LlmsSeoConfig with custom validation rules.
 * @param data - The configuration data to validate
 * @returns Validation result with all issues
 */
export function validateLlmsSeoConfig(data: unknown): ValidationResult<LlmsSeoConfig> {
  // First, validate with Zod schema
  const schemaResult = validate<LlmsSeoConfig>(LlmsSeoConfigSchema as ZodType<LlmsSeoConfig>, data);
  
  if (!schemaResult.success) {
    return schemaResult;
  }
  
  const config = schemaResult.data!;
  const issues: ValidationIssue[] = [];
  
  // Validate defaultLocale exists in locales
  if (config.site?.defaultLocale && config.brand?.locales) {
    issues.push(...validateDefaultLocale(config.site.defaultLocale, config.brand.locales));
  }
  
  // Validate hub paths
  if (config.sections?.hubs) {
    issues.push(...validateHubPaths(config.sections.hubs));
  }
  
  // Validate manifest items
  if (config.manifests && typeof config.manifests === 'object') {
    issues.push(...validateManifestItems(config.manifests));
    issues.push(...validateManifestLocaleOverrides(config));
  }
  
  // Validate contact
  issues.push(...validateContact(config.contact));
  
  // Return result with all issues
  if (issues.length > 0) {
    return {
      success: false,
      data: config,
      issues: [...(schemaResult.issues || []), ...issues],
    };
  }
  
  return {
    success: true,
    data: config,
    issues: [],
  };
}

/**
 * Normalizes hub paths in the configuration.
 * @param hubs - Array of hub paths
 * @returns Normalized hub paths
 */
export function normalizeHubPaths(hubs: string[]): string[] {
  return hubs.map(normalizeHubPath).filter((h) => h.length > 0);
}

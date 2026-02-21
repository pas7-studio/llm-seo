/**
 * Citation generation utilities for LLM-optimized content.
 * Creates machine-readable citations.json for CI validation.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import type { ManifestItem } from '../../schema/manifest.schema.js';

/**
 * Citation source entry.
 */
export interface CitationSource {
  /** Canonical URL */
  url: string;
  /** Priority (0-100) */
  priority: number;
  /** Section name */
  section: string;
  /** Locale code */
  locale: string;
  /** Publication date (ISO 8601) */
  publishedAt?: string;
  /** Last update date (ISO 8601) */
  updatedAt?: string;
  /** Page title */
  title?: string;
}

/**
 * Site information in citations.json.
 */
export interface CitationsSite {
  /** Base URL */
  baseUrl: string;
  /** Site name */
  name: string;
}

/**
 * Policy information in citations.json.
 */
export interface CitationsPolicy {
  /** Geographic policy */
  geoPolicy?: string;
  /** Citation rules */
  citationRules?: string;
  /** Whether restricted claims are enabled */
  restrictedClaimsEnabled: boolean;
}

/**
 * Complete citations.json structure.
 */
export interface CitationsJson {
  /** Schema version */
  version: string;
  /** Generation timestamp (ISO 8601) */
  generated: string;
  /** Site information */
  site: CitationsSite;
  /** Sorted citation sources */
  sources: CitationSource[];
  /** Policy information */
  policy: CitationsPolicy;
}

/**
 * Options for citations.json generation.
 */
export interface CreateCitationsJsonOptions {
  /** Full LLM SEO configuration */
  config: LlmsSeoConfig;
  /** Manifest items to include */
  manifestItems: ManifestItem[];
  /** Section name for these items */
  sectionName: string;
  /** Optional fixed timestamp for deterministic output (tests) */
  fixedTimestamp?: string;
}

/**
 * Creates citations.json object with deterministic output.
 * - Sorted by priority (descending), then by URL
 * - Includes all manifest items with their metadata
 * @param options - Generation options
 * @returns Citations JSON object
 */
export function createCitationsJson(options: CreateCitationsJsonOptions): CitationsJson {
  const { config, manifestItems, sectionName, fixedTimestamp } = options;

  // Build sources from manifest items
  const sources: CitationSource[] = manifestItems.map((item) => {
    const url = item.canonicalOverride ?? `${config.site.baseUrl}${item.slug}`;
    const defaultLocale = config.site.defaultLocale ?? config.brand.locales[0] ?? 'en';
    
    return {
      url,
      priority: item.priority ?? 50,
      section: sectionName,
      locale: item.locales?.[0] ?? defaultLocale,
      ...(item.publishedAt && { publishedAt: item.publishedAt }),
      ...(item.updatedAt && { updatedAt: item.updatedAt }),
      ...(item.title && { title: item.title }),
    };
  });

  // Sort by priority (descending), then by URL (ascending)
  const sortedSources = sources.sort((a, b) => {
    // First by priority descending
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then by URL ascending
    return a.url.localeCompare(b.url, 'en', { sensitivity: 'case', numeric: true });
  });

  // Build policy
  const policy: CitationsPolicy = {
    restrictedClaimsEnabled: config.policy?.restrictedClaims?.enable ?? false,
    ...(config.policy?.geoPolicy && { geoPolicy: config.policy.geoPolicy }),
    ...(config.policy?.citationRules && { citationRules: config.policy.citationRules }),
  };

  return {
    version: '1.0',
    generated: fixedTimestamp ?? new Date().toISOString(),
    site: {
      baseUrl: config.site.baseUrl,
      name: config.brand.name,
    },
    sources: sortedSources,
    policy,
  };
}

/**
 * Creates citations.json as a formatted string.
 * @param options - Generation options
 * @returns JSON string with 2-space indentation
 */
export function createCitationsJsonString(options: CreateCitationsJsonOptions): string {
  const citations = createCitationsJson(options);
  return JSON.stringify(citations, null, 2);
}

// Legacy exports for backwards compatibility

/**
 * Represents a citation for a page.
 * @deprecated Use CitationSource instead
 */
export interface Citation {
  /** The URL being cited */
  url: string;
  /** The title of the cited page */
  title: string;
  /** Optional description */
  description?: string;
}

/**
 * Generates a citation object for a page.
 * @deprecated Use createCitationsJson instead
 */
export function createCitation(
  page: { path: string; title?: string; description?: string },
  manifest: { baseUrl: string }
): Citation {
  const citation: Citation = {
    url: `${manifest.baseUrl}${page.path}`,
    title: page.title ?? page.path,
  };
  
  if (page.description) {
    citation.description = page.description;
  }
  
  return citation;
}

/**
 * Generates a citation in markdown format.
 * @deprecated
 */
export function citationToMarkdown(citation: Citation): string {
  if (citation.description) {
    return `[${citation.title}](${citation.url}) - ${citation.description}`;
  }
  return `[${citation.title}](${citation.url})`;
}

/**
 * Generates a citation in JSON-LD format.
 * @deprecated
 */
export function citationToJsonLd(citation: Citation): Record<string, string> {
  const jsonLd: Record<string, string> = {
    '@type': 'WebPage',
    name: citation.title,
    url: citation.url,
  };
  
  if (citation.description) {
    jsonLd.description = citation.description;
  }
  
  return jsonLd;
}

/**
 * Generates a reference list from multiple citations.
 * @deprecated
 */
export function generateReferenceList(citations: readonly Citation[]): string {
  const lines: string[] = ['## References', ''];
  
  for (let i = 0; i < citations.length; i++) {
    const citation = citations[i];
    if (citation) {
      const num = i + 1;
      lines.push(`${num}. ${citationToMarkdown(citation)}`);
    }
  }
  
  lines.push('');
  return lines.join('\n');
}

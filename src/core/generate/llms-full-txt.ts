/**
 * llms-full.txt generator with complete context for LLMs.
 * Generates full brand context with all URLs, detailed policies, social/booking, and machine hints.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import type { ManifestItem } from '../../schema/manifest.schema.js';
import { sortStrings, sortBy } from '../normalize/sort.js';
import { normalizeLineEndings, normalizeLineWhitespace } from '../normalize/text.js';

/**
 * Options for llms-full.txt generation.
 */
export interface CreateLlmsFullTxtOptions {
  /** Full LLM SEO configuration */
  config: LlmsSeoConfig;
  /** Pre-built canonical URLs from manifests */
  canonicalUrls: string[];
  /** Manifest items for detailed URL listing */
  manifestItems: ManifestItem[];
  /** Optional manifest entries with canonical URLs per item */
  manifestEntries?: ReadonlyArray<{
    item: ManifestItem;
    canonicalUrl: string;
    sectionName: string;
  }>;
}

/**
 * Result of llms-full.txt generation.
 */
export interface CreateLlmsFullTxtResult {
  /** Generated llms-full.txt content */
  content: string;
  /** Size in bytes */
  byteSize: number;
  /** Number of lines */
  lineCount: number;
}

/**
 * Creates llms-full.txt content with deterministic output.
 * - Complete context with all URLs
 * - Detailed policy sections
 * - Social and booking info
 * - EOL controlled by config.format.lineEndings
 * @param options - Generation options
 * @returns Generated content with metadata
 */
export function createLlmsFullTxt(options: CreateLlmsFullTxtOptions): CreateLlmsFullTxtResult {
  const { config, canonicalUrls, manifestItems, manifestEntries } = options;
  const lineEndings = config.format?.lineEndings ?? 'lf';
  const lines: string[] = [];

  // Header
  lines.push(`# ${config.brand.name} - Full LLM Context`);
  lines.push('');

  if (config.brand.tagline) {
    lines.push(`> ${config.brand.tagline}`);
    lines.push('');
  }

  // Brand description
  if (config.brand.description) {
    lines.push(config.brand.description);
    lines.push('');
  }

  // Organization and locales
  if (config.brand.org) {
    lines.push(`Organization: ${config.brand.org}`);
  }
  lines.push(`Locales: ${config.brand.locales.join(', ')}`);

  const lastUpdated = getLastUpdatedDate(manifestItems);
  if (lastUpdated) {
    lines.push(`Last Updated: ${lastUpdated}`);
  }
  lines.push('');

  // All Canonical URLs
  if (canonicalUrls.length > 0) {
    lines.push('## All Canonical URLs');
    lines.push('');
    const sortedUrls = sortStrings(canonicalUrls);
    for (const url of sortedUrls) {
      lines.push(`- ${url}`);
    }
    lines.push('');
  }

  // Policies
  const hasPolicies = config.policy?.geoPolicy || config.policy?.citationRules || config.policy?.restrictedClaims;
  if (hasPolicies) {
    lines.push('## Policies');
    lines.push('');

    // GEO Policy
    if (config.policy?.geoPolicy) {
      lines.push('### GEO Policy');
      lines.push(config.policy.geoPolicy);
      lines.push('');
    }

    // Citation Rules
    if (config.policy?.citationRules) {
      lines.push('### Citation Rules');
      lines.push(config.policy.citationRules);
      lines.push('');
    }

    // Restricted Claims
    if (config.policy?.restrictedClaims) {
      lines.push('### Restricted Claims');
      const status = config.policy.restrictedClaims.enable ? 'Enabled' : 'Disabled';
      lines.push(`Status: ${status}`);
      
      if (config.policy.restrictedClaims.forbidden && config.policy.restrictedClaims.forbidden.length > 0) {
        lines.push(`Forbidden terms: ${config.policy.restrictedClaims.forbidden.join(', ')}`);
      }
      
      if (config.policy.restrictedClaims.whitelist && config.policy.restrictedClaims.whitelist.length > 0) {
        lines.push(`Exceptions: ${config.policy.restrictedClaims.whitelist.join(', ')}`);
      }
      
      lines.push('');
    }
  }

  // Contact
  const hasContact = config.contact?.email ||
    config.contact?.phone ||
    config.contact?.social?.twitter ||
    config.contact?.social?.linkedin ||
    config.contact?.social?.github ||
    config.booking?.url;
  if (hasContact) {
    lines.push('## Contact');
    lines.push('');

    if (config.contact?.email) {
      lines.push(`- Email: ${config.contact.email}`);
    }

    if (config.contact?.phone) {
      lines.push(`- Phone: ${config.contact.phone}`);
    }

    if (config.contact?.social?.twitter) {
      lines.push(`- Twitter: ${config.contact.social.twitter}`);
    }

    if (config.contact?.social?.linkedin) {
      lines.push(`- LinkedIn: ${config.contact.social.linkedin}`);
    }

    if (config.contact?.social?.github) {
      lines.push(`- GitHub: ${config.contact.social.github}`);
    }

    if (config.booking?.url) {
      const label = config.booking.label ?? 'Book consultation';
      lines.push(`- Booking: ${config.booking.url} (${label})`);
    }

    lines.push('');
  }

  // Machine Hints
  const hasMachineHints = config.machineHints?.robots || 
    config.machineHints?.sitemap || 
    config.machineHints?.llmsTxt || 
    config.machineHints?.llmsFullTxt;
  
  if (hasMachineHints) {
    lines.push('## Machine Hints');
    lines.push('');

    if (config.machineHints?.robots) {
      lines.push(`- robots.txt: ${config.machineHints.robots}`);
    }

    if (config.machineHints?.sitemap) {
      lines.push(`- sitemap.xml: ${config.machineHints.sitemap}`);
    }

    if (config.machineHints?.llmsTxt) {
      lines.push(`- llms.txt: ${config.machineHints.llmsTxt}`);
    }

    if (config.machineHints?.llmsFullTxt) {
      lines.push(`- llms-full.txt: ${config.machineHints.llmsFullTxt}`);
    }

    lines.push('');
  }

  // Sitemap
  const hubs = config.sections?.hubs ?? [];
  if (hubs.length > 0 || manifestItems.length > 0) {
    lines.push('## Sitemap');
    lines.push('');

    // Add section hubs first
    if (hubs.length > 0) {
      const sortedHubs = sortStrings(hubs);
      for (const hub of sortedHubs) {
        lines.push(`- [${hub}](${hub}) - ${getHubLabel(hub)}`);
      }
    }

    // Add all manifest URLs
    if (manifestEntries && manifestEntries.length > 0) {
      const sortedEntries = sortBy(manifestEntries, (entry) => {
        return `${entry.item.slug}|${entry.canonicalUrl}`;
      });
      for (const entry of sortedEntries) {
        const title = entry.item.title ?? entry.item.slug;
        const locales = entry.item.locales?.join(', ') ?? config.brand.locales[0] ?? 'en';
        lines.push(`- [${title}](${entry.canonicalUrl}) (${locales})`);
      }
    } else if (manifestItems.length > 0) {
      const sortedItems = sortBy(manifestItems, (item) => item.slug);
      for (const item of sortedItems) {
        const url = item.canonicalOverride ?? `${config.site.baseUrl}${item.slug}`;
        const title = item.title ?? item.slug;
        const locales = item.locales?.join(', ') ?? config.brand.locales[0] ?? 'en';
        lines.push(`- [${title}](${url}) (${locales})`);
      }
    }

    lines.push('');
  }

  // Build final content
  let content = lines.join('\n');
  
  // Normalize whitespace
  content = normalizeLineWhitespace(content);
  
  // Apply line endings
  content = normalizeLineEndings(content, lineEndings);

  // Calculate metadata
  const finalLines = content.split(lineEndings === 'crlf' ? '\r\n' : '\n');

  return {
    content,
    byteSize: Buffer.byteLength(content, 'utf-8'),
    lineCount: finalLines.length,
  };
}

function getLastUpdatedDate(items: ManifestItem[]): string | null {
  const timestamps: string[] = [];
  for (const item of items) {
    if (item.updatedAt) {
      timestamps.push(item.updatedAt);
    } else if (item.publishedAt) {
      timestamps.push(item.publishedAt);
    }
  }

  if (timestamps.length === 0) {
    return null;
  }

  const latest = timestamps
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!latest) {
    return null;
  }

  return latest.toISOString().slice(0, 10);
}

/**
 * Gets a human-readable label for a hub path.
 */
function getHubLabel(hub: string): string {
  const labels: Record<string, string> = {
    '/services': 'Services overview',
    '/blog': 'Blog posts',
    '/projects': 'Our projects',
    '/cases': 'Case studies',
    '/contact': 'Contact us',
    '/about': 'About us',
    '/products': 'Products',
    '/docs': 'Documentation',
    '/faq': 'Frequently asked questions',
    '/pricing': 'Pricing information',
    '/team': 'Our team',
    '/careers': 'Career opportunities',
    '/news': 'News and updates',
    '/resources': 'Resources',
    '/support': 'Support center',
  };

  return labels[hub] ?? formatHubLabel(hub);
}

/**
 * Formats a hub path into a human-readable label.
 */
function formatHubLabel(hub: string): string {
  // Remove leading slash and format
  const clean = hub.replace(/^\//, '');
  // Replace hyphens and underscores with spaces, capitalize words
  return clean
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Legacy exports for backwards compatibility
export interface LlmsFullTxtOptions {
  /** Maximum content length per page (0 = no limit) */
  maxContentLength?: number;
}

/**
 * Generates full page content for llms-full.txt.
 * @deprecated Use createLlmsFullTxt instead
 */
export function generatePageContent(
  page: { path: string; title?: string; description?: string; content?: string },
  manifest: { baseUrl: string },
  _options?: LlmsFullTxtOptions
): string {
  const maxContentLength = _options?.maxContentLength ?? 0;
  const lines: string[] = [];
  const url = `${manifest.baseUrl}${page.path}`;
  lines.push(`## ${page.title ?? page.path}`);
  lines.push(`URL: ${url}`);
  lines.push('');
  
  if (page.description) {
    lines.push(page.description);
    lines.push('');
  }
  
  if (page.content) {
    let content = page.content;
    if (maxContentLength > 0 && content.length > maxContentLength) {
      content = `${content.slice(0, maxContentLength)}...`;
    }
    lines.push(content);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 /**
  * @deprecated Use createLlmsFullTxt instead
  */
 export function generateLlmsFullTxt(
   manifest: { baseUrl: string; title: string; description?: string | undefined; pages: Array<{ path: string; title?: string | undefined; description?: string | undefined; content?: string | undefined }> },
   _options?: LlmsFullTxtOptions
 ): string {
   const canonicalUrls = manifest.pages.map((page) => `${manifest.baseUrl}${page.path}`);
   const manifestItems: ManifestItem[] = manifest.pages.map((page) => ({
     slug: page.path,
     title: page.title,
     description: page.description,
   }));
 
   const config: LlmsSeoConfig = {
     site: { baseUrl: manifest.baseUrl },
     brand: {
       name: manifest.title,
       locales: ['en'],
       ...(manifest.description && { description: manifest.description }),
     },
     manifests: {},
     output: {
       paths: {
         llmsTxt: 'public/llms.txt',
         llmsFullTxt: 'public/llms-full.txt',
       },
     },
   };
 
   return createLlmsFullTxt({ config, canonicalUrls, manifestItems }).content;
 }

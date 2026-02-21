/**
 * llms.txt generator for LLM-optimized site documentation.
 * Generates a short brand profile with sections, URLs, policies, and contact info.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import { sortStrings } from '../normalize/sort.js';
import { normalizeLineEndings, normalizeLineWhitespace } from '../normalize/text.js';

/**
 * Options for llms.txt generation.
 */
export interface CreateLlmsTxtOptions {
  /** Full LLM SEO configuration */
  config: LlmsSeoConfig;
  /** Pre-built canonical URLs from manifests */
  canonicalUrls: string[];
}

/**
 * Result of llms.txt generation.
 */
export interface CreateLlmsTxtResult {
  /** Generated llms.txt content */
  content: string;
  /** Size in bytes */
  byteSize: number;
  /** Number of lines */
  lineCount: number;
}

/**
 * Creates llms.txt content with deterministic output.
 * - Deterministic ordering of all sections
 * - Handles missing optional fields gracefully
 * - EOL controlled by config.format.lineEndings
 * @param options - Generation options
 * @returns Generated content with metadata
 */
export function createLlmsTxt(options: CreateLlmsTxtOptions): CreateLlmsTxtResult {
  const { config, canonicalUrls } = options;
  const lineEndings = config.format?.lineEndings ?? 'lf';
  const lines: string[] = [];

  // Header: Brand name and tagline
  lines.push(`# ${config.brand.name}`);
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

  // Sections
  const hubs = config.sections?.hubs ?? [];
  if (hubs.length > 0) {
    lines.push('## Sections');
    lines.push('');
    const sortedHubs = sortStrings(hubs);
    for (const hub of sortedHubs) {
      const hubLabel = getHubLabel(hub);
      lines.push(`- [${hub}](${hub}) - ${hubLabel}`);
    }
    lines.push('');
  }

  // URLs
  if (canonicalUrls.length > 0) {
    lines.push('## URLs');
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

    if (config.policy?.geoPolicy) {
      lines.push(`- GEO: ${config.policy.geoPolicy}`);
    }

    if (config.policy?.citationRules) {
      lines.push(`- Citations: ${config.policy.citationRules}`);
    }

    if (config.policy?.restrictedClaims) {
      const status = config.policy.restrictedClaims.enable ? 'Enabled' : 'Disabled';
      lines.push(`- Restricted Claims: ${status}`);
    }

    lines.push('');
  }

  // Contact
  const hasContact = config.contact?.email || config.contact?.social || config.contact?.phone;
  const hasBooking = config.booking?.url;
  if (hasContact || hasBooking) {
    lines.push('## Contact');
    lines.push('');

    if (config.contact?.email) {
      lines.push(`- Email: ${config.contact.email}`);
    }

    if (config.contact?.phone) {
      lines.push(`- Phone: ${config.contact.phone}`);
    }

    if (config.contact?.social) {
      if (config.contact.social.twitter) {
        lines.push(`- Twitter: ${config.contact.social.twitter}`);
      }
      if (config.contact.social.linkedin) {
        lines.push(`- LinkedIn: ${config.contact.social.linkedin}`);
      }
      if (config.contact.social.github) {
        lines.push(`- GitHub: ${config.contact.social.github}`);
      }
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
export interface LlmsTxtOptions {
  /** Whether to include optional sections */
  includeOptionalSections?: boolean;
}

/**
 * @deprecated Use createLlmsTxt instead
 */
export function generateLlmsTxt(
  manifest: { baseUrl: string; title: string; description?: string | undefined; pages: Array<{ path: string; title?: string | undefined; description?: string | undefined }> },
  _options?: LlmsTxtOptions
): string {
  const canonicalUrls = manifest.pages.map((page) => `${manifest.baseUrl}${page.path}`);
  
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

  return createLlmsTxt({ config, canonicalUrls }).content;
}

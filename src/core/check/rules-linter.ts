/**
 * Rules linter for llms.txt and related files.
 */

import type { Issue } from './issues.js';
import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import { createIssue } from './issues.js';
import type { CheckIssue } from './issues.js';

/**
 * Rule definition for linting.
 */
export interface LintRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Whether the rule is enabled by default */
  enabled: boolean;
  /** The lint function */
  lint: (content: string, filePath: string) => Issue[];
}

/**
 * Options for linting content.
 */
export interface LintOptions {
  /** llms.txt or llms-full.txt content */
  content: string;
  /** LLM-SEO configuration */
  config: LlmsSeoConfig;
}

/**
 * Result of linting content.
 */
export interface LintResult {
  /** Issues found during linting */
  issues: CheckIssue[];
}

/**
 * Available lint rules.
 */
export const LINT_RULES: readonly LintRule[] = [
  {
    id: 'heading-structure',
    description: 'Ensures proper heading structure (h1 -> h2 -> h3)',
    enabled: true,
    lint: lintHeadingStructure,
  },
  {
    id: 'url-format',
    description: 'Validates URL format in links',
    enabled: true,
    lint: lintUrlFormat,
  },
  {
    id: 'trailing-whitespace',
    description: 'Checks for trailing whitespace on lines',
    enabled: true,
    lint: lintTrailingWhitespace,
  },
  {
    id: 'consistent-list-markers',
    description: 'Ensures consistent list marker usage',
    enabled: true,
    lint: lintListMarkers,
  },
];

/**
 * Lints content against provided rules.
 * @param content - The content to lint
 * @param filePath - Path to the file being linted
 * @param rules - Rules to apply (defaults to all enabled rules)
 * @returns Lint result with issues
 */
export function lintContent(
  content: string,
  filePath: string,
  rules: readonly LintRule[] = LINT_RULES.filter((r) => r.enabled)
): LintResultLegacy {
  const issues: Issue[] = [];
  
  for (const rule of rules) {
    const ruleIssues = rule.lint(content, filePath);
    issues.push(...ruleIssues);
  }
  
  return {
    filePath,
    issues,
    passed: issues.filter((i) => i.severity === 'error').length === 0,
  };
}

/**
 * Legacy lint result interface.
 */
export interface LintResultLegacy {
  /** File path that was linted */
  filePath: string;
  /** Issues found during linting */
  issues: Issue[];
  /** Whether the file passed all rules */
  passed: boolean;
}

/**
 * Lints content against policy rules:
 * - Forbidden terms (if restrictedClaims.enable)
 * - Empty sections
 * - Duplicate URLs in priority lists
 * - Locale consistency between sections
 * 
 * @param options - Lint options
 * @returns Lint result with issues
 */
export function lintContentWithConfig(options: LintOptions): LintResult {
  const { content, config } = options;
  const issues: CheckIssue[] = [];
  
  // Check forbidden terms if policy is configured
  if (config.policy?.restrictedClaims?.enable) {
    const forbidden = config.policy.restrictedClaims.forbidden ?? [];
    const whitelist = config.policy.restrictedClaims.whitelist ?? [];
    const forbiddenIssues = checkForbiddenTerms(content, forbidden, whitelist);
    issues.push(...forbiddenIssues);
  }
  
  // Check for empty sections
  const emptySectionIssues = checkEmptySections(content);
  issues.push(...emptySectionIssues);
  
  // Check for duplicate URLs
  const duplicateUrlIssues = checkDuplicateUrls(content);
  issues.push(...duplicateUrlIssues);
  
  return { issues };
}

/**
 * Checks for forbidden terms in content.
 * @param content - Content to check
 * @param forbidden - List of forbidden terms
 * @param whitelist - List of whitelisted terms (case-insensitive)
 * @returns Array of check issues
 */
export function checkForbiddenTerms(
  content: string,
  forbidden: string[],
  whitelist: string[] = []
): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const lines = content.split('\n');
  const whitelistLower = whitelist.map((w) => w.toLowerCase());
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const trimmed = line.trim();
    const loweredTrimmed = trimmed.toLowerCase();

    // Do not lint policy definition lines that explicitly list forbidden/allowed terms.
    if (
      loweredTrimmed.startsWith('forbidden terms:') ||
      loweredTrimmed.startsWith('exceptions:')
    ) {
      continue;
    }
    
    for (const term of forbidden) {
      const termLower = term.toLowerCase();
      const lineLower = line.toLowerCase();
      
      // Check if term exists in line
      if (lineLower.includes(termLower)) {
        // Check if it's whitelisted
        const isWhitelisted = whitelistLower.some((w) => 
          lineLower.includes(w) && w.includes(termLower)
        );
        
        if (!isWhitelisted) {
          issues.push({
            path: '',
            code: 'forbidden_term',
            message: `Term "${term}" is forbidden by policy`,
            severity: 'warning',
            line: i + 1,
            context: trimmed.substring(0, 100),
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * Checks for empty sections in content.
 * An empty section is a heading followed only by whitespace/blank lines
 * until the next heading or end of file.
 * Note: The first heading (typically h1 document title) is not checked
 * as it's common to have the title without immediate content.
 * @param content - Content to check
 * @returns Array of check issues
 */
export function checkEmptySections(content: string): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const lines = content.split('\n');
  
  let currentSection: string | null = null;
  let sectionStartLine = 0;
  let sectionHeadingLevel = 0;
  let sectionHasContent = false;
  let sectionWasFirst = false;
  let isFirstHeading = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    
    // Check for markdown heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch?.[2]) {
      const nextHeadingLevel = headingMatch[1]?.length ?? 0;

      // A subsection counts as content for its parent section.
      if (currentSection !== null && nextHeadingLevel > sectionHeadingLevel) {
        sectionHasContent = true;
      }

      // Check if previous section was empty (had heading but no content)
      // Skip check for the first heading (document title)
      if (currentSection !== null && !sectionHasContent && !sectionWasFirst) {
        issues.push({
          path: '',
          code: 'empty_section',
          message: `Section "${currentSection}" has no content`,
          severity: 'info',
          line: sectionStartLine,
        });
      }
      
      // Start new section
      currentSection = headingMatch[2].trim();
      sectionStartLine = i + 1;
      sectionHeadingLevel = nextHeadingLevel;
      sectionHasContent = false;
      sectionWasFirst = isFirstHeading;
      isFirstHeading = false;
    } else if (currentSection !== null) {
      // Non-heading line - check if it has actual content
      if (line.trim().length > 0) {
        sectionHasContent = true;
      }
    }
  }
  
  // Check last section (skip if it's the only/first heading)
  if (currentSection !== null && !sectionHasContent && !sectionWasFirst) {
    issues.push({
      path: '',
      code: 'empty_section',
      message: `Section "${currentSection}" has no content`,
      severity: 'info',
      line: sectionStartLine,
    });
  }
  
  return issues;
}

/**
 * Checks for duplicate URLs in content.
 * @param content - Content to check
 * @returns Array of check issues
 */
export function checkDuplicateUrls(content: string): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const lines = content.split('\n');
  const seenUrls = new Map<string, number>();
  
  // Pattern to match markdown links
  const urlPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    
    let match: RegExpExecArray | null = urlPattern.exec(line);
    while (match !== null) {
      const url = match[2];
      if (url !== undefined) {
        const firstOccurrence = seenUrls.get(url);
        if (firstOccurrence !== undefined) {
          issues.push({
            path: '',
            code: 'duplicate_url',
            message: `URL "${url}" appears multiple times (first at line ${firstOccurrence})`,
            severity: 'warning',
            line: i + 1,
            context: url,
          });
        } else {
          seenUrls.set(url, i + 1);
        }
      }
      match = urlPattern.exec(line);
    }
    
    // Reset regex state for next line
    urlPattern.lastIndex = 0;
  }
  
  return issues;
}

/**
 * Lints heading structure in markdown content.
 */
function lintHeadingStructure(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  let prevLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const match = line.match(/^(#{1,6})\s/);
    if (match?.[1]) {
      const level = match[1].length;
      if (level > prevLevel + 1 && prevLevel > 0) {
        issues.push(createIssue({
          id: 'heading-skip',
          pageId: filePath,
          severity: 'warning',
          message: `Heading level skipped: h${prevLevel} to h${level}`,
          line: i + 1,
        }));
      }
      prevLevel = level;
    }
  }
  
  return issues;
}

/**
 * Lints URL format in markdown content.
 */
function lintUrlFormat(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  const urlPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    let match: RegExpExecArray | null = urlPattern.exec(line);
    while (match !== null) {
      const url = match[2];
      if (url && !url.startsWith('/') && !url.startsWith('http') && !url.startsWith('#')) {
        issues.push(createIssue({
          id: 'invalid-url',
          pageId: filePath,
          severity: 'warning',
          message: `Invalid URL format: ${url}`,
          line: i + 1,
          column: match.index + 1,
        }));
      }
      match = urlPattern.exec(line);
    }
  }
  
  return issues;
}

/**
 * Lints trailing whitespace in content.
 */
function lintTrailingWhitespace(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && line.endsWith(' ')) {
      issues.push(createIssue({
        id: 'trailing-whitespace',
        pageId: filePath,
        severity: 'info',
        message: 'Line has trailing whitespace',
        line: i + 1,
      }));
    }
  }
  
  return issues;
}

/**
 * Lints list marker consistency in content.
 */
function lintListMarkers(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  const dashCount = lines.filter((l) => /^\s*-\s/.test(l)).length;
  const asteriskCount = lines.filter((l) => /^\s*\*\s/.test(l)).length;
  
  if (dashCount > 0 && asteriskCount > 0) {
    issues.push(createIssue({
      id: 'inconsistent-list-markers',
      pageId: filePath,
      severity: 'info',
      message: 'Mix of - and * list markers detected',
    }));
  }
  
  return issues;
}

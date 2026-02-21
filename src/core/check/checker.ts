/**
 * SEO checker for LLM-optimized content validation.
 */

import * as fs from 'node:fs/promises';
import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import type { SiteManifest } from '../../schema/manifest.schema.js';
import type { Issue, IssueSeverity } from './issues.js';
import type { CheckIssue, CheckIssueCode } from './issues.js';
import { createCheckIssue, countSeverities } from './issues.js';
import { lintContent as lintWithRules, checkForbiddenTerms, checkEmptySections, checkDuplicateUrls } from './rules-linter.js';
import { ExitCode } from '../../cli/exit-codes.js';

/**
 * Configuration for the SEO checker.
 */
export interface CheckerConfig {
  /** Enable strict mode for additional checks */
  strict?: boolean;
  /** Maximum allowed title length */
  maxTitleLength?: number;
  /** Maximum allowed description length */
  maxDescriptionLength?: number;
}

/**
 * Options for checking generated files.
 */
export interface CheckOptions {
  /** LLM-SEO configuration */
  config: LlmsSeoConfig;
  /** Path to llms.txt (default from config) */
  llmsTxtPath?: string;
  /** Path to llms-full.txt (default from config) */
  llmsFullTxtPath?: string;
  /** Path to citations.json (optional) */
  citationsPath?: string;
  /** Fail threshold */
  failOn: 'warn' | 'error';
}

/**
 * Result of running the SEO checker.
 */
export interface CheckerResult {
  /** Whether all checks passed */
  passed: boolean;
  /** List of issues found */
  issues: Issue[];
  /** Number of pages checked */
  pagesChecked: number;
  /** Summary of issues by severity */
  summary: Record<IssueSeverity, number>;
}

/**
 * Result of checking generated files.
 */
export interface CheckResult {
  /** List of issues found */
  issues: CheckIssue[];
  /** Summary counts */
  summary: {
    errors: number;
    warnings: number;
    info: number;
    filesChecked: number;
    filesMissing: number;
    filesMismatch: number;
  };
  /** Exit code for CI */
  exitCode: ExitCode;
}

/**
 * Result of content comparison.
 */
export interface CompareResult {
  /** Whether content matches */
  match: boolean;
  /** Context showing differences */
  context: string;
}

/**
 * Default checker configuration.
 */
export const DEFAULT_CHECKER_CONFIG: Required<CheckerConfig> = {
  strict: false,
  maxTitleLength: 60,
  maxDescriptionLength: 160,
};

/**
 * Runs SEO checks on a site manifest.
 * @param manifest - The site manifest to check
 * @param config - Checker configuration
 * @returns Checker result with issues and summary
 */
export function checkManifest(
  manifest: SiteManifest,
  config: CheckerConfig = {}
): CheckerResult {
  const fullConfig = { ...DEFAULT_CHECKER_CONFIG, ...config };
  const issues: Issue[] = [];
  
  // Check each page
  for (const page of manifest.pages) {
    const pageIssues = checkPage(page, fullConfig);
    issues.push(...pageIssues);
  }
  
  // Calculate summary
  const summary: Record<IssueSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
  };
  
  for (const issue of issues) {
    summary[issue.severity]++;
  }
  
  return {
    passed: summary.error === 0,
    issues,
    pagesChecked: manifest.pages.length,
    summary,
  };
}

/**
 * Checks a single page for SEO issues.
 * @param page - The page to check
 * @param config - Checker configuration
 * @returns List of issues found
 */
function checkPage(
  page: { path: string; title?: string | undefined; description?: string | undefined },
  config: Required<CheckerConfig>
): Issue[] {
  const issues: Issue[] = [];
  const pageId = page.path;
  
  // Check title
  if (!page.title) {
    issues.push({
      id: 'missing-title',
      pageId,
      severity: 'warning',
      message: 'Page is missing a title',
    });
  } else if (page.title.length > config.maxTitleLength) {
    issues.push({
      id: 'title-too-long',
      pageId,
      severity: 'warning',
      message: `Title exceeds ${config.maxTitleLength} characters (${page.title.length})`,
    });
  }
  
  // Check description
  if (!page.description) {
    issues.push({
      id: 'missing-description',
      pageId,
      severity: 'warning',
      message: 'Page is missing a description',
    });
  } else if (page.description.length > config.maxDescriptionLength) {
    issues.push({
      id: 'description-too-long',
      pageId,
      severity: 'info',
      message: `Description exceeds ${config.maxDescriptionLength} characters (${page.description.length})`,
    });
  }
  
  return issues;
}

/**
 * Main check function:
 * 1. Validates config
 * 2. Reads existing files from disk
 * 3. Compares expected vs actual (if expected content provided)
 * 4. Runs linting rules
 * 5. Returns issues with summary
 * 
 * @param options - Check options
 * @returns Check result with issues and exit code
 */
export async function checkGeneratedFiles(options: CheckOptions): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  let filesChecked = 0;
  let filesMissing = 0;
  let filesMismatch = 0;
  
  const { config, failOn } = options;
  
  // Get file paths from config
  const llmsTxtPath = options.llmsTxtPath ?? config.output.paths.llmsTxt;
  const llmsFullTxtPath = options.llmsFullTxtPath ?? config.output.paths.llmsFullTxt;
  const citationsPath = options.citationsPath ?? config.output.paths.citations;
  
  // Check llms.txt
  const llmsTxtResult = await checkFile(llmsTxtPath);
  if (!llmsTxtResult.exists) {
    issues.push(createCheckIssue(
      'error',
      'file_missing',
      `Required file does not exist: ${llmsTxtPath}`,
      llmsTxtPath
    ));
    filesMissing++;
  } else if (llmsTxtResult.content === '') {
    issues.push(createCheckIssue(
      'warning',
      'file_empty',
      `File is empty: ${llmsTxtPath}`,
      llmsTxtPath
    ));
    filesChecked++;
  } else {
    filesChecked++;
    // Run content linter on llms.txt
    const lintIssues = await lintFile(llmsTxtPath, llmsTxtResult.content, config);
    issues.push(...lintIssues);
  }
  
  // Check llms-full.txt
  const llmsFullTxtResult = await checkFile(llmsFullTxtPath);
  if (!llmsFullTxtResult.exists) {
    issues.push(createCheckIssue(
      'error',
      'file_missing',
      `Required file does not exist: ${llmsFullTxtPath}`,
      llmsFullTxtPath
    ));
    filesMissing++;
  } else if (llmsFullTxtResult.content === '') {
    issues.push(createCheckIssue(
      'warning',
      'file_empty',
      `File is empty: ${llmsFullTxtPath}`,
      llmsFullTxtPath
    ));
    filesChecked++;
  } else {
    filesChecked++;
    // Run content linter on llms-full.txt
    const lintIssues = await lintFile(llmsFullTxtPath, llmsFullTxtResult.content, config);
    issues.push(...lintIssues);
  }
  
  // Check citations.json (optional)
  if (citationsPath) {
    const citationsResult = await checkFile(citationsPath);
    if (!citationsResult.exists) {
      issues.push(createCheckIssue(
        'warning',
        'file_missing',
        `Optional citations file does not exist: ${citationsPath}`,
        citationsPath
      ));
      filesMissing++;
    } else {
      filesChecked++;
    }
  }
  
  // Calculate summary
  const severityCounts = countSeverities(issues);
  
  // Determine exit code
  let exitCode: ExitCode;
  if (severityCounts.error > 0) {
    exitCode = 2; // ERROR
  } else if (failOn === 'warn' && severityCounts.warning > 0) {
    exitCode = 1; // WARN
  } else {
    exitCode = 0; // OK
  }
  
  return {
    issues,
    summary: {
      errors: severityCounts.error,
      warnings: severityCounts.warning,
      info: severityCounts.info,
      filesChecked,
      filesMissing,
      filesMismatch,
    },
    exitCode,
  };
}

/**
 * Checks if a file exists.
 * @param filePath - Path to the file
 * @returns Promise resolving to true if file exists
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks a file and returns its content.
 * @param filePath - Path to the file
 * @returns Object with exists flag and content
 */
async function checkFile(filePath: string): Promise<{ exists: boolean; content: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { exists: true, content };
  } catch {
    return { exists: false, content: '' };
  }
}

/**
 * Reads file content safely.
 * @param filePath - Path to the file
 * @returns File content or null if file doesn't exist
 */
export async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Compares two strings and returns diff context.
 * @param expected - Expected content
 * @param actual - Actual content
 * @param maxContextLines - Maximum number of diff lines to show (default: 5)
 * @returns CompareResult with match status and context
 */
export function compareContent(
  expected: string,
  actual: string,
  maxContextLines = 5
): CompareResult {
  if (expected === actual) {
    return { match: true, context: '' };
  }
  
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const contextLines: string[] = [];
  let diffCount = 0;
  
  const maxLines = Math.max(expectedLines.length, actualLines.length);
  
  for (let i = 0; i < maxLines && diffCount < maxContextLines; i++) {
    const expectedLine = expectedLines[i];
    const actualLine = actualLines[i];
    
    if (expectedLine !== actualLine) {
      diffCount++;
      const lineNum = i + 1;
      
      if (expectedLine !== undefined) {
        contextLines.push(`Expected line ${lineNum}: "${expectedLine}"`);
      }
      if (actualLine !== undefined) {
        contextLines.push(`Actual line ${lineNum}: "${actualLine}"`);
      }
    }
  }
  
  return {
    match: false,
    context: contextLines.join('\n'),
  };
}

/**
 * Lints a file content against policy rules.
 * @param filePath - Path to the file
 * @param content - File content
 * @param config - LLM-SEO configuration
 * @returns Array of check issues
 */
async function lintFile(
  filePath: string,
  content: string,
  config: LlmsSeoConfig
): Promise<CheckIssue[]> {
  const issues: CheckIssue[] = [];
  
  // Run basic linting rules
  const lintResult = lintWithRules(content, filePath);
  for (const issue of lintResult.issues) {
    const checkIssue: CheckIssue = {
      path: filePath,
      code: issue.id as CheckIssueCode,
      message: issue.message,
      severity: issue.severity,
    };
    if (issue.line !== undefined) {
      checkIssue.line = issue.line;
    }
    if (issue.suggestion !== undefined) {
      checkIssue.context = issue.suggestion;
    }
    issues.push(checkIssue);
  }
  
  // Check forbidden terms if policy is configured
  if (config.policy?.restrictedClaims?.enable) {
    const forbidden = config.policy.restrictedClaims.forbidden ?? [];
    const whitelist = config.policy.restrictedClaims.whitelist ?? [];
    const forbiddenIssues = checkForbiddenTerms(content, forbidden, whitelist);
    
    for (const issue of forbiddenIssues) {
      const checkIssue: CheckIssue = {
        path: filePath,
        code: 'forbidden_term',
        message: issue.message,
        severity: issue.severity,
      };
      if (issue.line !== undefined) {
        checkIssue.line = issue.line;
      }
      if (issue.context !== undefined) {
        checkIssue.context = issue.context;
      }
      issues.push(checkIssue);
    }
  }
  
  // Check for empty sections
  const emptySectionIssues = checkEmptySections(content);
  for (const issue of emptySectionIssues) {
    const checkIssue: CheckIssue = {
      path: filePath,
      code: 'empty_section',
      message: issue.message,
      severity: issue.severity,
    };
    if (issue.line !== undefined) {
      checkIssue.line = issue.line;
    }
    if (issue.context !== undefined) {
      checkIssue.context = issue.context;
    }
    issues.push(checkIssue);
  }
  
  // Check for duplicate URLs
  const duplicateUrlIssues = checkDuplicateUrls(content);
  for (const issue of duplicateUrlIssues) {
    const checkIssue: CheckIssue = {
      path: filePath,
      code: 'duplicate_url',
      message: issue.message,
      severity: issue.severity,
    };
    if (issue.line !== undefined) {
      checkIssue.line = issue.line;
    }
    if (issue.context !== undefined) {
      checkIssue.context = issue.context;
    }
    issues.push(checkIssue);
  }
  
  return issues;
}

/**
 * Checks generated files against expected content.
 * @param llmsTxtPath - Path to llms.txt
 * @param expectedLlmsTxt - Expected llms.txt content
 * @param llmsFullTxtPath - Path to llms-full.txt
 * @param expectedLlmsFullTxt - Expected llms-full.txt content
 * @param maxContextLines - Maximum context lines for diff
 * @returns Array of check issues
 */
export async function checkFilesAgainstExpected(
  llmsTxtPath: string,
  expectedLlmsTxt: string,
  llmsFullTxtPath: string,
  expectedLlmsFullTxt: string,
  maxContextLines = 5
): Promise<CheckIssue[]> {
  const issues: CheckIssue[] = [];
  
  // Check llms.txt
  const llmsTxtContent = await readFileContent(llmsTxtPath);
  if (llmsTxtContent === null) {
    issues.push(createCheckIssue(
      'error',
      'file_missing',
      `Required file does not exist: ${llmsTxtPath}`,
      llmsTxtPath
    ));
  } else if (llmsTxtContent === '') {
    issues.push(createCheckIssue(
      'warning',
      'file_empty',
      `File is empty: ${llmsTxtPath}`,
      llmsTxtPath
    ));
  } else {
    const compareResult = compareContent(expectedLlmsTxt, llmsTxtContent, maxContextLines);
    if (!compareResult.match) {
      issues.push(createCheckIssue(
        'error',
        'file_mismatch',
      `Content differs from expected output`,
        llmsTxtPath,
        compareResult.context
      ));
    }
  }
  
  // Check llms-full.txt
  const llmsFullTxtContent = await readFileContent(llmsFullTxtPath);
  if (llmsFullTxtContent === null) {
    issues.push(createCheckIssue(
      'error',
      'file_missing',
      `Required file does not exist: ${llmsFullTxtPath}`,
      llmsFullTxtPath
    ));
  } else if (llmsFullTxtContent === '') {
    issues.push(createCheckIssue(
      'warning',
      'file_empty',
      `File is empty: ${llmsFullTxtPath}`,
      llmsFullTxtPath
    ));
  } else {
    const compareResult = compareContent(expectedLlmsFullTxt, llmsFullTxtContent, maxContextLines);
    if (!compareResult.match) {
      issues.push(createCheckIssue(
        'error',
        'file_mismatch',
        `Content differs from expected output`,
        llmsFullTxtPath,
        compareResult.context
      ));
    }
  }
  
  return issues;
}

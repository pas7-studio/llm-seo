/**
 * Issue types and utilities for SEO checking.
 */

/**
 * Severity levels for issues.
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Categories of SEO issues.
 */
export type IssueCategory = 
  | 'content'
  | 'structure'
  | 'accessibility'
  | 'performance'
  | 'metadata';

/**
 * Represents a check issue found during file verification.
 */
export interface CheckIssue {
  /** File path or config path */
  path: string;
  /** Issue code e.g., 'file_mismatch', 'missing_file' */
  code: CheckIssueCode;
  /** Human-readable message describing the issue */
  message: string;
  /** Severity of the issue */
  severity: IssueSeverity;
  /** Optional line number where the issue was found */
  line?: number;
  /** Context snippet (first N lines or relevant content) */
  context?: string;
}

/**
 * Issue codes for check issues.
 */
export type CheckIssueCode =
  // File issues
  | 'file_missing'
  | 'file_mismatch'
  | 'file_empty'
  // Content issues
  | 'forbidden_term'
  | 'empty_section'
  | 'duplicate_url'
  | 'invalid_url'
  // Config issues
  | 'config_invalid';

/**
 * Legacy Issue interface for backwards compatibility.
 */
export interface Issue {
  /** Unique identifier for the issue type */
  id: string;
  /** The page or resource this issue applies to */
  pageId: string;
  /** Severity of the issue */
  severity: IssueSeverity;
  /** Human-readable message describing the issue */
  message: string;
  /** Optional category for grouping */
  category?: IssueCategory;
  /** Optional suggestion for fixing the issue */
  suggestion?: string;
  /** Optional line number where the issue was found */
  line?: number;
  /** Optional column number where the issue was found */
  column?: number;
}

/**
 * Creates a CheckIssue.
 * @param severity - Issue severity
 * @param code - Issue code
 * @param message - Human-readable message
 * @param path - File path (optional, defaults to empty string)
 * @param context - Context snippet (optional)
 * @returns A CheckIssue object
 */
export function createCheckIssue(
  severity: IssueSeverity,
  code: CheckIssueCode,
  message: string,
  path = '',
  context?: string
): CheckIssue {
  const issue: CheckIssue = {
    path,
    code,
    message,
    severity,
  };
  
  if (context !== undefined) {
    issue.context = context;
  }
  
  return issue;
}

/**
 * Creates a legacy Issue with default values.
 * @param overrides - Partial issue to override defaults
 * @returns A complete issue object
 */
export function createIssue(overrides: Partial<Issue> & Pick<Issue, 'id' | 'pageId' | 'severity' | 'message'>): Issue {
  return {
    category: 'content',
    ...overrides,
  };
}

/**
 * Converts legacy Issue to CheckIssue.
 * @param issue - Legacy issue
 * @param path - File path
 * @returns CheckIssue object
 */
export function issueToCheckIssue(issue: Issue, path: string): CheckIssue {
  const checkIssue: CheckIssue = {
    path,
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
  
  return checkIssue;
}

/**
 * Groups check issues by severity.
 * @param issues - List of issues
 * @returns Map of severity to issues
 */
export function groupCheckIssuesBySeverity(issues: readonly CheckIssue[]): Map<IssueSeverity, CheckIssue[]> {
  const grouped = new Map<IssueSeverity, CheckIssue[]>();
  
  for (const issue of issues) {
    const existing = grouped.get(issue.severity) ?? [];
    existing.push(issue);
    grouped.set(issue.severity, existing);
  }
  
  return grouped;
}

/**
 * Groups issues by severity (legacy).
 * @param issues - List of issues
 * @returns Map of severity to issues
 */
export function groupBySeverity(issues: readonly Issue[]): Map<IssueSeverity, Issue[]> {
  const grouped = new Map<IssueSeverity, Issue[]>();
  
  for (const issue of issues) {
    const existing = grouped.get(issue.severity) ?? [];
    existing.push(issue);
    grouped.set(issue.severity, existing);
  }
  
  return grouped;
}

/**
 * Groups issues by page.
 * @param issues - List of issues
 * @returns Map of pageId to issues
 */
export function groupByPage(issues: readonly Issue[]): Map<string, Issue[]> {
  const grouped = new Map<string, Issue[]>();
  
  for (const issue of issues) {
    const existing = grouped.get(issue.pageId) ?? [];
    existing.push(issue);
    grouped.set(issue.pageId, existing);
  }
  
  return grouped;
}

/**
 * Filters issues by minimum severity.
 * @param issues - List of issues
 * @param minSeverity - Minimum severity to include
 * @returns Filtered list of issues
 */
export function filterBySeverity(issues: readonly Issue[], minSeverity: IssueSeverity): Issue[] {
  const severityOrder: IssueSeverity[] = ['error', 'warning', 'info'];
  const minIndex = severityOrder.indexOf(minSeverity);
  
  return issues.filter((issue) => {
    const issueIndex = severityOrder.indexOf(issue.severity);
    return issueIndex <= minIndex;
  });
}

/**
 * Counts issues by severity.
 * @param issues - List of check issues
 * @returns Counts for each severity level
 */
export function countSeverities(issues: readonly CheckIssue[]): Record<IssueSeverity, number> {
  const counts: Record<IssueSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
  };
  
  for (const issue of issues) {
    counts[issue.severity]++;
  }
  
  return counts;
}

/**
 * Formats a check issue for display.
 * @param issue - Check issue to format
 * @returns Formatted string
 */
export function formatCheckIssue(issue: CheckIssue): string {
  const severityLabel = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
  let output = `${severityLabel}: ${issue.code}\n`;
  output += `  File: ${issue.path}\n`;
  
  if (issue.line !== undefined) {
    output += `  Line: ${issue.line}\n`;
  }
  
  output += `  Message: ${issue.message}`;
  
  if (issue.context) {
    output += `\n  Context: "${issue.context}"`;
  }
  
  return output;
}

/**
 * Formats multiple check issues for display.
 * @param issues - Check issues to format
 * @returns Formatted string
 */
export function formatCheckIssues(issues: CheckIssue[]): string {
  return issues.map(formatCheckIssue).join('\n\n');
}

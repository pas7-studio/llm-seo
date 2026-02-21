/**
 * Exit codes for CLI commands.
 */

import type { CheckIssue, IssueSeverity } from '../core/check/issues.js';

/**
 * Exit codes for the llm-seo CLI.
 */
export const ExitCodes = {
  /** Command completed successfully */
  OK: 0,
  /** Warnings found (when --fail-on warn) */
  WARN: 1,
  /** Errors found */
  ERROR: 2,
  /** Network error (for doctor command) */
  NETWORK_ERROR: 3,
  /** Configuration file not found */
  CONFIG_NOT_FOUND: 4,
  /** Invalid configuration */
  INVALID_CONFIG: 5,
  /** File not found */
  FILE_NOT_FOUND: 6,
  /** Validation failed */
  VALIDATION_FAILED: 7,
  /** Generation failed */
  GENERATION_FAILED: 8,
  /** Permission denied */
  PERMISSION_DENIED: 126,
  /** Command not found */
  COMMAND_NOT_FOUND: 127,
} as const;

/**
 * Type for exit codes.
 */
export type ExitCode = (typeof ExitCodes)[keyof typeof ExitCodes];

/**
 * Exits the process with the given code.
 * @param code - Exit code
 */
export function exit(code: ExitCode): never {
  process.exit(code);
}

/**
 * Determines exit code from issues array.
 * @param issues - Array of check issues
 * @param failOn - Fail threshold: 'warn' treats warnings as failures, 'error' only errors
 * @returns Appropriate exit code
 */
export function getExitCodeFromIssues(
  issues: CheckIssue[],
  failOn: 'warn' | 'error' = 'error'
): ExitCode {
  const severityCounts = countSeverities(issues);
  
  // Any error always results in ERROR exit code
  if (severityCounts.error > 0) {
    return ExitCodes.ERROR;
  }
  
  // If failOn is 'warn', warnings cause WARN exit code
  if (failOn === 'warn' && severityCounts.warning > 0) {
    return ExitCodes.WARN;
  }
  
  // All clear
  return ExitCodes.OK;
}

/**
 * Counts issues by severity.
 * @param issues - Array of check issues
 * @returns Counts for each severity level
 */
function countSeverities(issues: CheckIssue[]): Record<IssueSeverity, number> {
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
 * Formats exit code description for display.
 * @param code - Exit code
 * @returns Human-readable description
 */
export function describeExitCode(code: ExitCode): string {
  switch (code) {
    case ExitCodes.OK:
      return 'Success';
    case ExitCodes.WARN:
      return 'Warnings found';
    case ExitCodes.ERROR:
      return 'Errors found';
    case ExitCodes.NETWORK_ERROR:
      return 'Network error';
    case ExitCodes.CONFIG_NOT_FOUND:
      return 'Configuration file not found';
    case ExitCodes.INVALID_CONFIG:
      return 'Invalid configuration';
    case ExitCodes.FILE_NOT_FOUND:
      return 'File not found';
    case ExitCodes.VALIDATION_FAILED:
      return 'Validation failed';
    case ExitCodes.GENERATION_FAILED:
      return 'Generation failed';
    case ExitCodes.PERMISSION_DENIED:
      return 'Permission denied';
    case ExitCodes.COMMAND_NOT_FOUND:
      return 'Command not found';
    default:
      return `Unknown exit code: ${code}`;
  }
}

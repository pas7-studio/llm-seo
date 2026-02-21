/**
 * Reporting utilities for CLI output.
 * Provides formatted output for generate, check, and doctor commands.
 */

import type { CheckResult } from '../../core/check/checker.js';
import type { CheckIssue, IssueSeverity } from '../../core/check/issues.js';
import { formatCheckIssue } from '../../core/check/issues.js';

/**
 * Doctor check result for endpoint verification.
 */
export interface DoctorCheck {
  /** Endpoint name (e.g., "robots.txt") */
  name: string;
  /** Full URL checked */
  url: string;
  /** Check status */
  status: 'ok' | 'warn' | 'error' | 'skip';
  /** Human-readable message */
  message: string;
  /** Response time in milliseconds */
  responseTime?: number;
}

/**
 * Color codes for terminal output.
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
} as const;

/**
 * Check if colors should be used (respects NO_COLOR env var).
 */
function shouldUseColors(): boolean {
  return process.env.NO_COLOR === undefined && process.stdout.isTTY === true;
}

/**
 * Colors text for terminal output.
 * @param text - Text to color
 * @param colorCode - Color code
 * @returns Colored text
 */
function color(text: string, colorCode: keyof typeof colors): string {
  if (!shouldUseColors()) {
    return text;
  }
  return `${colors[colorCode]}${text}${colors.reset}`;
}

/**
 * Prints a success message.
 * @param message - Message to print
 */
export function printSuccess(message: string): void {
  console.log(color(`✓`, 'green'), message);
}

/**
 * Prints an error message.
 * @param message - Message to print
 */
export function printError(message: string): void {
  console.error(color(`✗`, 'red'), message);
}

/**
 * Prints a warning message.
 * @param message - Message to print
 */
export function printWarning(message: string): void {
  console.warn(color(`⚠`, 'yellow'), message);
}

/**
 * Prints an info message.
 * @param message - Message to print
 */
export function printInfo(message: string): void {
  console.log(color(`ℹ`, 'blue'), message);
}

/**
 * Prints a verbose/debug message.
 * @param message - Message to print
 */
export function printVerbose(message: string): void {
  console.log(color(`  [debug]`, 'gray'), message);
}

/**
 * Prints a header section.
 * @param title - Section title
 */
export function printHeader(title: string): void {
  console.log('');
  console.log(color(title, 'bold'));
  console.log('─'.repeat(title.length));
}

/**
 * Prints check report to console.
 * @param result - Check result from checker
 * @param verbose - Show detailed output
 */
export function printCheckReport(result: CheckResult, verbose: boolean): void {
  console.log('');
  printHeader('SEO Check Results');
  
  // Summary
  const { summary, issues } = result;
  console.log('');
  console.log(`Files checked: ${summary.filesChecked}`);
  console.log(`Files missing: ${summary.filesMissing}`);
  console.log(`Files with issues: ${summary.filesMismatch}`);
  
  // Issue counts
  console.log('');
  console.log('Summary:');
  
  const errorText = summary.errors > 0 
    ? color(`${summary.errors} error${summary.errors !== 1 ? 's' : ''}`, 'red')
    : `${summary.errors} errors`;
  const warningText = summary.warnings > 0 
    ? color(`${summary.warnings} warning${summary.warnings !== 1 ? 's' : ''}`, 'yellow')
    : `${summary.warnings} warnings`;
  const infoText = summary.info > 0 
    ? color(`${summary.info} info`, 'blue')
    : `${summary.info} info`;
  
  console.log(`  ${errorText}, ${warningText}, ${infoText}`);
  
  // Detailed issues
  if (issues.length > 0) {
    console.log('');
    printHeader('Issues');
    
    // Group issues by file
    const issuesByFile = groupIssuesByFile(issues);
    
    for (const [filePath, fileIssues] of issuesByFile) {
      console.log('');
      console.log(color(filePath, 'cyan'));
      
      for (const issue of fileIssues) {
        printCheckIssue(issue, verbose);
      }
    }
  }
  
  // Final status
  console.log('');
  if (summary.errors > 0) {
    console.log(color('FAILED', 'red'), ' - Errors found');
  } else if (summary.warnings > 0) {
    console.log(color('PASSED WITH WARNINGS', 'yellow'));
  } else {
    console.log(color('PASSED', 'green'));
  }
  
  console.log('');
}

/**
 * Prints a single check issue.
 * @param issue - Issue to print
 * @param verbose - Show detailed output
 */
function printCheckIssue(issue: CheckIssue, verbose: boolean): void {
  const severityIcon = issue.severity === 'error' 
    ? color('✗', 'red') 
    : issue.severity === 'warning' 
      ? color('⚠', 'yellow') 
      : color('ℹ', 'blue');
  
  const lineInfo = issue.line !== undefined ? `:${issue.line}` : '';
  const prefix = `  ${severityIcon} ${issue.path}${lineInfo}`;
  
  console.log(`${prefix}: ${issue.message}`);
  
  if (verbose && issue.context) {
    console.log(color(`    Context: "${issue.context}"`, 'gray'));
  }
}

/**
 * Groups issues by file path.
 * @param issues - Issues to group
 * @returns Map of file path to issues
 */
function groupIssuesByFile(issues: CheckIssue[]): Map<string, CheckIssue[]> {
  const grouped = new Map<string, CheckIssue[]>();
  
  for (const issue of issues) {
    const existing = grouped.get(issue.path) ?? [];
    existing.push(issue);
    grouped.set(issue.path, existing);
  }
  
  return grouped;
}

/**
 * File info for generate report.
 */
export interface GeneratedFile {
  /** Output file path */
  path: string;
  /** File size in bytes */
  size: number;
}

/**
 * Prints generate report to console.
 * @param files - List of generated files
 * @param verbose - Show detailed output
 */
export function printGenerateReport(files: GeneratedFile[], verbose: boolean): void {
  console.log('');
  printHeader('Generation Complete');
  
  console.log('');
  console.log(`Generated ${files.length} file${files.length !== 1 ? 's' : ''}:`);
  
  for (const file of files) {
    const sizeStr = formatBytes(file.size);
    console.log(`  ${color('✓', 'green')} ${file.path} (${sizeStr})`);
    
    if (verbose) {
      console.log(color(`    Size: ${file.size} bytes`, 'gray'));
    }
  }
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  console.log('');
  console.log(`Total size: ${formatBytes(totalSize)}`);
  console.log('');
}

/**
 * Prints doctor report to console.
 * @param checks - List of doctor checks
 * @param verbose - Show detailed output
 */
export function printDoctorReport(checks: DoctorCheck[], verbose: boolean): void {
  console.log('');
  printHeader('Diagnostic Results');
  
  console.log('');
  
  for (const check of checks) {
    printDoctorCheck(check, verbose);
  }
  
  // Summary
  console.log('');
  const errors = checks.filter(c => c.status === 'error').length;
  const warnings = checks.filter(c => c.status === 'warn').length;
  const ok = checks.filter(c => c.status === 'ok').length;
  const skipped = checks.filter(c => c.status === 'skip').length;
  
  console.log(
    `${color('✓', 'green')} ${ok} ok, ` +
    `${color('⚠', 'yellow')} ${warnings} warning${warnings !== 1 ? 's' : ''}, ` +
    `${color('✗', 'red')} ${errors} error${errors !== 1 ? 's' : ''}` +
    (skipped > 0 ? `, ${skipped} skipped` : '')
  );
  
  console.log('');
}

/**
 * Prints a single doctor check.
 * @param check - Check to print
 * @param verbose - Show detailed output
 */
function printDoctorCheck(check: DoctorCheck, verbose: boolean): void {
  const icon = check.status === 'ok' 
    ? color('✓', 'green') 
    : check.status === 'warn' 
      ? color('⚠', 'yellow') 
      : check.status === 'error'
        ? color('✗', 'red')
        : color('○', 'gray');
  
  const timeStr = check.responseTime !== undefined 
    ? ` (${check.responseTime}ms)` 
    : '';
  
  console.log(`${icon} ${check.name}: ${check.message}${timeStr}`);
  
  if (verbose) {
    console.log(color(`  URL: ${check.url}`, 'gray'));
  }
}

/**
 * Formats error for console output.
 * @param error - Error to format
 * @param verbose - Show detailed output with stack trace
 * @returns Formatted error string
 */
export function formatError(error: Error, verbose: boolean): string {
  const lines: string[] = [];
  
  lines.push(color(`Error: ${error.message}`, 'red'));
  
  if (verbose && error.stack) {
    lines.push('');
    lines.push(color('Stack trace:', 'gray'));
    lines.push(error.stack);
  }
  
  return lines.join('\n');
}

/**
 * Formats bytes to human-readable string.
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 KB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  
  // Show decimal for KB and above
  if (i === 0) {
    return `${bytes} B`;
  }
  
  return `${size.toFixed(1)} ${units[i]}`;
}

/**
 * Formats a summary of issues by severity.
 * @param counts - Counts by severity
 * @returns Formatted summary string
 */
export function formatSummary(counts: Record<IssueSeverity, number>): string {
  const parts: string[] = [];
  
  if (counts.error > 0) {
    parts.push(color(`${counts.error} error${counts.error !== 1 ? 's' : ''}`, 'red'));
  }
  if (counts.warning > 0) {
    parts.push(color(`${counts.warning} warning${counts.warning !== 1 ? 's' : ''}`, 'yellow'));
  }
  if (counts.info > 0) {
    parts.push(color(`${counts.info} info`, 'blue'));
  }
  
  return parts.join(', ') || color('No issues', 'green');
}

/**
 * Prints a dry-run output header.
 * @param fileName - File name being output
 */
export function printDryRunHeader(fileName: string): void {
  console.log('');
  console.log(color(`━━━ ${fileName} ━━━`, 'cyan'));
}

/**
 * Prints a separator line.
 */
export function printSeparator(): void {
  console.log(color('─'.repeat(60), 'gray'));
}

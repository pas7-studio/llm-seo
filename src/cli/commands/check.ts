/**
 * Check command - validates SEO health of llms.txt files.
 * Main implementation of `llm-seo check` CLI command.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import { loadConfig, type LoadConfigResult } from '../io/load-config.js';
import {
  printError,
  printWarning,
  printVerbose,
  printCheckReport,
} from '../io/report.js';
import { ExitCodes } from '../exit-codes.js';
import {
  checkGeneratedFiles,
  checkFilesAgainstExpected,
  type CheckOptions as CoreCheckOptions,
} from '../../core/check/checker.js';
import type { CheckIssue } from '../../core/check/issues.js';
import { countSeverities } from '../../core/check/issues.js';
import {
  createLlmsTxt,
  createLlmsFullTxt,
  createCanonicalBundleFromConfig,
} from '../../core/index.js';

/**
 * Options for the check command.
 */
export interface CheckCommandOptions {
  /** Path to config file */
  config: string;
  /** Fail threshold: treat warnings as errors */
  failOn: 'warn' | 'error';
  /** Run live HTTP checks for machine hint URLs */
  checkMachineHintsLive: boolean;
  /** Show detailed output */
  verbose: boolean;
}

/**
 * Executes the check command.
 * @param options - Command options
 * @returns Exit code
 */
export async function checkCommand(options: CheckCommandOptions): Promise<number> {
  const { config: configPath, failOn, checkMachineHintsLive, verbose } = options;
  
  try {
    // Step 1: Load config
    if (verbose) {
      printVerbose(`Loading config from: ${configPath}`);
    }
    
    let loadResult: LoadConfigResult;
    try {
      loadResult = await loadConfig({ path: configPath });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      printError(`Failed to load config: ${message}`);
      return ExitCodes.CONFIG_NOT_FOUND;
    }
    
    const { config } = loadResult;
    
    // Report any validation issues
    for (const issue of loadResult.issues) {
      if (issue.severity === 'warning') {
        printWarning(issue.message);
      } else {
        printError(issue.message);
        return ExitCodes.INVALID_CONFIG;
      }
    }
    
    if (verbose) {
      printVerbose(`Config loaded successfully`);
      printVerbose(`Site: ${config.site.baseUrl}`);
    }
    
    // Step 2: Run checker
    if (verbose) {
      printVerbose('Running SEO checks...');
    }
    
    const checkOptions: CoreCheckOptions = {
      config,
      failOn,
      llmsTxtPath: config.output.paths.llmsTxt,
      llmsFullTxtPath: config.output.paths.llmsFullTxt,
      ...(config.output.paths.citations && { citationsPath: config.output.paths.citations }),
    };
    
    const result = await checkGeneratedFiles(checkOptions);

    const canonicalBundle = createCanonicalBundleFromConfig(config);
    const manifestItems = canonicalBundle.manifestItems;
    const canonicalUrls = canonicalBundle.canonicalUrls;
    const expectedLlms = createLlmsTxt({ config, canonicalUrls });
    const expectedLlmsFull = createLlmsFullTxt({
      config,
      canonicalUrls,
      manifestItems,
      manifestEntries: canonicalBundle.entries,
    });

    const requiredMissing = result.issues.some((issue) => {
      return (
        issue.code === 'file_missing' &&
        (issue.path === config.output.paths.llmsTxt ||
          issue.path === config.output.paths.llmsFullTxt)
      );
    });

    let merged = result;
    if (!requiredMissing) {
      const mismatchIssues = await checkFilesAgainstExpected(
        config.output.paths.llmsTxt,
        expectedLlms.content,
        config.output.paths.llmsFullTxt,
        expectedLlmsFull.content
      );

      if (mismatchIssues.length > 0) {
        const issues = [...result.issues, ...mismatchIssues];
        const counts = countSeverities(issues);
        const mismatchCount = mismatchIssues.filter((issue) => issue.code === 'file_mismatch').length;
        merged = {
          ...result,
          issues,
          summary: {
            ...result.summary,
            errors: counts.error,
            warnings: counts.warning,
            info: counts.info,
            filesMismatch: result.summary.filesMismatch + mismatchCount,
          },
        };
      }
    }
    
    if (checkMachineHintsLive) {
      const liveIssues = await checkMachineHintsLiveEndpoints(config, verbose);
      if (liveIssues.length > 0) {
        const issues = [...merged.issues, ...liveIssues];
        const counts = countSeverities(issues);
        merged = {
          ...merged,
          issues,
          summary: {
            ...merged.summary,
            errors: counts.error,
            warnings: counts.warning,
            info: counts.info,
          },
        };
      }
    }

    // Step 3: Print report
    printCheckReport(merged, verbose);
    
    // Step 4: Return exit code
    if (merged.summary.errors > 0) {
      return ExitCodes.ERROR;
    }
    
    if (failOn === 'warn' && merged.summary.warnings > 0) {
      return ExitCodes.WARN;
    }
    
    return ExitCodes.OK;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printError(`Check failed: ${message}`);
    return ExitCodes.ERROR;
  }
}

async function checkMachineHintsLiveEndpoints(
  config: LlmsSeoConfig,
  verbose: boolean
): Promise<CheckIssue[]> {
  const baseUrl = config.site.baseUrl.replace(/\/+$/, '');
  const urls = [
    config.machineHints?.robots ?? `${baseUrl}/robots.txt`,
    config.machineHints?.sitemap ?? `${baseUrl}/sitemap.xml`,
    config.machineHints?.llmsTxt ?? `${baseUrl}/llms.txt`,
    config.machineHints?.llmsFullTxt ?? `${baseUrl}/llms-full.txt`,
  ];

  const issues: CheckIssue[] = [];

  for (const url of urls) {
    try {
      if (verbose) {
        printVerbose(`Live-checking ${url}`);
      }
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        issues.push({
          path: url,
          code: 'invalid_url',
          message: `Live check failed with HTTP ${response.status}`,
          severity: 'error',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push({
        path: url,
        code: 'invalid_url',
        message: `Live check request failed: ${message}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

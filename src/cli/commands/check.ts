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
import { writeJsonFileAtomic } from '../io/fs.js';
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
  checkLive: boolean;
  /** Timeout in ms for each live request */
  timeoutMs: number;
  /** Number of retries for failed live requests */
  retries: number;
  /** Optional JSON report output path */
  emitReportPath?: string;
  /** Show detailed output */
  verbose: boolean;
}

export interface CheckJsonReport {
  status: 'ok' | 'warn' | 'error';
  summary: {
    errors: number;
    warnings: number;
    info: number;
    filesChecked: number;
    filesMissing: number;
    filesMismatch: number;
  };
  issues: CheckIssue[];
  files: {
    llmsTxt: string;
    llmsFullTxt: string;
    citations?: string;
    report?: string;
  };
  canonical: {
    total: number;
    urls: string[];
  };
}

/**
 * Executes the check command.
 * @param options - Command options
 * @returns Exit code
 */
export async function checkCommand(options: CheckCommandOptions): Promise<number> {
  const { config: configPath, failOn, checkLive, timeoutMs, retries, emitReportPath, verbose } = options;
  
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
    
    if (checkLive) {
      const liveIssues = await checkMachineHintsLiveEndpoints(config, {
        timeoutMs,
        retries,
        verbose,
      });
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

    if (emitReportPath) {
      const report = buildJsonReport({
        merged,
        config,
        canonicalUrls: canonicalBundle.canonicalUrls,
        emitReportPath,
      });
      await writeJsonFileAtomic(emitReportPath, report);
      if (verbose) {
        printVerbose(`Wrote check report: ${emitReportPath}`);
      }
    }
    
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
  options: {
    timeoutMs: number;
    retries: number;
    verbose: boolean;
  }
): Promise<CheckIssue[]> {
  const { timeoutMs, retries, verbose } = options;
  const baseUrl = config.site.baseUrl.replace(/\/+$/, '');
  const urls = [
    config.machineHints?.robots ?? `${baseUrl}/robots.txt`,
    config.machineHints?.sitemap ?? `${baseUrl}/sitemap.xml`,
    config.machineHints?.llmsTxt ?? `${baseUrl}/llms.txt`,
    config.machineHints?.llmsFullTxt ?? `${baseUrl}/llms-full.txt`,
  ];

  const issues: CheckIssue[] = [];

  for (const url of urls) {
    let lastError: string | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (verbose) {
          printVerbose(`Live-checking ${url} (attempt ${attempt + 1}/${retries + 1})`);
        }
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          continue;
        }

        lastError = null;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    if (lastError) {
      issues.push({
        path: url,
        code: 'invalid_url',
        message: `Live check failed after ${retries + 1} attempt(s): ${lastError}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

function buildJsonReport(options: {
  merged: Awaited<ReturnType<typeof checkGeneratedFiles>>;
  config: LlmsSeoConfig;
  canonicalUrls: string[];
  emitReportPath: string;
}): CheckJsonReport {
  const { merged, config, canonicalUrls, emitReportPath } = options;
  const status: CheckJsonReport['status'] = merged.summary.errors > 0
    ? 'error'
    : merged.summary.warnings > 0
      ? 'warn'
      : 'ok';

  return {
    status,
    summary: merged.summary,
    issues: merged.issues,
    files: {
      llmsTxt: config.output.paths.llmsTxt,
      llmsFullTxt: config.output.paths.llmsFullTxt,
      ...(config.output.paths.citations && { citations: config.output.paths.citations }),
      report: emitReportPath,
    },
    canonical: {
      total: canonicalUrls.length,
      urls: canonicalUrls,
    },
  };
}

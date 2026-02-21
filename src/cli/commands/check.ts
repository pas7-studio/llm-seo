/**
 * Check command - validates SEO health of llms.txt files.
 * Main implementation of `llm-seo check` CLI command.
 */

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
  /** Show detailed output */
  verbose: boolean;
}

/**
 * Executes the check command.
 * @param options - Command options
 * @returns Exit code
 */
export async function checkCommand(options: CheckCommandOptions): Promise<number> {
  const { config: configPath, failOn, verbose } = options;
  
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

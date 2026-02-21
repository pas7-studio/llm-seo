/**
 * Check command - validates SEO health of llms.txt files.
 * Main implementation of `llm-seo check` CLI command.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import { loadConfig, type LoadConfigResult } from '../io/load-config.js';
import { readFileSafe, getFileStats } from '../io/fs.js';
import {
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printVerbose,
  printCheckReport,
} from '../io/report.js';
import { ExitCodes } from '../exit-codes.js';
import {
  checkGeneratedFiles,
  type CheckResult,
  type CheckOptions,
} from '../../core/check/checker.js';
import {
  createLlmsTxt,
  createLlmsFullTxt,
  extractCanonicalUrls,
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
    
    const checkOptions: CheckOptions = {
      config,
      failOn,
      llmsTxtPath: config.output.paths.llmsTxt,
      llmsFullTxtPath: config.output.paths.llmsFullTxt,
      citationsPath: config.output.paths.citations,
    };
    
    const result = await checkGeneratedFiles(checkOptions);
    
    // Step 3: Print report
    printCheckReport(result, verbose);
    
    // Step 4: Return exit code
    if (result.summary.errors > 0) {
      return ExitCodes.ERROR;
    }
    
    if (failOn === 'warn' && result.summary.warnings > 0) {
      return ExitCodes.WARN;
    }
    
    return ExitCodes.OK;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printError(`Check failed: ${message}`);
    return ExitCodes.ERROR;
  }
}

/**
 * Extracts manifest items from config.
 */
function extractManifestItems(config: LlmsSeoConfig): Array<{
  slug: string;
  title?: string;
  description?: string;
  locales?: string[];
  canonicalOverride?: string;
}> {
  const items: Array<{
    slug: string;
    title?: string;
    description?: string;
    locales?: string[];
    canonicalOverride?: string;
  }> = [];
  
  const manifests = config.manifests;
  
  for (const [_manifestName, manifestData] of Object.entries(manifests)) {
    if (typeof manifestData === 'object' && manifestData !== null) {
      const data = manifestData as Record<string, unknown>;
      
      if (Array.isArray(data.pages)) {
        for (const page of data.pages) {
          if (typeof page === 'object' && page !== null) {
            const pageData = page as Record<string, unknown>;
            items.push({
              slug: String(pageData.slug ?? pageData.path ?? ''),
              title: pageData.title as string | undefined,
              description: pageData.description as string | undefined,
              locales: pageData.locales as string[] | undefined,
              canonicalOverride: pageData.canonicalOverride as string | undefined,
            });
          }
        }
      }
      
      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'object' && item !== null) {
            const itemData = item as Record<string, unknown>;
            items.push({
              slug: String(itemData.slug ?? itemData.path ?? ''),
              title: itemData.title as string | undefined,
              description: itemData.description as string | undefined,
              locales: itemData.locales as string[] | undefined,
              canonicalOverride: itemData.canonicalOverride as string | undefined,
            });
          }
        }
      }
    }
  }
  
  return items;
}

/**
 * Builds canonical URLs from config and manifest items.
 */
function buildCanonicalUrls(
  config: LlmsSeoConfig,
  manifestItems: Array<{ slug: string; canonicalOverride?: string }>
): string[] {
  const urls: string[] = [];
  const baseUrl = config.site.baseUrl;
  
  for (const item of manifestItems) {
    if (item.canonicalOverride) {
      urls.push(item.canonicalOverride);
    } else if (item.slug) {
      const slug = item.slug.startsWith('/') ? item.slug : `/${item.slug}`;
      urls.push(`${baseUrl}${slug}`);
    }
  }
  
  return urls;
}

// Legacy export for backwards compatibility
export interface CheckOptions {
  config: string;
  strict: boolean;
}

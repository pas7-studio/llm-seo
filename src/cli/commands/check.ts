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
import { countSeverities } from '../../core/check/issues.js';
import {
  createLlmsTxt,
  createLlmsFullTxt,
  createCanonicalUrlsFromManifest,
} from '../../core/index.js';
import type { ManifestItem } from '../../schema/manifest.schema.js';

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

    const manifestItems = extractManifestItems(config);
    const canonicalUrls = createCanonicalUrlsFromManifest({
      items: manifestItems,
      baseUrl: config.site.baseUrl,
      defaultLocale: config.site.defaultLocale ?? config.brand.locales[0] ?? 'en',
      trailingSlash: config.format?.trailingSlash ?? 'never',
      localeStrategy: 'prefix',
    });
    const expectedLlms = createLlmsTxt({ config, canonicalUrls });
    const expectedLlmsFull = createLlmsFullTxt({
      config,
      canonicalUrls,
      manifestItems,
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

/**
 * Extracts manifest items from config.
 */
function extractManifestItems(config: LlmsSeoConfig): ManifestItem[] {
  const items: ManifestItem[] = [];
  
  const manifests = config.manifests;
  
  for (const [_manifestName, manifestData] of Object.entries(manifests)) {
    if (typeof manifestData === 'object' && manifestData !== null) {
      const data = manifestData as Record<string, unknown>;
      
      if (Array.isArray(data.pages)) {
        for (const page of data.pages) {
          const normalized = toManifestItem(page);
          if (normalized) {
            items.push(normalized);
          }
        }
      }
      
      if (Array.isArray(data)) {
        for (const item of data) {
          const normalized = toManifestItem(item);
          if (normalized) {
            items.push(normalized);
          }
        }
      }
    }
  }
  
  return items;
}

function toManifestItem(value: unknown): ManifestItem | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const rawSlug = data.slug ?? data.path;
  if (typeof rawSlug !== 'string' || rawSlug.length === 0) {
    return null;
  }

  const item: ManifestItem = {
    slug: rawSlug.startsWith('/') ? rawSlug : `/${rawSlug}`,
  };

  if (typeof data.title === 'string') {
    item.title = data.title;
  }
  if (typeof data.description === 'string') {
    item.description = data.description;
  }
  if (Array.isArray(data.locales)) {
    const locales = data.locales.filter((loc): loc is string => typeof loc === 'string');
    if (locales.length > 0) {
      item.locales = locales;
    }
  }
  if (typeof data.canonicalOverride === 'string') {
    item.canonicalOverride = data.canonicalOverride;
  }
  if (typeof data.publishedAt === 'string') {
    item.publishedAt = data.publishedAt;
  }
  if (typeof data.updatedAt === 'string') {
    item.updatedAt = data.updatedAt;
  }
  if (typeof data.priority === 'number') {
    item.priority = data.priority;
  }

  return item;
}

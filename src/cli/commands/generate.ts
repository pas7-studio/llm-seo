/**
 * Generate command - generates llms.txt and llms-full.txt.
 * Main implementation of `llm-seo generate` CLI command.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import type { ManifestItem } from '../../schema/manifest.schema.js';
import { loadConfig, type LoadConfigResult } from '../io/load-config.js';
import { writeFileAtomic, fileExists, getFileStats } from '../io/fs.js';
import {
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printVerbose,
  printGenerateReport,
  printDryRunHeader,
  printSeparator,
  type GeneratedFile,
} from '../io/report.js';
import { ExitCodes } from '../exit-codes.js';
import {
  createLlmsTxt,
  createLlmsFullTxt,
  createCitationsJsonString,
  extractCanonicalUrls,
} from '../../core/index.js';

/**
 * Options for the generate command.
 */
export interface GenerateOptions {
  /** Path to config file */
  config: string;
  /** Output to stdout instead of files */
  dryRun: boolean;
  /** Generate citations.json */
  emitCitations: boolean;
  /** Show progress and details */
  verbose: boolean;
}

/**
 * Result of generation.
 */
interface GenerationResult {
  /** Generated files */
  files: GeneratedFile[];
  /** Any warnings during generation */
  warnings: string[];
}

/**
 * Executes the generate command.
 * @param options - Command options
 * @returns Exit code
 */
export async function generateCommand(options: GenerateOptions): Promise<number> {
  const { config: configPath, dryRun, emitCitations, verbose } = options;
  
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
      printVerbose(`Brand: ${config.brand.name}`);
    }
    
    // Step 2: Extract manifest items
    const manifestItems = extractManifestItems(config);
    
    if (verbose) {
      printVerbose(`Found ${manifestItems.length} manifest items`);
    }
    
    // Step 3: Build canonical URLs
    const canonicalUrls = buildCanonicalUrls(config, manifestItems);
    
    if (verbose) {
      printVerbose(`Generated ${canonicalUrls.length} canonical URLs`);
    }
    
    // Step 4: Generate llms.txt
    const llmsTxtResult = createLlmsTxt({ config, canonicalUrls });
    
    // Step 5: Generate llms-full.txt
    const llmsFullTxtResult = createLlmsFullTxt({ 
      config, 
      canonicalUrls, 
      manifestItems 
    });
    
    // Step 6: Optionally generate citations.json
    let citationsContent: string | null = null;
    if (emitCitations) {
      citationsContent = createCitationsJsonString({ config, canonicalUrls });
    }
    
    // Step 7: Output files or stdout
    const result: GenerationResult = {
      files: [],
      warnings: [],
    };
    
    if (dryRun) {
      // Output to stdout
      printDryRunHeader(config.output.paths.llmsTxt);
      console.log(llmsTxtResult.content);
      printSeparator();
      
      printDryRunHeader(config.output.paths.llmsFullTxt);
      console.log(llmsFullTxtResult.content);
      printSeparator();
      
      if (citationsContent) {
        printDryRunHeader(config.output.paths.citations ?? 'citations.json');
        console.log(citationsContent);
        printSeparator();
      }
      
      printInfo('Dry run complete - no files written');
      
      result.files = [
        { path: config.output.paths.llmsTxt, size: llmsTxtResult.byteSize },
        { path: config.output.paths.llmsFullTxt, size: llmsFullTxtResult.byteSize },
      ];
      
      if (citationsContent) {
        result.files.push({ 
          path: config.output.paths.citations ?? 'citations.json', 
          size: Buffer.byteLength(citationsContent, 'utf-8') 
        });
      }
    } else {
      // Write files atomically
      if (verbose) {
        printVerbose(`Writing ${config.output.paths.llmsTxt}`);
      }
      await writeFileAtomic(config.output.paths.llmsTxt, llmsTxtResult.content);
      result.files.push({ path: config.output.paths.llmsTxt, size: llmsTxtResult.byteSize });
      
      if (verbose) {
        printVerbose(`Writing ${config.output.paths.llmsFullTxt}`);
      }
      await writeFileAtomic(config.output.paths.llmsFullTxt, llmsFullTxtResult.content);
      result.files.push({ path: config.output.paths.llmsFullTxt, size: llmsFullTxtResult.byteSize });
      
      if (citationsContent && config.output.paths.citations) {
        if (verbose) {
          printVerbose(`Writing ${config.output.paths.citations}`);
        }
        await writeFileAtomic(config.output.paths.citations, citationsContent);
        result.files.push({ 
          path: config.output.paths.citations, 
          size: Buffer.byteLength(citationsContent, 'utf-8') 
        });
      }
      
      printGenerateReport(result.files, verbose);
    }
    
    // Report any warnings
    for (const warning of result.warnings) {
      printWarning(warning);
    }
    
    return ExitCodes.OK;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printError(`Generation failed: ${message}`);
    return ExitCodes.GENERATION_FAILED;
  }
}

/**
 * Extracts manifest items from config.
 * @param config - LLM SEO config
 * @returns Array of manifest items
 */
function extractManifestItems(config: LlmsSeoConfig): ManifestItem[] {
  const items: ManifestItem[] = [];
  const manifests = config.manifests;
  
  // Process each manifest in the manifests record
  for (const [_manifestName, manifestData] of Object.entries(manifests)) {
    if (typeof manifestData === 'object' && manifestData !== null) {
      const data = manifestData as Record<string, unknown>;
      
      // Check if it has pages array
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
      
      // Check if it's an array directly
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
 * @param config - LLM SEO config
 * @param manifestItems - Manifest items
 * @returns Array of canonical URLs
 */
function buildCanonicalUrls(config: LlmsSeoConfig, manifestItems: ManifestItem[]): string[] {
  const urls: string[] = [];
  const baseUrl = config.site.baseUrl;
  
  // Add URLs from manifest items
  for (const item of manifestItems) {
    if (item.canonicalOverride) {
      urls.push(item.canonicalOverride);
    } else if (item.slug) {
      // Ensure slug starts with /
      const slug = item.slug.startsWith('/') ? item.slug : `/${item.slug}`;
      urls.push(`${baseUrl}${slug}`);
    }
  }
  
  // Use the extractCanonicalUrls function if available
  try {
    const extractedUrls = extractCanonicalUrls(manifestItems, { baseUrl });
    if (extractedUrls.length > 0) {
      return extractedUrls;
    }
  } catch {
    // Fall back to manually built URLs
  }
  
  return urls;
}

// Legacy export for backwards compatibility
export interface GenerateCommandOptions {
  config: string;
  output: string;
  full: boolean;
}

/**
 * Generate command - generates llms.txt and llms-full.txt.
 * Main implementation of `llm-seo generate` CLI command.
 */

import { loadConfig, type LoadConfigResult } from '../io/load-config.js';
import { writeFileAtomic } from '../io/fs.js';
import {
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
  createCanonicalBundleFromConfig,
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
    
    // Step 2: Resolve manifests and canonical URLs
    const canonicalBundle = createCanonicalBundleFromConfig(config);
    const manifestItems = canonicalBundle.manifestItems;
    const canonicalUrls = canonicalBundle.canonicalUrls;
    
    if (verbose) {
      printVerbose(`Found ${manifestItems.length} manifest items`);
      printVerbose(`Generated ${canonicalUrls.length} canonical URLs`);
    }
    
    // Step 4: Generate llms.txt
    const llmsTxtResult = createLlmsTxt({ config, canonicalUrls });
    
    // Step 5: Generate llms-full.txt
    const llmsFullTxtResult = createLlmsFullTxt({ 
      config, 
      canonicalUrls, 
      manifestItems,
      manifestEntries: canonicalBundle.entries,
    });
    
    // Step 6: Optionally generate citations.json
    let citationsContent: string | null = null;
    if (emitCitations) {
      citationsContent = createCitationsJsonString({
        config,
        manifestItems,
        sectionName: 'all',
        entries: canonicalBundle.entries,
      });
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

// Legacy export for backwards compatibility
export interface GenerateCommandOptions {
  config: string;
  output: string;
  full: boolean;
}

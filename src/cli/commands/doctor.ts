/**
 * Doctor command - diagnoses common issues with llm-seo setup.
 * Main implementation of `llm-seo doctor` CLI command.
 */

import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import { loadConfig, findConfigFile } from '../io/load-config.js';
import {
  printVerbose,
  printDoctorReport,
  type DoctorCheck,
} from '../io/report.js';
import { ExitCodes } from '../exit-codes.js';

/**
 * Options for the doctor command.
 */
export interface DoctorOptions {
  /** Site URL to check (optional) */
  site?: string;
  /** Config file path (optional) */
  config?: string;
  /** Show detailed output */
  verbose: boolean;
}

/**
 * Executes the doctor command.
 * @param options - Command options
 * @returns Exit code
 */
export async function doctorCommand(options: DoctorOptions): Promise<number> {
  const { site: siteUrl, config: configPath, verbose } = options;
  
  console.log('Running llm-seo diagnostics...\n');
  
  const checks: DoctorCheck[] = [];
  let config: LlmsSeoConfig | null = null;
  
  // Step 1: Check Node.js version
  checks.push(checkNodeVersion(verbose));
  
  // Step 2: Check for config file
  const configCheck = await checkConfigFile(configPath, verbose);
  checks.push(configCheck.check);
  
  // Load config if available
  if (configCheck.config) {
    config = configCheck.config;
  }
  
  // Step 3: Determine site URL
  let baseUrl = siteUrl;
  if (!baseUrl && config) {
    baseUrl = config.site.baseUrl;
  }
  
  // Step 4: Check endpoints if we have a URL
  if (baseUrl) {
    if (verbose) {
      printVerbose(`Checking site: ${baseUrl}`);
    }
    
    // Check standard endpoints
    checks.push(...await checkEndpoints(baseUrl, config, verbose));
  } else {
    checks.push({
      name: 'Site URL',
      url: '',
      status: 'warn',
      message: 'No site URL specified. Use --site or configure in config file.',
    });
  }
  
  // Step 5: Print report
  printDoctorReport(checks, verbose);
  
  // Step 6: Determine exit code
  const hasErrors = checks.some(c => c.status === 'error');
  const hasWarnings = checks.some(c => c.status === 'warn');
  
  if (hasErrors) {
    return ExitCodes.NETWORK_ERROR;
  }
  
  if (hasWarnings) {
    return ExitCodes.WARN;
  }
  
  return ExitCodes.OK;
}

/**
 * Checks Node.js version.
 */
function checkNodeVersion(_verbose: boolean): DoctorCheck {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
  
  if (majorVersion >= 18) {
    return {
      name: 'Node.js version',
      url: '',
      status: 'ok',
      message: `${nodeVersion} (supported)`,
    };
  }
  
  return {
    name: 'Node.js version',
    url: '',
    status: 'error',
    message: `${nodeVersion} (requires Node.js 18+)`,
  };
}

/**
 * Result of config file check.
 */
interface ConfigCheckResult {
  check: DoctorCheck;
  config: LlmsSeoConfig | null;
}

/**
 * Checks for config file and loads it if available.
 */
async function checkConfigFile(configPath: string | undefined, verbose: boolean): Promise<ConfigCheckResult> {
  // Try to find config file
  let foundPath = configPath;
  
  if (!foundPath) {
    foundPath = findConfigFile() ?? undefined;
  }
  
  if (!foundPath) {
    return {
      check: {
        name: 'Config file',
        url: '',
        status: 'warn',
        message: 'No config file found. Run from project directory or specify --config.',
      },
      config: null,
    };
  }
  
  if (verbose) {
    printVerbose(`Found config: ${foundPath}`);
  }
  
  // Try to load config
  try {
    const loadResult = await loadConfig({ path: foundPath });
    
    return {
      check: {
        name: 'Config file',
        url: foundPath,
        status: 'ok',
        message: `Loaded from ${foundPath}`,
      },
      config: loadResult.config,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    return {
      check: {
        name: 'Config file',
        url: foundPath,
        status: 'error',
        message: `Invalid config: ${message}`,
      },
      config: null,
    };
  }
}

/**
 * Checks site endpoints.
 */
async function checkEndpoints(
  baseUrl: string,
  config: LlmsSeoConfig | null,
  verbose: boolean
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  
  // Normalize base URL (remove trailing slash)
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Check robots.txt
  const robotsUrl = config?.machineHints?.robots ?? `${normalizedBaseUrl}/robots.txt`;
  checks.push(await checkEndpoint('robots.txt', robotsUrl, verbose));
  
  // Check sitemap.xml
  const sitemapUrl = config?.machineHints?.sitemap ?? `${normalizedBaseUrl}/sitemap.xml`;
  checks.push(await checkEndpoint('sitemap.xml', sitemapUrl, verbose));
  
  // Check sitemap-index.xml (try both standard paths)
  const sitemapIndexUrl = `${normalizedBaseUrl}/sitemap-index.xml`;
  const sitemapIndexCheck = await checkEndpoint('sitemap-index.xml', sitemapIndexUrl, verbose, true);
  if (sitemapIndexCheck.status === 'error') {
    sitemapIndexCheck.status = 'skip';
    sitemapIndexCheck.message = 'Not found (optional)';
  }
  checks.push(sitemapIndexCheck);
  
  // Check llms.txt
  const llmsTxtUrl = config?.machineHints?.llmsTxt ?? `${normalizedBaseUrl}/llms.txt`;
  checks.push(await checkEndpoint('llms.txt', llmsTxtUrl, verbose));
  
  // Check llms-full.txt
  const llmsFullTxtUrl = config?.machineHints?.llmsFullTxt ?? `${normalizedBaseUrl}/llms-full.txt`;
  checks.push(await checkEndpoint('llms-full.txt', llmsFullTxtUrl, verbose));
  
  return checks;
}

/**
 * Fetches URL and returns check result.
 * @param name - Endpoint name for display
 * @param url - Full URL to check
 * @param verbose - Show detailed output
 * @param optional - Whether this endpoint is optional (affects error handling)
 * @returns Doctor check result
 */
async function checkEndpoint(
  name: string,
  url: string,
  _verbose: boolean,
  optional = false
): Promise<DoctorCheck> {
  const startTime = Date.now();
  
  try {
    // Use native fetch (Node.js 18+)
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name,
        url,
        status: 'ok',
        message: 'OK',
        responseTime,
      };
    }
    
    if (response.status === 404) {
      return {
        name,
        url,
        status: optional ? 'skip' : 'error',
        message: optional ? 'Not found (optional)' : 'HTTP 404 Not Found',
        responseTime,
      };
    }
    
    return {
      name,
      url,
      status: 'error',
      message: `HTTP ${response.status} ${response.statusText}`,
      responseTime,
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    
    // Handle specific error types
    if (message.includes('fetch failed') || message.includes('ENOTFOUND')) {
      return {
        name,
        url,
        status: 'error',
        message: 'Connection failed (DNS or network error)',
        responseTime,
      };
    }
    
    if (message.includes('timeout') || message.includes('Timeout')) {
      return {
        name,
        url,
        status: 'error',
        message: 'Request timed out (10s)',
        responseTime,
      };
    }
    
    return {
      name,
      url,
      status: optional ? 'skip' : 'error',
      message: optional ? 'Not available' : `Failed: ${message}`,
      responseTime,
    };
  }
}

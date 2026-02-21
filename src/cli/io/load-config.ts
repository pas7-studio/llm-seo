/**
 * Configuration loading utilities.
 * Supports loading from TypeScript and JSON config files.
 */

import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LlmsSeoConfig } from '../../schema/config.schema.js';
import { LlmsSeoConfigSchema } from '../../schema/config.schema.js';
import { readFileSafe } from './fs.js';

/**
 * Validation issue from config parsing.
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: 'error' | 'warning';
  /** Issue code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Path to the problematic field */
  path?: string;
}

/**
 * Result of loading config.
 */
export interface LoadConfigResult {
  /** Loaded and validated config */
  config: LlmsSeoConfig;
  /** Any validation issues (warnings) */
  issues: ValidationIssue[];
  /** Resolved config file path */
  configPath: string;
}

/**
 * Options for loading config.
 */
export interface LoadConfigOptions {
  /** Path to config file */
  path: string;
}

/**
 * Default config file names to search.
 */
export const CONFIG_FILE_NAMES = [
  'llm-seo.config.ts',
  'llm-seo.config.js',
  'llm-seo.config.json',
] as const;

/**
 * Finds config file in common locations.
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Path to found config file, or null if not found
 */
export function findConfigFile(cwd: string = process.cwd()): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = resolve(cwd, fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Gets the file extension and determines if it's a TypeScript file.
 */
function getConfigFileType(filePath: string): 'ts' | 'js' | 'json' {
  const ext = extname(filePath);
  if (ext === '.ts') return 'ts';
  if (ext === '.js') return 'js';
  return 'json';
}

/**
 * Loads a TypeScript or JavaScript config file using dynamic import.
 * @param configPath - Path to the config file
 * @returns The default export from the module
 */
async function importConfigModule<T>(configPath: string): Promise<T> {
  const absolutePath = resolve(configPath);
  const fileUrl = pathToFileURL(absolutePath).href;
  
  // Dynamic import for ESM
  const module = await import(fileUrl);
  
  // Support default export
  const config = module.default ?? module;
  
  return config as T;
}

/**
 * Parses and validates a raw config object.
 * @param rawConfig - Raw config object
 * @param configPath - Path to config file for error messages
 * @returns Validated config and any issues
 */
function parseConfig(
  rawConfig: unknown,
  configPath: string
): { config: LlmsSeoConfig; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  
  // Parse with Zod
  const result = LlmsSeoConfigSchema.safeParse(rawConfig);
  
  if (!result.success) {
    // Convert Zod errors to ValidationIssues
    const errorMessages = result.error.issues.map((e) => {
      const path = e.path.join('.');
      return `${path}: ${e.message}`;
    }).join('; ');
    
    throw new Error(`Invalid config at ${configPath}: ${errorMessages}`);
  }
  
  return { config: result.data, issues };
}

/**
 * Loads config from a file path.
 * Supports TypeScript (.ts), JavaScript (.js), and JSON (.json) files.
 * @param options - Load options with path
 * @returns Loaded and validated config with any issues
 */
export async function loadConfig(options: LoadConfigOptions): Promise<LoadConfigResult> {
  const { path: configPath } = options;
  const absolutePath = resolve(configPath);
  
  // Check if file exists
  if (!existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }
  
  const fileType = getConfigFileType(absolutePath);
  let rawConfig: unknown;
  
  if (fileType === 'json') {
    // Load JSON file
    const content = await readFileSafe(absolutePath);
    if (content === null) {
      throw new Error(`Failed to read config file: ${absolutePath}`);
    }
    try {
      rawConfig = JSON.parse(content);
    } catch {
      throw new Error(`Failed to parse JSON config: ${absolutePath}`);
    }
  } else {
    // Load TS/JS module via dynamic import
    try {
      rawConfig = await importConfigModule<unknown>(absolutePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to import config module: ${absolutePath}\n${message}`);
    }
  }
  
  // Validate config
  const { config, issues } = parseConfig(rawConfig, absolutePath);
  
  return {
    config,
    issues,
    configPath: absolutePath,
  };
}

/**
 * Loads config with fallback to searching common locations.
 * @param configPath - Optional explicit path to config file
 * @param cwd - Current working directory
 * @returns Loaded config result
 */
export async function loadConfigWithDefaults(
  configPath: string | undefined,
  cwd: string = process.cwd()
): Promise<LoadConfigResult> {
  if (configPath) {
    return loadConfig({ path: configPath });
  }
  
  const foundPath = findConfigFile(cwd);
  
  if (foundPath) {
    return loadConfig({ path: foundPath });
  }
  
  throw new Error(
    `No config file found. Searched for: ${CONFIG_FILE_NAMES.join(', ')}\n` +
    'Create a config file or specify one with --config option.'
  );
}

/**
 * Validates that required config fields are present for a command.
 * @param config - Config to validate
 * @param command - Command name (for error messages)
 * @returns Array of validation issues
 */
export function validateConfigForCommand(
  config: LlmsSeoConfig,
  _command: 'generate' | 'check' | 'doctor'
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check for required site config
  if (!config.site.baseUrl) {
    issues.push({
      severity: 'error',
      code: 'missing_base_url',
      message: 'site.baseUrl is required',
      path: 'site.baseUrl',
    });
  }
  
  // Check for required brand config
  if (!config.brand.name) {
    issues.push({
      severity: 'error',
      code: 'missing_brand_name',
      message: 'brand.name is required',
      path: 'brand.name',
    });
  }
  
  return issues;
}

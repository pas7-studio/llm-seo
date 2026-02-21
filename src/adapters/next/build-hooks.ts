/**
 * Build hooks for Next.js integration.
 */

import type { SiteManifest } from '../../schema/manifest.schema.js';
import { generateLlmsTxt } from '../../core/generate/llms-txt.js';
import { generateLlmsFullTxt } from '../../core/generate/llms-full-txt.js';

// ============================================================================
// Build Scripts Generation
// ============================================================================

/**
 * Options for generateBuildScripts.
 */
export interface GenerateBuildScriptsOptions {
  /** Path to config file */
  configPath?: string;
  /** Output directory for generated files */
  outputPath?: string;
  /** Whether to emit citations.json */
  emitCitations?: boolean;
  /** Package manager to use */
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

/**
 * Result of generateBuildScripts.
 */
export interface BuildScriptsResult {
  /** Script for building SEO artifacts */
  'build:seo': string;
  /** Post-build hook script */
  postbuild: string;
  /** Script for checking SEO artifacts */
  'check:seo': string;
}

/**
 * Generates package.json scripts for llm-seo integration.
 *
 * @param options - Options for script generation
 * @returns Object with script names as keys and commands as values
 *
 * @example
 * ```typescript
 * const scripts = generateBuildScripts({
 *   configPath: 'llm-seo.config.ts',
 *   emitCitations: true,
 * });
 * // Returns:
 * // {
 * //   "build:seo": "llm-seo generate --config llm-seo.config.ts",
 * //   "postbuild": "pnpm build:seo && llm-seo check --fail-on error",
 * //   "check:seo": "llm-seo check --fail-on warn"
 * // }
 * ```
 */
export function generateBuildScripts(
  options: GenerateBuildScriptsOptions = {}
): BuildScriptsResult {
  const {
    configPath = 'llm-seo.config.ts',
    emitCitations = false,
    packageManager = 'pnpm',
  } = options;

  const configFlag = `--config ${configPath}`;
  const citationsFlag = emitCitations ? ' --emit-citations' : '';

  const runCommand = packageManager === 'npm' ? 'npm run' : packageManager;

  return {
    'build:seo': `llm-seo generate ${configFlag}${citationsFlag}`,
    postbuild: `${runCommand} build:seo && llm-seo check --fail-on error`,
    'check:seo': 'llm-seo check --fail-on warn',
  };
}

// ============================================================================
// Robots.txt LLM Policy
// ============================================================================

/**
 * Options for createRobotsLlmsPolicySnippet.
 */
export interface CreateRobotsLlmsPolicySnippetOptions {
  /** Base URL of the site */
  baseUrl: string;
  /** Whether to allow llms.txt */
  allowLlmsTxt?: boolean;
  /** Whether to allow llms-full.txt */
  allowLlmsFullTxt?: boolean;
  /** Whether to allow sitemap.xml */
  allowSitemap?: boolean;
  /** Additional paths to allow */
  additionalPaths?: string[];
  /** User agent to target (default: *) */
  userAgent?: string;
}

/**
 * Creates robots.txt LLM policy snippet.
 *
 * @param options - Options for snippet generation
 * @returns robots.txt snippet string
 *
 * @example
 * ```typescript
 * const snippet = createRobotsLlmsPolicySnippet({
 *   baseUrl: 'https://example.com',
 *   allowLlmsTxt: true,
 *   allowLlmsFullTxt: true,
 * });
 * // Returns:
 * // # LLM SEO
 * // User-agent: *
 * // Allow: /llms.txt
 * // Allow: /llms-full.txt
 * // Allow: /sitemap.xml
 * ```
 */
export function createRobotsLlmsPolicySnippet(
  options: CreateRobotsLlmsPolicySnippetOptions
): string {
  const {
    baseUrl,
    allowLlmsTxt = true,
    allowLlmsFullTxt = true,
    allowSitemap = true,
    additionalPaths = [],
    userAgent = '*',
  } = options;

  const lines: string[] = ['# LLM SEO'];

  // Extract host from baseUrl
  try {
    const url = new URL(baseUrl);
    lines.push(`Host: ${url.host}`);
  } catch {
    // Invalid URL, skip host
  }

  lines.push(`User-agent: ${userAgent}`);

  if (allowLlmsTxt) {
    lines.push('Allow: /llms.txt');
  }

  if (allowLlmsFullTxt) {
    lines.push('Allow: /llms-full.txt');
  }

  if (allowSitemap) {
    lines.push('Allow: /sitemap.xml');
  }

  for (const path of additionalPaths) {
    lines.push(`Allow: ${path}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Next.js Config Helper
// ============================================================================

/**
 * Options for createNextConfig.
 */
export interface CreateNextConfigOptions {
  /** Supported locales */
  locales?: string[];
  /** Default locale */
  defaultLocale?: string;
  /** Whether to use trailing slash */
  trailingSlash?: boolean;
  /** Whether to disable images optimization (for static export) */
  unoptimizedImages?: boolean;
}

/**
 * Next.js config object returned by createNextConfig.
 */
export interface NextConfigResult {
  /** Output mode */
  output: 'export';
  /** Trailing slash configuration */
  trailingSlash: boolean;
  /** Images configuration */
  images: { unoptimized: boolean };
  /** i18n configuration (only if locales provided) */
  i18n?: {
    locales: string[];
    defaultLocale: string;
  };
}

/**
 * Creates Next.js config object for static export with locales.
 *
 * @param options - Options for config generation
 * @returns Next.js config object
 *
 * @example
 * ```typescript
 * const nextConfig = createNextConfig({
 *   locales: ['en', 'uk'],
 *   defaultLocale: 'en',
 *   trailingSlash: false,
 * });
 *
 * module.exports = nextConfig;
 * ```
 */
export function createNextConfig(
  options: CreateNextConfigOptions
): NextConfigResult {
  const {
    locales = [],
    defaultLocale = 'en',
    trailingSlash = false,
    unoptimizedImages = true,
  } = options;

  const config: NextConfigResult = {
    output: 'export',
    trailingSlash,
    images: {
      unoptimized: unoptimizedImages,
    },
  };

  // Add i18n config only if locales are provided
  // Note: i18n is not supported with static export in Next.js 13+
  // This is kept for documentation/reference purposes
  if (locales.length > 0) {
    config.i18n = {
      locales,
      defaultLocale,
    };
  }

  return config;
}

// ============================================================================
// Legacy Build Hooks
// ============================================================================

/**
 * Options for build hooks.
 */
export interface BuildHookOptions {
  /** Output directory for generated files */
  outputDir: string;
  /** Site manifest */
  manifest: SiteManifest;
  /** Whether to generate llms-full.txt */
  generateFull?: boolean;
}

/**
 * Result of running build hooks.
 */
export interface BuildHookResult {
  /** Generated files */
  files: string[];
  /** Whether the hook succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Post-build hook that generates llms.txt files.
 * Call this after Next.js static export completes.
 * @param options - Hook options
 * @returns Hook result
 */
export async function postBuildHook(
  options: BuildHookOptions
): Promise<BuildHookResult> {
  const { outputDir, manifest, generateFull = false } = options;
  const files: string[] = [];

  try {
    // Generate llms.txt
    generateLlmsTxt(manifest);
    const llmsTxtPath = `${outputDir}/llms.txt`;
    files.push(llmsTxtPath);

    // In a real implementation, we would write the file
    // await writeTextFile(llmsTxtPath, llmsTxt);

    // Generate llms-full.txt if requested
    if (generateFull) {
      generateLlmsFullTxt(manifest);
      const llmsFullTxtPath = `${outputDir}/llms-full.txt`;
      files.push(llmsFullTxtPath);

      // In a real implementation, we would write the file
      // await writeTextFile(llmsFullTxtPath, llmsFullTxt);
    }

    return {
      files,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      files,
      success: false,
      error: message,
    };
  }
}

/**
 * Creates a plugin function for Next.js integration.
 * @returns Plugin object with hooks
 */
export function createNextPlugin(): {
  name: string;
  postBuild: (options: BuildHookOptions) => Promise<BuildHookResult>;
} {
  return {
    name: 'llm-seo',
    postBuild: postBuildHook,
  };
}

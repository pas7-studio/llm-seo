/**
 * Core module barrel export.
 * Re-exports all core functionality for llm-seo.
 */

// Normalize utilities
export { normalizeUrl, sortUrls } from './normalize/url.js';
export { compareStrings, sortStrings, sortBy, type Comparator } from './normalize/sort.js';
export { normalizeWhitespace, normalizeLineEndings, normalizeLineWhitespace, normalizeSeoText } from './normalize/text.js';

// Canonical utilities
export {
  generateCanonicalUrl,
  extractCanonicalUrls,
  createCanonicalUrlsFromManifest,
  createCanonicalUrlForItem,
  dedupeUrls,
  type CreateCanonicalUrlsOptions,
  type RouteStyle,
  type CanonicalPathnameArgs,
  type CanonicalPathnameFor,
  type LocaleStrategy,
  type TrailingSlashPolicy,
  type CanonicalOptions,
} from './canonical/canonical-from-manifest.js';
export {
  resolveManifestSections,
  createCanonicalBundleFromConfig,
  type ResolvedManifestSection,
  type CanonicalManifestEntry,
  type CanonicalManifestBundle,
} from './canonical/config-manifests.js';
export {
  localizePath,
  extractLocaleFromPath,
  generateAlternateUrls,
  type LocaleConfig,
} from './canonical/locale.js';

// Generate utilities - llms.txt
export {
  createLlmsTxt,
  generateLlmsTxt,
  type CreateLlmsTxtOptions,
  type CreateLlmsTxtResult,
  type LlmsTxtOptions,
} from './generate/llms-txt.js';

// Generate utilities - llms-full.txt
export {
  createLlmsFullTxt,
  generateLlmsFullTxt,
  generatePageContent,
  type CreateLlmsFullTxtOptions,
  type CreateLlmsFullTxtResult,
  type LlmsFullTxtOptions,
} from './generate/llms-full-txt.js';

// Generate utilities - citations
export {
  createCitationsJson,
  createCitationsJsonString,
  createCitation,
  citationToMarkdown,
  citationToJsonLd,
  generateReferenceList,
  type CitationSource,
  type CitationsSite,
  type CitationsPolicy,
  type CitationsJson,
  type CreateCitationsJsonOptions,
  type Citation,
} from './generate/citations.js';

// Check utilities
export {
  checkManifest,
  checkGeneratedFiles,
  checkFilesAgainstExpected,
  compareContent,
  readFileContent,
  checkFileExists,
  DEFAULT_CHECKER_CONFIG,
  type CheckerConfig,
  type CheckerResult,
  type CheckOptions,
  type CheckResult,
  type CompareResult,
} from './check/checker.js';
export {
  createIssue,
  groupBySeverity,
  groupByPage,
  filterBySeverity,
  type Issue,
  type IssueSeverity,
  type IssueCategory,
} from './check/issues.js';
export {
  lintContent,
  LINT_RULES,
  type LintRule,
  type LintResult,
} from './check/rules-linter.js';

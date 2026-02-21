/**
 * Next.js adapter module barrel export.
 */

// New manifest helpers
export {
  fromNextContentManifest,
  createSectionManifest,
  fromManifestArray,
  fromRouteManifest,
  applySectionCanonicalOverrides,
  createManifestFromPagesDir,
  createManifestFromData,
  type NextContentManifest,
  type FromNextContentManifestOptions,
  type CreateSectionManifestOptions,
  type ManifestArrayMapping,
  type SectionOptions,
  type RouteManifestInputItem,
  type FromRouteManifestOptions,
  type ApplySectionCanonicalOverridesOptions,
  type SectionFieldMapper,
  type CreateManifestFromPagesDirOptions,
  type CreateManifestFromDataOptions,
} from './manifest.js';

// Legacy manifest functions
export {
  extractPagePaths,
  generateNextManifest,
  type NextManifestOptions,
} from './manifest.js';

// New build hooks
export {
  generateBuildScripts,
  createRobotsLlmsPolicySnippet,
  createNextConfig,
  type GenerateBuildScriptsOptions,
  type BuildScriptsResult,
  type CreateRobotsLlmsPolicySnippetOptions,
  type CreateNextConfigOptions,
  type NextConfigResult,
} from './build-hooks.js';

// Legacy build hooks
export {
  postBuildHook,
  createNextPlugin,
  type BuildHookOptions,
  type BuildHookResult,
} from './build-hooks.js';

/**
 * Tests for checker module.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  getExitCodeFromIssues,
  ExitCodes,
} from '../src/cli/exit-codes.js';
import {
  createCheckIssue,
  countSeverities,
  formatCheckIssue,
  formatCheckIssues,
  type CheckIssue,
  type IssueSeverity,
} from '../src/core/check/issues.js';
import {
  checkGeneratedFiles,
  compareContent,
  checkFileExists,
  readFileContent,
  checkFilesAgainstExpected,
  type CheckOptions,
} from '../src/core/check/checker.js';
import {
  checkForbiddenTerms,
  checkEmptySections,
  checkDuplicateUrls,
  lintContent,
  LINT_RULES,
} from '../src/core/check/rules-linter.js';
import type { LlmsSeoConfig } from '../src/schema/config.schema.js';

/**
 * Creates a valid config for testing.
 */
function createTestConfig(overrides: Partial<LlmsSeoConfig> = {}): LlmsSeoConfig {
  return {
    site: {
      baseUrl: 'https://example.com',
    },
    brand: {
      name: 'Test Brand',
      locales: ['en'],
    },
    output: {
      paths: {
        llmsTxt: 'llms.txt',
        llmsFullTxt: 'llms-full.txt',
      },
    },
    ...overrides,
  } as LlmsSeoConfig;
}

/**
 * Creates a temporary directory for testing.
 */
async function createTempDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'llm-seo-test-'));
}

describe('Exit Codes', () => {
  describe('getExitCodeFromIssues', () => {
    it('should return OK (0) for all info issues', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('info', 'empty_section', 'Empty section', 'test.txt'),
        createCheckIssue('info', 'trailing-whitespace', 'Trailing whitespace', 'test.txt'),
      ];

      expect(getExitCodeFromIssues(issues, 'error')).toBe(ExitCodes.OK);
    });

    it('should return OK (0) for warning + info with failOn="error"', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('warning', 'forbidden_term', 'Forbidden term', 'test.txt'),
        createCheckIssue('info', 'empty_section', 'Empty section', 'test.txt'),
      ];

      expect(getExitCodeFromIssues(issues, 'error')).toBe(ExitCodes.OK);
    });

    it('should return WARN (1) for warning + info with failOn="warn"', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('warning', 'forbidden_term', 'Forbidden term', 'test.txt'),
        createCheckIssue('info', 'empty_section', 'Empty section', 'test.txt'),
      ];

      expect(getExitCodeFromIssues(issues, 'warn')).toBe(ExitCodes.WARN);
    });

    it('should return ERROR (2) for any error', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('error', 'file_missing', 'File missing', 'test.txt'),
      ];

      expect(getExitCodeFromIssues(issues, 'error')).toBe(ExitCodes.ERROR);
    });

    it('should return ERROR (2) even with failOn="warn" for errors', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('error', 'file_mismatch', 'File mismatch', 'test.txt'),
        createCheckIssue('warning', 'forbidden_term', 'Forbidden term', 'test.txt'),
      ];

      expect(getExitCodeFromIssues(issues, 'warn')).toBe(ExitCodes.ERROR);
    });

    it('should return OK (0) for empty issues array', () => {
      const issues: CheckIssue[] = [];

      expect(getExitCodeFromIssues(issues, 'error')).toBe(ExitCodes.OK);
      expect(getExitCodeFromIssues(issues, 'warn')).toBe(ExitCodes.OK);
    });
  });
});

describe('Content Comparison', () => {
  describe('compareContent', () => {
    it('should return match: true for identical content', () => {
      const content = '# Test\n\nSome content\n';
      const result = compareContent(content, content);

      expect(result.match).toBe(true);
      expect(result.context).toBe('');
    });

    it('should return match: false for different content', () => {
      const expected = '# Test\n\nLine 1\nLine 2\n';
      const actual = '# Test\n\nLine 1\nDifferent line\n';

      const result = compareContent(expected, actual);

      expect(result.match).toBe(false);
      // Lines: 1=# Test, 2='', 3='Line 1', 4='Line 2' vs 'Different line'
      expect(result.context).toContain('Expected line 4');
      expect(result.context).toContain('Actual line 4');
    });

    it('should return context for content with different line counts', () => {
      const expected = '# Test\n\nContent\n';
      const actual = '# Test\n\n';

      const result = compareContent(expected, actual);

      expect(result.match).toBe(false);
      expect(result.context).toContain('Expected line 3');
    });

    it('should limit context to maxContextLines', () => {
      const expected = 'A\nB\nC\nD\nE\nF\n';
      const actual = 'A\nX\nY\nZ\nW\nV\n';

      const result = compareContent(expected, actual, 2);

      expect(result.match).toBe(false);
      const contextLines = result.context.split('\n');
      // Should have at most 4 lines (2 differences * 2 lines each)
      expect(contextLines.length).toBeLessThanOrEqual(4);
    });
  });
});

describe('File Operations', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('checkFileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'test content');

      const exists = await checkFileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for missing file', async () => {
      const filePath = path.join(tempDir, 'missing.txt');

      const exists = await checkFileExists(filePath);

      expect(exists).toBe(false);
    });
  });

  describe('readFileContent', () => {
    it('should read file content correctly', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      const content = '# Test Content\n\nSome text\n';
      await fs.writeFile(filePath, content);

      const result = await readFileContent(filePath);

      expect(result).toBe(content);
    });

    it('should return null for missing file', async () => {
      const filePath = path.join(tempDir, 'missing.txt');

      const result = await readFileContent(filePath);

      expect(result).toBeNull();
    });

    it('should return empty string for empty file', async () => {
      const filePath = path.join(tempDir, 'empty.txt');
      await fs.writeFile(filePath, '');

      const result = await readFileContent(filePath);

      expect(result).toBe('');
    });
  });
});

describe('Rules Linter', () => {
  describe('checkForbiddenTerms', () => {
    it('should detect forbidden term not in whitelist', () => {
      const content = 'We are the best service provider in the market.';
      const forbidden = ['best', '#1', 'guaranteed'];
      const whitelist: string[] = [];

      const issues = checkForbiddenTerms(content, forbidden, whitelist);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]?.code).toBe('forbidden_term');
      expect(issues[0]?.message).toContain('best');
    });

    it('should ignore whitelisted terms', () => {
      const content = 'We are the best service provider.';
      const forbidden = ['best'];
      const whitelist = ['best service'];

      const issues = checkForbiddenTerms(content, forbidden, whitelist);

      expect(issues.length).toBe(0);
    });

    it('should detect multiple forbidden terms', () => {
      const content = 'We are the best and #1 guaranteed provider.';
      const forbidden = ['best', '#1', 'guaranteed'];
      const whitelist: string[] = [];

      const issues = checkForbiddenTerms(content, forbidden, whitelist);

      expect(issues.length).toBe(3);
    });

    it('should be case-insensitive', () => {
      const content = 'We are the BEST provider.';
      const forbidden = ['best'];
      const whitelist: string[] = [];

      const issues = checkForbiddenTerms(content, forbidden, whitelist);

      expect(issues.length).toBe(1);
    });

    it('should include line number', () => {
      const content = 'Line 1\nLine 2\nWe are the best provider.';
      const forbidden = ['best'];
      const whitelist: string[] = [];

      const issues = checkForbiddenTerms(content, forbidden, whitelist);

      expect(issues[0]?.line).toBe(3);
    });
  });

  describe('checkEmptySections', () => {
    it('should detect empty sections', () => {
      const content = `# Main Title

## Section With Content
Some content here.

## Empty Section

## Another Section
More content.`;

      const issues = checkEmptySections(content);

      expect(issues.length).toBe(1);
      expect(issues[0]?.code).toBe('empty_section');
      expect(issues[0]?.message).toContain('Empty Section');
    });

    it('should not flag sections with content', () => {
      const content = `# Main Title

## Section 1
Content here.

## Section 2
More content.`;

      const issues = checkEmptySections(content);

      expect(issues.length).toBe(0);
    });

    it('should handle multiple empty sections', () => {
      const content = `# Title

## Empty 1

## Empty 2

## Has Content
Text here.`;

      const issues = checkEmptySections(content);

      expect(issues.length).toBe(2);
    });
  });

  describe('checkDuplicateUrls', () => {
    it('should detect duplicate URLs', () => {
      const content = `[Link 1](https://example.com/page)
[Link 2](https://example.com/other)
[Link 3](https://example.com/page)`;

      const issues = checkDuplicateUrls(content);

      expect(issues.length).toBe(1);
      expect(issues[0]?.code).toBe('duplicate_url');
      expect(issues[0]?.message).toContain('https://example.com/page');
    });

    it('should not flag unique URLs', () => {
      const content = `[Link 1](https://example.com/page1)
[Link 2](https://example.com/page2)`;

      const issues = checkDuplicateUrls(content);

      expect(issues.length).toBe(0);
    });

    it('should include first occurrence line in message', () => {
      const content = `[Link 1](https://example.com/page)
[Link 2](https://example.com/page)`;

      const issues = checkDuplicateUrls(content);

      expect(issues[0]?.message).toContain('line 1');
    });
  });

  describe('lintContent', () => {
    it('should run all enabled rules', () => {
      const content = `# Title

## Section
Content with trailing space 

- Item 1
* Item 2`;

      const result = lintContent(content, 'test.txt');

      expect(result.passed).toBe(true); // Only warnings/info
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect heading skips', () => {
      const content = `# H1

### H3 (skipped h2)`;

      const result = lintContent(content, 'test.txt');

      expect(result.issues.some((i) => i.id === 'heading-skip')).toBe(true);
    });

    it('should detect invalid URLs', () => {
      const content = `[Link](not-a-valid-url)`;

      const result = lintContent(content, 'test.txt');

      expect(result.issues.some((i) => i.id === 'invalid-url')).toBe(true);
    });
  });
});

describe('Issues Utilities', () => {
  describe('createCheckIssue', () => {
    it('should create issue with all fields', () => {
      const issue = createCheckIssue(
        'error',
        'file_missing',
        'File not found',
        '/path/to/file.txt',
        'Some context'
      );

      expect(issue.severity).toBe('error');
      expect(issue.code).toBe('file_missing');
      expect(issue.message).toBe('File not found');
      expect(issue.path).toBe('/path/to/file.txt');
      expect(issue.context).toBe('Some context');
    });

    it('should create issue with minimal fields', () => {
      const issue = createCheckIssue('warning', 'empty_section', 'Empty section');

      expect(issue.severity).toBe('warning');
      expect(issue.code).toBe('empty_section');
      expect(issue.path).toBe('');
    });
  });

  describe('countSeverities', () => {
    it('should count issues by severity', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('error', 'file_missing', 'Error 1'),
        createCheckIssue('error', 'file_mismatch', 'Error 2'),
        createCheckIssue('warning', 'forbidden_term', 'Warning 1'),
        createCheckIssue('info', 'empty_section', 'Info 1'),
        createCheckIssue('info', 'trailing-whitespace', 'Info 2'),
      ];

      const counts = countSeverities(issues);

      expect(counts.error).toBe(2);
      expect(counts.warning).toBe(1);
      expect(counts.info).toBe(2);
    });

    it('should return zeros for empty array', () => {
      const counts = countSeverities([]);

      expect(counts.error).toBe(0);
      expect(counts.warning).toBe(0);
      expect(counts.info).toBe(0);
    });
  });

  describe('formatCheckIssue', () => {
    it('should format issue correctly', () => {
      const issue = createCheckIssue(
        'error',
        'file_missing',
        'File not found',
        '/path/to/file.txt'
      );

      const formatted = formatCheckIssue(issue);

      expect(formatted).toContain('Error: file_missing');
      expect(formatted).toContain('File: /path/to/file.txt');
      expect(formatted).toContain('Message: File not found');
    });

    it('should include line number when present', () => {
      const issue: CheckIssue = {
        path: 'test.txt',
        code: 'forbidden_term',
        message: 'Forbidden term',
        severity: 'warning',
        line: 42,
      };

      const formatted = formatCheckIssue(issue);

      expect(formatted).toContain('Line: 42');
    });

    it('should include context when present', () => {
      const issue: CheckIssue = {
        path: 'test.txt',
        code: 'forbidden_term',
        message: 'Forbidden term',
        severity: 'warning',
        context: 'We are the best...',
      };

      const formatted = formatCheckIssue(issue);

      expect(formatted).toContain('Context: "We are the best..."');
    });
  });

  describe('formatCheckIssues', () => {
    it('should format multiple issues', () => {
      const issues: CheckIssue[] = [
        createCheckIssue('error', 'file_missing', 'Error 1', 'file1.txt'),
        createCheckIssue('warning', 'forbidden_term', 'Warning 1', 'file2.txt'),
      ];

      const formatted = formatCheckIssues(issues);

      expect(formatted).toContain('Error: file_missing');
      expect(formatted).toContain('Warning: forbidden_term');
      expect(formatted).toContain('file1.txt');
      expect(formatted).toContain('file2.txt');
    });
  });
});

describe('Integration - checkGeneratedFiles', () => {
  let tempDir: string;
  let config: LlmsSeoConfig;

  beforeEach(async () => {
    tempDir = await createTempDir();
    config = createTestConfig({
      output: {
        paths: {
          llmsTxt: path.join(tempDir, 'llms.txt'),
          llmsFullTxt: path.join(tempDir, 'llms-full.txt'),
        },
      },
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return OK for valid files', async () => {
    // Create valid files
    await fs.writeFile(config.output.paths.llmsTxt, '# Test\n\nValid content\n');
    await fs.writeFile(config.output.paths.llmsFullTxt, '# Test\n\nValid full content\n');

    const options: CheckOptions = {
      config,
      failOn: 'error',
    };

    const result = await checkGeneratedFiles(options);

    expect(result.summary.filesChecked).toBe(2);
    expect(result.summary.filesMissing).toBe(0);
    expect(result.exitCode).toBe(ExitCodes.OK);
  });

  it('should return ERROR for missing files', async () => {
    // Don't create any files

    const options: CheckOptions = {
      config,
      failOn: 'error',
    };

    const result = await checkGeneratedFiles(options);

    expect(result.summary.filesMissing).toBe(2);
    expect(result.summary.filesChecked).toBe(0);
    expect(result.exitCode).toBe(ExitCodes.ERROR);
    expect(result.issues.some((i) => i.code === 'file_missing')).toBe(true);
  });

  it('should return WARNING for empty files', async () => {
    await fs.writeFile(config.output.paths.llmsTxt, '');
    await fs.writeFile(config.output.paths.llmsFullTxt, '');

    const options: CheckOptions = {
      config,
      failOn: 'warn',
    };

    const result = await checkGeneratedFiles(options);

    expect(result.summary.filesChecked).toBe(2);
    expect(result.issues.some((i) => i.code === 'file_empty')).toBe(true);
    expect(result.exitCode).toBe(ExitCodes.WARN);
  });

  it('should detect policy violations', async () => {
    const configWithPolicy = createTestConfig({
      output: {
        paths: {
          llmsTxt: path.join(tempDir, 'llms.txt'),
          llmsFullTxt: path.join(tempDir, 'llms-full.txt'),
        },
      },
      policy: {
        restrictedClaims: {
          enable: true,
          forbidden: ['best', 'guaranteed'],
          whitelist: [],
        },
      },
    });

    await fs.writeFile(
      configWithPolicy.output.paths.llmsTxt,
      '# Test\n\nWe are the best!\n'
    );
    await fs.writeFile(configWithPolicy.output.paths.llmsFullTxt, '# Full\n\nContent\n');

    const options: CheckOptions = {
      config: configWithPolicy,
      failOn: 'warn',
    };

    const result = await checkGeneratedFiles(options);

    expect(result.issues.some((i) => i.code === 'forbidden_term')).toBe(true);
    expect(result.exitCode).toBe(ExitCodes.WARN);
  });
});

describe('Integration - checkFilesAgainstExpected', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return empty issues for matching content', async () => {
    const expected = '# Test\n\nContent here\n';
    const actual = expected;

    const llmsTxtPath = path.join(tempDir, 'llms.txt');
    const llmsFullTxtPath = path.join(tempDir, 'llms-full.txt');

    await fs.writeFile(llmsTxtPath, actual);
    await fs.writeFile(llmsFullTxtPath, actual);

    const issues = await checkFilesAgainstExpected(
      llmsTxtPath,
      expected,
      llmsFullTxtPath,
      expected
    );

    expect(issues.length).toBe(0);
  });

  it('should detect missing file', async () => {
    const expected = '# Test\n\nContent\n';
    const llmsTxtPath = path.join(tempDir, 'llms.txt');
    const llmsFullTxtPath = path.join(tempDir, 'llms-full.txt');

    // Only create llms.txt
    await fs.writeFile(llmsTxtPath, expected);

    const issues = await checkFilesAgainstExpected(
      llmsTxtPath,
      expected,
      llmsFullTxtPath,
      expected
    );

    expect(issues.some((i) => i.code === 'file_missing')).toBe(true);
  });

  it('should detect content mismatch with context', async () => {
    const expectedLlmsTxt = '# Test\n\n## Section 1\nContent A\n';
    const actualLlmsTxt = '# Test\n\n## Section 1\nContent B\n';

    const llmsTxtPath = path.join(tempDir, 'llms.txt');
    const llmsFullTxtPath = path.join(tempDir, 'llms-full.txt');

    await fs.writeFile(llmsTxtPath, actualLlmsTxt);
    await fs.writeFile(llmsFullTxtPath, expectedLlmsTxt);

    const issues = await checkFilesAgainstExpected(
      llmsTxtPath,
      expectedLlmsTxt,
      llmsFullTxtPath,
      expectedLlmsTxt
    );

    const mismatchIssue = issues.find((i) => i.code === 'file_mismatch');
    expect(mismatchIssue).toBeDefined();
    expect(mismatchIssue?.context).toBeDefined();
    expect(mismatchIssue?.context).toContain('Expected');
    expect(mismatchIssue?.context).toContain('Actual');
  });

  it('should detect empty file', async () => {
    const expected = '# Test\n\nContent\n';

    const llmsTxtPath = path.join(tempDir, 'llms.txt');
    const llmsFullTxtPath = path.join(tempDir, 'llms-full.txt');

    await fs.writeFile(llmsTxtPath, '');
    await fs.writeFile(llmsFullTxtPath, expected);

    const issues = await checkFilesAgainstExpected(
      llmsTxtPath,
      expected,
      llmsFullTxtPath,
      expected
    );

    expect(issues.some((i) => i.code === 'file_empty')).toBe(true);
  });
});

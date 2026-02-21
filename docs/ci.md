# CI Integration

This document explains how to integrate `@pas7/llm-seo` into your CI/CD pipeline.

## Overview

CI integration ensures your LLM SEO artifacts are:

1. **Always up-to-date** - Generated on every build
2. **Valid** - Checked for issues before deployment
3. **Consistent** - Deterministic output matches expected

Optional hardening in CI:

```bash
npx llm-seo check --fail-on error --check-live --timeout-ms 10000 --retries 1 --emit-report .artifacts/llm-seo-report.json
```

This additionally validates that `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt` endpoints are reachable over HTTP and emits a JSON report.

## Recommended Pipeline

```bash
llm-seo generate --config llm-seo.config.ts
next build
nextjs-sitemap-hreflang check --fail-on-missing --prefer out
llm-seo check --config llm-seo.config.ts --check-live --emit-report .artifacts/llm-seo-report.json
```

## Unified Report Contract

`llm-seo check --emit-report` writes:

- `status`
- `issues`
- `summary`
- `files`

## Monorepo Workflow (Both Packages)

```yaml
name: seo-pipeline

on:
  pull_request:
  push:
    branches: [main]

jobs:
  seo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm -C apps/site llm-seo generate --config llm-seo.config.ts
      - run: pnpm -C apps/site next build
      - run: pnpm -C apps/site nextjs-sitemap-hreflang check --fail-on-missing --prefer out
      - run: pnpm -C apps/site llm-seo check --config llm-seo.config.ts --check-live --emit-report .artifacts/llm-seo-report.json
```

## GitHub Actions

### Basic Setup

Create `.github/workflows/llm-seo.yml`:

```yaml
name: LLM SEO

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  generate-and-check:
    name: Generate & Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate LLM SEO artifacts
        run: npx llm-seo generate

      - name: Check generated files
        run: npx llm-seo check --fail-on error
```

### Combined CI Workflow

Add to your existing `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Generate LLM SEO artifacts
        run: npx llm-seo generate

      - name: Check LLM SEO
        run: npx llm-seo check --fail-on error

      - name: Verify CLI works
        run: |
          node dist/cli/bin.js --help
          node dist/cli/bin.js --version
```

### With Caching

Optimize with artifact caching:

```yaml
- name: Cache LLM SEO artifacts
  uses: actions/cache@v4
  with:
    path: |
      public/llms.txt
      public/llms-full.txt
    key: llm-seo-${{ hashFiles('llm-seo.config.ts', 'manifests/**') }}
    restore-keys: |
      llm-seo-
```

### Deploy with Artifacts

Generate before deployment:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
        
      - name: Generate LLM SEO artifacts
        run: npx llm-seo generate --emit-citations
        
      - name: Deploy
        run: |
          # Your deployment command
          # Artifacts are in public/llms.txt, public/llms-full.txt
```

## Exit Codes

The CLI uses specific exit codes for CI integration:

| Code | Name | Description |
|------|------|-------------|
| 0 | OK | Operation completed successfully |
| 1 | WARN | Warnings returned when `--fail-on warn` is enabled |
| 2 | ERROR | Validation/check failures |
| 3 | NETWORK_ERROR | Network/availability failure (doctor/live checks) |

### Using Exit Codes

```yaml
- name: Check LLM SEO
  id: llm-seo-check
  run: npx llm-seo check --fail-on error
  continue-on-error: true

- name: Report issues
  if: steps.llm-seo-check.outcome == 'failure'
  run: |
    echo "LLM SEO check failed with exit code ${{ steps.llm-seo-check.outputs.exit-code }}"
    # Add notification logic
```

## Fail Levels

### `--fail-on error` (default)

Only fail on errors:

```bash
npx llm-seo check --fail-on error
```

- Errors: ❌ Fail
- Warnings: ✅ Pass
- Info: ✅ Pass

### `--fail-on warn`

Fail on warnings and errors:

```bash
npx llm-seo check --fail-on warn
```

- Errors: ❌ Fail
- Warnings: ❌ Fail
- Info: ✅ Pass

## Verbose Output

Enable verbose output for debugging:

```yaml
- name: Check LLM SEO (verbose)
  run: npx llm-seo check --fail-on error -v
```

## Pull Request Checks

### PR Comment with Results

```yaml
name: LLM SEO PR Check

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Run check
        id: check
        run: |
          npx llm-seo generate
          OUTPUT=$(npx llm-seo check --fail-on warn -v 2>&1)
          echo "output<<EOF" >> $GITHUB_OUTPUT
          echo "$OUTPUT" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
        continue-on-error: true
        
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const output = `${{ steps.check.outputs.output }}`;
            const success = ${{ steps.check.outcome == 'success' }};
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## LLM SEO Check ${success ? '✅' : '❌'}\n\`\`\`\n${output}\n\`\`\``
            });
```

## Other CI Platforms

### GitLab CI

```yaml
# .gitlab-ci.yml
llm-seo:
  stage: test
  image: node:20
  before_script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
  script:
    - npx llm-seo generate
    - npx llm-seo check --fail-on error
  artifacts:
    paths:
      - public/llms.txt
      - public/llms-full.txt
```

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  llm-seo:
    docker:
      - image: cimg/node:20
    steps:
      - checkout
      - run:
          name: Install pnpm
          command: npm install -g pnpm
      - run:
          name: Install dependencies
          command: pnpm install --frozen-lockfile
      - run:
          name: Generate artifacts
          command: npx llm-seo generate
      - run:
          name: Check artifacts
          command: npx llm-seo check --fail-on error

workflows:
  version: 2
  ci:
    jobs:
      - llm-seo
```

### Travis CI

```yaml
# .travis.yml
language: node_js
node_js:
  - 18
  - 20

cache:
  npm: false

before_install:
  - npm install -g pnpm

install:
  - pnpm install --frozen-lockfile

script:
  - pnpm build
  - npx llm-seo generate
  - npx llm-seo check --fail-on error
```

## Best Practices

### 1. Run on All PRs

Ensure artifacts are checked before merging:

```yaml
on:
  pull_request:
    branches: [main]
```

### 2. Fail Fast

Use `--fail-on error` in CI to catch issues early:

```bash
npx llm-seo check --fail-on error
```

### 3. Generate Before Deploy

Always generate fresh artifacts during deployment:

```yaml
- name: Generate LLM SEO
  run: npx llm-seo generate --emit-citations
```

### 4. Cache Dependencies

Speed up CI with dependency caching:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'
```

### 5. Matrix Testing

Test across Node.js versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20]
```

## Troubleshooting

### Config Not Found

```
Error: Config file not found: llm-seo.config.ts
```

Solution: Ensure config file exists in working directory or specify path:

```bash
npx llm-seo generate -c ./path/to/config.ts
```

### Validation Errors

```
Error: Invalid configuration
  - site.baseUrl: Must be a valid URL
```

Solution: Fix config errors before running CI.

### Permission Denied

```
Error: EACCES: permission denied, open 'public/llms.txt'
```

Solution: Ensure output directory exists and is writable:

```yaml
- run: mkdir -p public
- run: npx llm-seo generate
```

## Related

- [Config Reference](./config.md) - Configuration options
- [Next.js Integration](./nextjs.md) - Next.js setup
- [CLI Reference](../README.md#cli-reference) - CLI commands

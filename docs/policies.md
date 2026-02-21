# Content Policies

This document explains content policies in `@pas7/llm-seo`, including geographic policies, citation rules, and restricted claims linting.

## Overview

Content policies help ensure your LLM SEO artifacts are:

1. **Compliant** - No misleading claims
2. **Consistent** - Standardized citation format
3. **Transparent** - Clear geographic availability

## Geographic Policy

### What is Geo Policy?

A statement about where your business operates. This helps LLMs understand your service area and provide accurate recommendations.

### Configuration

```typescript
policy: {
  geoPolicy: 'We operate globally, serving clients in Europe, North America, and Asia.';
}
```

### Examples

**Global Business:**

```typescript
geoPolicy: 'We operate globally, serving clients worldwide.';
```

**Regional Business:**

```typescript
geoPolicy: 'We serve customers in the European Union and United Kingdom.';
```

**Local Business:**

```typescript
geoPolicy: 'We provide services in New York City and surrounding areas.';
```

**With Restrictions:**

```typescript
geoPolicy: 'Available worldwide except for countries subject to US sanctions.';
```

### Output

In `llms.txt`:

```txt
## Policies

- Geo: We operate globally, serving clients in Europe, North America, and Asia.
```

## Citation Rules

### What are Citation Rules?

Guidelines for how others should cite your content. This helps maintain attribution and link integrity.

### Configuration

```typescript
policy: {
  citationRules: 'Prefer canonical URLs when citing. Avoid UTM parameters in citations.';
}
```

### Examples

**Standard Citation:**

```typescript
citationRules: 'Please cite using the canonical URL. Do not modify URLs with tracking parameters.';
```

**Academic Style:**

```typescript
citationRules: 'For academic citations, use APA format with canonical URL as source.';
```

**With Attribution:**

```typescript
citationRules: 'Cite with attribution to [Brand Name]. Link to original article when possible.';
```

### Output

In `llms.txt`:

```txt
## Policies

- Citation: Prefer canonical URLs when citing. Avoid UTM parameters in citations.
```

In `citations.json`:

```json
{
  "policy": {
    "citationRules": "Prefer canonical URLs when citing."
  }
}
```

## Restricted Claims

### What are Restricted Claims?

A linting feature that flags potentially problematic marketing language in your content.

### Why Restrict Claims?

1. **Legal Compliance** - Avoid false advertising issues
2. **Trust** - Build credibility with honest claims
3. **SEO** - Some search engines penalize exaggerated claims
4. **LLM Accuracy** - Help LLMs provide accurate information

### Configuration

```typescript
policy: {
  restrictedClaims: {
    enable: true,
    forbidden: ['best', '#1', 'guaranteed', 'cheapest'],
    whitelist: ['best practices'],
  },
}
```

### Forbidden Words

Common words to restrict:

| Word | Reason | Alternative |
|------|--------|-------------|
| `best` | Subjective, unverifiable | "highly-rated", "trusted" |
| `#1` | Requires proof | "leading", "established" |
| `guaranteed` | Legal implications | "we stand behind", "committed to" |
| `cheapest` | Price comparison issues | "competitive pricing", "value-focused" |
| `revolutionary` | Overused, vague | "innovative", "modern" |
| `amazing` | Subjective | "effective", "proven" |
| ` miracle` | Misleading | "effective solution" |

### Whitelist

Allow specific phrases even if they contain forbidden words:

```typescript
whitelist: [
  'best practices',
  'industry best practices',
  'world-class team',
],
```

### Examples

**Content Linting:**

```typescript
// Input content
const content = 'We are the best company with guaranteed results.';

// Lint result
{
  issues: [
    {
      word: 'best',
      context: 'We are the best company',
      suggestion: 'Consider a more specific claim',
      severity: 'warn'
    },
    {
      word: 'guaranteed',
      context: 'with guaranteed results',
      suggestion: 'May have legal implications',
      severity: 'warn'
    }
  ]
}
```

**With Whitelist:**

```typescript
// Content
const content = 'We follow industry best practices.';

// Config
whitelist: ['best practices']

// Result: No issues (whitelisted)
```

## Running Policy Checks

### CLI

```bash
# Check with policy enforcement
npx llm-seo check --fail-on warn

# Only fail on errors
npx llm-seo check --fail-on error
```

### Programmatic

```typescript
import { checkManifest, lintContent } from '@pas7/llm-seo';

// Check manifest
const result = checkManifest(manifest, config);

// Lint content directly
const lintResult = lintContent(content, {
  forbidden: ['best', 'guaranteed'],
  whitelist: ['best practices'],
});

if (lintResult.issues.length > 0) {
  console.log('Found issues:', lintResult.issues);
}
```

## Severity Levels

| Level | Description | Default Action |
|-------|-------------|----------------|
| `error` | Critical policy violation | Fail check |
| `warn` | Potential issue | Warning only |
| `info` | Informational | Log only |

### Configuration

```typescript
policy: {
  restrictedClaims: {
    enable: true,
    forbidden: [
      { word: 'guaranteed', severity: 'error' },
      { word: 'best', severity: 'warn' },
    ],
    whitelist: ['best practices'],
  },
}
```

## Best Practices

### 1. Start with Warnings

Begin with warning-level enforcement:

```typescript
restrictedClaims: {
  enable: true,
  forbidden: ['best', 'guaranteed'],
}
```

Review issues, then escalate to errors.

### 2. Build a Whitelist

Collect legitimate phrases during content review:

```typescript
whitelist: [
  'best practices',
  'award-winning team',
  'industry-leading',
],
```

### 3. Document Exceptions

Add comments explaining whitelist entries:

```typescript
whitelist: [
  'best practices',      // Industry standard term
  'best-in-class',       // Gartner category
],
```

### 4. Regular Review

Review and update restricted claims periodically:

- Add new problematic terms found in content
- Remove terms that no longer apply
- Update whitelist as needed

### 5. CI Integration

Add policy checks to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Check LLM SEO
  run: npx llm-seo check --fail-on warn
```

## Example Configuration

Complete policy configuration:

```typescript
policy: {
  // Geographic availability
  geoPolicy: 'We operate globally, serving clients in Europe, North America, and Asia. Some services may not be available in all regions.',
  
  // How to cite our content
  citationRules: 'Prefer canonical URLs when citing. Avoid UTM parameters. Include publication date when available.',
  
  // Restricted claims configuration
  restrictedClaims: {
    enable: true,
    forbidden: [
      'best',
      '#1',
      'guaranteed',
      'cheapest',
      'revolutionary',
      'miracle',
      'amazing results',
    ],
    whitelist: [
      'best practices',
      'award-winning',
      'industry-leading',
    ],
  },
}
```

## Related

- [Config Reference](./config.md) - Full configuration options
- [CI Integration](./ci.md) - GitHub Actions setup
- [Format Reference](./format.md) - Output formats

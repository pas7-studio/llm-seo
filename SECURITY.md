# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of @pas7/llm-seo seriously. If you have discovered a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **GitHub Security Advisories** (preferred):
   - Go to [Security Advisories](https://github.com/pas7studio/llm-seo/security/advisories/new)
   - Click "Report a vulnerability"
   - Fill in the details

2. **Email**:
   - Send an email to: security@pas7.studio
   - Subject: `[SECURITY] llm-seo vulnerability report`

### What to Include

Please include the following information:

- Type of vulnerability (e.g., injection, XSS, DoS)
- Full paths of source file(s) related to the vulnerability
- Steps to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Any possible mitigations

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 5 business days
- **Fix Development**: Depends on severity
  - Critical: 1-3 days
  - High: 3-7 days
  - Medium: 7-14 days
  - Low: Next release
- **Disclosure**: After fix is released

### Disclosure Policy

- We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure)
- We ask that you give us reasonable time to fix the issue before public disclosure
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using @pas7/llm-seo, follow these security practices:

### Configuration Security

- **Don't commit sensitive data**: Use environment variables for URLs that might contain sensitive info
- **Validate config files**: Run `npx llm-seo check` before deploying

```typescript
// Good - use environment variables
site: {
  baseUrl: process.env.SITE_URL || 'https://example.com',
}

// Avoid - hardcoded sensitive URLs
site: {
  baseUrl: 'https://internal.company-name-internal.com',
}
```

### Content Security

- **Review manifest content**: Ensure no sensitive data is included in manifests
- **Check generated files**: Verify `llms.txt` and `llms-full.txt` before deployment
- **Validate external links**: Ensure linked URLs are safe

### CI/CD Security

- **Limit token permissions**: Use minimal required permissions in CI
- **Pin dependency versions**: Lock dependencies to prevent supply chain attacks
- **Scan dependencies**: Use tools like `pnpm audit` or Dependabot

```yaml
# Example: Minimal CI permissions
permissions:
  contents: read
```

## Known Security Considerations

### This Package

@pas7/llm-seo is a build-time tool that:

- Reads configuration files from your project
- Generates static text files
- Does not execute user-provided code
- Does not make network requests during generation

### Potential Risks

1. **Information Disclosure**: Generated files may expose site structure
   - Mitigation: Review generated files before publishing

2. **Path Traversal**: Output paths are validated
   - We use path normalization to prevent directory traversal

3. **Dependency Vulnerabilities**: Check dependencies regularly
   - Run `pnpm audit` periodically

## Security Updates

Security updates are released as patch versions. To stay secure:

1. **Watch releases**: Enable GitHub notifications for releases
2. **Update regularly**: Run `pnpm update @pas7/llm-seo` regularly
3. **Enable Dependabot**: Configure Dependabot for automatic updates

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## Contact

For security concerns:
- **Security Issues**: security@pas7.studio
- **General Questions**: Open a [GitHub Discussion](https://github.com/pas7studio/llm-seo/discussions)

---

Thank you for helping keep @pas7/llm-seo and its users safe! 🛡️

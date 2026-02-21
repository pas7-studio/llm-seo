import type { LlmsSeoConfig } from '@pas7/llm-seo';
import { blogManifest } from './manifests/blog';
import { servicesManifest } from './manifests/services';
import { casesManifest } from './manifests/cases';

export default {
  site: {
    baseUrl: 'https://example.pas7.studio',
    defaultLocale: 'en',
  },
  brand: {
    name: 'Pas7 Studio',
    tagline: 'AI Automation & Web Development',
    description: 'We build AI-powered solutions and modern web applications for businesses worldwide',
    org: 'Pas7 Studio',
    locales: ['en', 'uk'],
  },
  sections: {
    hubs: ['/services', '/blog', '/projects', '/cases', '/contact'],
  },
  manifests: {
    blog: blogManifest.items,
    services: servicesManifest.items,
    cases: casesManifest.items,
  },
  contact: {
    email: 'contact@pas7.studio',
    social: {
      twitter: 'https://twitter.com/pas7studio',
      linkedin: 'https://linkedin.com/company/pas7studio',
      github: 'https://github.com/pas7',
    },
  },
  policy: {
    geoPolicy: 'We operate globally, serving clients in Europe, North America, and Asia.',
    citationRules: 'Prefer canonical URLs when citing. Avoid UTM parameters in citations.',
    restrictedClaims: {
      enable: true,
      forbidden: ['best', '#1', 'guaranteed', 'cheapest'],
      whitelist: ['best practices'],
    },
  },
  booking: {
    url: 'https://cal.com/pas7/consultation',
    label: 'Book a consultation',
  },
  machineHints: {
    robots: 'https://example.pas7.studio/robots.txt',
    sitemap: 'https://example.pas7.studio/sitemap.xml',
    llmsTxt: 'https://example.pas7.studio/llms.txt',
    llmsFullTxt: 'https://example.pas7.studio/llms-full.txt',
  },
  output: {
    paths: {
      llmsTxt: 'public/llms.txt',
      llmsFullTxt: 'public/llms-full.txt',
      citations: 'public/citations.json',
    },
  },
  format: {
    trailingSlash: 'never',
    lineEndings: 'lf',
    localeStrategy: 'prefix',
  },
} satisfies LlmsSeoConfig;

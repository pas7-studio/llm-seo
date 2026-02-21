import type { LlmsSeoConfig } from '@pas7/llm-seo';
import { settings } from './settings.js';
import { blogItems } from './manifests/blog.js';
import { servicesItems } from './manifests/services.js';
import { contactItems } from './manifests/contact.js';

export default {
  site: {
    baseUrl: settings.siteUrl,
    defaultLocale: settings.defaultLocale,
  },
  brand: {
    name: 'Pas7 Studio',
    tagline: 'Hybrid routing LLM SEO example',
    description: 'Demonstrates mixed canonical routing styles in one config.',
    locales: [...settings.locales],
  },
  sections: {
    hubs: ['/services', '/blog', '/contact'],
  },
  manifests: {
    blog: {
      sectionPath: '/blog',
      routeStyle: 'locale-segment',
      items: blogItems,
    },
    services: {
      sectionPath: '/services',
      routeStyle: 'prefix',
      items: servicesItems,
    },
    contactPages: {
      routeStyle: 'suffix',
      items: contactItems,
    },
  },
  contact: {
    email: 'contact@pas7.studio',
    phone: '+380-00-000-0000',
    social: {
      github: 'https://github.com/pas7',
      linkedin: 'https://linkedin.com/company/pas7studio',
    },
  },
  machineHints: {
    robots: `${settings.siteUrl}/robots.txt`,
    sitemap: `${settings.siteUrl}/sitemap.xml`,
    llmsTxt: `${settings.siteUrl}/llms.txt`,
    llmsFullTxt: `${settings.siteUrl}/llms-full.txt`,
  },
  output: {
    paths: {
      llmsTxt: 'public/llms.txt',
      llmsFullTxt: 'public/llms-full.txt',
    },
  },
  format: {
    trailingSlash: 'never',
    lineEndings: 'lf',
  },
} satisfies LlmsSeoConfig;

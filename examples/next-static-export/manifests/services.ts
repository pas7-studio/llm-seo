import type { ManifestItem } from '@pas7/llm-seo';

export const servicesManifest = {
  items: [
    {
      slug: '/services/ai-automation',
      locales: ['en', 'uk'],
      title: 'AI Automation Services',
      description: 'Custom AI automation solutions for business processes',
      priority: 95,
    },
    {
      slug: '/services/web-development',
      locales: ['en', 'uk'],
      title: 'Web Development',
      description: 'Modern web applications built with Next.js and TypeScript',
      priority: 90,
    },
    {
      slug: '/services/seo-optimization',
      locales: ['en'],
      title: 'SEO Optimization',
      description: 'Technical SEO and LLM SEO optimization services',
      priority: 85,
    },
    {
      slug: '/services/consulting',
      locales: ['en', 'uk'],
      title: 'Technical Consulting',
      description: 'Expert consulting on software architecture and AI integration',
      priority: 80,
    },
    {
      slug: '/services/api-development',
      locales: ['en'],
      title: 'API Development',
      description: 'REST and GraphQL API design and implementation',
      priority: 75,
    },
  ] satisfies ManifestItem[],
};

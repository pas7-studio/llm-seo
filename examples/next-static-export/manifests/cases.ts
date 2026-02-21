import type { ManifestItem } from '@pas7/llm-seo';

export const casesManifest = {
  items: [
    {
      slug: '/cases/ecommerce-automation',
      locales: ['en'],
      publishedAt: '2024-01-10T00:00:00Z',
      title: 'E-commerce Order Automation',
      description: 'How we automated order processing for a large e-commerce platform',
      priority: 85,
    },
    {
      slug: '/cases/saas-onboarding-ai',
      locales: ['en', 'uk'],
      publishedAt: '2024-02-15T00:00:00Z',
      title: 'AI-Powered User Onboarding',
      description: 'Implementing AI assistants for improved user onboarding in SaaS',
      priority: 90,
    },
    {
      slug: '/cases/healthcare-portal',
      locales: ['en'],
      publishedAt: '2023-11-20T00:00:00Z',
      title: 'Healthcare Patient Portal',
      description: 'Building a compliant patient portal with Next.js',
      priority: 80,
    },
    {
      slug: '/cases/fintech-dashboard',
      locales: ['en', 'uk'],
      publishedAt: '2024-03-01T00:00:00Z',
      title: 'Real-time Fintech Dashboard',
      description: 'High-performance financial dashboard with real-time data',
      priority: 88,
    },
  ] satisfies ManifestItem[],
};

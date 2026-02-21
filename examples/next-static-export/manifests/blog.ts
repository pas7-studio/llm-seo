import type { ManifestItem } from '@pas7/llm-seo';

export const blogManifest = {
  items: [
    {
      slug: '/blog/ai-automation-guide',
      locales: ['en'],
      publishedAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      title: 'Complete Guide to AI Automation for Businesses',
      description: 'Learn how to implement AI automation in your business workflow',
      priority: 90,
    },
    {
      slug: '/blog/nextjs-seo-best-practices',
      locales: ['en', 'uk'],
      publishedAt: '2024-02-10T00:00:00Z',
      title: 'Next.js SEO Best Practices in 2024',
      description: 'Comprehensive guide to SEO optimization in Next.js applications',
      priority: 85,
    },
    {
      slug: '/blog/llm-seo-explained',
      locales: ['en'],
      publishedAt: '2024-03-05T00:00:00Z',
      title: 'LLM SEO: Optimizing for AI Search Assistants',
      description: 'Understanding how to optimize your content for LLM-based search',
      priority: 95,
    },
    {
      slug: '/blog/static-site-generation',
      locales: ['en', 'uk'],
      publishedAt: '2024-01-20T00:00:00Z',
      title: 'Static Site Generation with Next.js',
      description: 'Deep dive into SSG and static exports with Next.js',
      priority: 75,
    },
    {
      slug: '/blog/typescript-tips-2024',
      locales: ['en'],
      publishedAt: '2024-02-28T00:00:00Z',
      title: 'TypeScript Tips and Tricks for 2024',
      description: 'Advanced TypeScript patterns and best practices',
      priority: 70,
    },
  ] satisfies ManifestItem[],
};

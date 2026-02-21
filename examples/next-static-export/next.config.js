/**
 * Next.js configuration for static export with llm-seo integration.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export
  output: 'export',
  
  // No trailing slashes for cleaner URLs
  trailingSlash: false,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Optional: Redirects for common patterns
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Optional: Headers for security and LLM-friendly responses
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        // LLM-specific content types
        source: '/llms.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

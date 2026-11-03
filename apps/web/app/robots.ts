import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ees.provolution.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/fields', '/blog', '/resources', '/legal/*'],
        disallow: [
          '/api/*',
          '/evolve/*',
          '/engage/messages/*',
          '/scale/assignments/*',
          '/admin/*',
          '/settings/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

# SEO Implementation Guide — EES Platform

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** SEO-IMPL-2026-v1  

---

## 1. Technical SEO Architecture

EES implements Next.js App Router metadata APIs and server-side rendering (SSR/SSG) to ensure search engine visibility for public educational assets, skill roadmaps, and blog guides while keeping private workspace data secure.

---

## 2. Meta Tags, OpenGraph & Structured Data

### 2.1 Dynamic Metadata
Every public page exports an optimized `Metadata` object:
- Canonical URLs to prevent duplicate content flags.
- Title template: `%s | EES — Evolve, Engage & Scale`.
- Standard OpenGraph and Twitter cards with preview imagery and descriptions.

### 2.2 Schema.org JSON-LD Structured Data
- **Organization Schema:** Provolution Technologies Pvt. Ltd. details.
- **Course / Educational Resource Schema:** On public skill guides.
- **Article Schema:** On blog posts with author provenance and publication timestamps.

---

## 3. Crawler Control (`robots.txt` & `sitemap.xml`)

### 3.1 `robots.txt` (`apps/web/app/robots.ts`)
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ees.provolution.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/blog/*', '/resources/*', '/legal/*'],
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
```

### 3.2 Dynamic `sitemap.xml` (`apps/web/app/sitemap.ts`)
- Automatically traverses approved public blog posts, skill paths, and static landing pages.
- Excludes private user workspaces, conversations, and confidential opportunity submissions.

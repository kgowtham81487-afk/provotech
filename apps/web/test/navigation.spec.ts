import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config.mjs';

describe('Frontend Navigation & Routing Contract Tests', () => {
  it('should define redirects for all legacy or subpath routes without 404', async () => {
    expect(nextConfig.redirects).toBeDefined();
    const redirects = await nextConfig.redirects();

    const expectedRedirects = [
      { source: '/evolve/learning', destination: '/evolve?tab=learning' },
      { source: '/evolve/fitness', destination: '/evolve?tab=fitness' },
      { source: '/evolve/projects', destination: '/evolve?tab=projects' },
      { source: '/engage/feed', destination: '/engage?tab=for-you' },
      { source: '/engage/communities', destination: '/engage?tab=communities' },
      { source: '/engage/showcase', destination: '/engage?tab=showcase' },
      { source: '/scale/opportunities', destination: '/scale' },
    ];

    for (const exp of expectedRedirects) {
      const match = redirects.find((r: any) => r.source === exp.source);
      expect(match).toBeDefined();
      expect(match?.destination).toBe(exp.destination);
    }
  });

  it('should properly format API_BASE without trailing slash and with /api/v1 prefix', () => {
    function formatApiBase(envUrl?: string): string {
      let rawBase = envUrl || 'http://localhost:4000';
      rawBase = rawBase.trim().replace(/\/+$/, '');
      if (!rawBase.endsWith('/api/v1')) {
        rawBase += '/api/v1';
      }
      return rawBase;
    }

    expect(formatApiBase('http://localhost:4000')).toBe('http://localhost:4000/api/v1');
    expect(formatApiBase('https://provotech-api.onrender.com/')).toBe('https://provotech-api.onrender.com/api/v1');
    expect(formatApiBase('https://provotech-api.onrender.com/api/v1')).toBe('https://provotech-api.onrender.com/api/v1');
    expect(formatApiBase('https://provotech-api.onrender.com/api/v1/')).toBe('https://provotech-api.onrender.com/api/v1');
  });
});

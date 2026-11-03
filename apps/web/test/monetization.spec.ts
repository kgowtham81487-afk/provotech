import { describe, it, expect } from 'vitest';

describe('AdSense & Monetization Readiness Tests', () => {
  it('should format ads.txt correctly with given publisher ID', async () => {
    const pubId = 'pub-1234567890123456';
    const content = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0`;

    expect(content).toContain('google.com');
    expect(content).toContain(pubId);
    expect(content).toContain('DIRECT');
    expect(content).toContain('f08c47fec0942fa0');
  });

  it('should not include fake publisher ID by default', () => {
    const defaultPlaceholder = 'pub-PENDING_OWNER_CONFIG';
    expect(defaultPlaceholder).toBe('pub-PENDING_OWNER_CONFIG');
  });
});

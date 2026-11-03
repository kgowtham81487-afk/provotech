import { describe, it, expect, vi } from 'vitest';
import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/database/prisma.service';

describe('HealthController (Unit)', () => {
  it('should return 200 OK with liveness details', () => {
    const mockPrisma = {} as PrismaService;
    const controller = new HealthController(mockPrisma);

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockImplementation((data) => data),
    } as any;

    const result = controller.getLiveness(mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        service: 'ees-api',
        organization: 'Provolution Technologies Pvt. Ltd.',
      }),
    );
  });
});

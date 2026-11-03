import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../src/modules/admin/admin.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Super Admin & Security Unit Tests', () => {
  let adminService: AdminService;
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
      userRole: {
        findUnique: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      refreshToken: {
        deleteMany: vi.fn(),
      },
      session: {
        deleteMany: vi.fn(),
      },
      passwordResetToken: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      featureFlag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      platformConfig: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (cb) => {
        if (Array.isArray(cb)) {
          return Promise.all(cb);
        }
        return cb(mockPrisma);
      }),
    };

    const mockFallbackEngine = {
      executeWithFallback: vi.fn(),
      getProviderStatuses: vi.fn(),
      testProvider: vi.fn(),
      updateProviderConfiguration: vi.fn(),
      setFallbackEnabled: vi.fn(),
      restoreDefaultProviderOrder: vi.fn(),
    };

    adminService = new AdminService(
      mockPrisma as unknown as PrismaService,
      mockFallbackEngine as any,
    );
    authService = new AuthService(mockPrisma as unknown as PrismaService);
  });

  describe('Password Hashing & Credentials Verification', () => {
    it('should securely hash password with bcrypt work factor 12', async () => {
      const plainPassword = 'Gowtham@123';
      const hash = await bcrypt.hash(plainPassword, 12);

      expect(hash).not.toBe(plainPassword);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

      const isValid = await bcrypt.compare(plainPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Super Admin Protection Rules', () => {
    it('should prevent demoting the last active Super Administrator', async () => {
      const superAdminUserId = 'super-admin-uuid-1';
      const actorId = 'actor-uuid-1';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: superAdminUserId,
        email: 'gowthamk81487@gmail.com',
        roles: [{ role: { name: 'SUPER_ADMIN' } }],
      });

      mockPrisma.role.findUnique.mockImplementation(async ({ where }: any) => {
        if (where.name === 'SUPER_ADMIN') return { id: 'role-super-admin-id', name: 'SUPER_ADMIN' };
        if (where.name === 'ADMIN') return { id: 'role-admin-id', name: 'ADMIN' };
        return null;
      });

      mockPrisma.userRole.findUnique.mockResolvedValue({
        userId: superAdminUserId,
        roleId: 'role-super-admin-id',
      });

      // Total active Super Admins is 1
      mockPrisma.userRole.count.mockResolvedValue(1);

      await expect(
        adminService.changeUserRole(superAdminUserId, 'ADMIN', actorId),
      ).rejects.toThrow(/Cannot demote the last active Super Administrator/);
    });

    it('should prevent deleting the last active Super Administrator', async () => {
      const superAdminUserId = 'super-admin-uuid-1';
      const actorId = 'actor-uuid-1';

      mockPrisma.role.findUnique.mockResolvedValue({
        id: 'role-super-admin-id',
        name: 'SUPER_ADMIN',
      });

      mockPrisma.userRole.findUnique.mockResolvedValue({
        userId: superAdminUserId,
        roleId: 'role-super-admin-id',
      });

      // Total active Super Admins is 1
      mockPrisma.userRole.count.mockResolvedValue(1);

      await expect(
        adminService.deleteUser(superAdminUserId, actorId),
      ).rejects.toThrow(/Cannot delete the last active Super Administrator/);
    });
  });

  describe('Password Reset Token Security', () => {
    it('should reject already used password reset tokens', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-uuid-1',
        userId: 'user-uuid-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(Date.now() - 5000), // already used!
      });

      await expect(
        authService.resetPassword({
          token: 'raw-token',
          newPassword: 'NewSecurePassword@123',
        }),
      ).rejects.toThrow(/This reset link has already been used/);
    });

    it('should reject expired password reset tokens', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-uuid-2',
        userId: 'user-uuid-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() - 10000), // expired!
        usedAt: null,
      });

      await expect(
        authService.resetPassword({
          token: 'raw-token',
          newPassword: 'NewSecurePassword@123',
        }),
      ).rejects.toThrow(/This password reset link has expired/);
    });
  });
});


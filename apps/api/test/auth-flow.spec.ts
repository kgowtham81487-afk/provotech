import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { EvolveService } from '../src/modules/evolve/evolve.service';
import { PrismaService } from '../src/database/prisma.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, InternalServerErrorException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('Auth & Role Management Tests', () => {
  let authService: AuthService;
  let evolveService: EvolveService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
      userRole: {
        create: vi.fn(),
      },
      userProfile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userField: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      field: {
        findUnique: vi.fn(),
      },
      learningGoal: {
        create: vi.fn(),
      },
      xPTransaction: {
        create: vi.fn(),
      },
      streak: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      session: {
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      passwordResetToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (arg) => {
        if (Array.isArray(arg)) return Promise.all(arg);
        if (typeof arg === 'function') return arg(mockPrisma);
        return arg;
      }),
    };

    authService = new AuthService(mockPrisma as unknown as PrismaService);
    evolveService = new EvolveService(mockPrisma as unknown as PrismaService);
  });

  describe('Scenario 1: Successful Registration with Canonical USER Role', () => {
    it('should register a new user and assign the canonical USER role inside a transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockImplementation(async ({ where }: { where: { name: string } }) => {
        if (where.name === 'USER') return { id: 'role-user-id', name: 'USER' };
        return null;
      });

      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-123',
        email: 'developer@provolution.in',
        passwordHash: '$2a$12$securehashvaluehere',
        profile: { username: 'dev_user', displayName: 'Developer User' },
        roles: [{ role: { name: 'USER' } }],
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await authService.register(
        {
          email: 'developer@provolution.in',
          password: 'Password@123',
          displayName: 'Developer User',
          username: 'dev_user',
        },
        '127.0.0.1',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('developer@provolution.in');
      expect(result.user.roles).toContain('USER');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: {
              create: {
                roleId: 'role-user-id',
              },
            },
          }),
        }),
      );
    });
  });

  describe('Scenario 2: Duplicate Email Rejection', () => {
    it('should reject registration if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'taken@provolution.in' });

      await expect(
        authService.register(
          {
            email: 'taken@provolution.in',
            password: 'Password@123',
            displayName: 'Existing User',
            username: 'existing_user',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Scenario 3: Duplicate Username Rejection', () => {
    it('should reject registration if username is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue({ id: 'existing-profile-id', username: 'taken_username' });

      await expect(
        authService.register(
          {
            email: 'unique@provolution.in',
            password: 'Password@123',
            displayName: 'New User',
            username: 'taken_username',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow('This username is already taken. Please choose another.');
    });
  });

  describe('Scenario 4: Immunity to Client-Supplied Role Injection', () => {
    it('should ignore any client-supplied role and strictly assign the default USER role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockImplementation(async ({ where }: { where: { name: string } }) => {
        if (where.name === 'USER') return { id: 'canonical-user-role-id', name: 'USER' };
        if (where.name === 'SUPER_ADMIN') return { id: 'super-admin-role-id', name: 'SUPER_ADMIN' };
        return null;
      });

      mockPrisma.user.create.mockResolvedValue({
        id: 'user-no-escalation',
        email: 'attacker@provolution.in',
        passwordHash: '$2a$12$securehashvaluehere',
        profile: { username: 'attacker_user', displayName: 'Attacker' },
        roles: [{ role: { name: 'USER' } }],
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      // Attacker attempts to pass a malicious role payload
      const maliciousPayload: any = {
        email: 'attacker@provolution.in',
        password: 'Password@123',
        displayName: 'Attacker',
        username: 'attacker_user',
        role: 'SUPER_ADMIN',
      };

      const result = await authService.register(maliciousPayload, '192.168.1.1');

      expect(result.user.roles).toContain('USER');
      expect(result.user.roles).not.toContain('SUPER_ADMIN');
      // Verify user.create was called with the canonical USER role ID, not SUPER_ADMIN
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: {
              create: {
                roleId: 'canonical-user-role-id',
              },
            },
          }),
        }),
      );
    });
  });

  describe('Scenario 5: USER Role Cannot Access Admin Routes', () => {
    it('should deny USER role access to admin-guarded routes via RolesGuard', () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['SUPER_ADMIN', 'ADMIN']),
      } as unknown as Reflector;

      const rolesGuard = new RolesGuard(mockReflector);

      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-regular', roles: ['USER'] },
          }),
        }),
      } as unknown as ExecutionContext;

      const canAccess = rolesGuard.canActivate(mockExecutionContext);
      expect(canAccess).toBe(false);
    });

    it('should grant SUPER_ADMIN access to admin-guarded routes', () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['SUPER_ADMIN']),
      } as unknown as Reflector;

      const rolesGuard = new RolesGuard(mockReflector);

      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'admin-user', roles: ['SUPER_ADMIN'] },
          }),
        }),
      } as unknown as ExecutionContext;

      const canAccess = rolesGuard.canActivate(mockExecutionContext);
      expect(canAccess).toBe(true);
    });
  });

  describe('Scenario 6: Missing USER Role in Database Handled Cleanly', () => {
    it('should throw an InternalServerErrorException when default role is missing from database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      // Both USER and STANDARD_USER return null
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        authService.register(
          {
            email: 'newuser@provolution.in',
            password: 'Password@123',
            displayName: 'New User',
            username: 'new_user',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Scenario 7: Password Hash Never Exposed in Response', () => {
    it('should never expose passwordHash in registration output', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-user-id', name: 'USER' });

      mockPrisma.user.create.mockResolvedValue({
        id: 'safe-user-id',
        email: 'safe@provolution.in',
        passwordHash: '$2a$12$superSecretHashNeverLeak',
        profile: { username: 'safe_user', displayName: 'Safe User' },
        roles: [{ role: { name: 'USER' } }],
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await authService.register(
        {
          email: 'safe@provolution.in',
          password: 'Password@123',
          displayName: 'Safe User',
          username: 'safe_user',
        },
        '127.0.0.1',
      );

      expect((result.user as any).passwordHash).toBeUndefined();
      expect((result as any).passwordHash).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain('$2a$12$superSecretHashNeverLeak');
    });
  });

  describe('Scenario 8: Backward Compatibility with STANDARD_USER', () => {
    it('should fall back to STANDARD_USER role if USER role is not yet created', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      // USER is null, but legacy STANDARD_USER exists
      mockPrisma.role.findUnique.mockImplementation(async ({ where }: { where: { name: string } }) => {
        if (where.name === 'USER') return null;
        if (where.name === 'STANDARD_USER') return { id: 'legacy-standard-role-id', name: 'STANDARD_USER' };
        return null;
      });

      mockPrisma.user.create.mockResolvedValue({
        id: 'legacy-user-123',
        email: 'legacy@provolution.in',
        passwordHash: '$2a$12$securehashvaluehere',
        profile: { username: 'legacy_user', displayName: 'Legacy User' },
        roles: [{ role: { name: 'STANDARD_USER' } }],
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await authService.register(
        {
          email: 'legacy@provolution.in',
          password: 'Password@123',
          displayName: 'Legacy User',
          username: 'legacy_user',
        },
        '127.0.0.1',
      );

      expect(result.user.roles).toContain('STANDARD_USER');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: {
              create: {
                roleId: 'legacy-standard-role-id',
              },
            },
          }),
        }),
      );
    });

    it('should allow users with STANDARD_USER role to log in and receive valid tokens', async () => {
      const passwordHash = await bcrypt.hash('Secret@123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-legacy-login',
        email: 'existing_standard@provolution.in',
        passwordHash,
        status: 'ACTIVE',
        deletedAt: null,
        profile: { username: 'existing_standard', displayName: 'Existing Standard User' },
        roles: [{ role: { name: 'STANDARD_USER' } }],
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await authService.login(
        {
          email: 'existing_standard@provolution.in',
          password: 'Secret@123',
        },
        '127.0.0.1',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result.user.roles).toContain('STANDARD_USER');
    });
  });

  describe('Additional Security & Onboarding Flow Tests', () => {
    it('should block suspended user from logging in', async () => {
      const passwordHash = await bcrypt.hash('Secret@123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-suspended',
        email: 'suspended@provolution.in',
        passwordHash,
        status: 'SUSPENDED',
        deletedAt: null,
      });

      await expect(
        authService.login(
          {
            email: 'suspended@provolution.in',
            password: 'Secret@123',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow('Your account has been suspended. Please contact platform administration.');
    });

    it('should assign primary and secondary fields on onboarding', async () => {
      mockPrisma.field.findUnique
        .mockResolvedValueOnce({ id: 'field-software', name: 'Software Development', isActive: true })
        .mockResolvedValueOnce({ id: 'field-ai', name: 'AI & ML', isActive: true });

      mockPrisma.userField.deleteMany.mockResolvedValue({});
      mockPrisma.userField.create.mockResolvedValue({});
      mockPrisma.learningGoal.create.mockResolvedValue({});

      const result = await evolveService.completeOnboarding('user-123', {
        primaryFieldId: '00000000-0000-0000-0000-000000000001',
        secondaryFieldId: '00000000-0000-0000-0000-000000000002',
        initialProficiency: 'INTERMEDIATE',
        weeklyTargetHours: 10,
        primaryGoal: 'Build fullstack SaaS applications',
      });

      expect(result).toHaveProperty('message');
      expect(mockPrisma.userField.create).toHaveBeenCalled();
    });
  });
});

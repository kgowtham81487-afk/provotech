import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { EvolveService } from '../src/modules/evolve/evolve.service';
import { PrismaService } from '../src/database/prisma.service';
import bcrypt from 'bcryptjs';

describe('Auth & Onboarding End-to-End Logic Tests', () => {
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

  describe('Registration -> Login Flow', () => {
    it('should register a standard user and hash their password with bcrypt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-standard', name: 'STANDARD_USER' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-123',
        email: 'developer@provolution.in',
        passwordHash: 'hashed_pw',
        profile: { username: 'dev_user', displayName: 'Developer User' },
        roles: [{ role: { name: 'STANDARD_USER' } }],
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});

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
      expect(result.user.roles).toContain('STANDARD_USER');
    });

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
      ).rejects.toThrow('An account with this email address already exists.');
    });

    it('should authenticate user on valid password and return tokens', async () => {
      const passwordHash = await bcrypt.hash('Secret@123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-auth-1',
        email: 'dev@provolution.in',
        passwordHash,
        status: 'ACTIVE',
        deletedAt: null,
        profile: { username: 'dev', displayName: 'Dev' },
        roles: [{ role: { name: 'STANDARD_USER' } }],
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});

      const result = await authService.login(
        {
          email: 'dev@provolution.in',
          password: 'Secret@123',
        },
        '127.0.0.1',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('dev@provolution.in');
    });

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
  });

  describe('Onboarding Flow', () => {
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

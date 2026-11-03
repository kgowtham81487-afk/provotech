import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminCreateUserInput,
  AdminUpdateStatusInput,
  AdminChangeRoleInput,
  AdminFeatureFlagUpdateInput,
  CreateOpportunityInput,
} from '@ees/shared';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      recentUsers,
      totalPosts,
      totalCommunities,
      totalOpportunities,
      totalApplications,
      totalAssignments,
      xpTransactionsCount,
      flagsCount,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.post.count(),
      this.prisma.community.count(),
      this.prisma.opportunity.count(),
      this.prisma.opportunityApplication.count(),
      this.prisma.assignment.count(),
      this.prisma.xPTransaction.count(),
      this.prisma.featureFlag.count(),
      this.prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, profile: { select: { username: true } } } } },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        newRegistrations30d: recentUsers,
        totalPosts,
        totalCommunities,
        totalOpportunities,
        totalApplications,
        totalAssignments,
        xpTransactionsCount,
        activeFeatureFlags: flagsCount,
      },
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: 'Connected (PostgreSQL via Prisma)',
      },
      recentAuditLogs,
    };
  }

  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { displayName: { contains: q, mode: 'insensitive' } } },
        { profile: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.role) {
      where.roles = {
        some: {
          role: { name: params.role },
        },
      };
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          roles: { include: { role: true } },
          fields: { include: { field: true } },
          streak: true,
          _count: {
            select: {
              posts: true,
              projects: true,
              applications: true,
            },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.profile?.username,
        displayName: u.profile?.displayName,
        avatarUrl: u.profile?.avatarUrl,
        status: u.status,
        emailVerified: !!u.emailVerified,
        lastLoginAt: u.lastLoginAt,
        roles: u.roles.map((r) => r.role.name),
        fields: u.fields.map((f) => ({ name: f.field.name, isPrimary: f.isPrimary })),
        stats: {
          posts: u._count.posts,
          projects: u._count.projects,
          applications: u._count.applications,
          streakDays: u.streak?.currentCount || 0,
        },
        createdAt: u.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(input: AdminCreateUserInput, actorId: string, ipAddress?: string) {
    const email = input.email.toLowerCase().trim();
    const username = input.username.toLowerCase().trim();

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered.');
    }

    const existingUsername = await this.prisma.userProfile.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Username already taken.');
    }

    const roleRecord = await this.prisma.role.findUnique({ where: { name: input.role } });
    if (!roleRecord) {
      throw new NotFoundException(`Role ${input.role} not found.`);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: new Date(),
        status: 'ACTIVE',
        profile: {
          create: {
            username,
            displayName: input.displayName.trim(),
            isPublic: true,
          },
        },
        roles: {
          create: { roleId: roleRecord.id },
        },
      },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'ADMIN_USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        metadata: { email, username, assignedRole: input.role },
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.profile?.username,
      displayName: user.profile?.displayName,
      roles: user.roles.map((r) => r.role.name),
      createdAt: user.createdAt,
    };
  }

  async updateUserStatus(userId: string, input: AdminUpdateStatusInput, actorId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Protect last active SUPER_ADMIN
    if (input.status !== 'ACTIVE') {
      await this.ensureNotLastSuperAdmin(userId, 'change status of');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: input.status },
    });

    // Invalidate sessions if suspended
    if (input.status === 'SUSPENDED') {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      await this.prisma.session.deleteMany({ where: { userId } });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: `USER_STATUS_${input.status}`,
        entityType: 'User',
        entityId: userId,
        ipAddress,
        metadata: { reason: input.reason, previousStatus: user.status },
      },
    });

    return { id: updated.id, status: updated.status };
  }

  async changeUserRole(userId: string, targetRole: string, actorId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Role check: Only SUPER_ADMIN can assign SUPER_ADMIN
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      include: { roles: { include: { role: true } } },
    });

    const isActorSuperAdmin = actor?.roles.some((r) => r.role.name === 'SUPER_ADMIN');

    if (targetRole === 'SUPER_ADMIN' && !isActorSuperAdmin) {
      throw new ForbiddenException('Only an authorized Super Administrator can assign the SUPER_ADMIN role.');
    }

    // If target user is currently SUPER_ADMIN and we are removing it, ensure not last SUPER_ADMIN
    const isTargetSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
    if (isTargetSuperAdmin && targetRole !== 'SUPER_ADMIN') {
      await this.ensureNotLastSuperAdmin(userId, 'demote');
    }

    const newRole = await this.prisma.role.findUnique({ where: { name: targetRole } });
    if (!newRole) {
      throw new NotFoundException(`Role '${targetRole}' not found.`);
    }

    // Remove existing roles and assign new role
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.create({
        data: {
          userId,
          roleId: newRole.id,
        },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: userId,
        ipAddress,
        metadata: { newRole: targetRole, previousRoles: user.roles.map((r) => r.role.name) },
      },
    });

    return {
      userId,
      roles: [targetRole],
    };
  }

  async generateResetLink(userId: string, actorId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User account not found.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Invalidate prior unused tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'ADMIN_GENERATED_PASSWORD_RESET_LINK',
        entityType: 'User',
        entityId: userId,
        ipAddress,
        metadata: { targetEmail: user.email },
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    return {
      userId,
      email: user.email,
      resetUrl,
      expiresAt,
      notice: 'This single-use reset link must be delivered securely to the account owner.',
    };
  }

  async deleteUser(userId: string, actorId: string, ipAddress?: string) {
    await this.ensureNotLastSuperAdmin(userId, 'delete');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    // Invalidate all tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_SOFT_DELETED',
        entityType: 'User',
        entityId: userId,
        ipAddress,
      },
    });

    return { id: updated.id, deletedAt: updated.deletedAt };
  }

  async restoreUser(userId: string, actorId: string, ipAddress?: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_RESTORED',
        entityType: 'User',
        entityId: userId,
        ipAddress,
      },
    });

    return { id: updated.id, status: updated.status };
  }

  // Feature Flags Management
  async listFeatureFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateFeatureFlag(input: AdminFeatureFlagUpdateInput, actorId: string, ipAddress?: string) {
    const flag = await this.prisma.featureFlag.upsert({
      where: { key: input.key },
      update: {
        isEnabled: input.isEnabled,
        metadata: input.metadata,
      },
      create: {
        key: input.key,
        name: input.key.replace(/_/g, ' '),
        isEnabled: input.isEnabled,
        metadata: input.metadata,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'FEATURE_FLAG_UPDATED',
        entityType: 'FeatureFlag',
        entityId: flag.id,
        ipAddress,
        metadata: { key: input.key, isEnabled: input.isEnabled },
      },
    });

    return flag;
  }

  // Configurations
  async listConfigs() {
    const configs = await this.prisma.platformConfig.findMany({
      orderBy: { category: 'asc' },
    });

    // Mask sensitive fields if present
    return configs.map((c) => {
      const val = { ...(c.value as any) };
      if (val.apiKey) val.apiKey = '••••••••••••••••';
      if (val.secret) val.secret = '••••••••••••••••';
      return { ...c, value: val };
    });
  }

  async updateConfig(key: string, value: any, actorId: string, ipAddress?: string) {
    const cfg = await this.prisma.platformConfig.upsert({
      where: { key },
      update: { value },
      create: {
        category: 'GENERAL',
        key,
        value,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'CONFIG_UPDATED',
        entityType: 'PlatformConfig',
        entityId: cfg.id,
        ipAddress,
        metadata: { key },
      },
    });

    return cfg;
  }

  // Audit Logs
  async listAuditLogs(params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 30));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Database Management
  async getDatabaseStats() {
    const tables = [
      'User',
      'UserProfile',
      'Field',
      'Skill',
      'LearningSession',
      'WorkoutSession',
      'Project',
      'Post',
      'Comment',
      'Community',
      'Opportunity',
      'OpportunityApplication',
      'Assignment',
      'XPTransaction',
      'AuditLog',
      'PasswordResetToken',
      'FeatureFlag',
    ];

    const counts: Record<string, number> = {};
    for (const table of tables) {
      try {
        counts[table] = await (this.prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
      } catch {
        counts[table] = 0;
      }
    }

    return {
      status: 'Connected',
      provider: 'PostgreSQL',
      tables: counts,
      tableRecordCounts: counts,
      timestamp: new Date().toISOString(),
    };
  }

  async runDatabaseMaintenance(actorId: string, ipAddress?: string) {
    const now = new Date();

    // Clean up expired password reset tokens older than 7 days
    const expiredTokens = await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { usedAt: { not: null } },
          { expiresAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    // Clean up expired sessions
    const expiredSessions = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'DATABASE_MAINTENANCE_CLEANUP',
        entityType: 'Database',
        entityId: 'global',
        ipAddress,
        metadata: {
          cleanedTokens: expiredTokens.count,
          cleanedSessions: expiredSessions.count,
        },
      },
    });

    return {
      message: 'Database maintenance completed successfully.',
      cleanedTokens: expiredTokens.count,
      cleanedSessions: expiredSessions.count,
    };
  }

  // Opportunities Management
  async createOpportunity(input: CreateOpportunityInput, actorId: string, ipAddress?: string) {
    const opp = await this.prisma.opportunity.create({
      data: {
        title: input.title.trim(),
        slug: input.slug.trim().toLowerCase(),
        fieldId: input.fieldId,
        description: input.description,
        scope: input.scope,
        type: input.type as any,
        compensationType: input.compensationType as any,
        compensationAmount: input.compensationAmount,
        currency: input.currency,
        requiredSkills: {
          create: input.requiredSkillIds.map((skillId) => ({ skillId })),
        },
      },
      include: {
        requiredSkills: { include: { skill: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'OPPORTUNITY_CREATED',
        entityType: 'Opportunity',
        entityId: opp.id,
        ipAddress,
        metadata: { title: opp.title, slug: opp.slug },
      },
    });

    return opp;
  }

  async listApplications(params: { opportunityId?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.opportunityId) where.opportunityId = params.opportunityId;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.opportunityApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
      }),
      this.prisma.opportunityApplication.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async reviewApplication(
    applicationId: string,
    status: 'SHORTLISTED' | 'SELECTED' | 'REJECTED',
    notes: string,
    reviewerId: string,
    ipAddress?: string,
  ) {
    const app = await this.prisma.opportunityApplication.findUnique({
      where: { id: applicationId },
      include: { opportunity: true },
    });

    if (!app) {
      throw new NotFoundException('Application not found.');
    }

    const updatedApp = await this.prisma.opportunityApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewNotes: notes,
        reviewedByUserId: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // If SELECTED, spawn active Assignment
    if (status === 'SELECTED') {
      const existingAssignment = await this.prisma.assignment.findUnique({
        where: { applicationId },
      });

      if (!existingAssignment) {
        await this.prisma.assignment.create({
          data: {
            opportunityId: app.opportunityId,
            userId: app.userId,
            applicationId: app.id,
            status: 'ACTIVE',
          },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: `APPLICATION_${status}`,
        entityType: 'OpportunityApplication',
        entityId: applicationId,
        ipAddress,
        metadata: { notes, opportunityTitle: app.opportunity.title },
      },
    });

    return updatedApp;
  }

  private async ensureNotLastSuperAdmin(userId: string, actionDesc: string) {
    const superAdminRole = await this.prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    if (!superAdminRole) return;

    const userIsSuperAdmin = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: superAdminRole.id,
        },
      },
    });

    if (userIsSuperAdmin) {
      const totalSuperAdmins = await this.prisma.userRole.count({
        where: {
          roleId: superAdminRole.id,
          user: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
      });

      if (totalSuperAdmins <= 1) {
        throw new ForbiddenException(
          `Cannot ${actionDesc} the last active Super Administrator. Platform security requires at least one active Super Admin.`,
        );
      }
    }
  }
}

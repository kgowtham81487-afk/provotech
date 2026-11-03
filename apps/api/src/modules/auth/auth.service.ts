import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { RegisterInput, LoginInput, ResetPasswordInput } from '@ees/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-ees-jwt-super-secret-key-32charsmin';
  private readonly jwtExpiration = process.env.JWT_EXPIRATION || '15m';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-ees-refresh-secret-key-32charsmin';

  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterInput, ipAddress?: string) {
    const email = input.email.toLowerCase().trim();
    const username = input.username.toLowerCase().trim();
    const displayName = input.displayName.trim();

    // Check unique email
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // Check unique username
    const existingUsername = await this.prisma.userProfile.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('This username is already taken. Please choose another.');
    }

    // Canonical default role: look up 'USER' first, fallback to 'STANDARD_USER' for backward compatibility
    const defaultRole =
      (await this.prisma.role.findUnique({ where: { name: 'USER' } })) ||
      (await this.prisma.role.findUnique({ where: { name: 'STANDARD_USER' } }));

    if (!defaultRole) {
      this.logger.error('CRITICAL: Default USER role is not initialized in the database. Run prisma db seed.');
      throw new InternalServerErrorException('Default USER role is not initialized in the database.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Atomically create user, profile, settings, role assignment and streak within a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: {
              username,
              displayName,
              isPublic: true,
            },
          },
          settings: {
            create: {
              emailNotifications: true,
              inAppNotifications: true,
            },
          },
          roles: {
            create: {
              roleId: defaultRole.id,
            },
          },
          streak: {
            create: {
              currentCount: 0,
              longestCount: 0,
            },
          },
        },
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: createdUser.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: createdUser.id,
          ipAddress,
          metadata: { email, username, assignedRole: defaultRole.name },
        },
      });

      return createdUser;
    });

    const tokens = await this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username,
        displayName: user.profile?.displayName,
        roles: user.roles.map((r) => r.role.name),
      },
      ...tokens,
    };
  }

  async login(input: LoginInput, ipAddress?: string) {
    const email = input.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact platform administration.');
    }

    if (user.status === 'DEACTIVATED' || user.deletedAt) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          metadata: { email, reason: 'Invalid password' },
        },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
      },
    });

    const tokens = await this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username,
        displayName: user.profile?.displayName,
        roles: user.roles.map((r) => r.role.name),
      },
      ...tokens,
    };
  }

  async forgotPassword(email: string, ipAddress?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Return success envelope to avoid email enumeration
      return {
        message: 'If an account exists with this email address, a password reset link has been dispatched.',
      };
    }

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing active tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
      },
    });

    const isEmailConfigured = !!process.env.SMTP_HOST;
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

    return {
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
      isEmailConfigured,
      ...(process.env.NODE_ENV !== 'production' ? { debugResetLink: resetUrl } : {}),
    };
  }

  async resetPassword(input: ResetPasswordInput, ipAddress?: string) {
    const tokenHash = crypto.createHash('sha256').update(input.token.trim()).digest('hex');

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    if (resetRecord.usedAt) {
      throw new BadRequestException('This reset link has already been used and is no longer valid.');
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestException('This password reset link has expired. Please request a new one.');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

    // Transaction: update password, mark token used, invalidate existing sessions
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
      this.prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        userId: resetRecord.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'User',
        entityId: resetRecord.userId,
        ipAddress,
      },
    });

    return {
      message: 'Password has been successfully reset. Please log in with your new credentials.',
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            profile: true,
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!existing || existing.revokedAt || new Date() > existing.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(existing.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });
    return { message: 'Logged out successfully.' };
  }

  private async generateTokens(user: any) {
    const roles = user.roles.map((r: any) => r.role?.name || r.name);

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles,
      },
      this.jwtSecret,
      { expiresIn: '15m' },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}


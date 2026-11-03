import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
        roles: { include: { role: true } },
        fields: {
          include: { field: true },
        },
        streak: true,
        _count: {
          select: {
            projects: true,
            posts: true,
            following: true,
            followers: true,
            learningSessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    // Calculate total XP
    const xpTotal = await this.prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const xp = xpTotal._sum.amount || 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;

    const primaryUserField = user.fields.find((f) => f.isPrimary);
    const secondaryUserField = user.fields.find((f) => !f.isPrimary);

    return {
      id: user.id,
      email: user.email,
      username: user.profile?.username,
      displayName: user.profile?.displayName,
      avatarUrl: user.profile?.avatarUrl,
      coverUrl: user.profile?.coverUrl,
      bio: user.profile?.bio,
      location: user.profile?.location,
      websiteUrl: user.profile?.websiteUrl,
      githubUrl: user.profile?.githubUrl,
      linkedinUrl: user.profile?.linkedinUrl,
      roles: user.roles.map((r) => r.role.name),
      primaryField: primaryUserField ? primaryUserField.field : null,
      secondaryField: secondaryUserField ? secondaryUserField.field : null,
      xp,
      level,
      streakDays: user.streak?.currentCount || 0,
      stats: {
        projectsCount: user._count.projects,
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        learningSessionsCount: user._count.learningSessions,
      },
      createdAt: user.createdAt,
    };
  }

  async updateMe(userId: string, data: { displayName?: string; bio?: string; location?: string; websiteUrl?: string; githubUrl?: string; linkedinUrl?: string; avatarUrl?: string }) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: data.displayName?.trim(),
        bio: data.bio?.trim(),
        location: data.location?.trim(),
        websiteUrl: data.websiteUrl?.trim(),
        githubUrl: data.githubUrl?.trim(),
        linkedinUrl: data.linkedinUrl?.trim(),
        avatarUrl: data.avatarUrl,
      },
    });

    return profile;
  }

  async getPublicProfile(username: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { username: username.toLowerCase().trim() },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
            fields: { include: { field: true } },
            projects: {
              where: { isPublic: true },
              orderBy: { createdAt: 'desc' },
              take: 6,
            },
            posts: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: {
                _count: { select: { likes: true, comments: true } },
              },
            },
            streak: true,
            _count: {
              select: {
                followers: true,
                following: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!profile || profile.user.deletedAt || profile.user.status === 'DEACTIVATED') {
      throw new NotFoundException(`User @${username} not found.`);
    }

    const xpTotal = await this.prisma.xPTransaction.aggregate({
      where: { userId: profile.userId },
      _sum: { amount: true },
    });

    const xp = xpTotal._sum.amount || 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;

    return {
      id: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      coverUrl: profile.coverUrl,
      bio: profile.bio,
      location: profile.location,
      websiteUrl: profile.websiteUrl,
      githubUrl: profile.githubUrl,
      linkedinUrl: profile.linkedinUrl,
      roles: profile.user.roles.map((r) => r.role.name),
      fields: profile.user.fields.map((f) => ({
        ...f.field,
        isPrimary: f.isPrimary,
      })),
      xp,
      level,
      streakDays: profile.user.streak?.currentCount || 0,
      stats: {
        followersCount: profile.user._count.followers,
        followingCount: profile.user._count.following,
        projectsCount: profile.user._count.projects,
      },
      projects: profile.user.projects,
      posts: profile.user.posts,
      createdAt: profile.user.createdAt,
    };
  }
}


import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  OnboardingFieldSelectInput,
  CreateLearningSessionInput,
  CreateWorkoutInput,
  CreateContentIdeaInput,
  CreateProjectInput,
} from '@ees/shared';

@Injectable()
export class EvolveService {
  constructor(private readonly prisma: PrismaService) {}

  async completeOnboarding(userId: string, input: OnboardingFieldSelectInput) {
    if (input.primaryFieldId === input.secondaryFieldId) {
      throw new BadRequestException('Primary and secondary fields must be distinct.');
    }

    const primaryField = await this.prisma.field.findUnique({ where: { id: input.primaryFieldId } });
    if (!primaryField || !primaryField.isActive) {
      throw new NotFoundException('Selected primary field is not available.');
    }

    if (input.secondaryFieldId) {
      const secondaryField = await this.prisma.field.findUnique({ where: { id: input.secondaryFieldId } });
      if (!secondaryField || !secondaryField.isActive) {
        throw new NotFoundException('Selected secondary field is not available.');
      }
    }

    // Upsert UserFields
    await this.prisma.$transaction(async (tx) => {
      // Clear existing field selections if re-onboarding
      await tx.userField.deleteMany({ where: { userId } });

      await tx.userField.create({
        data: {
          userId,
          fieldId: input.primaryFieldId,
          isPrimary: true,
        },
      });

      if (input.secondaryFieldId) {
        await tx.userField.create({
          data: {
            userId,
            fieldId: input.secondaryFieldId,
            isPrimary: false,
          },
        });
      }

      // Create initial learning goal if provided
      if (input.primaryGoal) {
        await tx.learningGoal.create({
          data: {
            userId,
            title: input.primaryGoal.trim(),
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }

      // Award onboarding XP (+100 XP)
      await tx.xPTransaction.create({
        data: {
          userId,
          amount: 100,
          action: 'ONBOARDING_COMPLETED',
        },
      });

      // Update streak
      await tx.streak.upsert({
        where: { userId },
        update: {
          currentCount: 1,
          longestCount: 1,
          lastActiveAt: new Date(),
        },
        create: {
          userId,
          currentCount: 1,
          longestCount: 1,
          lastActiveAt: new Date(),
        },
      });
    });

    return {
      message: 'Onboarding completed successfully. Welcome to your Evolve workspace.',
    };
  }

  async getDashboard(userId: string) {
    const userFields = await this.prisma.userField.findMany({
      where: { userId },
      include: {
        field: {
          include: {
            categories: {
              include: { skills: true },
            },
            learningPaths: {
              include: { milestones: true },
            },
          },
        },
      },
    });

    const [goals, recentSessions, recentWorkouts, recentContent, projects, achievements] =
      await Promise.all([
        this.prisma.learningGoal.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.learningSession.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.workoutSession.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { sets: { include: { exercise: true } } },
        }),
        this.prisma.contentIdea.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
        this.prisma.project.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: true },
        }),
      ]);

    const xpAgg = await this.prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const totalXp = xpAgg._sum.amount || 0;
    const currentLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;

    return {
      fields: userFields.map((uf) => ({
        ...uf.field,
        isPrimary: uf.isPrimary,
      })),
      goals,
      recentSessions,
      recentWorkouts,
      recentContent,
      projects,
      achievements: achievements.map((a) => a.achievement),
      gamification: {
        totalXp,
        currentLevel,
        nextLevelXp: Math.pow(currentLevel, 2) * 100,
      },
    };
  }

  async logStudySession(userId: string, input: CreateLearningSessionInput) {
    // Server-side XP calculation
    const xpReward = Math.min(300, Math.max(25, Math.floor((input.durationMinutes / 30) * 50)));

    const session = await this.prisma.$transaction(async (tx) => {
      const s = await tx.learningSession.create({
        data: {
          userId,
          title: input.title.trim(),
          durationMinutes: input.durationMinutes,
          goalId: input.goalId,
          notes: input.notes?.trim(),
          xpEarned: xpReward,
        },
      });

      await tx.xPTransaction.create({
        data: {
          userId,
          amount: xpReward,
          action: 'LEARNING_SESSION',
          refId: s.id,
        },
      });

      // Unlock First Step achievement
      const firstStep = await tx.achievement.findUnique({ where: { title: 'First Step' } });
      if (firstStep) {
        const hasUnlocked = await tx.userAchievement.findUnique({
          where: {
            userId_achievementId: { userId, achievementId: firstStep.id },
          },
        });
        if (!hasUnlocked) {
          await tx.userAchievement.create({
            data: { userId, achievementId: firstStep.id },
          });
        }
      }

      return s;
    });

    return session;
  }

  async listStudySessions(userId: string) {
    return this.prisma.learningSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { goal: true },
    });
  }

  async logWorkout(userId: string, input: CreateWorkoutInput) {
    const xpReward = 75;

    const workout = await this.prisma.$transaction(async (tx) => {
      const session = await tx.workoutSession.create({
        data: {
          userId,
          title: input.title.trim(),
          durationMinutes: input.durationMinutes,
          notes: input.notes?.trim(),
        },
      });

      for (const set of input.sets) {
        // Ensure exercise exists
        let exercise = await tx.exercise.findUnique({ where: { name: set.exerciseName.trim() } });
        if (!exercise) {
          exercise = await tx.exercise.create({
            data: {
              name: set.exerciseName.trim(),
              muscleGroup: 'Custom',
            },
          });
        }

        await tx.workoutSet.create({
          data: {
            sessionId: session.id,
            exerciseId: exercise.id,
            setNumber: set.setNumber,
            reps: set.reps,
            weightKg: set.weightKg,
            rpe: set.rpe,
          },
        });
      }

      await tx.xPTransaction.create({
        data: {
          userId,
          amount: xpReward,
          action: 'FITNESS_WORKOUT',
          refId: session.id,
        },
      });

      return session;
    });

    return workout;
  }

  async listWorkouts(userId: string) {
    return this.prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { setNumber: 'asc' },
        },
      },
    });
  }

  async createContentIdea(userId: string, input: CreateContentIdeaInput) {
    return this.prisma.contentIdea.create({
      data: {
        userId,
        title: input.title.trim(),
        targetPlatform: input.targetPlatform as any,
        status: input.status as any,
        publishedUrl: input.publishedUrl || null,
      },
    });
  }

  async listContentIdeas(userId: string) {
    return this.prisma.contentIdea.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createProject(userId: string, input: CreateProjectInput) {
    const xpReward = 150;

    const project = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          userId,
          title: input.title.trim(),
          description: input.description.trim(),
          repoUrl: input.repoUrl || null,
          liveUrl: input.liveUrl || null,
          techTags: input.techTags,
          isPublic: input.isPublic,
          evidenceList: {
            create: input.evidenceUrls.map((url) => ({
              fileUrl: url,
              evidenceType: 'DEMO',
            })),
          },
        },
      });

      await tx.xPTransaction.create({
        data: {
          userId,
          amount: xpReward,
          action: 'PROJECT_PUBLISHED',
          refId: p.id,
        },
      });

      // Unlock Project Builder achievement
      const projectBuilder = await tx.achievement.findUnique({ where: { title: 'Project Builder' } });
      if (projectBuilder) {
        await tx.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: projectBuilder.id } },
          update: {},
          create: { userId, achievementId: projectBuilder.id },
        });
      }

      return p;
    });

    return project;
  }

  async listProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { evidenceList: true },
    });
  }
}

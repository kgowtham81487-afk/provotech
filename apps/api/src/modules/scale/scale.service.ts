import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ApplyOpportunityInput } from '@ees/shared';

@Injectable()
export class ScaleService {
  constructor(private readonly prisma: PrismaService) {}

  async listOpportunities(params: {
    type?: string;
    fieldId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { status: 'OPEN' };

    if (params.type) where.type = params.type;
    if (params.fieldId) where.fieldId = params.fieldId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, opportunities] = await Promise.all([
      this.prisma.opportunity.count({ where }),
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          field: true,
          requiredSkills: { include: { skill: true } },
          _count: { select: { applications: true } },
        },
      }),
    ]);

    return {
      data: opportunities.map((opp) => ({
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        organization: opp.organization,
        description: opp.description,
        scope: opp.scope,
        type: opp.type,
        compensationType: opp.compensationType,
        compensationAmount: opp.compensationAmount,
        currency: opp.currency,
        deadline: opp.deadline,
        field: opp.field,
        requiredSkills: opp.requiredSkills.map((rs) => rs.skill.name),
        applicationCount: opp._count.applications,
        createdAt: opp.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOpportunityBySlug(slug: string) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      include: {
        field: true,
        requiredSkills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity '${slug}' not found.`);
    }

    return opp;
  }

  async apply(userId: string, opportunityId: string, input: ApplyOpportunityInput) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp || opp.status !== 'OPEN') {
      throw new NotFoundException('Opportunity is no longer accepting applications.');
    }

    const existingApp = await this.prisma.opportunityApplication.findUnique({
      where: { opportunityId_userId: { opportunityId, userId } },
    });

    if (existingApp) {
      throw new ConflictException('You have already submitted an application for this opportunity.');
    }

    const application = await this.prisma.$transaction(async (tx) => {
      const app = await tx.opportunityApplication.create({
        data: {
          opportunityId,
          userId,
          coverNote: input.coverNote.trim(),
          portfolioProjectIds: input.portfolioProjectIds,
          externalPortfolioLinks: input.externalPortfolioLinks,
          availableHoursPerWeek: input.availableHoursPerWeek,
          status: 'SUBMITTED',
        },
      });

      // Award XP (+100 XP)
      await tx.xPTransaction.create({
        data: {
          userId,
          amount: 100,
          action: 'OPPORTUNITY_APPLIED',
          refId: app.id,
        },
      });

      // Unlock Scale Contributor achievement
      const ach = await tx.achievement.findUnique({ where: { title: 'Scale Contributor' } });
      if (ach) {
        await tx.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: ach.id } },
          update: {},
          create: { userId, achievementId: ach.id },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: 'APPLICATION_STATUS',
          title: 'Application Submitted',
          message: `Your application for "${opp.title}" has been successfully recorded and queued for review.`,
          link: '/scale/my-applications',
        },
      });

      return app;
    });

    return application;
  }

  async getMyApplications(userId: string) {
    return this.prisma.opportunityApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        opportunity: {
          include: { field: true },
        },
        assignment: {
          include: { deliverables: true },
        },
      },
    });
  }

  async getMyAssignments(userId: string) {
    return this.prisma.assignment.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        opportunity: true,
        deliverables: { orderBy: { submittedAt: 'desc' } },
        compensationRecords: true,
      },
    });
  }

  async submitDeliverable(
    userId: string,
    assignmentId: string,
    input: { title: string; description?: string; pullRequestUrl?: string; fileUrl?: string },
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.userId !== userId) {
      throw new ForbiddenException('Assignment not found or not owned by you.');
    }

    const deliverable = await this.prisma.assignmentDeliverable.create({
      data: {
        assignmentId,
        title: input.title.trim(),
        description: input.description?.trim(),
        pullRequestUrl: input.pullRequestUrl || null,
        fileUrl: input.fileUrl || null,
      },
    });

    await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'UNDER_REVIEW' },
    });

    return deliverable;
  }

  async getLedger(userId: string) {
    const records = await this.prisma.compensationRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { assignment: { include: { opportunity: true } } },
    });

    const totalEarned = records
      .filter((r) => r.status === 'DISBURSED')
      .reduce((sum, r) => sum + r.amount, 0);

    const pending = records
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalDisbursed: totalEarned,
      pendingDisbursement: pending,
      records,
    };
  }
}


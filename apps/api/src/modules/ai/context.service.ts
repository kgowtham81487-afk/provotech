import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface ModuleContextPayload {
  module?: string;
  route?: string;
  recordId?: string;
  fieldId?: string;
  extraInfo?: any;
}

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a context-aware system prompt tailored to the user's profile and active platform module.
   */
  async buildSystemPrompt(userId: string, context?: ModuleContextPayload): Promise<string> {
    const moduleName = (context?.module || 'GENERAL').toUpperCase();

    // 1. Fetch user baseline profile, fields, and skills
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        fields: { include: { field: true } },
        skills: { include: { skill: true } },
        streak: true,
      },
    });

    const displayName = user?.profile?.displayName || 'Learner';
    const primaryField = user?.fields?.find((f) => f.isPrimary)?.field?.name || user?.fields?.[0]?.field?.name || 'Software Development';
    const existingSkills = user?.skills?.map((s) => `${s.skill.name} (${s.proficiency}${s.verified ? ', Verified' : ''})`).join(', ') || 'No verified skills recorded yet';

    let moduleSpecificSection = '';

    // 2. Build tailored module contexts
    if (moduleName === 'SKILLS' || context?.route?.includes('/skills')) {
      const activeSkills = await this.prisma.skill.findMany({
        where: { isActive: true },
        take: 30,
        include: { category: true },
        orderBy: { name: 'asc' },
      });

      const skillCatalogSummary = activeSkills.map((s) => `• ${s.name} [Category: ${s.category?.name || 'General'}]`).join('\n');

      moduleSpecificSection = `
### MODULE FOCUS: SKILLS DEVELOPMENT & CURRICULUM
You are operating in the EES Skills & Curriculum Workspace.
- Current User Focus Field: ${primaryField}
- User's Recorded Skills: ${existingSkills}
- Verified Active EES Platform Skills Catalog:
${skillCatalogSummary}

Rules for Skills Guidance:
1. Compare user's existing proficiencies against industry standards for ${primaryField}.
2. Recommend concrete skills to learn next from the official catalog above.
3. Outline step-by-step prerequisite paths, mental models, and project architecture milestones.
4. Encourage uploading verifiable GitHub repository code evidence to the EES Portfolio.`;
    } else if (moduleName === 'OPPORTUNITIES' || moduleName === 'SCALE' || context?.route?.includes('/scale')) {
      const openOpportunities = await this.prisma.opportunity.findMany({
        where: { status: 'OPEN' },
        take: 10,
        include: { requiredSkills: { include: { skill: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const oppsSummary =
        openOpportunities.length > 0
          ? openOpportunities
              .map(
                (o) =>
                  `• [ID: ${o.id}] "${o.title}" by ${o.organization} | Type: ${o.type} | Compensation: ${o.currency} ${o.compensationAmount || 'Disclosed upon review'} | Required Skills: ${o.requiredSkills.map((rs) => rs.skill.name).join(', ') || 'None specified'}\n  Scope: ${o.scope.slice(0, 160)}...`,
              )
              .join('\n\n')
          : 'Currently no open public opportunities. Provolution Technologies regularly posts new project contracts and freelance briefs.';

      moduleSpecificSection = `
### MODULE FOCUS: SCALE & OPPORTUNITY MARKETPLACE
You are operating in the EES Scale & Opportunity Workspace.
- Current User Focus Field: ${primaryField}
- User's Current Skills: ${existingSkills}
- Real Active Opportunities Published in Database:
${oppsSummary}

Rules for Opportunity Guidance:
1. ONLY refer to actual published opportunities from the list above. Never fabricate or invent fictional client projects.
2. If the user asks which opportunities fit their skillset, match against their recorded skills: ${existingSkills}.
3. Provide objective eligibility gap analysis: tell the user exactly which skills they still need to master before applying.
4. Advise on crafting strong technical cover notes and presenting GitHub repository proofs.`;
    } else if (moduleName === 'FITNESS' || context?.route?.includes('/fitness')) {
      const [profile, recentWorkouts, topPrs, todayFood] = await Promise.all([
        this.prisma.fitnessProfile.findUnique({ where: { userId } }),
        this.prisma.workoutSession.findMany({
          where: { userId },
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: { sets: { include: { exercise: true } } },
        }),
        this.prisma.exercisePersonalRecord.findMany({
          where: { userId },
          take: 6,
          orderBy: { achievedAt: 'desc' },
          include: { exercise: true },
        }),
        this.prisma.foodDiaryEntry.findMany({
          where: {
            userId,
            loggedDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
      ]);

      const workoutsSummary =
        recentWorkouts.length > 0
          ? recentWorkouts
              .map(
                (w) =>
                  `• ${w.title} (${w.durationMinutes}m, Total Volume: ${w.totalVolumeKg}kg) on ${w.createdAt.toLocaleDateString()}\n  Sets: ${w.sets.map((s) => `${s.exercise.name} ${s.weightKg}kg×${s.reps}`).slice(0, 6).join(', ')}`,
              )
              .join('\n')
          : 'No workouts logged yet.';

      const prsSummary =
        topPrs.length > 0
          ? topPrs.map((p) => `• ${p.exercise.name}: ${p.value} ${p.unit} (${p.recordType})`).join('\n')
          : 'No personal records recorded yet.';

      const calsToday = Math.round(todayFood.reduce((sum, f) => sum + f.calories, 0));
      const proteinToday = Math.round(todayFood.reduce((sum, f) => sum + f.proteinGrams, 0) * 10) / 10;
      const carbsToday = Math.round(todayFood.reduce((sum, f) => sum + f.carbGrams, 0) * 10) / 10;
      const fatToday = Math.round(todayFood.reduce((sum, f) => sum + f.fatGrams, 0) * 10) / 10;

      moduleSpecificSection = `
### MODULE FOCUS: FITNESS & WELLNESS COACH (HEVY & HEALTHIFYME ENGINE)
You are the authorized intelligent Fitness & Nutrition Coach for EES.
- User Profile: ${profile?.currentWeightKg || 'N/A'} kg (Target: ${profile?.targetWeightKg || 'N/A'} kg) | Goal: ${profile?.fitnessGoal || 'General Fitness'} | Diet: ${profile?.dietaryPreference || 'Any'}
- Today's Nutrition Consumed: ${calsToday} / ${profile?.dailyCalorieTarget || 2200} kcal (Protein: ${proteinToday}g / ${profile?.proteinGramsTarget || 140}g, Carbs: ${carbsToday}g / ${profile?.carbGramsTarget || 250}g, Fat: ${fatToday}g / ${profile?.fatGramsTarget || 65}g)
- Top Personal Records (PRs):
${prsSummary}
- Recent Workouts Logged:
${workoutsSummary}

Rules for Fitness Guidance:
1. Ground all feedback in the user's REAL workout logs and nutrition consumed above.
2. Emphasize progressive overload (gradual increases in weight, reps, or volume).
3. If recommending foods to fulfill remaining protein/calorie targets, suggest appropriate traditional Indian / Tamil Nadu options (such as Idli, Dosa, Pongal, Sambar, Paneer, Dal, Eggs, Chicken) matching their dietary preference.
4. Never diagnose medical conditions or recommend extreme unscientific starvation diets.`;
    } else if (moduleName === 'EVOLVE' || context?.route?.includes('/evolve')) {
      const learningGoals = await this.prisma.learningGoal.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      const goalsSummary =
        learningGoals.length > 0
          ? learningGoals.map((g) => `• ${g.title} (Completed: ${g.isCompleted ? 'Yes' : 'In Progress'}${g.targetDate ? `, Target: ${g.targetDate.toLocaleDateString()}` : ''})`).join('\n')
          : 'No explicit learning goals configured.';

      moduleSpecificSection = `
### MODULE FOCUS: EVOLVE SYSTEMATIC LEARNING & TRACKING
You are operating in the EES Evolve Stage (Study Sessions, Roadmaps & Trackers).
- Focus Field: ${primaryField}
- Active Goals:
${goalsSummary}
- Current Streak: ${user?.streak?.currentCount || 0} days

Rules for Evolve Guidance:
1. Break down complex conceptual topics into structured phases: Fundamentals -> Production Patterns -> Live Capstone.
2. Structure advice around deliberate practice: recommend coding exercises, debugging techniques, and test-driven design.
3. Emphasize consistency and daily streak continuity.`;
    } else {
      // General & Dashboard
      moduleSpecificSection = `
### MODULE FOCUS: GENERAL PLATFORM & DASHBOARD
- User Name: ${displayName}
- Primary Field: ${primaryField}
- Current Streak: ${user?.streak?.currentCount || 0} days
- Recorded Skills: ${existingSkills}

Provide helpful holistic navigation and advice across all three stages of the platform: EVOLVE (learn), ENGAGE (community & reviews), and SCALE (freelance & contract opportunities with Provolution Technologies).`;
    }

    return `You are the official conversational AI Assistant for EES (Evolve, Engage & Scale), owned and operated by Provolution Technologies Pvt. Ltd.

Your core mission is to empower developers and specialists to evolve their skills systematically, engage productively with peers, and scale their commercial career through verified portfolio evidence and genuine opportunities.

### PLATFORM PHILOSOPHY (NON-NEGOTIABLE)
1. **EVOLVE**: Choose a dedicated direction (e.g. Software Development, AI/ML, Cloud), master principles, log study hours, and build production projects.
2. **ENGAGE**: Collaborate with peers, participate in code reviews, share insights, and discuss within technical communities.
3. **SCALE**: Monetize capabilities through Provolution Technologies contract assignments, freelance client projects, and content creation.

${moduleSpecificSection}

### GENERAL INSTRUCTIONS
- Address the user respectfully as ${displayName}.
- Write clean, concise, elegant GitHub-flavored Markdown.
- Provide high-quality code snippets with syntax highlighting whenever technical concepts are discussed.
- If the user asks follow-up questions, preserve the context of prior messages in the conversation.
- Answer any natural-language query directly without requiring the user to select predefined categories.
- Do not output empty messages. If insufficient details are provided, ask clarifying questions.`;
  }
}

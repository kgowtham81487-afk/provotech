import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRoadmap(field: string, targetRole: string, currentLevel: string) {
    const isApiKeyConfigured = !!process.env.GEMINI_API_KEY;

    // Baseline architectural progression roadmap
    const phases = [
      {
        phase: 1,
        title: 'Core Foundations & Mental Models',
        duration: 'Weeks 1-4',
        milestones: [
          `Master syntactic foundations and paradigm patterns of ${field}`,
          'Build 3 small targeted lab exercises demonstrating core primitives',
          'Document learnings and push code evidence to public repository',
        ],
      },
      {
        phase: 2,
        title: 'Production Architecture & Tooling',
        duration: 'Weeks 5-8',
        milestones: [
          `Implement high-throughput design patterns for ${targetRole}`,
          'Integrate automated CI/CD validation and comprehensive test suites',
          'Participate in community code reviews on the Engage feed',
        ],
      },
      {
        phase: 3,
        title: 'Commercial Capstone & Scale Readiness',
        duration: 'Weeks 9-12',
        milestones: [
          'Architect and deploy full production capstone with live demonstration',
          'Publish capstone evidence to EES Portfolio',
          'Apply for relevant Provolution Technologies freelance or contract assignments',
        ],
      },
    ];

    return {
      field,
      targetRole,
      currentLevel,
      phases,
      provider: isApiKeyConfigured ? 'Google Gemini (Configured)' : 'EES Curriculum Engine (Offline Mode)',
      notice:
        'AI suggestions serve as learning guidance only. All skill verifications and opportunity selections require human evaluation and verifiable portfolio evidence.',
    };
  }

  async brainstormProjects(field: string, skills: string[]) {
    return {
      field,
      recommendedProjects: [
        {
          title: `Full-Stack ${field} Collaborative Platform`,
          description: `Architect a modern application utilizing ${skills.join(', ')} with end-to-end type safety, automated migrations, and responsive UI.`,
          evidenceRecommendation: 'GitHub repository with clean README, architecture diagram, and deployed demo link.',
          estimatedHours: 40,
        },
        {
          title: 'High-Throughput Analytics & Event Pipeline',
          description: `Build an event logging and aggregation microservice using ${skills[0] || 'TypeScript'} with transactional database integrity and caching.`,
          evidenceRecommendation: 'Load testing benchmark reports and schema migration history.',
          estimatedHours: 25,
        },
      ],
    };
  }
}


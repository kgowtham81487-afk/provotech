import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING EES DATABASE ---');

  // 1. Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Complete system access and platform governance' },
    { name: 'ADMIN', description: 'Platform administration and user management' },
    { name: 'MODERATOR', description: 'Community and content moderation' },
    { name: 'OPPORTUNITY_MANAGER', description: 'Manage Provolution opportunities and applications' },
    { name: 'CONTENT_EDITOR', description: 'Manage public articles, SEO guides, and AdSense content' },
    { name: 'SUPPORT', description: 'User assistance and inquiry handling' },
    { name: 'STANDARD_USER', description: 'Standard platform participant' },
    { name: 'USER', description: 'Standard platform participant (alias)' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log('✓ Roles seeded.');

  // 2. Initial Super Administrator Provisioning
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found in database.');
  }

  const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'gowthamk81487@gmail.com').toLowerCase().trim();
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Gowtham@123';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: initialAdminEmail },
    include: { roles: true },
  });

  if (!existingSuperAdmin) {
    console.log(`Creating initial Super Administrator: ${initialAdminEmail}`);
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(initialAdminPassword, saltRounds);

    const newAdmin = await prisma.user.create({
      data: {
        email: initialAdminEmail,
        passwordHash,
        emailVerified: new Date(),
        status: 'ACTIVE',
        profile: {
          create: {
            username: 'gowtham_superadmin',
            displayName: 'Gowtham (Super Admin)',
            bio: 'Principal Super Administrator for Provolution Technologies Pvt. Ltd.',
            isPublic: true,
          },
        },
        settings: {
          create: {
            emailNotifications: true,
            inAppNotifications: true,
            allowDirectMessages: true,
          },
        },
        roles: {
          create: {
            roleId: superAdminRole.id,
          },
        },
        streak: {
          create: {
            currentCount: 1,
            longestCount: 1,
            lastActiveAt: new Date(),
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: newAdmin.id,
        action: 'SUPER_ADMIN_BOOTSTRAP',
        entityType: 'User',
        entityId: newAdmin.id,
        metadata: {
          email: initialAdminEmail,
          role: 'SUPER_ADMIN',
          source: 'seed.ts',
        },
      },
    });

    console.log(`✓ Super Administrator created successfully: ${initialAdminEmail}`);
  } else {
    // If account exists, update its role safely WITHOUT overwriting existing password
    const hasSuperAdminRole = existingSuperAdmin.roles.some((r) => r.roleId === superAdminRole.id);
    if (!hasSuperAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: existingSuperAdmin.id,
          roleId: superAdminRole.id,
        },
      });
      console.log(`✓ Added SUPER_ADMIN role to existing account: ${initialAdminEmail}`);
    } else {
      console.log(`✓ Existing Super Administrator verified: ${initialAdminEmail} (password preserved)`);
    }

    if (existingSuperAdmin.status !== 'ACTIVE') {
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: { status: 'ACTIVE', emailVerified: new Date() },
      });
    }
  }

  // 3. Database-backed Feature Flags
  const featureFlags = [
    { key: 'GLOBAL_MAINTENANCE', name: 'Global Maintenance Mode', description: 'Locks down application for maintenance', isEnabled: false },
    { key: 'AUTHENTICATION', name: 'User Authentication', description: 'Enable login, register, password reset', isEnabled: true },
    { key: 'ONBOARDING', name: 'Guided Onboarding', description: 'Enforce multi-step goal and field setup', isEnabled: true },
    { key: 'EVOLVE', name: 'Evolve Skill Workspaces', description: 'Personal skill learning, tracking and roadmaps', isEnabled: true },
    { key: 'LEARNING_TRACKER', name: 'Study Session Tracker', description: 'Log hours, notes, and milestones', isEnabled: true },
    { key: 'FITNESS_TRACKER', name: 'Specialized Fitness Tracker', description: 'Workouts, sets, reps and PRs', isEnabled: true },
    { key: 'CONTENT_TRACKER', name: 'Content Creator Pipeline', description: 'Ideas, drafts, calendar, and publishing', isEnabled: true },
    { key: 'PROJECT_PORTFOLIO', name: 'Project & Portfolio Showcase', description: 'Git repos, demos, and evidence', isEnabled: true },
    { key: 'ENGAGE', name: 'Engage Social Network', description: 'Social feed, peer interactions, and posts', isEnabled: true },
    { key: 'SOCIAL_FEED', name: 'Field & Global Feeds', description: 'Posting, likes, and comments', isEnabled: true },
    { key: 'COMMUNITIES', name: 'Field Communities', description: 'Join, create, and discuss within communities', isEnabled: true },
    { key: 'MESSAGING', name: 'Direct 1-on-1 Messaging', description: 'Private secure conversations', isEnabled: true },
    { key: 'NOTIFICATIONS', name: 'Live Notifications', description: 'Persistent user alerts and status updates', isEnabled: true },
    { key: 'SCALE', name: 'Scale Opportunities', description: 'Provolution opportunities and value creation', isEnabled: true },
    { key: 'OPPORTUNITIES', name: 'Opportunity Marketplace', description: 'Browse and view open opportunities', isEnabled: true },
    { key: 'APPLICATIONS', name: 'Opportunity Applications', description: 'Submit and manage project applications', isEnabled: true },
    { key: 'ASSIGNMENTS', name: 'Contract Assignments', description: 'Deliverables and compensation milestones', isEnabled: true },
    { key: 'MONETIZATION', name: 'AdSense & Creator Monetization', description: 'Ad banners, ads.txt, and monetization', isEnabled: true },
    { key: 'AI_HUB', name: 'AI Hub Assistant Layer', description: 'AI guidance, roadmaps, and summaries', isEnabled: true },
    { key: 'AI_LEARNING_ASSISTANT', name: 'AI Learning Assistant', description: 'Curriculum explanation and Q&A', isEnabled: true },
    { key: 'AI_ROADMAP_GENERATOR', name: 'AI Roadmap Generator', description: 'Dynamic learning roadmap drafting', isEnabled: true },
    { key: 'AI_PROJECT_ASSISTANT', name: 'AI Project Assistant', description: 'Architecture brainstorming', isEnabled: true },
    { key: 'AI_CONTENT_ASSISTANT', name: 'AI Content Assistant', description: 'Content outlines and ideas', isEnabled: true },
    { key: 'GAMIFICATION', name: 'Gamification Engine', description: 'Server-side XP, levels, and badges', isEnabled: true },
    { key: 'BLOG', name: 'Editorial Knowledge Hub', description: 'Public SEO guides and technical articles', isEnabled: true },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { name: flag.name, description: flag.description },
      create: flag,
    });
  }
  console.log('✓ Platform feature flags initialized.');

  // 4. Platform Configurations
  const configs = [
    {
      category: 'AI',
      key: 'AI_CONFIG',
      value: {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        fallbackModel: 'gemini-1.5-flash',
        dailyRequestLimitPerUser: 50,
        rateLimitRpm: 15,
        timeoutMs: 15000,
        hasApiKeyConfigured: !!process.env.GEMINI_API_KEY,
      },
    },
    {
      category: 'SOCIAL',
      key: 'SOCIAL_CONFIG',
      value: {
        maxPostLength: 3000,
        maxMediaPerPost: 4,
        maxUploadSizeBytes: 10485760, // 10MB
        permittedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        isMediaUploadEnabled: true,
      },
    },
    {
      category: 'MESSAGING',
      key: 'MESSAGING_CONFIG',
      value: {
        maxMessageLength: 2000,
        antiSpamThresholdSeconds: 2,
        isDirectMessagingEnabled: true,
      },
    },
    {
      category: 'INFRASTRUCTURE',
      key: 'INFRASTRUCTURE_CONFIG',
      value: {
        publicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ees.provolution.com',
        backendApiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
        isEmailDeliveryConfigured: !!process.env.SMTP_HOST,
        smtpHost: process.env.SMTP_HOST ? 'Configured' : 'Not configured',
      },
    },
  ];

  for (const cfg of configs) {
    await prisma.platformConfig.upsert({
      where: { key: cfg.key },
      update: { category: cfg.category, value: cfg.value },
      create: cfg,
    });
  }
  console.log('✓ Platform configurations initialized.');

  // 5. Taxonomy Fields & Categories
  const fields = [
    {
      name: 'Software Development',
      slug: 'software-development',
      description: 'Full-stack software engineering, scalable architectures, APIs, and modern web applications.',
      icon: 'Code2',
      categories: [
        {
          name: 'Frontend Engineering',
          skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'State Management'],
        },
        {
          name: 'Backend & Systems',
          skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Prisma ORM', 'REST APIs', 'System Design'],
        },
      ],
    },
    {
      name: 'Artificial Intelligence & Machine Learning',
      slug: 'ai-ml',
      description: 'Machine learning workflows, deep neural networks, LLM fine-tuning, and RAG architectures.',
      icon: 'Brain',
      categories: [
        {
          name: 'Generative AI & LLMs',
          skills: ['Prompt Engineering', 'LangChain', 'Vector Databases', 'Model Fine-tuning'],
        },
        {
          name: 'ML Foundations',
          skills: ['Python', 'PyTorch', 'Data Analysis', 'Feature Engineering'],
        },
      ],
    },
    {
      name: 'Cybersecurity',
      slug: 'cybersecurity',
      description: 'Application security, penetration testing, threat hunting, and infrastructure hardening.',
      icon: 'ShieldAlert',
      categories: [
        {
          name: 'Application Security',
          skills: ['OWASP Top 10', 'Vulnerability Assessment', 'Secure Code Review'],
        },
        {
          name: 'Network & Cloud Defense',
          skills: ['Network Protocols', 'Linux Hardening', 'IAM Security'],
        },
      ],
    },
    {
      name: 'Cloud Computing & DevOps',
      slug: 'cloud-devops',
      description: 'CI/CD pipelines, containerization, cloud native architectures, and infrastructure as code.',
      icon: 'Cloud',
      categories: [
        {
          name: 'Cloud Infrastructure',
          skills: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform'],
        },
        {
          name: 'DevOps & Observability',
          skills: ['GitHub Actions', 'CI/CD Pipelines', 'Prometheus', 'Grafana'],
        },
      ],
    },
    {
      name: 'Fitness & Physical Development',
      slug: 'fitness-physical',
      description: 'Structured resistance training, metabolic conditioning, mobility, and healthy lifestyle habits.',
      icon: 'Dumbbell',
      categories: [
        {
          name: 'Strength & Hypertrophy',
          skills: ['Compound Lifting', 'Hypertrophy Periodization', 'Progressive Overload'],
        },
        {
          name: 'Conditioning & Health',
          skills: ['Zone 2 Cardio', 'Mobility & Recovery', 'Nutritional Tracking'],
        },
      ],
    },
    {
      name: 'Content Creation & Media',
      slug: 'content-creation',
      description: 'Technical writing, long-form video production, educational scripting, and personal branding.',
      icon: 'Sparkles',
      categories: [
        {
          name: 'Technical Writing',
          skills: ['Documentation', 'Blog Publishing', 'SEO Copywriting', 'Newsletters'],
        },
        {
          name: 'Multimedia Creation',
          skills: ['Video Editing', 'Scriptwriting', 'Audio Production'],
        },
      ],
    },
  ];

  for (const f of fields) {
    const fieldRecord = await prisma.field.upsert({
      where: { slug: f.slug },
      update: { name: f.name, description: f.description, icon: f.icon },
      create: {
        name: f.name,
        slug: f.slug,
        description: f.description,
        icon: f.icon,
        isActive: true,
        isApproved: true,
      },
    });

    for (const cat of f.categories) {
      const existingCategory = await prisma.skillCategory.findFirst({
        where: { fieldId: fieldRecord.id, name: cat.name },
      });

      const catRecord = existingCategory
        ? existingCategory
        : await prisma.skillCategory.create({
            data: {
              fieldId: fieldRecord.id,
              name: cat.name,
            },
          });

      for (const skillName of cat.skills) {
        const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await prisma.skill.upsert({
          where: { slug },
          update: { name: skillName },
          create: {
            categoryId: catRecord.id,
            name: skillName,
            slug,
          },
        });
      }
    }
  }
  console.log('✓ Taxonomy fields and skills seeded.');

  // 6. Fitness Exercises Catalog
  const exercises = [
    { name: 'Barbell Bench Press', muscleGroup: 'Chest' },
    { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
    { name: 'Barbell Back Squat', muscleGroup: 'Quads / Glutes' },
    { name: 'Conventional Deadlift', muscleGroup: 'Hamstrings / Lower Back' },
    { name: 'Overhead Shoulder Press', muscleGroup: 'Shoulders' },
    { name: 'Barbell Bent-Over Row', muscleGroup: 'Upper Back' },
    { name: 'Pull-Ups', muscleGroup: 'Lats' },
    { name: 'Dips', muscleGroup: 'Triceps / Chest' },
    { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
    { name: 'Plank', muscleGroup: 'Core' },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: { muscleGroup: ex.muscleGroup },
      create: ex,
    });
  }
  console.log('✓ Fitness exercises catalog seeded.');

  // 7. Initial Achievements
  const achievements = [
    {
      title: 'First Step',
      description: 'Complete your first learning session on EES.',
      badgeIcon: 'Compass',
      xpReward: 50,
    },
    {
      title: 'Project Builder',
      description: 'Publish your first completed project to your portfolio.',
      badgeIcon: 'Award',
      xpReward: 150,
    },
    {
      title: 'Community Voice',
      description: 'Share your first insight or project update in the Engage feed.',
      badgeIcon: 'MessageSquare',
      xpReward: 75,
    },
    {
      title: 'Consistent Evolver',
      description: 'Maintain an active 7-day learning streak.',
      badgeIcon: 'Flame',
      xpReward: 200,
    },
    {
      title: 'Scale Contributor',
      description: 'Submit an application for a Provolution Technologies opportunity.',
      badgeIcon: 'Briefcase',
      xpReward: 100,
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { title: ach.title },
      update: { description: ach.description, xpReward: ach.xpReward, badgeIcon: ach.badgeIcon },
      create: ach,
    });
  }
  console.log('✓ Achievements seeded.');

  // 8. Provolution Technologies Opportunities
  const softwareField = await prisma.field.findUnique({ where: { slug: 'software-development' } });
  if (softwareField) {
    await prisma.opportunity.upsert({
      where: { slug: 'full-stack-typescript-developer-provotech' },
      update: {},
      create: {
        fieldId: softwareField.id,
        title: 'Full-Stack TypeScript & Next.js Engineer (Contract)',
        slug: 'full-stack-typescript-developer-provotech',
        organization: 'Provolution Technologies Pvt. Ltd.',
        description:
          'Join the core Provolution engineering team to develop modular micro-frontends and high-throughput REST APIs.',
        scope:
          'Deliver 3 end-to-end full stack modules, write automated integration tests, and submit production-ready pull requests.',
        type: 'CONTRACT',
        compensationType: 'FIXED_PRICE',
        compensationAmount: 45000,
        currency: 'INR',
        status: 'OPEN',
      },
    });

    await prisma.opportunity.upsert({
      where: { slug: 'technical-writing-and-skill-curriculum-fellow' },
      update: {},
      create: {
        fieldId: softwareField.id,
        title: 'Technical Curriculum & Documentation Fellow',
        slug: 'technical-writing-and-skill-curriculum-fellow',
        organization: 'Provolution Technologies Pvt. Ltd.',
        description:
          'Author in-depth, hands-on learning roadmaps and technical guides for emerging developers on the EES ecosystem.',
        scope: 'Create 5 comprehensive project-based learning guides with code samples and architecture diagrams.',
        type: 'FREELANCE',
        compensationType: 'FIXED_PRICE',
        compensationAmount: 20000,
        currency: 'INR',
        status: 'OPEN',
      },
    });
  }
  console.log('✓ Provolution Opportunities seeded.');

  // 9. Monetization & AdSense Config
  const existingConfig = await prisma.monetizationConfiguration.findFirst();
  if (!existingConfig) {
    await prisma.monetizationConfiguration.create({
      data: {
        publisherId: 'ca-pub-PENDING_OWNER_CONFIG',
        adsTxtContent: 'google.com, pub-PENDING_OWNER_CONFIG, DIRECT, f08c47fec0942fa0',
        isAdSenseEnabled: false,
      },
    });
    console.log('✓ Monetization configuration initialized.');
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

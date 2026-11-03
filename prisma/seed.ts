import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
    { name: 'STANDARD_USER', description: 'Standard platform participant (legacy compatibility)' },
    { name: 'USER', description: 'Canonical standard platform participant' },
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

  // 6. Fitness Exercises Catalog (Verified Multi-Disciplinary Library)
  const exercises = [
    { name: 'Barbell Bench Press', category: 'CHEST', muscleGroup: 'Chest', secondaryMuscles: 'Triceps, Front Delts', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Lie on a flat bench, grip barbell slightly wider than shoulder width. Lower bar smoothly to mid-chest and drive back up.' },
    { name: 'Incline Dumbbell Press', category: 'CHEST', muscleGroup: 'Chest', secondaryMuscles: 'Upper Chest, Triceps', equipment: 'DUMBBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Set bench to 30-45 degrees. Press dumbbells upward smoothly until arms are extended.' },
    { name: 'Dips', category: 'CHEST', muscleGroup: 'Chest', secondaryMuscles: 'Triceps, Shoulders', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Lower your body on parallel bars with a slight forward torso lean, then press back to lockout.' },
    { name: 'Push-Ups', category: 'CHEST', muscleGroup: 'Chest', secondaryMuscles: 'Triceps, Core', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Standard pushup posture with straight spine and core braced. Touch chest near ground.' },
    { name: 'Barbell Deadlift', category: 'BACK', muscleGroup: 'Back', secondaryMuscles: 'Hamstrings, Glutes, Forearms', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'ADVANCED', instructions: 'Hips back, chest tall, maintain neutral spine while pulling barbell off floor to full hip extension.' },
    { name: 'Pull-Ups', category: 'BACK', muscleGroup: 'Back', secondaryMuscles: 'Biceps, Forearms', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Overhand grip on bar. Pull chest toward bar until chin clears bar height.' },
    { name: 'Lat Pulldown', category: 'BACK', muscleGroup: 'Back', secondaryMuscles: 'Biceps', equipment: 'CABLE', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Pull cable bar downward to upper chest, retracting shoulder blades.' },
    { name: 'Bent-Over Barbell Row', category: 'BACK', muscleGroup: 'Back', secondaryMuscles: 'Lats, Rhomboids, Biceps', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Hinge at hips with straight back. Pull barbell into lower abdomen.' },
    { name: 'Overhead Barbell Press', category: 'SHOULDERS', muscleGroup: 'Shoulders', secondaryMuscles: 'Triceps, Upper Chest', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Press barbell overhead from collarbone to full arm lockout without arching lower back.' },
    { name: 'Dumbbell Lateral Raise', category: 'SHOULDERS', muscleGroup: 'Shoulders', secondaryMuscles: 'Traps', equipment: 'DUMBBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Raise dumbbells outward to shoulder height with slight elbow bend.' },
    { name: 'Face Pulls', category: 'SHOULDERS', muscleGroup: 'Shoulders', secondaryMuscles: 'Rear Delts, Rotator Cuff', equipment: 'CABLE', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Pull rope attachment toward face, flaring elbows back and out.' },
    { name: 'Barbell Bicep Curl', category: 'BICEPS', muscleGroup: 'Biceps', secondaryMuscles: 'Forearms', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Keep elbows tucked to sides, curl barbell up toward shoulders.' },
    { name: 'Hammer Curl', category: 'BICEPS', muscleGroup: 'Biceps', secondaryMuscles: 'Brachialis, Forearms', equipment: 'DUMBBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Palms facing each other, curl dumbbells smoothly.' },
    { name: 'Tricep Rope Pushdown', category: 'TRICEPS', muscleGroup: 'Triceps', secondaryMuscles: 'None', equipment: 'CABLE', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Push cable downward and spread rope tips at bottom of movement.' },
    { name: 'Barbell Back Squat', category: 'QUADRICEPS', muscleGroup: 'Quadriceps', secondaryMuscles: 'Glutes, Core, Lower Back', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Squat hips back and down until thighs are parallel to ground, then drive up through mid-foot.' },
    { name: 'Leg Press', category: 'QUADRICEPS', muscleGroup: 'Quadriceps', secondaryMuscles: 'Glutes', equipment: 'MACHINE', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Press platform away smoothly without fully locking knees at peak.' },
    { name: 'Bulgarian Split Squat', category: 'QUADRICEPS', muscleGroup: 'Quadriceps', secondaryMuscles: 'Glutes, Calves', equipment: 'DUMBBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Rear foot elevated on bench, lower front thigh until parallel to floor.' },
    { name: 'Romanian Deadlift', category: 'HAMSTRINGS', muscleGroup: 'Hamstrings', secondaryMuscles: 'Glutes, Lower Back', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Hinge back at hips with soft knees, lowering bar along shins until hamstrings stretch.' },
    { name: 'Barbell Hip Thrust', category: 'GLUTES', muscleGroup: 'Glutes', secondaryMuscles: 'Hamstrings', equipment: 'BARBELL', exerciseType: 'WEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Upper back on bench, drive hips up to ceiling until torso and thighs form straight line.' },
    { name: 'Standing Calf Raise', category: 'CALVES', muscleGroup: 'Calves', secondaryMuscles: 'None', equipment: 'MACHINE', exerciseType: 'WEIGHT_REPS', difficulty: 'BEGINNER', instructions: 'Raise heels up onto toes, hold peak contraction, and lower slowly.' },
    { name: 'Hanging Leg Raise', category: 'CORE', muscleGroup: 'Core', secondaryMuscles: 'Hip Flexors', equipment: 'BODYWEIGHT', exerciseType: 'BODYWEIGHT_REPS', difficulty: 'INTERMEDIATE', instructions: 'Hang from pullup bar, raise legs up to 90 degrees without swinging.' },
    { name: 'Plank', category: 'CORE', muscleGroup: 'Core', secondaryMuscles: 'Shoulders, Glutes', equipment: 'BODYWEIGHT', exerciseType: 'DURATION', difficulty: 'BEGINNER', instructions: 'Hold straight pushup or forearm posture with braced abdomen.' },
    { name: 'Treadmill Running', category: 'CARDIO', muscleGroup: 'Full Body', secondaryMuscles: 'Legs, Heart', equipment: 'MACHINE', exerciseType: 'DISTANCE_DURATION', difficulty: 'BEGINNER', instructions: 'Cardiovascular endurance training on running belt.' },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {
        category: ex.category,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        exerciseType: ex.exerciseType,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
      },
      create: ex,
    });
  }
  console.log('✓ Fitness exercises catalog seeded (' + exercises.length + ' exercises).');

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

  // 10. AI Provider Configurations & Health Trackers
  const aiProviders = [
    {
      provider: 'GEMINI',
      name: 'Google Gemini',
      isEnabled: true,
      isPreferred: true,
      priority: 1,
      model: 'gemini-1.5-flash',
      timeoutMs: 30000,
      maxTokens: 2048,
      temperature: 0.7,
    },
    {
      provider: 'DEEPSEEK',
      name: 'DeepSeek',
      isEnabled: true,
      isPreferred: false,
      priority: 2,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      timeoutMs: 30000,
      maxTokens: 2048,
      temperature: 0.7,
    },
    {
      provider: 'GROQ',
      name: 'Groq',
      isEnabled: true,
      isPreferred: false,
      priority: 3,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      timeoutMs: 30000,
      maxTokens: 2048,
      temperature: 0.7,
    },
  ];

  for (const prov of aiProviders) {
    await prisma.aIProviderConfiguration.upsert({
      where: { provider: prov.provider },
      update: { name: prov.name, model: prov.model },
      create: prov,
    });

    await prisma.aIProviderHealth.upsert({
      where: { provider: prov.provider },
      update: {},
      create: {
        provider: prov.provider,
        isHealthy: true,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        consecutiveErrors: 0,
      },
    });
  }
  console.log('✓ AI Provider configurations seeded.');

  // 12. Indian & Tamil Nadu Food Database Seeding
  const foods = [
    { name: 'Idli (2 pieces)', category: 'MEALS', servingSize: 100, servingUnit: 'piece', calories: 130, proteinGrams: 4.2, carbGrams: 28, fatGrams: 0.4, fibreGrams: 2.5, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Plain Dosa', category: 'MEALS', servingSize: 100, servingUnit: 'piece', calories: 168, proteinGrams: 3.8, carbGrams: 29, fatGrams: 3.7, fibreGrams: 1.2, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Masala Dosa', category: 'MEALS', servingSize: 150, servingUnit: 'piece', calories: 245, proteinGrams: 5.2, carbGrams: 38, fatGrams: 8.5, fibreGrams: 3.0, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Ven Pongal (1 cup)', category: 'MEALS', servingSize: 150, servingUnit: 'cup', calories: 220, proteinGrams: 6.5, carbGrams: 34, fatGrams: 7.0, fibreGrams: 3.0, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'South Indian Sambar (1 cup)', category: 'MEALS', servingSize: 200, servingUnit: 'cup', calories: 130, proteinGrams: 5.0, carbGrams: 22, fatGrams: 2.5, fibreGrams: 4.5, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Coconut Chutney (2 tbsp)', category: 'SNACKS', servingSize: 40, servingUnit: 'tbsp', calories: 95, proteinGrams: 1.0, carbGrams: 3.0, fatGrams: 9.0, fibreGrams: 1.5, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Medu Vada (1 piece)', category: 'SNACKS', servingSize: 50, servingUnit: 'piece', calories: 145, proteinGrams: 4.5, carbGrams: 15, fatGrams: 7.5, fibreGrams: 2.0, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Curd Rice (1 bowl)', category: 'MEALS', servingSize: 200, servingUnit: 'bowl', calories: 240, proteinGrams: 6.5, carbGrams: 38, fatGrams: 7.0, fibreGrams: 1.5, isIndianTraditional: true, region: 'South Indian' },
    { name: 'Rasam (1 cup)', category: 'BEVERAGES', servingSize: 150, servingUnit: 'cup', calories: 60, proteinGrams: 1.8, carbGrams: 9.0, fatGrams: 1.5, fibreGrams: 1.2, isIndianTraditional: true, region: 'Tamil Nadu' },
    { name: 'Cooked White Rice (1 cup)', category: 'GRAINS', servingSize: 150, servingUnit: 'cup', calories: 195, proteinGrams: 4.0, carbGrams: 44, fatGrams: 0.4, fibreGrams: 0.6, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Brown Rice (1 cup)', category: 'GRAINS', servingSize: 150, servingUnit: 'cup', calories: 165, proteinGrams: 3.5, carbGrams: 35, fatGrams: 1.5, fibreGrams: 2.5, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Whole Wheat Chapati / Roti', category: 'GRAINS', servingSize: 40, servingUnit: 'piece', calories: 104, proteinGrams: 3.2, carbGrams: 20, fatGrams: 1.2, fibreGrams: 3.5, isIndianTraditional: true, region: 'North Indian' },
    { name: 'Dal Tadka / Yellow Dal', category: 'PROTEIN', servingSize: 180, servingUnit: 'cup', calories: 165, proteinGrams: 9.0, carbGrams: 24, fatGrams: 3.5, fibreGrams: 5.0, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Paneer (Raw Cottage Cheese)', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', calories: 265, proteinGrams: 18.5, carbGrams: 4.0, fatGrams: 20.0, fibreGrams: 0.0, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Palak Paneer', category: 'MEALS', servingSize: 200, servingUnit: 'cup', calories: 230, proteinGrams: 12.0, carbGrams: 8.0, fatGrams: 16.0, fibreGrams: 4.0, isIndianTraditional: true, region: 'North Indian' },
    { name: 'Boiled Whole Egg', category: 'PROTEIN', servingSize: 50, servingUnit: 'piece', calories: 72, proteinGrams: 6.3, carbGrams: 0.4, fatGrams: 4.8, fibreGrams: 0.0, isIndianTraditional: false, region: null },
    { name: 'Egg Whites (100g)', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', calories: 52, proteinGrams: 11.0, carbGrams: 0.7, fatGrams: 0.2, fibreGrams: 0.0, isIndianTraditional: false, region: null },
    { name: 'Grilled Chicken Breast', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', calories: 165, proteinGrams: 31.0, carbGrams: 0.0, fatGrams: 3.6, fibreGrams: 0.0, isIndianTraditional: false, region: null },
    { name: 'South Indian Chicken Curry', category: 'MEALS', servingSize: 200, servingUnit: 'cup', calories: 260, proteinGrams: 24.0, carbGrams: 6.0, fatGrams: 15.0, fibreGrams: 2.0, isIndianTraditional: true, region: 'South Indian' },
    { name: 'Soya Chunks (dry 50g)', category: 'PROTEIN', servingSize: 50, servingUnit: 'g', calories: 172, proteinGrams: 26.0, carbGrams: 16.0, fatGrams: 0.5, fibreGrams: 6.5, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Tofu (Firm)', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', calories: 76, proteinGrams: 8.0, carbGrams: 1.9, fatGrams: 4.8, fibreGrams: 1.2, isIndianTraditional: false, region: null },
    { name: 'Curd / Plain Yogurt', category: 'DAIRY', servingSize: 150, servingUnit: 'cup', calories: 90, proteinGrams: 5.5, carbGrams: 7.0, fatGrams: 4.5, fibreGrams: 0.0, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Cow Milk (1 glass)', category: 'DAIRY', servingSize: 200, servingUnit: 'ml', calories: 122, proteinGrams: 6.4, carbGrams: 9.6, fatGrams: 6.5, fibreGrams: 0.0, isIndianTraditional: true, region: 'Pan-Indian' },
    { name: 'Banana (1 medium)', category: 'FRUITS', servingSize: 118, servingUnit: 'piece', calories: 105, proteinGrams: 1.3, carbGrams: 27, fatGrams: 0.3, fibreGrams: 3.1, isIndianTraditional: false, region: null },
    { name: 'Apple (1 medium)', category: 'FRUITS', servingSize: 150, servingUnit: 'piece', calories: 78, proteinGrams: 0.4, carbGrams: 20, fatGrams: 0.2, fibreGrams: 3.6, isIndianTraditional: false, region: null },
    { name: 'Rolled Oats (dry)', category: 'GRAINS', servingSize: 40, servingUnit: 'g', calories: 150, proteinGrams: 5.0, carbGrams: 27, fatGrams: 2.5, fibreGrams: 4.0, isIndianTraditional: false, region: null },
  ];

  for (const f of foods) {
    await prisma.food.upsert({
      where: { name: f.name },
      update: {
        category: f.category,
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        calories: f.calories,
        proteinGrams: f.proteinGrams,
        carbGrams: f.carbGrams,
        fatGrams: f.fatGrams,
        fibreGrams: f.fibreGrams,
        isIndianTraditional: f.isIndianTraditional,
        region: f.region,
      },
      create: f,
    });
  }
  console.log('✓ Food database seeded (' + foods.length + ' items, including Tamil Nadu & Indian staples).');

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

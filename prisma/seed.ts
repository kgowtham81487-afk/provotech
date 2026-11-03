import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING EES DATABASE ---');

  // 1. Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Complete system access' },
    { name: 'ADMIN', description: 'Platform administration and user management' },
    { name: 'MODERATOR', description: 'Community and content moderation' },
    { name: 'OPPORTUNITY_MANAGER', description: 'Manage Provolution opportunities and applications' },
    { name: 'CONTENT_EDITOR', description: 'Manage public articles, SEO guides, and AdSense content' },
    { name: 'USER', description: 'Standard platform participant' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log('✓ Roles seeded.');

  // 2. Taxonomy Fields & Categories
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

  // 3. Fitness Exercises Catalog
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

  // 4. Initial Achievements
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

  // 5. Initial Provolution Technologies Opportunities
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

  // 6. Monetization & AdSense Config
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

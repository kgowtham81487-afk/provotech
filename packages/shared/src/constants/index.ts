export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  OPPORTUNITY_MANAGER: 'OPPORTUNITY_MANAGER',
  CONTENT_EDITOR: 'CONTENT_EDITOR',
  SUPPORT: 'SUPPORT',
  STANDARD_USER: 'STANDARD_USER',
  USER: 'USER',
} as const;

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const STAGES = {
  EVOLVE: 'EVOLVE',
  ENGAGE: 'ENGAGE',
  SCALE: 'SCALE',
} as const;

export type StageType = (typeof STAGES)[keyof typeof STAGES];

export const FEATURE_FLAGS = {
  GLOBAL_MAINTENANCE: 'GLOBAL_MAINTENANCE',
  AUTHENTICATION: 'AUTHENTICATION',
  ONBOARDING: 'ONBOARDING',
  EVOLVE: 'EVOLVE',
  SKILLS: 'SKILLS',
  LEARNING_TRACKER: 'LEARNING_TRACKER',
  FITNESS_TRACKER: 'FITNESS_TRACKER',
  CONTENT_TRACKER: 'CONTENT_TRACKER',
  PROJECT_PORTFOLIO: 'PROJECT_PORTFOLIO',
  ENGAGE: 'ENGAGE',
  SOCIAL_FEED: 'SOCIAL_FEED',
  COMMUNITIES: 'COMMUNITIES',
  MESSAGING: 'MESSAGING',
  NOTIFICATIONS: 'NOTIFICATIONS',
  SCALE: 'SCALE',
  OPPORTUNITIES: 'OPPORTUNITIES',
  APPLICATIONS: 'APPLICATIONS',
  ASSIGNMENTS: 'ASSIGNMENTS',
  MONETIZATION: 'MONETIZATION',
  AI_HUB: 'AI_HUB',
  AI_LEARNING_ASSISTANT: 'AI_LEARNING_ASSISTANT',
  AI_ROADMAP_GENERATOR: 'AI_ROADMAP_GENERATOR',
  AI_PROJECT_ASSISTANT: 'AI_PROJECT_ASSISTANT',
  AI_CONTENT_ASSISTANT: 'AI_CONTENT_ASSISTANT',
  GAMIFICATION: 'GAMIFICATION',
  BLOG: 'BLOG',
} as const;

export const DEFAULT_FIELDS = [
  {
    name: 'Software Development',
    slug: 'software-development',
    description: 'Full-stack engineering, algorithms, system design, and production software architecture.',
    icon: 'Code2',
    categories: ['Frontend Development', 'Backend Engineering', 'Mobile Apps', 'DevOps & Systems'],
  },
  {
    name: 'Artificial Intelligence & Machine Learning',
    slug: 'ai-ml',
    description: 'Deep learning, neural networks, LLMs, prompt engineering, and production ML pipelines.',
    icon: 'Brain',
    categories: ['Foundation Models', 'MLOps', 'Computer Vision', 'NLP'],
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Ethical hacking, application security, cloud defense, and red/blue team operations.',
    icon: 'ShieldAlert',
    categories: ['AppSec', 'Network Defense', 'Penetration Testing', 'Cloud Security'],
  },
  {
    name: 'Cloud Computing & DevOps',
    slug: 'cloud-devops',
    description: 'Infrastructure as Code, Kubernetes, CI/CD pipelines, and high-availability systems.',
    icon: 'Cloud',
    categories: ['Containers & Orchestration', 'CI/CD Automation', 'IaC & Terraform', 'Cloud Architecture'],
  },
  {
    name: 'Fitness & Physical Development',
    slug: 'fitness-physical',
    description: 'Strength training, hypertrophy, conditioning, mobility, and physical discipline.',
    icon: 'Dumbbell',
    categories: ['Strength Training', 'Conditioning', 'Mobility & Recovery', 'Nutrition & Longevity'],
  },
  {
    name: 'Content Creation & Media',
    slug: 'content-creation',
    description: 'Digital storytelling, video production, copywriting, brand building, and newsletter publishing.',
    icon: 'Sparkles',
    categories: ['Video Production', 'Technical Writing', 'Social Media Strategy', 'Podcasting'],
  },
  {
    name: 'UI/UX & Product Design',
    slug: 'ui-ux-design',
    description: 'Design systems, user research, wireframing, typography, and interactive prototyping.',
    icon: 'Palette',
    categories: ['Design Systems', 'User Research', 'Prototyping', 'Visual Design'],
  },
  {
    name: 'Business & Entrepreneurship',
    slug: 'business-entrepreneurship',
    description: 'Venture creation, product strategy, unit economics, fundraising, and go-to-market.',
    icon: 'Briefcase',
    categories: ['Product Strategy', 'Financial Modeling', 'Sales & Growth', 'Operations'],
  },
] as const;

export const OPPORTUNITY_TYPES = {
  FREELANCE: 'FREELANCE',
  CONTRACT: 'CONTRACT',
  INTERNSHIP: 'INTERNSHIP',
  BOUNTY: 'BOUNTY',
  FULL_TIME: 'FULL_TIME',
} as const;

export const COMPENSATION_TYPES = {
  FIXED_PRICE: 'FIXED_PRICE',
  HOURLY_RATE: 'HOURLY_RATE',
  STIPEND: 'STIPEND',
  UNPAID_LEARNING: 'UNPAID_LEARNING',
} as const;

export const APPLICATION_STATUS = {
  SUBMITTED: 'SUBMITTED',
  SHORTLISTED: 'SHORTLISTED',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export const ASSIGNMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  UNDER_REVIEW: 'UNDER_REVIEW',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED',
} as const;

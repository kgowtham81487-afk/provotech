import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain alphanumeric characters and underscores.' }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const OnboardingFieldSelectSchema = z.object({
  primaryFieldId: z.string().uuid({ message: 'Primary field must be a valid field UUID.' }),
  secondaryFieldId: z.string().uuid().optional().nullable(),
  initialProficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  weeklyTargetHours: z.number().min(1).max(80).default(5),
  primaryGoal: z.string().max(250).optional(),
});

export type OnboardingFieldSelectInput = z.infer<typeof OnboardingFieldSelectSchema>;

export const CreatePostSchema = z.object({
  content: z.string().min(1, { message: 'Post content cannot be empty.' }).max(3000),
  fieldId: z.string().uuid().optional().nullable(),
  mediaUrls: z.array(z.string().url()).max(4).default([]),
  hashtags: z.array(z.string()).default([]),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  fieldId: z.string().uuid().optional().nullable(),
  techTags: z.array(z.string()).min(1, { message: 'Select at least one technology or skill tag.' }),
  repoUrl: z.string().url().optional().or(z.literal('')),
  liveUrl: z.string().url().optional().or(z.literal('')),
  evidenceUrls: z.array(z.string().url()).default([]),
  isPublic: z.boolean().default(true),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const ApplyOpportunitySchema = z.object({
  coverNote: z.string().min(30, { message: 'Please provide a substantive cover statement (min 30 characters).' }),
  portfolioProjectIds: z.array(z.string().uuid()).default([]),
  externalPortfolioLinks: z.array(z.string().url()).default([]),
  availableHoursPerWeek: z.number().min(1).max(60),
});

export type ApplyOpportunityInput = z.infer<typeof ApplyOpportunitySchema>;

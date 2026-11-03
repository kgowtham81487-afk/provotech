import { z } from 'zod';
import { USER_ROLES } from '../constants/index.js';

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

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Enter a valid registered email address.' }),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required.' }),
  newPassword: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

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

export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

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

export const CreateLearningSessionSchema = z.object({
  title: z.string().min(2).max(150),
  durationMinutes: z.number().min(5).max(720),
  goalId: z.string().uuid().optional().nullable(),
  notes: z.string().max(3000).optional(),
});

export type CreateLearningSessionInput = z.infer<typeof CreateLearningSessionSchema>;

export const CreateWorkoutSchema = z.object({
  title: z.string().min(2).max(120),
  durationMinutes: z.number().min(5).max(360),
  notes: z.string().max(1000).optional(),
  sets: z
    .array(
      z.object({
        exerciseName: z.string().min(1),
        setNumber: z.number().min(1),
        reps: z.number().min(1).max(100),
        weightKg: z.number().min(0).max(600),
        rpe: z.number().min(1).max(10).optional(),
      }),
    )
    .min(1, { message: 'Record at least one set.' }),
});

export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;

export const CreateContentIdeaSchema = z.object({
  title: z.string().min(3).max(200),
  targetPlatform: z.enum(['YOUTUBE', 'LINKEDIN', 'X', 'SUBSTACK', 'BLOG', 'CUSTOM']),
  status: z.enum(['IDEA', 'DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED']).default('IDEA'),
  publishedUrl: z.string().url().optional().or(z.literal('')),
});

export type CreateContentIdeaInput = z.infer<typeof CreateContentIdeaSchema>;

export const CreateCommunitySchema = z.object({
  name: z.string().min(3).max(60),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(1000),
  fieldId: z.string().uuid().optional().nullable(),
  isPrivate: z.boolean().default(false),
});

export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;

export const SendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const ApplyOpportunitySchema = z.object({
  coverNote: z.string().min(30, { message: 'Please provide a substantive cover statement (min 30 characters).' }),
  portfolioProjectIds: z.array(z.string().uuid()).default([]),
  externalPortfolioLinks: z.array(z.string().url()).default([]),
  availableHoursPerWeek: z.number().min(1).max(60),
});

export type ApplyOpportunityInput = z.infer<typeof ApplyOpportunitySchema>;

export const CreateOpportunitySchema = z.object({
  title: z.string().min(5).max(150),
  slug: z.string().min(5).max(150).regex(/^[a-z0-9-]+$/),
  fieldId: z.string().uuid().optional().nullable(),
  description: z.string().min(20),
  scope: z.string().min(20),
  type: z.enum(['FREELANCE', 'CONTRACT', 'INTERNSHIP', 'BOUNTY', 'FULL_TIME']),
  compensationType: z.enum(['FIXED_PRICE', 'HOURLY_RATE', 'STIPEND', 'UNPAID_LEARNING']),
  compensationAmount: z.number().positive().optional(),
  currency: z.string().default('INR'),
  requiredSkillIds: z.array(z.string().uuid()).default([]),
});

export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;

// Admin Schemas
export const AdminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'OPPORTUNITY_MANAGER', 'CONTENT_EDITOR', 'SUPPORT', 'USER', 'STANDARD_USER']),
});

export type AdminCreateUserInput = z.infer<typeof AdminCreateUserSchema>;

export const AdminChangeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'OPPORTUNITY_MANAGER', 'CONTENT_EDITOR', 'SUPPORT', 'USER', 'STANDARD_USER']),
});

export type AdminChangeRoleInput = z.infer<typeof AdminChangeRoleSchema>;

export const AdminUpdateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
  reason: z.string().optional(),
});

export type AdminUpdateStatusInput = z.infer<typeof AdminUpdateStatusSchema>;

export const AdminFeatureFlagUpdateSchema = z.object({
  key: z.string(),
  isEnabled: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

export type AdminFeatureFlagUpdateInput = z.infer<typeof AdminFeatureFlagUpdateSchema>;

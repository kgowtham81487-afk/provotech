import { USER_ROLES, STAGES, OPPORTUNITY_TYPES, COMPENSATION_TYPES, APPLICATION_STATUS, ASSIGNMENT_STATUS } from '../constants/index.js';

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  primaryFieldId?: string | null;
  secondaryFieldId?: string | null;
  xp: number;
  level: number;
  streakDays: number;
  createdAt: string;
}

export interface FieldSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  categoryCount?: number;
  skillsCount?: number;
  activeLearnersCount?: number;
}

export interface LearningSessionDto {
  id: string;
  goalId?: string;
  title: string;
  durationMinutes: number;
  notes?: string;
  xpEarned: number;
  createdAt: string;
}

export interface WorkoutDto {
  id: string;
  title: string;
  durationMinutes: number;
  notes?: string;
  sets: {
    exerciseName: string;
    setNumber: number;
    reps: number;
    weightKg: number;
  }[];
  createdAt: string;
}

export interface ContentIdeaDto {
  id: string;
  title: string;
  targetPlatform: 'YOUTUBE' | 'LINKEDIN' | 'X' | 'SUBSTACK' | 'BLOG' | 'CUSTOM';
  status: 'IDEA' | 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED';
  publishedUrl?: string;
  createdAt: string;
}

export interface ProjectDto {
  id: string;
  title: string;
  description: string;
  repoUrl?: string;
  liveUrl?: string;
  techTags: string[];
  evidenceUrls: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface PostDto {
  id: string;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  content: string;
  mediaUrls: string[];
  fieldId?: string | null;
  fieldName?: string | null;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
}

export interface OpportunityDto {
  id: string;
  title: string;
  slug: string;
  organization: string;
  description: string;
  scope: string;
  type: keyof typeof OPPORTUNITY_TYPES;
  compensationType: keyof typeof COMPENSATION_TYPES;
  compensationAmount?: number;
  currency: string;
  requiredSkills: string[];
  deadline?: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED';
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

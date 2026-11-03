export interface LogWorkoutSetDto {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  setType?: 'WARMUP' | 'NORMAL' | 'DROPSET' | 'FAILURE';
  isCompleted?: boolean;
  durationSeconds?: number;
  distanceMeters?: number;
}

export interface LogWorkoutDto {
  planId?: string;
  title: string;
  durationMinutes: number;
  notes?: string;
  sets: LogWorkoutSetDto[];
}

export interface CreateWorkoutPlanExerciseDto {
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe?: number;
  restSeconds?: number;
  notes?: string;
}

export interface CreateWorkoutPlanDto {
  title: string;
  description?: string;
  splitType?: string;
  scheduleDays?: string[];
  exercises: CreateWorkoutPlanExerciseDto[];
}

export interface UpdateWorkoutPlanDto {
  title?: string;
  description?: string;
  splitType?: string;
  scheduleDays?: string[];
  isActive?: boolean;
  exercises?: CreateWorkoutPlanExerciseDto[];
}

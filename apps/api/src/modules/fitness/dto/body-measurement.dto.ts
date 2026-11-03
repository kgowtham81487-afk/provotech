export interface LogBodyMeasurementDto {
  weightKg?: number;
  heightCm?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armsCm?: number;
  forearmsCm?: number;
  thighsCm?: number;
  calvesCm?: number;
  neckCm?: number;
  bodyFatPercentage?: number;
  notes?: string;
  recordedAt?: string;
}

export interface LogActivityDto {
  activityType: string;
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned?: number;
  stepCount?: number;
  sleepHours?: number;
  isRestDay?: boolean;
  notes?: string;
  activityDate?: string;
}

export interface CreateFitnessGoalDto {
  title: string;
  targetType: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
}

export interface UpdateFitnessGoalDto {
  title?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
  isAchieved?: boolean;
}


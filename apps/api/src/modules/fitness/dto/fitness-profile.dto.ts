export interface UpdateFitnessProfileDto {
  age?: number;
  gender?: string;
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  dietaryPreference?: string;
  dailyCalorieTarget?: number;
  proteinGramsTarget?: number;
  carbGramsTarget?: number;
  fatGramsTarget?: number;
  waterMlTarget?: number;
  restTimerSeconds?: number;
  autoStartTimer?: boolean;
  unitSystem?: string;
  onboardingCompleted?: boolean;
}

export interface OnboardingFitnessDto {
  age: number;
  gender: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  activityLevel: string;
  fitnessGoal: string;
  dietaryPreference?: string;
  customCalorieTarget?: number;
}


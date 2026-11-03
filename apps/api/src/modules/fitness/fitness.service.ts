import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateFitnessProfileDto,
  OnboardingFitnessDto,
} from './dto/fitness-profile.dto';
import {
  LogWorkoutDto,
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
} from './dto/workout.dto';
import {
  LogFoodDiaryEntryDto,
  LogWaterDto,
  CreateCustomFoodDto,
} from './dto/nutrition.dto';
import {
  LogBodyMeasurementDto,
  LogActivityDto,
  CreateFitnessGoalDto,
  UpdateFitnessGoalDto,
} from './dto/body-measurement.dto';

@Injectable()
export class FitnessService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // PROFILE & ONBOARDING (BMR/TDEE CALCULATIONS)
  // ==========================================

  /**
   * Calculates estimated TDEE and recommended macros using the Mifflin-St Jeor formula.
   */
  calculateTdeeAndMacros(params: {
    age: number;
    gender: string;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    fitnessGoal: string;
  }) {
    const { age, gender, heightCm, weightKg, activityLevel, fitnessGoal } = params;

    // 1. Basal Metabolic Rate (BMR) via Mifflin-St Jeor
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender?.toUpperCase() === 'MALE') {
      bmr += 5;
    } else if (gender?.toUpperCase() === 'FEMALE') {
      bmr -= 161;
    } else {
      bmr -= 78; // average baseline
    }

    // 2. Physical Activity Level Multiplier
    const multipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      VERY_ACTIVE: 1.725,
      EXTRA_ACTIVE: 1.9,
    };
    const factor = multipliers[activityLevel?.toUpperCase()] || 1.55;
    const maintenanceTdee = Math.round(bmr * factor);

    // 3. Goal Adjustment
    let targetCalories = maintenanceTdee;
    if (fitnessGoal === 'MUSCLE_GAIN') {
      targetCalories += 300;
    } else if (fitnessGoal === 'FAT_LOSS') {
      targetCalories = Math.max(1200, targetCalories - 450);
    } else if (fitnessGoal === 'ATHLETIC_PERFORMANCE') {
      targetCalories += 200;
    }

    // 4. Macro Splits (High protein priority for strength & recovery)
    // Protein: ~2.0g per kg of bodyweight
    const proteinGrams = Math.round(Math.min(weightKg * 2.0, targetCalories * 0.35 / 4));
    // Fat: ~25% of total calories
    const fatGrams = Math.round((targetCalories * 0.25) / 9);
    // Carbs: Remainder of calories
    const remainingCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
    const carbGrams = Math.max(50, Math.round(remainingCalories / 4));

    // 5. Hydration Target (~35ml per kg of body weight)
    const waterMl = Math.max(2500, Math.round(weightKg * 35));

    return {
      bmr: Math.round(bmr),
      maintenanceTdee,
      dailyCalorieTarget: targetCalories,
      proteinGramsTarget: proteinGrams,
      carbGramsTarget: carbGrams,
      fatGramsTarget: fatGrams,
      waterMlTarget: waterMl,
    };
  }

  async getProfile(userId: string) {
    let profile = await this.prisma.fitnessProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.fitnessProfile.create({
        data: {
          userId,
          dailyCalorieTarget: 2200,
          proteinGramsTarget: 140,
          carbGramsTarget: 250,
          fatGramsTarget: 65,
          waterMlTarget: 3000,
          restTimerSeconds: 90,
          onboardingCompleted: false,
        },
      });
    }

    return profile;
  }

  async completeOnboarding(userId: string, input: OnboardingFitnessDto) {
    const targets = this.calculateTdeeAndMacros({
      age: input.age,
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.currentWeightKg,
      activityLevel: input.activityLevel,
      fitnessGoal: input.fitnessGoal,
    });

    const calorieTarget = input.customCalorieTarget || targets.dailyCalorieTarget;

    const profile = await this.prisma.fitnessProfile.upsert({
      where: { userId },
      update: {
        age: input.age,
        gender: input.gender,
        heightCm: input.heightCm,
        currentWeightKg: input.currentWeightKg,
        targetWeightKg: input.targetWeightKg || null,
        activityLevel: input.activityLevel,
        fitnessGoal: input.fitnessGoal,
        dietaryPreference: input.dietaryPreference || 'NON_VEGETARIAN',
        dailyCalorieTarget: calorieTarget,
        proteinGramsTarget: targets.proteinGramsTarget,
        carbGramsTarget: targets.carbGramsTarget,
        fatGramsTarget: targets.fatGramsTarget,
        waterMlTarget: targets.waterMlTarget,
        onboardingCompleted: true,
      },
      create: {
        userId,
        age: input.age,
        gender: input.gender,
        heightCm: input.heightCm,
        currentWeightKg: input.currentWeightKg,
        targetWeightKg: input.targetWeightKg || null,
        activityLevel: input.activityLevel,
        fitnessGoal: input.fitnessGoal,
        dietaryPreference: input.dietaryPreference || 'NON_VEGETARIAN',
        dailyCalorieTarget: calorieTarget,
        proteinGramsTarget: targets.proteinGramsTarget,
        carbGramsTarget: targets.carbGramsTarget,
        fatGramsTarget: targets.fatGramsTarget,
        waterMlTarget: targets.waterMlTarget,
        onboardingCompleted: true,
      },
    });

    // Also record baseline measurement
    if (input.currentWeightKg) {
      await this.prisma.bodyMeasurement.create({
        data: {
          userId,
          weightKg: input.currentWeightKg,
          heightCm: input.heightCm,
          notes: 'Initial onboarding measurement',
        },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, input: UpdateFitnessProfileDto) {
    return this.prisma.fitnessProfile.upsert({
      where: { userId },
      update: input,
      create: {
        userId,
        ...input,
      },
    });
  }

  // ==========================================
  // DASHBOARD TELEMETRY (REAL USER DATA)
  // ==========================================

  async getDashboard(userId: string) {
    const profile = await this.getProfile(userId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      todayFoodEntries,
      todayWaterLogs,
      todayWorkouts,
      todayActivities,
      recentWorkouts,
      recentPrs,
      weightHistory,
      activeGoals,
      activePlans,
    ] = await Promise.all([
      this.prisma.foodDiaryEntry.findMany({
        where: {
          userId,
          loggedDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.waterLog.findMany({
        where: {
          userId,
          loggedDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.workoutSession.findMany({
        where: {
          userId,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
        include: {
          sets: { include: { exercise: true } },
        },
      }),
      this.prisma.activityLog.findMany({
        where: {
          userId,
          activityDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.workoutSession.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          sets: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exercisePersonalRecord.findMany({
        where: { userId },
        include: { exercise: true },
        orderBy: { achievedAt: 'desc' },
        take: 5,
      }),
      this.prisma.bodyMeasurement.findMany({
        where: {
          userId,
          recordedAt: { gte: thirtyDaysAgo },
          weightKg: { not: null },
        },
        orderBy: { recordedAt: 'asc' },
        select: { weightKg: true, recordedAt: true },
      }),
      this.prisma.fitnessGoal.findMany({
        where: { userId, isAchieved: false },
        take: 5,
      }),
      this.prisma.workoutPlan.findMany({
        where: { userId, isActive: true },
        include: {
          exercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } },
        },
      }),
    ]);

    // Nutrition aggregates for today
    const caloriesConsumed = Math.round(todayFoodEntries.reduce((sum, e) => sum + e.calories, 0));
    const proteinConsumed = Math.round(todayFoodEntries.reduce((sum, e) => sum + e.proteinGrams, 0) * 10) / 10;
    const carbsConsumed = Math.round(todayFoodEntries.reduce((sum, e) => sum + e.carbGrams, 0) * 10) / 10;
    const fatConsumed = Math.round(todayFoodEntries.reduce((sum, e) => sum + e.fatGrams, 0) * 10) / 10;
    const fibreConsumed = Math.round(todayFoodEntries.reduce((sum, e) => sum + e.fibreGrams, 0) * 10) / 10;

    // Water aggregate for today
    const waterConsumedMl = todayWaterLogs.reduce((sum, w) => sum + w.amountMl, 0);

    // Activity aggregates for today
    const stepsToday = todayActivities.reduce((sum, a) => sum + (a.stepCount || 0), 0);
    const caloriesBurnedToday = todayActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
    const sleepHoursToday = todayActivities.find((a) => a.sleepHours !== null)?.sleepHours || null;

    // Weekly stats
    const weeklyWorkoutsCompleted = recentWorkouts.length;
    const weeklyTotalVolumeKg = Math.round(recentWorkouts.reduce((sum, w) => sum + w.totalVolumeKg, 0));
    const weeklyWorkoutDurationMinutes = recentWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);

    return {
      profile,
      today: {
        date: now.toISOString(),
        hasCompletedWorkoutToday: todayWorkouts.length > 0,
        todayWorkouts,
        nutrition: {
          caloriesConsumed,
          calorieTarget: profile.dailyCalorieTarget,
          caloriesRemaining: Math.max(0, profile.dailyCalorieTarget - caloriesConsumed),
          proteinConsumed,
          proteinTarget: profile.proteinGramsTarget,
          carbsConsumed,
          carbsTarget: profile.carbGramsTarget,
          fatConsumed,
          fatTarget: profile.fatGramsTarget,
          fibreConsumed,
        },
        hydration: {
          waterConsumedMl,
          waterTargetMl: profile.waterMlTarget,
          percentage: Math.min(100, Math.round((waterConsumedMl / profile.waterMlTarget) * 100)),
        },
        activity: {
          steps: stepsToday,
          caloriesBurned: caloriesBurnedToday,
          sleepHours: sleepHoursToday,
        },
      },
      weekly: {
        workoutsCompleted: weeklyWorkoutsCompleted,
        totalVolumeKg: weeklyTotalVolumeKg,
        durationMinutes: weeklyWorkoutDurationMinutes,
        consistencyPercentage: Math.min(100, Math.round((weeklyWorkoutsCompleted / 4) * 100)),
      },
      recentPersonalRecords: recentPrs,
      weightTrend: weightHistory,
      goals: activeGoals,
      activePlans,
    };
  }

  // ==========================================
  // EXERCISES LIBRARY
  // ==========================================

  async listExercises(params: { search?: string; category?: string; equipment?: string; difficulty?: string }) {
    const where: any = { isActive: true };
    if (params.category && params.category !== 'ALL') {
      where.category = params.category.toUpperCase();
    }
    if (params.equipment && params.equipment !== 'ALL') {
      where.equipment = params.equipment.toUpperCase();
    }
    if (params.difficulty && params.difficulty !== 'ALL') {
      where.difficulty = params.difficulty.toUpperCase();
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { muscleGroup: { contains: params.search, mode: 'insensitive' } },
        { secondaryMuscles: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getExercise(id: string, userId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });
    if (!exercise) throw new NotFoundException('Exercise not found.');

    const [userPrs, recentSets] = await Promise.all([
      this.prisma.exercisePersonalRecord.findMany({
        where: { userId, exerciseId: id },
        orderBy: { achievedAt: 'desc' },
      }),
      this.prisma.workoutSet.findMany({
        where: {
          exerciseId: id,
          session: { userId },
        },
        include: { session: true },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    return {
      exercise,
      personalRecords: userPrs,
      history: recentSets,
    };
  }

  // ==========================================
  // WORKOUT LOGGING & PR AUTO-DETECTION
  // ==========================================

  /**
   * Estimates 1 Rep Max via the Brzycki formula: W * (36 / (37 - reps))
   */
  estimateOneRepMax(weightKg: number, reps: number): number {
    if (reps <= 0) return 0;
    if (reps === 1) return weightKg;
    if (reps > 15) return Math.round(weightKg * 1.4); // asymptote approximation
    return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10;
  }

  async logWorkout(userId: string, input: LogWorkoutDto) {
    if (!input.sets || input.sets.length === 0) {
      throw new BadRequestException('Workout must include at least one set.');
    }

    // 1. Calculate training volume: Sum(weightKg * reps)
    let totalVolumeKg = 0;
    for (const s of input.sets) {
      if (s.weightKg && s.reps) {
        totalVolumeKg += s.weightKg * s.reps;
      }
    }
    totalVolumeKg = Math.round(totalVolumeKg * 10) / 10;

    // 2. Persist session and sets in transaction
    const newPrsDetected: any[] = [];

    const session = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.workoutSession.create({
        data: {
          userId,
          title: input.title.trim() || 'Strength Training Session',
          planId: input.planId || null,
          durationMinutes: Math.max(1, Number(input.durationMinutes) || 45),
          notes: input.notes?.trim() || null,
          totalVolumeKg,
          sets: {
            create: input.sets.map((s, idx) => ({
              exerciseId: s.exerciseId,
              setNumber: s.setNumber || idx + 1,
              reps: Number(s.reps) || 0,
              weightKg: Number(s.weightKg) || 0,
              rpe: s.rpe ? Number(s.rpe) : null,
              setType: s.setType || 'NORMAL',
              isCompleted: s.isCompleted !== false,
              durationSeconds: s.durationSeconds ? Number(s.durationSeconds) : null,
              distanceMeters: s.distanceMeters ? Number(s.distanceMeters) : null,
            })),
          },
        },
        include: {
          sets: { include: { exercise: true } },
        },
      });

      // 3. Process each set to update Personal Records (PRs)
      for (const set of createdSession.sets) {
        if (!set.weightKg || !set.reps) continue;

        // A. Max Weight Record
        const existingMaxWeight = await tx.exercisePersonalRecord.findFirst({
          where: { userId, exerciseId: set.exerciseId, recordType: 'MAX_WEIGHT' },
        });

        if (!existingMaxWeight || set.weightKg > existingMaxWeight.value) {
          const pr = await tx.exercisePersonalRecord.create({
            data: {
              userId,
              exerciseId: set.exerciseId,
              recordType: 'MAX_WEIGHT',
              value: set.weightKg,
              unit: 'KG',
              workoutSetId: set.id,
            },
            include: { exercise: true },
          });
          newPrsDetected.push({
            type: 'MAX_WEIGHT',
            exerciseName: set.exercise.name,
            value: `${set.weightKg} kg`,
          });
        }

        // B. Estimated 1RM Record
        const estimated1Rm = this.estimateOneRepMax(set.weightKg, set.reps);
        const existing1Rm = await tx.exercisePersonalRecord.findFirst({
          where: { userId, exerciseId: set.exerciseId, recordType: 'ESTIMATED_1RM' },
        });

        if (!existing1Rm || estimated1Rm > existing1Rm.value) {
          await tx.exercisePersonalRecord.create({
            data: {
              userId,
              exerciseId: set.exerciseId,
              recordType: 'ESTIMATED_1RM',
              value: estimated1Rm,
              unit: 'KG',
              workoutSetId: set.id,
            },
          });
          newPrsDetected.push({
            type: 'ESTIMATED_1RM',
            exerciseName: set.exercise.name,
            value: `${estimated1Rm} kg`,
          });
        }
      }

      // Also award user gamification XP if XP table exists
      try {
        await (tx as any).xPTransaction.create({
          data: {
            userId,
            amount: 100,
            action: 'FITNESS_WORKOUT',
            refId: createdSession.id,
          },
        });
      } catch {
        // XP transaction optional
      }

      return createdSession;
    });

    return {
      session,
      totalVolumeKg,
      newPersonalRecords: newPrsDetected,
    };
  }

  async listWorkouts(userId: string, params: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sets: {
            include: { exercise: true },
            orderBy: { setNumber: 'asc' },
          },
          plan: true,
        },
      }),
      this.prisma.workoutSession.count({ where: { userId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWorkout(userId: string, id: string) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { setNumber: 'asc' },
        },
        plan: true,
      },
    });

    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Workout not found.');
    }
    return workout;
  }

  async deleteWorkout(userId: string, id: string) {
    const workout = await this.prisma.workoutSession.findUnique({ where: { id } });
    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Workout session not found.');
    }

    await this.prisma.workoutSession.delete({ where: { id } });
    return { message: 'Workout deleted successfully.' };
  }

  // ==========================================
  // WORKOUT PLANS & SPLITS (HEVY-INSPIRED)
  // ==========================================

  async createWorkoutPlan(userId: string, input: CreateWorkoutPlanDto) {
    return this.prisma.workoutPlan.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim(),
        splitType: input.splitType || 'CUSTOM',
        scheduleDays: input.scheduleDays || [],
        exercises: {
          create: input.exercises.map((e, idx) => ({
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex ?? idx,
            targetSets: e.targetSets || 3,
            targetRepsMin: e.targetRepsMin || 8,
            targetRepsMax: e.targetRepsMax || 12,
            targetRpe: e.targetRpe,
            restSeconds: e.restSeconds || 90,
            notes: e.notes?.trim(),
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async listWorkoutPlans(userId: string) {
    return this.prisma.workoutPlan.findMany({
      where: { userId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkoutPlan(userId: string, id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Workout plan not found.');
    }
    return plan;
  }

  async updateWorkoutPlan(userId: string, id: string, input: UpdateWorkoutPlanDto) {
    const existing = await this.prisma.workoutPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Workout plan not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (input.exercises) {
        await tx.workoutPlanExercise.deleteMany({ where: { planId: id } });
        await tx.workoutPlanExercise.createMany({
          data: input.exercises.map((e, idx) => ({
            planId: id,
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex ?? idx,
            targetSets: e.targetSets || 3,
            targetRepsMin: e.targetRepsMin || 8,
            targetRepsMax: e.targetRepsMax || 12,
            targetRpe: e.targetRpe,
            restSeconds: e.restSeconds || 90,
            notes: e.notes?.trim(),
          })),
        });
      }

      return tx.workoutPlan.update({
        where: { id },
        data: {
          title: input.title !== undefined ? input.title.trim() : undefined,
          description: input.description !== undefined ? input.description?.trim() : undefined,
          splitType: input.splitType,
          scheduleDays: input.scheduleDays,
          isActive: input.isActive,
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
    });
  }

  async deleteWorkoutPlan(userId: string, id: string) {
    const existing = await this.prisma.workoutPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Workout plan not found.');
    }

    await this.prisma.workoutPlan.delete({ where: { id } });
    return { message: 'Workout plan deleted successfully.' };
  }

  // ==========================================
  // NUTRITION & FOOD DIARY (HEALTHIFYME-INSPIRED)
  // ==========================================

  async searchFoods(params: { search?: string; category?: string; indianOnly?: boolean }) {
    const where: any = {};
    if (params.category && params.category !== 'ALL') {
      where.category = params.category.toUpperCase();
    }
    if (params.indianOnly) {
      where.isIndianTraditional = true;
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { region: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 40,
    });
  }

  async logFoodDiary(userId: string, input: LogFoodDiaryEntryDto) {
    const loggedDate = input.loggedDate ? new Date(input.loggedDate) : new Date();

    return this.prisma.foodDiaryEntry.create({
      data: {
        userId,
        foodId: input.foodId || null,
        mealType: input.mealType,
        foodName: input.foodName.trim(),
        servingQuantity: Number(input.servingQuantity) || 1.0,
        servingUnit: input.servingUnit || 'serving',
        calories: Math.round(Number(input.calories) * 10) / 10,
        proteinGrams: Math.round(Number(input.proteinGrams) * 10) / 10,
        carbGrams: Math.round(Number(input.carbGrams) * 10) / 10,
        fatGrams: Math.round(Number(input.fatGrams) * 10) / 10,
        fibreGrams: input.fibreGrams ? Math.round(Number(input.fibreGrams) * 10) / 10 : 0,
        loggedDate,
      },
      include: { food: true },
    });
  }

  async listFoodDiary(userId: string, targetDateStr?: string) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const [entries, waterLogs, profile] = await Promise.all([
      this.prisma.foodDiaryEntry.findMany({
        where: {
          userId,
          loggedDate: { gte: startOfDay, lte: endOfDay },
        },
        include: { food: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.waterLog.findMany({
        where: {
          userId,
          loggedDate: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.getProfile(userId),
    ]);

    // Group entries by meal type
    const meals = {
      BREAKFAST: entries.filter((e) => e.mealType === 'BREAKFAST'),
      LUNCH: entries.filter((e) => e.mealType === 'LUNCH'),
      DINNER: entries.filter((e) => e.mealType === 'DINNER'),
      SNACKS: entries.filter((e) => e.mealType === 'SNACKS'),
    };

    const totalCalories = Math.round(entries.reduce((sum, e) => sum + e.calories, 0));
    const totalProtein = Math.round(entries.reduce((sum, e) => sum + e.proteinGrams, 0) * 10) / 10;
    const totalCarbs = Math.round(entries.reduce((sum, e) => sum + e.carbGrams, 0) * 10) / 10;
    const totalFat = Math.round(entries.reduce((sum, e) => sum + e.fatGrams, 0) * 10) / 10;
    const totalFibre = Math.round(entries.reduce((sum, e) => sum + e.fibreGrams, 0) * 10) / 10;

    const totalWaterMl = waterLogs.reduce((sum, w) => sum + w.amountMl, 0);

    return {
      date: startOfDay.toISOString(),
      profile,
      meals,
      totals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        fibre: totalFibre,
        waterMl: totalWaterMl,
      },
      targets: {
        calories: profile.dailyCalorieTarget,
        protein: profile.proteinGramsTarget,
        carbs: profile.carbGramsTarget,
        fat: profile.fatGramsTarget,
        waterMl: profile.waterMlTarget,
      },
    };
  }

  async deleteFoodDiaryEntry(userId: string, id: string) {
    const entry = await this.prisma.foodDiaryEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Food diary entry not found.');
    }

    await this.prisma.foodDiaryEntry.delete({ where: { id } });
    return { message: 'Food diary entry removed.' };
  }

  async logWater(userId: string, input: LogWaterDto) {
    const loggedDate = input.loggedDate ? new Date(input.loggedDate) : new Date();

    return this.prisma.waterLog.create({
      data: {
        userId,
        amountMl: Math.max(50, Number(input.amountMl)),
        loggedDate,
      },
    });
  }

  async createCustomFood(userId: string, input: CreateCustomFoodDto) {
    return this.prisma.food.create({
      data: {
        userId,
        isCustom: true,
        name: input.name.trim(),
        category: input.category || 'MEALS',
        servingSize: input.servingSize || 100,
        servingUnit: input.servingUnit || 'g',
        calories: Number(input.calories),
        proteinGrams: Number(input.proteinGrams) || 0,
        carbGrams: Number(input.carbGrams) || 0,
        fatGrams: Number(input.fatGrams) || 0,
        fibreGrams: Number(input.fibreGrams) || 0,
        region: input.region?.trim(),
        isIndianTraditional: !!input.region,
      },
    });
  }

  // ==========================================
  // BODY MEASUREMENTS & PROGRESS
  // ==========================================

  async logBodyMeasurement(userId: string, input: LogBodyMeasurementDto) {
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

    const measurement = await this.prisma.bodyMeasurement.create({
      data: {
        userId,
        weightKg: input.weightKg ? Number(input.weightKg) : null,
        heightCm: input.heightCm ? Number(input.heightCm) : null,
        waistCm: input.waistCm ? Number(input.waistCm) : null,
        chestCm: input.chestCm ? Number(input.chestCm) : null,
        hipsCm: input.hipsCm ? Number(input.hipsCm) : null,
        armsCm: input.armsCm ? Number(input.armsCm) : null,
        forearmsCm: input.forearmsCm ? Number(input.forearmsCm) : null,
        thighsCm: input.thighsCm ? Number(input.thighsCm) : null,
        calvesCm: input.calvesCm ? Number(input.calvesCm) : null,
        neckCm: input.neckCm ? Number(input.neckCm) : null,
        bodyFatPercentage: input.bodyFatPercentage ? Number(input.bodyFatPercentage) : null,
        notes: input.notes?.trim(),
        recordedAt,
      },
    });

    // Also sync latest weight to FitnessProfile if provided
    if (input.weightKg) {
      await this.prisma.fitnessProfile.updateMany({
        where: { userId },
        data: { currentWeightKg: Number(input.weightKg) },
      });
    }

    return measurement;
  }

  async listBodyMeasurements(userId: string) {
    return this.prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 60,
    });
  }

  // ==========================================
  // ACTIVITY & WELLNESS
  // ==========================================

  async logActivity(userId: string, input: LogActivityDto) {
    const activityDate = input.activityDate ? new Date(input.activityDate) : new Date();

    return this.prisma.activityLog.create({
      data: {
        userId,
        activityType: input.activityType.toUpperCase(),
        durationMinutes: Math.max(1, Number(input.durationMinutes) || 30),
        distanceKm: input.distanceKm ? Number(input.distanceKm) : null,
        caloriesBurned: input.caloriesBurned ? Number(input.caloriesBurned) : null,
        stepCount: input.stepCount ? Number(input.stepCount) : null,
        sleepHours: input.sleepHours ? Number(input.sleepHours) : null,
        isRestDay: !!input.isRestDay,
        notes: input.notes?.trim(),
        activityDate,
      },
    });
  }

  async listActivities(userId: string, dateStr?: string) {
    const where: any = { userId };
    if (dateStr) {
      const date = new Date(dateStr);
      where.activityDate = {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
        lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
      };
    }

    return this.prisma.activityLog.findMany({
      where,
      orderBy: { activityDate: 'desc' },
      take: 30,
    });
  }

  // ==========================================
  // FITNESS GOALS
  // ==========================================

  async createGoal(userId: string, input: CreateFitnessGoalDto) {
    return this.prisma.fitnessGoal.create({
      data: {
        userId,
        title: input.title.trim(),
        targetType: input.targetType.toUpperCase(),
        targetValue: input.targetValue ? Number(input.targetValue) : null,
        currentValue: input.currentValue ? Number(input.currentValue) : null,
        unit: input.unit?.trim().toUpperCase(),
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      },
    });
  }

  async listGoals(userId: string) {
    return this.prisma.fitnessGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateGoal(userId: string, id: string, input: UpdateFitnessGoalDto) {
    const goal = await this.prisma.fitnessGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found.');
    }

    return this.prisma.fitnessGoal.update({
      where: { id },
      data: {
        title: input.title !== undefined ? input.title.trim() : undefined,
        targetValue: input.targetValue !== undefined ? Number(input.targetValue) : undefined,
        currentValue: input.currentValue !== undefined ? Number(input.currentValue) : undefined,
        unit: input.unit !== undefined ? input.unit.toUpperCase() : undefined,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        isAchieved: input.isAchieved !== undefined ? input.isAchieved : undefined,
      },
    });
  }

  async deleteGoal(userId: string, id: string) {
    const goal = await this.prisma.fitnessGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found.');
    }

    await this.prisma.fitnessGoal.delete({ where: { id } });
    return { message: 'Goal deleted successfully.' };
  }

  // ==========================================
  // ADMIN CATALOG MANAGEMENT
  // ==========================================

  async adminCreateExercise(input: any) {
    return this.prisma.exercise.create({
      data: {
        name: input.name.trim(),
        category: input.category || 'CHEST',
        muscleGroup: input.muscleGroup || input.category || 'Chest',
        secondaryMuscles: input.secondaryMuscles,
        equipment: input.equipment || 'BARBELL',
        exerciseType: input.exerciseType || 'WEIGHT_REPS',
        difficulty: input.difficulty || 'BEGINNER',
        instructions: input.instructions?.trim(),
        imageUrl: input.imageUrl?.trim(),
        isActive: input.isActive !== false,
      },
    });
  }

  async adminUpdateExercise(id: string, input: any) {
    return this.prisma.exercise.update({
      where: { id },
      data: input,
    });
  }

  async adminDeleteExercise(id: string) {
    return this.prisma.exercise.delete({ where: { id } });
  }

  async adminCreateFood(input: any) {
    return this.prisma.food.create({
      data: {
        name: input.name.trim(),
        category: input.category || 'MEALS',
        servingSize: Number(input.servingSize) || 100,
        servingUnit: input.servingUnit || 'g',
        calories: Number(input.calories),
        proteinGrams: Number(input.proteinGrams) || 0,
        carbGrams: Number(input.carbGrams) || 0,
        fatGrams: Number(input.fatGrams) || 0,
        fibreGrams: Number(input.fibreGrams) || 0,
        isIndianTraditional: !!input.isIndianTraditional,
        region: input.region?.trim(),
      },
    });
  }

  async adminUpdateFood(id: string, input: any) {
    return this.prisma.food.update({
      where: { id },
      data: input,
    });
  }

  async adminDeleteFood(id: string) {
    return this.prisma.food.delete({ where: { id } });
  }
}

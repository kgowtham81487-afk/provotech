import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FitnessService } from '../src/modules/fitness/fitness.service';
import { NotFoundException } from '@nestjs/common';

describe('Fitness & Wellness Module Unit Tests', () => {
  let fitnessService: FitnessService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      fitnessProfile: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      exercise: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      workoutSession: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      workoutSet: {
        findMany: vi.fn(),
      },
      exercisePersonalRecord: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      workoutPlan: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      food: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      foodDiaryEntry: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      waterLog: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      bodyMeasurement: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      activityLog: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      fitnessGoal: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      xPTransaction: {
        create: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (cb) => {
        if (Array.isArray(cb)) {
          return Promise.all(cb);
        }
        return cb(mockPrisma);
      }),
    };

    fitnessService = new FitnessService(mockPrisma);
  });

  describe('1. Mifflin-St Jeor TDEE & BMR Calculations', () => {
    it('should correctly calculate BMR and TDEE for a male in muscle gain surplus', () => {
      // Mifflin-St Jeor formula for men:
      // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
      // For 75kg, 180cm, 25 years old:
      // BMR = 10 * 75 + 6.25 * 180 - 5 * 25 + 5 = 750 + 1125 - 125 + 5 = 1755
      // MODERATE activity multiplier is 1.55 => TDEE = 1755 * 1.55 = 2720
      // MUSCLE_GAIN adds 300 kcal => Target = 3020 kcal
      const result = fitnessService.calculateTdeeAndMacros({
        age: 25,
        gender: 'MALE',
        heightCm: 180,
        weightKg: 75,
        activityLevel: 'MODERATE',
        fitnessGoal: 'MUSCLE_GAIN',
      });

      expect(result.bmr).toBe(1755);
      expect(result.maintenanceTdee).toBe(Math.round(1755 * 1.55));
      expect(result.dailyCalorieTarget).toBe(result.maintenanceTdee + 300);
      expect(result.proteinGramsTarget).toBeGreaterThan(0);
      expect(result.carbGramsTarget).toBeGreaterThan(0);
      expect(result.fatGramsTarget).toBeGreaterThan(0);
    });

    it('should correctly calculate BMR and TDEE for a female in deficit', () => {
      // Mifflin-St Jeor for women:
      // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
      // For 60kg, 165cm, 30 years old:
      // BMR = 600 + 1031.25 - 150 - 161 = 1320.25 => round to 1320.25 (1320)
      // LIGHT multiplier is 1.375 => TDEE = 1320 * 1.375 = 1815
      // FAT_LOSS subtracts 450 kcal => Target = 1365 kcal
      const result = fitnessService.calculateTdeeAndMacros({
        age: 30,
        gender: 'FEMALE',
        heightCm: 165,
        weightKg: 60,
        activityLevel: 'LIGHT',
        fitnessGoal: 'FAT_LOSS',
      });

      expect(Math.floor(result.bmr)).toBe(1320);
      expect(result.maintenanceTdee).toBe(Math.round(result.bmr * 1.375));
      expect(result.dailyCalorieTarget).toBe(result.maintenanceTdee - 450);
    });
  });

  describe('2. Brzycki 1RM Estimation & Workout Volume', () => {
    it('should compute Brzycki 1RM accurately: W * (36 / (37 - R))', () => {
      // 100 kg for 5 reps: 100 * (36 / 32) = 112.5 kg
      const estimated1Rm = fitnessService.estimateOneRepMax(100, 5);
      expect(estimated1Rm).toBe(112.5);

      // 1 rep returns the weight itself
      expect(fitnessService.estimateOneRepMax(140, 1)).toBe(140);
    });

    it('should calculate total volume and detect Personal Records (PRs)', async () => {
      const userId = 'user-123';
      const exerciseId = 'ex-bench-press';

      mockPrisma.workoutSession.create.mockResolvedValue({
        id: 'session-1',
        userId,
        title: 'Push Day',
        totalVolumeKg: 500,
        sets: [
          {
            id: 'set-1',
            exerciseId,
            setNumber: 1,
            reps: 5,
            weightKg: 100,
            exercise: { name: 'Barbell Bench Press' },
          },
        ],
      });

      // No prior PRs exist
      mockPrisma.exercisePersonalRecord.findFirst.mockResolvedValue(null);

      const res = await fitnessService.logWorkout(userId, {
        title: 'Push Day',
        durationMinutes: 45,
        sets: [
          {
            exerciseId,
            setNumber: 1,
            reps: 5,
            weightKg: 100,
            setType: 'NORMAL',
            isCompleted: true,
          },
        ],
      });

      expect(res.totalVolumeKg).toBe(500);
      expect(res.newPersonalRecords).toHaveLength(2); // MAX_WEIGHT and ESTIMATED_1RM
      expect(res.newPersonalRecords[0].exerciseName).toBe('Barbell Bench Press');
      expect(mockPrisma.exercisePersonalRecord.create).toHaveBeenCalledTimes(2);
    });

    it('should sum multiple sets for cumulative session volume', async () => {
      const userId = 'user-123';
      const exerciseId = 'ex-squat';

      mockPrisma.workoutSession.create.mockResolvedValue({
        id: 'session-2',
        userId,
        title: 'Leg Day',
        totalVolumeKg: 100 * 10 + 120 * 8, // 1000 + 960 = 1960
        sets: [
          { id: 's1', exerciseId, setNumber: 1, reps: 10, weightKg: 100, exercise: { name: 'Squat' } },
          { id: 's2', exerciseId, setNumber: 2, reps: 8, weightKg: 120, exercise: { name: 'Squat' } },
        ],
      });

      mockPrisma.exercisePersonalRecord.findFirst.mockResolvedValue({
        id: 'existing-pr',
        value: 200,
      });

      const res = await fitnessService.logWorkout(userId, {
        title: 'Leg Day',
        durationMinutes: 60,
        sets: [
          { exerciseId, setNumber: 1, reps: 10, weightKg: 100, isCompleted: true },
          { exerciseId, setNumber: 2, reps: 8, weightKg: 120, isCompleted: true },
        ],
      });

      expect(res.totalVolumeKg).toBe(1960);
    });
  });

  describe('3. Food Diary Macro Calculations', () => {
    it('should persist food diary entries with validated macro nutrients', async () => {
      const userId = 'user-123';

      mockPrisma.foodDiaryEntry.create.mockImplementation((args: any) => ({
        id: 'entry-1',
        ...args.data,
      }));

      const entry = await fitnessService.logFoodDiary(userId, {
        mealType: 'BREAKFAST',
        foodName: 'Idli with Sambar',
        servingQuantity: 3,
        servingUnit: 'pieces',
        calories: 220,
        proteinGrams: 7.5,
        carbGrams: 42,
        fatGrams: 2.1,
        fibreGrams: 3.5,
      });

      expect(entry.foodName).toBe('Idli with Sambar');
      expect(entry.calories).toBe(220);
      expect(entry.proteinGrams).toBe(7.5);
      expect(entry.carbGrams).toBe(42);
      expect(entry.fatGrams).toBe(2.1);
      expect(entry.fibreGrams).toBe(3.5);
    });
  });

  describe('4. User Isolation & Security', () => {
    it('should prevent deleting a workout session belonging to another user', async () => {
      mockPrisma.workoutSession.findUnique.mockResolvedValue({
        id: 'session-other-user',
        userId: 'attacker-victim-mismatch',
      });

      await expect(
        fitnessService.deleteWorkout('legitimate-user', 'session-other-user'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.workoutSession.delete).not.toHaveBeenCalled();
    });

    it('should prevent deleting a food diary entry belonging to another user', async () => {
      mockPrisma.foodDiaryEntry.findUnique.mockResolvedValue({
        id: 'entry-other-user',
        userId: 'attacker-victim-mismatch',
      });

      await expect(
        fitnessService.deleteFoodDiaryEntry('legitimate-user', 'entry-other-user'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.foodDiaryEntry.delete).not.toHaveBeenCalled();
    });
  });
});

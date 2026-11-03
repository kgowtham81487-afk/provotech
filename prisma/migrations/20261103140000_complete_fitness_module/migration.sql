-- AlterTable Exercise
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'CHEST';
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "secondaryMuscles" TEXT;
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "equipment" TEXT NOT NULL DEFAULT 'BARBELL';
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "exerciseType" TEXT NOT NULL DEFAULT 'WEIGHT_REPS';
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER';
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable WorkoutSession
ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "totalVolumeKg" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable WorkoutSet
ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "setType" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;
ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "distanceMeters" DOUBLE PRECISION;

-- AlterTable FitnessGoal
ALTER TABLE "FitnessGoal" ADD COLUMN IF NOT EXISTS "currentValue" DOUBLE PRECISION;
ALTER TABLE "FitnessGoal" ADD COLUMN IF NOT EXISTS "targetDate" TIMESTAMP(3);

-- CreateTable FitnessProfile
CREATE TABLE IF NOT EXISTS "FitnessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "heightCm" DOUBLE PRECISION,
    "currentWeightKg" DOUBLE PRECISION,
    "targetWeightKg" DOUBLE PRECISION,
    "activityLevel" TEXT NOT NULL DEFAULT 'MODERATE',
    "fitnessGoal" TEXT NOT NULL DEFAULT 'MUSCLE_GAIN',
    "dietaryPreference" TEXT NOT NULL DEFAULT 'NON_VEGETARIAN',
    "dailyCalorieTarget" INTEGER NOT NULL DEFAULT 2200,
    "proteinGramsTarget" DOUBLE PRECISION NOT NULL DEFAULT 140,
    "carbGramsTarget" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "fatGramsTarget" DOUBLE PRECISION NOT NULL DEFAULT 65,
    "waterMlTarget" INTEGER NOT NULL DEFAULT 3000,
    "restTimerSeconds" INTEGER NOT NULL DEFAULT 90,
    "autoStartTimer" BOOLEAN NOT NULL DEFAULT true,
    "unitSystem" TEXT NOT NULL DEFAULT 'METRIC',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkoutPlan
CREATE TABLE IF NOT EXISTS "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "splitType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "scheduleDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkoutPlanExercise
CREATE TABLE IF NOT EXISTS "WorkoutPlanExercise" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "targetSets" INTEGER NOT NULL DEFAULT 3,
    "targetRepsMin" INTEGER NOT NULL DEFAULT 8,
    "targetRepsMax" INTEGER NOT NULL DEFAULT 12,
    "targetRpe" DOUBLE PRECISION,
    "restSeconds" INTEGER NOT NULL DEFAULT 90,
    "notes" TEXT,

    CONSTRAINT "WorkoutPlanExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExercisePersonalRecord
CREATE TABLE IF NOT EXISTS "ExercisePersonalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutSetId" TEXT,

    CONSTRAINT "ExercisePersonalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable Food
CREATE TABLE IF NOT EXISTS "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'MEALS',
    "servingSize" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fibreGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isIndianTraditional" BOOLEAN NOT NULL DEFAULT false,
    "region" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable FoodDiaryEntry
CREATE TABLE IF NOT EXISTS "FoodDiaryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT,
    "mealType" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "servingQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "servingUnit" TEXT NOT NULL DEFAULT 'serving',
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fibreGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loggedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodDiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable WaterLog
CREATE TABLE IF NOT EXISTS "WaterLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "loggedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable BodyMeasurement
CREATE TABLE IF NOT EXISTS "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "hipsCm" DOUBLE PRECISION,
    "armsCm" DOUBLE PRECISION,
    "forearmsCm" DOUBLE PRECISION,
    "thighsCm" DOUBLE PRECISION,
    "calvesCm" DOUBLE PRECISION,
    "neckCm" DOUBLE PRECISION,
    "bodyFatPercentage" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProgressPhoto
CREATE TABLE IF NOT EXISTS "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "pose" TEXT NOT NULL DEFAULT 'FRONT',
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable ActivityLog
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "caloriesBurned" INTEGER,
    "stepCount" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FitnessProfile_userId_key" ON "FitnessProfile"("userId");
CREATE INDEX IF NOT EXISTS "FitnessProfile_userId_idx" ON "FitnessProfile"("userId");

CREATE INDEX IF NOT EXISTS "WorkoutPlan_userId_idx" ON "WorkoutPlan"("userId");
CREATE INDEX IF NOT EXISTS "WorkoutPlanExercise_planId_idx" ON "WorkoutPlanExercise"("planId");
CREATE INDEX IF NOT EXISTS "WorkoutPlanExercise_exerciseId_idx" ON "WorkoutPlanExercise"("exerciseId");

CREATE INDEX IF NOT EXISTS "WorkoutSession_planId_idx" ON "WorkoutSession"("planId");

CREATE INDEX IF NOT EXISTS "Exercise_category_idx" ON "Exercise"("category");
CREATE INDEX IF NOT EXISTS "Exercise_isActive_idx" ON "Exercise"("isActive");

CREATE INDEX IF NOT EXISTS "ExercisePersonalRecord_userId_exerciseId_idx" ON "ExercisePersonalRecord"("userId", "exerciseId");
CREATE INDEX IF NOT EXISTS "ExercisePersonalRecord_recordType_idx" ON "ExercisePersonalRecord"("recordType");

CREATE UNIQUE INDEX IF NOT EXISTS "Food_name_key" ON "Food"("name");
CREATE INDEX IF NOT EXISTS "Food_category_idx" ON "Food"("category");
CREATE INDEX IF NOT EXISTS "Food_isIndianTraditional_idx" ON "Food"("isIndianTraditional");

CREATE INDEX IF NOT EXISTS "FoodDiaryEntry_userId_idx" ON "FoodDiaryEntry"("userId");
CREATE INDEX IF NOT EXISTS "FoodDiaryEntry_loggedDate_idx" ON "FoodDiaryEntry"("loggedDate");
CREATE INDEX IF NOT EXISTS "FoodDiaryEntry_mealType_idx" ON "FoodDiaryEntry"("mealType");

CREATE INDEX IF NOT EXISTS "WaterLog_userId_idx" ON "WaterLog"("userId");
CREATE INDEX IF NOT EXISTS "WaterLog_loggedDate_idx" ON "WaterLog"("loggedDate");

CREATE INDEX IF NOT EXISTS "BodyMeasurement_userId_idx" ON "BodyMeasurement"("userId");
CREATE INDEX IF NOT EXISTS "BodyMeasurement_recordedAt_idx" ON "BodyMeasurement"("recordedAt");

CREATE INDEX IF NOT EXISTS "ProgressPhoto_userId_idx" ON "ProgressPhoto"("userId");
CREATE INDEX IF NOT EXISTS "ProgressPhoto_takenAt_idx" ON "ProgressPhoto"("takenAt");

CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_activityDate_idx" ON "ActivityLog"("activityDate");

-- AddForeignKey
ALTER TABLE "FitnessProfile" ADD CONSTRAINT "FitnessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutPlanExercise" ADD CONSTRAINT "WorkoutPlanExercise_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutPlanExercise" ADD CONSTRAINT "WorkoutPlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExercisePersonalRecord" ADD CONSTRAINT "ExercisePersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExercisePersonalRecord" ADD CONSTRAINT "ExercisePersonalRecord_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodDiaryEntry" ADD CONSTRAINT "FoodDiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodDiaryEntry" ADD CONSTRAINT "FoodDiaryEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

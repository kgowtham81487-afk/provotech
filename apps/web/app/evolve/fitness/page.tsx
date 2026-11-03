'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Dumbbell,
  Flame,
  Droplet,
  Moon,
  Footprints,
  TrendingUp,
  Award,
  Target,
  ArrowRight,
  Plus,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Scale,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FitnessNav } from './fitness-nav';

export default function FitnessDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waterAdding, setWaterAdding] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    const res = await apiRequest('/fitness/dashboard', { method: 'GET' });
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleQuickAddWater = async (amountMl: number) => {
    setWaterAdding(true);
    const res = await apiRequest('/fitness/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ amountMl }),
    });
    setWaterAdding(false);
    if (res.success) {
      loadDashboard();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark">
        <FitnessNav />
        <div className="container mx-auto px-4 py-20 text-center text-slate-400 text-sm">
          <Activity className="h-6 w-6 text-emerald-400 animate-spin mx-auto mb-3" />
          Loading your personalized fitness & nutrition metrics...
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const today = data?.today;
  const weekly = data?.weekly;
  const nutrition = today?.nutrition;
  const hydration = today?.hydration;

  const needsOnboarding = !profile?.onboardingCompleted;

  return (
    <div className="min-h-screen bg-surface-dark pb-16">
      <FitnessNav />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        {/* Onboarding Callout Banner if profile is fresh */}
        {needsOnboarding && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-surface to-surface-elevated p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Personalized Setup</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Welcome to EES Fitness & Wellness!
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Calculate your custom BMR, TDEE, and macro targets (Mifflin-St Jeor) to power your strength and nutrition progression.
              </p>
            </div>
            <Link
              href="/evolve/fitness/onboarding"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shadow-md shadow-emerald-500/20"
            >
              Complete Guided Setup
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* SECTION 1: DAILY TELEMETRY OVERVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Calorie Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Calories Remaining</span>
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-white">
                {nutrition?.caloriesRemaining?.toLocaleString() || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {nutrition?.caloriesConsumed || 0} / {nutrition?.calorieTarget || 2200} kcal
              </div>
            </div>
            <div className="w-full bg-surface-elevated rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((nutrition?.caloriesConsumed || 0) / (nutrition?.calorieTarget || 2200)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Today's Workout */}
          <div className="rounded-2xl border border-surface-border bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Workout Today</span>
              <Dumbbell className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-white truncate">
                {today?.hasCompletedWorkoutToday ? 'Completed' : 'Not Logged'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {today?.todayWorkouts?.length || 0} session(s) recorded
              </div>
            </div>
            <Link
              href="/evolve/fitness/workouts"
              className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>{today?.hasCompletedWorkoutToday ? 'Log another' : 'Start Workout'}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Hydration */}
          <div className="rounded-2xl border border-surface-border bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Water Intake</span>
              <Droplet className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-white">
                {((hydration?.waterConsumedMl || 0) / 1000).toFixed(1)} L
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Goal: {((hydration?.waterTargetMl || 3000) / 1000).toFixed(1)} L ({hydration?.percentage || 0}%)
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <button
                disabled={waterAdding}
                onClick={() => handleQuickAddWater(250)}
                className="flex-1 py-1 rounded bg-surface-elevated hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30 transition"
              >
                +250ml
              </button>
              <button
                disabled={waterAdding}
                onClick={() => handleQuickAddWater(500)}
                className="flex-1 py-1 rounded bg-surface-elevated hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30 transition"
              >
                +500ml
              </button>
            </div>
          </div>

          {/* Current Weight */}
          <div className="rounded-2xl border border-surface-border bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Current Weight</span>
              <Scale className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-white">
                {profile?.currentWeightKg ? `${profile.currentWeightKg} kg` : 'Not Set'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Target: {profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : 'Maintain'}
              </div>
            </div>
            <Link
              href="/evolve/fitness/body"
              className="mt-3 text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Record Weight</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* SECTION 2: MACRONUTRIENTS & HEALTHIFYME FOOD DIARY WIDGET */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Macronutrients Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Macronutrient Targets</h3>
                </div>
                <Link
                  href="/evolve/fitness/food-diary"
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Open Diary
                </Link>
              </div>

              {/* Macro Bars */}
              <div className="mt-4 space-y-4">
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300">Protein</span>
                    <span className="text-slate-400">
                      <strong className="text-emerald-400">{nutrition?.proteinConsumed || 0}g</strong> / {nutrition?.proteinTarget || 140}g
                    </span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((nutrition?.proteinConsumed || 0) / (nutrition?.proteinTarget || 140)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Carbohydrates */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300">Carbohydrates</span>
                    <span className="text-slate-400">
                      <strong className="text-amber-400">{nutrition?.carbsConsumed || 0}g</strong> / {nutrition?.carbsTarget || 250}g
                    </span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((nutrition?.carbsConsumed || 0) / (nutrition?.carbsTarget || 250)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Fats */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300">Fats</span>
                    <span className="text-slate-400">
                      <strong className="text-rose-400">{nutrition?.fatConsumed || 0}g</strong> / {nutrition?.fatTarget || 65}g
                    </span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-400 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((nutrition?.fatConsumed || 0) / (nutrition?.fatTarget || 65)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs text-slate-400">
              <span>Fiber: {nutrition?.fibreConsumed || 0}g</span>
              <span>Diet: {profile?.dietaryPreference?.replace('_', ' ') || 'Any'}</span>
            </div>
          </div>

          {/* Weekly Training Volume (Hevy-inspired) */}
          <div className="rounded-2xl border border-surface-border bg-surface p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Weekly Training Volume</h3>
                </div>
                <Link
                  href="/evolve/fitness/progress"
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Full Analytics
                </Link>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white">
                  {weekly?.totalVolumeKg?.toLocaleString() || 0} <span className="text-sm font-medium text-slate-400">kg lifted</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Across {weekly?.workoutsCompleted || 0} workouts totaling {weekly?.durationMinutes || 0} minutes this week.
                </p>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-surface-elevated border border-surface-border text-xs">
                <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                  <span>Weekly Consistency</span>
                  <span className="text-emerald-400">{weekly?.consistencyPercentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full"
                    style={{ width: `${weekly?.consistencyPercentage || 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Target: 4 strength sessions per week
                </div>
              </div>
            </div>

            <Link
              href="/evolve/fitness/workouts/history"
              className="mt-4 block text-center py-2 rounded-xl bg-surface-elevated hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
            >
              Browse Workout History
            </Link>
          </div>

          {/* Recent Personal Records (PRs) */}
          <div className="rounded-2xl border border-surface-border bg-surface p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Personal Records (PRs)</h3>
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Auto-Calculated
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {data?.recentPersonalRecords?.length > 0 ? (
                  data.recentPersonalRecords.map((pr: any) => (
                    <div
                      key={pr.id}
                      className="p-2.5 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{pr.exercise?.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {pr.recordType?.replace('_', ' ')} • {new Date(pr.achievedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                        {pr.value} {pr.unit}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <Award className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    Log your first strength workout to automatically record Personal Records!
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/evolve/fitness/workouts"
              className="mt-4 block text-center py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/20 transition"
            >
              Log New Lift
            </Link>
          </div>
        </div>

        {/* SECTION 3: WORKOUT PLANS & GOALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Workout Routines */}
          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Saved Workout Routines</h3>
              </div>
              <Link
                href="/evolve/fitness/plans"
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                Manage Plans
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {data?.activePlans?.length > 0 ? (
                data.activePlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between hover:border-emerald-500/40 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{plan.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {plan.splitType} • {plan.exercises?.length || 0} exercises
                      </div>
                    </div>
                    <Link
                      href={`/evolve/fitness/workouts?planId=${plan.id}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      Start Routine
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Dumbbell className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  No custom workout routines created yet. Build a Push/Pull/Legs or Upper/Lower split.
                </div>
              )}
            </div>
          </div>

          {/* Active Goals */}
          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Active Fitness Goals</h3>
              </div>
              <Link
                href="/evolve/fitness/goals"
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                All Goals
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {data?.goals?.length > 0 ? (
                data.goals.map((g: any) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{g.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {g.targetType} • Target: {g.targetValue ? `${g.targetValue} ${g.unit || ''}` : 'Active'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      In Progress
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Target className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  No fitness goals configured. Set targets for bodyweight, workouts/week, or bench press.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

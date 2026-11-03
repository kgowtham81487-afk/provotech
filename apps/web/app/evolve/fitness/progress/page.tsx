'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Award,
  Calculator,
  Calendar,
  Layers,
  Dumbbell,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FitnessNav } from '../fitness-nav';

export default function FitnessProgressPage() {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState(100);
  const [calcReps, setCalcReps] = useState(5);

  const loadData = async () => {
    setIsLoading(true);
    const [dashRes, workRes] = await Promise.all([
      apiRequest('/fitness/dashboard', { method: 'GET' }),
      apiRequest('/fitness/workouts?limit=30', { method: 'GET' }),
    ]);
    if (dashRes.success && dashRes.data) setDashboardData(dashRes.data);
    if (workRes.success && workRes.data) setWorkouts(workRes.data.items || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Brzycki 1RM formula
  const calculated1RM = Math.round(calcWeight * (36 / (37 - Math.min(12, calcReps))) * 10) / 10;

  // Muscle group set count breakdown
  const muscleGroupBreakdown = workouts.reduce((acc: any, w: any) => {
    for (const set of w.sets || []) {
      const cat = set.exercise?.category || 'OTHER';
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface-dark pb-16">
      <FitnessNav />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Strength Progression & Analytics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Strength Analytics & PRs</h1>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="text-xs text-slate-400 font-semibold">Weekly Training Volume</div>
            <div className="text-2xl font-black text-white mt-1">
              {dashboardData?.weekly?.totalVolumeKg?.toLocaleString() || 0} kg
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1">
              {dashboardData?.weekly?.workoutsCompleted || 0} workouts logged this week
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="text-xs text-slate-400 font-semibold">Training Consistency</div>
            <div className="text-2xl font-black text-white mt-1">
              {dashboardData?.weekly?.consistencyPercentage || 0}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {dashboardData?.weekly?.durationMinutes || 0} total training minutes
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="text-xs text-slate-400 font-semibold">Tracked Personal Records</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {dashboardData?.recentPersonalRecords?.length || 0} PRs
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across all compound and isolation lifts
            </div>
          </div>
        </div>

        {/* 1RM Calculator Widget */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 mb-6">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-border mb-4">
            <Calculator className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Estimated 1-Rep Max Calculator (Brzycki Formula)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lifted Weight (kg)</label>
              <input
                type="number"
                value={calcWeight}
                onChange={(e) => setCalcWeight(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Repetitions Completed</label>
              <input
                type="number"
                min="1"
                max="15"
                value={calcReps}
                onChange={(e) => setCalcReps(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Estimated 1-Rep Max</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {calculated1RM} kg
              </div>
            </div>
          </div>
        </div>

        {/* Sets per Muscle Group Breakdown */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Muscle Group Volume Distribution (Last 30 Sessions)</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(muscleGroupBreakdown).length > 0 ? (
              Object.entries(muscleGroupBreakdown).map(([muscle, count]: [string, any]) => (
                <div key={muscle} className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{muscle}</div>
                  <div className="text-lg font-black text-white mt-0.5">{count} sets</div>
                </div>
              ))
            ) : (
              <div className="col-span-4 py-8 text-center text-xs text-slate-500">
                Log completed workouts to view your muscle group set distribution!
              </div>
            )}
          </div>
        </div>

        {/* All Tracked Personal Records */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">All Personal Records</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {dashboardData?.recentPersonalRecords?.length > 0 ? (
              dashboardData.recentPersonalRecords.map((pr: any) => (
                <div
                  key={pr.id}
                  className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{pr.exercise?.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {pr.recordType?.replace('_', ' ')} • {new Date(pr.achievedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
                    {pr.value} {pr.unit}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No personal records logged yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Dumbbell,
  Calendar,
  Clock,
  Trash2,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FitnessNav } from '../../fitness-nav';

export default function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async (page = 1) => {
    setIsLoading(true);
    const res = await apiRequest(`/fitness/workouts?page=${page}&limit=15`, { method: 'GET' });
    if (res.success && res.data) {
      setWorkouts(res.data.items || []);
      setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory(1);
  }, []);

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recorded workout?')) return;
    const res = await apiRequest(`/fitness/workouts/${id}`, { method: 'DELETE' });
    if (res.success) {
      loadHistory(pagination.page);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark pb-16">
      <FitnessNav />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <History className="h-4 w-4" />
              <span>Training History</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Recorded Workouts</h1>
          </div>

          <Link
            href="/evolve/fitness/workouts"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Log New Workout
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading workout logs...</div>
        ) : workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl border border-surface-border bg-surface p-5 hover:border-emerald-500/30 transition shadow-sm"
              >
                <div className="flex items-start justify-between pb-3 border-b border-surface-border mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{w.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {new Date(w.createdAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {w.durationMinutes} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <strong className="text-emerald-400">{w.totalVolumeKg?.toLocaleString()} kg</strong> volume
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteWorkout(w.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                    title="Delete log"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {w.notes && (
                  <p className="text-xs text-slate-300 italic mb-3 bg-surface-elevated p-2.5 rounded-xl border border-surface-border/50">
                    "{w.notes}"
                  </p>
                )}

                {/* Exercises & Sets Summary */}
                <div className="space-y-2">
                  {/* Group sets by exercise */}
                  {Object.entries(
                    w.sets.reduce((acc: any, s: any) => {
                      const exName = s.exercise?.name || 'Exercise';
                      if (!acc[exName]) acc[exName] = [];
                      acc[exName].push(s);
                      return acc;
                    }, {}),
                  ).map(([exName, sets]: [string, any]) => (
                    <div key={exName} className="p-2.5 rounded-xl bg-surface-elevated text-xs">
                      <div className="font-bold text-slate-200 mb-1">{exName}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {sets.map((s: any, idx: number) => (
                          <span
                            key={s.id || idx}
                            className="bg-slate-900 border border-surface-border px-2 py-0.5 rounded text-[11px] font-mono text-slate-300"
                          >
                            {s.weightKg}kg × {s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 text-xs text-slate-400">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} workouts)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => loadHistory(pagination.page - 1)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-surface-border disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadHistory(pagination.page + 1)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-surface-border disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-surface-border bg-surface p-12 text-center max-w-md mx-auto">
            <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No workouts recorded yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Start your first session to track exercises, sets, weights, and progressive overload.
            </p>
            <Link
              href="/evolve/fitness/workouts"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              Start Workout Now
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

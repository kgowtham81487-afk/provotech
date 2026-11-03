'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  Dumbbell,
  Award,
  History,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FitnessNav } from '../fitness-nav';

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const categories = [
    'ALL',
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'QUADRICEPS',
    'HAMSTRINGS',
    'GLUTES',
    'CALVES',
    'CORE',
    'CARDIO',
  ];

  const loadExercises = async () => {
    setIsLoading(true);
    let url = `/fitness/exercises?category=${selectedCategory}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await apiRequest(url, { method: 'GET' });
    if (res.success && res.data) {
      setExercises(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadExercises();
  }, [selectedCategory, search]);

  const handleOpenDetail = async (ex: any) => {
    setSelectedExercise(ex);
    setDetailLoading(true);
    const res = await apiRequest(`/fitness/exercises/${ex.id}`, { method: 'GET' });
    if (res.success && res.data) {
      setExerciseDetail(res.data);
    }
    setDetailLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-dark pb-16">
      <FitnessNav />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <BookOpen className="h-4 w-4" />
              <span>Anatomy & Movement Index</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Exercise Library</h1>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search exercise or muscle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-surface border border-surface-border text-slate-400 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exercises Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading exercises...</div>
        ) : exercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handleOpenDetail(ex)}
                className="p-4 rounded-2xl border border-surface-border bg-surface hover:border-emerald-500/40 cursor-pointer transition shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white hover:text-emerald-400 transition">
                      {ex.name}
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      {ex.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                    <span>{ex.equipment}</span>
                    <span>•</span>
                    <span>{ex.difficulty}</span>
                    <span>•</span>
                    <span>{ex.exerciseType?.replace(/_/g, ' ')}</span>
                  </div>

                  {ex.instructions && (
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                      {ex.instructions}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Target: {ex.muscleGroup}</span>
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    View History →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500">
            No exercises match your filter criteria.
          </div>
        )}

        {/* Exercise Detail & Personal Performance Modal */}
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-surface-border rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-start justify-between pb-3 border-b border-surface-border">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedExercise.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-bold">{selectedExercise.category}</span>
                    <span>•</span>
                    <span>Equipment: {selectedExercise.equipment}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedExercise(null);
                    setExerciseDetail(null);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
                {selectedExercise.instructions && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Execution Guidance</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-surface-elevated p-3 rounded-xl border border-surface-border">
                      {selectedExercise.instructions}
                    </p>
                  </div>
                )}

                {/* Personal Records */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    <span>Your Personal Records on this Lift</span>
                  </h4>
                  {exerciseDetail?.personalRecords?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {exerciseDetail.personalRecords.map((pr: any) => (
                        <div
                          key={pr.id}
                          className="p-2.5 rounded-xl bg-surface-elevated border border-surface-border"
                        >
                          <div className="text-[10px] text-slate-400">{pr.recordType?.replace('_', ' ')}</div>
                          <div className="text-sm font-black text-amber-400">
                            {pr.value} {pr.unit}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {new Date(pr.achievedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 p-3 bg-surface-elevated rounded-xl">
                      No personal records achieved on this exercise yet.
                    </div>
                  )}
                </div>

                {/* Recent Sets History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Recent Sets Logged</span>
                  </h4>
                  {exerciseDetail?.history?.length > 0 ? (
                    <div className="space-y-1.5">
                      {exerciseDetail.history.map((s: any) => (
                        <div
                          key={s.id}
                          className="p-2 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-white">
                            Set {s.setNumber}: <strong>{s.weightKg} kg</strong> × {s.reps} reps
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 p-3 bg-surface-elevated rounded-xl">
                      No workout history recorded for this movement.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end">
                <Link
                  href="/evolve/fitness/workouts"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Log In Next Workout
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

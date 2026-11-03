'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListPlus,
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Play,
  Calendar,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FitnessNav } from '../fitness-nav';

export default function WorkoutPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState('PUSH_PULL_LEGS');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [plansRes, exRes] = await Promise.all([
      apiRequest('/fitness/plans', { method: 'GET' }),
      apiRequest('/fitness/exercises', { method: 'GET' }),
    ]);
    if (plansRes.success && plansRes.data) setPlans(plansRes.data);
    if (exRes.success && exRes.data) setExercises(exRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise to your plan.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/fitness/plans', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        splitType,
        exercises: selectedExercises.map((e, idx) => ({
          exerciseId: e.exerciseId,
          orderIndex: idx,
          targetSets: Number(e.targetSets) || 3,
          targetRepsMin: Number(e.targetRepsMin) || 8,
          targetRepsMax: Number(e.targetRepsMax) || 12,
          restSeconds: Number(e.restSeconds) || 90,
        })),
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSelectedExercises([]);
      loadData();
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout routine?')) return;
    const res = await apiRequest(`/fitness/plans/${id}`, { method: 'DELETE' });
    if (res.success) loadData();
  };

  return (
    <div className="min-h-screen bg-surface-dark pb-16">
      <FitnessNav />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <Layers className="h-4 w-4" />
              <span>Routine Architect</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Workout Plans & Splits</h1>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Routine
          </button>
        </div>

        {/* Routines Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading workout plans...</div>
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-surface-border bg-surface p-5 flex flex-col justify-between hover:border-emerald-500/30 transition shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-surface-border">
                    <div>
                      <h3 className="text-base font-bold text-white">{p.title}</h3>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {p.splitType?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 mt-2 mb-3">{p.description}</p>
                  )}

                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                      Exercises ({p.exercises?.length || 0})
                    </div>
                    {p.exercises?.map((pe: any, idx: number) => (
                      <div
                        key={pe.id || idx}
                        className="p-2 rounded-xl bg-surface-elevated text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-200">{pe.exercise?.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {pe.targetSets} sets • {pe.targetRepsMin}-{pe.targetRepsMax} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-surface-border flex items-center gap-2">
                  <Link
                    href={`/evolve/fitness/workouts?planId=${p.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Start This Workout
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-surface-border bg-surface p-12 text-center max-w-md mx-auto">
            <ListPlus className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No custom routines created</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Design a training split such as Push/Pull/Legs, Upper/Lower, or Full Body with target sets and rep ranges.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Build Routine
            </button>
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <form
              onSubmit={handleCreatePlan}
              className="bg-surface border border-surface-border rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-base font-bold text-white">Create Workout Routine</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Routine Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Push Day A (Chest & Triceps)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Split Type</label>
                  <select
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="PUSH_PULL_LEGS">Push / Pull / Legs</option>
                    <option value="UPPER_LOWER">Upper / Lower</option>
                    <option value="FULL_BODY">Full Body</option>
                    <option value="CUSTOM">Custom Split</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Focus on progressive overload on heavy barbell compounds"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Exercises in this routine ({selectedExercises.length})
                  </label>

                  {/* Add Exercise Selector */}
                  <select
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const ex = exercises.find((item) => item.id === e.target.value);
                      if (ex && !selectedExercises.some((item) => item.exerciseId === ex.id)) {
                        setSelectedExercises([
                          ...selectedExercises,
                          {
                            exerciseId: ex.id,
                            name: ex.name,
                            targetSets: 3,
                            targetRepsMin: 8,
                            targetRepsMax: 12,
                            restSeconds: 90,
                          },
                        ]);
                      }
                      e.target.value = '';
                    }}
                    className="w-full mb-3 bg-surface-elevated border border-dashed border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-400 outline-none"
                  >
                    <option value="">+ Add Exercise from Library...</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.category})
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    {selectedExercises.map((se, idx) => (
                      <div
                        key={se.exerciseId}
                        className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between text-xs"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white">{se.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>Sets:</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={se.targetSets}
                              onChange={(e) => {
                                const updated = [...selectedExercises];
                                updated[idx].targetSets = Number(e.target.value);
                                setSelectedExercises(updated);
                              }}
                              className="w-12 bg-slate-900 border border-surface-border rounded px-1 text-center text-white"
                            />
                            <span>Reps:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={se.targetRepsMin}
                              onChange={(e) => {
                                const updated = [...selectedExercises];
                                updated[idx].targetRepsMin = Number(e.target.value);
                                setSelectedExercises(updated);
                              }}
                              className="w-12 bg-slate-900 border border-surface-border rounded px-1 text-center text-white"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={se.targetRepsMax}
                              onChange={(e) => {
                                const updated = [...selectedExercises];
                                updated[idx].targetRepsMax = Number(e.target.value);
                                setSelectedExercises(updated);
                              }}
                              className="w-12 bg-slate-900 border border-surface-border rounded px-1 text-center text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...selectedExercises];
                            updated.splice(idx, 1);
                            setSelectedExercises(updated);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Routine'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

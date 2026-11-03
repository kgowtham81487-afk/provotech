'use client';

import { useEffect, useState } from 'react';
import { FitnessNav } from '../fitness-nav';
import { api } from '@/lib/api';

interface FitnessGoal {
  id: string;
  title: string;
  category: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'STRENGTH',
    targetValue: '',
    currentValue: '',
    unit: 'kg',
    targetDate: '',
  });

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get<FitnessGoal[]>('/fitness/goals');
      if (res.data) setGoals(res.data);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/fitness/goals', {
        title: form.title,
        category: form.category,
        targetValue: form.targetValue ? parseFloat(form.targetValue) : undefined,
        currentValue: form.currentValue ? parseFloat(form.currentValue) : undefined,
        unit: form.unit,
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : undefined,
      });
      setShowModal(false);
      setForm({
        title: '',
        category: 'STRENGTH',
        targetValue: '',
        currentValue: '',
        unit: 'kg',
        targetDate: '',
      });
      await loadGoals();
    } catch (err) {
      console.error('Failed to create goal', err);
      alert('Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (goal: FitnessGoal) => {
    try {
      await api.patch(`/fitness/goals/${goal.id}`, { isCompleted: !goal.isCompleted });
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, isCompleted: !g.isCompleted } : g))
      );
    } catch (err) {
      console.error('Failed to toggle goal', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/fitness/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FitnessNav />

        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Fitness Goals & Milestones</h1>
            <p className="mt-1 text-sm text-slate-400">
              Set clear targets for strength PRs, body weight, hydration, and consistency milestones
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            + New Goal
          </button>
        </div>

        {/* Active Goals */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Active Goals ({activeGoals.length})</h2>
          {activeGoals.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              No active goals right now. Create one above to establish your next milestone!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((goal) => {
                const progressPct =
                  goal.targetValue && goal.currentValue
                    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                    : null;

                return (
                  <div
                    key={goal.id}
                    className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                          {goal.category}
                        </span>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="text-slate-500 hover:text-red-400 text-sm"
                          title="Delete Goal"
                        >
                          ✕
                        </button>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-white">{goal.title}</h3>

                      {goal.targetValue && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Progress</span>
                            <span>
                              {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit}
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${progressPct ?? 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {goal.targetDate && (
                        <p className="mt-4 text-xs text-slate-400">
                          🎯 Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/60">
                      <button
                        onClick={() => handleToggleComplete(goal)}
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20"
                      >
                        ✓ Mark Completed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-400 mb-4">Completed Milestones ({completedGoals.length})</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 line-through-container"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">✓ ACHIEVED</span>
                    <button
                      onClick={() => handleToggleComplete(goal)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Reopen
                    </button>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-300">{goal.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Target: {goal.targetValue} {goal.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: New Goal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Create Fitness Goal</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Goal Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100 kg Bench Press, Reach 70kg Bodyweight"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="STRENGTH">Strength / 1RM</option>
                    <option value="WEIGHT_LOSS">Weight Loss</option>
                    <option value="MUSCLE_GAIN">Muscle Gain</option>
                    <option value="ENDURANCE">Endurance / Cardio</option>
                    <option value="HABIT">Habit & Consistency</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Target Value</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="100"
                      value={form.targetValue}
                      onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Unit</label>
                    <input
                      type="text"
                      placeholder="kg, reps, days, km"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400">Current Starting Value</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="80"
                    value={form.currentValue}
                    onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400">Target Completion Date</label>
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

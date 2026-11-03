'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  targetMuscleGroup: string;
  category?: string;
  equipment?: string;
  isCustom?: boolean;
}

interface Food {
  id: string;
  name: string;
  regionalName?: string;
  category?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingUnit: string;
  servingSizeG: number;
}

export default function AdminFitnessPage() {
  const [tab, setTab] = useState<'exercises' | 'foods'>('exercises');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  // Exercise modal
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    targetMuscleGroup: 'CHEST',
    category: 'BARBELL',
    equipment: 'Barbell, Bench',
    instructions: '',
  });

  // Food modal
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodForm, setFoodForm] = useState({
    name: '',
    regionalName: '',
    category: 'STAPLE',
    servingUnit: 'serving',
    servingSizeG: 100,
    calories: 150,
    proteinG: 5,
    carbsG: 25,
    fatG: 2,
    fiberG: 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [exRes, foodRes] = await Promise.all([
        api.get<Exercise[]>('/fitness/exercises'),
        api.get<Food[]>('/fitness/nutrition/foods?limit=100'),
      ]);
      if (exRes.data) setExercises(exRes.data);
      if (foodRes.data) setFoods(foodRes.data);
    } catch (err) {
      console.error('Failed to load fitness catalogs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fitness/admin/exercises', exerciseForm);
      setShowExerciseModal(false);
      setExerciseForm({
        name: '',
        targetMuscleGroup: 'CHEST',
        category: 'BARBELL',
        equipment: 'Barbell, Bench',
        instructions: '',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create exercise', err);
      alert('Failed to create exercise in catalog.');
    }
  };

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fitness/admin/foods', foodForm);
      setShowFoodModal(false);
      setFoodForm({
        name: '',
        regionalName: '',
        category: 'STAPLE',
        servingUnit: 'serving',
        servingSizeG: 100,
        calories: 150,
        proteinG: 5,
        carbsG: 25,
        fatG: 2,
        fiberG: 1,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create food', err);
      alert('Failed to create food item in catalog.');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Delete this exercise from platform catalog?')) return;
    try {
      await api.delete(`/fitness/admin/exercises/${id}`);
      setExercises((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete exercise', err);
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm('Delete this food item from platform catalog?')) return;
    try {
      await api.delete(`/fitness/admin/foods/${id}`);
      setFoods((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Failed to delete food', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Fitness & Food Catalog Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global repository of verified strength exercises and Indian/regional nutrition items
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'exercises' ? (
            <button
              onClick={() => setShowExerciseModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              + Add Catalog Exercise
            </button>
          ) : (
            <button
              onClick={() => setShowFoodModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              + Add Catalog Food
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab('exercises')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'exercises' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Exercises Library ({exercises.length})
        </button>
        <button
          onClick={() => setTab('foods')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'foods' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Indian & Global Food Database ({foods.length})
        </button>
      </div>

      {/* Exercise Catalog Table */}
      {tab === 'exercises' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Exercise Name</th>
                <th className="py-3 px-4">Muscle Group</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {exercises.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{ex.name}</td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      {ex.targetMuscleGroup}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{ex.category || '--'}</td>
                  <td className="py-3 px-4 text-slate-400">{ex.equipment || 'None'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Food Database Table */}
      {tab === 'foods' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Serving Unit</th>
                <th className="py-3 px-4">Calories</th>
                <th className="py-3 px-4">Protein (g)</th>
                <th className="py-3 px-4">Carbs (g)</th>
                <th className="py-3 px-4">Fat (g)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {foods.map((food) => (
                <tr key={food.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">
                    {food.name}
                    {food.regionalName && (
                      <span className="ml-2 font-normal text-slate-400">({food.regionalName})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    1 {food.servingUnit} ({food.servingSizeG}g)
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">{food.calories} kcal</td>
                  <td className="py-3 px-4 text-blue-400">{food.proteinG}g</td>
                  <td className="py-3 px-4 text-amber-400">{food.carbsG}g</td>
                  <td className="py-3 px-4 text-rose-400">{food.fatG}g</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Exercise */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Verified Catalog Exercise</h3>
            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Exercise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Dumbbell Press"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Target Muscle Group *</label>
                <select
                  value={exerciseForm.targetMuscleGroup}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, targetMuscleGroup: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="CHEST">Chest</option>
                  <option value="BACK">Back</option>
                  <option value="SHOULDERS">Shoulders</option>
                  <option value="LEGS">Legs (Quads / Hamstrings)</option>
                  <option value="ARMS">Arms (Biceps / Triceps)</option>
                  <option value="CORE">Core / Abs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Category</label>
                <select
                  value={exerciseForm.category}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="BARBELL">Barbell</option>
                  <option value="DUMBBELL">Dumbbell</option>
                  <option value="CABLE">Cable</option>
                  <option value="MACHINE">Machine</option>
                  <option value="BODYWEIGHT">Bodyweight</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Equipment</label>
                <input
                  type="text"
                  placeholder="e.g. Dumbbells, Incline Bench"
                  value={exerciseForm.equipment}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExerciseModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Food */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Verified Catalog Food</h3>
            <form onSubmit={handleCreateFood} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Food Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kootu"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Regional Name</label>
                  <input
                    type="text"
                    placeholder="e.g. கூட்டு"
                    value={foodForm.regionalName}
                    onChange={(e) => setFoodForm({ ...foodForm, regionalName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Serving Unit</label>
                  <input
                    type="text"
                    value={foodForm.servingUnit}
                    onChange={(e) => setFoodForm({ ...foodForm, servingUnit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Serving Weight (g)</label>
                  <input
                    type="number"
                    value={foodForm.servingSizeG}
                    onChange={(e) => setFoodForm({ ...foodForm, servingSizeG: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    value={foodForm.calories}
                    onChange={(e) => setFoodForm({ ...foodForm, calories: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foodForm.proteinG}
                    onChange={(e) => setFoodForm({ ...foodForm, proteinG: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foodForm.carbsG}
                    onChange={(e) => setFoodForm({ ...foodForm, carbsG: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foodForm.fatG}
                    onChange={(e) => setFoodForm({ ...foodForm, fatG: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFoodModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Save Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


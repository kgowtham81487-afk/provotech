'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FitnessNav } from '../fitness-nav';
import { api } from '@/lib/api';

interface FoodItem {
  id: string;
  name: string;
  regionalName?: string;
  servingUnit: string;
  servingSizeG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  category?: string;
}

interface DiaryEntry {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  foodId: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  notes?: string;
  food: FoodItem;
}

interface NutritionBudget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export default function FoodDiaryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [budget, setBudget] = useState<NutritionBudget>({ calories: 2000, proteinG: 130, carbsG: 220, fatG: 65 });
  const [waterMl, setWaterMl] = useState<number>(0);
  const [waterTargetMl, setWaterTargetMl] = useState<number>(3000);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & add modal state
  const [activeMealType, setActiveMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingCount, setServingCount] = useState<number>(1);
  const [entryNotes, setEntryNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Custom food creator modal state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
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

  const loadData = async (dateStr: string) => {
    setLoading(true);
    try {
      const [diaryRes, dashRes] = await Promise.all([
        api.get<DiaryEntry[]>(`/fitness/nutrition/diary?date=${dateStr}`),
        api.get<{ profile?: { targetCalories?: number; targetProteinG?: number; targetCarbsG?: number; targetFatG?: number; waterTargetMl?: number }; waterTodayMl?: number }>(`/fitness/dashboard`),
      ]);

      if (diaryRes.data) setEntries(diaryRes.data);
      if (dashRes.data?.profile) {
        setBudget({
          calories: dashRes.data.profile.targetCalories || 2000,
          proteinG: dashRes.data.profile.targetProteinG || 130,
          carbsG: dashRes.data.profile.targetCarbsG || 220,
          fatG: dashRes.data.profile.targetFatG || 65,
        });
        if (dashRes.data.profile.waterTargetMl) setWaterTargetMl(dashRes.data.profile.waterTargetMl);
      }
      if (typeof dashRes.data?.waterTodayMl === 'number') {
        setWaterMl(dashRes.data.waterTodayMl);
      }
    } catch (err) {
      console.error('Failed to load food diary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Search foods debounce
  useEffect(() => {
    if (!activeMealType) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<FoodItem[]>(`/fitness/nutrition/foods?q=${encodeURIComponent(searchQuery)}`);
        if (res.data) setSearchResults(res.data);
      } catch (err) {
        console.error('Failed to search foods', err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, activeMealType]);

  const handleAddEntry = async () => {
    if (!selectedFood || !activeMealType) return;
    setSubmitting(true);
    try {
      await api.post('/fitness/nutrition/diary', {
        mealType: activeMealType,
        foodId: selectedFood.id,
        servings: Number(servingCount) || 1,
        notes: entryNotes,
        loggedAt: `${selectedDate}T12:00:00.000Z`,
      });
      setActiveMealType(null);
      setSelectedFood(null);
      setServingCount(1);
      setEntryNotes('');
      setSearchQuery('');
      await loadData(selectedDate);
    } catch (err) {
      console.error('Failed to log food entry', err);
      alert('Failed to log food. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Remove this food item from your diary?')) return;
    try {
      await api.delete(`/fitness/nutrition/diary/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<FoodItem>('/fitness/nutrition/foods', customForm);
      if (res.data) {
        setSelectedFood(res.data);
        setIsCreatingCustom(false);
      }
    } catch (err) {
      console.error('Failed to create custom food', err);
      alert('Failed to create custom food.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddWater = async (amount: number) => {
    try {
      const res = await api.post<{ amountMl: number }>('/fitness/water', { amountMl: amount });
      setWaterMl((prev) => prev + amount);
    } catch (err) {
      console.error('Failed to add water', err);
    }
  };

  // Group entries by meal type
  const mealGroups = useMemo(() => {
    const groups: Record<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK', DiaryEntry[]> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    };
    entries.forEach((e) => {
      if (groups[e.mealType]) groups[e.mealType].push(e);
    });
    return groups;
  }, [entries]);

  // Totals consumed
  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.calories += Math.round(e.calories);
        acc.protein += Math.round(e.proteinG);
        acc.carbs += Math.round(e.carbsG);
        acc.fat += Math.round(e.fatG);
        acc.fiber += Math.round(e.fiberG || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [entries]);

  const caloriesRemaining = budget.calories - totals.calories;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FitnessNav />

        {/* Date Selector Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Food & Macro Diary</h1>
            <p className="text-sm text-slate-400">Track meals, Indian staple recipes, hydration & nutrient balance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              ← Prev Day
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Next Day →
            </button>
          </div>
        </div>

        {/* Macro Summary Dashboard Card */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Calories Ring / Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Calories Remaining</p>
              <div className="mt-2 text-4xl font-extrabold text-emerald-400">
                {caloriesRemaining} <span className="text-base font-normal text-slate-400">kcal</span>
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>Goal: {budget.calories} kcal</span>
                <span>Food: {totals.calories} kcal</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, Math.round((totals.calories / (budget.calories || 1)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-blue-400">PROTEIN</span>
                <span>{totals.protein} / {budget.proteinG}g</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-white">{totals.protein}g</div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min(100, Math.round((totals.protein / (budget.proteinG || 1)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-amber-400">CARBS</span>
                <span>{totals.carbs} / {budget.carbsG}g</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-white">{totals.carbs}g</div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${Math.min(100, Math.round((totals.carbs / (budget.carbsG || 1)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-rose-400">FAT</span>
                <span>{totals.fat} / {budget.fatG}g</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-white">{totals.fat}g</div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${Math.min(100, Math.round((totals.fat / (budget.fatG || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Hydration bar */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-cyan-900/30 bg-cyan-950/20 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold">
                💧
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Daily Hydration Tracker</p>
                <p className="text-xs text-cyan-300">
                  {waterMl} ml logged / {waterTargetMl} ml target ({Math.round((waterMl / waterTargetMl) * 100)}%)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleQuickAddWater(250)}
                className="rounded-lg border border-cyan-700/50 bg-cyan-900/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-800/40"
              >
                +250 ml (Glass)
              </button>
              <button
                onClick={() => handleQuickAddWater(500)}
                className="rounded-lg border border-cyan-700/50 bg-cyan-900/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-800/40"
              >
                +500 ml (Bottle)
              </button>
              <button
                onClick={() => handleQuickAddWater(750)}
                className="rounded-lg border border-cyan-700/50 bg-cyan-900/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-800/40"
              >
                +750 ml (Shaker)
              </button>
            </div>
          </div>
        </div>

        {/* Meals Sections */}
        {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((mealKey) => {
          const mealList = mealGroups[mealKey];
          const mealCals = mealList.reduce((sum, e) => sum + Math.round(e.calories), 0);
          const mealProtein = mealList.reduce((sum, e) => sum + Math.round(e.proteinG), 0);
          const mealCarbs = mealList.reduce((sum, e) => sum + Math.round(e.carbsG), 0);
          const mealFat = mealList.reduce((sum, e) => sum + Math.round(e.fatG), 0);

          return (
            <div key={mealKey} className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
              <div className="flex flex-col items-start justify-between border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold capitalize text-white">
                    {mealKey.toLowerCase()}{' '}
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({mealCals} kcal • P: {mealProtein}g • C: {mealCarbs}g • F: {mealFat}g)
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActiveMealType(mealKey);
                    setSelectedFood(null);
                    setSearchQuery('');
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 sm:mt-0"
                >
                  + Add Food
                </button>
              </div>

              {/* Items Table */}
              {mealList.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No food logged for {mealKey.toLowerCase()} yet.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-800/60">
                  {mealList.map((entry) => (
                    <div key={entry.id} className="flex flex-col justify-between py-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-white">
                          {entry.food?.name}
                          {entry.food?.regionalName && (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              ({entry.food.regionalName})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entry.servings} x {entry.food?.servingUnit || 'serving'} ({Math.round(entry.servings * (entry.food?.servingSizeG || 100))}g)
                          {entry.notes && <span className="ml-2 italic text-slate-500">“{entry.notes}”</span>}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-6 sm:mt-0">
                        <div className="text-right text-xs">
                          <span className="font-bold text-emerald-400">{Math.round(entry.calories)} kcal</span>
                          <span className="ml-2 text-slate-400">
                            P: {Math.round(entry.proteinG)}g | C: {Math.round(entry.carbsG)}g | F: {Math.round(entry.fatG)}g
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="rounded p-1 text-slate-500 hover:bg-red-950/40 hover:text-red-400"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Modal: Search / Add Food */}
        {activeMealType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">
                  Add to {activeMealType.toLowerCase()}
                </h3>
                <button
                  onClick={() => {
                    setActiveMealType(null);
                    setSelectedFood(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {!selectedFood ? (
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search Indian foods (Idli, Dosa, Paneer, Chicken Biryani...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsCreatingCustom(true)}
                      className="whitespace-nowrap rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-700"
                    >
                      + Custom Food
                    </button>
                  </div>

                  <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {searchResults.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500">
                        {searchQuery ? 'No matching foods found. Create a custom food item!' : 'Type food name to search the catalog.'}
                      </div>
                    ) : (
                      searchResults.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFood(f);
                            setServingCount(1);
                          }}
                          className="flex cursor-pointer items-center justify-between p-3 hover:bg-slate-800/60 rounded-lg transition"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {f.name} {f.regionalName && <span className="text-xs text-slate-400">({f.regionalName})</span>}
                            </p>
                            <p className="text-xs text-slate-400">
                              Per {f.servingUnit} ({f.servingSizeG}g) • P: {f.proteinG}g | C: {f.carbsG}g | F: {f.fatG}g
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">{f.calories} kcal</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Selected food portion config */
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base">
                        {selectedFood.name} {selectedFood.regionalName && `(${selectedFood.regionalName})`}
                      </h4>
                      <button
                        onClick={() => setSelectedFood(null)}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Change Food
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Standard serving: 1 {selectedFood.servingUnit} ({selectedFood.servingSizeG}g) = {selectedFood.calories} kcal
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400">Number of Servings</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.1"
                        value={servingCount}
                        onChange={(e) => setServingCount(parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400">Total Calculated Weight</label>
                      <div className="mt-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                        {Math.round(servingCount * selectedFood.servingSizeG)} grams
                      </div>
                    </div>
                  </div>

                  {/* Calculated Nutrients preview */}
                  <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400">Calories</span>
                      <p className="font-bold text-emerald-400">{Math.round(servingCount * selectedFood.calories)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Protein</span>
                      <p className="font-bold text-blue-400">{(servingCount * selectedFood.proteinG).toFixed(1)}g</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Carbs</span>
                      <p className="font-bold text-amber-400">{(servingCount * selectedFood.carbsG).toFixed(1)}g</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Fat</span>
                      <p className="font-bold text-rose-400">{(servingCount * selectedFood.fatG).toFixed(1)}g</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. without ghee, homemade with less oil"
                      value={entryNotes}
                      onChange={(e) => setEntryNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFood(null)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleAddEntry}
                      className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : `Add to ${activeMealType.toLowerCase()}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Custom Food */}
        {isCreatingCustom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Create Custom Food Item</h3>
                <button onClick={() => setIsCreatingCustom(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateCustomFood} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400">Food Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ragi Dosa"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Regional Name</label>
                    <input
                      type="text"
                      placeholder="e.g. கேழ்வரகு தோசை"
                      value={customForm.regionalName}
                      onChange={(e) => setCustomForm({ ...customForm, regionalName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400">Serving Unit</label>
                    <input
                      type="text"
                      value={customForm.servingUnit}
                      onChange={(e) => setCustomForm({ ...customForm, servingUnit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Serving Weight (g)</label>
                    <input
                      type="number"
                      value={customForm.servingSizeG}
                      onChange={(e) => setCustomForm({ ...customForm, servingSizeG: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Calories (kcal)</label>
                    <input
                      type="number"
                      required
                      value={customForm.calories}
                      onChange={(e) => setCustomForm({ ...customForm, calories: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Protein (g)</label>
                    <input
                      type="number"
                      value={customForm.proteinG}
                      onChange={(e) => setCustomForm({ ...customForm, proteinG: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Carbs (g)</label>
                    <input
                      type="number"
                      value={customForm.carbsG}
                      onChange={(e) => setCustomForm({ ...customForm, carbsG: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Fat (g)</label>
                    <input
                      type="number"
                      value={customForm.fatG}
                      onChange={(e) => setCustomForm({ ...customForm, fatG: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                  >
                    Save & Select Food
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


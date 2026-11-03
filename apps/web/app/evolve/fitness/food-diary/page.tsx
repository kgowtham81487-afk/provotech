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
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'SNACKS';
  foodId?: string;
  foodName?: string;
  servings?: number;
  servingQuantity?: number;
  servingUnit?: string;
  calories: number;
  proteinG?: number;
  proteinGrams?: number;
  carbsG?: number;
  carbGrams?: number;
  fatG?: number;
  fatGrams?: number;
  fiberG?: number;
  fibreGrams?: number;
  notes?: string;
  food?: FoodItem;
}

interface NutritionBudget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface EstimatedFoodItem {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fibreGrams: number;
}

interface MacroEstimationResult {
  mealType: string;
  description: string;
  items: EstimatedFoodItem[];
  totals: {
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    fibreGrams: number;
  };
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
  provider: string;
  model: string;
  fallbackOccurred: boolean;
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

  // AI Macro Estimator modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMealType, setAiMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS'>('BREAKFAST');
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<MacroEstimationResult | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadData = async (dateStr: string) => {
    setLoading(true);
    try {
      const [diaryRes, dashRes] = await Promise.all([
        api.get<any>(`/fitness/nutrition/diary?date=${dateStr}`),
        api.get<{ profile?: { targetCalories?: number; targetProteinG?: number; targetCarbsG?: number; targetFatG?: number; waterTargetMl?: number }; waterTodayMl?: number }>(`/fitness/dashboard`),
      ]);

      if (diaryRes.data) {
        const raw = diaryRes.data;
        const rawList = Array.isArray(raw)
          ? raw
          : raw.entries || [
              ...(raw.meals?.BREAKFAST || []),
              ...(raw.meals?.LUNCH || []),
              ...(raw.meals?.DINNER || []),
              ...(raw.meals?.SNACKS || raw.meals?.SNACK || []),
            ];
        const normalized: DiaryEntry[] = (rawList || []).map((e: any) => ({
          ...e,
          foodName: e.foodName || e.food?.name || 'Food item',
          calories: Number(e.calories) || 0,
          proteinG: Number(e.proteinGrams ?? e.proteinG ?? 0),
          carbsG: Number(e.carbGrams ?? e.carbsG ?? 0),
          fatG: Number(e.fatGrams ?? e.fatG ?? 0),
          fiberG: Number(e.fibreGrams ?? e.fiberG ?? 0),
          servings: Number(e.servingQuantity ?? e.servings ?? 1),
          mealType: (e.mealType === 'SNACKS' ? 'SNACK' : e.mealType) as any,
        }));
        setEntries(normalized);
      }
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
        mealType: activeMealType === 'SNACK' ? 'SNACKS' : activeMealType,
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        servingQuantity: Number(servingCount) || 1,
        servingUnit: selectedFood.servingUnit || 'serving',
        calories: Math.round(selectedFood.calories * (Number(servingCount) || 1)),
        proteinGrams: Math.round(selectedFood.proteinG * (Number(servingCount) || 1) * 10) / 10,
        carbGrams: Math.round(selectedFood.carbsG * (Number(servingCount) || 1) * 10) / 10,
        fatGrams: Math.round(selectedFood.fatG * (Number(servingCount) || 1) * 10) / 10,
        fibreGrams: Math.round((selectedFood.fiberG || 0) * (Number(servingCount) || 1) * 10) / 10,
        notes: entryNotes,
        loggedDate: `${selectedDate}T12:00:00.000Z`,
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
      await api.post<{ amountMl: number }>('/fitness/water', { amountMl: amount });
      setWaterMl((prev) => prev + amount);
    } catch (err) {
      console.error('Failed to add water', err);
    }
  };

  // AI Macro Estimation handlers
  const handleRunAiEstimate = async () => {
    if (!aiDescription.trim()) {
      setAiError('Please enter a description of what you ate.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.post<MacroEstimationResult>('/fitness/nutrition/estimate', {
        description: aiDescription.trim(),
        mealType: aiMealType,
      });
      if (res.data) {
        setAiResult(res.data);
      } else {
        setAiError('No estimation result received from AI service.');
      }
    } catch (err: any) {
      console.error('AI Estimation error', err);
      setAiError(err.message || 'Failed to estimate macros. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmAndLogAiEstimate = async () => {
    if (!aiResult || aiResult.items.length === 0) return;
    setAiSaving(true);
    try {
      for (const item of aiResult.items) {
        await api.post('/fitness/nutrition/diary', {
          mealType: aiMealType,
          foodName: item.foodName,
          servingQuantity: item.quantity,
          servingUnit: item.unit,
          calories: item.calories,
          proteinGrams: item.proteinGrams,
          carbGrams: item.carbGrams,
          fatGrams: item.fatGrams,
          fibreGrams: item.fibreGrams,
          loggedDate: `${selectedDate}T12:00:00.000Z`,
        });
      }
      setShowAiModal(false);
      setAiResult(null);
      setAiDescription('');
      await loadData(selectedDate);
    } catch (err: any) {
      console.error('Failed to log estimated items', err);
      alert('Failed to log some estimated food items: ' + (err.message || 'Error occurred'));
    } finally {
      setAiSaving(false);
    }
  };

  const handleUpdateAiItem = (index: number, field: keyof EstimatedFoodItem, value: any) => {
    if (!aiResult) return;
    const updated = [...aiResult.items];
    updated[index] = { ...updated[index], [field]: value };
    const newTotals = updated.reduce(
      (acc, it) => ({
        calories: acc.calories + (Number(it.calories) || 0),
        proteinGrams: Math.round((acc.proteinGrams + (Number(it.proteinGrams) || 0)) * 10) / 10,
        carbGrams: Math.round((acc.carbGrams + (Number(it.carbGrams) || 0)) * 10) / 10,
        fatGrams: Math.round((acc.fatGrams + (Number(it.fatGrams) || 0)) * 10) / 10,
        fibreGrams: Math.round((acc.fibreGrams + (Number(it.fibreGrams) || 0)) * 10) / 10,
      }),
      { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0, fibreGrams: 0 }
    );
    setAiResult({
      ...aiResult,
      items: updated,
      totals: newTotals,
    });
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
      const k = (e.mealType === 'SNACKS' ? 'SNACK' : e.mealType) as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      if (groups[k]) groups[k].push(e);
    });
    return groups;
  }, [entries]);

  // Totals consumed
  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.calories += Math.round(Number(e.calories) || 0);
        acc.protein += Math.round(Number(e.proteinGrams ?? e.proteinG ?? 0));
        acc.carbs += Math.round(Number(e.carbGrams ?? e.carbsG ?? 0));
        acc.fat += Math.round(Number(e.fatGrams ?? e.fatG ?? 0));
        acc.fiber += Math.round(Number(e.fibreGrams ?? e.fiberG ?? 0));
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

        {/* Date Selector Header & Quick AI Action */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Daily Food & Macro Diary
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                HealthifyMe & Hevy Inspired
              </span>
            </h1>
            <p className="text-sm text-slate-400">Track meals, Indian staple recipes, hydration & nutrient balance</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setAiMealType('BREAKFAST');
                setShowAiModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-500/30 transition shadow-sm"
            >
              ✨ AI Quick Estimate
            </button>
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
                  {waterMl} ml logged / {waterTargetMl} ml target ({Math.round((waterMl / (waterTargetMl || 1)) * 100)}%)
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
          const mealCals = mealList.reduce((sum, e) => sum + Math.round(Number(e.calories) || 0), 0);
          const mealProtein = mealList.reduce((sum, e) => sum + Math.round(Number(e.proteinGrams ?? e.proteinG ?? 0)), 0);
          const mealCarbs = mealList.reduce((sum, e) => sum + Math.round(Number(e.carbGrams ?? e.carbsG ?? 0)), 0);
          const mealFat = mealList.reduce((sum, e) => sum + Math.round(Number(e.fatGrams ?? e.fatG ?? 0)), 0);

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
                <div className="mt-2 flex items-center gap-2 sm:mt-0">
                  <button
                    onClick={() => {
                      setAiMealType(mealKey === 'SNACK' ? 'SNACKS' : mealKey);
                      setShowAiModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                  >
                    ✨ AI Estimate
                  </button>
                  <button
                    onClick={() => {
                      setActiveMealType(mealKey);
                      setSelectedFood(null);
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                  >
                    + Add Food
                  </button>
                </div>
              </div>

              {/* Items Table */}
              {mealList.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No food logged for {mealKey.toLowerCase()} yet.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-800/60">
                  {mealList.map((entry) => {
                    const displayName = entry.foodName || entry.food?.name || 'Food item';
                    const cals = Math.round(Number(entry.calories) || 0);
                    const prot = Math.round(Number(entry.proteinGrams ?? entry.proteinG ?? 0));
                    const carbs = Math.round(Number(entry.carbGrams ?? entry.carbsG ?? 0));
                    const fat = Math.round(Number(entry.fatGrams ?? entry.fatG ?? 0));
                    const servings = Number(entry.servingQuantity ?? entry.servings ?? 1);
                    const unit = entry.servingUnit || entry.food?.servingUnit || 'serving';

                    return (
                      <div key={entry.id} className="flex flex-col justify-between py-3 sm:flex-row sm:items-center">
                        <div>
                          <div className="font-semibold text-white">
                            {displayName}
                            {entry.food?.regionalName && (
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                ({entry.food.regionalName})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {servings} x {unit}
                            {entry.notes && <span className="ml-2 italic text-slate-500">“{entry.notes}”</span>}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-6 sm:mt-0">
                          <div className="text-right text-xs">
                            <span className="font-bold text-emerald-400">{cals} kcal</span>
                            <span className="ml-2 text-slate-400">
                              P: {prot}g | C: {carbs}g | F: {fat}g
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="rounded p-1 text-slate-500 hover:bg-red-950/40 hover:text-red-400"
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Modal: AI Quick Macro Estimator */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold text-lg">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Quick Macro Estimator</h3>
                    <p className="text-xs text-slate-400">Powered by Multi-Provider Fallback Cascade (Gemini → DeepSeek → Groq)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAiModal(false);
                    setAiResult(null);
                    setAiError(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {!aiResult ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Meal</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAiMealType(m)}
                          className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                            aiMealType === m
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                              : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Describe What You Ate (Natural Language)
                    </label>
                    <textarea
                      rows={4}
                      placeholder='e.g. "2 medium idlis with 1 bowl sambar and 2 tablespoons coconut chutney" or "1 plate chicken biryani with boiled egg and raita"'
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span>Quick examples:</span>
                      <button
                        type="button"
                        onClick={() => setAiDescription('2 medium idlis with 1 bowl sambar and 2 tbsp coconut chutney')}
                        className="text-purple-400 underline hover:text-purple-300"
                      >
                        2 Idlis + Sambar + Chutney
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setAiDescription('1 Masala Dosa with tomato chutney and filter coffee')}
                        className="text-purple-400 underline hover:text-purple-300"
                      >
                        Masala Dosa + Coffee
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setAiDescription('1 bowl white rice with dal tadka and 100g paneer bhurji')}
                        className="text-purple-400 underline hover:text-purple-300"
                      >
                        Rice + Dal + Paneer
                      </button>
                    </div>
                  </div>

                  {aiError && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                      ⚠️ {aiError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAiModal(false)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={aiLoading || !aiDescription.trim()}
                      onClick={handleRunAiEstimate}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Analyzing & Estimating...</span>
                        </>
                      ) : (
                        <>
                          <span>✨ Estimate with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* AI Estimation Review & Edit Screen */
                <div className="mt-4 space-y-4">
                  {/* Badges and metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                        ⚡ {aiResult.provider} ({aiResult.model})
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        aiResult.confidence === 'high'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : aiResult.confidence === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {aiResult.confidence.toUpperCase()} CONFIDENCE
                      </span>
                      {aiResult.fallbackOccurred && (
                        <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                          Fallback Active
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="text-xs text-purple-400 hover:underline"
                    >
                      ← Re-estimate
                    </button>
                  </div>

                  {/* Estimated items table with live editing */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Estimated Items (You can tweak portions/macros before logging)
                    </h4>
                    <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/40">
                      {aiResult.items.map((item, idx) => (
                        <div key={idx} className="p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={item.foodName}
                              onChange={(e) => handleUpdateAiItem(idx, 'foodName', e.target.value)}
                              className="w-1/2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                min="0.1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateAiItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                                className="w-16 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-center text-white"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateAiItem(idx, 'unit', e.target.value)}
                                className="w-20 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            <div>
                              <span className="block text-[10px] text-slate-500">Calories</span>
                              <input
                                type="number"
                                value={item.calories}
                                onChange={(e) => handleUpdateAiItem(idx, 'calories', parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-emerald-400 font-bold"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Protein (g)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={item.proteinGrams}
                                onChange={(e) => handleUpdateAiItem(idx, 'proteinGrams', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-blue-400 font-bold"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Carbs (g)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={item.carbGrams}
                                onChange={(e) => handleUpdateAiItem(idx, 'carbGrams', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-amber-400 font-bold"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Fat (g)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={item.fatGrams}
                                onChange={(e) => handleUpdateAiItem(idx, 'fatGrams', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-rose-400 font-bold"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Fibre (g)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={item.fibreGrams}
                                onChange={(e) => handleUpdateAiItem(idx, 'fibreGrams', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-300"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Totals Box */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Total Calculated Macros</span>
                      <span className="text-sm font-extrabold text-white">{aiResult.totals.calories} kcal</span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-900/60 p-2">
                        <span className="block text-[10px] text-blue-400">Protein</span>
                        <span className="font-bold text-white">{aiResult.totals.proteinGrams}g</span>
                      </div>
                      <div className="rounded-lg bg-slate-900/60 p-2">
                        <span className="block text-[10px] text-amber-400">Carbs</span>
                        <span className="font-bold text-white">{aiResult.totals.carbGrams}g</span>
                      </div>
                      <div className="rounded-lg bg-slate-900/60 p-2">
                        <span className="block text-[10px] text-rose-400">Fat</span>
                        <span className="font-bold text-white">{aiResult.totals.fatGrams}g</span>
                      </div>
                      <div className="rounded-lg bg-slate-900/60 p-2">
                        <span className="block text-[10px] text-slate-400">Fibre</span>
                        <span className="font-bold text-white">{aiResult.totals.fibreGrams}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Assumptions list */}
                  {aiResult.assumptions && aiResult.assumptions.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portion Assumptions:</p>
                      <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                        {aiResult.assumptions.map((assump, i) => (
                          <li key={i}>{assump}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={aiSaving || aiResult.items.length === 0}
                      onClick={handleConfirmAndLogAiEstimate}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {aiSaving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                          <span>Logging to Diary...</span>
                        </>
                      ) : (
                        <span>✓ Confirm & Add to {aiMealType.toLowerCase()}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Search & Log Food */}
        {activeMealType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">
                  Add Food to {activeMealType.toLowerCase()}
                </h3>
                <button
                  onClick={() => {
                    setActiveMealType(null);
                    setSelectedFood(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {!selectedFood ? (
                /* Search View */
                <div className="mt-4 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search South Indian & Indian foods (e.g. Idli, Sambar, Dosa, Paneer)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Can't find what you ate?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCustom(true);
                      }}
                      className="font-bold text-emerald-400 hover:underline"
                    >
                      + Create Custom Food
                    </button>
                  </div>

                  {/* Search results list */}
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {searchResults.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        {searchQuery ? 'No foods found matching your search.' : 'Type to search the verified food database.'}
                      </div>
                    ) : (
                      searchResults.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => setSelectedFood(food)}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-emerald-500/50 hover:bg-slate-800/60"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {food.name} {food.regionalName && <span className="text-xs text-slate-400 font-normal">({food.regionalName})</span>}
                            </p>
                            <p className="text-xs text-slate-400">
                              1 {food.servingUnit} ({food.servingSizeG}g)
                            </p>
                          </div>
                          <div className="text-right text-xs">
                            <span className="font-bold text-emerald-400">{food.calories} kcal</span>
                            <span className="ml-2 text-slate-400">P: {food.proteinG}g</span>
                          </div>
                        </button>
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

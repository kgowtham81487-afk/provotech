'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Apple,
  Flame,
  UtensilsCrossed,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FitnessNav } from '../fitness-nav';

export default function NutritionTargetsPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calorieTarget, setCalorieTarget] = useState(2200);
  const [proteinTarget, setProteinTarget] = useState(140);
  const [carbTarget, setCarbTarget] = useState(250);
  const [fatTarget, setFatTarget] = useState(65);
  const [waterTarget, setWaterTarget] = useState(3000);
  const [dietaryPreference, setDietaryPreference] = useState('NON_VEGETARIAN');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    const res = await apiRequest('/fitness/profile', { method: 'GET' });
    if (res.success && res.data) {
      setProfile(res.data);
      setCalorieTarget(res.data.dailyCalorieTarget || 2200);
      setProteinTarget(res.data.proteinGramsTarget || 140);
      setCarbTarget(res.data.carbGramsTarget || 250);
      setFatTarget(res.data.fatGramsTarget || 65);
      setWaterTarget(res.data.waterMlTarget || 3000);
      setDietaryPreference(res.data.dietaryPreference || 'NON_VEGETARIAN');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    const res = await apiRequest('/fitness/profile', {
      method: 'PUT',
      body: JSON.stringify({
        dailyCalorieTarget: Number(calorieTarget),
        proteinGramsTarget: Number(proteinTarget),
        carbGramsTarget: Number(carbTarget),
        fatGramsTarget: Number(fatTarget),
        waterMlTarget: Number(waterTarget),
        dietaryPreference,
      }),
    });
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Nutrition & hydration targets updated successfully.' });
      loadProfile();
    } else {
      setFeedback({ type: 'error', message: res.error?.message || 'Failed to update targets.' });
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark pb-16">
      <FitnessNav />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <Apple className="h-4 w-4" />
              <span>Nutrition & Macro Targets</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Daily Nutritional Budget</h1>
          </div>

          <Link
            href="/evolve/fitness/food-diary"
            className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-slate-700 text-white font-semibold text-xs border border-surface-border transition flex items-center gap-1.5"
          >
            <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
            Open Food Diary
          </Link>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl mb-6 text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Scientific Methodology Notice */}
        <div className="p-4 rounded-2xl border border-surface-border bg-surface mb-6 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Methodology Note:</strong> Calorie and macronutrient estimates in EES are derived using the validated <strong>Mifflin-St Jeor formula</strong> for Basal Metabolic Rate (BMR) adjusted by physical activity multipliers. These figures serve as educational performance guidelines and should not be construed as clinical medical advice.
          </div>
        </div>

        {/* Targets Form */}
        <form onSubmit={handleSaveTargets} className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm">
          <h3 className="text-base font-bold text-white mb-4">Custom Targets & Preferences</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Daily Calorie Budget (kcal)</span>
              </label>
              <input
                type="number"
                min="1000"
                max="6000"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Total energy consumption budgeted per day
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dietary Preference
              </label>
              <select
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="NON_VEGETARIAN">Non-Vegetarian</option>
                <option value="EGGETARIAN">Eggetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="JAIN">Jain</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Influences AI meal and recipe recommendations
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-emerald-400">
                Daily Protein Target (grams)
              </label>
              <input
                type="number"
                min="30"
                max="400"
                value={proteinTarget}
                onChange={(e) => setProteinTarget(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Approx. 1.8g - 2.2g per kg body weight for muscle recovery
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-amber-400">
                Daily Carbohydrate Target (grams)
              </label>
              <input
                type="number"
                min="30"
                max="600"
                value={carbTarget}
                onChange={(e) => setCarbTarget(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Fuels glycogen stores for high-intensity lifting
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-rose-400">
                Daily Fat Target (grams)
              </label>
              <input
                type="number"
                min="20"
                max="200"
                value={fatTarget}
                onChange={(e) => setFatTarget(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Essential for hormonal health and joint longevity
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-cyan-400">
                Daily Water Intake Target (ml)
              </label>
              <input
                type="number"
                min="1000"
                max="8000"
                step="250"
                value={waterTarget}
                onChange={(e) => setWaterTarget(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Recommended 3000ml - 4000ml for active athletes
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Nutrition Targets'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

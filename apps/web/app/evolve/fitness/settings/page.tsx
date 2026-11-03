'use client';

import { useEffect, useState } from 'react';
import { FitnessNav } from '../fitness-nav';
import { api } from '@/lib/api';

export default function FitnessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    heightCm: 175,
    currentWeightKg: 72,
    targetWeightKg: 70,
    gender: 'MALE',
    dateOfBirth: '1998-05-15',
    activityLevel: 'MODERATE',
    fitnessGoal: 'MUSCLE_GAIN',
    dietaryPreference: 'NON_VEGETARIAN',
    waterTargetMl: 3000,
    restTimerSeconds: 90,
    soundAlerts: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>('/fitness/profile');
        if (res.data) {
          setForm({
            heightCm: res.data.heightCm || 175,
            currentWeightKg: res.data.currentWeightKg || 72,
            targetWeightKg: res.data.targetWeightKg || 70,
            gender: res.data.gender || 'MALE',
            dateOfBirth: res.data.dateOfBirth
              ? new Date(res.data.dateOfBirth).toISOString().slice(0, 10)
              : '1998-05-15',
            activityLevel: res.data.activityLevel || 'MODERATE',
            fitnessGoal: res.data.fitnessGoal || 'MUSCLE_GAIN',
            dietaryPreference: res.data.dietaryPreference || 'NON_VEGETARIAN',
            waterTargetMl: res.data.waterTargetMl || 3000,
            restTimerSeconds: res.data.restTimerSeconds || 90,
            soundAlerts: res.data.soundAlerts !== false,
          });
        }
      } catch (err) {
        console.error('Failed to load fitness profile', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.put('/fitness/profile', {
        ...form,
        heightCm: Number(form.heightCm),
        currentWeightKg: Number(form.currentWeightKg),
        targetWeightKg: Number(form.targetWeightKg),
        waterTargetMl: Number(form.waterTargetMl),
        restTimerSeconds: Number(form.restTimerSeconds),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update fitness settings', err);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <FitnessNav />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Fitness & Wellness Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure your biometrics, target objectives, rest timer preferences, and dietary profiles
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-semibold">
            ✓ Settings successfully saved and TDEE / macro targets recalculated!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
          {/* Section: Biometrics */}
          <div>
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Biometrics & Demographics</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="MALE">Male (+5 kcal Mifflin baseline)</option>
                  <option value="FEMALE">Female (-161 kcal Mifflin baseline)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Height (cm)</label>
                <input
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.currentWeightKg}
                  onChange={(e) => setForm({ ...form, currentWeightKg: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Goals & Activity */}
          <div>
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Goals & Lifestyle</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.targetWeightKg}
                  onChange={(e) => setForm({ ...form, targetWeightKg: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Daily Water Target (ml)</label>
                <input
                  type="number"
                  step="250"
                  value={form.waterTargetMl}
                  onChange={(e) => setForm({ ...form, waterTargetMl: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Primary Fitness Goal</label>
                <select
                  value={form.fitnessGoal}
                  onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="WEIGHT_LOSS">Weight Loss / Caloric Deficit (-400 kcal)</option>
                  <option value="MAINTENANCE">Maintenance / Body Recomposition (TDEE balance)</option>
                  <option value="MUSCLE_GAIN">Muscle Gain / Lean Bulking (+300 kcal)</option>
                  <option value="ENDURANCE">Endurance & Athletic Conditioning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Daily Activity Level</label>
                <select
                  value={form.activityLevel}
                  onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="SEDENTARY">Sedentary (Desk job, minimal exercise - 1.2x)</option>
                  <option value="LIGHT">Lightly Active (1-3 days exercise/week - 1.375x)</option>
                  <option value="MODERATE">Moderately Active (3-5 days workout/week - 1.55x)</option>
                  <option value="VERY_ACTIVE">Very Active (6-7 days hard training - 1.725x)</option>
                  <option value="EXTRA_ACTIVE">Athlete / Heavy physical labor - 1.9x</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Dietary Preference</label>
                <select
                  value={form.dietaryPreference}
                  onChange={(e) => setForm({ ...form, dietaryPreference: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="NON_VEGETARIAN">Non-Vegetarian (Eggs, Chicken, Meat, Seafood)</option>
                  <option value="VEGETARIAN">Vegetarian (Lacto-ovo, Paneer, Dairy)</option>
                  <option value="VEGAN">Vegan (Plant-based only)</option>
                  <option value="EGGETARIAN">Eggetarian (Vegetarian + Eggs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Workout Preferences */}
          <div>
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Workout & Rest Timer Preferences</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Default Rest Timer (seconds)</label>
                <select
                  value={form.restTimerSeconds}
                  onChange={(e) => setForm({ ...form, restTimerSeconds: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value={45}>45 seconds (Circuit / HIIT)</option>
                  <option value={60}>60 seconds (Hypertrophy accessories)</option>
                  <option value={90}>90 seconds (Standard hypertrophy)</option>
                  <option value={120}>120 seconds (Compound lifts)</option>
                  <option value={180}>180 seconds (Heavy powerlifting)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="soundAlerts"
                  checked={form.soundAlerts}
                  onChange={(e) => setForm({ ...form, soundAlerts: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="soundAlerts" className="text-sm font-semibold text-white cursor-pointer">
                  Play sound alert when rest timer completes
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'Saving Changes...' : 'Save Settings & Recalculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


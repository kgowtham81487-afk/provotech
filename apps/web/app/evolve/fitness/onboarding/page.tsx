'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function FitnessOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    gender: 'MALE',
    dateOfBirth: '1998-05-15',
    heightCm: 175,
    currentWeightKg: 72,
    fitnessGoal: 'MUSCLE_GAIN',
    activityLevel: 'MODERATE',
    targetWeightKg: 75,
    dietaryPreference: 'NON_VEGETARIAN',
    waterTargetMl: 3000,
    experienceLevel: 'INTERMEDIATE',
    restTimerSeconds: 90,
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.put('/fitness/profile', {
        ...formData,
        heightCm: Number(formData.heightCm),
        currentWeightKg: Number(formData.currentWeightKg),
        targetWeightKg: Number(formData.targetWeightKg),
        waterTargetMl: Number(formData.waterTargetMl),
        restTimerSeconds: Number(formData.restTimerSeconds),
      });
      router.push('/evolve/fitness');
    } catch (err) {
      console.error('Failed to complete fitness onboarding', err);
      alert('Could not save profile. Please check details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>STEP {step} OF 4</span>
            <span>{step === 1 ? 'Biometrics' : step === 2 ? 'Goals & Activity' : step === 3 ? 'Nutrition' : 'Training Experience'}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Biometrics */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white">Your Biometrics</h2>
              <p className="mt-1 text-sm text-slate-400">
                Used to calculate your precise Basal Metabolic Rate (BMR) via Mifflin-St Jeor equation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Biological Sex</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Height (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.currentWeightKg}
                  onChange={(e) => setFormData({ ...formData, currentWeightKg: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goals & Activity */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white">Your Primary Fitness Goal</h2>
              <p className="mt-1 text-sm text-slate-400">
                Helps customize your caloric surplus/deficit and daily macronutrient distribution.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { key: 'WEIGHT_LOSS', label: 'Fat Loss & Cutting', desc: 'Caloric deficit (-400 kcal) with high protein retention' },
                { key: 'MAINTENANCE', label: 'Body Recomposition', desc: 'Stay at baseline TDEE while building muscle and losing fat' },
                { key: 'MUSCLE_GAIN', label: 'Hypertrophy / Lean Bulk', desc: 'Slight surplus (+300 kcal) for maximal muscle growth' },
                { key: 'ENDURANCE', label: 'Cardio & Stamina', desc: 'Higher carbohydrate ratios for performance & recovery' },
              ].map((g) => (
                <div
                  key={g.key}
                  onClick={() => setFormData({ ...formData, fitnessGoal: g.key })}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    formData.fitnessGoal === g.key
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="font-bold text-white text-sm">{g.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetWeightKg}
                  onChange={(e) => setFormData({ ...formData, targetWeightKg: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400">Activity Level</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
                >
                  <option value="SEDENTARY">Sedentary (1.2x)</option>
                  <option value="LIGHT">Light (1-3 days/wk - 1.375x)</option>
                  <option value="MODERATE">Moderate (3-5 days/wk - 1.55x)</option>
                  <option value="VERY_ACTIVE">Very Active (6-7 days/wk - 1.725x)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Nutrition */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white">Dietary & Hydration Preferences</h2>
              <p className="mt-1 text-sm text-slate-400">
                Tailored for traditional Indian and Tamil Nadu staple meals or international diets.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { key: 'NON_VEGETARIAN', label: 'Non-Vegetarian', desc: 'Chicken, eggs, fish, mutton, paneer, and staples' },
                { key: 'VEGETARIAN', label: 'Vegetarian (Lacto-Ovo)', desc: 'Paneer, lentils, curd, soya chunks, legumes, dosa, idli' },
                { key: 'EGGETARIAN', label: 'Eggetarian', desc: 'Vegetarian diet enriched with eggs and omelettes' },
                { key: 'VEGAN', label: '100% Plant-Based / Vegan', desc: 'Zero dairy, plant proteins, pulses, tofu, nuts and seeds' },
              ].map((d) => (
                <div
                  key={d.key}
                  onClick={() => setFormData({ ...formData, dietaryPreference: d.key })}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    formData.dietaryPreference === d.key
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="font-bold text-white text-sm">{d.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d.desc}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400">Daily Water Target (ml)</label>
              <input
                type="number"
                step="250"
                value={formData.waterTargetMl}
                onChange={(e) => setFormData({ ...formData, waterTargetMl: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
              />
            </div>
          </div>
        )}

        {/* Step 4: Training & Routine */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white">Workout Experience & Timer</h2>
              <p className="mt-1 text-sm text-slate-400">
                Setup your preferred rest timers and workout routine suggestions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'BEGINNER', label: 'Beginner (0 - 6 months)', desc: 'Focus on form, linear progression, and full-body foundation' },
                { key: 'INTERMEDIATE', label: 'Intermediate (6 months - 2 years)', desc: 'Upper/Lower or Push-Pull-Legs splits with progressive overload' },
                { key: 'ADVANCED', label: 'Advanced (2+ years)', desc: 'Specialized volume periodization and peak intensity lifting' },
              ].map((exp) => (
                <div
                  key={exp.key}
                  onClick={() => setFormData({ ...formData, experienceLevel: exp.key })}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    formData.experienceLevel === exp.key
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="font-bold text-white text-sm">{exp.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{exp.desc}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400">Default Rest Interval Between Sets</label>
              <select
                value={formData.restTimerSeconds}
                onChange={(e) => setFormData({ ...formData, restTimerSeconds: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white"
              >
                <option value={45}>45 seconds (Fast paced)</option>
                <option value={60}>60 seconds (Accessory lifts)</option>
                <option value={90}>90 seconds (Standard hypertrophy)</option>
                <option value={120}>120 seconds (Heavy compound lifts)</option>
                <option value={180}>180 seconds (Strength / Power)</option>
              </select>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleNext}
            className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {saving ? 'Completing...' : step === 4 ? 'Launch Fitness Hub 🚀' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { FitnessNav } from '../fitness-nav';
import { api } from '@/lib/api';

interface BodyMeasurement {
  id: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  armsCm?: number;
  thighsCm?: number;
  neckCm?: number;
  notes?: string;
  measuredAt: string;
}

interface FitnessProfile {
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  gender?: string;
}

export default function BodyTrackingPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    weightKg: '',
    bodyFatPct: '',
    waistCm: '',
    hipsCm: '',
    chestCm: '',
    armsCm: '',
    thighsCm: '',
    neckCm: '',
    notes: '',
    measuredAt: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        api.get<BodyMeasurement[]>('/fitness/body'),
        api.get<FitnessProfile>('/fitness/profile'),
      ]);
      if (mRes.data) setMeasurements(mRes.data);
      if (pRes.data) {
        setProfile(pRes.data);
        if (pRes.data.currentWeightKg && !form.weightKg) {
          const defaultWeight = String(pRes.data.currentWeightKg);
          setForm((prev) => ({ ...prev, weightKg: defaultWeight }));
        }
      }
    } catch (err) {
      console.error('Failed to load body measurements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        bodyFatPct: form.bodyFatPct ? parseFloat(form.bodyFatPct) : undefined,
        waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
        hipsCm: form.hipsCm ? parseFloat(form.hipsCm) : undefined,
        chestCm: form.chestCm ? parseFloat(form.chestCm) : undefined,
        armsCm: form.armsCm ? parseFloat(form.armsCm) : undefined,
        thighsCm: form.thighsCm ? parseFloat(form.thighsCm) : undefined,
        neckCm: form.neckCm ? parseFloat(form.neckCm) : undefined,
        notes: form.notes || undefined,
        measuredAt: new Date(form.measuredAt).toISOString(),
      };

      await api.post('/fitness/body', payload);
      setForm({
        weightKg: '',
        bodyFatPct: '',
        waistCm: '',
        hipsCm: '',
        chestCm: '',
        armsCm: '',
        thighsCm: '',
        neckCm: '',
        notes: '',
        measuredAt: new Date().toISOString().slice(0, 10),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to record body measurement', err);
      alert('Failed to save body measurement');
    } finally {
      setSaving(false);
    }
  };

  // Compute BMI
  const latestWeight = measurements[0]?.weightKg || profile?.currentWeightKg;
  const heightM = (profile?.heightCm || 170) / 100;
  const bmi = latestWeight ? (latestWeight / (heightM * heightM)).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FitnessNav />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Body Measurements & Composition</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track weight, body fat %, waist, chest, arms and composition progress over time
          </p>
        </div>

        {/* Overview Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Current Weight</span>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {latestWeight ? `${latestWeight} kg` : '--'}
            </div>
            {profile?.targetWeightKg && (
              <p className="mt-1 text-xs text-slate-400">
                Target: {profile.targetWeightKg} kg ({(profile.targetWeightKg - (latestWeight || 0)).toFixed(1)} kg delta)
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Body Mass Index (BMI)</span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400">
              {bmi || '--'}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Height: {profile?.heightCm || 170} cm (Standard Mifflin formula base)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Latest Body Fat</span>
            <div className="mt-2 text-3xl font-extrabold text-blue-400">
              {measurements[0]?.bodyFatPct ? `${measurements[0].bodyFatPct}%` : '--'}
            </div>
            <p className="mt-1 text-xs text-slate-400">US Navy / Caliper estimation</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Waist Circumference</span>
            <div className="mt-2 text-3xl font-extrabold text-amber-400">
              {measurements[0]?.waistCm ? `${measurements[0].waistCm} cm` : '--'}
            </div>
            <p className="mt-1 text-xs text-slate-400">Key visceral health indicator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* New Measurement Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl lg:col-span-1">
            <h2 className="text-lg font-bold text-white">Record Measurement</h2>
            <p className="text-xs text-slate-400">Measure consistently at the same time (e.g. morning fasting).</p>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Date of Measurement</label>
                <input
                  type="date"
                  required
                  value={form.measuredAt}
                  onChange={(e) => setForm({ ...form, measuredAt: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Body Fat (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="16.5"
                    value={form.bodyFatPct}
                    onChange={(e) => setForm({ ...form, bodyFatPct: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="82"
                    value={form.waistCm}
                    onChange={(e) => setForm({ ...form, waistCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Hips (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="96"
                    value={form.hipsCm}
                    onChange={(e) => setForm({ ...form, hipsCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="102"
                    value={form.chestCm}
                    onChange={(e) => setForm({ ...form, chestCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Arms (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="36"
                    value={form.armsCm}
                    onChange={(e) => setForm({ ...form, armsCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Thighs (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="58"
                    value={form.thighsCm}
                    onChange={(e) => setForm({ ...form, thighsCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Neck (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="38"
                    value={form.neckCm}
                    onChange={(e) => setForm({ ...form, neckCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Post-carb refeed, feeling lean"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Measurements'}
              </button>
            </form>
          </div>

          {/* Measurements History Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl lg:col-span-2">
            <h2 className="text-lg font-bold text-white">Log History</h2>
            <p className="text-xs text-slate-400">All historical circumference and body composition records</p>

            <div className="mt-5 overflow-x-auto">
              {measurements.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No body measurements recorded yet. Use the form to log your first record!
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Weight</th>
                      <th className="py-3 px-3">Body Fat</th>
                      <th className="py-3 px-3">Waist</th>
                      <th className="py-3 px-3">Chest</th>
                      <th className="py-3 px-3">Arms</th>
                      <th className="py-3 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {measurements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-semibold text-white">
                          {new Date(m.measuredAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          {m.weightKg ? `${m.weightKg} kg` : '--'}
                        </td>
                        <td className="py-3 px-3 text-blue-400">
                          {m.bodyFatPct ? `${m.bodyFatPct}%` : '--'}
                        </td>
                        <td className="py-3 px-3">{m.waistCm ? `${m.waistCm} cm` : '--'}</td>
                        <td className="py-3 px-3">{m.chestCm ? `${m.chestCm} cm` : '--'}</td>
                        <td className="py-3 px-3">{m.armsCm ? `${m.armsCm} cm` : '--'}</td>
                        <td className="py-3 px-3 text-xs italic text-slate-400">{m.notes || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

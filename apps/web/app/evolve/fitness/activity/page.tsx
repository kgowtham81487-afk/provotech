'use client';

import { useEffect, useState } from 'react';
import { FitnessNav } from '../fitness-nav';
import { api } from '@/lib/api';

interface ActivityLog {
  id: string;
  activityType: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  distanceKm?: number;
  stepsCount?: number;
  notes?: string;
  loggedAt: string;
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    activityType: 'WALKING',
    durationMinutes: '30',
    caloriesBurned: '150',
    distanceKm: '2.5',
    stepsCount: '4000',
    notes: '',
    loggedAt: new Date().toISOString().slice(0, 10),
  });

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get<ActivityLog[]>('/fitness/activities');
      if (res.data) setActivities(res.data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/fitness/activities', {
        activityType: form.activityType,
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
        caloriesBurned: form.caloriesBurned ? parseInt(form.caloriesBurned) : undefined,
        distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : undefined,
        stepsCount: form.stepsCount ? parseInt(form.stepsCount) : undefined,
        notes: form.notes || undefined,
        loggedAt: new Date(form.loggedAt).toISOString(),
      });
      setForm({
        activityType: 'WALKING',
        durationMinutes: '30',
        caloriesBurned: '150',
        distanceKm: '2.5',
        stepsCount: '4000',
        notes: '',
        loggedAt: new Date().toISOString().slice(0, 10),
      });
      await loadActivities();
    } catch (err) {
      console.error('Failed to log activity', err);
      alert('Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  // Aggregates for today or latest
  const totalBurned = activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
  const totalSteps = activities.reduce((sum, a) => sum + (a.stepsCount || 0), 0);
  const totalDistance = activities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FitnessNav />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Daily Activity & Cardio Tracker</h1>
          <p className="mt-1 text-sm text-slate-400">
            Log steps, running, cycling, swimming, HIIT, and active caloric expenditure
          </p>
        </div>

        {/* Aggregated Overview */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Total Active Calories</span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400">
              {totalBurned} <span className="text-sm font-normal text-slate-400">kcal</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Total Steps Logged</span>
            <div className="mt-2 text-3xl font-extrabold text-blue-400">
              {totalSteps.toLocaleString()} <span className="text-sm font-normal text-slate-400">steps</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold text-slate-400">Total Cardio Distance</span>
            <div className="mt-2 text-3xl font-extrabold text-amber-400">
              {totalDistance.toFixed(1)} <span className="text-sm font-normal text-slate-400">km</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl lg:col-span-1">
            <h2 className="text-lg font-bold text-white">Log Activity</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Activity Type</label>
                <select
                  value={form.activityType}
                  onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="WALKING">Walking / Steps</option>
                  <option value="RUNNING">Running / Jogging</option>
                  <option value="CYCLING">Cycling</option>
                  <option value="SWIMMING">Swimming</option>
                  <option value="HIIT">HIIT / Circuit</option>
                  <option value="YOGA">Yoga / Stretching</option>
                  <option value="SPORTS">Sports (Badminton, Cricket, Football)</option>
                  <option value="REST_DAY">Active Recovery / Rest Day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Date</label>
                <input
                  type="date"
                  required
                  value={form.loggedAt}
                  onChange={(e) => setForm({ ...form, loggedAt: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Duration (min)</label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Calories (kcal)</label>
                  <input
                    type="number"
                    value={form.caloriesBurned}
                    onChange={(e) => setForm({ ...form, caloriesBurned: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.distanceKm}
                    onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Steps Count</label>
                  <input
                    type="number"
                    value={form.stepsCount}
                    onChange={(e) => setForm({ ...form, stepsCount: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Evening brisk walk in park"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {saving ? 'Logging...' : 'Save Activity'}
              </button>
            </form>
          </div>

          {/* Activity Log List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl lg:col-span-2">
            <h2 className="text-lg font-bold text-white">Recent Activities</h2>
            <div className="mt-5 divide-y divide-slate-800">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No activity logs found. Log your first session on the left!
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex flex-col justify-between py-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{act.activityType}</span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {new Date(act.loggedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {act.durationMinutes ? `${act.durationMinutes} mins • ` : ''}
                        {act.distanceKm ? `${act.distanceKm} km • ` : ''}
                        {act.stepsCount ? `${act.stepsCount.toLocaleString()} steps • ` : ''}
                        {act.notes && `“${act.notes}”`}
                      </p>
                    </div>
                    <div className="mt-2 text-right text-xs font-bold text-emerald-400 sm:mt-0">
                      {act.caloriesBurned ? `${act.caloriesBurned} kcal burned` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

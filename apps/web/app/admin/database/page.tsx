'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminDatabasePage() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [maintenanceResult, setMaintenanceResult] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDbStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/database/stats');
      setStats(res.data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch database statistics' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, []);

  const handleRunMaintenance = async () => {
    if (!isSuperAdmin) {
      alert('Only Super Administrators can initiate database maintenance.');
      return;
    }
    if (!confirm('Run database maintenance? This will purge expired sessions and stale password reset tokens.')) {
      return;
    }
    try {
      setCleaning(true);
      setFeedback(null);
      setMaintenanceResult(null);
      const res = await api.post('/admin/database/maintenance');
      setMaintenanceResult(res.data);
      setFeedback({ type: 'success', message: 'Database maintenance executed successfully.' });
      fetchDbStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Database maintenance failed' });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Database & Maintenance</h1>
          <p className="text-sm text-slate-400">
            Real table statistics, storage health, and automated cleanup routines.
          </p>
        </div>
        <button
          onClick={handleRunMaintenance}
          disabled={cleaning || !isSuperAdmin}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
        >
          <span>🧹</span> {cleaning ? 'Running Cleanup...' : 'Run Database Cleanup'}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Maintenance Results */}
      {maintenanceResult && (
        <div className="bg-[#0F172A] border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span>✅</span> Database Maintenance Complete
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400">Expired Reset Tokens Purged:</span>
              <div className="text-lg font-bold text-white mt-1">
                {maintenanceResult.cleanedTokens?.count ?? 0}
              </div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400">Expired Sessions Purged:</span>
              <div className="text-lg font-bold text-white mt-1">
                {maintenanceResult.cleanedSessions?.count ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Row Counts */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">PostgreSQL Entity Row Counts</h2>
          <button onClick={fetchDbStats} className="text-xs text-indigo-400 hover:text-indigo-300">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Querying database table metrics...</div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.tables || {}).map(([table, count]: [string, any]) => (
              <div
                key={table}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition"
              >
                <div className="text-slate-400 font-mono text-[11px] truncate mb-1">{table}</div>
                <div className="text-lg font-black text-white">{Number(count).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-xs">Unable to load database metrics.</div>
        )}
      </div>
    </div>
  );
}


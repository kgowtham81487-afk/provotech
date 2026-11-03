'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminFeatureFlagsPage() {
  const { isSuperAdmin } = useAuth();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/feature-flags');
      setFlags(res.data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch feature flags' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag: any) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrators can toggle feature flags.');
      return;
    }
    const newStatus = !flag.isEnabled;
    try {
      setTogglingKey(flag.key);
      setFeedback(null);
      await api.patch(`/admin/feature-flags/${flag.key}`, { isEnabled: newStatus });
      setFeedback({
        type: 'success',
        message: `Flag ${flag.key} set to ${newStatus ? 'ENABLED' : 'DISABLED'}`,
      });
      setFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, isEnabled: newStatus, updatedAt: new Date() } : f)),
      );
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to toggle feature flag' });
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Feature Controls & Circuit Breakers</h1>
        <p className="text-sm text-slate-400">
          Database-backed dynamic runtime switches for platform capabilities. Enforced on API endpoints and client interfaces.
        </p>
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

      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Flags Configured: {flags.length}
          </span>
          <button
            onClick={fetchFlags}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            🔄 Refresh Flags
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading feature flags...</div>
          ) : (
            flags.map((flag) => {
              const isToggling = togglingKey === flag.key;
              return (
                <div
                  key={flag.id || flag.key}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white">{flag.key}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          flag.isEnabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {flag.isEnabled ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {flag.description || 'System controlled runtime feature flag.'}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Last modified: {new Date(flag.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(flag)}
                      disabled={isToggling || !isSuperAdmin}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        flag.isEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                      } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          flag.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-300 w-16">
                      {flag.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


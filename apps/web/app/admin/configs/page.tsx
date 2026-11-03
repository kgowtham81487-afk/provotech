'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminConfigsPage() {
  const { isSuperAdmin } = useAuth();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/configs');
      setConfigs(res.data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch platform configurations' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrators can update platform configs.');
      return;
    }
    try {
      setSaving(true);
      let parsedValue: any = editValue;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        // keep as string
      }
      await api.patch(`/admin/configs/${key}`, { value: parsedValue });
      setFeedback({ type: 'success', message: `Configuration ${key} updated successfully.` });
      setEditingKey(null);
      fetchConfigs();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update configuration' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Configuration Parameters</h1>
          <p className="text-sm text-slate-400">
            System-level parameters, AdSense keys, currency defaults, and point rules for Provolution Technologies.
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700 flex items-center gap-2"
        >
          <span>🔄</span> Refresh
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

      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Config Key</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Value</th>
                <th className="px-4 py-3.5">Encrypted / Secret</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Loading configuration parameters...
                  </td>
                </tr>
              ) : configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No configs found.
                  </td>
                </tr>
              ) : (
                configs.map((cfg) => {
                  const isEditing = editingKey === cfg.key;
                  return (
                    <tr key={cfg.id || cfg.key} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4 font-mono font-semibold text-white">{cfg.key}</td>
                      <td className="px-4 py-4 text-slate-400 max-w-sm">{cfg.description || '—'}</td>
                      <td className="px-4 py-4 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-white text-xs w-full"
                          />
                        ) : (
                          <span className="text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-400">
                        {cfg.isEncrypted ? '🔒 Masked' : 'Public/Plain'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSave(cfg.key)}
                              disabled={saving}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingKey(cfg.key);
                              setEditValue(
                                typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value),
                              );
                            }}
                            disabled={!isSuperAdmin}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs disabled:opacity-40"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Play,
  RotateCcw,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ProviderStatus {
  provider: 'GEMINI' | 'DEEPSEEK' | 'GROQ';
  name: string;
  isEnabled: boolean;
  isPreferred: boolean;
  priority: number;
  model: string;
  isConfigured: boolean;
  isHealthy: boolean;
  inCooldown: boolean;
  cooldownUntil: string | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorMessage: string | null;
}

export default function AdminAiDashboard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [totalRequests, setTotalRequests] = useState(0);
  const [successfulRequests, setSuccessfulRequests] = useState(0);
  const [failedRequests, setFailedRequests] = useState(0);

  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit model modal
  const [editModalProvider, setEditModalProvider] = useState<ProviderStatus | null>(null);
  const [editModelName, setEditModelName] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/ai/config');
      if (res.data) {
        setProviders(res.data.providers || []);
        setFallbackEnabled(res.data.fallbackEnabled ?? true);
        setTotalRequests(res.data.totalAiRequests || 0);
        setSuccessfulRequests(res.data.successfulAiRequests || 0);
        setFailedRequests(res.data.failedAiRequests || 0);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load AI cluster state' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleProvider = async (provider: string, currentState: boolean) => {
    try {
      await api.patch('/admin/ai/config', {
        provider,
        updates: { isEnabled: !currentState },
      });
      setFeedback({
        type: 'success',
        message: `${provider} is now ${!currentState ? 'ENABLED' : 'DISABLED'}.`,
      });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update provider status' });
    }
  };

  const handleSetPreferred = async (provider: string) => {
    try {
      await api.patch('/admin/ai/config', {
        provider,
        updates: { isPreferred: true, priority: 1 },
      });
      setFeedback({
        type: 'success',
        message: `${provider} is now set as the PRIMARY PREFERRED provider.`,
      });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to set preferred provider' });
    }
  };

  const handleToggleFallback = async () => {
    const nextState = !fallbackEnabled;
    try {
      await api.patch('/admin/ai/fallback', { enabled: nextState });
      setFallbackEnabled(nextState);
      setFeedback({
        type: 'success',
        message: `Automatic AI fallback is now ${nextState ? 'ENABLED' : 'DISABLED'}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to toggle fallback' });
    }
  };

  const handleTestConnection = async (provider: string) => {
    try {
      setTestingProvider(provider);
      setFeedback(null);
      const res = await api.post(`/admin/ai/test/${provider}`, {});
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `✓ ${provider} connection verified in ${res.data.latencyMs}ms. Response: ${res.data.message || 'OK'}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: `✗ ${provider} connection test failed: ${res.data?.message || 'Unreachable'}`,
        });
      }
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Test execution failed' });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset AI provider configuration to standard default sequence (Gemini -> DeepSeek -> Groq)?')) {
      return;
    }
    try {
      await api.post('/admin/ai/reset-defaults', {});
      setFeedback({
        type: 'success',
        message: 'AI cluster successfully reset to default priority (Gemini -> DeepSeek -> Groq).',
      });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to reset provider defaults' });
    }
  };

  const handleSaveModel = async () => {
    if (!editModalProvider || !editModelName.trim()) return;
    try {
      setSavingConfig(true);
      await api.patch('/admin/ai/config', {
        provider: editModalProvider.provider,
        updates: { model: editModelName.trim() },
      });
      setFeedback({
        type: 'success',
        message: `Model for ${editModalProvider.name} updated to ${editModelName.trim()}.`,
      });
      setEditModalProvider(null);
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update model' });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🤖 AI Cluster & Provider Controls</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervise multi-provider routing (Gemini, DeepSeek, Groq), health tracking, and automatic fallback sequences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            title="Reset to default order"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Automatic Fallback</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${fallbackEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {fallbackEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
            <button
              onClick={handleToggleFallback}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                fallbackEnabled
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {fallbackEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Gemini → DeepSeek → Groq sequence</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total AI Queries</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRequests.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-2">Recorded across all 3 providers</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Successful Generates</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{successfulRequests.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-2">
            {totalRequests > 0 ? `${((successfulRequests / totalRequests) * 100).toFixed(1)}% success rate` : 'No errors logged'}
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Observed Errors</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{failedRequests.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-2">Triggered automatic fallback</p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Configured AI Providers & Fallback Priority</span>
          </h2>
          <span className="text-xs text-slate-500">Priority order: 1 = First, 2 = Fallback 1, 3 = Fallback 2</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {providers.map((p) => {
            const isTesting = testingProvider === p.provider;

            return (
              <div
                key={p.provider}
                className={`bg-[#0F172A] border rounded-2xl p-6 relative flex flex-col justify-between shadow-xl transition ${
                  p.isPreferred
                    ? 'border-indigo-500/50 shadow-indigo-600/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badges Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px]">
                        {p.priority}
                      </span>
                      <span>Priority #{p.priority}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {p.isPreferred && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Primary
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          p.isEnabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white">{p.name}</h3>

                  {/* Model & Key config status */}
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Model:</span>
                      <span className="font-mono text-indigo-300 font-medium">{p.model}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>API Key:</span>
                      <span className="flex items-center gap-1">
                        {p.isConfigured ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Configured in Env
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Missing Env Var
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Health State:</span>
                      <span>
                        {p.inCooldown ? (
                          <span className="text-amber-400 font-medium">In Cooldown</span>
                        ) : p.isHealthy ? (
                          <span className="text-emerald-400 font-medium">Healthy</span>
                        ) : (
                          <span className="text-rose-400 font-medium">Degraded</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry bar */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Successful</div>
                      <div className="text-sm font-bold text-emerald-400">{p.successfulRequests}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Failed</div>
                      <div className="text-sm font-bold text-rose-400">{p.failedRequests}</div>
                    </div>
                  </div>

                  {p.lastErrorMessage && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400">
                      <div className="font-semibold mb-0.5">Last Observed Issue:</div>
                      <p className="line-clamp-2 text-rose-300">{p.lastErrorMessage}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTestConnection(p.provider)}
                      disabled={isTesting}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-indigo-400" />
                      <span>{isTesting ? 'Testing...' : 'Test API'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditModalProvider(p);
                        setEditModelName(p.model);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                    >
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      <span>Configure</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {!p.isPreferred && p.isEnabled && (
                      <button
                        onClick={() => handleSetPreferred(p.provider)}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Make Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleProvider(p.provider, p.isEnabled)}
                      className={`text-xs ml-auto hover:underline ${p.isEnabled ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                      {p.isEnabled ? 'Disable Provider' : 'Enable Provider'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Configuration Modal */}
      {editModalProvider && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Configure {editModalProvider.name} Parameters
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select or specify the model identifier to be dispatched for {editModalProvider.name}.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Model Identifier</label>
                <input
                  type="text"
                  value={editModelName}
                  onChange={(e) => setEditModelName(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash, deepseek-chat, llama-3.3-70b-versatile"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Common defaults: `gemini-1.5-flash`, `deepseek-chat`, `llama-3.3-70b-versatile`.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalProvider(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingConfig || !editModelName.trim()}
                  onClick={handleSaveModel}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
                >
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

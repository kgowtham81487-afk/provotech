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
  Search,
  Clock,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DiscoveredModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  isRecommended?: boolean;
}

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
  errorCategory?: string | null;
  discoveredModels?: DiscoveredModel[];
}

interface TestResultModalData {
  provider: string;
  model: string;
  success: boolean;
  httpStatus?: number;
  latencyMs: number;
  errorCategory?: string;
  responseContent?: string;
  message?: string;
}

export default function AdminAiDashboard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [totalRequests, setTotalRequests] = useState(0);
  const [successfulRequests, setSuccessfulRequests] = useState(0);
  const [failedRequests, setFailedRequests] = useState(0);

  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [discoveringProvider, setDiscoveringProvider] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Edit model modal
  const [editModalProvider, setEditModalProvider] = useState<ProviderStatus | null>(null);
  const [editModelName, setEditModelName] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Test result modal
  const [testResult, setTestResult] = useState<TestResultModalData | null>(null);

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

  const handleTestConnection = async (provider: string, customModel?: string) => {
    try {
      setTestingProvider(provider);
      setFeedback(null);
      const res = await api.post(`/admin/ai/test/${provider}`, {
        model: customModel,
        prompt: 'Reply with exactly: EES AI connection successful.',
      });

      const data = res.data;
      setTestResult({
        provider,
        model: data?.model || customModel || 'default',
        success: !!data?.success,
        httpStatus: data?.httpStatus,
        latencyMs: data?.latencyMs || 0,
        errorCategory: data?.errorCategory,
        responseContent: data?.responseContent,
        message: data?.message,
      });

      if (data?.success) {
        setFeedback({
          type: 'success',
          message: `✓ ${provider} connection verified in ${data.latencyMs}ms. Response: "${data.responseContent || data.message || 'OK'}"`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: `✗ ${provider} test failed [${data?.errorCategory || 'ERROR'}]: ${data?.message || 'Unreachable'}`,
        });
      }
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Test execution failed' });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDiscoverModels = async (provider: string) => {
    try {
      setDiscoveringProvider(provider);
      setFeedback(null);
      const res = await api.get(`/admin/ai/models/${provider}`);
      const discovered: DiscoveredModel[] = res.data || [];
      setFeedback({
        type: 'success',
        message: `Discovered ${discovered.length} active models from ${provider} live API.`,
      });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || `Failed to discover models for ${provider}` });
    } finally {
      setDiscoveringProvider(null);
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

  const formatTimestamp = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCooldownRemaining = (until: string | null) => {
    if (!until) return null;
    const diff = new Date(until).getTime() - Date.now();
    if (diff <= 0) return null;
    const secs = Math.ceil(diff / 1000);
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`;
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
            Supervise multi-provider routing (Gemini, DeepSeek, Groq), health tracking, model discovery, and automatic fallback sequences.
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
              : feedback.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span className="font-mono">{feedback.message}</span>
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
            {totalRequests > 0 ? `${((successfulRequests / totalRequests) * 100).toFixed(1)}% success rate` : 'No queries logged'}
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
            const isDiscovering = discoveringProvider === p.provider;
            const cooldownRemaining = getCooldownRemaining(p.cooldownUntil);

            // Determine status badge colors
            const is402 = p.errorCategory === 'INSUFFICIENT_BALANCE' || p.lastErrorMessage?.includes('[INSUFFICIENT_BALANCE]');
            const is404 = p.errorCategory === 'MODEL_NOT_FOUND' || p.lastErrorMessage?.includes('[MODEL_NOT_FOUND]');
            const is401 = p.errorCategory === 'AUTHENTICATION_FAILURE' || p.lastErrorMessage?.includes('[AUTHENTICATION_FAILURE]');

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
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Configured Model:</span>
                      <span className="font-mono text-indigo-300 font-semibold">{p.model}</span>
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
                        {cooldownRemaining ? (
                          <span className="text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                            Cooldown ({cooldownRemaining})
                          </span>
                        ) : is402 ? (
                          <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            Insufficient Balance (402)
                          </span>
                        ) : is404 ? (
                          <span className="text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                            Model Not Found (404)
                          </span>
                        ) : is401 ? (
                          <span className="text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                            Auth Error (401)
                          </span>
                        ) : p.isHealthy ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        ) : (
                          <span className="text-rose-400 font-medium">Degraded</span>
                        )}
                      </span>
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Last Success:</span>
                      <span className="font-mono text-slate-400">{formatTimestamp(p.lastSuccessAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last Failure:</span>
                      <span className="font-mono text-slate-400">{formatTimestamp(p.lastFailureAt)}</span>
                    </div>
                  </div>

                  {/* Telemetry bar */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Successful</div>
                      <div className="text-sm font-bold text-emerald-400">{p.successfulRequests}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Failed</div>
                      <div className="text-sm font-bold text-rose-400">{p.failedRequests}</div>
                    </div>
                  </div>

                  {/* Action recommendation for known errors */}
                  {is402 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Action Required: Account Balance Depleted</span>
                      </div>
                      <p>DeepSeek requires account credits. Please top up API balance in the DeepSeek platform console. Automatic fallback will safely bypass this provider until re-tested.</p>
                    </div>
                  )}

                  {is404 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-purple-400">
                        <Info className="w-3.5 h-3.5" />
                        <span>Action Required: Model Unsupported</span>
                      </div>
                      <p>The configured model ID is unsupported or deprecated. Use &quot;Discover Models&quot; below to select a verified active model.</p>
                    </div>
                  )}

                  {is401 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-400">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Action Required: Invalid Authentication</span>
                      </div>
                      <p>The API key configured on Render is invalid. Please update the API key environment variable.</p>
                    </div>
                  )}

                  {p.lastErrorMessage && !is402 && !is404 && !is401 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400">
                      <div className="font-semibold mb-0.5">Last Observed Issue:</div>
                      <p className="line-clamp-2 text-rose-300 font-mono text-[10px]">{p.lastErrorMessage}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTestConnection(p.provider)}
                      disabled={isTesting}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
                    >
                      <Play className={`w-3 h-3 ${isTesting ? 'animate-pulse' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                      onClick={() => handleDiscoverModels(p.provider)}
                      disabled={isDiscovering}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition disabled:opacity-50"
                    >
                      <Search className={`w-3 h-3 text-cyan-400 ${isDiscovering ? 'animate-spin' : ''}`} />
                      <span>{isDiscovering ? 'Discovering...' : 'Discover Models'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        setEditModalProvider(p);
                        setEditModelName(p.model);
                      }}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Change Model</span>
                    </button>

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
                      className={`text-xs hover:underline ${p.isEnabled ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                      {p.isEnabled ? 'Disable' : 'Enable'}
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
          <div className="max-w-lg w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Configure {editModalProvider.name} Parameters
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select or specify the model identifier to be dispatched for {editModalProvider.name}.
            </p>

            <div className="space-y-4 text-xs">
              {/* If discovered models exist, offer convenient quick-select */}
              {editModalProvider.discoveredModels && editModalProvider.discoveredModels.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Discovered Active Models ({editModalProvider.discoveredModels.length})
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    value={editModelName}
                    onChange={(e) => setEditModelName(e.target.value)}
                  >
                    {editModalProvider.discoveredModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} {m.isRecommended ? '★ (Recommended)' : ''} {m.contextWindow ? `[${m.contextWindow.toLocaleString()} ctx]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Model Identifier (Custom or Selected)</label>
                <input
                  type="text"
                  value={editModelName}
                  onChange={(e) => setEditModelName(e.target.value)}
                  placeholder="e.g. gemini-2.0-flash, deepseek-chat, llama-3.1-8b-instant"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Verified defaults: Gemini (`gemini-2.0-flash`), DeepSeek (`deepseek-chat`), Groq (`llama-3.1-8b-instant`).
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  disabled={isTestingModel(editModalProvider.provider)}
                  onClick={() => handleTestConnection(editModalProvider.provider, editModelName)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 font-medium transition flex items-center gap-1.5 text-xs"
                >
                  <Play className="w-3 h-3" />
                  <span>Test This Model</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalProvider(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingConfig || !editModelName.trim()}
                    onClick={handleSaveModel}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50 text-xs"
                  >
                    {savingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Modal */}
      {testResult && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Test Execution Results</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono ${
                    testResult.success
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {testResult.success ? 'SUCCESS (200 OK)' : `FAILED (${testResult.httpStatus || testResult.errorCategory || 'ERROR'})`}
                </span>
              </h3>
              <button
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Provider</span>
                  <div className="font-bold text-white">{testResult.provider}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Model</span>
                  <div className="font-mono text-indigo-300 font-semibold">{testResult.model}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">HTTP Status</span>
                  <div className="font-mono text-white">{testResult.httpStatus || (testResult.success ? 200 : 'N/A')}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Latency</span>
                  <div className="font-mono text-emerald-400">{testResult.latencyMs}ms</div>
                </div>
              </div>

              {testResult.responseContent && (
                <div>
                  <span className="text-slate-400 text-[11px] font-semibold block mb-1">Model Response:</span>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-emerald-300 text-xs">
                    {testResult.responseContent}
                  </div>
                </div>
              )}

              {testResult.message && !testResult.success && (
                <div>
                  <span className="text-slate-400 text-[11px] font-semibold block mb-1">Provider Error:</span>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl font-mono text-rose-300 text-xs">
                    {testResult.message}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function isTestingModel(provider: string) {
    return testingProvider === provider;
  }
}

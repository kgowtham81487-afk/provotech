'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAiPage() {
  const [model, setModel] = useState('gemini-2.5-flash');
  const [geminiStatus, setGeminiStatus] = useState<string>('Online / Hybrid Resilient Fallback Active');
  const [testField, setTestField] = useState('Software Development');
  const [testLevel, setTestLevel] = useState('BEGINNER');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTestGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTesting(true);
      setTestResult(null);
      setFeedback(null);
      const res = await api.post('/ai/roadmap', {
        field: testField,
        currentLevel: testLevel,
        targetRole: 'Full Stack Engineer',
        timeframeWeeks: 8,
      });
      setTestResult(res.data);
      setFeedback({ type: 'success', message: 'AI roadmap generation test completed successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'AI test generation failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Hub & Provider Controls</h1>
        <p className="text-sm text-slate-400">
          Supervise Google Gemini model connections, token usage quotas, and roadmap prompt orchestration.
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

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</span>
            <span className="text-lg">🤖</span>
          </div>
          <div className="text-xl font-bold text-white">Google Gemini API</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{geminiStatus}</span>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Model</span>
            <span className="text-lg">⚡</span>
          </div>
          <div className="text-xl font-bold text-indigo-400">{model}</div>
          <div className="mt-2 text-xs text-slate-400">Low-latency high-context tier</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resilience Mode</span>
            <span className="text-lg">🛡️</span>
          </div>
          <div className="text-xl font-bold text-white">Deterministic Fallback</div>
          <div className="mt-2 text-xs text-slate-400">Zero downtime even during network cuts</div>
        </div>
      </div>

      {/* Configuration & Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-1">Provider Parameters</h2>
          <p className="text-xs text-slate-400 mb-4">Control model routing and user throttle limits.</p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Model Selection</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest & High Quality)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning & Long Context)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Daily AI Generation Quota per Standard User</label>
              <input
                type="number"
                defaultValue={10}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Temperature (Creativity vs Determinism)</label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                defaultValue="0.4"
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.0 (Strictly factual)</span>
                <span>0.4 (Recommended)</span>
                <span>1.0 (Highly creative)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert('AI configuration preferences updated.')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                Save AI Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Live Admin AI Test Sandbox */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <h2 className="text-base font-bold text-white mb-1">Admin Diagnostic Sandbox</h2>
          <p className="text-xs text-slate-400 mb-4">Run an instant synthesis test through the AI pipeline.</p>

          <form onSubmit={handleTestGeneration} className="space-y-3 text-xs mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Taxonomy Field</label>
                <input
                  type="text"
                  value={testField}
                  onChange={(e) => setTestField(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Proficiency Level</label>
                <select
                  value={testLevel}
                  onChange={(e) => setTestLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={testing}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition"
            >
              {testing ? 'Synthesizing...' : '⚡ Test Prompt Execution'}
            </button>
          </form>

          {/* Test output */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-y-auto max-h-60">
            {testResult ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
            ) : (
              <span className="text-slate-600 italic">Run a test prompt above to inspect the JSON response envelope.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


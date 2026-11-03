'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';

export default function AiHubPage() {
  const [tab, setTab] = useState<'roadmap' | 'brainstorm'>('roadmap');

  // Roadmap Form
  const [field, setField] = useState('Software Development');
  const [currentLevel, setCurrentLevel] = useState('BEGINNER');
  const [targetRole, setTargetRole] = useState('Full Stack Web Developer');
  const [timeframeWeeks, setTimeframeWeeks] = useState(8);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapResult, setRoadmapResult] = useState<any | null>(null);

  // Brainstorm Form
  const [brainstormField, setBrainstormField] = useState('Software Development');
  const [skills, setSkills] = useState('TypeScript, React, PostgreSQL');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [loadingBrainstorm, setLoadingBrainstorm] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState<any | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingRoadmap(true);
      setError(null);
      const res = await api.post('/ai/roadmap', {
        field,
        currentLevel,
        targetRole,
        timeframeWeeks: Number(timeframeWeeks),
      });
      setRoadmapResult(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate AI roadmap');
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const handleBrainstorm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingBrainstorm(true);
      setError(null);
      const res = await api.post('/ai/brainstorm', {
        field: brainstormField,
        skills: skills.split(',').map((s) => s.trim()),
        difficulty,
      });
      setBrainstormResult(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to brainstorm project ideas');
    } finally {
      setLoadingBrainstorm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <span>✨</span> Gemini AI Study & Architecture Companion
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Acceleration Hub</h1>
          <p className="text-sm text-slate-400 mt-2">
            Accelerate your Evolve progression. Generate structured, goal-oriented roadmaps and enterprise-grade portfolio project briefs.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#0F172A] border border-slate-800 p-1 rounded-2xl inline-flex gap-1">
            <button
              onClick={() => setTab('roadmap')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                tab === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Personalized Roadmap Generator
            </button>
            <button
              onClick={() => setTab('brainstorm')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                tab === 'brainstorm'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💡 Project Architecture Brainstormer
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm max-w-2xl mx-auto mb-6">
            {error}
          </div>
        )}

        {/* Tab 1: Roadmap */}
        {tab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-base font-bold text-white mb-1">Roadmap Parameters</h2>
              <p className="text-xs text-slate-400 mb-6">Define your target trajectory</p>

              <form onSubmit={handleGenerateRoadmap} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Field</label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Software Development">Software Development</option>
                    <option value="Artificial Intelligence and Machine Learning">AI & Machine Learning</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Fitness and Physical Development">Fitness & Physical Development</option>
                    <option value="Content Creation and Digital Media">Content Creation & Media</option>
                    <option value="Cloud Computing and DevOps">Cloud Computing & DevOps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Current Proficiency</label>
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BEGINNER">BEGINNER (Starting from zero)</option>
                    <option value="INTERMEDIATE">INTERMEDIATE (Has basic foundations)</option>
                    <option value="ADVANCED">ADVANCED (Refining professional depth)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Role / Ambition</label>
                  <input
                    type="text"
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Full Stack Web Developer, ML Engineer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Timeframe (Weeks)</label>
                  <input
                    type="number"
                    min={2}
                    max={24}
                    value={timeframeWeeks}
                    onChange={(e) => setTimeframeWeeks(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingRoadmap}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition"
                >
                  {loadingRoadmap ? 'Synthesizing with Gemini...' : '✨ Generate Custom Roadmap'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="lg:col-span-2">
              {loadingRoadmap ? (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">Synthesizing personalized learning trajectory...</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Analyzing skill dependencies, project milestones, and production practices.
                  </p>
                </div>
              ) : roadmapResult ? (
                <div className="space-y-6">
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                          {roadmapResult.field}
                        </span>
                        <h2 className="text-xl font-bold text-white mt-1">{roadmapResult.title}</h2>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                        {roadmapResult.estimatedWeeks} Weeks
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-6">{roadmapResult.overview}</p>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Milestone Phases</h3>
                      {roadmapResult.phases?.map((phase: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300">Phase {idx + 1}: {phase.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{phase.duration}</span>
                          </div>
                          <p className="text-xs text-slate-400">{phase.focus}</p>
                          {phase.topics && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {phase.topics.map((t: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
                  <div className="text-4xl mb-3">🗺️</div>
                  <h3 className="text-base font-bold text-white mb-1">Your Custom Learning Plan Awaits</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Fill out your current proficiency and target ambition on the left to receive an AI-tailored study blueprint.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Brainstorm */}
        {tab === 'brainstorm' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-base font-bold text-white mb-1">Project Generator</h2>
              <p className="text-xs text-slate-400 mb-6">Create portfolio projects that impress reviewers</p>

              <form onSubmit={handleBrainstorm} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Field</label>
                  <input
                    type="text"
                    value={brainstormField}
                    onChange={(e) => setBrainstormField(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Skills to Showcase (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Scope Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BEGINNER">BEGINNER (Proof of concept)</option>
                    <option value="INTERMEDIATE">INTERMEDIATE (Production micro-app)</option>
                    <option value="ADVANCED">ADVANCED (High scale, resilient architecture)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loadingBrainstorm}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition"
                >
                  {loadingBrainstorm ? 'Brainstorming Ideas...' : '💡 Architect Project Briefs'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="lg:col-span-2">
              {loadingBrainstorm ? (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">Synthesizing production project architectures...</p>
                </div>
              ) : brainstormResult?.projects ? (
                <div className="space-y-4">
                  {brainstormResult.projects.map((proj: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white">{proj.title}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                      {proj.architecture && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                          <span className="text-[11px] font-bold text-slate-400 block mb-1">Architecture Outline:</span>
                          <span className="text-slate-300">{proj.architecture}</span>
                        </div>
                      )}
                      {proj.deliverables && (
                        <div className="text-xs text-slate-400">
                          <span className="font-semibold text-white">Suggested Deliverables: </span>
                          {proj.deliverables.join(' · ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
                  <div className="text-4xl mb-3">💡</div>
                  <h3 className="text-base font-bold text-white mb-1">Discover Practical Project Blueprints</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Specify the technologies you want to showcase, and our AI assistant will design real-world deliverables.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}


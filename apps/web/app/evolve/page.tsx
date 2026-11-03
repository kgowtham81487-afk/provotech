'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Plus,
  BookOpen,
  Dumbbell,
  Sparkles,
  Code2,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ExternalLink,
  Github,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function EvolvePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'fitness' | 'content' | 'projects'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  // Form states
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [sessionNotes, setSessionNotes] = useState('');

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectRepo, setProjectRepo] = useState('');
  const [projectLive, setProjectLive] = useState('');
  const [projectTags, setProjectTags] = useState('React, TypeScript, Next.js');

  const [workoutTitle, setWorkoutTitle] = useState('Upper Body Hypertrophy');
  const [workoutDuration, setWorkoutDuration] = useState(60);
  const [exerciseName, setExerciseName] = useState('Barbell Bench Press');
  const [reps, setReps] = useState(8);
  const [weightKg, setWeightKg] = useState(80);

  const loadDashboard = async () => {
    setIsLoading(true);
    const res = await apiRequest('/evolve/dashboard', { method: 'GET' });
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/evolve/learning/sessions', {
      method: 'POST',
      body: JSON.stringify({
        title: sessionTitle,
        durationMinutes: Number(sessionMinutes),
        notes: sessionNotes || undefined,
      }),
    });
    if (res.success) {
      setShowSessionModal(false);
      setSessionTitle('');
      setSessionNotes('');
      loadDashboard();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = projectTags.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await apiRequest('/evolve/projects', {
      method: 'POST',
      body: JSON.stringify({
        title: projectTitle,
        description: projectDesc,
        repoUrl: projectRepo || undefined,
        liveUrl: projectLive || undefined,
        techTags: tags.length > 0 ? tags : ['FullStack'],
        isPublic: true,
      }),
    });
    if (res.success) {
      setShowProjectModal(false);
      setProjectTitle('');
      setProjectDesc('');
      setProjectRepo('');
      setProjectLive('');
      loadDashboard();
    }
  };

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/evolve/fitness/workouts', {
      method: 'POST',
      body: JSON.stringify({
        title: workoutTitle,
        durationMinutes: Number(workoutDuration),
        sets: [
          {
            exerciseName,
            setNumber: 1,
            reps: Number(reps),
            weightKg: Number(weightKg),
          },
        ],
      }),
    });
    if (res.success) {
      setShowWorkoutModal(false);
      loadDashboard();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-slate-400 text-sm">
        Loading personalized Evolve workspace...
      </div>
    );
  }

  const primaryField = data?.fields?.find((f: any) => f.isPrimary);
  const secondaryField = data?.fields?.find((f: any) => !f.isPrimary);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-evolve font-bold uppercase tracking-wider mb-1">
            <Compass className="h-4 w-4" />
            <span>EVOLVE Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Skill Development & Portfolio Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily practice, push verified project evidence, and level up your mastery.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-evolve px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-evolve/90 transition-colors shadow-sm"
          >
            <Clock className="h-3.5 w-3.5" />
            Log Study Session
          </button>
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border/60 py-3 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview & Goals', icon: Compass },
          { key: 'learning', label: 'Study Sessions', icon: BookOpen },
          { key: 'fitness', label: 'Specialized Fitness', icon: Dumbbell },
          { key: 'content', label: 'Content Pipeline', icon: Sparkles },
          { key: 'projects', label: 'Project Portfolio', icon: Code2 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-evolve/15 text-evolve font-bold'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Column (Main Stage) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Fields Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Your Committed Focus Fields</span>
              <Link href="/onboarding" className="text-xs text-evolve font-normal hover:underline">
                Change Fields
              </Link>
            </h2>

            {data?.fields && data.fields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {primaryField && (
                  <div className="rounded-xl border border-evolve/30 bg-evolve/5 p-4 relative">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-evolve bg-evolve/20 px-2 py-0.5 rounded-full inline-block mb-2">
                      Primary Focus
                    </span>
                    <h3 className="font-bold text-white text-base mb-1">{primaryField.name}</h3>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{primaryField.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {primaryField.categories?.map((cat: any) => (
                        <span key={cat.id} className="text-[10px] bg-surface-elevated text-slate-300 px-2 py-0.5 rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {secondaryField ? (
                  <div className="rounded-xl border border-engage/30 bg-engage/5 p-4 relative">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-engage bg-engage/20 px-2 py-0.5 rounded-full inline-block mb-2">
                      Secondary Focus
                    </span>
                    <h3 className="font-bold text-white text-base mb-1">{secondaryField.name}</h3>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{secondaryField.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {secondaryField.categories?.map((cat: any) => (
                        <span key={cat.id} className="text-[10px] bg-surface-elevated text-slate-300 px-2 py-0.5 rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-surface-border p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-400 mb-2">No secondary field selected yet.</p>
                    <Link
                      href="/onboarding"
                      className="text-xs font-semibold text-white bg-surface-elevated px-3 py-1.5 rounded-lg hover:bg-slate-700"
                    >
                      Select Secondary Field
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 mb-3">You haven't committed to any focus fields yet.</p>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-evolve px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Start Field Onboarding <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Tab 1: Overview & Goals */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Learning Goals */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                  Active Milestones & Goals
                </h2>
                {data?.goals && data.goals.length > 0 ? (
                  <div className="space-y-3">
                    {data.goals.map((g: any) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-elevated p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-evolve shrink-0" />
                          <div>
                            <h4 className="font-semibold text-white text-xs">{g.title}</h4>
                            <span className="text-[10px] text-slate-500">
                              Target: {new Date(g.targetDate || g.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-evolve/20 text-evolve font-semibold px-2 py-0.5 rounded">
                          In Progress
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific goals logged yet.</p>
                )}
              </div>

              {/* Recent Learning Sessions */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Recent Study Sessions
                  </h2>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="text-xs text-evolve font-semibold hover:underline"
                  >
                    + Record Session
                  </button>
                </div>

                {data?.recentSessions && data.recentSessions.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.recentSessions.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-surface-border/60 bg-surface-elevated/40 p-3"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-200 text-xs">{s.title}</h4>
                          {s.notes && <p className="text-[11px] text-slate-400 mt-0.5">{s.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-xs font-semibold text-slate-300">{s.durationMinutes} mins</span>
                          <span className="text-xs font-bold text-evolve">+{s.xpEarned} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No study sessions logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Learning Sessions */}
          {activeTab === 'learning' && (
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Full Study History</h2>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="rounded-lg bg-evolve px-3 py-1.5 text-xs font-bold text-slate-950"
                >
                  Log New Session
                </button>
              </div>
              <div className="space-y-3">
                {data?.recentSessions?.map((s: any) => (
                  <div key={s.id} className="rounded-xl border border-surface-border bg-surface-elevated p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white text-sm">{s.title}</h4>
                      <span className="text-xs font-bold text-evolve">+{s.xpEarned} XP</span>
                    </div>
                    {s.notes && <p className="text-xs text-slate-400 mb-2">{s.notes}</p>}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span>Duration: {s.durationMinutes} minutes</span>
                      <span>Recorded: {new Date(s.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Specialized Fitness */}
          {activeTab === 'fitness' && (
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Specialized Fitness Module</h2>
                  <p className="text-xs text-slate-400">Track resistance sessions, sets, repetitions, and personal records.</p>
                </div>
                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950"
                >
                  Log Workout
                </button>
              </div>

              {data?.recentWorkouts && data.recentWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {data.recentWorkouts.map((w: any) => (
                    <div key={w.id} className="rounded-xl border border-surface-border bg-surface-elevated p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-white text-sm">{w.title}</h4>
                        <span className="text-xs text-slate-400">{w.durationMinutes} mins</span>
                      </div>
                      <div className="space-y-1.5 mt-3">
                        {w.sets?.map((st: any) => (
                          <div key={st.id} className="flex justify-between text-xs text-slate-300 bg-surface/80 p-2 rounded">
                            <span>{st.exercise?.name || 'Exercise'} (Set {st.setNumber})</span>
                            <span className="font-semibold">{st.reps} reps @ {st.weightKg} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No workouts recorded yet.</p>
              )}
            </div>
          )}

          {/* Tab 4: Content Pipeline */}
          {activeTab === 'content' && (
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <h2 className="text-base font-bold text-white mb-4">Content Creator Pipeline</h2>
              {data?.recentContent && data.recentContent.length > 0 ? (
                <div className="space-y-3">
                  {data.recentContent.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center rounded-xl border border-surface-border bg-surface-elevated p-3.5">
                      <div>
                        <h4 className="font-semibold text-white text-xs">{c.title}</h4>
                        <span className="text-[10px] text-slate-500">Platform: {c.targetPlatform}</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No content drafts recorded yet.</p>
              )}
            </div>
          )}

          {/* Tab 5: Project Portfolio */}
          {activeTab === 'projects' && (
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Verified Project Portfolio</h2>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="rounded-lg bg-evolve px-3 py-1.5 text-xs font-bold text-slate-950"
                >
                  + Add Project Evidence
                </button>
              </div>

              {data?.projects && data.projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.projects.map((p: any) => (
                    <div key={p.id} className="rounded-xl border border-surface-border bg-surface-elevated p-4">
                      <h4 className="font-bold text-white text-sm mb-1">{p.title}</h4>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-3">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {p.techTags?.map((tag: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-surface text-slate-300 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-2 border-t border-surface-border text-xs">
                        {p.repoUrl && (
                          <a href={p.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-300 hover:text-white">
                            <Github className="h-3.5 w-3.5" /> Code
                          </a>
                        )}
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-evolve hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No portfolio projects published yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar (Analytics, Gamification, Badges) */}
        <div className="space-y-6">
          {/* Progression Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Your Progression Status
            </h3>

            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-black text-white">Level {data?.gamification?.currentLevel || 1}</span>
              <span className="text-xs font-bold text-evolve">{data?.gamification?.totalXp || 0} Total XP</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-surface-elevated overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-evolve to-engage rounded-full transition-all"
                style={{ width: `${Math.min(100, ((data?.gamification?.totalXp || 0) % 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-surface-border">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-400" />
                <span>Streak: {user?.streakDays || 1} Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-scale" />
                <span>{data?.achievements?.length || 0} Badges</span>
              </div>
            </div>
          </div>

          {/* Unlocked Badges */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Unlocked Achievements
            </h3>
            {data?.achievements && data.achievements.length > 0 ? (
              <div className="space-y-2">
                {data.achievements.map((ach: any) => (
                  <div key={ach.id} className="flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface-elevated p-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-scale">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">{ach.title}</h5>
                      <p className="text-[10px] text-slate-400">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No badges unlocked yet. Complete a study session or project to begin!</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Log Study Session */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Record Study Session</h3>
            <p className="text-xs text-slate-400 mb-4">Earn server-side verified XP based on time invested.</p>
            <form onSubmit={handleLogSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Topic / Title</label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Next.js 15 App Router Server Actions"
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  required
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Summary</label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Key concepts explored or problems solved..."
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-evolve px-4 py-2 text-xs font-bold text-slate-950 hover:bg-evolve/90"
                >
                  Record & Award XP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Portfolio Project Evidence</h3>
            <p className="text-xs text-slate-400 mb-4">Required for Provolution Technologies Scale eligibility.</p>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Orchestrator"
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Detailed architecture and problem solved..."
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GitHub / Repo URL</label>
                <input
                  type="url"
                  value={projectRepo}
                  onChange={(e) => setProjectRepo(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Live Demo URL</label>
                <input
                  type="url"
                  value={projectLive}
                  onChange={(e) => setProjectLive(e.target.value)}
                  placeholder="https://demo.vercel.app"
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Technologies / Tags (comma separated)</label>
                <input
                  type="text"
                  value={projectTags}
                  onChange={(e) => setProjectTags(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-evolve px-4 py-2 text-xs font-bold text-slate-950 hover:bg-evolve/90"
                >
                  Publish Project (+150 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Log Workout */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Log Resistance Workout</h3>
            <p className="text-xs text-slate-400 mb-4">Specialized workout logging module.</p>
            <form onSubmit={handleLogWorkout} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Workout Session Title</label>
                <input
                  type="text"
                  required
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exercise Name</label>
                <input
                  type="text"
                  required
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Repetitions</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Weight (KG)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Log Workout (+75 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


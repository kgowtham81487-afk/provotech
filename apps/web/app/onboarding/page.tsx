'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Code2,
  Brain,
  ShieldAlert,
  Cloud,
  Dumbbell,
  Sparkles,
  Palette,
  Briefcase,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const ICON_MAP: Record<string, any> = {
  Code2,
  Brain,
  ShieldAlert,
  Cloud,
  Dumbbell,
  Sparkles,
  Palette,
  Briefcase,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<any[]>([]);
  const [primaryFieldId, setPrimaryFieldId] = useState<string | null>(null);
  const [secondaryFieldId, setSecondaryFieldId] = useState<string | null>(null);
  const [proficiency, setProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [targetHours, setTargetHours] = useState(6);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFields() {
      const res = await apiRequest<any[]>('/fields', { method: 'GET' });
      if (res.success && res.data) {
        setFields(res.data);
      }
    }
    loadFields();
  }, []);

  const handleSelectField = (fieldId: string) => {
    if (primaryFieldId === fieldId) {
      setPrimaryFieldId(null);
    } else if (secondaryFieldId === fieldId) {
      setSecondaryFieldId(null);
    } else if (!primaryFieldId) {
      setPrimaryFieldId(fieldId);
    } else if (!secondaryFieldId) {
      setSecondaryFieldId(fieldId);
    } else {
      // Replace secondary field
      setSecondaryFieldId(fieldId);
    }
  };

  const handleComplete = async () => {
    if (!primaryFieldId) {
      setError('Please select at least one primary field of focus.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await apiRequest('/evolve/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        primaryFieldId,
        secondaryFieldId,
        initialProficiency: proficiency,
        weeklyTargetHours: targetHours,
        primaryGoal: primaryGoal || undefined,
      }),
    });

    setIsSubmitting(false);

    if (res.success) {
      await refreshUser();
      router.push('/evolve');
    } else {
      setError(res.error?.message || 'Onboarding failed.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Step Tracker */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-1.5 text-xs text-slate-300 mb-3">
          <Compass className="h-3.5 w-3.5 text-evolve" />
          <span>Stage 1: EVOLVE Setup</span>
          <span className="text-slate-600">•</span>
          <span>Step {step} of 3</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {step === 1 && 'Choose Your Focus Fields'}
          {step === 2 && 'Set Your Baseline Proficiency'}
          {step === 3 && 'Define Your Development Objective'}
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          {step === 1 &&
            'EES is built around intentional dedication. Select 1 primary field and optionally 1 secondary field.'}
          {step === 2 &&
            'Calibrate your roadmap pace and realistic weekly dedicated learning hours.'}
          {step === 3 &&
            'Set your initial project or skill milestone to customize your Evolve workspace.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: FIELD SELECTION */}
      {step === 1 && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {fields.map((f) => {
              const IconComponent = ICON_MAP[f.icon] || Layers;
              const isPrimary = primaryFieldId === f.id;
              const isSecondary = secondaryFieldId === f.id;
              const isSelected = isPrimary || isSecondary;

              return (
                <div
                  key={f.id}
                  onClick={() => handleSelectField(f.id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all relative ${
                    isPrimary
                      ? 'border-evolve bg-evolve/10 shadow-lg shadow-evolve/5'
                      : isSecondary
                      ? 'border-engage bg-engage/10 shadow-lg shadow-engage/5'
                      : 'border-surface-border bg-surface hover:border-slate-600'
                  }`}
                >
                  {isPrimary && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-evolve text-slate-950 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  {isSecondary && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-engage text-slate-950 px-2 py-0.5 rounded-full">
                      Secondary
                    </span>
                  )}

                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${
                      isPrimary
                        ? 'bg-evolve text-slate-950'
                        : isSecondary
                        ? 'bg-engage text-slate-950'
                        : 'bg-surface-elevated text-slate-300'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5">{f.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {f.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {f.categories?.slice(0, 2).map((c: any) => (
                      <span
                        key={c.id}
                        className="text-[10px] text-slate-500 bg-surface-elevated/60 px-2 py-0.5 rounded"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center max-w-xl mx-auto pt-4 border-t border-surface-border">
            <span className="text-xs text-slate-400">
              {primaryFieldId ? '1 Primary Selected' : 'Select Primary Field'}{' '}
              {secondaryFieldId ? '• 1 Secondary Selected' : ''}
            </span>
            <button
              onClick={() => {
                if (!primaryFieldId) {
                  setError('Please pick your primary focus field to proceed.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition-colors"
            >
              Continue to Step 2 <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROFICIENCY & SCHEDULE */}
      {step === 2 && (
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Current Experience Level in Your Field
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProficiency(lvl)}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    proficiency === lvl
                      ? 'border-evolve bg-evolve/10 text-white font-bold'
                      : 'border-surface-border bg-surface text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs tracking-wider uppercase block">{lvl}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {lvl === 'BEGINNER' && '0-1 year experience'}
                    {lvl === 'INTERMEDIATE' && '1-3 years experience'}
                    {lvl === 'ADVANCED' && '3+ years experience'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-semibold text-white mb-2">
              <label>Weekly Learning Commitment</label>
              <span className="text-evolve font-bold">{targetHours} Hours / Week</span>
            </div>
            <input
              type="range"
              min="2"
              max="40"
              value={targetHours}
              onChange={(e) => setTargetHours(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>2 hrs (Casual)</span>
              <span>10 hrs (Dedicated)</span>
              <span>25+ hrs (Immersive)</span>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-surface-border">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition-colors"
            >
              Continue to Step 3 <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OBJECTIVE & LAUNCH */}
      {step === 3 && (
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Your Primary Development Milestone / Target Project
            </label>
            <textarea
              rows={4}
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g. Architect a full-stack Next.js production platform with PostgreSQL, deploy it, and apply for Provolution Technologies freelance contracts."
              className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This goal will anchor your customized dashboard, roadmaps, and progress analytics.
            </p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface/60 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-evolve" />
              <span>Earn server-side verified XP on every study session, workout, and project.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-engage" />
              <span>Connect with verified builders on field-specific social feeds.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-scale" />
              <span>Unlock paid assignments and commercial opportunities at Provolution Technologies.</span>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-surface-border">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-evolve px-6 py-3 text-xs font-bold text-slate-950 hover:bg-evolve/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-evolve/10"
            >
              {isSubmitting ? 'Launching Workspace...' : 'Launch Evolve Workspace'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

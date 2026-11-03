'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Dumbbell,
  Plus,
  Trash2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Check,
  AlertCircle,
  Save,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Award,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FitnessNav } from '../fitness-nav';

interface ActiveSet {
  id: string;
  setNumber: number;
  weightKg: number | '';
  reps: number | '';
  rpe?: number;
  setType: 'WARMUP' | 'NORMAL' | 'DROPSET' | 'FAILURE';
  isCompleted: boolean;
}

interface ActiveExerciseEntry {
  exerciseId: string;
  name: string;
  category: string;
  sets: ActiveSet[];
}

function WorkoutLoggerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');

  const [title, setTitle] = useState('Strength Workout');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<ActiveExerciseEntry[]>([]);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveResult, setSaveResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load available exercises
  useEffect(() => {
    apiRequest('/fitness/exercises', { method: 'GET' }).then((res) => {
      if (res.success && res.data) {
        setAvailableExercises(res.data);
      }
    });

    // If planId present, load plan template
    if (planId) {
      apiRequest(`/fitness/plans/${planId}`, { method: 'GET' }).then((res) => {
        if (res.success && res.data) {
          setTitle(`${res.data.title} Session`);
          if (res.data.exercises && res.data.exercises.length > 0) {
            const mapped = res.data.exercises.map((pe: any) => ({
              exerciseId: pe.exercise.id,
              name: pe.exercise.name,
              category: pe.exercise.category,
              sets: Array.from({ length: pe.targetSets || 3 }).map((_, idx) => ({
                id: `set-${Date.now()}-${Math.random()}`,
                setNumber: idx + 1,
                weightKg: '',
                reps: pe.targetRepsMin || 10,
                setType: 'NORMAL' as const,
                isCompleted: false,
              })),
            }));
            setWorkoutExercises(mapped);
          }
        }
      });
    }
  }, [planId]);

  // Rest Timer Countdown logic
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timeLeft]);

  const startRestTimer = (seconds = restTimerSeconds) => {
    setTimeLeft(seconds);
    setTimerRunning(true);
  };

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const updated = [...workoutExercises];
    const set = updated[exIdx].sets[setIdx];
    const willBeCompleted = !set.isCompleted;
    set.isCompleted = willBeCompleted;
    setWorkoutExercises(updated);

    // Auto-start rest timer if marked complete
    if (willBeCompleted) {
      startRestTimer(restTimerSeconds);
    }
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...workoutExercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
    updated[exIdx].sets.push({
      id: `set-${Date.now()}-${Math.random()}`,
      setNumber: updated[exIdx].sets.length + 1,
      weightKg: lastSet?.weightKg || '',
      reps: lastSet?.reps || '',
      setType: 'NORMAL',
      isCompleted: false,
    });
    setWorkoutExercises(updated);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...workoutExercises];
    updated[exIdx].sets.splice(setIdx, 1);
    // Renumber
    updated[exIdx].sets.forEach((s, idx) => (s.setNumber = idx + 1));
    setWorkoutExercises(updated);
  };

  const handleAddExerciseToWorkout = (exercise: any) => {
    setWorkoutExercises([
      ...workoutExercises,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: [
          { id: `set-${Date.now()}-1`, setNumber: 1, weightKg: '', reps: 10, setType: 'NORMAL', isCompleted: false },
          { id: `set-${Date.now()}-2`, setNumber: 2, weightKg: '', reps: 10, setType: 'NORMAL', isCompleted: false },
          { id: `set-${Date.now()}-3`, setNumber: 3, weightKg: '', reps: 10, setType: 'NORMAL', isCompleted: false },
        ],
      },
    ]);
    setShowExercisePicker(false);
    setSearchExercise('');
  };

  const handleFinishWorkout = async () => {
    setErrorMessage(null);
    if (workoutExercises.length === 0) {
      setErrorMessage('Please add at least one exercise to your workout.');
      return;
    }

    const payloadSets: any[] = [];
    for (const ex of workoutExercises) {
      for (const s of ex.sets) {
        if (s.isCompleted || (s.weightKg && s.reps)) {
          payloadSets.push({
            exerciseId: ex.exerciseId,
            setNumber: s.setNumber,
            weightKg: Number(s.weightKg) || 0,
            reps: Number(s.reps) || 0,
            setType: s.setType,
            isCompleted: s.isCompleted,
          });
        }
      }
    }

    if (payloadSets.length === 0) {
      setErrorMessage('Please complete and enter weight/reps for at least one set.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/fitness/workouts', {
      method: 'POST',
      body: JSON.stringify({
        title,
        durationMinutes: Number(durationMinutes) || 45,
        planId: planId || undefined,
        notes: notes || undefined,
        sets: payloadSets,
      }),
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSaveResult(res.data);
    } else {
      setErrorMessage(res.error?.message || 'Failed to save workout session.');
    }
  };

  // Live Volume calculation
  const liveTotalVolume = workoutExercises.reduce((total, ex) => {
    return (
      total +
      ex.sets.reduce((sTotal, s) => {
        if (s.isCompleted && s.weightKg && s.reps) {
          return sTotal + Number(s.weightKg) * Number(s.reps);
        }
        return sTotal;
      }, 0)
    );
  }, 0);

  const completedSetsCount = workoutExercises.reduce((count, ex) => {
    return count + ex.sets.filter((s) => s.isCompleted).length;
  }, 0);

  const totalSetsCount = workoutExercises.reduce((count, ex) => count + ex.sets.length, 0);

  return (
    <div className="min-h-screen bg-surface-dark pb-24">
      <FitnessNav />

      {/* Floating Rest Timer Widget */}
      <div className="fixed bottom-4 right-4 z-40 bg-surface border border-emerald-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${timerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <div className="font-mono text-base font-bold text-white">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="flex items-center gap-1 border-l border-surface-border pl-2">
          {timerRunning ? (
            <button
              onClick={() => setTimerRunning(false)}
              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-200 transition"
              title="Pause"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setTimerRunning(true)}
              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
              title="Resume"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => startRestTimer(restTimerSeconds)}
            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-300 transition text-[10px]"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <select
            value={restTimerSeconds}
            onChange={(e) => {
              const sec = Number(e.target.value);
              setRestTimerSeconds(sec);
              setTimeLeft(sec);
            }}
            className="bg-surface-elevated text-white border border-surface-border text-[11px] rounded px-1.5 py-1 font-semibold"
          >
            <option value={45}>45s</option>
            <option value={60}>60s</option>
            <option value={90}>90s</option>
            <option value={120}>2m</option>
            <option value={180}>3m</option>
          </select>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        {/* Workout Completion Modal */}
        {saveResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Workout Saved!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Outstanding work! Your progressive overload and volume have been recorded.
              </p>

              <div className="my-5 grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                  <div className="text-[10px] text-slate-400">Total Volume</div>
                  <div className="text-lg font-black text-white">
                    {saveResult.totalVolumeKg?.toLocaleString() || 0} kg
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                  <div className="text-[10px] text-slate-400">Sets Completed</div>
                  <div className="text-lg font-black text-emerald-400">
                    {saveResult.session?.sets?.length || completedSetsCount}
                  </div>
                </div>
              </div>

              {saveResult.newPersonalRecords?.length > 0 && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                    <Award className="h-4 w-4" />
                    <span>New Personal Records Achieved!</span>
                  </div>
                  {saveResult.newPersonalRecords.map((pr: any, idx: number) => (
                    <div key={idx} className="text-xs text-white flex justify-between py-0.5">
                      <span>{pr.exerciseName}</span>
                      <strong className="text-amber-300">{pr.value}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Link
                  href="/evolve/fitness"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/evolve/fitness/workouts/history"
                  className="flex-1 py-2.5 rounded-xl bg-surface-elevated hover:bg-slate-700 text-white font-semibold text-xs border border-surface-border transition"
                >
                  View History
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Workout Header & Controls */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl sm:text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-surface-border focus:border-emerald-500 outline-none w-full transition"
                placeholder="Workout Title"
              />
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Duration:</span>
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-14 bg-surface-elevated text-white border border-surface-border rounded px-1.5 py-0.5 text-center font-bold"
                />
                <span>mins</span>
                <span className="text-slate-600">•</span>
                <span>
                  Completed: <strong className="text-emerald-400">{completedSetsCount}</strong> / {totalSetsCount} sets
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Volume: <strong className="text-emerald-400">{liveTotalVolume} kg</strong>
                </span>
              </div>
            </div>

            <button
              onClick={handleFinishWorkout}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Finish Workout'}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add workout notes, energy level, or warm-up notes..."
              rows={2}
              className="w-full bg-surface-elevated border border-surface-border rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Exercises List (Hevy-inspired fast data entry) */}
        <div className="space-y-6">
          {workoutExercises.map((ex, exIdx) => (
            <div
              key={ex.exerciseId}
              className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {exIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{ex.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const updated = [...workoutExercises];
                    updated.splice(exIdx, 1);
                    setWorkoutExercises(updated);
                  }}
                  className="text-slate-500 hover:text-rose-400 transition p-1"
                  title="Remove Exercise"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Sets Table Header */}
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase mb-2 px-1">
                <div className="col-span-2">Set</div>
                <div className="col-span-3">Weight (kg)</div>
                <div className="col-span-3">Reps</div>
                <div className="col-span-2">RPE</div>
                <div className="col-span-2 text-center">Done</div>
              </div>

              {/* Set Rows */}
              <div className="space-y-2">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl transition ${
                      set.isCompleted ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-surface-elevated'
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-1 text-xs font-bold text-slate-300">
                      <span>{set.setNumber}</span>
                      <select
                        value={set.setType}
                        onChange={(e) => {
                          const updated = [...workoutExercises];
                          updated[exIdx].sets[setIdx].setType = e.target.value as any;
                          setWorkoutExercises(updated);
                        }}
                        className="bg-transparent text-[10px] text-slate-400 border-none outline-none font-semibold cursor-pointer"
                      >
                        <option value="NORMAL" className="bg-slate-900">Norm</option>
                        <option value="WARMUP" className="bg-slate-900">Warm</option>
                        <option value="DROPSET" className="bg-slate-900">Drop</option>
                        <option value="FAILURE" className="bg-slate-900">Fail</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={set.weightKg}
                        onChange={(e) => {
                          const updated = [...workoutExercises];
                          updated[exIdx].sets[setIdx].weightKg = e.target.value === '' ? '' : Number(e.target.value);
                          setWorkoutExercises(updated);
                        }}
                        className="w-full bg-slate-900 border border-surface-border rounded-lg px-2 py-1 text-xs text-white font-mono text-center font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="reps"
                        value={set.reps}
                        onChange={(e) => {
                          const updated = [...workoutExercises];
                          updated[exIdx].sets[setIdx].reps = e.target.value === '' ? '' : Number(e.target.value);
                          setWorkoutExercises(updated);
                        }}
                        className="w-full bg-slate-900 border border-surface-border rounded-lg px-2 py-1 text-xs text-white font-mono text-center font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <select
                        value={set.rpe || ''}
                        onChange={(e) => {
                          const updated = [...workoutExercises];
                          updated[exIdx].sets[setIdx].rpe = e.target.value ? Number(e.target.value) : undefined;
                          setWorkoutExercises(updated);
                        }}
                        className="w-full bg-slate-900 border border-surface-border rounded-lg px-1 py-1 text-[11px] text-slate-300 font-mono text-center outline-none"
                      >
                        <option value="">RPE</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="8.5">8.5</option>
                        <option value="9">9</option>
                        <option value="9.5">9.5</option>
                        <option value="10">10 (Max)</option>
                      </select>
                    </div>

                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          set.isCompleted
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>

                      {ex.sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(exIdx, setIdx)}
                          className="text-slate-500 hover:text-rose-400 text-[10px]"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Set Button */}
              <button
                onClick={() => handleAddSet(exIdx)}
                className="mt-3 w-full py-1.5 rounded-xl border border-surface-border hover:bg-surface-elevated text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Set
              </button>
            </div>
          ))}

          {/* Add Exercise CTA */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-surface-border hover:border-emerald-500/50 bg-surface/40 hover:bg-emerald-500/5 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="h-4 w-4" />
            Add Exercise from Library
          </button>
        </div>

        {/* Exercise Picker Modal */}
        {showExercisePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-surface-border rounded-3xl max-w-lg w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-sm font-bold text-white">Select Exercise</h3>
                <button
                  onClick={() => setShowExercisePicker(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="my-3">
                <input
                  type="text"
                  placeholder="Search exercise by name or muscle group..."
                  value={searchExercise}
                  onChange={(e) => setSearchExercise(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {availableExercises
                  .filter(
                    (ex) =>
                      ex.name.toLowerCase().includes(searchExercise.toLowerCase()) ||
                      ex.category.toLowerCase().includes(searchExercise.toLowerCase()),
                  )
                  .map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleAddExerciseToWorkout(ex)}
                      className="w-full p-3 rounded-xl bg-surface-elevated hover:bg-emerald-500/10 border border-surface-border hover:border-emerald-500/40 text-left flex items-center justify-between transition"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{ex.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {ex.category} • {ex.equipment} • {ex.difficulty}
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-emerald-400" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function WorkoutLoggerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-dark flex items-center justify-center text-slate-400 text-sm">
          Loading Workout Logger...
        </div>
      }
    >
      <WorkoutLoggerContent />
    </Suspense>
  );
}


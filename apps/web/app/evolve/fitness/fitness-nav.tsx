'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dumbbell,
  BookOpen,
  Calendar,
  History,
  ListPlus,
  TrendingUp,
  Apple,
  UtensilsCrossed,
  Scale,
  Target,
  Activity,
  Bot,
  Settings,
  Plus,
  Sparkles,
} from 'lucide-react';

export function FitnessNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/evolve/fitness', icon: Activity },
    { label: 'Log Workout', href: '/evolve/fitness/workouts', icon: Dumbbell },
    { label: 'History', href: '/evolve/fitness/workouts/history', icon: History },
    { label: 'Workout Plans', href: '/evolve/fitness/plans', icon: ListPlus },
    { label: 'Exercise Library', href: '/evolve/fitness/exercises', icon: BookOpen },
    { label: 'Analytics & PRs', href: '/evolve/fitness/progress', icon: TrendingUp },
    { label: 'Nutrition', href: '/evolve/fitness/nutrition', icon: Apple },
    { label: 'Food Diary', href: '/evolve/fitness/food-diary', icon: UtensilsCrossed },
    { label: 'Body & Weight', href: '/evolve/fitness/body', icon: Scale },
    { label: 'Goals', href: '/evolve/fitness/goals', icon: Target },
    { label: 'Activity & Sleep', href: '/evolve/fitness/activity', icon: Calendar },
    { label: 'AI Coach', href: '/evolve/fitness/coach', icon: Bot },
    { label: 'Settings', href: '/evolve/fitness/settings', icon: Settings },
  ];

  return (
    <div className="border-b border-surface-border bg-surface/30 backdrop-blur-sm sticky top-16 z-20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Top Tier Switcher Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-b border-surface-border/50">
          <div className="flex items-center gap-3">
            {/* Module Switcher: Skill Dev vs Fitness */}
            <div className="inline-flex rounded-xl bg-surface-elevated p-1 border border-surface-border">
              <Link
                href="/evolve"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Skill Development</span>
              </Link>
              <Link
                href="/evolve/fitness"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors shadow-sm"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Fitness & Wellness</span>
              </Link>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Hevy & HealthifyMe Engine
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/evolve/fitness/workouts"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Start Workout
            </Link>
            <Link
              href="/evolve/fitness/food-diary"
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
              Log Meal
            </Link>
            <Link
              href="/evolve/fitness/coach"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              AI Coach
            </Link>
          </div>
        </div>

        {/* Scrollable Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 py-2.5 overflow-x-auto no-scrollbar text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/evolve/fitness'
                ? pathname === '/evolve/fitness'
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


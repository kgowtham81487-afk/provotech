'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Users, TrendingUp, Sparkles, LogIn, ArrowRight } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border/80 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-evolve via-engage to-scale text-slate-950 font-black text-lg">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
              EES
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-surface-elevated px-1.5 py-0.5 rounded border border-surface-border">
                Platform
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">by Provolution Technologies</span>
          </div>
        </Link>

        {/* Stage Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-surface/60 border border-surface-border/60 p-1 rounded-xl">
          <Link
            href="/evolve"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-evolve hover:bg-surface-elevated/70 rounded-lg transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-evolve" />
            EVOLVE
          </Link>
          <Link
            href="/engage"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-engage hover:bg-surface-elevated/70 rounded-lg transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-engage" />
            ENGAGE
          </Link>
          <Link
            href="/scale"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-scale hover:bg-surface-elevated/70 rounded-lg transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5 text-scale" />
            SCALE
          </Link>
          <div className="h-4 w-[1px] bg-surface-border mx-1" />
          <Link
            href="/fields"
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Taxonomy
          </Link>
          <Link
            href="/blog"
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Knowledge Hub
          </Link>
        </nav>

        {/* CTA Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-xs font-semibold bg-white text-slate-950 px-3.5 py-2 rounded-lg hover:bg-slate-200 transition-all active:scale-[0.98] shadow-sm"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

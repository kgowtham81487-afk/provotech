'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Users,
  TrendingUp,
  Sparkles,
  LogIn,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Bell,
  LogOut,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border/80 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-evolve via-engage to-scale text-slate-950 font-black text-lg shadow-sm">
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
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/evolve"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <Compass className="h-4 w-4 text-evolve" />
            EVOLVE
          </Link>
          <Link
            href="/engage"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <Users className="h-4 w-4 text-engage" />
            ENGAGE
          </Link>
          <Link
            href="/scale"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <TrendingUp className="h-4 w-4 text-scale" />
            SCALE
          </Link>
          <Link
            href="/ai"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <Brain className="h-4 w-4 text-indigo-400" />
            AI Hub
          </Link>
        </nav>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Admin</span>
                  {isSuperAdmin && (
                    <span className="text-[9px] bg-indigo-500/30 px-1 py-0.2 rounded font-mono">SUPER</span>
                  )}
                </Link>
              )}

              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 group p-1 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-xs font-bold text-white group-hover:border-evolve transition-colors">
                    {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-medium text-white group-hover:text-evolve transition-colors leading-tight">
                      {user.displayName || user.username}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      @{user.username}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => logout()}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-surface-elevated transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
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
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

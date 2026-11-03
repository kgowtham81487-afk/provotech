'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await register({
      displayName,
      username,
      email,
      password,
    });

    setIsLoading(false);

    if (res.success) {
      router.push('/onboarding');
    } else {
      setError(res.error || 'Registration failed. Check details.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-evolve via-engage to-scale text-slate-950 font-black text-xl mb-4">
            E
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create EES Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Join the ecosystem. Choose your focus fields and build your verified portfolio.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Full Name / Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alex_builder"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Continue to Field Selection'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-slate-300 font-semibold hover:text-white underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim(), newPassword }),
    });

    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      setError(res.error?.message || 'Password reset failed. Token may be invalid or expired.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-white border border-surface-border mb-4">
          <KeyRound className="h-6 w-6 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Set New Password</h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter your single-use recovery token and choose a new secure password.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            <span>Password Reset Completed</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your password has been updated and all previous sessions have been securely invalidated.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition-colors"
            >
              Sign In with New Password <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Recovery Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here if not in URL"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              New Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Resetting Password...' : 'Save New Password'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-140px)]">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading recovery interface...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

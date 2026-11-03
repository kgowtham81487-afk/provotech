'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [debugLink, setDebugLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    setIsLoading(false);

    if (res.success) {
      setIsSubmitted(true);
      if (res.data?.debugResetLink) {
        setDebugLink(res.data.debugResetLink);
      }
    } else {
      setError(res.error?.message || 'Failed to dispatch password reset request.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-white border border-surface-border mb-4">
            <Mail className="h-6 w-6 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your registered email address to receive a secure recovery link.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Reset Link Dispatched</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an account is associated with <strong className="text-slate-200">{email}</strong>, a
              single-use link has been generated. The link expires in 1 hour.
            </p>

            {debugLink && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Local Development Helper
                </span>
                <p className="text-xs text-slate-300 mb-3 break-all">
                  Direct token link generated:
                </p>
                <Link
                  href={debugLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
                >
                  Open Reset Page Directly <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="pt-4">
              <Link href="/login" className="text-xs text-slate-400 hover:text-white underline">
                Back to Sign In
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
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Send Recovery Link'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300">
                Cancel and return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


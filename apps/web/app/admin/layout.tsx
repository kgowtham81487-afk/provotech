'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'User Directory', icon: '👥' },
  { href: '/admin/ai', label: 'AI Management', icon: '🤖' },
  { href: '/admin/feature-flags', label: 'Feature Controls', icon: '🚩' },
  { href: '/admin/database', label: 'Database & Maintenance', icon: '💾' },
  { href: '/admin/opportunities', label: 'Opportunities & Vetting', icon: '💼' },
  { href: '/admin/audit-logs', label: 'Platform Audit Logs', icon: '📜' },
  { href: '/admin/configs', label: 'Platform Settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Verifying administrative credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#0F172A] border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 text-3xl rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            🔒
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Administrative privileges required. Your account ({user?.email}) does not hold an authorized
            administrator role in Provolution Technologies.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/evolve"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition"
            >
              Return to EES Platform
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              EES ADMIN
            </span>
            {isSuperAdmin ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Super Admin
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Admin
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Provolution Technologies Pvt. Ltd.</p>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.displayName || 'Administrator'}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <Link
            href="/evolve"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

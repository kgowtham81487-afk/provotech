'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Command Center</h1>
          <p className="text-sm text-slate-400">
            Real-time analytics, user distribution, and ecosystem metrics for Provolution Technologies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700 flex items-center gap-2"
          >
            <span>🔄</span> Refresh Telemetry
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
                <span className="text-xl">👥</span>
              </div>
              <div className="text-3xl font-black text-white">{stats?.users?.total ?? 0}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{stats?.users?.active ?? 0} active accounts</span>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Evolve Activity</span>
                <span className="text-xl">🚀</span>
              </div>
              <div className="text-3xl font-black text-white">{stats?.evolve?.totalLearningSessions ?? 0}</div>
              <div className="mt-2 text-xs text-indigo-400">
                <span>{stats?.evolve?.totalProjects ?? 0} portfolio projects submitted</span>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Engage Network</span>
                <span className="text-xl">💬</span>
              </div>
              <div className="text-3xl font-black text-white">{stats?.engage?.totalPosts ?? 0}</div>
              <div className="mt-2 text-xs text-cyan-400">
                <span>{stats?.engage?.totalCommunities ?? 0} active communities</span>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scale Ecosystem</span>
                <span className="text-xl">💼</span>
              </div>
              <div className="text-3xl font-black text-emerald-400">
                ₹{Number(stats?.scale?.totalCompensationPaid ?? 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <span>{stats?.scale?.totalOpportunities ?? 0} opportunities published</span>
              </div>
            </div>
          </div>

          {/* Detailed Stages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Evolve Telemetry */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  E
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Evolve Metrics</h2>
                  <p className="text-xs text-slate-400">Skill mastery & learning pipeline</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Active Taxonomy Fields</span>
                  <span className="font-semibold text-white">{stats?.evolve?.totalFields ?? 6}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Learning Sessions Logged</span>
                  <span className="font-semibold text-white">{stats?.evolve?.totalLearningSessions ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Workout Sessions Logged</span>
                  <span className="font-semibold text-white">{stats?.evolve?.totalWorkouts ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Portfolio Projects</span>
                  <span className="font-semibold text-white">{stats?.evolve?.totalProjects ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-400">Total XP Issued</span>
                  <span className="font-semibold text-indigo-400">{stats?.evolve?.totalXpIssued ?? 0} XP</span>
                </div>
              </div>
            </div>

            {/* Engage Telemetry */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Engage Metrics</h2>
                  <p className="text-xs text-slate-400">Field collaboration & social network</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Total Posts Created</span>
                  <span className="font-semibold text-white">{stats?.engage?.totalPosts ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Discussion Comments</span>
                  <span className="font-semibold text-white">{stats?.engage?.totalComments ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Active Communities</span>
                  <span className="font-semibold text-white">{stats?.engage?.totalCommunities ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Direct Messages Sent</span>
                  <span className="font-semibold text-white">{stats?.engage?.totalMessages ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-400">System Notifications</span>
                  <span className="font-semibold text-cyan-400">{stats?.engage?.totalNotifications ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Scale Telemetry */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  C
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Scale Metrics</h2>
                  <p className="text-xs text-slate-400">Provolution commercial contracts</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Published Opportunities</span>
                  <span className="font-semibold text-white">{stats?.scale?.totalOpportunities ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Candidate Applications</span>
                  <span className="font-semibold text-white">{stats?.scale?.totalApplications ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Active Assignments</span>
                  <span className="font-semibold text-white">{stats?.scale?.activeAssignments ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Submitted Deliverables</span>
                  <span className="font-semibold text-white">{stats?.scale?.totalDeliverables ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-400">Compensation Ledger Total</span>
                  <span className="font-semibold text-emerald-400">
                    ₹{Number(stats?.scale?.totalCompensationPaid ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Quick Administrative Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition transform">👥</div>
                <div className="font-semibold text-sm text-white mb-1">Manage Users</div>
                <p className="text-xs text-slate-400">Create accounts, assign roles, generate reset tokens</p>
              </Link>

              <Link
                href="/admin/feature-flags"
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition transform">🚩</div>
                <div className="font-semibold text-sm text-white mb-1">Feature Controls</div>
                <p className="text-xs text-slate-400">Live toggles for registration, AI, monetization & chat</p>
              </Link>

              <Link
                href="/admin/opportunities"
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition transform">💼</div>
                <div className="font-semibold text-sm text-white mb-1">Review Opportunities</div>
                <p className="text-xs text-slate-400">Create contracts and review candidate submissions</p>
              </Link>

              <Link
                href="/admin/database"
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition transform">💾</div>
                <div className="font-semibold text-sm text-white mb-1">Database & Cleanup</div>
                <p className="text-xs text-slate-400">Inspect table row counts and purge expired sessions</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

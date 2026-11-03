'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/audit-logs', { params: { page, limit: 25 } });
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
      const paginationData = res.pagination || res.meta || res.data?.pagination || res.data?.meta || { page, limit: 25, total: items.length, totalPages: 1 };
      setLogs(items);
      setPagination(paginationData);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch platform audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Audit Logs</h1>
          <p className="text-sm text-slate-400">
            Immutable security event ledger recording all authentication, administrative, and role-change actions.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700 flex items-center gap-2"
        >
          <span>🔄</span> Refresh Logs
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {log.user ? (
                        <div>
                          <div className="font-medium text-white">{log.user.profile?.displayName || 'User'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">SYSTEM</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <span className="font-mono text-[11px]">
                        {log.entityType ? `${log.entityType} (${log.entityId ? log.entityId.slice(0, 8) + '...' : ''})` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {log.metadata ? (
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {JSON.stringify(log.metadata)}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {logs.length} of {pagination.total} audit events (Page {pagination.page} of {pagination.totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


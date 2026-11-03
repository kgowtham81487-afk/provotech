'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', displayName: '', role: 'USER' });
  const [creating, setCreating] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('USER');
  const [changingRole, setChangingRole] = useState(false);

  const [resetLinkData, setResetLinkData] = useState<{ email: string; resetUrl: string; expiresAt: string } | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/users', { params });
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
      const paginationData = res.pagination || res.meta || res.data?.pagination || res.data?.meta || { page, limit: 15, total: items.length, totalPages: 1 };
      setUsers(items);
      setPagination(paginationData);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch user directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setFeedback(null);
      await api.post('/admin/users', createForm);
      setFeedback({ type: 'success', message: `User account created successfully for ${createForm.email}` });
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', displayName: '', role: 'USER' });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create user' });
    } finally {
      setCreating(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleModalUser) return;
    try {
      setChangingRole(true);
      setFeedback(null);
      await api.patch(`/admin/users/${roleModalUser.id}/role`, { role: newRole });
      setFeedback({ type: 'success', message: `Role updated to ${newRole} for ${roleModalUser.email}` });
      setRoleModalUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update user role' });
    } finally {
      setChangingRole(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const reason = newStatus === 'SUSPENDED' ? 'Administrative suspension' : 'Administrative reactivation';
    try {
      setFeedback(null);
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus, reason });
      setFeedback({ type: 'success', message: `Status updated to ${newStatus} for ${user.email}` });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update user status' });
    }
  };

  const handleGenerateResetLink = async (user: any) => {
    try {
      setGeneratingLink(true);
      setFeedback(null);
      const res = await api.post(`/admin/users/${user.id}/reset-link`);
      setResetLinkData({
        email: user.email,
        resetUrl: res.data.resetUrl,
        expiresAt: res.data.expiresAt,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to generate reset link' });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to soft delete account ${user.email}?`)) return;
    try {
      setFeedback(null);
      await api.delete(`/admin/users/${user.id}`);
      setFeedback({ type: 'success', message: `Account ${user.email} soft deleted.` });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete user' });
    }
  };

  const handleRestoreUser = async (user: any) => {
    try {
      setFeedback(null);
      await api.post(`/admin/users/${user.id}/restore`);
      setFeedback({ type: 'success', message: `Account ${user.email} restored.` });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to restore user' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Directory & IAM</h1>
          <p className="text-sm text-slate-400">
            RBAC roles, authentication controls, and account lifecycle management.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <span>➕</span> Provision New User
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by email, username or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MODERATOR">MODERATOR</option>
            <option value="OPPORTUNITY_MANAGER">OPPORTUNITY_MANAGER</option>
            <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="USER">USER</option>
            <option value="STANDARD_USER">STANDARD_USER</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Roles</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Verified</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading user directory...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No users match your filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleNames = u.roles?.map((r: any) => r.role?.name || r) || [];
                  const isDeleted = Boolean(u.deletedAt);
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                            {u.profile?.displayName ? u.profile.displayName.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {u.profile?.displayName || 'User'}
                              {isDeleted && (
                                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                                  DELETED
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {roleNames.map((rn: string) => (
                            <span
                              key={rn}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                                rn === 'SUPER_ADMIN'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : rn === 'ADMIN'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {rn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : u.status === 'SUSPENDED'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {u.emailVerified ? '✅ Yes' : '❌ No'}
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setNewRole(roleNames[0] || 'USER');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition"
                            title="Change Role"
                          >
                            Role
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                              u.status === 'ACTIVE'
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                            title="Suspend/Activate"
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleGenerateResetLink(u)}
                            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[11px] transition"
                            title="Generate single-use reset link"
                          >
                            Reset Link
                          </button>
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestoreUser(u)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] transition"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] transition"
                              title="Soft Delete"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {users.length} of {pagination.total} users (Page {pagination.page} of {pagination.totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              Previous
            </button>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Provision New User Account</h2>
            <p className="text-xs text-slate-400 mb-4">
              Directly bootstrap an active account with an assigned platform role.
            </p>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name / Display Name</label>
                <input
                  type="text"
                  required
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Initial Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assigned Platform Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="USER">USER</option>
                  <option value="STANDARD_USER">STANDARD_USER (Legacy)</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                  <option value="OPPORTUNITY_MANAGER">OPPORTUNITY_MANAGER</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Modify User Role</h2>
            <p className="text-xs text-slate-400 mb-4">
              Update platform authorization role for <span className="text-white font-medium">{roleModalUser.email}</span>.
            </p>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="USER">USER</option>
                  <option value="STANDARD_USER">STANDARD_USER (Legacy)</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                  <option value="OPPORTUNITY_MANAGER">OPPORTUNITY_MANAGER</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangeRole}
                  disabled={changingRole}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                >
                  {changingRole ? 'Saving...' : 'Apply Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Link Generated */}
      {resetLinkData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0F172A] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 text-xl flex items-center justify-center">
                🔗
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Single-Use Password Reset Link</h2>
                <p className="text-xs text-slate-400">Generated for {resetLinkData.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This link contains a cryptographically secure, single-use token that will expire in 1 hour
              ({new Date(resetLinkData.expiresAt).toLocaleTimeString()}). You can deliver this link securely to the user:
            </p>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 break-all select-all">
              {resetLinkData.resetUrl}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetLinkData.resetUrl);
                  alert('Reset link copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => setResetLinkData(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


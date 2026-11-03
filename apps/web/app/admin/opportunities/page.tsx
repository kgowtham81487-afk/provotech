'use client';

import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  FileText,
  DollarSign,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'opportunities' | 'applications' | 'create'>('opportunities');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Review modal
  const [reviewApp, setReviewApp] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'SHORTLISTED' | 'SELECTED' | 'REJECTED'>('SHORTLISTED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit Opportunity Modal
  const [editingOpp, setEditingOpp] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    description: '',
    scope: '',
    type: 'FREELANCE',
    compensationType: 'FIXED_PRICE',
    compensationAmount: 25000,
    currency: 'INR',
    fieldId: '',
    status: 'OPEN',
    requiredSkillIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [oppsRes, appsRes, fieldsRes] = await Promise.all([
        api.get('/admin/opportunities', { params }).catch(() => api.get('/scale/opportunities')),
        api.get('/admin/applications'),
        api.get('/fields'),
      ]);

      const opps = Array.isArray(oppsRes.data?.items)
        ? oppsRes.data.items
        : Array.isArray(oppsRes.data)
        ? oppsRes.data
        : oppsRes.data?.data || [];
      const apps = Array.isArray(appsRes.data?.items)
        ? appsRes.data.items
        : Array.isArray(appsRes.data)
        ? appsRes.data
        : appsRes.data?.data || [];
      const fieldsList = Array.isArray(fieldsRes.data) ? fieldsRes.data : fieldsRes.data?.data || [];

      setOpportunities(opps);
      setApplications(apps);
      setFields(fieldsList);

      if (fieldsList.length > 0 && !createForm.fieldId) {
        setCreateForm((prev) => ({ ...prev, fieldId: fieldsList[0].id }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load opportunity data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const slug =
        createForm.slug.trim().toLowerCase() ||
        createForm.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      await api.post('/admin/opportunities', {
        ...createForm,
        slug,
      });

      setFeedback({ type: 'success', message: `Opportunity "${createForm.title}" published!` });
      setTab('opportunities');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to publish opportunity' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    try {
      setUpdating(true);
      await api.patch(`/admin/opportunities/${editingOpp.id}`, editingOpp);
      setFeedback({ type: 'success', message: `Opportunity "${editingOpp.title}" updated!` });
      setEditingOpp(null);
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update opportunity' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOpportunity = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will remove all associated applications.`)) return;
    try {
      await api.delete(`/admin/opportunities/${id}`);
      setFeedback({ type: 'success', message: `Opportunity "${title}" deleted.` });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete opportunity' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string, title: string) => {
    const nextStatus = currentStatus === 'OPEN' ? 'DRAFT' : 'OPEN';
    try {
      await api.patch(`/admin/opportunities/${id}/status`, { status: nextStatus });
      setFeedback({
        type: 'success',
        message: `Opportunity "${title}" is now ${nextStatus === 'OPEN' ? 'PUBLISHED (OPEN)' : 'UNPUBLISHED (DRAFT)'}.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update status' });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApp) return;
    try {
      setSubmittingReview(true);
      await api.patch(`/admin/applications/${reviewApp.id}/review`, {
        status: reviewStatus,
        notes: reviewNotes,
      });
      setFeedback({
        type: 'success',
        message: `Application reviewed successfully as ${reviewStatus}.`,
      });
      setReviewApp(null);
      setReviewNotes('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update application review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>💼 Opportunity Marketplace & Vetting</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, manage and publish Provolution Technologies assignments. Review verified portfolio applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('opportunities')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'opportunities'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setTab('applications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'applications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setTab('create')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'create'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            + Create New
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Opportunities List */}
      {tab === 'opportunities' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search opportunities by title, scope, or organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN (Published)</option>
              <option value="DRAFT">DRAFT (Unpublished)</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Opportunity</th>
                    <th className="px-4 py-3.5">Field & Type</th>
                    <th className="px-4 py-3.5">Compensation</th>
                    <th className="px-4 py-3.5">Applicants</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        Loading opportunities...
                      </td>
                    </tr>
                  ) : opportunities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No opportunities found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    opportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-slate-900/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-white text-sm">{opp.title}</div>
                          <div className="text-[11px] text-slate-400">{opp.organization}</div>
                          {opp.deadline && (
                            <div className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-indigo-300">{opp.field?.name || 'Cross-Field'}</div>
                          <div className="text-[10px] text-slate-500 font-mono uppercase">{opp.type}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-emerald-400">
                            {opp.currency} {opp.compensationAmount ? opp.compensationAmount.toLocaleString() : 'Fixed'}
                          </div>
                          <div className="text-[10px] text-slate-500">{opp.compensationType}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs">{opp._count?.applications || 0}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleStatus(opp.id, opp.status, opp.title)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                              opp.status === 'OPEN'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {opp.status === 'OPEN' ? 'OPEN (Published)' : opp.status}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingOpp(opp)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Edit Opportunity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOpportunity(opp.id, opp.title)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition"
                              title="Delete Opportunity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Applications Review */}
      {tab === 'applications' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Candidate Applications</h2>
            <span className="text-xs text-slate-400">Total: {applications.length} submitted</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-4 py-3.5">Opportunity</th>
                  <th className="px-4 py-3.5">Hours/Wk</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Applied At</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No candidate applications pending review.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{app.user?.profile?.displayName || 'Candidate'}</div>
                        <div className="text-[11px] text-slate-400">{app.user?.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-indigo-300">
                        {app.opportunity?.title || 'Unknown Opportunity'}
                      </td>
                      <td className="px-4 py-3.5 font-mono">{app.availableHoursPerWeek} hrs</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            app.status === 'SELECTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : app.status === 'SHORTLISTED'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setReviewApp(app);
                            setReviewStatus(app.status === 'SUBMITTED' ? 'SHORTLISTED' : app.status);
                            setReviewNotes(app.reviewNotes || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                        >
                          Review & Vet
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Create Form */}
      {tab === 'create' && (
        <div className="max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-1">Publish New Commercial Opportunity</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter project details. Published opportunities are immediately searchable by the AI Assistant and candidate marketplace.
          </p>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Opportunity Title *</label>
              <input
                type="text"
                required
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. Distributed Analytics Microservice Lead"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Domain Field *</label>
                <select
                  value={createForm.fieldId}
                  onChange={(e) => setCreateForm({ ...createForm, fieldId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Engagement Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FREELANCE">FREELANCE</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="INTERNSHIP">INTERNSHIP</option>
                  <option value="FULL_TIME">FULL_TIME</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Compensation Type</label>
                <select
                  value={createForm.compensationType}
                  onChange={(e) => setCreateForm({ ...createForm, compensationType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FIXED_PRICE">FIXED_PRICE</option>
                  <option value="HOURLY_RATE">HOURLY_RATE</option>
                  <option value="STIPEND">STIPEND</option>
                  <option value="UNPAID_LEARNING">UNPAID_LEARNING</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  value={createForm.compensationAmount}
                  onChange={(e) => setCreateForm({ ...createForm, compensationAmount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Currency</label>
                <input
                  type="text"
                  value={createForm.currency}
                  onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">High-Level Description *</label>
              <textarea
                required
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Overview of the opportunity, project goals, and client impact..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Deliverable Scope & Criteria *</label>
              <textarea
                required
                rows={3}
                value={createForm.scope}
                onChange={(e) => setCreateForm({ ...createForm, scope: e.target.value })}
                placeholder="Concrete deliverables (e.g. 5 REST microservices, GitHub PR review, load testing suite)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTab('opportunities')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
              >
                {creating ? 'Publishing...' : 'Publish Opportunity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Opportunity Modal */}
      {editingOpp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1">Edit Opportunity: {editingOpp.title}</h3>
            <p className="text-xs text-slate-400 mb-5">Update deliverables, compensation or status.</p>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingOpp.title}
                  onChange={(e) => setEditingOpp({ ...editingOpp, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={editingOpp.status}
                    onChange={(e) => setEditingOpp({ ...editingOpp, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OPEN">OPEN (Published)</option>
                    <option value="DRAFT">DRAFT (Unpublished)</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Compensation Amount</label>
                  <input
                    type="number"
                    value={editingOpp.compensationAmount || ''}
                    onChange={(e) => setEditingOpp({ ...editingOpp, compensationAmount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingOpp.description}
                  onChange={(e) => setEditingOpp({ ...editingOpp, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Scope</label>
                <textarea
                  rows={3}
                  value={editingOpp.scope}
                  onChange={(e) => setEditingOpp({ ...editingOpp, scope: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOpp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewApp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Vet Candidate: {reviewApp.user?.profile?.displayName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Applying for: <span className="text-white font-medium">{reviewApp.opportunity?.title}</span>
            </p>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 mb-4 text-xs space-y-2">
              <div>
                <span className="text-slate-400 font-semibold">Cover Note:</span>
                <p className="text-slate-200 mt-0.5 italic">{reviewApp.coverNote || 'No cover note submitted.'}</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Vetting Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SHORTLISTED">SHORTLISTED (Advanced to Interview)</option>
                  <option value="SELECTED">SELECTED (Award Project Assignment)</option>
                  <option value="REJECTED">REJECTED (Not suitable)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reviewer Feedback Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Notes for the candidate and auditing log..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Record Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

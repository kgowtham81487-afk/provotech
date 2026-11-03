'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'applications' | 'create'>('applications');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Review modal
  const [reviewApp, setReviewApp] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'SHORTLISTED' | 'SELECTED' | 'REJECTED'>('SHORTLISTED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    description: '',
    scope: '',
    type: 'PROJECT_CONTRACT',
    compensationType: 'FIXED_PROJECT',
    compensationAmount: 25000,
    currency: 'INR',
    fieldId: '',
    requiredSkillIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [oppsRes, appsRes, fieldsRes] = await Promise.all([
        api.get('/scale/opportunities'),
        api.get('/admin/applications'),
        api.get('/fields'),
      ]);
      const opps = Array.isArray(oppsRes.data) ? oppsRes.data : (oppsRes.data?.data || oppsRes.data?.items || []);
      const apps = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.items || appsRes.data?.data || []);
      const fieldsList = Array.isArray(fieldsRes.data) ? fieldsRes.data : (fieldsRes.data?.data || []);
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
  }, []);

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      // Auto-generate slug if empty
      const slug =
        createForm.slug ||
        createForm.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      // Pick any skill from the field if requiredSkillIds is empty
      const selectedField = fields.find((f) => f.id === createForm.fieldId);
      let skillIds = createForm.requiredSkillIds;
      if (skillIds.length === 0 && selectedField?.categories) {
        const firstSkill = selectedField.categories[0]?.skills?.[0];
        if (firstSkill) skillIds = [firstSkill.id];
      }

      await api.post('/admin/opportunities', {
        ...createForm,
        slug,
        requiredSkillIds: skillIds,
      });

      setFeedback({ type: 'success', message: `Opportunity "${createForm.title}" published!` });
      setTab('applications');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to publish opportunity' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Opportunities & Candidate Vetting</h1>
          <p className="text-sm text-slate-400">
            Publish client & internal contracts, review talent portfolios, and award project assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'applications'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Review Candidates ({applications.length})
          </button>
          <button
            onClick={() => setTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'create'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ➕ Post New Opportunity
          </button>
        </div>
      </div>

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

      {tab === 'applications' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Candidate Submissions
            </span>
            <button onClick={fetchData} className="text-xs text-indigo-400 hover:text-indigo-300">
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-4 py-3.5">Opportunity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Portfolio & Proposal</th>
                  <th className="px-4 py-3.5">Applied Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Loading candidate applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {app.user?.profile?.displayName || 'Candidate'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{app.user?.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{app.opportunity?.title}</div>
                        <div className="text-[11px] text-slate-400">
                          ₹{app.opportunity?.compensationAmount?.toLocaleString()} · {app.opportunity?.type}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            app.status === 'SELECTED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : app.status === 'SHORTLISTED'
                              ? 'bg-amber-500/10 text-amber-400'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="line-clamp-2 text-[11px] text-slate-400 mb-1">{app.proposal}</p>
                        {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                          <div className="flex gap-2">
                            {app.portfolioLinks.map((link: string, i: number) => (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-400 hover:underline"
                              >
                                Link {i + 1} ↗
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setReviewApp(app);
                            setReviewStatus(app.status === 'SUBMITTED' ? 'SHORTLISTED' : app.status);
                            setReviewNotes(app.reviewNotes || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                        >
                          Vetting Review
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

      {tab === 'create' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl">
          <h2 className="text-lg font-bold text-white mb-1">Create Opportunity (Provolution Technologies)</h2>
          <p className="text-xs text-slate-400 mb-6">
            Post a client project, freelance deliverable, or development bounty for verified community talent.
          </p>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Opportunity Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Full-Stack Dashboard Engineer (React + NestJS)"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Associated Taxonomy Field</label>
                <select
                  value={createForm.fieldId}
                  onChange={(e) => setCreateForm({ ...createForm, fieldId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Opportunity Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PROJECT_CONTRACT">PROJECT_CONTRACT</option>
                  <option value="FREELANCE_ASSIGNMENT">FREELANCE_ASSIGNMENT</option>
                  <option value="CODE_CHALLENGE">CODE_CHALLENGE</option>
                  <option value="CONTENT_BOUNTY">CONTENT_BOUNTY</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Compensation Amount (INR)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={createForm.compensationAmount}
                  onChange={(e) => setCreateForm({ ...createForm, compensationAmount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Compensation Structure</label>
                <select
                  value={createForm.compensationType}
                  onChange={(e) => setCreateForm({ ...createForm, compensationType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FIXED_PROJECT">FIXED_PROJECT</option>
                  <option value="HOURLY">HOURLY</option>
                  <option value="MILESTONE_BASED">MILESTONE_BASED</option>
                  <option value="REVENUE_SHARE">REVENUE_SHARE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Overview Description</label>
              <textarea
                required
                rows={3}
                placeholder="High-level description of the project deliverables..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Scope of Work & Acceptance Criteria</label>
              <textarea
                required
                rows={3}
                placeholder="Detailed scope, GitHub repository requirements, milestones..."
                value={createForm.scope}
                onChange={(e) => setCreateForm({ ...createForm, scope: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition"
              >
                {creating ? 'Publishing...' : 'Publish Opportunity to Scale'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewApp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Candidate Vetting & Selection</h2>
            <p className="text-xs text-slate-400 mb-4">
              Reviewing applicant <span className="text-white font-medium">{reviewApp.user?.email}</span> for{' '}
              <span className="text-indigo-400">{reviewApp.opportunity?.title}</span>.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Status Verdict</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SHORTLISTED">SHORTLISTED (Candidate is under evaluation)</option>
                  <option value="SELECTED">SELECTED (Awards project & starts Active Assignment)</option>
                  <option value="REJECTED">REJECTED (Candidate not chosen)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reviewer Feedback Notes</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Notes explaining decision, feedback on portfolio, or next milestone steps..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                >
                  {submittingReview ? 'Submitting...' : 'Save Review Verdict'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


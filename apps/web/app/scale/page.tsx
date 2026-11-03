'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  FileCheck,
  Send,
  Building2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ScalePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'applications' | 'assignments' | 'ledger'>('catalog');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Modal state
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deliverable submission modal
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [deliverableDesc, setDeliverableDesc] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [oppsRes, appsRes, assignsRes, ledgerRes] = await Promise.all([
      apiRequest('/scale/opportunities', { method: 'GET' }),
      user ? apiRequest('/scale/my-applications', { method: 'GET' }) : Promise.resolve({ success: false, data: [] }),
      user ? apiRequest('/scale/my-assignments', { method: 'GET' }) : Promise.resolve({ success: false, data: [] }),
      user ? apiRequest('/scale/ledger', { method: 'GET' }) : Promise.resolve({ success: false, data: null }),
    ]);

    if (oppsRes.success && oppsRes.data) setOpportunities(oppsRes.data.data || []);
    if (appsRes.success && appsRes.data) setMyApplications(appsRes.data);
    if (assignsRes.success && assignsRes.data) setMyAssignments(assignsRes.data);
    if (ledgerRes.success && ledgerRes.data) setLedger(ledgerRes.data);

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;

    setIsSubmitting(true);
    setApplyError(null);

    const res = await apiRequest(`/scale/opportunities/${selectedOpp.id}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        coverNote,
        externalPortfolioLinks: portfolioLink ? [portfolioLink] : [],
        availableHoursPerWeek: Number(hoursPerWeek),
      }),
    });

    setIsSubmitting(false);

    if (res.success) {
      setApplySuccess(true);
      loadData();
    } else {
      setApplyError(res.error?.message || 'Application submission failed.');
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;

    const res = await apiRequest(`/scale/assignments/${selectedAssignmentId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify({
        title: deliverableTitle,
        pullRequestUrl: pullRequestUrl || undefined,
        description: deliverableDesc || undefined,
      }),
    });

    if (res.success) {
      setSelectedAssignmentId(null);
      setDeliverableTitle('');
      setPullRequestUrl('');
      setDeliverableDesc('');
      loadData();
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-scale font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>SCALE Opportunities & Value</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Provolution Commercial Opportunities
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Convert your demonstrated skills and portfolio into real paid freelance contracts, research bounties, and assignments.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border/60 py-3 overflow-x-auto text-xs font-semibold mt-4">
        {[
          { key: 'catalog', label: 'Open Opportunities', count: opportunities.length },
          { key: 'applications', label: 'My Applications', count: myApplications.length },
          { key: 'assignments', label: 'Active Contracts', count: myAssignments.length },
          { key: 'ledger', label: 'Verified Earnings Ledger' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-scale/15 text-scale font-bold'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] bg-surface-elevated px-1.5 py-0.2 rounded text-slate-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OPPORTUNITY CATALOG */}
      {activeTab === 'catalog' && (
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading open opportunities...</div>
          ) : opportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-2xl border border-surface-border bg-surface p-6 flex flex-col justify-between hover:border-scale/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-scale/15 text-scale px-2.5 py-1 rounded-full">
                        {opp.type}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {opp.compensationAmount
                          ? `${opp.currency} ${opp.compensationAmount.toLocaleString()}`
                          : 'Competitive Stipend'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mb-2">{opp.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                      {opp.description}
                    </p>

                    <div className="mb-4">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        Required Skills & Evidence:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {opp.requiredSkills?.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-surface-elevated text-slate-300 px-2 py-0.5 rounded border border-surface-border/60"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {opp.organization}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOpp(opp);
                        setApplySuccess(false);
                        setApplyError(null);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-scale px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-scale/90 transition-colors shadow-sm"
                    >
                      <span>Apply with Portfolio</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-border p-12 text-center text-slate-500 text-xs">
              No active opportunities listed at this moment. Check back soon.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="mt-6 space-y-4">
          {myApplications.length > 0 ? (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-surface-border bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-1.5 ${
                        app.status === 'SELECTED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : app.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      Status: {app.status}
                    </span>
                    <h4 className="font-bold text-white text-sm">{app.opportunity.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{app.coverNote}</p>
                    {app.reviewNotes && (
                      <p className="text-xs text-amber-300 mt-2 bg-amber-500/10 p-2 rounded">
                        Reviewer feedback: {app.reviewNotes}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 block">
                      Submitted: {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {app.status === 'SELECTED' && (
                      <span className="text-xs font-bold text-emerald-400 block mt-1">
                        Contract Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-border p-12 text-center text-slate-500 text-xs">
              You haven't submitted any applications yet. Explore the Open Opportunities tab!
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="mt-6 space-y-4">
          {myAssignments.length > 0 ? (
            <div className="space-y-4">
              {myAssignments.map((assign) => (
                <div
                  key={assign.id}
                  className="rounded-2xl border border-surface-border bg-surface p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {assign.status}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1">
                        {assign.opportunity.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Started: {new Date(assign.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedAssignmentId(assign.id)}
                      className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-slate-200"
                    >
                      Submit Deliverable Pull Request
                    </button>
                  </div>

                  {/* Submitted Deliverables List */}
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <h5 className="text-xs font-bold text-slate-300 mb-2">Submitted Deliverables:</h5>
                    {assign.deliverables?.length > 0 ? (
                      <div className="space-y-2">
                        {assign.deliverables.map((d: any) => (
                          <div
                            key={d.id}
                            className="flex justify-between items-center text-xs text-slate-300 bg-surface-elevated p-2.5 rounded-lg"
                          >
                            <span>{d.title}</span>
                            <div className="flex items-center gap-3">
                              {d.pullRequestUrl && (
                                <a
                                  href={d.pullRequestUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-evolve hover:underline flex items-center gap-1"
                                >
                                  PR Link <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded ${
                                  d.isApproved
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {d.isApproved ? 'Approved' : 'Under Review'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No deliverables submitted yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-border p-12 text-center text-slate-500 text-xs">
              No active assignments currently allocated.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VERIFIED EARNINGS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Verified Disbursed Earnings
              </span>
              <span className="text-3xl font-black text-emerald-400">
                INR {ledger?.totalDisbursed?.toLocaleString() || 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Settled to verified bank accounts through Provolution Technologies Pvt. Ltd.
              </p>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pending Milestone Disbursements
              </span>
              <span className="text-3xl font-black text-amber-400">
                INR {ledger?.pendingDisbursement?.toLocaleString() || 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Awaiting final deliverable approval and scheduled batch disbursement.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4">Official Payment Records</h3>
            {ledger?.records?.length > 0 ? (
              <div className="space-y-2.5">
                {ledger.records.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center text-xs p-3 rounded-xl bg-surface-elevated text-slate-300"
                  >
                    <div>
                      <span className="font-semibold text-white block">
                        {r.assignment?.opportunity?.title || 'Contract Payment'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Ref / UTR: {r.referenceId || 'Pending Batch Reference'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">
                        {r.currency} {r.amount.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          r.status === 'DISBURSED' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No financial ledger transactions recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Application Submission Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Apply for {selectedOpp.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Provolution Technologies evaluates applicants strictly based on verified evidence and portfolio proof.
            </p>

            {applySuccess ? (
              <div className="space-y-3 text-center py-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Application Successfully Submitted!</h4>
                <p className="text-xs text-slate-400">
                  You earned +100 XP. You can monitor your application review status under the "My Applications" tab.
                </p>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {applyError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cover Statement / Relevant Experience (min 30 characters)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Describe how your demonstrated skills align with the scope requirements..."
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Portfolio Link / Project Evidence URL
                  </label>
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://github.com/your-username or live demo"
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Available Hours per Week
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    required
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOpp(null)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-scale px-4 py-2 text-xs font-bold text-slate-950 hover:bg-scale/90 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application (+100 XP)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Deliverable Submission Modal */}
      {selectedAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Submit Deliverable</h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit your completed work for Provolution manager review and milestone approval.
            </p>
            <form onSubmit={handleSubmitDeliverable} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deliverable Title</label>
                <input
                  type="text"
                  required
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  placeholder="e.g. Completed NestJS REST API with unit tests"
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pull Request / Repo URL</label>
                <input
                  type="url"
                  value={pullRequestUrl}
                  onChange={(e) => setPullRequestUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={deliverableDesc}
                  onChange={(e) => setDeliverableDesc(e.target.value)}
                  placeholder="Provide test instructions or PR summaries..."
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignmentId(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-200"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

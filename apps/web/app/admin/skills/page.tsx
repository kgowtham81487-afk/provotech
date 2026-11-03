'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    field?: { name: string };
  };
  _count?: {
    userSkills: number;
    opportunitySkills: number;
  };
}

interface Category {
  id: string;
  name: string;
  field?: { name: string };
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [skillForm, setSkillForm] = useState({
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    isActive: true,
  });

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;

      const [skillsRes, catRes] = await Promise.all([
        api.get('/admin/skills', { params }),
        api.get('/admin/skills/categories'),
      ]);

      const items = Array.isArray(skillsRes.data?.items)
        ? skillsRes.data.items
        : Array.isArray(skillsRes.data)
        ? skillsRes.data
        : [];
      setSkills(items);

      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      setCategories(cats);

      if (cats.length > 0 && !skillForm.categoryId) {
        setSkillForm((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load skills catalog' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSkills();
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admin/skills', skillForm);
      setFeedback({ type: 'success', message: `Skill '${skillForm.name}' created successfully.` });
      setShowCreateModal(false);
      setSkillForm({
        name: '',
        slug: '',
        categoryId: categories[0]?.id || '',
        description: '',
        isActive: true,
      });
      fetchSkills();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create skill' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      setSubmitting(true);
      await api.patch(`/admin/skills/${editingSkill.id}`, skillForm);
      setFeedback({ type: 'success', message: `Skill '${skillForm.name}' updated successfully.` });
      setEditingSkill(null);
      fetchSkills();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update skill' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete skill '${name}'? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/skills/${id}`);
      setFeedback({ type: 'success', message: `Skill '${name}' deleted successfully.` });
      fetchSkills();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete skill' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await api.patch(`/admin/skills/${id}`, { isActive: !currentStatus });
      setFeedback({
        type: 'success',
        message: `Skill '${name}' is now ${!currentStatus ? 'ACTIVE' : 'INACTIVE'}.`,
      });
      fetchSkills();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update skill status' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🧠 Skills Catalog & Curriculum Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage verified platform skills, category taxonomies, and proficiency prerequisites utilized by AI recommendations.
          </p>
        </div>

        <button
          onClick={() => {
            setSkillForm({
              name: '',
              slug: '',
              categoryId: categories[0]?.id || '',
              description: '',
              isActive: true,
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Skill</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search skills by title, slug, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.field ? `(${c.field.name})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={fetchSkills}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Skills Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Skill Name</th>
                <th className="px-4 py-3.5">Category & Field</th>
                <th className="px-4 py-3.5">Learners</th>
                <th className="px-4 py-3.5">Opportunities</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading skills catalog...
                  </td>
                </tr>
              ) : skills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No matching skills found in the database.
                  </td>
                </tr>
              ) : (
                skills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-sm">{skill.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{skill.slug}</div>
                      {skill.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{skill.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-indigo-300">{skill.category?.name || 'Uncategorized'}</div>
                      <div className="text-[10px] text-slate-500">{skill.category?.field?.name || 'Cross-field'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs">{skill._count?.userSkills || 0}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs">{skill._count?.opportunitySkills || 0}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(skill.id, skill.isActive, skill.name)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                          skill.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {skill.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSkill(skill);
                            setSkillForm({
                              name: skill.name,
                              slug: skill.slug,
                              categoryId: skill.categoryId,
                              description: skill.description || '',
                              isActive: skill.isActive,
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Skill"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id, skill.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition"
                          title="Delete Skill"
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

      {/* Create / Edit Skill Modal */}
      {(showCreateModal || editingSkill) && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-1">
              {editingSkill ? `Edit Skill: ${editingSkill.name}` : 'Create New Skill'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Specify taxonomy classification and description for curriculum and AI match algorithms.
            </p>

            <form onSubmit={editingSkill ? handleUpdateSkill : handleCreateSkill} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Skill Name *</label>
                <input
                  type="text"
                  required
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  placeholder="e.g. Distributed Consensus & Raft"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={skillForm.slug}
                  onChange={(e) => setSkillForm({ ...skillForm, slug: e.target.value })}
                  placeholder="e.g. distributed-consensus-raft (leave blank to auto-generate)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Taxonomy Category *</label>
                <select
                  required
                  value={skillForm.categoryId}
                  onChange={(e) => setSkillForm({ ...skillForm, categoryId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.field ? `— ${c.field.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  placeholder="Key concepts, libraries, and expected verifiable proofs..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={skillForm.isActive}
                  onChange={(e) => setSkillForm({ ...skillForm, isActive: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-slate-300 cursor-pointer">
                  Skill is active and eligible for AI recommendation and user enrollment
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSkill(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSkill ? 'Save Changes' : 'Create Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


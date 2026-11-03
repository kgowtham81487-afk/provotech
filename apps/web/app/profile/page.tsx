'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      setProfileData(res.data);
      if (res.data.profile) {
        setEditForm({
          displayName: res.data.profile.displayName || '',
          bio: res.data.profile.bio || '',
          location: res.data.profile.location || '',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch('/users/me', editForm);
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setEditModal(false);
      await refreshUser();
      await fetchProfile();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
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

        {loading ? (
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-12 text-center animate-pulse">
            <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-4" />
            <div className="h-6 w-48 bg-slate-800 rounded mx-auto mb-2" />
            <div className="h-4 w-32 bg-slate-800 rounded mx-auto" />
          </div>
        ) : (
          <>
            {/* Profile Header Card */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-500/20">
                    {profileData?.profile?.displayName
                      ? profileData.profile.displayName.slice(0, 2).toUpperCase()
                      : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-white">
                        {profileData?.profile?.displayName || 'EES Member'}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Level {profileData?.profile?.level || 1}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      @{profileData?.profile?.username || 'user'} · {profileData?.email}
                    </div>
                    {profileData?.profile?.location && (
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span>📍</span> {profileData.profile.location}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setEditModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                >
                  ✏️ Edit Profile
                </button>
              </div>

              {profileData?.profile?.bio && (
                <p className="mt-6 text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {profileData.profile.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
                <div className="text-center sm:text-left">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Total XP</div>
                  <div className="text-xl font-black text-indigo-400 mt-0.5">
                    {profileData?.profile?.xp || 0} XP
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Current Streak</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">
                    🔥 {profileData?.streak?.currentStreak || 0} Days
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Role Tier</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {profileData?.roles?.[0]?.role?.name || 'STANDARD_USER'}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-slate-400 uppercase font-semibold">EES Member Since</div>
                  <div className="text-xl font-bold text-slate-300 mt-0.5">
                    {new Date(profileData?.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Fields */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white">Focus Fields (Evolve)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileData?.fields && profileData.fields.length > 0 ? (
                  profileData.fields.map((uf: any) => (
                    <div
                      key={uf.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{uf.field.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              uf.priority === 'PRIMARY'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {uf.priority}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Proficiency: {uf.proficiency} · {uf.targetHoursWeekly} hrs/week
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-xs text-slate-500 py-4">
                    No focus fields chosen yet. Head to <a href="/onboarding" className="text-indigo-400 underline">Onboarding</a>.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Edit Modal */}
        {editModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-1">Edit Public Profile</h2>
              <p className="text-xs text-slate-400 mb-4">Update your display information across EES.</p>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Bio / Headline</label>
                  <textarea
                    rows={3}
                    placeholder="Tell the community about your technical pursuits and ambitions..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}


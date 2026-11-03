'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/engage/notifications');
        setNotifications(res.data || []);
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-400">
            Real-time activity alerts across Evolve, Engage, and Scale.
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-3xl mb-2">🔔</div>
              <div className="text-sm font-semibold text-slate-300">You are all caught up!</div>
              <div className="text-xs text-slate-500 mt-1">No pending notifications at this time.</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 transition ${
                    n.isRead ? 'opacity-70 bg-transparent' : 'bg-indigo-600/5'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 text-sm">
                    {n.type.includes('LIKE')
                      ? '❤️'
                      : n.type.includes('COMMENT')
                      ? '💬'
                      : n.type.includes('OPPORTUNITY')
                      ? '💼'
                      : '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{n.title}</div>
                    <p className="text-xs text-slate-300 mt-0.5">{n.body}</p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()} at{' '}
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function FieldsExplorerPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const res = await api.get('/fields');
        setFields(res.data || []);
      } catch (err) {
        console.error('Failed to load fields', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, []);

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            EES Taxonomy & Skill Atlas
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Explore Focus Fields
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            EES is structured around disciplined specialization. Choose one or two fields to systematically develop, engage with peers, and unlock monetization opportunities.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <div
                key={field.id}
                className="bg-[#0F172A] border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-500">/{field.slug}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Approved
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition mb-2">
                    {field.name}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {field.description || 'Specialized skill progression and industry career path.'}
                  </p>

                  {field.categories && field.categories.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-slate-400">Core Categories:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {field.categories.map((c: any) => (
                          <span
                            key={c.id}
                            className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <Link
                    href={`/onboarding`}
                    className="block text-center py-2 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-slate-300 border border-slate-800 hover:border-indigo-600 transition"
                  >
                    Select Field in Evolve →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}


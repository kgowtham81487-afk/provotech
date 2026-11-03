import React from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, ArrowRight, Calendar, User } from 'lucide-react';

export const metadata = {
  title: 'Editorial & Engineering Insights | EES Platform',
  description: 'Technical breakdowns, learning roadmaps, and career insights by Provolution Technologies Pvt. Ltd.',
};

const ARTICLES = [
  {
    slug: 'evolve-engage-scale-architecture',
    title: 'From Focused Skill Mastery to Commercial Scale: The EES Philosophy',
    summary: 'Why generic productivity trackers fail developers and how intentional specialization paired with real client bounties accelerates careers.',
    date: 'November 2, 2026',
    author: 'Gowtham K (Principal Architect)',
    field: 'Ecosystem Architecture',
    readTime: '6 min read',
  },
  {
    slug: 'mastering-fullstack-with-nestjs-nextjs',
    title: 'Building Enterprise Monorepos with NestJS, Next.js 15, and Prisma',
    summary: 'A deep-dive into high-performance TypeScript monorepos, strict RBAC patterns, and resilient AI-integrated workflows.',
    date: 'October 28, 2026',
    author: 'Provolution Engineering Team',
    field: 'Software Development',
    readTime: '8 min read',
  },
  {
    slug: 'gemini-flash-roadmaps',
    title: 'Automating Personalized Skill Trajectories with Gemini 2.5 Flash',
    summary: 'How deterministic prompts and low-latency LLM routing empower users with structured, week-by-week technical blueprints.',
    date: 'October 24, 2026',
    author: 'AI Research Group',
    field: 'Artificial Intelligence',
    readTime: '5 min read',
  },
];

export default function BlogIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="border-b border-surface-border pb-6 mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-evolve/10 border border-evolve/20 text-evolve text-xs font-semibold mb-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Provolution Insights</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Editorial &amp; Engineering Articles</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          In-depth technical guides, learning methodologies, and creator economy analysis from Provolution Technologies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTICLES.map((art) => (
          <article
            key={art.slug}
            className="flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-6 shadow-lg hover:border-evolve/40 transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-surface-elevated font-medium text-slate-300">
                  {art.field}
                </span>
                <span>{art.readTime}</span>
              </div>
              <h2 className="text-base font-bold text-white group-hover:text-evolve transition-colors mb-2 leading-snug">
                {art.title}
              </h2>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {art.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="h-3 w-3" />
                {art.date}
              </span>
              <span className="text-evolve font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Read Article <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


import Link from 'next/link';
import {
  Compass,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Code2,
  Brain,
  ShieldAlert,
  Dumbbell,
  Sparkles,
  Briefcase,
  Layers,
  Award,
} from 'lucide-react';
import { AdBanner } from '@/components/monetization/AdBanner';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background radial accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-b from-blue-900/20 via-emerald-950/10 to-transparent blur-3xl -z-10" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface/80 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Provolution Technologies Pvt. Ltd. presents</span>
          <span className="text-slate-500">•</span>
          <span className="font-semibold text-white">EES Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Master your craft. <br />
          <span className="bg-gradient-to-r from-evolve via-engage to-scale bg-clip-text text-transparent">
            Evolve. Engage. Scale.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          The integrated skill-development-to-opportunity ecosystem. Focus on 1 or 2 core fields, build
          verifiable project evidence with peers, and unlock paid contracts with Provolution Technologies.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-white text-slate-950 px-6 py-3.5 text-sm font-semibold hover:bg-slate-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5"
          >
            Start Your Evolution
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/scale/opportunities"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-elevated/80 px-6 py-3.5 text-sm font-medium text-slate-200 hover:bg-surface-elevated transition-colors"
          >
            <Briefcase className="h-4 w-4 text-scale" />
            Browse Opportunities
          </Link>
        </div>
      </section>

      {/* AdSense Placement Slot (Non-intrusive, ready for production) */}
      <div className="container mx-auto px-4 max-w-4xl">
        <AdBanner slotId="homepage-hero-bottom" />
      </div>

      {/* The 3-Stage Architecture */}
      <section className="container mx-auto px-4 sm:px-6 py-20 border-t border-surface-border/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            The Continuous Value Pipeline
          </h2>
          <p className="text-slate-400 text-sm">
            EES connects individual practice to community credibility and real economic remuneration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* STAGE 1: EVOLVE */}
          <div className="group relative rounded-2xl border border-surface-border bg-surface p-8 transition-all hover:border-evolve/50 hover:bg-surface-elevated/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-evolve/10 text-evolve mb-6 group-hover:scale-110 transition-transform">
              <Compass className="h-6 w-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded bg-evolve/10 text-evolve text-[11px] font-bold uppercase tracking-wider mb-3">
              Stage 1
            </div>
            <h3 className="text-xl font-bold text-white mb-2">EVOLVE</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Choose 1 or 2 core fields. Commit to structured roadmaps, log study sessions, track
              workouts, manage content drafts, and build verifiable project portfolios.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-evolve shrink-0" />
                Curated Skill Taxonomy & Roadmaps
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-evolve shrink-0" />
                Specialized Modules (Tech, Fitness, Content)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-evolve shrink-0" />
                Public Portfolio & Project Evidence
              </li>
            </ul>
          </div>

          {/* STAGE 2: ENGAGE */}
          <div className="group relative rounded-2xl border border-surface-border bg-surface p-8 transition-all hover:border-engage/50 hover:bg-surface-elevated/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-engage/10 text-engage mb-6 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded bg-engage/10 text-engage text-[11px] font-bold uppercase tracking-wider mb-3">
              Stage 2
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ENGAGE</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Apply your skills with peers. Join field-focused communities, discuss technical breakthroughs,
              receive constructive peer reviews, and build authentic credibility.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-engage shrink-0" />
                Field-Anchored Social Feeds
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-engage shrink-0" />
                Verified Project Showcases & Discussions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-engage shrink-0" />
                Private 1-on-1 Messaging & Communities
              </li>
            </ul>
          </div>

          {/* STAGE 3: SCALE */}
          <div className="group relative rounded-2xl border border-surface-border bg-surface p-8 transition-all hover:border-scale/50 hover:bg-surface-elevated/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-scale/10 text-scale mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded bg-scale/10 text-scale text-[11px] font-bold uppercase tracking-wider mb-3">
              Stage 3
            </div>
            <h3 className="text-xl font-bold text-white mb-2">SCALE</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Convert your demonstrated ability into real-world value. Access paid assignments from
              Provolution Technologies, monetize educational content, and track real earnings.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-scale shrink-0" />
                Provolution Commercial Opportunities
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-scale shrink-0" />
                Google AdSense-Ready Content Architecture
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-scale shrink-0" />
                Transparent Skill-Based Eligibility Ledger
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Supported Taxonomy Fields */}
      <section className="container mx-auto px-4 sm:px-6 py-20 border-t border-surface-border/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Configurable Taxonomy Fields</h2>
            <p className="text-slate-400 text-sm">
              Tailored workspaces engineered for distinct domains.
            </p>
          </div>
          <Link
            href="/fields"
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            Explore all fields <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Software Development',
              desc: 'React, TypeScript, NestJS, Architecture & Repos',
              icon: Code2,
              color: 'text-blue-400',
            },
            {
              title: 'AI & Machine Learning',
              desc: 'LLMs, PyTorch, Prompt Engineering & RAG',
              icon: Brain,
              color: 'text-purple-400',
            },
            {
              title: 'Cybersecurity',
              desc: 'AppSec, Penetration Testing & Defense',
              icon: ShieldAlert,
              color: 'text-red-400',
            },
            {
              title: 'Fitness & Health',
              desc: 'Workouts, Reps, Weight Tracking & PRs',
              icon: Dumbbell,
              color: 'text-emerald-400',
            },
          ].map((field, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-surface-border bg-surface/70 p-5 hover:border-slate-600 transition-colors"
            >
              <field.icon className={`h-6 w-6 ${field.color} mb-3`} />
              <h4 className="font-semibold text-white text-sm mb-1">{field.title}</h4>
              <p className="text-xs text-slate-400">{field.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-surface-border bg-gradient-to-b from-surface-elevated to-surface p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to evolve your capabilities?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mb-8">
              Join the ecosystem developed for dedicated builders, thinkers, and athletes. Choose your focus
              and build your legacy.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-8 py-3.5 text-sm font-semibold hover:bg-slate-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

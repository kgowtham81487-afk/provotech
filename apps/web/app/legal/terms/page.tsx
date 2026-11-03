import React from 'react';

export const metadata = {
  title: 'Terms of Service | EES — Evolve, Engage & Scale',
  description: 'Terms of Service for the EES platform, owned by Provolution Technologies Pvt. Ltd.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-slate-300">
      <div className="border-b border-surface-border pb-6 mb-8">
        <span className="text-xs uppercase font-bold tracking-wider text-evolve">Legal & Transparency</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Terms of Service</h1>
        <p className="text-xs text-slate-400 mt-2">
          Effective Date: November 3, 2026 · Provolution Technologies Pvt. Ltd.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Agreement to Terms</h2>
          <p>
            By accessing or using EES (Evolve, Engage &amp; Scale), you agree to be bound by these Terms of Service
            established by Provolution Technologies Pvt. Ltd.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. Focus Fields &amp; Progression System</h2>
          <p>
            EES promotes intentional skill development. Users designate one or two primary fields of study. All XP,
            streaks, and achievements awarded reflect verified platform activity and portfolio project milestones.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Commercial Opportunities &amp; Payouts</h2>
          <p>
            Opportunities posted under the SCALE stage represent commercial agreements, freelance milestones, or bounties.
            Compensation is credited to the verified ledger following deliverable verification by Provolution project
            managers. Misrepresentation of skills or submission of unauthorized third-party work constitutes grounds for
            immediate account revocation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Acceptable Conduct</h2>
          <p>
            Harassment, spam, intellectual property infringement, and reverse engineering are strictly prohibited.
            Provolution Technologies reserves the right to suspend or terminate accounts that breach platform safety.
          </p>
        </section>
      </div>
    </div>
  );
}


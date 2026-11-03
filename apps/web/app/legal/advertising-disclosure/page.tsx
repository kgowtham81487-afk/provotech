import React from 'react';

export const metadata = {
  title: 'Advertising Disclosure | EES — Evolve, Engage & Scale',
  description: 'Advertising Disclosure and AdSense policy adherence for EES, owned by Provolution Technologies Pvt. Ltd.',
};

export default function AdvertisingDisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-slate-300">
      <div className="border-b border-surface-border pb-6 mb-8">
        <span className="text-xs uppercase font-bold tracking-wider text-evolve">Compliance & Monetization</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Advertising &amp; Monetization Disclosure</h1>
        <p className="text-xs text-slate-400 mt-2">
          Effective Date: November 3, 2026 · Provolution Technologies Pvt. Ltd.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Google AdSense Integration</h2>
          <p>
            EES displays contextual advertisements served through Google AdSense. These ads are clearly demarcated
            with an &quot;ADVERTISEMENT&quot; label and adhere strictly to Google Publisher Policies. Ads are placed in reserved,
            CLS-safe (Cumulative Layout Shift) containers to ensure an uncompromised learning and collaboration experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. Separation of Editorial &amp; Commercial Content</h2>
          <p>
            Curated field roadmaps, skill requirements, and project evaluation criteria are developed independently by
            Provolution Technologies engineering leads. Advertising relationships do not influence learning roadmaps,
            peer assessments, or opportunity shortlisting.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Verified Ads.txt</h2>
          <p>
            In compliance with the IAB Tech Lab Ads.txt initiative, authorized digital advertising sellers for EES
            are listed at{' '}
            <a href="/ads.txt" target="_blank" className="text-evolve underline">
              /ads.txt
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}


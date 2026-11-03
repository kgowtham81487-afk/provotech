import React from 'react';

export const metadata = {
  title: 'Community Guidelines | EES — Evolve, Engage & Scale',
  description: 'Community standards for peer collaboration on the EES platform.',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-slate-300">
      <div className="border-b border-surface-border pb-6 mb-8">
        <span className="text-xs uppercase font-bold tracking-wider text-evolve">ENGAGE Ecosystem</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Community Guidelines</h1>
        <p className="text-xs text-slate-400 mt-2">
          Standards of Excellence &amp; Respect · Provolution Technologies Pvt. Ltd.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Constructive Peer Feedback</h2>
          <p>
            Engage is designed for technical collaboration, code reviews, and project showcases. All critiques
            should be objective, empathetic, and aimed at helping peers elevate their technical depth.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. Authentic Project Attribution</h2>
          <p>
            Only publish projects, repositories, and technical breakthroughs that you personally built or contributed
            to. Plagiarism or claiming credit for open-source repositories without attribution will result in immediate
            suspension from the SCALE opportunity ecosystem.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Zero Tolerance for Toxicity</h2>
          <p>
            Hate speech, personal attacks, discrimination, and unverified commercial spam are prohibited. Content
            moderators and Super Administrators actively enforce safety rules across all field feeds and communities.
          </p>
        </section>
      </div>
    </div>
  );
}


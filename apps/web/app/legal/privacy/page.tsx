import React from 'react';

export const metadata = {
  title: 'Privacy Policy | EES — Evolve, Engage & Scale',
  description: 'Privacy Policy for the EES platform, owned by Provolution Technologies Pvt. Ltd.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-slate-300">
      <div className="border-b border-surface-border pb-6 mb-8">
        <span className="text-xs uppercase font-bold tracking-wider text-evolve">Legal & Transparency</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mt-2">
          Effective Date: November 3, 2026 · Provolution Technologies Pvt. Ltd.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Introduction</h2>
          <p>
            Provolution Technologies Pvt. Ltd. (&quot;Provolution&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the
            EES (Evolve, Engage &amp; Scale) platform. We respect your privacy and are committed to protecting
            personal data you share with us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400">
            <li><strong className="text-slate-200">Account Credentials:</strong> Email address, username, hashed password, and display name.</li>
            <li><strong className="text-slate-200">Progression Telemetry:</strong> Selected focus fields, study session durations, workout logs, content ideas, and portfolio project submissions.</li>
            <li><strong className="text-slate-200">Commercial &amp; Payout Data:</strong> Opportunity applications, proposal notes, deliverable links, and verified compensation records.</li>
            <li><strong className="text-slate-200">Technical Data:</strong> IP addresses, browser user-agents, and security audit events.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Google AdSense &amp; Third-Party Cookies</h2>
          <p>
            We partner with Google AdSense to serve relevant advertising. Google and other third-party vendors
            use cookies to serve ads based on your prior visits to our website or other websites. You may opt out of
            personalized advertising by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noreferrer"
              className="text-evolve underline"
            >
              Google Ads Settings
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Data Retention &amp; Security</h2>
          <p>
            We implement industry-standard cryptographic mechanisms (bcrypt with salt factor 12 for passwords, SHA-256 for single-use recovery tokens, and short-lived JWT access tokens). You may request deletion of your account at any time through support or the profile management interface.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">5. Contact Information</h2>
          <p>
            For privacy inquiries or data subject rights requests, contact our compliance team at{' '}
            <a href="mailto:privacy@provolution.in" className="text-evolve underline">
              privacy@provolution.in
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

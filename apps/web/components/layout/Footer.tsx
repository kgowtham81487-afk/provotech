import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-surface-border/80 bg-surface/30 mt-20 text-slate-400 text-xs">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-evolve via-engage to-scale text-slate-950 font-black text-xs flex items-center justify-center">
                E
              </div>
              <span className="font-bold text-white text-sm">EES Platform</span>
            </div>
            <p className="text-slate-500 max-w-sm mb-4 leading-relaxed">
              Evolve, Engage & Scale is the official skill-development-to-opportunity ecosystem by{' '}
              <strong className="text-slate-300 font-medium">Provolution Technologies Pvt. Ltd.</strong>
            </p>
            <p className="text-[11px] text-slate-600">
              © {new Date().getFullYear()} Provolution Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>

          {/* Evolve */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs tracking-wider uppercase">EVOLVE</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/fields" className="hover:text-slate-200 transition-colors">
                  Field Discovery
                </Link>
              </li>
              <li>
                <Link href="/evolve/learning" className="hover:text-slate-200 transition-colors">
                  Learning Trackers
                </Link>
              </li>
              <li>
                <Link href="/evolve/fitness" className="hover:text-slate-200 transition-colors">
                  Fitness Workspace
                </Link>
              </li>
              <li>
                <Link href="/evolve/projects" className="hover:text-slate-200 transition-colors">
                  Project Portfolios
                </Link>
              </li>
            </ul>
          </div>

          {/* Engage */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs tracking-wider uppercase">ENGAGE</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/engage/feed" className="hover:text-slate-200 transition-colors">
                  Field Feeds
                </Link>
              </li>
              <li>
                <Link href="/engage/communities" className="hover:text-slate-200 transition-colors">
                  Communities
                </Link>
              </li>
              <li>
                <Link href="/engage/showcase" className="hover:text-slate-200 transition-colors">
                  Peer Showcase
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-slate-200 transition-colors">
                  Editorial Articles
                </Link>
              </li>
            </ul>
          </div>

          {/* Scale & Legal */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs tracking-wider uppercase">SCALE & LEGAL</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/scale/opportunities" className="hover:text-slate-200 transition-colors">
                  Provolution Opportunities
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-slate-200 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-slate-200 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/advertising-disclosure" className="hover:text-slate-200 transition-colors">
                  Ad Disclosure
                </Link>
              </li>
              <li>
                <Link href="/legal/community-guidelines" className="hover:text-slate-200 transition-colors">
                  Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

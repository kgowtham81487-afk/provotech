import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdSenseScript } from '@/components/monetization/AdSenseScript';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ees.provolution.com'),
  title: {
    default: 'EES — Evolve, Engage & Scale | Provolution Technologies',
    template: '%s | EES Platform',
  },
  description:
    'EES is an integrated skill-development-to-opportunity ecosystem connecting intentional learning (EVOLVE), peer community collaboration (ENGAGE), and real-world commercial value (SCALE).',
  keywords: [
    'Skill Development',
    'Provolution Technologies',
    'Tech Portfolios',
    'Freelance Opportunities',
    'Peer Learning',
    'Developer Roadmap',
    'Fitness Progression',
  ],
  authors: [{ name: 'Provolution Technologies Pvt. Ltd.' }],
  openGraph: {
    title: 'EES — Evolve, Engage & Scale',
    description:
      'Master high-value fields, collaborate with peers, and access verified Provolution Technologies commercial opportunities.',
    siteName: 'EES Platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <AdSenseScript />
      </head>
      <body className="min-h-screen flex flex-col bg-background font-sans text-slate-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

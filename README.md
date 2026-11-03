# EES — Evolve, Engage & Scale

> **Official Enterprise Skill-Development-to-Opportunity Ecosystem**  
> Developed for **Provolution Technologies Pvt. Ltd.**  
> Greenfield Architecture & Engineering Implementation (Evolution of SRE platform)

---

## 1. Executive Summary & Product Vision

**EES (Evolve, Engage & Scale)** is an integrated enterprise platform designed to close the chasm between personal skill acquisition, social peer learning, and real economic value generation. Unlike generic habit trackers, shallow task managers, or detached social networks, EES is purpose-built as a **skill-development-to-opportunity pipeline**.

```
   ┌──────────────────────────────────────────────────────────────┐
   │                       EES ECOSYSTEM                          │
   │                                                              │
   │  ┌──────────────┐      ┌──────────────┐      ┌────────────┐  │
   │  │    EVOLVE    │ ───> │    ENGAGE    │ ───> │   SCALE    │  │
   │  │ Choose &     │      │ Connect,     │      │ Monetize & │  │
   │  │ Master Skills│      │ Collaborate  │      │ Opportunities  │
   │  └──────────────┘      └──────────────┘      └────────────┘  │
   └──────────────────────────────────────────────────────────────┘
```

### Core Philosophy: EVOLVE → ENGAGE → SCALE
1. **EVOLVE (Choose your direction and develop yourself):**
   - Users commit to **1 or 2 primary focus fields** (e.g., Software Development, AI/ML, Cybersecurity, Cloud/DevOps, Fitness & Physical Development, Content Creation, UI/UX Design, etc.).
   - Follow systematic progression: *Discover → Learn → Practice → Build → Demonstrate → Improve*.
   - Modular tracking: Specialized modules for technical labs, coding projects, physical workouts, and content calendars.
   - Verified project portfolio and milestone completions.

2. **ENGAGE (Apply skills, connect, and learn together):**
   - Social networking contextualized by field of mastery.
   - Algorithmic and chronological field-based feeds, following feeds, and discovery feeds.
   - Communities, technical discussions, peer code/project reviews, collaboration invites.
   - Real-time 1-on-1 direct messaging and persistent notifications.
   - Authentic credibility profiles reflecting actual project evidence, not hollow badges.

3. **SCALE (Convert development into opportunities and income):**
   - **Provolution Technologies Opportunities:** Paid freelance projects, technical assignments, internships, content creation contracts, and research bounties.
   - **Google AdSense & Content Monetization Architecture:** Editorial review workflow (`Draft → Review → Approved → Published`), `ads.txt` integration, clean SSR/SSG SEO, AdSense-ready responsive slots.
   - **Skill-Based Transparent Eligibility:** Fair evaluation based on demonstrated repositories, project submissions, and verified human review—not unearned XP.
   - **Scale Dashboard:** Real, un-fabricated financial ledgers, assignment status, deliverable submissions, and compensation tracking.

---

## 2. Technical Stack Overview

| Layer | Technologies |
|---|---|
| **Monorepo** | `pnpm` Workspaces, TypeScript 5.x |
| **Frontend (`apps/web`)** | Next.js 15+ (App Router), React 19, Tailwind CSS, Radix UI, Lucide React, TanStack Query, React Hook Form, Zod, Recharts |
| **Backend (`apps/api`)** | Node.js, NestJS (Modular Monolith), REST API, OpenAPI / Swagger, Prisma ORM, Socket.IO |
| **Database** | PostgreSQL (Render PostgreSQL / Supabase / Neon compatible) |
| **Shared (`packages/shared`)** | Shared TypeScript interfaces, Zod validation schemas, taxonomy constants, DTOs |
| **Infrastructure & CI/CD** | Vercel (Frontend), Render (Backend Web Service), GitHub Actions, UptimeRobot |
| **Monetization & SEO** | Google AdSense official integration, dynamic `sitemap.xml`, `robots.txt`, `ads.txt`, Schema.org JSON-LD |

---

## 3. Monorepo Structure

```
ees-platform/
├── apps/
│   ├── web/                     # Next.js 15+ Frontend Web Application
│   │   ├── app/                 # Next.js App Router (Evolve, Engage, Scale, Admin, Blog, Legal)
│   │   ├── components/          # Reusable UI & stage-specific component system
│   │   ├── features/            # Feature-scoped logic (auth, evolve, engage, scale)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities, API client, auth helpers
│   │   └── public/              # Static assets, favicon, ads.txt
│   └── api/                     # NestJS Backend Modular Monolith
│       ├── src/
│       │   ├── common/          # Filters, guards, interceptors, decorators
│       │   ├── config/          # Environment configuration & validation
│       │   ├── database/        # Prisma service & database module
│       │   ├── health/          # Liveness & readiness probes (/health/live, /health/ready)
│       │   └── modules/         # Domain modules (auth, users, fields, evolve, engage, scale, etc.)
│       └── test/                # Supertest e2e tests
├── packages/
│   └── shared/                  # Shared types, Zod schemas, permissions, DTOs
├── prisma/
│   ├── schema.prisma            # Comprehensive relational PostgreSQL database schema
│   └── seed.ts                  # Idempotent database seed script
├── docs/                        # Complete technical and architectural documentation
└── .github/
    └── workflows/ci.yml         # Continuous integration pipeline
```

---

## 4. Getting Started

### Prerequisites
- Node.js `>= 20.0.0` (Tested on Node v25.9.0)
- `pnpm` `>= 9.0.0` (Installed: v12.16.1)
- PostgreSQL database instance

### Installation
```bash
# Clone and enter directory
cd ees-platform

# Install dependencies across all workspaces
pnpm install

# Configure environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma Client & Run Migrations
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development servers (frontend + backend)
pnpm dev
```

---

## 5. Deployment Architecture

- **Frontend:** Hosted on Vercel (`apps/web`) with edge optimizations, SSR/SSG for public educational content, dynamic OG tags, and official AdSense script integration.
- **Backend:** Hosted on Render (`apps/api`) as an independent Node.js Web Service bound to `0.0.0.0` with `process.env.PORT`.
- **Health & Monitoring:**
  - `GET /health/live`: Fast, lightweight HTTP 200 liveness probe for UptimeRobot monitoring (5-min interval to reduce cold starts).
  - `GET /health/ready`: Deep health verification testing PostgreSQL database connectivity and critical services.

---

## 6. Provolution Technologies Pvt. Ltd. Compliance
All rights reserved. This software is proprietary and developed under strict engineering standards, avoiding fabricated data, hardcoded credentials, mock metrics, and unverified financial promises.

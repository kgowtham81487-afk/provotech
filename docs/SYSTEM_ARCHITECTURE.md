# System Architecture Document — EES

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** ARCH-2026-v1  

---

## 1. High-Level Architecture

EES is engineered as a clean, modular TypeScript-first monorepo leveraging independent deployment targets for optimal scalability, developer velocity, and isolation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                CLIENTS                                 │
│  Desktop Browser  │  Tablet Web App  │  Mobile Web App (PWA)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                    EDGE & CDN LAYER (Vercel)                           │
│  Next.js 15+ App Router                                                │
│  - Public Pages (Landing, Blog, Legal, Resources) [SSG / ISR]          │
│  - Dynamic Protected Workspaces (Evolve, Engage, Scale) [Client & SSR] │
│  - AdSense Script Integration & ads.txt Endpoint                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ API Requests (/api/v1/*)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICE (Render.com)                         │
│  NestJS Modular Monolith API                                           │
│  - HTTP REST Controllers & OpenAPI / Swagger Docs                      │
│  - Guards (JWT Auth, RBAC, Rate Limiting, Ownership)                   │
│  - Domain Modules: Auth, Evolve, Engage, Scale, Gamification, Admin    │
│  - Real-time Gateway (Socket.IO for Chat & Live Notifications)         │
│  - Health Probes: /health/live (Liveness), /health/ready (Readiness)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       DATA & STORAGE LAYER                             │
│  - Render PostgreSQL / Managed RDS (Relational Data & Transactions)    │
│  - Prisma ORM (Type-Safe Query Builder & Migrations)                   │
│  - S3-Compatible Storage (User Avatars, Project Media, Post Images)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo & Package Architecture

The monorepo uses `pnpm` workspaces for dependency isolation and build sharing:

```
ees-platform/
├── apps/
│   ├── web/                     # Frontend Next.js 15+ application
│   └── api/                     # Backend NestJS REST API
├── packages/
│   └── shared/                  # Common TypeScript interfaces, Zod schemas, constants
├── prisma/                      # Centralized Database schema & seeders
```

### Dependency Graph:
- `apps/web` depends on `packages/shared`
- `apps/api` depends on `packages/shared` and `prisma`
- `packages/shared` has zero runtime dependencies on server or browser internals (pure isomorphic TypeScript)

---

## 3. Backend Module Hierarchy (Modular Monolith)

The backend avoids premature microservices complexity while maintaining clean separation of concerns through NestJS feature modules:

```
src/
├── app.module.ts
├── common/
│   ├── decorators/             # @CurrentUser(), @Roles(), @Public()
│   ├── filters/                # GlobalHttpExceptionFilter
│   ├── guards/                 # JwtAuthGuard, RolesGuard, RateLimitGuard
│   ├── interceptors/           # LoggingInterceptor, TransformInterceptor
│   └── pipes/                  # ZodValidationPipe
├── config/                     # Environment configuration & validation
├── database/                   # PrismaService, PrismaModule
├── health/                     # HealthModule (Terminus / Live & Ready checks)
└── modules/
    ├── auth/                   # Registration, Login, Token Refresh, Password Reset
    ├── users/                  # User profile, settings, account management
    ├── fields/                 # Taxonomy engine (Fields, Categories, Skills)
    ├── evolve/
    │   ├── learning/           # Goals, learning paths, study sessions, notes
    │   ├── fitness/            # Workouts, exercise library, set logs, PRs
    │   ├── content/            # Idea pipelines, drafts, publishing calendar
    │   └── projects/           # Project portfolio, evidence uploads, GitHub links
    ├── engage/
    │   ├── feed/               # Personalized, Field-specific, Following feeds
    │   ├── posts/              # Post CRUD, media attachments, code snippets
    │   ├── interactions/       # Likes, comments, bookmarks, reposts
    │   ├── communities/        # Community creation, membership, moderation
    │   ├── messaging/          # 1-to-1 chat, conversation history, real-time sync
    │   └── notifications/      # Real-time event notifications & preferences
    ├── scale/
    │   ├── opportunities/      # Provolution opportunity catalog & listings
    │   ├── applications/       # Submission, portfolio attachment, candidate vetting
    │   ├── assignments/        # Deliverable management, contributor milestones
    │   └── monetization/       # AdSense configs, payment records, Scale ledger
    ├── gamification/           # XP engine, levels, streaks, achievements, quests
    ├── ai/                     # AI assistant abstraction (modular LLM adapter)
    └── admin/                  # Platform moderation, audit logging, analytics
```

---

## 4. Scalability, Caching & Performance Considerations

1. **Read-Heavy Feed Optimization:**
   - Database queries use composite indexing on `[fieldId, createdAt]` and `[authorId, createdAt]`.
   - Cursor-based pagination (`take`, `skip`, or `cursor: { id }`) to eliminate deep-offset performance cliffs.
2. **Asset Delivery:**
   - Client images served via Next.js `<Image>` component with WebP/AVIF automatic transcoding and CDN caching.
3. **Graceful Degradation:**
   - In case of background queue delays, user interactions (e.g. XP calculation or email notifications) run asynchronously via event emitters or message queues without blocking API response times.

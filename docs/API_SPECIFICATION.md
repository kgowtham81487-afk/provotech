# API Specification Document — EES REST API

**Organization:** Provolution Technologies Pvt. Ltd.  
**Service:** EES Modular Monolith API  
**Base URL:** `/api/v1`  
**API Documentation:** `GET /docs` (Swagger / OpenAPI 3.0)  

---

## 1. Global Conventions

- **Data Serialization:** Standard JSON (`application/json; charset=utf-8`).
- **Standard Response Envelope:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  },
  "timestamp": "2026-11-03T08:00:00.000Z"
}
```
- **Error Response Envelope:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Field 'username' is already taken.",
    "details": []
  },
  "timestamp": "2026-11-03T08:00:00.000Z"
}
```

---

## 2. API Endpoints Catalog

### 2.1 Health & Diagnostics
- `GET /health/live` — Returns `{ status: "ok" }`. Fast HTTP 200 liveness probe for UptimeRobot.
- `GET /health/ready` — Deep readiness probe verifying PostgreSQL connection and memory limits.

### 2.2 Authentication & Profile (`/api/v1/auth`, `/api/v1/users`)
- `POST /auth/register` — Create account.
- `POST /auth/login` — Authenticate and receive JWT access token.
- `POST /auth/refresh` — Refresh expired token.
- `POST /auth/logout` — Revoke session.
- `GET /users/me` — Retrieve active authenticated user profile, roles, and selected fields.
- `PATCH /users/me` — Update profile bio, avatar, and social links.
- `GET /users/:username` — Public profile including public projects, skills, and posts.

### 2.3 Evolve Stage Endpoints (`/api/v1/fields`, `/api/v1/evolve/*`)
- `GET /fields` — List all active approved fields with sub-categories.
- `POST /fields/select` — Set user's primary (and optional secondary) field.
- `GET /evolve/dashboard` — Complete aggregated dashboard data for active user.
- `GET /evolve/learning/sessions` & `POST /evolve/learning/sessions` — Record study session.
- `GET /evolve/fitness/workouts` & `POST /evolve/fitness/workouts` — Log workouts and sets.
- `GET /evolve/content/pipeline` & `POST /evolve/content/ideas` — Content creation workspace.
- `GET /evolve/projects` & `POST /evolve/projects` — Portfolio project management.

### 2.4 Engage Stage Endpoints (`/api/v1/social/*`)
- `GET /social/feed` — Feed query (`?type=for-you|field|following|showcase&fieldId=...`).
- `POST /social/posts` — Create post with text, tags, and media.
- `POST /social/posts/:id/like` — Toggle like.
- `POST /social/posts/:id/comments` — Add comment or reply.
- `GET /social/communities` & `POST /social/communities` — Community management.
- `GET /social/messages` & `POST /social/messages` — 1-on-1 private messaging.
- `GET /social/notifications` — Notification stream.

### 2.5 Scale Stage Endpoints (`/api/v1/scale/*`)
- `GET /scale/opportunities` — Browse Provolution and partner opportunities.
- `GET /scale/opportunities/:id` — Detail view with requirements and compensation terms.
- `POST /scale/opportunities/:id/apply` — Submit application with portfolio attachments.
- `GET /scale/my-applications` — Track candidate application review status.
- `GET /scale/assignments` — Contributor active assignments and deliverables.
- `POST /scale/assignments/:id/deliverable` — Submit deliverable for review.
- `GET /scale/ledger` — Verified financial transactions and compensation records.

### 2.6 Administration Endpoints (`/api/v1/admin/*`)
- `GET /admin/users` — User management and role assignment.
- `POST /admin/fields` — Add or modify taxonomy fields and skill categories.
- `POST /admin/opportunities` — Publish new commercial opportunity.
- `PATCH /admin/applications/:id` — Review, shortlist, select, or reject applicant.
- `GET /admin/audit-logs` — Immutable audit logs of administrative actions.

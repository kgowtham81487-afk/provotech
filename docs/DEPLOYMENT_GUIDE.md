# Deployment Guide — EES Platform
**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Repository:** `kgowtham81487-afk/provotech`  
**Classification:** DevOps & Production Runbook  

---

## 1. Production Architecture Overview

The EES ecosystem is engineered for production deployment across:
- **Backend API (`apps/api`):** Deployed to **Render** as a Node.js Web Service (NestJS).
- **Frontend Web App (`apps/web`):** Deployed to **Render** (or Vercel) as a Next.js Node Web Service.
- **Database:** **Neon PostgreSQL** serverless database with connection pooling and SSL.
- **Monitoring & Probes:** Render native health check configured to `/health/live` (HTTP 200).

---

## 2. Environment Variables Checklist

### 2.1 Backend API (`apps/api` on Render)
Configure these environment variables in your Render Web Service dashboard:

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port (Render provides this automatically) | `10000` |
| `HOST` | Bind host address | `0.0.0.0` |
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled or direct with SSL) | `postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require` |
| `JWT_SECRET` | Secret key for signing 15m access tokens (min 32 chars) | `provolution-ees-jwt-prod-secret-min-32-chars-2026` |
| `JWT_REFRESH_SECRET` | Secret key for 7d refresh token authentication | `provolution-ees-refresh-prod-secret-min-32-chars-2026` |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins | `https://ees-frontend.onrender.com,http://localhost:3000` |
| `INITIAL_ADMIN_EMAIL` | Super Admin initial bootstrap account email | `gowthamk81487@gmail.com` |
| `INITIAL_ADMIN_PASSWORD` | Super Admin initial bootstrap account password | `Gowtham@123` |
| `AI_PROVIDER` | AI acceleration provider | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key for roadmaps and brainstorms | `AIzaSy...` |

> [!NOTE]
> The backend CORS handler automatically permits all origins ending with `.onrender.com`, `.provolution.com`, `.provolution.in`, and `.vercel.app`.

---

### 2.2 Frontend Web App (`apps/web` on Render / Vercel)

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `NODE_ENV` | Environment mode | `production` |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL of the frontend | `https://ees-frontend.onrender.com` |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API (with or without `/api/v1`) | `https://ees-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Google AdSense publisher account ID | `ca-pub-XXXXXXXXXXXXXXXX` |

> [!TIP]
> The client-side API client automatically formats `NEXT_PUBLIC_API_URL`. Whether you supply `https://ees-api.onrender.com` or `https://ees-api.onrender.com/api/v1`, the client cleanly normalizes the path and avoids 404 prefix errors.

---

## 3. Render Deployment Runbook

### 3.1 Backend Service (Render Web Service)
1. **New Web Service** -> Connect GitHub repo `kgowtham81487-afk/provotech`.
2. **Root Directory:** Leave empty (`.`)
3. **Environment:** Node
4. **Build Command:**
   ```bash
   pnpm install && pnpm db:generate && pnpm --filter @ees/shared build && pnpm --filter @ees/api build
   ```
5. **Start Command:**
   ```bash
   node apps/api/dist/src/main.js
   ```
6. **Health Check Path:** `/health/live`
7. **Database Migrations & Initial Seeding:**
   From the Render Shell tab (or post-deploy job):
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

---

### 3.2 Frontend Service (Render Web Service)
1. **New Web Service** -> Connect GitHub repo `kgowtham81487-afk/provotech`.
2. **Root Directory:** Leave empty (`.`)
3. **Environment:** Node
4. **Build Command:**
   ```bash
   pnpm install && pnpm --filter @ees/shared build && pnpm --filter @ees/web build
   ```
5. **Start Command:**
   ```bash
   pnpm --filter @ees/web start
   ```
6. Configure `NEXT_PUBLIC_API_URL` pointing to your Backend Service URL.

---

## 4. Verification & Post-Deploy Health Check

1. **Liveness Probe:**
   ```bash
   curl -I https://<your-backend>.onrender.com/health/live
   # Expected: HTTP/1.1 200 OK
   ```
2. **Taxonomy & Fields Probe:**
   ```bash
   curl https://<your-backend>.onrender.com/api/v1/fields
   # Expected: JSON array of 6 approved fields
   ```
3. **Super Admin Access:**
   - Browse to `https://<your-frontend>.onrender.com/login`
   - Log in with `gowthamk81487@gmail.com` and `Gowtham@123`
   - Verify redirection to `/admin` with the `Admin [SUPER]` badge active.

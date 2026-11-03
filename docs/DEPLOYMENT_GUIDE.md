# Deployment Guide — EES Platform

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** DEPLOY-GUIDE-2026-v1  

---

## 1. Hosting Architecture Overview

- **Frontend Application (`apps/web`):** Deployed to **Vercel**.
- **Backend API (`apps/api`):** Deployed to **Render** as a Node.js Web Service.
- **Database:** **Render PostgreSQL** (or Managed AWS RDS / Supabase).
- **Monitoring & Health Checks:** **UptimeRobot** monitoring backend probes.

---

## 2. Environment Variables Configuration

### 2.1 Backend (`apps/api/.env`)
```bash
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@render-host:5432/ees_prod?sslmode=require
JWT_SECRET=super-secure-production-jwt-secret-replace-me
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=super-secure-production-refresh-secret-replace-me
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=https://ees.provolution.com,https://ees-platform.vercel.app
AI_PROVIDER=gemini # or openai / mock
GEMINI_API_KEY=your-gemini-api-key
```

### 2.2 Frontend (`apps/web/.env.production`)
```bash
NEXT_PUBLIC_APP_URL=https://ees.provolution.com
NEXT_PUBLIC_API_URL=https://ees-api.onrender.com/api/v1
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX # Provided by Provolution owner
```

---

## 3. Deployment Instructions

### 3.1 Backend Deployment on Render
1. Create a **New Web Service** connected to your GitHub repository.
2. Set Root Directory: `.`
3. Build Command: `pnpm install && pnpm build:api && pnpm db:generate`
4. Start Command: `node apps/api/dist/src/main.js`
5. Configure Environment Variables matching section 2.1.
6. Verify Health Check Endpoint path in Render: `/health/live`.

### 3.2 Frontend Deployment on Vercel
1. Import repository into Vercel.
2. Select Root Directory: `apps/web`.
3. Framework Preset: `Next.js`.
4. Build Command: `pnpm build`.
5. Configure Environment Variables matching section 2.2.
6. Configure Custom Domain: `ees.provolution.com`.

### 3.3 UptimeRobot Setup
1. Create a new monitor in UptimeRobot:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `EES Production Backend Liveness`
   - **URL:** `https://YOUR-RENDER-BACKEND.onrender.com/health/live`
   - **Monitoring Interval:** 5 minutes
2. *Note:* The 5-minute interval helps keep Render services responsive and prevents idle spin-downs while generating zero computational strain.

---

## 4. Verification Checklist
- [ ] `GET https://YOUR-RENDER-BACKEND/health/live` returns HTTP 200 with `{ "status": "ok" }`.
- [ ] `GET https://YOUR-RENDER-BACKEND/health/ready` confirms database connectivity.
- [ ] `GET https://YOUR-DOMAIN/ads.txt` serves the valid publisher file.
- [ ] Dynamic sitemap accessible at `https://YOUR-DOMAIN/sitemap.xml`.

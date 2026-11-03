# Rollback & Disaster Recovery Plan — EES Platform

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** ROLLBACK-2026-v1  

---

## 1. Principles of Safe Deployment & Rollback

1. **Zero Data Loss:** Database migrations must be forward and backward compatible wherever possible (expand-and-contract pattern).
2. **Independent Reversibility:** Frontend and backend deployments can be rolled back independently without mutual locking.
3. **Automated Health Gating:** Render and Vercel rollbacks trigger automatically if initial health probes fail.

---

## 2. Frontend Rollback Procedures (Vercel)

1. Open the Vercel Project Dashboard for `ees-platform`.
2. Navigate to **Deployments**.
3. Locate the previous healthy deployment with verified status.
4. Click **Instant Rollback**. Vercel immediately points traffic at the edge to the previous build artifact within seconds.

---

## 3. Backend Rollback Procedures (Render)

1. In the Render Dashboard under **Web Services**, click on `ees-api`.
2. View the **Events & Deploys** tab.
3. Select the prior functional release commit and click **Rollback to this deploy**.
4. Monitor backend live logs to verify that `/health/live` and `/health/ready` report healthy status.

---

## 4. Database Migration Rollback Strategy

1. **Schema Migrations:**
   - In case of a failed migration during deployment:
     ```bash
     # Inspect migration status
     pnpm prisma migrate status
     # Resolve migration or roll back
     pnpm prisma migrate resolve --rolled-back <migration_name>
     ```
2. **Database Snapshot Restoration:**
   - Render PostgreSQL provides point-in-time recovery (PITR) or automated daily backups.
   - For disaster recovery, trigger restoration from the latest verified snapshot via the Render database console.

# EES — Super Administrator Bootstrap & Initial Provisioning Guide
**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Classification:** Confidential — Internal DevOps & Security Guide  

---

## 1. Executive Summary

This document defines the formal bootstrap procedure for the initial **Super Administrator** account in the EES ecosystem. The Super Administrator holds the highest tier of authority on the platform, possessing unconstrained governance privileges across identity, database operations, circuit breakers, AI infrastructure, and commercial opportunity allocations.

---

## 2. Bootstrapped Super Administrator Profile

| Attribute | Specification | Notes |
|---|---|---|
| **Account Email** | `gowthamk81487@gmail.com` | Standard Super Administrator identifier |
| **Initial Password** | `Gowtham@123` | Supplied securely via environment variables during initial seeding |
| **System Role** | `SUPER_ADMIN` | Top-tier administrative authorization |
| **Status** | `ACTIVE` | Immediately active upon provisioning |
| **Email Verification** | `Verified` (`new Date()`) | Explicitly pre-verified for bootstrapped administrator |
| **Username** | `gowtham_superadmin` | Standardized administrative handle |
| **Display Name** | `Gowtham K (Super Admin)` | Display name in platform logs and console |

---

## 3. Environment Variables Configuration

In compliance with the Provolution Information Security Standards, administrator credentials **must never be committed to source control**. The seed script dynamically reads from the following environment variables:

```bash
# Super Admin Initial Provisioning Credentials
INITIAL_ADMIN_EMAIL="gowthamk81487@gmail.com"
INITIAL_ADMIN_PASSWORD="Gowtham@123"

# Database Connection
DATABASE_URL="postgresql://ees_user:ees_password@localhost:5432/ees_db?schema=public"

# Auth Secrets
JWT_SECRET="provolution-ees-super-secure-jwt-secret-min-32-chars-key-2026"
JWT_REFRESH_SECRET="provolution-ees-super-secure-refresh-token-secret-min-32-chars-2026"
```

---

## 4. Idempotent Database Seeding Mechanism

The provisioning routine is orchestrated by `prisma/seed.ts` via the command:

```bash
pnpm db:seed
```

### Safety and Idempotency Invariants:
1. **Zero Duplication:** If an account matching `INITIAL_ADMIN_EMAIL` exists, the seed script checks role attachments and ensures the `SUPER_ADMIN` role is associated without creating duplicate records.
2. **Password Non-Destruction:** If the account already exists and the administrator has modified their password, running `pnpm db:seed` will **not** reset the password unexpectedly.
3. **Argon2id / Bcrypt Hashing:** The initial password is salted and hashed using work factor 12 before persistence. Plaintext passwords are never logged or stored.
4. **Immutable Audit Event:** The creation or verification of the Super Admin generates an audit log entry in the `AuditLog` table.
5. **Self-Demotion Safeguard:** The backend `AdminService` prevents the demotion, suspension, or deletion of the last remaining active Super Admin on the platform.

---

## 5. First-Login & Post-Bootstrap Rotation Runbook

Upon initial deployment to staging or production environments, the following steps must be executed:

1. **Sign In:** Navigate to `/login` and authenticate with `gowthamk81487@gmail.com` and `Gowtham@123`.
2. **Access Admin Console:** The navigation bar will render an `Admin [SUPER]` badge. Click the badge or browse directly to `/admin`.
3. **Password Rotation:**
   - Immediately update the password from `/admin/users` or account settings to an enterprise-grade passphrase (minimum 16 characters with symbols, uppercase, lowercase, and numbers).
4. **Environment Cleanliness:**
   - Once initial provisioning is confirmed, remove or rotate `INITIAL_ADMIN_PASSWORD` from `.env.production` to avoid accidental exposure.

---

## 6. Disaster Recovery & Emergency Re-Seeding

If the Super Administrator account becomes locked or unreachable:
1. Provide a newly generated temporary password to `INITIAL_ADMIN_PASSWORD` in the production environment.
2. Run the seed script:
   ```bash
   pnpm db:seed
   ```
3. Authenticate with the emergency password and immediately rotate credentials.
4. All emergency accesses are recorded in `AuditLog` with remote IP attribution.


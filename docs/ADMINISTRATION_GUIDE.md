# EES — Platform Administration & Operations Runbook
**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Classification:** Operational Guide for Platform Administrators  

---

## 1. Overview

The EES Administration Suite (`/admin`) serves as the mission control center for Provolution Technologies. It gives administrators fine-grained control over identity lifecycle, circuit breakers, opportunity curation, database hygiene, and ecosystem compliance.

---

## 2. Navigating the Admin Console

Access the console by clicking the **Admin** shield in the navigation bar or visiting `https://platform.ees.provolution.in/admin`.

### Dashboard Navigation:
- **📊 Overview (`/admin`):** High-level telemetry covering active user counts, Evolve study hours, Engage posts, and Scale contract payouts.
- **👥 User Directory (`/admin/users`):** Account provisioning, role modification, suspension, soft-deletion, and single-use reset links.
- **🤖 AI Management (`/admin/ai`):** Google Gemini model selection, token throttle limits, temperature configuration, and live diagnostic prompt runner.
- **🚩 Feature Controls (`/admin/feature-flags`):** Dynamic circuit breakers to enable or disable platform capabilities in real time without code deployment.
- **💾 Database & Maintenance (`/admin/database`):** Live PostgreSQL table row metrics and session cleanup triggers.
- **💼 Opportunities & Vetting (`/admin/opportunities`):** Post client contracts and review candidate proposals (Shortlist, Select, Reject).
- **📜 Platform Audit Logs (`/admin/audit-logs`):** Security audit log viewer with actor, IP address, and payload inspection.
- **⚙️ Platform Settings (`/admin/configs`):** System configurations, AdSense identifiers, and currency settings.

---

## 3. Core Administrative Procedures

### 3.1 Provisioning a New User Account
1. Open `/admin/users` and click **"➕ Provision New User"**.
2. Enter the full name, corporate or candidate email, initial password, and assign their starting role.
3. Upon clicking submit, the user account is created with pre-verified email and an audit log event is generated.

### 3.2 Generating a Single-Use Password Reset Link
If a user cannot access their email or requires expedited account recovery:
1. Locate the user in `/admin/users` using the search bar.
2. Click **"Reset Link"**.
3. The backend generates a cryptographically secure random token, stores its SHA-256 hash in `PasswordResetToken`, and returns the single-use recovery link.
4. Click **"Copy Link"** and securely transmit it to the user. The link automatically expires in 1 hour.

### 3.3 Toggling Circuit Breakers (Feature Flags)
In the event of an outage, third-party provider failure, or scheduled maintenance:
1. Navigate to `/admin/feature-flags`.
2. Locate the flag (e.g. `FEATURE_AI_ROADMAPS` or `FEATURE_DIRECT_MESSAGES`).
3. Toggle the switch. The state immediately flips in the database and API requests attempting to reach that endpoint receive HTTP 403 (`FEATURE_DISABLED`).

### 3.4 Opportunity Publishing & Candidate Vetting
1. Under `/admin/opportunities`, click **"➕ Post New Opportunity"**.
2. Define the title, compensation structure (e.g. Fixed Project ₹35,000), scope, and taxonomy field.
3. When candidates apply from the `/scale` marketplace, switch to **"Review Candidates"**.
4. Review the applicant's proposal, portfolio URLs, and previous XP.
5. Click **"Vetting Review"** and select:
   - `SHORTLISTED`: Notify candidate they passed initial screening.
   - `SELECTED`: Automatically generates an active `Assignment` record with milestone tracking.
   - `REJECTED`: Declines the application with feedback notes.

### 3.5 Database Maintenance & Expired Token Purging
1. Open `/admin/database`.
2. Inspect table row counts across all 38+ entities.
3. Click **"Run Database Cleanup"** to purge expired sessions and stale password reset tokens, maintaining query efficiency and database cleanliness.


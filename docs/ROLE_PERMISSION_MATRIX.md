# EES — Role-Based Access Control (RBAC) Matrix
**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Classification:** Technical Architecture Specification  

---

## 1. System Role Hierarchy

The EES platform enforces a granular Role-Based Access Control model comprising 7 distinct roles:

```
[ SUPER_ADMIN ]
       │
       ▼
   [ ADMIN ]
       │
       ├───────────────────┬──────────────────────┬──────────────────┐
       ▼                   ▼                      ▼                  ▼
[ MODERATOR ]    [ OPPORTUNITY_MANAGER ]   [ CONTENT_EDITOR ]    [ SUPPORT ]
       │                   │                      │                  │
       └───────────────────┴──────────────────────┴──────────────────┘
                                   │
                                   ▼
                           [ STANDARD_USER ]
```

---

## 2. Granular Permissions Breakdown

| Capability / API Domain | SUPER_ADMIN | ADMIN | MODERATOR | OPPORTUNITY_MGR | CONTENT_EDITOR | SUPPORT | STANDARD_USER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Access Admin Console (`/admin`)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Platform Analytics & Stats** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Search & Inspect User Directory** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Directly Provision Users with Roles** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Change User Roles** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Suspend / Reactivate User Accounts** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Generate Expiring Password Reset Links** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Soft Delete / Restore Accounts** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Toggle Runtime Feature Flags** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Update Platform Configurations** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inspect PostgreSQL Entity Row Counts** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Trigger Database Maintenance & Session Purge** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create Provolution Opportunities** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Review & Award Opportunity Applications** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Approve Assignment Deliverables & Payouts** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Moderate Posts, Comments & Communities** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Publish Official Platform Blogs & Docs** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Read Immutable Platform Audit Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Participate in Evolve, Engage, Scale** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. Self-Demotion & Orphan Prevention Invariants

The platform architecture enforces critical invariants in `AdminService.ensureNotLastSuperAdmin`:
- A `SUPER_ADMIN` cannot demote their own account if they are the sole active Super Admin in the system.
- A `SUPER_ADMIN` account cannot be deleted or suspended if `totalSuperAdmins <= 1`.
- Standard user registration endpoints (`POST /auth/register`) strictly assign `STANDARD_USER` and reject any payload attempting to assign elevated roles.

---

## 4. Enforcement Layer

RBAC is enforced on both backend and frontend layers:
- **Backend Guard:** `RolesGuard` checking metadata injected by `@Roles(...)` combined with `JwtAuthGuard`.
- **Frontend Guard:** `AdminLayout` checking `isAdmin` and `isSuperAdmin` flags from `useAuth()`. Unauthorized visits immediately redirect or show the secure Access Denied dialog.

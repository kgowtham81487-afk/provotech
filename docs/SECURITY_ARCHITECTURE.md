# Security Architecture Document — EES

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** SEC-ARCH-2026-v1  

---

## 1. Threat Model & Security Posture

EES manages personal identity, intellectual property, user communications, and financial compensation records. Our security architecture adheres to the principle of least privilege, defense-in-depth, and zero-trust verification.

---

## 2. Authentication & Session Security

1. **Password Hashing:**
   - Salted `bcrypt` (work factor 12) or `Argon2id`.
   - Raw passwords never logged, stored in cache, or returned in serialized user responses.
2. **Token Strategy:**
   - **Access Token:** Short-lived JWT (15-minute expiration) containing user ID and active role claims.
   - **Refresh Token:** Cryptographically random 256-bit token stored hashed in PostgreSQL with single-use rotation. Transmitted strictly via `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
3. **Session Revocation:**
   - Instant token invalidation upon password reset or admin ban via token versioning or database revocation list.

---

## 3. Authorization & Role-Based Access Control (RBAC)

Hierarchical roles enforced server-side via NestJS `@Roles()` decorators and `RolesGuard`:

| Role | Access Scope |
|---|---|
| `SUPER_ADMIN` | Full platform control, environment variables, administrative user elevation. |
| `ADMIN` | Taxonomy modification, user management, global announcement publishing. |
| `OPPORTUNITY_MANAGER` | Create Provolution opportunities, review candidates, approve deliverables, record disbursements. |
| `MODERATOR` | Flag reviews, comment/post deletions, community warning issuances. |
| `CONTENT_EDITOR` | Manage platform public guides, blogs, and AdSense editorial approvals. |
| `USER` | Standard participant in Evolve, Engage, and Scale stages. |

*Insecure Direct Object Reference (IDOR) Prevention:*
Every mutation or private read verifies tenant ownership:
```typescript
if (existingProject.userId !== currentUser.id && !currentUser.roles.includes('ADMIN')) {
  throw new ForbiddenException('You do not have permission to modify this project.');
}
```

---

## 4. Input Validation, Data Sanitization & Network Protection

1. **Schema Validation:**
   - 100% of incoming payloads validated strictly using Zod or `class-validator` with `whitelist: true, forbidNonWhitelisted: true`.
2. **SQL Injection Protection:**
   - Complete abstraction through Prisma ORM using parameterized queries. Raw SQL strictly prohibited without security audit.
3. **Cross-Site Scripting (XSS) Prevention:**
   - React handles automatic escaping of user text in HTML. Markdown rendered with DOMPurify sanitization.
4. **CORS Policy:**
   - Explicit whitelist restricting API access strictly to authorized frontend origins (e.g. `https://ees.provolution.com` and local dev).
5. **Rate Limiting:**
   - Global rate limiter (100 req/min for general routes, 5 req/min for sensitive auth endpoints).

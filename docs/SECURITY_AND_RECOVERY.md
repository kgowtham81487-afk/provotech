# EES — Security, Authentication & Account Recovery Architecture
**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Classification:** Enterprise Security Architecture Specification  

---

## 1. Security Architecture Foundations

The EES security posture adheres to enterprise zero-trust principles:
1. **Never Trust, Always Verify:** Every incoming request to protected routes requires a cryptographically validated JWT access token.
2. **Short-Lived Access Tokens:** Access tokens expire after 15 minutes. Long-lived refresh tokens (7 days) are stored as cryptographically hashed records in the PostgreSQL `RefreshToken` table with automatic rotation on reuse.
3. **Password Security:** All passwords are salted and hashed using bcrypt work factor 12 (or Argon2id). Plaintext passwords are never logged, transmitted in error traces, or stored in any cache.
4. **Rate Limiting & Throttling:** NestJS Throttler guards endpoints against brute-force attacks on `/auth/login`, `/auth/register`, and `/auth/forgot-password`.

---

## 2. Password Reset & Recovery Workflow

Account recovery in EES is designed to prevent token sniffing, replay attacks, and user enumeration.

### Sequence Flow:
```
[ User ]                           [ Backend API ]                       [ PostgreSQL ]
   │                                      │                                    │
   │─── 1. POST /auth/forgot-password ───▶│                                    │
   │    { email: "user@domain.com" }      │─── 2. Query user by email ────────▶│
   │                                      │◀── Return user record ─────────────│
   │                                      │                                    │
   │                                      │─── 3. Generate crypto random hex   │
   │                                      │       token (64 chars)             │
   │                                      │─── 4. Compute SHA-256 hash         │
   │                                      │─── 5. Insert PasswordResetToken ──▶│
   │                                      │       { tokenHash, expiresAt: +1h }│
   │                                      │                                    │
   │◀── 6. Return HTTP 200 generic msg ───│                                    │
   │    ("If email exists, link dispatched")                                   │
   │                                      │                                    │
   │─── 7. Open /reset-password?token=X ─▶│                                    │
   │─── 8. POST /auth/reset-password ────▶│                                    │
   │    { token: X, newPassword: Y }      │─── 9. Hash raw token with SHA-256  │
   │                                      │─── 10. Find matching tokenHash ───▶│
   │                                      │        where usedAt == null        │
   │                                      │        and expiresAt > now         │
   │                                      │                                    │
   │                                      │─── 11. Hash newPassword (bcrypt)  │
   │                                      │─── 12. Update User passwordHash ──▶│
   │                                      │─── 13. Mark token usedAt = now() ─▶│
   │                                      │─── 14. Invalidate all sessions ───▶│
   │                                      │        (Revoke RefreshTokens)      │
   │                                      │─── 15. Create AuditLog event ─────▶│
   │◀── 16. Return success confirmation ──│                                    │
```

### Security Safeguards:
1. **Database Blindness:** Even if an attacker gains read access to the database, they cannot read active reset tokens because only the SHA-256 hash of the token is stored (`tokenHash`).
2. **Single-Use Guarantee:** Once consumed, the token record is stamped with `usedAt = new Date()`. Any subsequent attempt to present the same token fails immediately with HTTP 400.
3. **Strict 1-Hour TTL:** Password reset tokens automatically expire after 60 minutes.
4. **Session Termination:** Resetting a password immediately purges all active refresh tokens and user sessions, evicting any unauthorized actors currently logged in.
5. **Zero Enumeration:** The `/forgot-password` endpoint always returns a generic success response, regardless of whether the requested email is registered on the platform.

---

## 3. Administrative Reset Links

For enterprise customer support and emergency account recovery:
- Authorized Super Admins and Admins can generate a single-use expiring reset link for any user via `POST /api/v1/admin/users/:id/reset-link`.
- The raw token is generated on the fly, stored as a SHA-256 hash, and returned in the response for the admin to copy and securely transmit.
- The generation event is permanently recorded in the immutable `AuditLog` table with the administrator's user ID, IP address, and target user ID.

---

## 4. Comprehensive Audit Logging

All security-sensitive operations are captured in the PostgreSQL `AuditLog` table:
- `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_REGISTER`
- `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS`
- `ADMIN_USER_CREATED`, `USER_STATUS_CHANGE`, `USER_ROLE_CHANGED`
- `FEATURE_FLAG_UPDATED`, `CONFIG_UPDATED`
- `DATABASE_MAINTENANCE_TRIGGERED`

Each record captures the actor's ID, action, entity type, target ID, remote IP address, timestamp, and metadata payload.

# Testing Strategy & Quality Assurance — EES

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** QA-TEST-2026-v1  

---

## 1. Testing Pyramid

Our testing strategy guarantees high stability across client and server with multi-layered automation:

```
            ┌──────────────────────┐
            │   Playwright E2E     │  (Critical User Journeys: Onboarding,
            │                      │   Opportunity Application, Posting)
            ├──────────────────────┤
            │   Integration Tests  │  (Supertest API Endpoints,
            │   (API & Database)   │   Prisma Transaction Integrity)
            ├──────────────────────┤
            │   Unit Tests         │  (Vitest: Zod Validation, XP Engine,
            │   (Logic & Helpers)  │   Taxonomy Parsers, RBAC Guards)
            └──────────────────────┘
```

---

## 2. Test Suites & Tooling

1. **Unit Testing (`vitest`):**
   - Fast execution for pure logic functions: XP calculation formula, streak logic, Zod schema validation, date calculations, and permission guards.
2. **Backend Integration Testing (`supertest` + `vitest`):**
   - Verifies HTTP request/response lifecycles, JWT authentication, role guards, and database transactions against an isolated test PostgreSQL database.
3. **End-to-End Testing (`Playwright`):**
   - Automated browser tests testing:
     - User registration and multi-step onboarding.
     - Field selection and dashboard rendering.
     - Social post publication, like, and comment interactions.
     - Provolution opportunity discovery, application submission, and admin status review.

---

## 3. Continuous Integration Verification
GitHub Actions runs on every pull request to enforce:
- Zero TypeScript compiler errors (`pnpm typecheck`).
- Zero ESLint rule violations (`pnpm lint`).
- 100% passing unit and integration tests (`pnpm test`).
- Clean production builds for both frontend and backend (`pnpm build`).

# Engineering Contribution Guidelines — EES

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  

---

## 1. Code Standards & Conventions

1. **TypeScript First:** Strict mode enabled everywhere (`"strict": true`). No `any` types without documented justification and lead architect approval.
2. **Commit Conventions:** Follow Conventional Commits:
   - `feat(evolve): add specialized workout set tracker`
   - `fix(auth): correct token rotation race condition`
   - `docs(adsense): update ads.txt verification guidelines`
3. **Monorepo Etiquette:**
   - Place shared types and schemas in `packages/shared`.
   - Never import frontend packages into backend code or vice-versa.
4. **Data Integrity:** Never run destructive database drops or migrations on production. Always provide rollback scripts.

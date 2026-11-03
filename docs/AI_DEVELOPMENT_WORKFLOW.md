# AI Development Workflow & Provider Integration — EES

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** AI-DEV-2026-v1  

---

## 1. AI Integration Architecture

EES includes a dedicated, modular AI assistant layer designed to assist learners with study planning, project brainstorming, technical explanations, and opportunity preparation without creating reliance on proprietary lock-in.

```
┌─────────────────────────────────────────────────────────────┐
│                       AI MODULE INTERFACE                   │
│                          (IAiService)                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       ▼                       ▼                        ▼
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│ Google Gemini│       │  OpenAI /    │         │ Mock / Local │
│   Provider   │       │ Anthropic    │         │ Development  │
└──────────────┘       └──────────────┘         └──────────────┘
```

---

## 2. Hard Architectural Guardrails

To protect academic integrity and commercial trust:
1. **No Automated XP Grants:** AI may suggest learning resources or summarize milestones, but XP is awarded solely upon verified user actions recorded in the database.
2. **No Capability Fabrication:** AI cannot certify or mark a user's skill as "verified". Skill verification requires human reviewer sign-off or validated project evidence.
3. **No Automatic Selection:** AI provides candidate summaries for Provolution Opportunity Managers, but only human managers can make hiring or contract selection decisions.
4. **Data Isolation:** Private messages, confidential client details, and payment data are strictly excluded from AI prompts.

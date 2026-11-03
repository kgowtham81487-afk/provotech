# Design System Specification — EES

**Organization:** Provolution Technologies Pvt. Ltd.  
**Platform:** EES — Evolve, Engage & Scale  
**Document Ref:** DS-SPEC-2026-v1  

---

## 1. Design Philosophy: Intentional, Distinct & Commercial

The primary UI/UX failure mode in modern platforms is homogenizing every view into a generic "purple-gradient AI SaaS dashboard". EES rejects this. EES is structured around **three distinct experiential stages**, each designed to match the psychological mindset of the user at that phase:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EES EXPERIENCE TRIAD                            │
│                                                                        │
│   EVOLVE WORKSPACE       ENGAGE FEED & SOCIAL      SCALE MARKETPLACE   │
│   Mindset: Focus         Mindset: Connection       Mindset: Value      │
│   Inspiration:           Inspiration:              Inspiration:        │
│   Linear, Raycast,       X, GitHub Discussions,    Linear Projects,    │
│   Obsidian               Substack                  AngelList, Deel     │
│   Palette Accent:        Palette Accent:           Palette Accent:     │
│   Emerald / Slate        Cyan / Indigo             Amber / Bronze      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Color Palette & Stage Accents

### 2.1 Foundational Neutrals
- **Background Deep:** `#0B0F17` (Near-black navy slate, high contrast, non-fatiguing)
- **Background Surface:** `#121824`
- **Surface Elevated (Cards & Modals):** `#1B2232`
- **Border Subtle:** `#283248`
- **Text Primary:** `#F8FAFC` (Slate-50)
- **Text Secondary:** `#94A3B8` (Slate-400)
- **Text Muted:** `#64748B` (Slate-500)

### 2.2 Semantic Stage Identification
1. **EVOLVE Theme Accent (Growth, Mastery, Health):**
   - Primary: `#10B981` (Emerald 500)
   - Secondary / Glow: `#059669` (Emerald 600)
   - Dark Tint: `rgba(16, 185, 129, 0.12)`
2. **ENGAGE Theme Accent (Community, Conversation, Discovery):**
   - Primary: `#06B6D4` (Cyan 500)
   - Secondary: `#3B82F6` (Blue 500)
   - Dark Tint: `rgba(6, 182, 212, 0.12)`
3. **SCALE Theme Accent (Value, Provenance, Opportunity):**
   - Primary: `#F59E0B` (Amber 500)
   - Secondary / Gold: `#D97706` (Amber 600)
   - Dark Tint: `rgba(245, 158, 11, 0.12)`

---

## 3. Typography & Hierarchy

- **Font Family (Display & UI):** `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Font Family (Code & Analytics):** `JetBrains Mono`, `Fira Code`, monospace
- **Scale:**
  - `Display 1`: 36px / 44px (SemiBold, -0.02em letter spacing)
  - `Heading 1`: 28px / 36px (SemiBold)
  - `Heading 2`: 22px / 28px (Medium)
  - `Heading 3`: 18px / 24px (Medium)
  - `Body Regular`: 15px / 22px (Normal)
  - `Body Small / Caption`: 13px / 18px (Normal)

---

## 4. Component Standards

1. **Buttons (`Button`):**
   - Variants: `default`, `evolve`, `engage`, `scale`, `secondary`, `outline`, `ghost`, `destructive`.
   - Micro-interaction: Active scale down `active:scale-[0.98]` with swift 150ms transitions.
2. **Cards (`Card`):**
   - 1px crisp borders (`border-border/60`), subtle hover border highlight, no muddy drop-shadows.
3. **Badges (`Badge`):**
   - Semantic indicator badges for field tags, skill proficiency levels, and opportunity status tags.
4. **Data Visualizations:**
   - Recharts-powered graphs with accessible color scales and contextual tooltips.

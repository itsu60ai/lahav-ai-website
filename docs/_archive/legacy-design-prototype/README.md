# LAHAV AI — Design Prototype (Stage 5)

**This is a disposable visual design prototype. It is NOT production code.**

Purpose: an accurate, browser-viewable representation of the approved Home page design so that
Stage 5 (design) and Stage 6 (design review) can be completed.

It makes **no** architecture decisions for the production website. Reusing any part of it in
production requires explicit review and approval at Stage 7.

## What it contains
- `index.html` — one responsive Home page, native RTL Hebrew
- `styles.css` — design tokens and components from docs/DESIGN_BRIEF.md
- `assets/` — the real LAHAV AI logo (SVG, primary + white) and favicon, from the approved brand kit

No backend, no database, no CMS, no authentication, no analytics, no API, no build step,
no framework, no dependencies. The only external request is Google Fonts (Heebo, Assistant).

## How to open it
Double-click `index.html`, or open it in any browser. No server required.

## Sections (approved order)
1. Header · 2. Hero · 3. Business Problem · 4. Services · 5. Process · 6. Principles ·
7. About Preview · 8. Connected Systems Visual · 9. Final CTA · 10. Footer

No blog preview on Home (per instruction). Articles is not in the navigation, per D-Q3.

## Content status
Copy marked with an orange **"טיוטה"** badge, or written as `[טקסט לאישור]`, is **not approved**
and must not be treated as final. Nothing was invented: the About text is a placeholder pending
OQ-15, the WhatsApp number and legal identity are marked as pending (OQ-5, OQ-10), and the
founder image is an intentional branded placeholder pending OQ-19.

## Source of truth order
1. PRD v1.2 · 2. DESIGN_BRIEF.md · 3. LAHAV AI Brand Guidelines · 4. Brand assets ·
5. Stitch export (visual inspiration only — it loses every conflict).

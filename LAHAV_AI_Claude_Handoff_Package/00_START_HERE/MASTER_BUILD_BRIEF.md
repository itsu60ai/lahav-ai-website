# LAHAV AI Website - Master Build Brief for Claude Code

## Mission

Build the production LAHAV AI website from the approved product requirements, clean brand system and final Stitch structures in this package. The site must be Hebrew-first, natively RTL, fast, accessible, trustworthy and visually exceptional.

The desired upgrade is intentionally ambitious: the current Stitch screens are a **structural/compositional baseline**, not a pixel-perfect implementation mandate. Raise the visual quality toward top-tier product-company websites while keeping the LAHAV AI brand and business clarity intact.

## Do not code immediately

Your first response after reading this package must be an **Architecture + Implementation Review**, not implementation.

Before changing files:

1. Inspect the existing repository/project.
2. Read every file under `00_START_HERE`, `01_PRD`, `02_BRAND`, `04_VISUAL_DIRECTION`, `05_CONTENT_RULES`, and `06_ARCHITECTURE_AND_QA`.
3. Review all 13 `03_STITCH_FINAL/*/stitch-reference.png` and their corresponding `stitch-source.html`.
4. Identify the current stack, existing work, reusable assets and anything that should be discarded.
5. Produce the architecture/build plan described below and wait for approval before major implementation.

## Source authority

Read `SOURCE_OF_TRUTH.md`. Key rule: Stitch is visual structure, **not factual authority**.

## Required V1 pages

See `PAGE_MAP.md`. There are 13 approved pages/templates:

1. Home
2. Services
3. CRM Service Detail
4. Business Automations Service Detail
5. Website Development Service Detail
6. Application Development Service Detail
7. AI Content Creation Service Detail
8. About
9. Articles / Blog Index
10. Article Detail Template
11. Contact / Book Discovery
12. Privacy Policy Template
13. 404

Projects/Work remains conditional and must not be fabricated.

## Visual upgrade mandate

Read `04_VISUAL_DIRECTION/VISUAL_UPGRADE_BRIEF.md`.

Target quality: **Apple-level restraint/polish + Stripe system storytelling + Linear precision + LAHAV AI identity + selective STG Hebrew/editorial energy.**

You may:
- redesign section composition within the approved information hierarchy
- reduce repetitive cards
- create stronger system maps and interface compositions
- add premium motion and scroll storytelling
- improve light/dark rhythm
- improve spacing, scale, typography, hierarchy and responsive behavior

You may not:
- delete required page concepts to make the site more minimal
- change service scope without approval
- invent business facts
- replace the LAHAV brand with a reference site's visual identity
- turn the site into an all-dark cyberpunk/AI template
- sacrifice accessibility/performance for animation

## Content rules

Read `05_CONTENT_RULES/APPROVED_COPY.md` and `CONTENT_CLEANUP.md`.

Any unsupported Stitch claim must be removed, rewritten neutrally or flagged for verification.

## Technical constraints

Read `06_ARCHITECTURE_AND_QA/ARCHITECTURE_GUARDRAILS.md`.

Additional software cost should ideally be ₪0 beyond the domain. Do not silently add paid dependencies.

CMS is required. Public publishing of AI-assisted content requires human approval. Secure admin access is required.

## Your required first deliverable - before coding

Return a concise but complete architecture review containing:

### A. Repository audit
- current stack/framework
- existing prototype/code worth keeping
- code/assets to discard
- current risks or conflicts

### B. Proposed production architecture
- frontend/framework
- styling/design system approach
- animation approach
- CMS/content architecture
- form handling
- scheduling approach
- hosting/deployment
- analytics/SEO approach
- admin/auth/security
- expected recurring costs

Clearly separate:
- **Client Requirement**
- **Architecture Recommendation**
- **Technical Verification Required**

### C. Component/system plan
Identify reusable site components and which elements should be unique per page. Avoid flattening visually rich Stitch sections into generic card components just for code reuse.

### D. Page-by-page implementation plan
Map all 13 pages to the Stitch reference folders and state the intended visual upgrades.

### E. Open questions / blockers
List only questions that genuinely block implementation. Do not ask for facts that can wait until content finalization.

### F. Implementation sequence
Propose the simplest staged build order, including design-system foundation, core components, pages, CMS/forms, QA and deployment.

Then STOP and wait for approval.

## Simplification rule

Prefer simple, maintainable architecture. Do not add infrastructure or custom abstractions merely because they are technically possible.

# LAHAV AI - Design Decisions

Running record of approved design decisions and Stitch execution.
Sources of truth: docs/PRD.md v1.2, docs/DESIGN_BRIEF.md (approved Stage 4).

---

## 1. Approved design decisions

| ID | Decision | Status | Date |
|---|---|---|---|
| D-Q1 | Semantic colors: Success #15803D, Error #B91C1C. Functional use only, never brand colors. Adjustable for accessibility during design/QA | APPROVED | Stage 4 |
| D-Q2 | No persistent floating WhatsApp button in V1. WhatsApp appears in header/nav contexts, conversion sections, the Contact page and contextual links | APPROVED | Stage 4 |
| D-Q3 | If no approved articles exist at launch: hide Articles from nav, omit Home article sections, never show an empty blog. CMS capability still exists | APPROVED | Stage 4 |
| D-Q4 | Dark Home hero on Deep Navy + approved gradient. Premium and controlled. No glow, cyberpunk, neon or noisy gradients | APPROVED | Stage 4 |
| D-Q5 | No Services dropdown in the V1 header. Detail pages reached from Services, Home cards and contextual links | APPROVED | Stage 4 |

---

## 2. Stitch execution plan (Stage 5)

### 2.1 Governing rule
Stitch is a design tool. Its output may not redefine scope, functionality, business requirements,
integrations or content strategy. Where Stitch output conflicts with the PRD or the Design Brief,
the PRD wins and the output is corrected or rejected (client instruction, Stage 5).

### 2.2 Known risk - NEEDS VERIFICATION
Hebrew and RTL fidelity in Stitch output is **not verified**. Generative UI tools commonly produce
LTR layouts, substitute fonts, and mangle mixed Hebrew/Latin text. This is the single largest
technical risk to Stage 5, and it is the reason the first generation is a deliberate probe rather
than a full page.

Possible outcomes of the probe, and the response to each:
- **Good Hebrew RTL output** - proceed with the planned batch sequence.
- **Correct layout, broken Hebrew text** - use Stitch for layout and structure only, treating the
  Hebrew copy as replaceable placeholder text, and correct typography at implementation.
- **Cannot produce RTL at all** - generate in LTR as a structural reference only, and mirror during
  implementation. This is a fallback, not the plan; it would be recorded here as a deviation from
  Design Brief section 4.

No decision on this is made in advance. It is settled by the probe result.

### 2.3 Generation order
Small batches, reviewed against the Design Brief before the next batch begins.

| Batch | Contents | Why this order |
|---|---|---|
| 0 | **Probe:** Home hero + header only | Verifies Hebrew RTL, palette, typography and the dark-hero direction before anything else is built on top |
| 1 | Design system screen: colors, type scale, buttons in all states, form fields with states, cards, section spacing | Everything later reuses these; approving them once prevents per-page drift |
| 2 | Home (full page, mobile + desktop) | The most important page; validates the section pattern library |
| 3 | Services overview + CRM detail | Establishes the featured-service treatment (D-1) and the service page template |
| 4 | Business Automations detail + About | Reuses the service template; About introduces the founder placeholder |
| 5 | Contact / Booking + form states | The conversion destination; needs the reserved booking region and all form states |
| 6 | Articles listing + Article page | Lower risk, reuses cards and reading styles |
| 7 | Privacy Policy + 404 | Simple text pages |
| 8 | Project card + Project detail patterns (system only, no page) | Per Design Brief section 16 - designed now, not built in V1 |

### 2.4 Review gate between batches
Each batch is reviewed against the 18 design acceptance criteria in Design Brief section 18, and
recorded here as PASS / NEEDS CHANGE / UNSUPPORTED DESIGN ASSUMPTION before the next batch starts.

### 2.5 Batch log
(To be filled in as batches are generated and reviewed.)

| Batch | Generated | Review result | Notes |
|---|---|---|---|
| 0-3 | Stitch, several controlled generations | REJECTED as a production path | Stitch did not reliably preserve page architecture, exact content, desktop/mobile parity, the approved services, or the no-invention rules |

---

## 3. Execution method change (client decision, Stage 5)

**Stitch = visual starting point. Claude Code = design prototype assembly.**
Stitch output is visual inspiration only. Source of truth order:
1. PRD v1.2  2. DESIGN_BRIEF.md  3. LAHAV AI Brand Guidelines  4. Brand assets  5. Stitch export.
Where Stitch conflicts with anything above, Stitch loses.

### 3.1 What the Stitch export actually got wrong (recorded for the design review)
Reviewed from stitch_lahav_ai_hero_header_design.zip (desktop + mobile + DESIGN.md):
- **Desktop and mobile were different products, not one responsive design.** Different hero copy,
  different problem section, different services, different process (6 steps vs 6 different steps).
- **Mobile invented services that do not exist:** "צ'אטבוטים ועוזרים חכמים" and
  "תהליכי עבודה חכמים", and collapsed CRM and Automations into one card - violating R7 and D-1.
- **Mobile invented company origin copy** ("LAHAV AI הוקמה מתוך הבנה ש...") - unapproved narrative
  about the company, which R9 and OQ-15 forbid.
- Desktop copy was closer to the approved input and is the basis for the prototype.
- The Stitch DESIGN.md token set is broadly consistent with the approved brand and was used as
  visual reference only.

### 3.2 What was reused from Stitch
Visual direction only: geometric node/workflow motif, card and section rhythm, the ambient
navy-tinted shadow value, and the Heebo/Assistant type scale. No Stitch HTML was copied.

---

## 4. Design prototype (Stage 5 deliverable)

Location: /design-prototype/ - disposable, not production code, no architecture decisions.
Home page only, one responsive page (desktop / tablet / mobile from one design system).
Approved section order: Header, Hero, Business Problem, Services, Process, Principles,
About Preview, Connected Systems Visual, Final CTA, Footer. No blog preview on Home.
Real approved logo assets used (primary + white SVG, favicon).

### 4.1 Deviations from earlier documents, recorded
- **Articles removed from the header navigation** in this prototype, per D-Q3 and the instruction
  that Home carries no blog preview yet. PRD 5.1 lists five nav items including מאמרים; the item
  returns when approved articles exist. Recorded rather than silently changed.
- **Home section order** now follows the client's Stage 5 list. It replaces the capability strip
  and articles teaser from PRD 6.1 with Principles, About Preview and the Connected Systems visual.
  Approved by the client in the Stage 5 instruction.

### 4.2 Copy status in the prototype
- Approved / supplied copy: hero, business problem, services (all five, correct names), pricing note,
  final CTA.
- Marked DRAFT (orange badge) and awaiting approval: process step labels, principles, connected
  systems heading and lead.
- Placeholder, never invented: About preview text (OQ-15), founder image (OQ-19),
  WhatsApp number (OQ-5), legal identity line (OQ-10).

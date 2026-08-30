# LAHAV AI Website — Consolidated Source of Truth

STATUS: CURRENT. Reconciliation complete. Final decisions F-1..F-18 approved by the client 2026-08-29.
Date: 2026-08-29 (revision 2)
Replaces: the ambiguity between the legacy Stage 1–4 documents and the handoff package.

---

## 1. Authority order (single, final)

When two documents disagree, the higher line wins.

| # | Authority | Scope of its authority |
|---|---|---|
| 1 | `LAHAV_AI_Claude_Handoff_Package/01_PRD/WEBSITE_PRD.md` + `SERVICE_PAGE_SCOPE_ADDENDUM.md` | Current page scope, page purpose, IA, truth rules |
| 2 | `05_CONTENT_RULES/APPROVED_COPY.md` | Exact approved factual copy |
| 3 | `02_BRAND/BRAND_RULES.md` + official logo assets | Brand identity, logo, color, typography |
| 4 | `docs/approved/REQUIREMENTS.md` (R1–R20) | Business requirements, cost, security, truth, accessibility — where not superseded |
| 5 | `docs/approved/PRIORITIES.md` (incl. D-1) + `docs/approved/PRD.md` v1.2 (incl. D-2) | Prioritization and product detail — where not superseded |
| 6 | `03_STITCH_FINAL/*` (13 pages) | **Visual and structural authority.** Not a factual authority |
| 7 | `04_VISUAL_DIRECTION/VISUAL_UPGRADE_BRIEF.md` | Permission and direction to elevate the Stitch visuals |
| 8 | `docs/approved/DESIGN_BRIEF.md` + `DESIGN_DECISIONS.md` | Design system rules (color use, contrast, RTL, motion, forms, accessibility) — **except** where the new visual direction supersedes them |
| 9 | `06_ARCHITECTURE_AND_QA/*` | Technical guardrails and QA acceptance |
| 10 | Claude recommendations | Never authority until approved |

**Explicitly NOT authority:** the legacy `design-prototype/` Home page. It is archived at
`docs/_archive/legacy-design-prototype/` for reference only and must not be used as a visual source.
The new Stitch designs and the Visual Upgrade Brief are the visual authority.

---

## 2. What was restored

Recovered from `design-prototype.zip` and placed under `docs/approved/`:

| Document | Status | Why it still matters |
|---|---|---|
| `REQUIREMENTS.md` | **RESTORED — active** | R1–R20. The only place the business constraints are stated as numbered, testable requirements: the hard truth rule (R9), the AI-draft/human-approval workflow (R10), the ₪0 cost constraint (R13), SEO (R16), accessibility-first (R17), and the full access-control specification (R20) |
| `PRIORITIES.md` | **RESTORED — active, one item superseded** | 90 atomic capabilities with MUST/SHOULD/LATER/OUT, plus D-1 (CRM + Automations featured). See 3.1 |
| `PRD.md` v1.2 | **RESTORED — active, IA superseded** | Journeys, page requirements, functional requirements, D-2 (security over cost), and 20 acceptance criteria. See 3.2 |
| `DESIGN_BRIEF.md` | **RESTORED — active; hero decision superseded by F-1** | Measured contrast rules, RTL specification, form/button state rules, motion rules, accessibility design rules. See 3.4 |
| `DESIGN_DECISIONS.md` | **RESTORED — active** | D-Q1..D-Q5 |
| `PROJECT_BRIEF.md`, `PARKING_LOT.md`, `PROJECT_STATUS.md` | Restored — historical | Context; PROJECT_STATUS is stale and superseded by the handoff package's own status |

Nothing in the legacy set was silently overwritten. Every conflict is listed in section 3.

---

## 3. Conflicts found, and how each is resolved

### 3.1 Service detail pages — legacy priority SUPERSEDED
- **Legacy:** `PRIORITIES.md` C4a — CRM and Automations detail pages = MUST. C4b — Website Dev, App Dev, AI Content detail pages = **SHOULD / post-launch**.
- **New:** `SERVICE_PAGE_SCOPE_ADDENDUM.md` — all five services get dedicated detail pages in V1.
- **Resolution: NEW WINS.** C4b is promoted from SHOULD to MUST. V1 is now 13 pages, not 10.
- **Consequence you should be aware of:** this is the largest scope increase in the project. Three additional pages, each needing its own approved Hebrew copy and its own bespoke diagram. It is the main driver of build time and of the copy-approval workload. It was your decision and I am implementing it — I am flagging the cost, not resisting it.

### 3.2 Information architecture — legacy PRD section 5 SUPERSEDED
- **Legacy:** 10 pages. **New:** 13 pages plus routes in `PAGE_MAP.md`.
- **Resolution: NEW WINS.** The 13-page map is the IA.
- Unchanged in both: Projects/Work stays conditional and unbuilt; Accessibility Statement conditional on legal verification; Terms not a V1 priority.

### 3.3 Home page section order — legacy Stage 5 order SUPERSEDED
- **Legacy:** the 10-section order approved for the old prototype (…Principles, About Preview, Connected Systems Visual…).
- **New:** `WEBSITE_PRD.md` §7 Home requirements + the `01-home` Stitch structure, which includes a knowledge/articles pattern that is hidden when no real articles exist.
- **Resolution: NEW WINS.** Home follows the Stitch structure, upgraded per the Visual Upgrade Brief.

### 3.4 Home hero: dark or light — **RESOLVED by F-1**
- **Legacy:** D-Q4, approved by you — dark Home hero on Deep Navy + gradient.
- **New:** the `01-home` Stitch reference shows a **light** hero. The Visual Upgrade Brief says do not make the site all-dark and asks for "controlled light/dark rhythm" and a more cinematic, ownable hero.
- **Resolution: F-1.** Primarily light hero with a dark, cinematic technology visual composition
  integrated inside it. D-Q4 (fully dark hero) is superseded.

### 3.5 Chatbots — **RESOLVED by F-2**
- `APPROVED_COPY.md` (authority level 2) states LAHAV AI specialises in "…CRM, אוטומציות, אתרים, אפליקציות, **צ'אטבוטים** ופתרונות מבוססי AI".
- `REQUIREMENTS.md` R7 lists exactly **five** services, none of which is chatbots, and `ARCHITECTURE_GUARDRAILS.md` lists chatbot as out of scope.
- These are not necessarily in conflict: "chatbot as a service we deliver for clients" and "chatbot widget on our own website" are different things. But the About text puts a sixth capability in front of visitors that the Services pages do not carry.
- **Resolution: F-2.** Chatbots are not a sixth service. The approved About sentence is amended to
  "מערכות CRM, אוטומציות, אתרים, אפליקציות, יצירת תוכן ופתרונות מבוססי AI." — the only edit ever made
  to approved factual copy, made solely on the client's explicit written instruction. Chatbots may
  later appear as a capability inside a relevant service if factually justified.

### 3.6 Legacy design brief items with no counterpart in the handoff — RETAINED
Not contradicted by anything newer, so they stay in force:
- Measured contrast rules, including **Electric Blue #2997FF on white ≈ 3:1 — not permitted for body text**
- D-Q1 semantic colors: Success #15803D, Error #B91C1C, functional use only
- D-Q2 no floating WhatsApp · D-Q3 hide Articles when empty · D-Q5 no header dropdown (all three are independently confirmed by the handoff documents)
- The RTL specification, button/form state requirements, motion rules and accessibility design rules
- D-2: security overrides cost when they conflict

### 3.7 Projects card/detail design patterns — DOWNGRADED
- **Legacy:** `DESIGN_BRIEF.md` §16 required the project card and project detail patterns to be designed as part of the design system, even though the page is not built.
- **New:** the handoff excludes Projects from the 13 pages entirely.
- **Resolution:** the patterns are **not built** in V1. The requirement that any future project display must carry an "in progress" state and must have **no slot for metrics, ROI, logos or testimonials** is retained as a rule for whenever the page is added. This is a small deliberate reduction of legacy scope — flagged, not silent.

### 3.8 Acceptance criteria — MERGED, not replaced
`QA_ACCEPTANCE.md` (implementation-focused) and legacy PRD §13 (business-focused) do not conflict.
The QA stage will run **both**. The legacy list contributes items the new one lacks: recurring cost is
domain-only or explicitly approved; the owner can publish an article unaided end to end; booking
reachable from any page without an account; a failed form submission offers an alternative route.

### 3.9 Open questions — merged into one register
Legacy OQ-1..OQ-20 / NV-1 / NV-2 and the handoff's 15 technical-verification items overlap heavily.
Consolidated in section 4. The legacy numbering is retired; the consolidated register is now the
single list.

---

## 4. Consolidated open register

**Blocks starting implementation**
| ID | Item |
|---|---|
| V-1 | GitHub account for site administration (drives CMS + auth + cost) |
| V-2 | Domain ownership and registrar |

**Blocks a specific page going live, not the build**
| ID | Item | Blocks |
|---|---|---|
| V-3 | WhatsApp business number | every secondary CTA |
| V-4 | Destination email for form submissions | Contact |
| ~~V-5~~ | **CLOSED 2026-08-30.** Scheduling provider: Cal.com, tested and live at `https://cal.com/ethan-fgix0d/discovery`, embedded inline on `/contact/`. Every Discovery CTA site-wide already routed to `/contact/`, so the booking region simply started working the moment it was implemented — no CTA hrefs needed to change. See `docs/CONTACT_FORM.md` sibling notes and O-13 below. | ~~the booking region~~ resolved |
| V-6 | Legal entity details | footer, Privacy |
| V-7 | Final privacy text, once the stack is fixed | Privacy |
| V-8 | Legal accessibility obligation (legacy NV-1) | accessibility statement, launch claim |
| V-9 | Founder story and approved photography | final Home/About copy |
| V-10 | Response-time promise — or the decision not to make one | Contact copy |

**Decide before launch, not blocking**
| ID | Item |
|---|---|
| V-11 | Analytics: Cloudflare Web Analytics (no cookie banner) vs GA4 (banner required) |
| V-12 | Google Search Console property and verification method |
| V-13 | Real article inventory — determines whether Articles is visible at launch |
| V-14 | Projects/Work eligibility (needs ≥2 genuine publishable items) |
| V-15 | Target Hebrew search terms per page |
| V-16 | Final lead-form fields |
| V-17 | Numeric success targets for the first three months |
| V-18 | Form data retention expectations |

Standing assumption until told otherwise: **no testimonials exist**, and Baan Thai is in progress and
may not be shown as a completed case study or result.

---

## 5. Final approved decisions (F-1..F-18) — client, 2026-08-29

These are the newest approved decisions. Where they conflict with anything older, **they win**.

| ID | Decision |
|---|---|
| **F-1** | **Home hero: primarily LIGHT**, clean and spacious, with a **dark / cinematic technology visual composition integrated inside it**. Very large confident typography, generous whitespace, strong visual focus, premium editorial composition, less card-grid feel. The site is never all-dark. Apple is inspiration for polish, scale, typography and whitespace only — no Apple layouts, branding or assets. Ambition remains Apple-level polish + Stripe/Linear system visuals + LAHAV AI identity. **Supersedes D-Q4.** |
| **F-2** | **Exactly five services**, all five detail pages MUST for V1: AI CRM Systems, AI Automations, AI Website Development, AI Application Development, AI Content Creation for Businesses. **Chatbots are not a sixth service.** Approved About copy amended to "מערכות CRM, אוטומציות, אתרים, אפליקציות, יצירת תוכן ופתרונות מבוססי AI." Chatbots may later appear as a capability inside a relevant service if factually justified. |
| **F-3** | **Projects / Work not built in V1.** Trigger recorded in the parking lot: after V1 launch AND at least two real publishable projects with approved material. Future truth rules preserved — no invented ROI, no invented metrics, no fake logos, no fake testimonials, in-progress projects clearly labelled. |
| **F-4** | **GitHub approved as the underlying repository / infrastructure.** The client has an account. **Normal website management must NOT require git, manual Markdown editing, terminal commands or operating GitHub directly.** GitHub works behind the scenes. |
| **F-5** | **No paid custom domain yet.** Build, preview, testing and QA run on a **free temporary hosting URL**. Domain purchase is deferred to production launch and is **not a blocker**. Objective stays: ideally domain-only cost once purchased. |
| **F-6** | **Simple visual admin CMS.** The client must be able to log in, create, edit, save a draft, preview, publish and manage content without touching GitHub or source files. Simplest free architecture meeting security, usability and cost. **The user experience must be shown before the CMS is locked.** No paid service without approval. |
| **F-7** | **AI article tool inside the admin area.** (A) AI-assisted creation: topic/objective input, generation, editing, human review, draft management, publishing. (B) Learning from the client's edits, approvals, rejections, preferred style and structural preferences — **fine-tuning is not assumed**; simplest technically sound approach, respecting the zero-cost preference. (C) Two publishing modes: **Mode 1 Generate & Publish** (client-initiated) and **Mode 2 Auto Publish ON/OFF** (explicitly enabled by the client, on rules/schedule the client controls). **Autonomous publishing must never enable itself.** Safety/control model proposed before implementation. |
| **F-8** | **V1 launches with 2–3 real approved articles.** No Stitch placeholder articles. May be produced through the AI workflow, but launch content must be real and appropriate. |
| **F-9** | **Analytics: Cloudflare Web Analytics** for V1 — free, simple, lightweight, cookieless. **GA4 deferred**, not added now. |
| **F-10** | **Contact form fields: Name, Phone, Email, Service of interest, How can we help?** No longer than that. Lead destination: **itsu60ai@gmail.com**. Every submission must (1) be emailed there and (2) be stored reliably in one organised place, so a mail failure cannot lose a lead. No full CRM in V1. No public form may reach admin privileges. Spam protection required. |
| **F-11** | **WhatsApp = secondary contact.** Number **0546969503** (international form where technically required). Pre-filled opening message, e.g. "היי, הגעתי דרך האתר של LAHAV AI ואשמח לשמוע פרטים." **No persistent floating button.** Discovery remains primary. |
| **F-12** | **Discovery call = 30 minutes.** Simplest appropriate **free** booking solution. Recommendation, visitor experience and limitations/future costs shown before integration. No paid booking tool without approval. |
| **F-13** | **One admin initially — Ethan Lahav.** Architecture must still allow more authorised users/roles later without redesign. R20 and D-2 remain fully active. |
| **F-14** | **Founder: Ethan Lahav — Founder & AI Systems Builder.** Approved photo will be supplied. Slightly personal, primarily professional tone. Story direction: businesses do not suffer from a lack of tools, but from disconnected systems, manual work and processes that keep getting more complicated. Philosophy: start with the business process — where work gets stuck, what wastes time, where information is lost, what must become simpler — and only then choose the technology. Goal: infrastructure that brings order, reduces manual work and gives the owner control. **No invented years of experience, employment history, certifications, customers, revenue, results or credentials.** Unverified factual claims are flagged for approval, never invented. |
| **F-15** | **LAHAV AI is currently a brand, not a registered entity.** Legal/operator identification: **"Ethan Lahav / LAHAV AI"**. Never invent a company number, registered office, physical address, Tel Aviv address, entity or registration. **No physical address displayed.** Privacy/legal copy stays subject to the actual implementation and legal verification. |
| **F-16** | **No response-time promise** unless explicitly approved later. |
| **F-17** | **Founder photo:** use the original supplied asset. **Do not AI-generate or materially alter the founder's face.** Responsive sizing and compression are fine. |
| **F-18** | **Parking lot preserved:** Projects/Case Studies, custom paid domain, GA4, additional admin/editor users. Not implemented in V1, not forgotten. |

### 5.1 Conflicts these decisions create with older approved requirements

| Older requirement | Status now |
|---|---|
| **D-Q4** — dark Home hero | **SUPERSEDED by F-1** |
| **PRIORITIES C4b** — three service pages = SHOULD | **SUPERSEDED by F-2.** All five = MUST |
| **APPROVED_COPY.md** About sentence containing "צ'אטבוטים" | **AMENDED by F-2.** The one place approved factual copy was edited, and only on the client's explicit written instruction |
| **R10** (human approval before every publication), **legacy AC-10**, **legacy OUT-OF-SCOPE** "autonomous AI system that publishes without human approval", and **`ARCHITECTURE_GUARDRAILS.md`** "Autonomous AI publishing is out of scope" | **SUPERSEDED by F-7C** on the client's explicit instruction. Human review remains the **default**. Auto Publish is client-enabled only and must never enable itself. Note this overrides a line in the current handoff package, not only the legacy documents |
| **DESIGN_BRIEF §16** — Projects card/detail patterns | **SUPERSEDED by F-3.** Not built in V1; truth rules preserved |
| **Legacy R11 / D7** — 1–3 launch articles = SHOULD | **RAISED by F-8** to 2–3 real approved articles at launch |
| **Domain as a blocker** | **SUPERSEDED by F-5** |
| **V-3, V-4, V-6, V-9 (partly), V-10, V-11** | **CLOSED** by F-11, F-10, F-15, F-14, F-16, F-9 |

### 5.2 Still open after these decisions

| ID | Item | Type |
|---|---|---|
| **B-1** | **AI generation is not free.** Article generation needs an LLM API, and API usage is pay-per-token. Options and costs in `ARCHITECTURE_REVIEW.md` §H.3. **Requires your decision before the AI tool is built.** | **TRUE BLOCKER — for F-7 only** |
| **O-1** | Hebrew service labels: the five services are now named with an "AI" prefix in English. Confirm the Hebrew labels — keep "מערכות CRM חכמות / אוטומציות עסקיות…" or move to "מערכות CRM מבוססות AI…". Affects navigation, cards and five page titles | Content decision |
| **O-2** | Founder photo asset not yet supplied | Blocks final About only |
| **O-3** | Any factual claim in the founder story (e.g. ecommerce/business background) must be confirmed before it is written | Blocks final About copy |
| **O-4** | Final privacy text once the stack is fixed | Blocks Privacy going live |
| **O-5** | Legal accessibility obligation verification (legacy NV-1) | Blocks any compliance claim |
| **O-6** | The 2–3 real launch articles (F-8) | Blocks Articles being visible |
| **O-7** | Booking tool approval after the recommendation is shown (F-12) | Blocks filling the booking region |
| **O-8** | CMS user-experience approval before the CMS is locked (F-6) | Blocks CMS implementation |
| **O-9** | Auto-publish safety model approval (F-7C) | Blocks Mode 2 |
| **O-10** | Target Hebrew search terms per page | Copy quality, not blocking |
| **O-11** | **Secure admin access with MFA before launch — MANDATORY, requirement clarified 2026-08-30.** The requirement is the outcome (MFA-protected admin access), not a specific implementation. **Prefer Cloudflare Access** (free for ≤50 users, enforced at the edge before the Worker runs, includes MFA at no cost); this requires the domain to be on Cloudflare (see V-2). **Do not build a custom password-change screen or custom MFA if Cloudflare Access already covers the need — avoid duplicate custom security features unless something Access does not cover is actually needed.** Full reasoning in `docs/CMS_CLOUDFLARE_MIGRATION.md` §1 and §8. Recorded as **PL-13** in the parking lot. | **TRUE BLOCKER — for production launch only, not for further CMS or feature work** |

| **O-12** | **Contact form (F-10) is implemented, tested, and email delivery is now LIVE.** Resend account created with itsu60ai@gmail.com, `RESEND_API_KEY` configured 2026-08-30, real delivery confirmed end to end (lead saved, `email_sent = 1`, no error). **One item remains**: a real Cloudflare Turnstile widget once the domain is on Cloudflare, replacing the public test keys currently in use for bot verification. The form is fully functional and safe without it — it just means bot protection is running on Cloudflare's test keys rather than the client's own. Full detail in `docs/CONTACT_FORM.md`. | Blocks real bot protection only, not the build, and not email delivery (already live) |

None of O-1..O-10 or O-12 blocks starting the build. B-1 blocks only the AI tool, which is late in the sequence.
O-11 blocks going live in production; it does not block continuing to build other features.

## 6. What changed in the architecture review

`docs/ARCHITECTURE_REVIEW.md` is updated:
- **TV-0 is resolved** — the legacy documents are found, restored and reconciled here. The handoff
  package is the authority for scope and visuals; the legacy documents remain the authority for
  business requirements, cost, security and accessibility where nothing newer contradicts them.
- No architecture recommendation changed as a result of the restoration. R13 (cost), R20 (security)
  and D-2 (security over cost) were already reflected in the proposed stack; restoring them
  strengthens the justification rather than altering the design.
- The blocking-question list is now empty for starting the build: F-4 closes the GitHub question and
  F-5 removes the domain from the critical path. One decision (B-1, paying for LLM API usage) blocks
  only the AI article tool, which is late in the sequence.
- A new section H was added covering the CMS user experience, the AI article system and its learning
  model, the auto-publish safety model, lead storage, booking and temporary hosting.

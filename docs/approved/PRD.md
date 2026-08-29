# LAHAV AI Website - Product Requirements Document (PRD)

STATUS: PROPOSED - revision 1.2, awaiting approval (Stage 3)
Version: 1.2 (adds: AC-9 tests blog capability not article count; AC-10 scoped to business/AI content; AC-18 at-least-one admin account)
Sources of truth: docs/REQUIREMENTS.md (R1-R20, approved), docs/PRIORITIES.md (approved, incl. D-1)

This PRD is the primary product source of truth from approval onward.
It contains no design decisions and no technology choices. Anything not established in Stage 1 or 2
appears here as an OPEN QUESTION, never as an invented fact.

---

## 1. Product overview

The LAHAV AI website is the company's primary business-development asset: a Hebrew, RTL,
mobile-first marketing site for an AI and software agency serving Israeli small and medium
businesses.

Its job is not to explain technology. Its job is to make a business owner who is drowning in manual
work believe that LAHAV AI can fix it, and then book a Discovery call.

The site launches without established social proof. That is the defining product constraint of V1:
credibility must be built from the founder's story, an explicit work process, honestly described
capabilities, and the professionalism of the site itself - never from invented clients, results,
or testimonials (R9).

---

## 2. Goals

### 2.1 Primary goal
Convert relevant visitors into qualified leads who book a Discovery call (R1).

### 2.2 Goal hierarchy (R2)
1. Book a Discovery call
2. Build trust and credibility
3. Present services and projects
4. Capture leads via form or WhatsApp for visitors not ready to book immediately

### 2.3 Success metrics (V1)
| Metric | Why | Notes |
|---|---|---|
| Discovery calls booked | The primary goal | Must be measurable (G11) |
| WhatsApp conversations started | Secondary conversion | Click-tracked |
| Lead form submissions | Secondary conversion | |
| Lead quality (fit with R3/R4) | A bad lead is not a success | Judged manually by the owner |
| Pages indexed by Google | SEO foundation working | Via Search Console (E10) |

OPEN QUESTION OQ-14: numeric targets for the first 3 months (e.g. "4 Discovery calls per month").
Not required to build V1, but without a target we cannot judge whether V1 succeeded.

### 2.4 Non-goals
Selling online, publishing a price list, serving international/English audiences, being a
technology showcase, or accumulating traffic that does not convert.

---

## 3. Target users

### 3.1 Primary persona - the business owner in operational pain (R3, R4, R5)
- Role: owner, CEO, operations manager, or marketing manager
- Company: 2-50 employees; serious solo operators and larger companies are not excluded
- No single industry focus in V1
- Pain: manual processes, disorder, operational overload, leads handled badly, or the need for a
  custom system that off-the-shelf tools do not provide
- Mindset: business-first, not technical. Wants results, order, time saved, control, growth.
- Reads Hebrew. Located in Israel.
- Likely arrives on a phone, often from WhatsApp, a referral, or a Google search.

### 3.2 What this persona needs from the site
1. Fast recognition of their own problem in the copy
2. Confidence that this is a real business with a real person behind it
3. An understandable picture of what working together looks like
4. A low-friction way to talk to someone - ideally without filling in a form

### 3.3 Explicit non-users in V1
English speakers, international businesses, enterprise procurement teams, job applicants,
and other agencies. The site need not serve them, and must not be compromised to do so.

---

## 4. User journeys

### J1. Ready buyer (primary journey)
Lands on Home -> recognises the pain in the hero -> scans services -> checks who is behind the
company -> clicks "Book a Discovery call" -> books -> sees confirmation.
Requirement: bookable from any page, at most two clicks away (A1, A2).

### J2. Cautious evaluator
Lands on Home -> reads a featured service page (CRM or Automations) -> reads the work process ->
reads About -> still not ready -> messages on WhatsApp with a specific question (A3).
Requirement: WhatsApp reachable from every page, and the page must survive scrutiny -
no vague claims, no invented proof.

### J3. Researcher from search
Arrives from Google on a service page or an article -> reads -> follows internal links to a
related service -> converts via form or booking (E5, E6).
Requirement: every page must stand alone as a legitimate entry point, with its own CTA.

### J4. Referral check
Someone was told about LAHAV AI -> searches the name -> lands on Home or About -> wants to confirm
this is a real, professional business -> converts or saves for later.
Requirement: the site must look and read as credible within the first screen.

### J5. Owner publishing content (admin journey)
Owner signs in to the admin area -> creates an article -> AI-assisted draft -> reviews and edits ->
approves -> publishes -> article appears on the site (D3, D4, D5, D6, R10).
Requirement: nothing publishes without explicit human approval.

---

## 5. Information architecture

Approved V1 structure. Derived from R14 and D-1; pages were not added merely because they are
conventional.

```
Home
Services (overview - all five services)
  |- CRM Systems (featured, detail page)
  |- Business Automations (featured, detail page)
About (who we are + how we work)
Blog / Articles
  |- Article page
Contact / Book a Discovery call
Privacy Policy
[Projects / Work]            <- conditional, see 5.2
[Accessibility statement]    <- conditional on NV-1
[Terms]                      <- SHOULD, low priority
404
```

### 5.1 Navigation
Main navigation (max 5 items + CTA): Home · Services · About · Articles · Contact
Persistent primary CTA: "Book a Discovery call"
Persistent secondary CTA: WhatsApp
Footer: navigation repeat, contact details, Privacy Policy, legal identity line (blocked by OQ-10)

Detail service pages are reachable from the Services page and from Home. Whether they also appear
as a dropdown in the main navigation is a design-stage question, not a product decision.

### 5.2 Conditional pages
**Projects / Work (B6, B7):** included in V1 only if the OQ-2 inventory yields at least two items
that can be presented truthfully. Baan Thai may not be shown as complete or as a results case study
(R9). If the inventory is insufficient, the page is not built, and real screenshots that are
permitted (B5) are placed inside About or the service pages instead.
This decision does NOT block the Design Brief (client decision, Stage 3). The Design Brief proceeds
on the assumption that no Projects page exists, and must define a project-card and project-detail
pattern that can be added later without reworking the design system.

**Accessibility statement (F9):** included if NV-1 verification says it is required or advisable.

---

## 6. Page requirements

Every page must include: a unique title and meta description (E2), one clear search intent (E5),
correct heading order (E3), a primary CTA, a WhatsApp route, and internal links (E6).

### 6.1 Home
Purpose: make the visitor recognise their problem, believe LAHAV AI can solve it, and act.
Must contain:
1. Hero: what LAHAV AI does, for whom, and the primary CTA. Written in outcome language (R5).
2. Pain recognition: the operational problems from R3, stated plainly.
3. The five services, with CRM and Automations visually and structurally first (D-1).
4. The work process in brief, linking to the fuller version (B3).
5. Who is behind LAHAV AI - short, human, real (B2).
6. Real capabilities / technologies worked with (B4).
7. Closing conversion block: book a call, WhatsApp, or form.
Must NOT contain: invented metrics, client logos, testimonials, or a price list (B10, B9, B8, C5).

### 6.2 Services (overview)
Purpose: let a visitor find the service that matches their pain, and route the featured two deeper.
Must contain: all five services (C1), each framed as pain -> what we build -> business outcome (C2),
CRM and Automations presented with greater prominence and links to their detail pages (D-1),
the remaining three described clearly enough to prompt contact even without a detail page,
and a statement that pricing follows a Discovery call (R8, C5).

### 6.3 Service detail - CRM Systems (V1)
Must contain: who it is for; the symptoms that mean a business needs it; what we actually build;
how a project runs; what changes for the business afterwards; an honest scope statement; CTA.
Constraints: no invented client examples; no pricing; if an example is used it must be a labelled
illustrative scenario, never presented as a delivered client project (R9).

### 6.4 Service detail - Business Automations (V1)
Same structure as 6.3, focused on manual, repetitive, error-prone processes and lost leads.

### 6.5 About
Purpose: in the absence of case studies, this page carries most of the credibility (B2, B3, B4).
Must contain: who the founder is and why LAHAV AI exists; the approach to working with SMBs;
the work process in full (discovery -> mapping -> build -> handover -> support), stated only as
far as it is truthful; the real capability set; what we do not do; CTA.
OPEN QUESTION OQ-15: the founder's background and story - name, experience, positioning.
This is required content and cannot be written without the client's own input. It must not be
invented (R9).

### 6.6 Blog / Articles listing
Purpose: SEO surface and authority (R16, R11).
Must contain: article list with title, short summary, date, link. Empty-state handling is not
acceptable at launch - see 8.3.

### 6.7 Article page
Must contain: title, publication date, body content, correct heading structure, internal links to
relevant services, and a CTA. Author attribution is optional in V1.

### 6.8 Contact / Book a Discovery call
Purpose: the conversion destination.
Must contain: the booking route (A1); WhatsApp (A3); the lead form (A4); a plain statement of what
happens after contact and within what timeframe; and no requirement to create an account.
OPEN QUESTION OQ-16: response-time promise (e.g. "we reply within one business day").
The site must not promise a response time the business will not honour.

### 6.9 Privacy Policy
Included in the V1 structure as a practical product decision: the lead form collects personal data,
and visitors reasonably expect to see how it is handled. No claim of legal compliance and no
statement of a specific legal obligation may be made until NV-2 is verified.
Blocked by OQ-10 (legal identity); must never state an invented company name or registration.

### 6.10 404
Must explain the situation and route back to Home, Services and Contact (G12).

---

## 7. Functional requirements

### 7.1 Discovery call booking (A1)
- The visitor can initiate booking from any page.
- The booking route must work on mobile.
- The visitor receives a confirmation of the booked time.
- The owner is notified of every booking.
- Booking must not require the visitor to create an account.
- OPEN QUESTION OQ-3: which booking mechanism. Free preferred (R13). Architecture stage.

### 7.2 WhatsApp contact (A3)
- Reachable from every page, opening a WhatsApp conversation with the business number.
- May carry a pre-filled opening message; the visitor must be able to edit it.
- Must work on both mobile and desktop.
- OPEN QUESTION OQ-5: the business WhatsApp number. Must never be invented.

### 7.3 Lead form (A4-A8)
- Fields: full name, business name, phone or email, and a short description of the need.
- OPEN QUESTION OQ-17: exact required vs optional fields. Product recommendation: keep it to
  name + one contact method + free text. Every extra required field reduces submissions.
- Client-side and server-side validation, with clear Hebrew error messages (A6, F5).
- Spam protection that does not degrade accessibility or usability (A7).
- On success: a distinct confirmation state stating what happens next (A8).
- On failure: an explicit error plus an alternative contact route, so the lead is never lost.
- Every submission reaches the owner reliably (A5). The delivery mechanism is an Architecture
  decision; reliability is a product requirement.
- Submissions must be retrievable - a lost lead is a product failure.
- The form must provide no path to administrative privileges or content modification (G7, R20).

### 7.4 Content management (D1-D6)
- The owner can create, edit, publish and unpublish articles through an admin interface.
- Articles have at minimum a draft and a published state (D4).
- Nothing is published without an explicit human action by the authorized user (D6, R10).
- AI-assisted drafting is part of the workflow, not an autonomous site feature (D5).
- The owner can edit an article after publishing.
- OPEN QUESTION OQ-18: whether core marketing page copy (Home, Services, About) is also editable
  through the CMS, or is maintained as part of the codebase. This has real cost implications and
  belongs to the Architecture stage.

### 7.5 Access control (R20, G5-G8)
- The public site is fully viewable with no login.
- The admin area is not publicly accessible and is protected by real authentication.
- Only explicitly authorized accounts may modify content.
- V1 ships with at least one administrator/editor account; one is sufficient initially, and the
  product must not artificially enforce exactly one.
- Least-privilege throughout; obscurity is not a control.
- The structure must permit adding users or roles later without a rebuild, while building none now.
- MFA/2FA: to be evaluated at the Architecture stage if free and simple (G9).

### 7.6 Analytics and conversion tracking (G10, G11)
- Free analytics installed on all pages.
- Tracked events at minimum: booking initiated, booking completed, WhatsApp click,
  form submitted successfully.
- Privacy implications feed the cookie-consent decision (H4, NV-2).
- OPEN QUESTIONS OQ-7 (existing analytics account) and OQ-8 (Search Console).

---

## 8. Content requirements

### 8.1 Workflow (R10)
AI drafts -> human review -> approved -> published. Applies to every word on the site.
Nothing is published without the owner's explicit approval.

### 8.2 Truthfulness (R9 - hard rule)
No invented clients, results, ROI figures, testimonials, logos, awards or certifications.
Baan Thai is in progress and may not be presented as complete or as a results case study.
Illustrative scenarios are permitted only when clearly labelled as illustrative.
Every claim on the site must be traceable to something the client has confirmed.

### 8.3 Content needed at launch
| Item | Status | Blocker |
|---|---|---|
| Home copy | To be drafted | Needs OQ-15 |
| Services overview copy | To be drafted | - |
| CRM detail page copy | To be drafted | - |
| Automations detail page copy | To be drafted | - |
| About copy incl. work process | To be drafted | OQ-15 - required |
| 1-3 real articles | To be drafted (D7 - SHOULD, not a launch gate) | - |
| Privacy Policy | To be drafted (practical decision, not a compliance claim) | OQ-10 - required |
| Real screenshots / images | Unknown | OQ-2, OQ-19 |
| Logo and brand assets | Exists, to be supplied | Design stage (R12) |

OPEN QUESTION OQ-19: what real imagery exists - founder photograph, system screenshots, workspace
photos. APPROVED handling (Stage 3): the design may proceed using LAHAV AI branded abstract visuals,
UI/system screenshots where available, and clearly defined image placeholders. Fake team or customer
stock imagery is prohibited (consistent with R9). Real images can replace placeholders later without
reworking the design system.

### 8.4 Tone (R5)
Business-plain Hebrew. Outcome language: order, time saved, control, growth. Technical depth is
permitted only where it serves the buyer's confidence, never as decoration.

---

## 9. SEO requirements (R16)

Required for V1:
- Crawlable and indexable, with sitemap.xml and robots.txt (E1, E7)
- Unique title and meta description per page (E2)
- One clear search intent per main page (E5)
- Correct heading hierarchy (E3)
- Clean, stable, readable URLs, chosen before launch because they are costly to change (E4)
- Internal linking between services, articles and conversion points (E6)
- Service pages written with real Hebrew search intent in mind
- Google Search Console connected (E10)
Should have: Open Graph previews (E8 - matters because links are shared over WhatsApp),
Organization structured data (E9).
Later: large-scale keyword research and content campaigns (E11), Google Business Profile (E12).

OPEN QUESTION OQ-20: the specific Hebrew search terms to target per page. Needed before copy is
written, but not before design.

---

## 10. Non-functional requirements

| Area | Requirement | Source |
|---|---|---|
| Language | Hebrew, RTL throughout | R6, F7 |
| Devices | Mobile-first; must work well on desktop | G1 |
| Performance | Fast on Israeli mobile data; heavy animation must not compromise it | G2, R19 |
| Accessibility | Semantic HTML, keyboard navigation, contrast, alt text, form labels, focus states, heading order | F1-F7, R17 |
| Legal accessibility | Obligation verified before launch; no compliance claimed until verified | F8, NV-1 |
| Security | HTTPS; authenticated admin; least privilege; no obscurity-based protection | R20, G3 |
| Cost | Target ILS 0 recurring; domain is the accepted expense; any paid service needs explicit approval | R13 |
| Reliability | Lead delivery must not silently fail | A5 |
| Maintainability | The owner can publish articles unaided | D3 |
| Extensibility | Adding English later must not require a rebuild; no multilingual infrastructure now | R6, G15, G16 |
| Backup | A content recovery path should exist | G13 |

**D-2 (APPROVED by the client, Stage 3):** Security and reliability take precedence over cost.
Where R13 (cost) and R20 (security) conflict, R20 wins. Security must not be weakened merely to
maintain a zero-cost architecture. Any resulting expense is brought to the client as an explicit
decision before it enters the architecture.

---

## 11. Out of scope for V1

Internal CRM in the website · autonomous publishing without human approval · English version ·
e-commerce · client portal / login area · public price list or online purchase · ROI and metric
claims · testimonials and client logos · Baan Thai as a completed case study · packages comparison
table · accessibility overlay widget · multilingual infrastructure · intrusive popups · heavy
animations that harm performance · newsletter · chatbot · article search · comments · staging
environment · CRM integration for leads.

---

## 12. Open questions register

Blocking launch:
- OQ-10 legal business identity (blocks the Privacy Policy text)
- OQ-6 domain ownership and provider (blocks go-live)
- OQ-5 WhatsApp business number
- NV-1 legal accessibility obligation (verification before launch)
- NV-2 privacy policy obligation (verification before any compliance wording)

Blocking final copy approval (not design):
- OQ-15 founder story and background (Home and About copy)
- OQ-16 response-time promise
- OQ-20 target Hebrew search terms

Does NOT block the Design Brief (Stage 4) - client decision, Stage 3:
- OQ-2 portfolio inventory. Projects is already a conditional page; the Design Brief proceeds
  without it if no publishable inventory exists.
- OQ-19 real imagery. The Design Brief may use LAHAV AI branded abstract visuals, UI/system
  screenshots where available, and clearly defined image placeholders. No fake team or customer
  stock imagery. Real images can be added later without blocking the design system.
- OQ-15 founder story. Important, but it blocks final Home/About COPY approval, not the design
  system. The founder biography must never be invented.
- OQ-1 testimonials - assume none exist.

Blocking architecture (Stage 7):
- OQ-3 booking mechanism
- OQ-4 lead destination
- OQ-7 analytics account, OQ-8 Search Console
- OQ-18 whether marketing copy is CMS-managed

Blocking copywriting:
- OQ-17 final lead form fields

Non-blocking:
- OQ-14 numeric success targets
- OQ-9 Google Business Profile

---

## 13. Acceptance criteria for V1

V1 is complete when all of the following are true:

**Conversion**
1. A visitor can book a Discovery call from any page, on mobile and desktop, without an account.
2. WhatsApp is reachable from every page and opens a conversation with the real business number.
3. The lead form validates, submits, confirms, and the submission reliably reaches the owner.
4. A failed submission shows an error and an alternative contact route.
5. Booking, WhatsApp click and form submission are all tracked as measurable events.

**Content and credibility**
6. Home, Services, CRM detail, Automations detail, About, Articles listing, Contact, Privacy Policy
   and 404 exist with approved Hebrew copy.
7. All five services appear on the Services page; CRM and Automations are presented as featured.
8. No page contains an invented client, result, metric, testimonial or logo, and Baan Thai is not
   presented as a completed case study.
9. The blog publishing capability works end to end: the authorized user can create an article,
   move it from draft to published, see it live on the Articles listing and on its own page,
   edit it after publishing, and unpublish it. Verified with at least one article, which may be
   a test article that is removed before launch.
   (Publishing 1-3 real launch articles remains SHOULD, per D7 - it is not a completion criterion.)
10. All public-facing business/marketing content, and all AI-generated content, has been reviewed
    and approved by a human before publication. Ordinary UI/system microcopy does not require
    individual word-by-word owner approval, but must still pass QA.

**Technical quality**
11. The site is fully RTL Hebrew and works correctly on mobile and desktop.
12. Keyboard navigation reaches every interactive element with a visible focus state.
13. All meaningful images have alt text; every form field has a label; heading order is correct;
    contrast passes.
14. Each page has a unique title and meta description; sitemap.xml and robots.txt exist;
    Search Console is connected and the site is indexable.
15. The site is served over HTTPS on the custom domain.

**Security**
16. The admin area requires authentication and is not reachable by an unauthenticated visitor.
17. No public form or page provides any route to modifying content.
18. At least one authorized administrator/editor account exists; only authorized users can reach
    administration and content editing; and adding further authorized users or roles later does not
    require rebuilding the website. The product must not artificially enforce exactly one account.

**Business**
19. Recurring cost is domain-only, or any exception was explicitly approved by the owner.
20. The owner can publish a new article unaided, end to end.

---

## 14. What this PRD deliberately does not decide
Visual design, layout, imagery style, component design, framework, hosting, CMS product,
authentication provider, booking tool, analytics product, form handling, and repository structure.
These belong to Stages 4-7.

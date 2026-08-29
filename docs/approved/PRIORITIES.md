# LAHAV AI - Atomic Prioritization (Stage 2)

STATUS: APPROVED (Stage 2 approved by the client)
Source: docs/REQUIREMENTS.md (R1-R20, approved)

Classification:
- **MUST** = MUST HAVE - V1. Without it, V1 cannot launch credibly or cannot generate Discovery calls.
- **SHOULD** = valuable, include only if it costs little once MUST items are done.
- **LATER** = deliberately deferred.
- **OUT** = out of scope, confirmed.

V1 definition of success: a credible, professional Hebrew site that produces qualified Discovery
calls, at close to ILS 0 recurring cost, with truthful content and a secured admin area.

---

## A. Conversion - the core of V1

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| A1 | Book a Discovery call from the site | MUST | R1, R2 | The single primary action of the whole site |
| A2 | Primary "Book a Discovery call" CTA present on every page | MUST | R2 | |
| A3 | WhatsApp contact as secondary CTA | MUST | R2, R15 | Israeli SMB buyers expect it |
| A4 | Contact / lead form (name, business, phone/email, need) | MUST | R15 | Fallback for people who will not book yet |
| A5 | Lead reaches the owner reliably and is not lost | MUST | R15 | Delivery is a MUST; the mechanism is Architecture's call |
| A6 | Form validation + clear success/error state | MUST | R15 | A silently failing form kills the only goal |
| A7 | Spam protection on the form | MUST | R20, R15 | Free options exist; without it the inbox drowns |
| A8 | Thank-you / confirmation state after submission | MUST | R15 | Also the only reliable conversion-tracking hook |
| A9 | Auto-reply email to the lead | SHOULD | R2 | Nice trust signal, not required to launch |
| A10 | Lead pushed into a CRM | LATER | R15, OQ-4 | No CRM chosen; launch volume does not justify it |
| A11 | Multiple booking types (short call / full consult) | LATER | - | Complexity with no V1 benefit |

## B. Trust and credibility - the hardest V1 problem

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| B1 | Clear positioning: who we are, who we help, what pain we solve | MUST | R1, R3, R5 | |
| B2 | About / who is behind LAHAV AI (real person, real story) | MUST | R2, R9 | With no case studies, this carries the trust load |
| B3 | Explicit work process / methodology (how a project actually runs) | MUST | R9 | Approved substitute for missing social proof |
| B4 | Capabilities and technologies we genuinely work with | MUST | R9 | Truthful, no invented claims |
| B5 | Real screenshots of systems actually built, where permitted | SHOULD | R9, OQ-2 | Depends on the portfolio inventory |
| B6 | Projects / Work section | SHOULD | R14, OQ-2 | See challenge C-1 |
| B7 | Project detail page | SHOULD | R14 | Only if B6 has real content |
| B8 | Testimonials | LATER | OQ-1 | None confirmed to exist. Never invented (R9) |
| B9 | Client logo wall | LATER | R9 | Requires permission we do not have |
| B10 | Metrics / ROI claims | OUT | R9 | Forbidden without real, approved data |
| B11 | Baan Thai as a completed case study | OUT | R9 | In progress. Not presentable as complete |
| B12 | Awards / certifications / partner badges | OUT | R9 | None confirmed |

## C. Services

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| C1 | Present all five service lines | MUST | R7 | CRM, automations, websites, apps, AI content |
| C2 | Each service framed by business pain and outcome, not technology | MUST | R5 | |
| C3 | Services overview page | MUST | R14 | |
| C4a | Dedicated detail pages for CRM and Automations | MUST | D-1 (approved) | The two featured services |
| C4b | Dedicated detail pages for Websites / Apps / AI Content | SHOULD | D-1 (approved) | Post-launch unless the PRD finds a strong reason |
| C5 | No public price list | MUST | R8 | A constraint to enforce, not a feature |
| C6 | CRM + Automations are the two primary/featured services | MUST | D-1 (approved) | No longer a recommendation - an approved decision |
| C7 | Service comparison / packages table | OUT | R8 | Contradicts custom pricing |

## D. Content engine

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| D1 | Blog / Articles listing page | MUST | R11 | |
| D2 | Article page | MUST | R11 | |
| D3 | Create / edit / publish articles through a CMS | MUST | R11 | Technology undecided |
| D4 | Draft vs published state | MUST | R10 | Enforces human approval before publishing |
| D5 | AI assistance in drafting articles | MUST | R11 | Assistance in the workflow, not a site feature |
| D6 | Human approval before any publish | MUST | R10 | |
| D7 | 1-3 real articles live at launch | SHOULD | R16 | An empty blog looks abandoned |
| D8 | Categories / tags | SHOULD | R11 | Only worth it past ~10 articles |
| D9 | Article search | LATER | - | Pointless at low volume |
| D10 | Comments | LATER | - | Moderation burden, no business value |
| D11 | Newsletter signup | LATER | R19 | Explicitly not wanted "just because" |
| D12 | Autonomous generate-and-publish system | OUT | R11 | Confirmed out of scope |

## E. SEO

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| E1 | Crawlable, indexable site | MUST | R16 | |
| E2 | Unique title + meta description per page | MUST | R16 | |
| E3 | Correct heading hierarchy | MUST | R16, R17 | Serves SEO and accessibility together |
| E4 | Clean, readable Hebrew-intent URLs | MUST | R16 | Hard to change after launch |
| E5 | One clear search intent per main page | MUST | R16 | |
| E6 | Internal linking between services, articles and CTAs | MUST | R16 | |
| E7 | sitemap.xml + robots.txt | MUST | R16 | |
| E8 | Open Graph / social share preview | SHOULD | R16 | Matters when links are shared in WhatsApp |
| E9 | Structured data (Organization / LocalBusiness) | SHOULD | R16 | |
| E10 | Google Search Console connected | MUST | R16, OQ-8 | Free; the only way to see indexing truth |
| E11 | Large keyword research / content campaign | LATER | R16 | Must not delay launch |
| E12 | Google Business Profile | LATER | OQ-9 | Valuable, but a separate marketing task |

## F. Accessibility and quality (R17)

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| F1 | Semantic HTML structure | MUST | R17 | |
| F2 | Full keyboard navigation | MUST | R17 | |
| F3 | Sufficient color contrast | MUST | R17 | Constrains how the brand palette is applied |
| F4 | Alt text on all meaningful images | MUST | R17 | |
| F5 | Labels on every form field | MUST | R17 | |
| F6 | Visible focus states | MUST | R17 | |
| F7 | Correct RTL Hebrew support throughout | MUST | R6, R17 | |
| F8 | Verify the legal accessibility obligation before launch | MUST | NV-1 | A verification task, not a feature |
| F9 | Accessibility statement page | SHOULD | NV-1 | Depends on F8's outcome |
| F10 | Third-party accessibility overlay widget | OUT | R13, R17 | Recurring cost, does not deliver real accessibility |
| F11 | Formal WCAG audit / certification | LATER | NV-1 | Only if F8 shows it is required |

## G. Platform and operations

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| G1 | Responsive: mobile-first, works on desktop | MUST | R3, R5 | Israeli SMB traffic is mobile-heavy |
| G2 | Fast load on mobile data | MUST | R19 | |
| G3 | HTTPS / SSL | MUST | R20 | Free everywhere |
| G4 | Custom domain live | MUST | OQ-6 | The one accepted expense (R13) |
| G5 | Authenticated, access-controlled admin area | MUST | R20 | No obscurity-based protection |
| G6 | One authorized admin/editor account | MUST | R20 | |
| G7 | Least-privilege: public forms cannot touch content | MUST | R20 | |
| G8 | Architecture allows adding users/roles later | MUST | R20 | Must not block; must not be built now |
| G9 | MFA/2FA on the admin account | SHOULD | P7 | Evaluate in Architecture if free and simple |
| G10 | Free analytics installed | MUST | R16, OQ-7 | Without it we cannot tell if V1 works |
| G11 | Conversion tracking (booking, WhatsApp, form) | MUST | R1 | Measures the one goal that matters |
| G12 | Custom 404 page | SHOULD | - | Cheap |
| G13 | Content backup / recovery path | SHOULD | R13 | Losing articles would be painful |
| G14 | Staging environment | LATER | R13 | Overhead a one-person site does not need yet |
| G15 | Structure that does not block adding English later | MUST | R6, R18 | A constraint, not a build task |
| G16 | Building multilingual infrastructure in V1 | OUT | R6 | |
| G17 | Internal CRM inside the website | OUT | Stage 1 out-of-scope list | |
| G18 | E-commerce / online purchase | OUT | Stage 1 out-of-scope list | |
| G19 | Client portal / login area | OUT | Stage 1 out-of-scope list | |
| G20 | Chatbot | LATER | R19 | Not "because we are an AI company" |
| G21 | Intrusive popups | OUT | R19 | |
| G22 | Heavy animations that hurt speed | OUT | R19 | |

## H. Legal

| # | Capability | Class | Source | Note |
|---|---|---|---|---|
| H1 | Privacy policy | MUST | NV-2 | The lead form collects personal data |
| H2 | Confirm the legal business identity for legal pages | MUST | OQ-10 | Blocks H1. Never invented |
| H3 | Terms of service | SHOULD | R14 | No transactions occur on the site |
| H4 | Cookie consent banner | SHOULD | NV-2 | Depends on which analytics is chosen |

---

## Challenges - things worth cutting or questioning

**C-1. Projects / Work section (B6, B7) - SHOULD, not MUST.**
The portfolio inventory is empty until OQ-2 is answered. A "Projects" page holding one in-progress
project or two clearly labelled demos can damage credibility more than having no such page.
Proposal: decide B6 only after the OQ-2 inventory arrives. Until then the trust load sits on
B2, B3, B4 - the person, the process, the real capabilities.

**C-2. A page per service (C4) - SHOULD, not MUST.**
Five service pages means five sets of Hebrew copy written, reviewed and approved before launch -
the largest content cost in V1 and the most likely cause of delay. They do carry real SEO value (E5).
Proposal: launch with a strong services overview plus a deep page for the 1-2 leading services,
and add the rest as copy is approved. This is where REC-1 (C6) becomes practical rather than theoretical.

**C-3. Lead-to-CRM integration (A10) - LATER.**
At launch volume, an email or WhatsApp notification is enough. A CRM integration adds cost,
another account, and a failure point, with no benefit until leads actually arrive.

**C-4. Accessibility overlay widget (F10) - OUT.**
Sold as an instant fix, carries a recurring fee, and does not produce real accessibility.
F1-F7 done properly at build time is cheaper and better.

**C-5. Article count at launch (D7) - SHOULD.**
The blog engine is a MUST (R11); a full content pipeline is not. Three good articles beat fifteen
rushed ones, and zero articles makes a live blog look dead.

**C-6. What could actually delay launch.**
Not technology - content and facts. The real critical path is: OQ-10 legal name (blocks H1),
OQ-6 domain (blocks G4), OQ-5 WhatsApp number (blocks A3), OQ-2 portfolio inventory (blocks B5/B6),
and approved Hebrew copy (R10).

---

## Proposed V1 in one sentence
A fast, accessible, Hebrew RTL site with a home page, a services overview, one or two deep service
pages, a genuine About and process story, a CMS-driven blog with a few real articles, and three
routes to contact - book a Discovery call, WhatsApp, or a form - behind a properly secured admin
area, on a custom domain, at close to ILS 0 recurring cost.

## Approved decisions recorded in Stage 2

**D-1 (approved): Featured services for V1.**
CRM Systems and Business Automations are the two primary/featured services. They may receive
dedicated service detail pages in V1. Website Development, Application Development and AI Content
Creation must still appear clearly on the Services page, but their dedicated detail pages are
SHOULD / post-launch unless the PRD identifies a strong reason to include them in V1.
This supersedes REC-1 / P1, which are now closed.

All six scope challenges C-1..C-6 were approved as proposed.

## Counts
MUST 45 | SHOULD 16 | LATER 15 | OUT 15

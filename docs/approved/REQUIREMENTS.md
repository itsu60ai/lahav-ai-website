# LAHAV AI - Requirements

STATUS: DISCOVERY COVERAGE COMPLETE - awaiting Stage 1 approval
Open questions below are factual lookups carried forward; they do not block prioritization.

Every item lives in exactly one section below.
Nothing moves to CONFIRMED REQUIREMENT without explicit approval.

## CONFIRMED REQUIREMENTS

### R1 - Primary business goal
The website must convert relevant visitors into qualified leads who book a Discovery call,
by building trust and demonstrating LAHAV AI's ability to build real AI systems and software
solutions for businesses.

### R2 - Conversion priority order
1. Book a Discovery call (PRIMARY conversion)
2. Build trust and credibility
3. Present services and projects
4. Capture leads via form / WhatsApp for visitors not ready to book a call immediately

Implication (not yet a design decision): the Discovery call is the single primary CTA;
form and WhatsApp are the secondary/fallback path.

### R3 - Target audience (segment)
Not locked to a single niche in V1. Target = businesses that can gain clear value from improving
processes via CRM, automations, websites, apps and custom AI solutions.
The site must speak to businesses suffering from: manual processes, lack of order, operational
overload, poorly handled leads, or a need for a custom system.

### R4 - Company size
Primary: small and medium businesses, ~2-50 employees.
Do not exclude serious solo operators or larger companies where there is a fit.

### R5 - Buyer persona / tone
Decision maker: owner, CEO, operations manager, or marketing manager who feels the business pain.
Site language must be business-plain, not overly technical.
Message pillars: results, order, time saved, control, growth.

### R6 - Language and geography (V1)
V1: Israel focus, Hebrew site (RTL).
English / international is LATER, not a V1 requirement.
Constraint carried forward: build so that adding English later is easy (structure must not block it).


### R7 - Service lines (V1)
Five core services, all real and actively sold:
1. Smart CRM systems
2. Business automations
3. Website development
4. App development
5. AI-powered content creation for businesses
No single service is locked as the hero service in V1.

### R8 - Pricing
No price list on the site. Pricing is custom per business and determined after Discovery and scoping.
The site's job is to drive a Discovery call, not a direct purchase.

### R9 - Integrity of proof (HARD RULE)
The site must be 100% truthful. Never invent experience, clients, results, ROI numbers, or testimonials.
No client name, metric, or testimonial may appear without explicit permission.
Baan Thai is IN PROGRESS - it must NOT be shown as a completed project or a results case study
until it is genuinely complete and cleared for publication.
If V1 launches without enough real case studies, acceptable substitutes are:
- real systems we actually built, where publication is permitted
- demo / concept projects, clearly labeled as such
- process, methodology, capabilities, and real screens instead of invented social proof

### R10 - Content production workflow
AI drafts -> human review -> approved content -> publish.
No unapproved content may be published automatically. Applies to all site copy and articles.

### R11 - Blog / Articles (V1)
- Blog / Articles capability = REQUIRED FOR V1
- Create, edit and publish articles through a CMS = REQUIRED
- AI assistance in drafting articles = REQUIRED
- Human approval before publishing AI-generated content = REQUIRED
Purpose: future SEO, authority building, lead generation. Keep V1 simple.
Technical implementation is deliberately undecided (Architecture stage).


### R12 - Brand direction (approved)
Colors:
- Deep Navy #0B1530
- Royal Blue #1D4ED8
- Electric Blue #2997FF
- Cool Gray #F2F4F7
- White #FFFFFF
Main gradient: #0B1530 -> #1D4ED8 -> #2997FF
Typography:
- Hebrew headings: Heebo
- Hebrew body: Assistant
- English display: Sora
- English body/UI: Inter
Brand name: LAHAV AI
Logo and brand assets exist and will be supplied at the Design stage.
Legal business identity for Terms/Privacy is NOT known - must never be invented.

### R13 - COST CONSTRAINT (HARD, business constraint)
The site must cost as little as possible to build and operate.
Target ILS 0 where reasonably possible for: development tools, hosting, CMS, database,
analytics, forms, scheduling, SSL, deployment, recurring software.
Accepted expense: domain purchase / renewal.
Rules:
- Do NOT purchase or default-recommend any paid service.
- If a paid service is genuinely necessary: (1) explain why free options fail,
  (2) show cheapest viable option, (3) show recurring cost, (4) get explicit approval
  before it enters the architecture.
- Do NOT sacrifice basic reliability, security, ownership or maintainability to save money.
Goal: professional production site at the lowest practical recurring cost, ideally domain-only.
Applies at the Architecture stage. No technical choices are made now.

### R14 - Candidate pages (NOT approved IA)
Currently imagined by the client, to be resolved in the PRD:
Home, Services, per-service page (only if justified), Projects/Work, Project Detail,
About, Blog/Articles, Article page, Contact / Book Discovery.
Possibly: Privacy Policy, Terms - only if genuinely required.
Rule: do not add pages merely because other sites have them.

### R15 - Lead capture (mechanism-agnostic)
- Discovery call = primary CTA
- WhatsApp = important secondary CTA
- Contact / lead form = required
- Preference: no custom internal CRM in V1 unless a real need appears; simple and cheap wins
- WhatsApp business number will be supplied later and must never be invented


### R16 - SEO (V1)
Foundational + targeted SEO = REQUIRED FOR V1:
- Site built to be correctly crawled and indexed by Google
- Every main page has a clear search intent
- Titles / meta descriptions / headings / URLs / internal linking properly defined
- Service pages written with relevant Hebrew search queries in mind
- Blog / Articles extend SEO after launch
Large-scale SEO / content campaign = LATER. Launch must not be delayed by mass content or deep research.

### R17 - Accessibility
Accessibility-first implementation = CONFIRMED REQUIREMENT:
correct semantic HTML, keyboard navigation, sufficient contrast, image alt text, form labels,
visible focus states, ordered headings, solid RTL support.
IMPORTANT: We must NOT claim legal compliance with any specific standard before verifying
what actually applies to this business. Legal accessibility obligation = NEEDS VERIFICATION (NV-1),
to be checked before launch.

### R18 - Future-proofing (must not be blocked)
CONFIRMED as future directions to avoid blocking:
- adding an English version later
- adding new services
- adding real projects / case studies as they become available
- growing the blog and content over time
RECOMMENDATION / LATER (not approved requirements):
- dedicated campaign / service landing pages
- productized AI systems sold in a more structured way
No infrastructure may be built in V1 merely to "be ready" for these.

### R19 - Design preferences (preferences, not hard requirements)
- avoid intrusive popups
- avoid heavy animations that hurt speed or UX
- no newsletter signup just because it is conventional
- no chatbot just because we are an AI company
May be reopened later if a real business purpose emerges.


### R20 - Access control and security (CONFIRMED)
- The public website is publicly viewable; visitors never need to log in.
- Website administration and content editing must NOT be publicly accessible.
- Only explicitly authorized administrator/editor accounts may reach the CMS/admin area and
  modify website content.
- Unauthorized users must have NO ability to create, edit, publish, delete or otherwise modify content.
- Administrative access must use proper authentication and appropriate access control.
- Security is a real requirement, not "security through obscurity" - hiding an admin URL is NOT security.
- Public-facing forms must provide no path to administrative privileges or content modification.
- Implementation must follow least-privilege principles.
V1 scope: one administrator/editor account is sufficient.
Architecture must not prevent adding more authorized users/roles later.
Authentication technology, CMS and implementation method are deliberately NOT chosen here -
they belong to the Architecture stage.
Recommendation to evaluate later (NOT a selected technology): if MFA/2FA is available in the
chosen solution without unnecessary cost or complexity, prefer enabling it.


## OPEN QUESTIONS
2. Who exactly is the target audience for these Discovery calls?
   (industry, company size, role of the person, geography, language)

## RECOMMENDATIONS
- REC-1: Consider giving CRM and Automations higher prominence than the other three services.
  NOT an approved requirement. To be revisited in Prioritization/PRD.

## NEEDS VERIFICATION
- NV-1: Israeli web accessibility regulation (commonly referenced as IS 5568 / WCAG 2.0 AA
  under Israeli equal-rights accessibility regulations) may legally apply to a business website
  serving Israeli customers. NOT confirmed for this business. Must be verified before we decide
  whether accessibility compliance is a V1 requirement or a LATER item.
- NV-2: Whether a privacy policy is legally required given the lead form collects personal data.

## OUT OF SCOPE (V1, confirmed)
- Internal CRM system as part of the website
- Autonomous AI system that publishes content without human approval
- English version in V1
- E-commerce / store
- Login area / client portal
- Fixed price list or buying a project directly on the site

## LATER (not V1, explicitly deferred)
- English language version / multilingual site
- International (non-Israel) audience targeting
- Large-scale SEO / content campaign
- Campaign or service-specific landing pages
- Productized AI systems sold in a structured way

## EXPLICITLY OUT OF SCOPE
(none yet)

---

## Discovery checklist
- [x] Business goals
- [x] Target audience
- [x] Primary conversion goal
- [x] Secondary conversion goals
- [x] Services
- [~] Required pages (candidates listed, IA not approved)
- [x] Content requirements (AI drafts -> human approval)
- [~] Projects / portfolio (rules set; actual showable list still open)
- [x] Blog / content (required V1, CMS-managed)
- [~] Contact and lead capture (CTAs confirmed; mechanism open)
- [x] Languages (V1 Hebrew only; English = LATER)
- [x] SEO requirements
- [x] Admin / CMS requirements (CMS-managed articles required; tech undecided)
- [~] Integrations (needs: booking tool, WhatsApp, analytics - all open)
- [~] Analytics (required, free only; account existence open)
- [x] User roles / access control (R20: single authorized admin/editor; no public accounts)
- [~] Legal requirements (NV-1 accessibility, NV-2 privacy policy, OQ-10 legal entity)
- [ ] Hosting / domain constraints
- [x] Future requirements
- [x] Out-of-scope items

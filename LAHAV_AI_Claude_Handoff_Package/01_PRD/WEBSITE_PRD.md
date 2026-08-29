# LAHAV AI Website PRD

**Design-stage source of truth**

This document defines WHAT the website must communicate and which pages are required. The LAHAV AI Brand Book and official logos define the brand. External reference websites are inspiration only, never a source of facts or branding.

## 1. Product Goal and Audience

- Primary goal: convert relevant visitors into qualified Discovery calls.
- Secondary goals: build credibility and trust, explain the agency services clearly, demonstrate a structured business-first approach, and provide secondary contact through WhatsApp or a contact form.
- Primary audience: owners, CEOs, operations leaders and marketing decision-makers in Israeli small and medium businesses, primarily organizations of roughly 2-50 employees.
- V1 language: Hebrew. The website must be designed natively for RTL. English is a later-stage expansion, not part of V1.

## 2. LAHAV AI Services

1. מערכות CRM חכמות - AI CRM systems
2. אוטומציות עסקיות - Business automations
3. פיתוח אתרים - Website development
4. פיתוח אפליקציות - Application development
5. יצירת תוכן באמצעות AI - AI content creation for businesses

CRM systems and Business Automations are the two featured services in V1 and should receive more depth and visual emphasis than the other three services.

No public fixed pricing. Pricing is discussed only after Discovery / specification.

## 3. Brand and Visual Authority

- The LAHAV AI Brand Book is the authority for visual identity.
- Use only official LAHAV AI logo assets. Never reconstruct the logo as plain text.
- Hebrew headings: Heebo. Hebrew body/UI: Assistant.
- Premium, modern, intelligent, structured, trustworthy and business-oriented.
- Avoid generic AI/SaaS cliches: robots, AI brains, cyberpunk, matrix effects, excessive glow, generic 3D blobs, fake dashboards and fake social proof.
- Prefer branded system diagrams, process maps, interface-inspired compositions, geometric brand visuals, approved imagery and intentional whitespace.
- Directional process/forward arrows in Hebrew must respect RTL progression. Non-directional icons such as WhatsApp, phone, search and settings are not mirrored.

## 4. External Visual Inspiration Policy

STG reference: https://stgltd.com/ai/

Reference websites are inspiration for design ambition, editorial composition, typography, page rhythm, transitions, visual storytelling and technology/system graphics only. Do not copy branding, colors, copy, claims, clients, imagery, layouts verbatim or factual content.

## 5. V1 Information Architecture

Required public pages in the original PRD:
- Home
- Services
- CRM Service Detail
- Business Automations Service Detail
- About
- Articles / Blog Index
- Article Template
- Contact / Book Discovery
- Privacy Policy
- 404

**Scope update:** see `SERVICE_PAGE_SCOPE_ADDENDUM.md`; V1 now also contains dedicated Website Development, Application Development and AI Content Creation service detail pages.

Conditional page: Projects / Work and Project Detail only if at least two genuine publishable items are available. Do not fabricate projects to fill this section.

Accessibility statement is conditional on legal verification. Terms can be added later if needed and are not a core design priority for V1.

## 6. Global Navigation and Conversion

Desktop navigation should contain up to five primary items plus the main CTA:
- בית
- שירותים
- אודות
- מאמרים
- צור קשר

Primary CTA: **קביעת שיחת Discovery**

Secondary CTA: **שיחה בוואטסאפ**

A contact form is required. No persistent floating WhatsApp button in V1.

If there are no real approved articles at launch, hide the Articles item from main navigation and Home article preview rather than showing an empty or fabricated blog. The Blog/CMS capability still remains part of the product.

## 7. Page Requirements

### Home
- Clearly communicate what LAHAV AI does and why a business should continue exploring.
- Present all five services, with CRM and Business Automations featured more prominently.
- Show the business-first approach: understand the process before choosing technology.
- Show a structured delivery journey: Discovery, specification, planning, build, testing, delivery/onboarding.
- Include a strong visual expression of connected business systems/processes without using fake client data.
- Provide an About/founder trust area without inventing biography or team information.
- Provide an articles/knowledge design pattern that can be hidden if no real articles exist.
- End with a strong Discovery CTA and WhatsApp as secondary action.

### Services
- Explain the five LAHAV AI service disciplines clearly.
- Give CRM and Business Automations more visual and content depth.
- Do not present every service as identical cards if a more expressive composition is possible.
- Keep the focus on solving business processes rather than selling technology for its own sake.

### CRM Service Detail
- Explain scattered lead/customer information, missed follow-ups, lack of visibility and disconnected processes.
- Communicate a lead-to-customer lifecycle and a central system of records/workflows.
- Support concepts such as leads, customers, opportunities, tasks, follow-up, documents, processes and management visibility.
- Show how automation may support CRM workflows without implying specific integrations that have not been verified.
- Show LAHAV AI's structured CRM delivery process and end with Discovery / WhatsApp CTAs.

### Business Automations Service Detail
- Explain repetitive manual work, copying information, manual tasks/reminders and follow-ups dependent on memory.
- Communicate: trigger/event -> condition/logic -> action -> update -> next step.
- Show generic connected-system concepts without naming unverified platforms or integrations.
- Communicate that some steps remain human: review, approval, decision-making and exception handling.
- Show monitoring/control: what ran, failed, is waiting or requires attention.
- Show LAHAV AI's automation delivery process and end with Discovery / WhatsApp CTAs.

### About
Approved company copy is in `05_CONTENT_RULES/APPROVED_COPY.md`. Founder biography, founder story and approved personal photography are not yet verified. Reserve an area if useful; do not invent details.

### Articles / Blog Index
- Create a credible knowledge/content index pattern for real articles.
- Do not fabricate article performance, dates, authors, categories or published content as factual claims.
- Production requires CMS create/edit/publish capability and human approval before publishing AI-drafted content.

### Article Template
- Readable Hebrew-first editorial layout.
- Clear title, metadata area, article body, visual/media support, related-content pattern and CTA.
- Design for long-form readability and accessibility, not only visual impact.

### Contact / Book Discovery
- Primary objective is booking/starting a Discovery conversation.
- Include a simple contact form and secondary WhatsApp path.
- Do not invent phone numbers, email addresses, physical addresses, response-time promises or scheduling providers.

### Privacy Policy
- Create a clean legal-content template. Final legal text is not provided and must not be invented as approved legal language.

### 404
- Create a branded, simple 404 state with a clear route back to the website. Do not over-design it.

## 8. Content Safety and Truth Rules

- Never invent clients, client logos, testimonials, case studies or project results.
- Never invent ROI, percentages, metrics, statistics, revenue, hours saved or performance claims.
- Never invent awards, certifications, years of experience, number of projects, implementation timelines or pricing.
- Do not represent Baan Thai or any in-progress work as a completed case study or proven result.
- Do not invent external platform integrations, API support or technical capabilities that have not been verified.
- Temporary generic copy is acceptable only as clearly non-factual design filler and must be reviewed before implementation.
- All public business/marketing copy and AI-generated content requires human review before publishing.

## 9. Design and Experience Requirements

- Native Hebrew RTL across desktop and mobile.
- Responsive layouts preserve the same content hierarchy and page purpose across device sizes.
- Accessibility-first: strong contrast, readable type, visible focus states, clear labels and sensible interaction patterns.
- Use semantic success/error colors only functionally; do not turn them into general brand colors.
- No intrusive popups, heavy animation or decorative effects that reduce clarity/usability.
- The site should feel visually rich and distinctive, but clarity, hierarchy and business comprehension come first.

## 10. Implementation Handoff

Stitch established the page structures and design concepts. Claude Code now handles architecture, reusable components, final RTL behavior, responsiveness, accessibility, content cleanup, technical QA and a controlled visual upgrade. Stitch is a structural baseline, not the visual ceiling.

# LAHAV AI - Design Brief (Stage 4)

STATUS: APPROVED (Stage 4), including design decisions D-Q1..D-Q5 below
Sources of truth: docs/PRD.md v1.2 (approved), docs/REQUIREMENTS.md (R1-R20), docs/PRIORITIES.md (D-1), brand direction R12

This brief defines how the approved product should look and behave visually.
It introduces no new product scope, chooses no technology, and contains no Stitch prompts.
Where an asset or fact does not exist, it defines a placeholder - it never invents one.

---

## 1. Visual direction

### 1.1 The core idea
**Clarity as proof.** LAHAV AI sells order to businesses drowning in disorder. The site must
therefore *be* the demonstration: calm, structured, unhurried, obviously well built. A visitor
should feel the competence before reading a word of it.

This matters more here than on most sites. With no testimonials, no client logos and no results
to show (R9, B8-B12), the visual execution is a substantial part of the credibility argument.
An amateur-looking site is not a cosmetic problem for V1 - it is a conversion failure.

### 1.2 Personality
| Attribute | How it shows up visually |
|---|---|
| Premium | Generous space, restraint, precise alignment, few but deliberate effects |
| Modern | Clean geometry, large type, flat surfaces with soft depth |
| Intelligent | Structure and hierarchy do the talking; diagrams over decoration |
| Business-oriented | Outcome-led headlines, readable body text, no jargon styling |
| Clean | Few elements per screen, one idea per section |
| Trustworthy | Consistency, honest labelling, no dark patterns, no exaggeration |
| Technologically advanced | Real interfaces and system visuals - not sci-fi imagery |

### 1.3 What this is not
Not a generic AI template. Concretely prohibited:
- fake customer or team stock photography (R9 spirit)
- robots, glowing brains, neon circuit boards, humanoid androids, "matrix" motifs
- excessive futuristic clichés and sci-fi framing
- heavy animation, parallax stacks, animated gradients that never rest (R19, G2)
- clutter, or a generic SaaS-template appearance
- any visual that implies a capability LAHAV AI does not offer (R9)

### 1.4 The single design test
Applied to every screen before approval:
*"Would an Israeli business owner with 30 employees look at this and think - these people would
bring order to my business?"*
If a visual element does not serve that impression, it is removed.

---

## 2. Color system

### 2.1 Approved palette (R12 - fixed)
| Token | Value | Role |
|---|---|---|
| Deep Navy | #0B1530 | Primary dark surface, headings on light, footer, gradient start |
| Royal Blue | #1D4ED8 | Primary action color, links, key accents |
| Electric Blue | #2997FF | Highlight, focus, gradient end, accents on dark |
| Cool Gray | #F2F4F7 | Alternating section background, card surfaces, dividers |
| White | #FFFFFF | Base background, text on dark |
Main gradient: #0B1530 -> #1D4ED8 -> #2997FF

### 2.2 Usage rules
- Default page background: White. Alternate sections use Cool Gray to separate rhythm without borders.
- Deep Navy is used for the footer and for a small number of deliberate dark sections
  (hero and/or the closing conversion block). Dark sections are punctuation, not the default.
- Royal Blue owns the primary action. Nothing else on the page may be Royal Blue-filled, so the
  primary CTA is never in visual competition.
- Electric Blue is an accent and focus color. It is never a large flat background for body content.
- The gradient is used sparingly - at most one prominent instance per page (typically the hero or
  the closing CTA band), plus fine details such as a rule or an icon accent. It must never sit
  behind long body text.

### 2.3 Contrast rules (F3, R17)
Measured against the approved palette:
- Deep Navy on White ~18:1 - safe for all text.
- Royal Blue on White ~6.6:1 - safe for body text, links and buttons.
- **Electric Blue on White ~3:1 - NOT permitted for body text.** Allowed only for large display
  text (24px+ bold), icons, borders, and focus rings.
- Electric Blue on Deep Navy ~6:1 - safe for text and links on dark sections.
- White on Royal Blue ~4.6:1 - safe for button labels at 16px+.
Every new color pairing must be checked before it enters a design.

### 2.4 Semantic colors (D-Q1 - APPROVED)
Semantic success/error colors sit outside the core brand palette and are used only where
functionally required - never decoratively, and never as general brand colors.
- Success: #15803D
- Error: #B91C1C
Restrained and accessible rather than bright. Values may be adjusted during design or QA for
accessibility, but must remain clearly distinguishable from each other and from Royal Blue.

---

## 3. Typography

### 3.1 Approved families (R12 - fixed)
| Use | Family |
|---|---|
| Hebrew headings | Heebo |
| Hebrew body | Assistant |
| English display | Sora |
| English body / UI | Inter |

V1 is Hebrew (R6), so Heebo + Assistant carry the site. Sora and Inter apply to Latin fragments -
brand name, technology names, code-like labels - and are reserved for the future English version
(R18) without being built now (G16).

### 3.2 Scale principles
- One H1 per page, always the page's real subject (E3).
- A clear step between levels; no two heading levels that look nearly identical.
- Body text no smaller than 16px on mobile; long-form article text larger, around 18px.
- Line length for reading content capped near 65-75 characters.
- Line height generous for Hebrew: roughly 1.6-1.75 for body, tighter for headings.
- Weights: headings bold, body regular. Light weights are prohibited for Hebrew body text -
  they degrade legibility.
- No text-transform tricks; Hebrew has no case, and forced letter-spacing harms readability.

### 3.3 Hebrew typography quality bar
Hebrew set badly is the fastest way to look unprofessional to this audience. Required:
correct vertical rhythm, no clipped descenders, no justified text, no all-caps Latin styling
applied to Hebrew, and numbers rendered consistently (Hebrew text with Latin numerals is normal
and expected).

---

## 4. RTL design requirements (R6, F7)

RTL is not a mirroring afterthought; it is the native direction of the design.
- Reading order flows right to left. Content starts at the right edge; the eye lands top-right.
- Navigation, logo placement, and CTA order follow the RTL convention: the logo sits at the
  right of the header, the primary CTA at the left end of the header bar.
- Icons that indicate direction (arrows, chevrons, "next", "back", carousel controls) must be
  mirrored. Icons that do not (search, phone, WhatsApp, calendar, checkmark) must not.
- Progress and step indicators run right to left.
- Lists, bullets, form labels, checkbox and radio markers align right.
- Text alignment is right by default. Centered text is used only for short hero and section
  headings, never for paragraphs.
- Latin strings inside Hebrew sentences (LAHAV AI, CRM, WhatsApp) must not break the line
  direction or produce stray punctuation on the wrong side.
- Mixed-direction fields matter in forms: phone numbers, emails and URLs are LTR content inside an
  RTL layout, and must be entered and displayed correctly.
- Every design deliverable is produced in RTL. An LTR mock-up is not an acceptable substitute.

---

## 5. Spacing, layout and grid

### 5.1 Spacing
A single spacing scale based on 4px steps (4, 8, 12, 16, 24, 32, 48, 64, 96). No arbitrary values.
Vertical space between sections is generous - space is the main premium signal available to us,
and it costs nothing in performance (G2).

### 5.2 Container and grid
- Content container max width around 1200px, centered, with 24px gutters on desktop and 16px on mobile.
- A 12-column grid on desktop, 8 on tablet, 4 on mobile.
- A narrower reading measure (around 720px) for article body and long-form text.
- Full-bleed backgrounds are permitted; content inside them stays within the container.

### 5.3 Section rhythm
The page alternates: white section -> gray section -> white, with occasional navy punctuation.
Every section has: one heading, one idea, optional supporting element, and - where appropriate -
a route toward conversion. No section may contain two competing calls to action.

---

## 6. Header and navigation

- Sticky header on scroll, compact height, so the primary CTA is always reachable (A2).
- Contents, in RTL order: logo (right) · main navigation (center) · primary CTA button (left).
- Main navigation: Home · Services · About · Articles · Contact (PRD 5.1). Maximum five items.
- Service detail pages (D-Q5 - APPROVED: no dropdown in V1). The header carries no Services
  dropdown. Navigation stays simple. The CRM and Business Automations detail pages are reached from
  the Services page, from the Home service cards, and from relevant contextual links. A dropdown is
  reconsidered only if later usability evidence shows a real need.
- Mobile: logo + hamburger. The opened menu shows navigation, the primary CTA, and WhatsApp,
  in that priority order. It must trap focus and close on Escape (F2).
- The current page is visually indicated, not by color alone.
- WhatsApp (D-Q2 - APPROVED: NO floating button in V1). A persistent floating WhatsApp control is
  prohibited in V1, because it would risk making the secondary CTA visually dominant over the
  approved primary CTA, especially on mobile (R2). WhatsApp remains an important secondary CTA and
  appears in appropriate header/navigation contexts, in conversion sections, on the Contact page,
  and wherever contextually useful - but never floating globally above the interface.
- Footer: navigation repeat, contact details, WhatsApp, Privacy Policy link, legal identity line
  (placeholder until OQ-10), and no newsletter signup (D11, R19).

---

## 7. CTA hierarchy

Strictly three levels, applied everywhere (R2):

| Level | Action | Appearance | Rule |
|---|---|---|---|
| Primary | Book a Discovery call | Solid Royal Blue button, white label | Exactly one per screen region; present on every page |
| Secondary | WhatsApp | Outlined button, Royal Blue border and label, plus the WhatsApp icon | Always available, never louder than primary |
| Tertiary | Lead form / internal links | Text link with underline, or a quiet button | The fallback path (A4) |

Rules:
- The primary CTA appears in the header, once in the hero, and once in the closing block of
  every page. Repetition mid-page is allowed only where a section makes a complete argument.
- The three CTAs must never be presented as three equal choices side by side; that destroys the
  approved priority order.
- CTA labels are specific and honest - "קביעת שיחת Discovery", never "לחץ כאן" or "שלח".
- No CTA may promise anything not confirmed (pricing, response time - OQ-16, guarantees).

---

## 8. Buttons and forms

### 8.1 Buttons
- Three variants only: primary (filled), secondary (outlined), tertiary (text).
- One size for standard use plus one large size for hero placement; mobile buttons are at least
  44px tall and comfortably wide for a thumb.
- Every button has five defined states: default, hover, focus, active, disabled.
- The focus state is a visible ring (Electric Blue), never removed, never relying on color alone (F6).
- Disabled states must remain legible and must explain why, where relevant.

### 8.2 Forms (A4-A8, F5)
- Every field has a visible, permanent label above it. Placeholder text is never a substitute
  for a label.
- Required and optional fields are marked in text, not by color or an asterisk alone.
- Field order follows the approved content order: name, business name, phone or email, need
  (OQ-17 pending).
- Errors appear next to the field, in text, with an icon, and are announced to assistive
  technology. Error color alone is not the signal.
- Validation on blur and on submit; never destructive validation while the user is mid-typing.
- The submit button shows a clear pending state, and cannot be double-submitted.
- Success is a distinct, obvious state that states what happens next (A8), not a small toast.
- Failure shows the error and an alternative route (WhatsApp), so no lead is lost (A5).
- Spam protection must be invisible or accessible - no image puzzles that break F1-F7 (A7).
- Phone and email inputs are LTR within the RTL layout, with appropriate mobile keyboards.

---

## 9. Cards

One card system, reused everywhere: service card, article card, process step, and the future
project card.
- Structure: optional visual or icon · title · one or two lines of supporting text · one clear
  action or an entirely clickable card. Never both a clickable card and competing inner buttons.
- Surface: white or Cool Gray, soft radius (around 12-16px), subtle border or very soft shadow.
  Not both a heavy border and a heavy shadow.
- Hover: a restrained lift or border change. No scaling that shifts layout, no 3D tilt.
- Cards in a row share equal height regardless of content length.
- Featured variant: the CRM and Automations service cards carry a visible featured treatment -
  a gradient accent edge or a slightly stronger surface - to express D-1 structurally rather than
  by wording alone.

---

## 10. Section patterns

A small, fixed library, so pages are assembled rather than invented:
1. **Hero** - H1, supporting sentence, primary CTA + secondary WhatsApp, one supporting visual.
2. **Pain recognition** - 3-5 short items naming the operational problems from R3.
3. **Services grid** - five cards, CRM and Automations featured (D-1).
4. **Process / How we work** - numbered steps, RTL-ordered, no fake timelines (B3).
5. **Capability strip** - what we genuinely work with, honestly labelled (B4).
6. **Split content** - text on one side, a real screenshot or a branded diagram on the other.
7. **Founder / About block** - photograph or defined placeholder, short human text (B2, OQ-15).
8. **Articles teaser** - two or three recent articles.
9. **Closing conversion band** - the recurring end-of-page block: heading, primary CTA,
   WhatsApp, and a link to the form. Present on every page.
10. **Footer**.
Any new pattern requires approval; the goal is a coherent system, not a page-by-page invention.

---

## 11. Icons, illustration and visual language

- One consistent icon set: linear, medium weight, geometric, monochrome, colored via the palette.
  No mixed icon styles, no emoji as interface icons, no filled and outlined styles mixed at random.
- Preferred visual vocabulary: **structure made visible** - process diagrams, before/after flow
  sketches, system maps, real interface fragments, data-shaped abstractions, grid and connector
  motifs derived from the brand gradient.
- Branded abstract graphics are the default background visual: gradient fields, layered geometry,
  subtle grid patterns.
- Prohibited: robots, brains, humanoid AI figures, neon circuitry, "matrix" rain, glowing orbs,
  and generic 3D blobs (client instruction, section 1.3).
- Illustration must never depict a system or capability that does not exist (R9).

---

## 12. Image policy

Approved order of preference:
1. **Real screenshots** of systems actually built, where publication is permitted (B5, OQ-2).
   Presented honestly: cropped, legible, and never captioned as a client result unless approved.
2. **Real founder / workspace photography** (OQ-19), if it exists and is of adequate quality.
3. **Branded abstract graphics and diagrams** - the default.
4. **Defined placeholders**, where a real asset is expected later.

Prohibited: stock photography of fake teams, fake customers, handshake and boardroom clichés,
AI-generated fake people presented as real, and any image implying a client relationship that
does not exist (R9).

### 12.1 Placeholder policy (OQ-19)
Where a real asset is missing, the design defines a placeholder that is *intentional*, not an
empty box: a branded gradient panel or geometric composition that looks finished on its own, sized
to the eventual asset's aspect ratio, so a real image can replace it later with no layout change.
Placeholders must never be labelled with invented captions.
Specifically needed: founder portrait (About and Home), one to three system screenshots
(service pages), and article cover images (Articles listing).
Fallback if a founder photograph never materialises: a typographic or brand-mark composition -
never a stock photo of a stranger.

### 12.2 Technical rules for images
Alt text is mandatory for every meaningful image (F4); decorative visuals are marked as decorative.
Aspect ratios are fixed per slot to prevent layout shift (G2). Screenshots must remain legible on
mobile - crop rather than shrink.

---

## 13. Motion

Motion is a functional tool here, not a personality trait (R19, G2).
- Permitted: short fades and small vertical entrances (150-300ms), hover and focus transitions,
  menu open/close, form state changes, and a single restrained gradient movement in the hero
  if it costs nothing in performance.
- Prohibited: parallax stacks, scroll-jacking, long orchestrated sequences, auto-playing carousels,
  looping background video, and animation that delays reading content.
- Nothing important may depend on motion to be understood.
- All non-essential motion must be disabled under `prefers-reduced-motion` (F1-F7, accessibility).
- Content must be readable and interactive before any animation completes.

---

## 14. Accessibility design rules (R17, F1-F7)

These are design constraints, binding on every screen:
1. Text contrast meets AA: 4.5:1 for body, 3:1 for large text and meaningful UI boundaries.
   Electric Blue is not a body-text color on white (2.3).
2. Information is never conveyed by color alone - errors, states, required fields and the active
   navigation item all carry a second signal.
3. Every interactive element has a visible focus state that is designed, not browser-default-only.
4. Touch targets are at least 44x44px with adequate spacing.
5. Heading levels express real structure, and are never chosen for their size (E3).
6. Every form control has a visible label; error messages are text (F5).
7. The design must survive 200% text zoom without loss of content or function.
8. Layout must not depend on hover: everything reachable by hover is reachable by tap and keyboard.
9. Focus order follows the visual RTL reading order.
10. No design element may claim accessibility compliance in text until NV-1 is verified.
11. An accessibility statement page is designed as a simple text page, held ready pending NV-1 (F9).

---

## 15. Page-by-page design requirements

Each page must carry a unique title and meta description, one clear H1, the closing conversion
band, and a WhatsApp route (PRD section 6).

### 15.1 Home
Sections in order: Hero (with primary CTA) · Pain recognition · Services grid with CRM and
Automations featured · Process in brief · Founder block · Capability strip · Articles teaser
(if articles exist) · Closing conversion band.
Design notes (D-Q4 - APPROVED: dark hero): the Home hero uses Deep Navy with the approved gradient.
It must feel premium, controlled and business-oriented - no excessive glow, no cyberpunk aesthetic,
no neon AI cliches, no visually noisy gradients. The dark hero creates deliberate contrast with the
lighter sections that follow. The hero must state what LAHAV AI does, for whom, and the outcome,
within the first screen on mobile. The hero visual is a branded abstract composition or a real
system screenshot - never a stock photo. Nothing on this page may present a client, metric or testimonial.
If no articles are published at launch (D7 is SHOULD), the articles teaser is omitted rather than
shown empty.

### 15.2 Services (overview)
A single grid of five services. CRM and Automations use the featured card variant and link to
their detail pages; the other three are described clearly enough to prompt contact without a
detail page (D-1). Each card is framed as pain -> what we build -> outcome (C2).
A visible line stating that pricing follows a Discovery call (R8), styled as information, not as
a pricing block.
Design note: the visual difference between featured and non-featured cards must be clear but not
dismissive - the other three services are still being sold.

### 15.3 CRM Systems (detail)
Sections: hero specific to CRM · symptoms that indicate the need · what we actually build ·
how a project runs · what changes afterward · honest scope statement · closing conversion band.
Visual: real screenshots where permitted, otherwise a branded system diagram. Any example
scenario must be visibly labelled as illustrative (R9).

### 15.4 Business Automations (detail)
Same structure, focused on repetitive manual work, errors, and leads falling through the cracks.
The strongest visual candidate is a before/after process diagram - built from the brand geometry,
not from stock illustration.

### 15.5 About
Carries most of the credibility load (B2, B3, B4).
Sections: who is behind LAHAV AI (founder block with photograph or defined placeholder) · why the
company exists · the full work process · real capabilities · what we do not do · closing band.
Design notes: this page should feel personal and calm - more editorial, less marketing. Content is
blocked by OQ-15, but the layout does not depend on knowing the story, so the design can proceed
with clearly marked content placeholders that must never be filled with invented biography.

### 15.6 Blog / Articles listing
A simple, readable list or grid of article cards: cover (or branded placeholder), title, short
summary, date. Categories are not shown in V1 unless article volume warrants it (D8).
Empty state (D-Q3 - APPROVED): if no real approved articles exist at launch, Articles is hidden
from the main navigation, article sections are omitted from Home, and no empty blog page is shown
to visitors. The blog/CMS capability still exists and stays ready; the navigation item and the
related sections are enabled once approved articles exist.

### 15.7 Article page
Optimized for reading: narrow measure, generous line height, clear heading hierarchy, RTL-correct
lists and quotes. Elements: title, date, body, inline links to relevant services (E6), and a
closing conversion band. No comments, no share widgets beyond simple links, no related-articles
carousel in V1.

### 15.8 Contact / Book a Discovery call
The conversion destination. Structure: short heading explaining what a Discovery call is and what
happens in it · the booking route as the visual focus · WhatsApp as a clear alternative · the lead
form below · a plain statement of what happens after contact.
The booking mechanism is not chosen (OQ-3), so the design must reserve a defined region for it
that works whether it is an embedded scheduler or a link-out.
No response-time promise appears until OQ-16 is answered.

### 15.9 Privacy Policy
A plain, readable legal text page: single column, narrow measure, clear headings, no decoration.
The legal identity line is a marked placeholder until OQ-10; no compliance claim appears until
NV-2 is verified.

### 15.10 404
Brand-consistent, brief and useful: a short explanation and routes back to Home, Services and
Contact (G12). No humour that undercuts the professional tone.

---

## 16. Conditional Projects pattern (designed, not built)

Per PRD 5.2, the Projects page is not part of V1 unless OQ-2 yields at least two truthfully
presentable items. The design system must nonetheless define these patterns now, so the page can
be added later without reworking anything:

**Project card:** thumbnail (screenshot or branded placeholder) · project name or an anonymous
descriptor ("CRM system for a services company") · one-line summary · service tag · optional
status label. A visible **"בתהליך" / in-progress** status variant is required, so that a project
like Baan Thai could only ever be shown truthfully (R9).

**Project detail page:** hero with name or anonymous descriptor · context (the business problem) ·
what was built · a screenshot area · an honest status statement · closing conversion band.
The template must contain **no** slot for metrics, ROI figures, client logos, or testimonials.
Designing those slots would invite them to be filled later (B10, B8, B9).

These patterns are delivered as part of the design system. No Projects page is produced for V1.

---

## 17. Responsive behavior

- Mobile-first. The reference design width is a phone; desktop is the enhancement (G1).
- Breakpoints: mobile up to 767px · tablet 768-1023px · desktop 1024px and above.
- Grid: 4 columns mobile, 8 tablet, 12 desktop.
- Service and article grids: one column mobile, two tablet, three desktop (the five-service grid
  resolves as 2+3 or 3+2 on desktop, with the two featured services leading in RTL order).
- The header collapses to logo + hamburger below 1024px.
- Touch targets, spacing and font sizes never shrink below the accessibility floor on mobile.
- No horizontal scrolling at any width. No content is hidden on mobile that is available on desktop.
- Tables and wide diagrams scroll within their own container rather than breaking the page.
- Test matrix: 360px, 390px, 768px, 1024px, 1440px, in RTL, in both portrait and landscape on mobile.

---

## 18. Design acceptance criteria

A design is approved for build when all of the following hold:

1. Every screen is presented in Hebrew RTL; no LTR mock-up is accepted as a substitute.
2. Only the approved palette and typefaces are used; no new colors or fonts introduced.
3. Every text/background pairing passes the section 2.3 contrast rules; Electric Blue is not used
   for body text on white.
4. The primary CTA appears in the header, the hero and the closing band on every page, and is the
   only Royal Blue filled element in its region.
4b. No persistent floating WhatsApp control appears on any screen (D-Q2), and no header Services
   dropdown appears (D-Q5).
5. The three-level CTA hierarchy is respected everywhere; the three routes are never shown as
   equal peers.
6. All five services appear on the Services page, with CRM and Automations visually featured.
7. No screen contains a client name, logo, testimonial, metric or ROI figure, and no project is
   shown as complete without approval.
8. No stock photography of people, and none of the prohibited AI clichés from section 1.3.
9. Every missing asset is represented by an intentional, correctly proportioned placeholder,
   with no invented caption.
10. Every interactive element has designed default, hover, focus, active and disabled states.
11. Every form field has a visible label, and error, success and pending states are all designed.
12. Touch targets are at least 44px; the design survives 200% text zoom.
13. Directional icons are mirrored for RTL; non-directional icons are not.
14. Each page is designed at mobile, tablet and desktop widths.
15. Motion is limited to the section 13 list, and a reduced-motion variant is specified.
16. Card, button, section and form patterns are reused from the system rather than reinvented
   per page.
17. Project card and project detail patterns exist in the system, including an in-progress status
   variant and no metrics slot, while no Projects page is delivered for V1.
18. No design element implies a capability, credential or relationship that LAHAV AI does not have.

---

## 19. Design decisions - RESOLVED (Stage 4 approval)

| ID | Decision | Outcome |
|---|---|---|
| D-Q1 | Semantic colors | APPROVED. Success #15803D, Error #B91C1C. Functional use only, never brand colors. Adjustable for accessibility |
| D-Q2 | Floating WhatsApp | REJECTED for V1. No persistent floating control; WhatsApp appears contextually |
| D-Q3 | Empty blog | APPROVED. Hide Articles from nav, omit Home article sections, never show an empty blog |
| D-Q4 | Home hero | APPROVED dark hero on Deep Navy + approved gradient; premium and controlled, no glow/cyberpunk/neon |
| D-Q5 | Services dropdown | REJECTED for V1. Simple navigation; detail pages reached from Services, Home cards and contextual links |

Open questions carried from the PRD that affect content but not the design system:
OQ-15 founder story (About/Home copy) · OQ-19 real imagery (placeholders defined here) ·
OQ-2 portfolio inventory (patterns defined in section 16) · OQ-16 response-time promise ·
OQ-10 legal identity (footer and Privacy placeholder) · OQ-3 booking mechanism (region reserved).

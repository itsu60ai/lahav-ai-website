# REVIEW NOTES, V1 BATCH

Everything here is something you should decide, verify or approve. Nothing
in this list was invented to fill a gap: where a fact was missing, the page
either omits it or says plainly that it is still being defined.

---

## 1. Factual items that still need your approval

| # | Item | Where | Why it matters |
|---|---|---|---|
| F-A | **All Hebrew copy across all 13 pages** is a draft written by me against the truth rules. Approved verbatim source exists only for the About paragraphs. | Every page | R10 requires human approval before publication |
| F-B | **Service one-liners and descriptions** for all five services | Home, Services, 5 service pages | These are my wording of what you do. If any sentence overstates or misstates the offer, it must change |
| F-C | **"שיחת היכרות של 30 דקות"** framing | Home, Contact, all closing CTAs | The 30 minutes is approved (F-12). The surrounding sentence is mine |
| F-D | **"נגיד בכנות איפה יש מה לשפר ואיפה פשוט לא צריך"** | Closing CTA, site-wide | A promise about how you will behave in the call. Yours to confirm |
| F-E | **CRM page symptom list and "what we build" list** | `/services/crm` | Describes typical capability. Confirm it matches what you actually deliver |
| F-F | **Automations page: the four-step trigger model** | `/services/automations` | Presented as a general illustration with a note saying so. Confirm it is fair |
| F-G | **App development: "מתי זה מוצדק" list** | `/services/app-development` | Confirm these are situations you would actually take on |
| F-H | **Capability categories (the B4 band)** | Home | Seven discipline-level categories. No vendor names. Confirm each is genuinely something you do today |

---

## 2. Placeholders in the build

| # | Placeholder | Where | Resolves when |
|---|---|---|---|
| P-1 | **Booking region** is a defined empty region with the text "יומן ההזמנות בהקמה" | `/contact` | You approve a booking tool (O-7). Recommendation was Cal.com free, 30-minute event |
| P-2 | **Contact form is not wired.** It renders and validates visually but does not submit. A visible note says so | `/contact` | Form backend is built (stage 10) |
| P-3 | **Articles list is genuinely empty** with an honest empty state | `/articles` | Real approved articles exist (O-6, F-8) |
| P-4 | **Article page is a labelled template** with sample prose, `noindex`, not linked from anywhere | `/articles/template` | Real articles exist; it becomes the `[slug]` route |
| P-5 | **Privacy is a labelled draft** | `/privacy` | Stack is final and legal review is done (O-4) |
| P-6 | **"מאמרים" is absent from the navigation** | Site-wide | Articles exist (D-Q3) |

---

## 3. Unresolved service claims

| # | Item | Status |
|---|---|---|
| S-1 | **AI Content Creation offer is not defined.** PL-15 is still active. The page carries a visible "בהגדרה" note and describes only a workflow, never a product, never Auto Publish | **Blocks final approval of page 07 only** |
| S-2 | **No vendor, platform, framework or API is named anywhere.** Confirmed by scan across all 13 pages | Deliberate. Course curriculum stays an internal roadmap, never a public claim (PL-16) |
| S-3 | **CRM positioning** is written to cover both "we build a custom CRM" and "we build on an existing platform", without naming one | Matches your confirmed position. No vendor named |
| S-4 | **Website development** makes no promise about SEO, rankings, conversions, speed, hosting or ecommerce | Deliberate |
| S-5 | **App development** claims no native iOS, Android, framework, API or app-store capability. The page says so explicitly | Deliberate |

---

## 4. Legal items

| # | Item | Status |
|---|---|---|
| L-1 | **Privacy policy text** is honest and implementation-based but is not legal advice and makes no compliance claim | Needs legal review before launch (NV-2) |
| L-2 | **Legal identity** appears only as "Ethan Lahav · LAHAV AI". No company number, no registered office, no address anywhere | Correct per F-15 |
| L-3 | **Accessibility statement** not built | Conditional on NV-1 verification |
| L-4 | **No response time is promised** anywhere | Correct per F-16 |
| L-5 | **Cookie banner** not built | Not needed for the planned cookieless analytics. Revisit if GA4 is ever added |

---

## 5. Assets still missing

| # | Asset | Impact |
|---|---|---|
| A-1 | **Real article content**, 2 to 3 pieces | Articles section stays hidden until then |
| A-2 | **Any real project or screenshot** you are permitted to show | Would strengthen every service page. None used, none invented |
| A-3 | **Booking tool account** | Contact page booking region |
| A-4 | Founder photo | **RESOLVED.** Your photo is in place on Home and About, cropped and compressed only, 299 KB to 63 KB |

---

## 6. Deliberate deviations from the Stitch references

| # | Deviation | Reason |
|---|---|---|
| D-1 | **No page reuses the same section order.** Home, Services, each service page, About, Articles and Contact all have different compositions | Your instruction not to template the site |
| D-2 | **Hero is now a full-bleed dark stage** below large type, rather than a small illustration beside text | Your instruction: more visual impact, less noise, scale over clutter |
| D-3 | **Services index is a "start from your problem" chooser**, not a card grid | Its job is deciding, not describing |
| D-4 | **No icon rows anywhere.** Every visual is a bespoke SVG that explains a specific idea | Your instruction to avoid icon clutter |
| D-5 | **Articles page has no categories, filters or pagination** | Only 2 to 3 articles are planned. A filter system would imply a large archive |
| D-6 | **All Stitch HTML discarded.** Tailwind CDN, 32 remote Stitch-hosted image URLs and a Material icon font were not carried into production | Asset Policy and performance |
| D-7 | **Stitch factual content discarded**, including an invented email and address and a "© 2024" | Truth rules |

---

## 7. Things I am unsure about, flagged rather than decided

| # | Item |
|---|---|
| U-1 | **Process step 6, "אתם מקבלים מערכת שאתם יודעים לתפעל לבד"** implies a training outcome. You scoped the earlier correction to step 5 only, so I left it. Want it softened? |
| U-2 | **The Home page is long** (about 9,150px desktop). It earns the length, but if you want it tighter the explainer or the pain section could merge |
| U-3 | **"תחומים שאנחנו עובדים בהם"** as the B4 label. It is honest but plain. A better line may exist |
| U-4 | **Article template sample prose** is written by me purely to show the reading experience. It is labelled and unpublished, but if you would rather it were lorem-style filler, say so |
| U-5 | **Services chooser wording** states five problems in the owner's voice. These are assumptions about how your buyers describe their pain, and worth a sanity check |
| U-6 | **The `/system` design-system page** is still in the build as an internal reference. It is `noindex` and unlinked. Remove before launch, or keep as an internal tool? |

---

## 8. What I did not do

- Did not build Projects, an accessibility statement, or Terms
- Did not name any tool, vendor or platform
- Did not wire the form, the CMS, the AI article engine, analytics or deployment
- Did not invent a single client, metric, integration, timeline or credential
- Did not mark anything as finally approved

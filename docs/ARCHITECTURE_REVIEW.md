# LAHAV AI Website — Architecture + Implementation Review

STATUS: CURRENT — revision 2. Updated for final decisions F-1..F-18. No implementation has started.
Date: 2026-08-29
Sources read: `00_START_HERE/*` (all), `01_PRD/WEBSITE_PRD.md`, `01_PRD/SERVICE_PAGE_SCOPE_ADDENDUM.md`,
`02_BRAND/BRAND_RULES.md` + logo assets, `04_VISUAL_DIRECTION/*`, `05_CONTENT_RULES/*`,
`06_ARCHITECTURE_AND_QA/*`, and all 13 `03_STITCH_FINAL/*/` folders (NOTES, `stitch-source.html`,
`stitch-reference.png`).

Label key, used throughout:
- **[CR] Client Requirement** — explicitly required by the approved sources.
- **[AR] Architecture Recommendation** — my proposal, not yet approved.
- **[TV] Technical Verification Required** — not yet verified; must not be treated as settled.

---

## A. Repository audit

### A.1 Current state
| Item | Finding |
|---|---|
| Repository root | `C:\Users\itsu6\Downloads\Projects\LAHAV AI\LAHAV-AI-Website` |
| Version control | **None.** Not a git repository. No `.git` anywhere. |
| Stack | **None.** No `package.json`, no framework config, no build tooling, no source code. |
| Contents | Only `LAHAV_AI_Claude_Handoff_Package/` (documents, brand assets, 13 Stitch exports). |
| Toolchain available | Node v25.6.0, npm 11.8.0, git 2.53.0, Python 3.14.6 |

This is a **greenfield build**. There is no existing implementation to keep, refactor or migrate.

### A.2 Earlier work — RECOVERED AND RECONCILED (updated 2026-08-29)
The legacy documents were supplied as `design-prototype.zip` and are restored to `docs/approved/`.
Full reconciliation, including every conflict and its resolution, is in `docs/SOURCE_OF_TRUTH.md`.
**TV-0 is closed.** The handoff package is the authority for page scope and visuals; the restored
R1-R20, prioritization, PRD v1.2 and Design Brief remain the authority for business requirements,
cost, security, accessibility and design-system rules where nothing newer contradicts them.
The legacy design prototype is archived at `docs/_archive/legacy-design-prototype/` and is
**explicitly not a visual reference** - the new Stitch designs and the Visual Upgrade Brief are.

Two supersessions materially affect this review:
- Website Dev / App Dev / AI Content detail pages were SHOULD in the legacy prioritization and are
  now MUST (13 pages, not 10). Already reflected in sections D and F.
- The legacy Projects card/detail design patterns are dropped from V1. Section C is unchanged
  otherwise; the no-metrics/in-progress rule survives for any future Projects page.

Two decisions are reopened by the reconciliation and are listed in `SOURCE_OF_TRUTH.md` section 5:
the Home hero being dark (legacy D-Q4) versus the light hero in the new Stitch reference, and the
chatbots mention in the approved About copy versus the five approved services.

### A.2b Original finding (superseded, kept for the record)
The Stage 1–5 documents (`REQUIREMENTS.md`, `PRIORITIES.md`, `PRD.md` v1.2, `DESIGN_BRIEF.md`,
`DESIGN_DECISIONS.md`) and the earlier `design-prototype/` Home page built in the previous session
lived at `C:\Users\itsu6\Downloads\Projects\LAHAV-AI-Website\`. **That path no longer exists** — it
appears to have been replaced by this handoff package.

Consequence, and the one thing worth a decision: the handoff package's `WEBSITE_PRD.md` is a
*condensed* PRD. It preserves goals, audience, services, IA, CTA hierarchy, truth rules and RTL
rules, but it does not carry the earlier numbered requirement set (R1–R20), the prioritization
(MUST/SHOULD/LATER/OUT), the measured contrast rules, or the 20 acceptance criteria. Nothing in it
*contradicts* the earlier documents — it is a subset plus the service-page addendum.
**[TV-0] — RESOLVED.** The documents were recovered and reconciled. See A.2 above.

### A.3 Reusable assets
| Asset | Verdict |
|---|---|
| `02_BRAND/*.svg` (Primary, White, Monochrome Dark, Monogram) | **Keep — canonical.** Vector, clean, correct gradient stops. These are the only permitted identity assets. |
| `02_BRAND/LAHAV_AI_Hebrew_Brand_Guide.png` | Keep as reference. |
| 13 × `stitch-reference.png` | **Keep as the visual checkpoint.** Per Asset Policy, this is the fallback when the remote image URLs die. |
| 13 × `stitch-source.html` | Keep as *structural* reference only. See A.4. |
| All handoff `.md` documents | Keep — these are the source of truth. |

### A.4 To discard / never ship
| Item | Reason |
|---|---|
| All Stitch HTML as production code | Tailwind **CDN** (`cdn.tailwindcss.com`) on all 13 pages — explicitly a dev-only tool, unminified, render-blocking, no purging. Not acceptable for a performance-conscious production site. |
| 32 remote `lh3.googleusercontent.com` image references across 9 of the 13 pages | Temporary Stitch-hosted URLs. Asset Policy forbids production dependence on them. Home alone has 7. |
| Material Symbols icon font (≈196 icon usages across the 13 pages) | An entire icon *font* pulled from Google for a handful of glyphs. Replace with inline SVG. |
| Stitch's text-based "LAHAV AI" wordmark in headers | Brand Rules: never recreate the logo as plain text. Several pages do exactly this. |
| Stitch factual content | Not a factual source. Specific violations found are listed in A.5. |

### A.5 Content risks found in the Stitch sources (must be cleaned, not carried over)
Confirmed by inspecting the exports:
- **Invented contact details** — `hello@lahav.ai` and a Tel Aviv address appear in the CRM page footer. Not approved, not verified.
- **Invented copyright year** — `© 2024` appears in multiple page footers. The current year is 2026, and the entity line itself is unverified.
- **Unsupported capability claims** — e.g. "פרופיל 360°", real-time claims, "ריכוז נתונים חכם", automation "monitoring" figures. Flagged by `CONTENT_CLEANUP.md`; I confirmed they are present.
- **Placeholder article content** on Blog and Article Detail — titles, dates, categories, thumbnails. Must not ship as real.
- **Placeholder legal text** on Privacy. Must not ship as a real policy.
- **Founder/company area** on Home and About with content beyond the approved About copy.

### A.6 Conflicts and risks
| # | Risk | Severity | Handling |
|---|---|---|---|
| 1 | No version control at all | **High** | Initialise git before writing a line of code. Without it there is no rollback and no CMS path (see B.4). |
| 2 | Visual ambition vs. performance/accessibility budget | **High** | The Visual Upgrade Brief asks for cinematic scroll storytelling; the PRD demands accessibility and speed first. Motion budget defined in B.3. |
| 3 | Truth rules vs. 13 pages of copy | **High** | Five service pages need real Hebrew copy. Only the About copy is approved today. See E. |
| 4 | Handoff PRD is a subset of the earlier PRD | Closed | Resolved by the reconciliation in `docs/SOURCE_OF_TRUTH.md`. |
| 5 | 13 pages, one person, ₪0 budget | Medium | Sequencing in F puts the system first so pages get cheap. |

---

## B. Proposed production architecture

Nothing here is decided. Every row is labelled.

### B.1 Frontend framework
**[AR] Astro (static output), TypeScript.**

Why it fits this project specifically:
- The site is 13 pages of mostly static marketing content plus a blog. Astro ships **zero JavaScript by default** and lets me add interactivity per-component — which directly serves the "fast on Israeli mobile data" requirement while still allowing premium motion.
- Native content collections give the blog a typed, file-based structure that a git CMS can edit.
- No server needed for the public site → hosting is free and the security surface is tiny.
- First-class RTL support is a matter of markup and CSS, not framework gymnastics.

Alternatives considered and why not:
- **Next.js** — capable, but pulls in React runtime and SSR complexity we do not need for a marketing site; heavier to keep at ₪0 and slower on mobile for no gain here.
- **Plain HTML/CSS** — would work for 13 pages, but the blog/CMS requirement [CR] and 13 pages of repeated header/footer/CTA make templating worth it.
- **WordPress** — meets CMS needs but conflicts with the cost, performance, security-surface and ownership goals.

**[CR]** Hebrew-only V1, native RTL. The architecture must not block a later English version — Astro's i18n routing exists and stays unused in V1.

### B.2 Styling / design system
**[AR] Tailwind CSS v4 (build-time, not CDN) + a token layer in CSS custom properties.**

- Brand palette, spacing scale, radii, shadows and type scale defined once as CSS variables; Tailwind reads them. One place to change, and it matches how the Design Brief is written.
- **Native RTL via CSS logical properties** (`margin-inline-start`, `padding-inline-end`, `inset-inline`) rather than mirroring an LTR layout — this is a [CR] from the Brand Rules and the PRD.
- Fonts: Heebo (headings) + Assistant (body) **[CR]**. **[AR] self-host the two families as subset WOFF2 files** rather than linking Google Fonts — faster, no third-party request, no cookie/privacy question, and it removes a dependency on an external service. **[TV-1]** confirm the licence permits self-hosting (both are SIL Open Font License, which does — to be verified against the actual files shipped).
- No component library. No Bootstrap. No UI kit.

### B.3 Animation / motion
**[AR] CSS-first, with a hard budget.**
- Scroll reveals via `IntersectionObserver` + CSS transitions on `transform`/`opacity` only.
- System-diagram line/node animation via inline SVG with CSS `stroke-dashoffset` — no library.
- **[AR]** If, and only if, a specific sequence proves genuinely impractical in CSS, add **Motion One** (~4 KB, MIT, free). Not adopted upfront.
- **[CR]** `prefers-reduced-motion` fully respected; no scroll hijacking; no autoplay video; simpler and cheaper motion on mobile; animation never blocks reading or CTA use.
- **[AR] Motion budget:** at most two "signature" animated moments per page; everything else is a sub-200ms state transition. Motion is reviewed at QA against this number.

### B.4 CMS / content architecture
This is the most consequential decision in the review, because it drives auth, hosting and cost together.

**[CR]** CMS create/edit/publish; draft vs published; human approval before publishing AI-assisted
content; real authentication (not a hidden URL); least privilege; one editor now, more later
without a rebuild; ideally ₪0.

**[AR] Git-based CMS — content as Markdown in the repository, edited through a browser admin.**
- Articles live as `.md` files in `src/content/articles/` with frontmatter (`title`, `slug`, `date`, `draft`).
- `draft: true` is the unpublished state; publishing is a human action that commits a change.
- Every publish is a git commit — a complete, free audit trail of who published what and when.
- Zero database, zero server, zero recurring cost, and the content is owned in the repo.

**[AR] Sveltia CMS** as the admin interface (an actively maintained Decap/Netlify-CMS-compatible
rewrite, free, MIT). **[TV-2]** Verify current Hebrew/RTL behaviour in its editor UI, and confirm
the OAuth setup on the chosen host. Fallback: **Decap CMS** (same config format) or, if both prove
unsatisfactory, editing via the GitHub web UI — which is free, already authenticated and 2FA-capable,
but is a developer-flavoured experience.

**[AR] Authentication = GitHub OAuth**, with the site owner as the single authorised collaborator.
This satisfies the security requirements without building or paying for an auth system: real
credentials, real access control, MFA available for free on the GitHub account, revocable, and
least-privilege by repository permission. **[TV-3]** Confirm the client has (or will create) a
GitHub account and is willing to use it as the identity for site administration.

**[AR]** Marketing page copy (Home, Services, the five service pages, About) stays in the codebase
as structured content files, **not** in the CMS for V1 — it changes rarely, and putting a page
builder behind it adds cost and risk for no benefit. Revisit later if the client wants to edit it.

### B.5 Forms
**[CR]** Contact form required; validation; success/error/loading states; spam protection; reliable
delivery; no path from a public form to admin privileges.

**[AR]** A serverless function on the host (Cloudflare Pages Function / Netlify Function — free
tier) that validates, checks the spam token, and forwards the submission by email.
**[AR] Cloudflare Turnstile** for spam protection — free, no image puzzles, accessible, no
Google/reCAPTCHA privacy baggage.
**[AR]** Email delivery via **Resend** free tier (3,000 emails/month) or the host's equivalent.
**[TV-4]** Verify the current free-tier limits and the domain-verification requirement.
**[TV-5]** Confirm the destination email address — it must not be invented.
**[AR]** Every submission is also written to a durable store (host KV or a log) so a mail failure
never silently loses a lead. **[TV-6]** Confirm data-retention expectations, which feed the privacy policy.

### B.6 Scheduling (Discovery call)
**[CR]** Book a Discovery call is the primary conversion; free preferred; **[CR]** do not invent a
scheduling provider.
**[AR]** Design the booking region provider-agnostically, then fill it with whichever of these the
client approves: **Cal.com** free tier, **Google Calendar appointment scheduling**, or an interim
"contact form + WhatsApp" flow with no embedded scheduler at all.
**[TV-7]** Client decision + verification of the chosen provider's free tier, Hebrew/RTL support and
embed behaviour. **Until this is settled the page is built with a defined empty region — not a fake widget.**

### B.7 Hosting / deployment
**[AR] Cloudflare Pages.** Free tier: unlimited bandwidth, free SSL, global CDN, preview deploys per
branch, and Functions for the form. Good latency to Israel.
**[AR]** Alternative: Netlify (equivalent developer experience; free tier has a bandwidth cap).
**[AR]** Deployment = push to `main` → automatic build. Rollback = redeploy a previous build.
**[CR]** HTTPS. **[TV-8]** Domain ownership, registrar and DNS access — the one accepted expense.

### B.8 Analytics / SEO
**[CR]** Analytics required, free; foundational + targeted SEO; Search Console.
**[AR] Cloudflare Web Analytics** — free, cookieless, no consent banner needed, and it does not send
visitor data to an advertising company. **[AR]** If the client specifically wants GA4, that is fine,
but it makes a cookie-consent banner necessary — a real cost in UX. **[TV-9]** Client decision.
**[AR]** Per-page title/description, canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`,
Organization structured data, Hebrew-intent URLs fixed before launch.
**[TV-10]** Google Search Console property + verification method.

### B.9 Admin / auth / security
| Requirement [CR] | How it is met |
|---|---|
| Public site fully public, no login | Static pages, no auth layer |
| Admin not publicly accessible | `/admin` is an OAuth-gated shell; without a valid GitHub session it grants nothing |
| Real authentication, not obscurity | GitHub OAuth |
| Only authorised users may edit/publish | Repository collaborator permission |
| Public forms cannot reach admin | The form function only sends mail; it has no repository write credentials |
| Least privilege | Function secrets scoped to sending mail only |
| One editor now, more later without rebuild | Add a collaborator |
| MFA if free/reasonable | GitHub 2FA, free |

**[AR]** Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy) set at the host.
**[AR]** No secrets in the repository; environment variables only.

### B.10 Expected recurring cost
| Item | Cost |
|---|---|
| Domain | the only expense — **[TV-8]** |
| Hosting, SSL, CDN, build minutes | ₪0 |
| CMS + admin auth | ₪0 |
| Form handling + spam protection | ₪0 |
| Email delivery | ₪0 within the free tier — **[TV-4]** |
| Analytics | ₪0 |
| Fonts, icons, animation | ₪0 (self-hosted / inline / CSS) |
| Scheduling | ₪0 intended — **[TV-7]** |

**Target: domain only.** No paid dependency will be added without stating why the free options fail,
the cheapest viable option, the recurring cost, and getting explicit approval first. **[CR]**

---

## C. Component / system plan

**Principle, taken from the Master Build Brief:** shared components exist to keep the *system*
coherent — header, footer, buttons, forms, type. They must not be used to flatten visually rich
sections into one generic card grid. Where the Visual Upgrade Brief calls for editorial composition,
the section is built bespoke.

### C.1 Global system (shared, strict)
Header (sticky, logo right, nav centre, Discovery CTA left, no dropdown) · mobile menu (focus trap,
Escape) · Footer · Button (primary/secondary/tertiary × default/hover/focus/active/disabled) ·
Link-with-arrow (RTL-correct) · Form field set (label, hint, error, success, pending) · Section
shell (light/gray/navy rhythm) · SEO head · Skip-to-content.

### C.2 Composable patterns (shared, flexible)
Eyebrow + heading + lead block · Service card (standard and featured variants) · Process/stage
sequence (RTL progression) · Article card · Closing conversion band · Intentional media placeholder
(branded, correctly proportioned, no invented caption) · Prose/long-form container.

### C.3 Bespoke per page — deliberately not componentised
These carry the visual upgrade and must each be designed as their own artwork:
1. Home hero + connected-systems map — the site's signature asset
2. CRM lifecycle diagram (lead → customer → tasks → visibility)
3. Automation flow (trigger → condition → action → update → next step) with a human-approval branch
4. Automation monitoring/control panel composition
5. Website Development: purpose → journey → structure composition
6. Application Development: need → flow → screens → actions
7. AI Content: objective → brief → AI draft → **human review** → approval → publish
8. Services page composition (must not be five identical cards)
9. 404 broken-flow visual

All are inline SVG/CSS, brand-geometry based, using the monogram motif sparingly. No stock imagery,
no fake dashboards, no robots/brains/neon.

---

## D. Page-by-page implementation plan

| # | Page | Route | Stitch ref | Intended visual upgrade | Content status |
|---|---|---|---|---|---|
| 1 | Home | `/` | `01-home` | Cinematic dark hero with an owned connected-systems map, replacing the generic "AI network" stock visual. Break the flat 3-across card grid into an asymmetric, editorial services composition. Delivery journey becomes a real RTL progression, not numbered chips. Founder area stays a neutral placeholder. Article preview hidden. | Copy to draft; About area limited to approved copy |
| 2 | Services | `/services` | `02-services` | Kill the uniform card grid. CRM + Automations get large editorial blocks with their own visuals; the other three get a tighter, still-premium treatment. Remove unsupported feature claims. | Copy to draft |
| 3 | CRM detail | `/services/crm` | `03-crm` | Lifecycle diagram as a hero-scale asset. Remove "פרופיל 360°", real-time and guarantee language. Strip the invented email/address from the footer. | Copy to draft |
| 4 | Business Automations | `/services/automations` | `04-business-automations` | Animated trigger→condition→action flow with an explicit human approval/exception branch, and a monitoring panel that shows *states*, not invented counts. | Copy to draft |
| 5 | Website Development | `/services/web-development` | `05-website-development` | Purpose → journey → structure narrative; no SEO/performance/e-commerce promises. | Copy to draft |
| 6 | Application Development | `/services/app-development` | `06-application-development` | need → flow → screens → actions, with abstract interface fragments — never a fake product screenshot. No platform/framework claims. | Copy to draft |
| 7 | AI Content Creation | `/services/ai-content` | `07-ai-content-creation` | The pipeline diagram is the page's centrepiece, with **human review** as a visually emphasised, non-skippable node. | Copy to draft |
| 8 | About | `/about` | `08-about` | Editorial, calm, generous. Built around the **approved** About copy. Founder photo = intentional branded placeholder. | **Approved copy exists** |
| 9 | Articles index | `/articles` | `09-blog` | Clean editorial index. Built, but entry points hidden while no approved article exists. | Placeholder only |
| 10 | Article template | `/articles/[slug]` | `10-article-detail` | Long-form Hebrew readability first: narrow measure, real heading hierarchy, RTL lists/quotes. | Placeholder only |
| 11 | Contact / Discovery | `/contact` | `11-contact-discovery` | Keep the strong dark form composition. Form simplified. Booking region reserved, not faked. No response-time promise, no invented contact details. | Blocked on TV-5, TV-7 |
| 12 | Privacy | `/privacy` | `12-privacy` | Clean legal template, marked as unpublished placeholder text. | Blocked on legal text |
| 13 | 404 | 404 fallback | `13-404` | Simple branded broken-flow visual. Not over-designed. | Trivial |

Projects/Work: **not built** — conditional, and the two-item threshold is not met. Accessibility
statement: **not built** — conditional on legal verification.

---

## E. Open questions / blockers

Only items that genuinely block implementation.

**Blocking the start of implementation:**
- ~~**TV-0** source-of-truth question~~ — **RESOLVED** by the reconciliation.
- **TV-3** GitHub account for site administration — the CMS and auth plan depends on it. If unacceptable, the CMS approach changes and cost may change with it.
- **B.7 / TV-8** Domain: owned or not, and with which registrar.

**Blocking specific pages, not the build:**
- **TV-5** Destination email for form submissions (blocks Contact going live, not being built).
- **TV-7** Scheduling provider decision (blocks the booking region being filled).
- **WhatsApp business number** (blocks every secondary CTA becoming functional).
- **Legal entity details** for the footer and privacy policy.
- **Founder story + photography** (blocks final About/Home copy, not the layout).
- **Final legal privacy text** and the accessibility obligation verification.

**Not blocking — decide before launch:**
- **TV-9** Cloudflare Web Analytics (no cookie banner) vs GA4 (banner required).
- Real article inventory. Projects/Work eligibility.

I am **not** asking for Hebrew copy now — I will draft it against the truth rules and submit it for
human approval, which is the approved workflow.

---

## F. Implementation sequence

Each step ends in something reviewable. No step silently starts the next stage.

| Step | What | Why here |
|---|---|---|
| **0** | `git init`, first commit, `.gitignore` | Nothing else is safe without it |
| **1** | Astro + Tailwind scaffold, self-hosted fonts, brand tokens, RTL base, security headers | The foundation every page depends on |
| **2** | **Design-system page** (`/_system`, not public): colors with contrast values, type scale, buttons in all states, form fields in all states, cards, section rhythm, motion primitives | Approve the system once, and 13 pages stop drifting |
| **3** | Global shell: header, mobile menu, footer, CTA band, SEO head, 404 | Shared surface, built once |
| **4** | **Home** — including the signature connected-systems visual | Highest value, hardest visual, proves the upgrade |
| **5** | Services + CRM detail | Establishes the service-page template and the featured treatment |
| **6** | Automations, Website Dev, App Dev, AI Content | Reuse the template; each gets its own bespoke diagram |
| **7** | About (approved copy) + Contact/Discovery (form + reserved booking region) | Conversion and trust |
| **8** | Articles index + article template + CMS wiring + draft/publish flow | The blog capability, entry points hidden until real content exists |
| **9** | Form backend, spam protection, delivery, success/error/pending states | Conversion made real |
| **10** | Privacy template, metadata, sitemap, robots, structured data | Launch hygiene |
| **11** | **QA** against `QA_ACCEPTANCE.md`, plus performance, accessibility, RTL and content-truth passes | Nothing deploys before this |
| **12** | Deployment, domain, analytics, Search Console, live verification | Only after QA passes |

Review gates: after step 2 (design system), after step 4 (Home), after step 6 (all service pages),
and at step 11 (QA). Copy for every page is submitted for human approval before it goes live.

---

## G. What I am explicitly not doing without approval
Choosing a paid service · inventing any contact detail, metric, client, testimonial or founder
biography · shipping Stitch's placeholder legal or article text · building Projects/Work ·
adding a floating WhatsApp button, chatbot, newsletter or popup · making the site all-dark ·
starting implementation before this review is approved.

---

# H. Architecture revision after final decisions F-1..F-18 (2026-08-29)

Sections A–G stand except where this section overrides them. Labels as before:
**[CR]** client requirement · **[AR]** recommendation · **[TV]** verification required.

## H.0 What did not change
Astro static frontend, Tailwind v4 at build time with CSS custom-property tokens, self-hosted Heebo
and Assistant, CSS-first motion with a two-signature-moments-per-page budget, Cloudflare Pages
hosting, native RTL via logical properties, and the accessibility rules. Nothing in F-1..F-18
weakens the case for any of these.

**F-1 affects design, not architecture.** A primarily light hero containing a dark cinematic visual
is an inline-SVG/CSS composition — no new dependency, no performance cost, and it is *cheaper* than
a full-bleed dark hero with a large raster image.

## H.1 Hosting and domain (F-5)
**[AR]** Cloudflare Pages, deployed to its free `*.pages.dev` subdomain — for example
`lahav-ai.pages.dev` **[TV-11]** subject to the name being available at deployment time. Free SSL,
global CDN, per-branch preview URLs for QA. A custom domain is attached later at production launch
with no rebuild and no code change; only DNS and one setting change.
**Domain is off the critical path.** [CR F-5]

## H.2 CMS — the user experience first (F-4, F-6)
The requirement is a **simple visual admin**, with GitHub invisible. [CR F-4, F-6]

**[AR] A custom lightweight admin application**, served at `/admin`, is now the recommendation —
**not** an off-the-shelf git CMS.

Why the recommendation changed: Sveltia/Decap would satisfy F-6 on its own, but it cannot host the
AI article tool of F-7 (topic input, generation, a learning loop, an auto-publish switch). Running a
third-party CMS *and* a separate custom AI tool would mean two admin interfaces, two auth systems and
two places where content lives. One small custom admin is simpler overall and is the only way F-6 and
F-7 become one coherent experience.

**What the client actually sees and does:**

| Step | Experience |
|---|---|
| Log in | Open `/admin`, click "Sign in with GitHub", approve once. No git, no terminal, no Markdown. Session persists |
| Article list | A table of articles with status: Draft, Published, Scheduled. Search and filter |
| Create | "New article" → a Hebrew RTL editor with title, summary, cover image, body. Or "Generate with AI" (H.3) |
| Edit | Rich-text editing — bold, headings, lists, links, images. The client never sees Markdown |
| Save draft | One button. Nothing is public |
| Preview | "Preview" opens the article rendered exactly as visitors will see it, at a private URL |
| Publish | One button, with a confirmation. The article is live within about a minute |
| Manage | Unpublish, edit after publishing, delete, reorder |

**Under the hood [AR]:** the admin writes Markdown files to the GitHub repository through the GitHub
API on the client's behalf; each save is a commit, giving a free and complete audit trail; the commit
triggers a rebuild on Cloudflare Pages. The client never sees any of this. This keeps content
ownership in the repository, needs no database for articles, and costs ₪0.

**Auth [AR]:** GitHub OAuth, with the client as the single authorised account. This satisfies R20
and F-13: real authentication, real access control, free 2FA on the GitHub account, revocable,
least privilege by repository permission, and adding a second editor later is one invitation and one
allow-list entry — no redesign. **[TV-12]** the OAuth flow needs a tiny serverless function to
exchange the code for a token; free on Cloudflare Pages Functions.

**Fallback if the custom admin proves heavier than expected:** ship Sveltia CMS for articles at
stage 8 and add the AI tool separately at stage 9. Same auth, same storage, no wasted work.
**[O-8]** the client approves this experience before it is built.

## H.3 AI article system (F-7) — including the one true blocker

### H.3.1 The cost problem — B-1
Everything else in this architecture is ₪0. **AI text generation is not.** Producing an article
requires an LLM API, and API access is pay-per-token. There is no "free tier that just works"
that I am willing to present as reliable and permanent.

| Option | How it works | Cost | Trade-off |
|---|---|---|---|
| **A — Bring your own draft** | The admin has the AI workflow, the learning store, the review and publishing flow, but the *generation* step is done in the client's existing Claude or ChatGPT subscription and pasted in. The admin supplies the ready-made prompt, built from the learned style | **₪0** | Costs nothing, keeps the whole learning loop, but generation is manual and Auto Publish (Mode 2) cannot work unattended |
| **B — Anthropic API key** | The admin calls the API directly. Full Mode 1 and Mode 2 | **Pay per use.** A single Hebrew article is a small number of cents; a handful of articles a month is a very small monthly amount | The only option that makes Auto Publish genuinely autonomous. Requires approving a paid dependency and setting a hard spend cap **[TV-13]** current pricing must be checked at implementation time, not quoted from memory |
| **C — A free-tier LLM API** | Some providers offer free tiers with rate limits | ₪0 while the tier lasts | **[TV-14]** free tiers change without notice; quality in Hebrew must be tested before it is trusted. I will not build the core of a feature on a tier that can disappear |

**[AR] Recommendation: build for A, design for B.** Ship the admin with the full workflow working at
₪0 (Option A), with the generation step behind one interface. If and when you approve a spend cap,
adding the API key switches Mode 1 to fully automatic and unlocks Mode 2 — no rework.

**This is B-1, and it is the only true blocker in the project. It blocks the AI tool, not the build.**

### H.3.2 Learning without fine-tuning (F-7B)
Fine-tuning is unnecessary here, expensive, and would need far more data than this site will produce.

**[AR] A style memory built from the client's own behaviour:**
1. Every generated draft is stored alongside the client's **final edited version**.
2. The system computes the difference and records what actually changed — length, sentence rhythm,
   heading structure, formality, jargon removed, phrases consistently deleted or added.
3. Approvals, rejections and rejection reasons are recorded as labelled examples.
4. A `style-guide.md` file in the repository accumulates the extracted rules — human-readable, and
   editable by the client at any time.
5. Every future generation is given the style guide plus the 3–5 most relevant approved articles as
   examples.

This is few-shot learning with a growing, inspectable memory. It improves from the first correction,
requires no training run, has no per-article cost of its own, and — the part that matters most —
**the client can read and edit exactly what the system believes their preferences are.** A fine-tuned
model is a black box; this is not.

### H.3.3 Auto Publish safety model (F-7C) — for approval as O-9
Autonomous publishing overrides R10, the legacy out-of-scope list, and a line in the current handoff
guardrails. That is the client's decision, and it is recorded as such. Because it removes the human
gate, the controls around it must be real.

**[AR] Proposed model:**
1. **Default OFF.** The switch ships off, and can only ever be turned on by an authenticated admin inside `/admin`. Nothing in the code may turn it on — not a schedule, not a config file, not the AI.
2. **Explicit re-confirmation.** Turning it on shows plainly what will happen and requires typing a confirmation. It records who enabled it and when.
3. **Auto-expiry.** The switch turns itself off after a period the client sets — 30 days by default — and must be deliberately renewed. An unattended system never runs forever by accident.
4. **A rate limit the client sets**, for example at most one article per week, hard-enforced.
5. **A topic allow-list.** Auto Publish may only write about topics the client has approved. It may never choose its own subject.
6. **An automated truth gate before any auto-publish**, blocking to Draft on: numbers, percentages, currency or dates presented as results; any client, brand or person name; testimonial-shaped language; superlatives and guarantees; any mention of Baan Thai; claims about integrations, certifications or experience. Anything blocked waits for a human — it is never published and never silently discarded.
7. **Notification on every auto-publish**, by email to the client, with a one-click unpublish link.
8. **A kill switch** that disables Auto Publish and unpublishes everything it published in the last N days, in one action.
9. **Full audit trail.** Every auto-publish is a git commit tagged as autonomous — permanently distinguishable from human-published content.
10. **Mode 1 is unaffected** and remains the default, recommended workflow.

## H.4 Contact form and lead storage (F-10)
Fields exactly as approved: Name, Phone, Email, Service of interest (a select listing the five
services), How can we help? [CR F-10]

**[AR]** A Cloudflare Pages Function validates the submission, verifies a **Turnstile** token (free,
accessible, no image puzzles), then does **two independent things**:
1. **Stores the lead first**, in Cloudflare **D1** (free tier) — timestamp, all five fields, source page.
2. **Then emails** `itsu60ai@gmail.com`. **[TV-15]** the email sender must be verified; without a
   custom domain yet (F-5), delivery to the client's own address needs checking at implementation.

Storage happens **before** sending, so a mail failure can never lose a lead — the requirement in
F-10. **[AR]** The admin gets a simple "Leads" table view, so the stored leads are actually readable
without any CRM. [CR: no full CRM in V1]

**[CR]** The form function holds no repository credentials and has no path to admin privileges.

## H.5 Discovery booking (F-12) — recommendation for approval as O-7
**[AR] Cal.com, free plan, one 30-minute "Discovery" event type.**

| Question | Answer |
|---|---|
| What the visitor sees | Clicks "קביעת שיחת Discovery" → a booking view showing your real availability → picks a slot → enters name and email → confirmed. No account needed |
| Where it appears | Embedded in the reserved region on `/contact`; the header and page CTAs lead there |
| Cost | Free plan covers one user with unlimited bookings on a single event type |
| Limitations **[TV-16]** | Hebrew/RTL quality of the embed must be tested before it is accepted; free-plan feature limits and branding must be confirmed at implementation; the booking page lives on a Cal.com subdomain until a custom domain exists |
| Future cost | Only if you later want a team, multiple event types with advanced routing, or paid features. Nothing in V1 needs them |
| Alternative | Google Calendar appointment scheduling — fewer moving parts but **[TV-17]** free-account availability and Hebrew RTL behaviour need verification |

**Until you approve one, the page keeps a defined empty region — no fake widget.** [CR]

## H.6 Analytics (F-9)
**Cloudflare Web Analytics** only. Free, cookieless, so **no consent banner is required** — which
also keeps the privacy policy simpler. GA4 is not added. [CR F-9]
Search Console is separate and still recommended for indexing visibility **[TV-10]**.

## H.7 Recurring cost after F-1..F-18
| Item | Cost |
|---|---|
| Hosting, SSL, CDN, builds, preview URLs, temporary `.pages.dev` URL | ₪0 |
| CMS, admin, GitHub OAuth, article storage | ₪0 |
| Lead storage (D1), spam protection (Turnstile), form function | ₪0 |
| Email delivery | ₪0 within free tier **[TV-15]** |
| Analytics | ₪0 |
| Fonts, icons, motion | ₪0 |
| Booking | ₪0 on the free plan **[TV-16]** |
| Custom domain | Deferred (F-5) |
| **AI generation** | **₪0 under Option A; pay-per-use under Option B — B-1, your decision** |

## H.8 Do the requirements still hold?
| Requirement | Verdict |
|---|---|
| Zero-cost preference | **Holds** everywhere except AI generation, which is isolated as B-1 with a ₪0 path available |
| Security (R20, D-2, F-13) | **Holds and improves.** Real OAuth, one authorised account, no admin path from public forms, least privilege, free 2FA, extra users without redesign |
| Simple CMS (F-6) | **Holds.** Login, write, draft, preview, publish — no git, no Markdown, no terminal |
| AI article learning (F-7B) | **Holds** without fine-tuning, at no additional cost, and inspectable by the client |
| Optional autonomous publishing (F-7C) | **Holds** with the ten controls in H.3.3, pending your approval and, for true unattended operation, B-1 |
| Reliable lead storage (F-10) | **Holds.** Stored before emailed |
| Accessibility (R17) | **Holds.** Nothing in these decisions weakens it; removing the cookie banner slightly helps |
| Native RTL (R6) | **Holds** |
| Performance (G2) | **Holds and improves.** Static pages, no CDN Tailwind, no icon font, no GA4, a lighter light hero |

## H.9 Updated implementation sequence
| Step | What | Gate |
|---|---|---|
| 0 | git init, repository, `.gitignore`, push to GitHub | |
| 1 | Astro + Tailwind foundation, self-hosted fonts, brand tokens, RTL base, security headers | |
| 2 | Design-system page: color with measured contrast, type scale, buttons, form fields, cards, motion primitives | **Review gate** |
| 3 | Global shell: header, mobile menu, footer, CTA band, SEO head, 404 | |
| 4 | **Home** — light hero with the integrated dark cinematic system visual (F-1) | **Review gate** |
| 5 | Services + AI CRM Systems detail | **Review gate** |
| 6 | AI Automations, AI Website Development, AI Application Development, AI Content Creation | **Review gate** |
| 7 | About (approved copy + founder, pending O-2/O-3) and Contact (form + reserved booking region) | |
| 8 | Articles index, article template, **admin + CMS** — the experience is demonstrated before it is locked (O-8) | **Review gate** |
| 9 | **AI article tool** — workflow, style memory, Mode 1; Mode 2 only after O-9 and B-1 | **Review gate** |
| 10 | Form backend, Turnstile, D1 lead storage, email, all form states | |
| 11 | Booking integration once O-7 is approved; Privacy template; metadata, sitemap, robots, structured data; Cloudflare Web Analytics | |
| 12 | 2–3 real articles drafted for your approval (F-8) | **Content approval** |
| 13 | **QA** — `QA_ACCEPTANCE.md` plus the legacy business criteria, performance, accessibility, RTL and content-truth passes | **Review gate** |
| 14 | Deploy to the temporary URL, verify live. Custom domain deferred to production launch | |

Copy for every page is drafted and submitted for approval before it goes live.

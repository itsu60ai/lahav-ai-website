# STG.AI → LAHAV AI — fidelity audit

Reference: `https://stgltd.com/ai/`, audited from the two supplied screen
recordings and the HTTrack mirror kept locally at `docs/reference/stg/`
(git-ignored: it is another company's copyrighted markup, media and brand
assets, and this repository is public).

- desktop recording: 1920 × 988, 152 s
- mobile recording: 468 × 834, 117 s

**How the "CURRENT LAHAV" column was produced.** Every row was checked
against a rendered screenshot, not against DOM geometry. Captures come
from real headless Chrome over the DevTools protocol (`scripts/shot.mjs`),
with a companion `scripts/probe.mjs` for computed values, at the two
reference viewports. All final captures were taken against a **production
build served on `:4330`**, never the dev server: Astro's dev server served
stale scoped CSS repeatedly during this work (it reported a card at
`bottom: 30%` when the source said `top: 27%`), so a dev-server screenshot
cannot be trusted as evidence here.

**What is deliberately not copied.** STG's logo, company name, written
copy, photographs, portfolio, illustrations, presenter asset and any
proprietary source. What is matched is composition, scale, rhythm, motion
and behaviour, filled with LAHAV's own content and LAHAV's own drawn
character.

---

## 1. The character

| | |
|---|---|
| **Reference** | A rendered 3D human presenter anchors the hero: full body, roughly 60 % of viewport height, centred, standing on a soft floor with a contact shadow, a round "click me" CTA overlapping its thighs, floating UI cards scattered around it. It then **persists for the entire site** as a circular head portrait docked bottom-right, beside a WhatsApp FAB bottom-left and a back-to-top control. |
| **Current LAHAV (before)** | An abstract ring in the hero. No character, no persistence, no talk behaviour. Rejected. |
| **Difference** | Everything about the character role. |
| **Fix made** | `src/components/Avatar.astro` — an original drawn character, "לַהַב", built from LAHAV's own geometry (the logo arc as an antenna, the logo dot as a chest core, brand navy/electric). Idle life: bob, shadow breathing, glow pulse, core pulse and ring, irregular blink, arm sway, head turn. Talk behaviour: a timed caption script drives a mouth animation through `.is-talking`. Speech is **data** (`script`, an array of `{text, hold}`), so a later approved synthetic track attaches through `audioSrc` without touching the component. **Lower body redrawn this pass**: the legs used to sit adjacent in one dark column and read as a bust on a pole, so they are now two separated limbs with feet and a lighter limb gradient, on a wider ground shadow. **Hero sizing rebuilt**: the title is now height-aware (`min(8.4vw, 13.5svh, 11rem)`) instead of width-only, which is what stopped it eating the character's room on a wide-but-short screen; the figure is bottom-aligned and the talk disc was shrunk and raised to overlap the hip rather than cover the whole figure. **`src/components/AvatarDock.astro` is new**: the same character as a circular head portrait docked in the reading-start corner on every page, with WhatsApp opposite and a back-to-top control, hiding itself while the hero character is on screen and appearing after 420 px of scroll, with a one-per-session nudge bubble. |
| **Final status** | **Matched.** Verified visually at 1920 × 988 and 468 × 834; talk panel verified opening, captioning (`שלום. אני לַהַב.`) and setting `is-talking`. |
| **Remaining deviation** | The reference presenter is a photoreal rendered human; LAHAV's is a drawn digital character. This is intentional and non-negotiable: F-17 forbids generating or altering the founder's likeness, no approved character asset exists, and STG's own presenter is theirs. **No voice track is attached.** Captions carry the speech; nothing autoplays. A synthetic voice needs an approved asset and an explicit go-ahead before it is generated or paid for. |

---

## 2. Typography

| | |
|---|---|
| **Reference** | Display type at 8–12 vw with no practical cap. Hebrew set very tight (roughly −0.03 em, line-height under 1.0). Latin serif **italic** labels used as small kickers above Hebrew headings. Extreme scale contrast: a 130 px heading directly beside 14 px body. |
| **Current LAHAV (before)** | Display sizes capped well below the reference; contrast between heading and body too gentle. |
| **Difference** | Peak scale and contrast. |
| **Fix made** | `--text-mega: clamp(3.25rem, 12vw, 15rem)`, `--text-display-1: clamp(2.75rem, 9vw, 11rem)`, `--text-display-2`, `--text-display-3` in `src/styles/global.css`. `.t-latin` carries the Latin serif italic kicker. Article titles were released from their 4.25 rem cap to `clamp(2.5rem, 6vw, 6.5rem)`. Row headings across the site sit at `clamp(1.25rem, 2.4vw, 3rem)` against `--text-small` body. |
| **Final status** | **Matched.** Home H1 measures ~130 px at 1440 and ~161 px at 1920; article H1 ~86 px at 1440. |

---

## 3. Section rhythm and the core content pattern

| | |
|---|---|
| **Reference** | The site's repeating unit is a **hairline row**: an oversized Hebrew heading on the reading side, body text opposite, separated by a 1 px rule, on full-bleed colour bands (white → soft → blue → navy → warm). Almost no cards. Whitespace between bands is large. |
| **Current LAHAV (before)** | White cards and dark cards throughout: article grid, related-article cards, symptom bubbles, service cards, AI-boundary panels. |
| **Difference** | The entire content pattern. |
| **Fix made** | Card grids removed and rebuilt as hairline rows on: the articles index (`rows__row`), article-detail related items (`more__row`), the services chooser (`ch-row`), the five services (`svc-row`), service-page symptoms (`sym__item`) and build steps (`build__item`), the AI-content boundary columns, the CRM before/after columns, the app-development verdict columns, article body lists, the 404 routes and the privacy sections. Band utilities `.band--hero/soft/warm/blue/navy` carry the colour rhythm. |
| **Final status** | **Matched.** No white-card or dark-card remnants remain on any public page. |

---

## 4. Home

| | |
|---|---|
| **Reference** | Hero (character + title + cards + disc) → full-bleed sections → process panel with Latin italic kickers → contact form on a warm gradient → flat blue footer. |
| **Current LAHAV** | Hero → marquee → problem rows → blue core band → pinned services showcase (`data-swap-root`) → process → founder → closing CTA → navy footer. |
| **Difference** | Hero proportions were wrong (title dominated, character clipped by the fold at 1920 × 988). |
| **Fix made** | Height-aware title, bottom-aligned figure, resized and repositioned talk disc, mobile card positions moved so the first screen has no dead band. |
| **Final status** | **Matched.** Whole hero act lands inside one screen at both reference viewports. |

---

## 5. Services index and the five service pages

| | |
|---|---|
| **Reference** | A type-led opener, a moving rail of service names, symptom statements at real scale, one connected picture on a colour band, then the services themselves with generous room each. |
| **Current LAHAV (before)** | A `.section`/`.lede`/`.t-h2` template with card-ish rows and a separate `DiscoveryPitch` component in the old design language. |
| **Fix made** | `src/pages/services/index.astro` rebuilt: display-1 opener → marquee rail of the five names → chooser as numbered hairline rows → the אפיון position on a blue band (the `DiscoveryPitch` component was folded in and deleted) → connected picture on navy → the five services as large numbered rows with a circular icon that inverts on hover. `src/layouts/ServicePage.astro` rebuilt, which redesigns all five detail pages at once. **web-development** and **app-development** had empty slots and now carry their own bespoke section, so the five do not read as one template. |
| **Final status** | **Matched.** |

---

## 6. Articles index and article detail

| | |
|---|---|
| **Reference** | Editorial journal: type opener, one lead piece at real scale with its visual, then the rest as rows. Article pages are a wide type opener, a narrow reading measure, and figures that break the measure. |
| **Current LAHAV (before)** | Card grid index; article page with a 4.25 rem-capped title, a tinted "related" box and a two-up white-card related grid. |
| **Fix made** | `src/pages/articles/index.astro` rebuilt as opener → lead piece (visual on a navy stage, since the site diagrams are authored for dark surfaces and wash out on white) → hairline rows. `src/components/ArticleView.astro` rebuilt: full-bleed opener on the hero gradient, 44 rem reading measure, body lists as hairline rows with a tick rule instead of bullets, pull quotes set off by scale and space rather than a border, figures breaking to 62 rem, related items as rows, plus a 2 px reading-progress hairline that fills from the right. |
| **Final status** | **Matched.** CMS data contract, citations, AI SVG visuals (including the render-time `isSvgSafe` revalidation), `noindex` on placeholder content, publish state and SEO metadata all untouched. |

---

## 7. Contact, FAQ, 404, privacy

| | |
|---|---|
| **Reference** | Contact is a form on a warm gradient with a large heading. 404 and legal pages were not in the recordings. |
| **Current LAHAV** | Contact: display-1 opener, dark booking panel with the live Cal.com inline embed, quiet form. **Every piece of contact functionality is untouched** — Turnstile, honeypot, timestamp, rate limiting, the Cal.com loader and the submit script were not edited; only the page shell, headings and section bands were restyled. FAQ: numbered hairline rows with native `<details name="faq">` and FAQPage JSON-LD. 404: oversized ghost "404", display-2 statement, routes as hairline rows, the broken-flow visual on its own dark stage. Privacy: display-1 opener, numbered hairline sections. |
| **Final status** | **Matched.** |

---

## 8. Navigation

| | |
|---|---|
| **Reference** | Fixed bar that changes with the band beneath it. Mobile: a full-height coloured panel sliding in, oversized right-aligned links, big X, logo centred. |
| **Current LAHAV** | Fixed transparent bar going solid on `body.is-scrolled`; full-screen overlay menu with numbered oversized staggered links plus a services sub-list and the CTA. The header's WhatsApp button was **removed this pass** — it duplicated the persistent WhatsApp FAB the dock now provides, which is also where the reference keeps it. |
| **Final status** | **Matched in behaviour.** Deviation: the reference's mobile panel is solid brand blue; LAHAV's is light, because the brief was explicit that the LAHAV site must be light. |

---

## 9. Animation

Audited against both recordings, then verified in a real browser on the
production build. Every `[data-reveal]`, `.mo-line`, `[data-clip]` and
`[data-scale-in]` target on every public page reaches `is-in` after a full
scroll — counts below are `total/entered`:

| Page | reveal | line-wipe | clip | scale-in | marquee cloned |
|---|---|---|---|---|---|
| `/` | 45/45 | 10/10 | 2/2 | 0/0 | yes |
| `/services/` | 30/30 | 6/6 | 1/1 | 1/1 | yes |
| `/services/crm/` | 25/25 | 3/3 | 1/1 | 1/1 | n/a |
| `/about/` | 33/33 | 11/11 | 2/2 | 1/1 | n/a |
| `/articles/` | 15/15 | 4/4 | 1/1 | 1/1 | n/a |
| `/articles/[slug]` | 10/10 | 1/1 | 1/1 | 0/0 | n/a |
| `/contact/` | 7/7 | 2/2 | 0/0 | 0/0 | n/a |
| `/faq/` | 16/16 | 3/3 | 0/0 | 1/1 | n/a |
| `/privacy/` | 12/12 | 2/2 | 0/0 | 0/0 | n/a |
| `/404` | 10/10 | 2/2 | 1/1 | 0/0 | n/a |

Per-mechanism:

| Reference behaviour | LAHAV implementation | Status |
|---|---|---|
| Headings wipe up line by line behind a mask | `.mo-line > span` + `--mo-delay` per line | Matched |
| Images/panels unmask with a clip | `[data-clip]`, `inset(0 0 100% 0)` → `inset(0)` | Matched |
| Elements fade and rise on enter | `[data-reveal]`, staggered by `--mo-delay` / `[data-stagger]` | Matched |
| Continuous marquee of names | `.mo-marquee`, JS clones the track so the −50 % loop is seamless at any width | Matched |
| Sticky section whose panels swap as you scroll | `[data-swap-root]` state machine writing `data-swap` at section midpoints, exactly like the reference's "swaps" mechanism | Matched |
| Oversized element settles from too-large | `[data-scale-in]`, `scale(1.12)` → `scale(1)` | Matched |
| Pointer-follow on the round CTA | `[data-magnetic]` | Matched |
| Persistent dock enters after the hero | `AvatarDock`, `is-on` after 420 px and never while the hero character is visible | Matched |
| Reading progress on an article | 2 px hairline, RTL-correct fill from the right | Matched (addition, the reference has no journal pages in the recordings) |
| Custom smooth-scroll (`animationTime 600 / stepSize 100 / frameRate 150`) | **Not implemented.** | Deviation, deliberate |

The smooth-scroll hijack is the one motion behaviour deliberately not
copied: it overrides the operating system's own scrolling, breaks on
trackpads and assistive input, and would be the only thing on the site
that takes control away from the visitor. Everything else is matched.

Reduced motion: every primitive is gated behind `html.mo-ready` and
neutralised under `prefers-reduced-motion: reduce`; the composition is
identical and only the movement is dropped. If JS never runs, the page
renders complete and static — nothing is left invisible.

---

## 10. Bugs found and fixed during this pass

| Symptom | Root cause | Fix |
|---|---|---|
| The whole document sat 33 px off-screen on `/services/` | `.cta-band__disc` was a full-width grid item carrying `[data-scale-in]`; scaling 1440 px by 1.12 pushes the document wider than the viewport | `width: max-content` on the disc wrapper, and the motion attributes moved onto the button itself |
| Dock character rendered as a tiny full figure instead of a head portrait | the base reset's `svg { max-width: 100% }` silently capped the crop's oversize width; the SVG was also being stretched by `align-items: stretch` as a flex item | absolute positioning + `max-width: none` |
| Article body rendered blue and off-measure in a screenshot | dev server served stale scoped CSS | all final QA moved to the production build on `:4330` |
| Two competing reveal engines | legacy `ScrollReveal` still mounted on six pages alongside `Motion` | `ScrollReveal` removed from every public page; `Motion` now also sets the legacy `reveal-ready` flag so components gating on it keep working |
| Dead components | `HeroStage`, `HeroVisual` unreferenced; `DiscoveryPitch` used once | first two deleted, third folded into the services page and deleted |

---

## 11. Functional regression

Checked on the production build, not just by reading code:

| Check | Result |
|---|---|
| `astro check` | 0 errors, 0 warnings |
| All 13 public routes | 200 |
| Unknown URL | 404 |
| `/admin` and `/admin/` unauthenticated | 302 → `/admin/login` |
| `/admin/ai/` unauthenticated | 302 → `/admin/login?next=/admin/ai/` |
| `/admin/login` | 200 |
| `POST /api/contact` without a Turnstile token | 403 |
| Horizontal overflow, all pages, 1440 × 900 and 468 × 834 | none |
| Articles list / detail read from the CMS store, published only | unchanged |
| AI SVG render-time revalidation (`isSvgSafe`) | unchanged |

Nothing in the frozen list was edited: admin, CMS, article editor,
publishing workflow, AI content engine, radar, D1, migrations, auth, roles,
contact backend, Resend, rate limiting, Turnstile, Cal.com, the article
data model, canonical URLs or structured data.

---

## 12. Open, and why

| Item | Why it is open |
|---|---|
| Synthetic voice for the character | The architecture is in place (`script` is data, `audioSrc` is a prop, nothing autoplays). Generating a voice asset needs an explicit go-ahead — and it must be an original synthetic voice, never an imitation of a real person. |
| ~~`robots.txt` and `sitemap.xml`~~ | **CLOSED.** `public/robots.txt` allows the public site and disallows `/admin`, `/admin/`, `/system/` and `/api/`; `src/pages/sitemap.xml.ts` emits the public routes. Verified live. |
| Reference-style smooth-scroll hijack | Deliberately not implemented, see §9. |
| Mobile menu panel colour | Light rather than brand-blue, per the explicit "the LAHAV site must be light" instruction. |

---

## 13. Round 3 — the two screen recordings, and the follow-up bugs

Every item below was reported by the client, either spoken in the two
walkthrough recordings or written in the message that followed. Each was
reproduced before it was changed and verified after.

### From the recordings

| Reported | Cause | Fix |
|---|---|---|
| "the button here is completely static. I want it to pop out somehow" | no motion at all on the hero trigger | a bob plus an outward halo, both paused on hover and focus, both off under `prefers-reduced-motion` |
| "I can't even stop it, so very very bad" | there was no stop. The only controls were replay and mute, and muting cancels the current sentence while the script marches on | the primary control is now a stop/replay toggle (`עצירה` ⇄ `להשמיע שוב`) |
| "I can't even click outside. I have to try many keys to be able to close it" | the scrim is a SIBLING of the dialog, and on a phone the dialog fills almost the whole screen, so there was barely any scrim left to hit | any pointer landing outside the dialog box closes it, whatever it lands on. The close control is also now a 84×44 labelled pill instead of a 36px glyph |
| "the plus is not clickable in the mega menu" | a 1.1rem glyph is a 17px tap target | 44×44 target, 3.5rem row, and the disclosure is toggled explicitly in JS rather than left to the UA |
| "I want it to be clickable from here as well and not only from this button" | only the `לקראה` anchor was a link | the anchor stretches over the whole service card |
| "it's not moving at all or barely visible" (AI Core) | the rings were breathing, and a plain circle looks identical at every angle | each ring carries a lit node and rotates, inside a clipping wrapper so the diagonal bounding box can never reach the document; plus signal pulses leaving the centre |
| "the text that is hidden beneath this blue thing" | a curve is `bottom: 100%`, so it paints over the section above it | see F-25 |
| "hundreds of pixels of unexplained empty space" on /services/ | two full section paddings stacked, around a `tone="surface"` curve that was white-on-white and therefore invisible | see F-25; the chooser band is now `band--soft` so the curve has a colour change to draw |
| "getting the black page" | article covers, article heroes, the contact booking panel and the 404 panel were all `#0b1530` behind a 16:9 crop | all four are brand blue |
| "the text and the spacing here is not very good" / "the Hebrew is terrible" | Latin display typography applied to Hebrew | see F-24 |

### From the message after

| Reported | Cause | Fix |
|---|---|---|
| "the character is a woman and looking very old and boring" | a long side-swept bob past the jaw, pink cheek ellipses, a red mouth, a perfectly round head | see F-26 |
| "the lips jump outside the screen when it's speaking" | `transform-origin` given in SVG user space under `transform-box: fill-box` | see F-26. Measured after: the mouth opens 4px → 17px and its centre drifts 2px |
| "there is no color separation between what the client says and what the bot says" | Astro scoping vs `document.createElement` | see F-27 |
| "an overlapping css bug on /services/crm/" | the same curve-over-text bug; the client was looking at the deployed build, which did not yet carry the fix | verified by sweeping every `.curve` against every text node on all 12 public routes: zero collisions |

### Verification

- `node scripts/audit.mjs` — 14 routes × 3 viewports: clean.
- `node scripts/audit.mjs --wide` — 14 routes × 14 viewports from 320 to
  2560, added for this round because "is this going to look good on all
  screens" is not answerable from three widths.
- A curve-versus-text sweep on every public route: zero collisions.
- The hero trigger measured across 360 / 390 / 768 / 1440 / 2560: it lands
  at 0.56–0.60 of the character's height at every width, centred to 0px.
  It used to be placed in rem and svh, hand-tuned at two breakpoints, and
  fell to the character's feet at 2560 and covered the torso at 320.

# AI content engine: proposed design (v2, expanded)

Status: **design only. Nothing built. Awaiting second approval.**

Approved so far: V1 scope with true Auto Publish deferred to V2 but all
of its safety machinery built now.

**Standing cost rule (governs everything below): the entire engine is
built and proven in zero cost mode first. No paid API is required to
build it, test it, or run the full workflow. Paid providers are plug in
modules, activated later, without a rebuild.** Claude API is approved in
principle as the eventual text provider, but nothing needs to be bought
now, and I will not ask for it until the whole workflow is proven
working. See section 3.

This version expands the design to a content intelligence system: trend
radar, SEO package, visual layer, and quality gates. Every price and
capability claim below was verified against live sources on 2026-08-30,
not recalled. Sources are listed at the end.

---

## 1. The idea that keeps this safe (unchanged)

**The engine is a draft producer. It is not a publisher.**

Everything it makes enters the existing CMS as a normal draft, through
the same `ArticleStore` the manual editor uses. Edit, preview, publish
and delete stay in the human path that is already built and already
permission checked.

The expansion below adds more *inputs* and more *outputs* around that
core. It does not add a second way for content to reach the public.

---

## 2. The system, in five parts

```
   RADAR            discovers timely opportunities from real sources
     |              (mostly free RSS, no AI needed to collect)
     v
   [ Latest Opportunities ]  <- admin sees the list, clicks Generate
     |
     v
   WRITER           article body + SEO package + visual spec,
     |              in a single Claude call
     v
   VISUALS          SVG diagrams generated as code (free, on brand)
     |              raster hero only if wanted
     v
   GATES            truth, freshness, SEO completeness, Hebrew quality
     |              a failed gate saves a draft. It never publishes.
     v
   DRAFT in the existing CMS  ->  you edit  ->  you publish
     |
     v
   LEARNING         records what you approved, rejected, and changed
```

---

## 3. Zero cost mode, and what things cost only once you switch them on

### 3.1 Every provider has three implementations, from day one

This is the mechanism that makes the cost rule real rather than a
promise. Each place where the system could call a paid service is an
interface with three working implementations:

| Mode | What it does | Cost | Purpose |
|---|---|---|---|
| **MOCK** | returns realistic fixed sample output, no network at all | **free** | build and test everything, instantly, repeatably |
| **MANUAL** | system prints the exact finished prompt, you paste it into the Claude or ChatGPT subscription you already pay for, and paste the result back | **free** | real quality output, real articles, no API account |
| **API** | calls the provider directly | paid | one click convenience, and the only mode that enables scheduling |

The mode is a setting. Switching from MOCK to MANUAL to API changes one
value, not any other code.

**This makes the architecture better, not worse.** Building three
implementations of the same interface from the start is what proves the
seam is genuinely provider independent. A single implementation with a
"we could swap it later" comment usually turns out not to be swappable.

### 3.2 What you can fully test without paying anything

Everything except the model's own writing:

drafts, editing, preview, publishing, unpublishing, the SEO package,
all metadata and structured data, image placeholders and the whole image
pipeline, alt text handling, approvals and rejections, the learning
system, scheduling logic, every safety gate, Auto Publish arming and
expiry and caps, notifications, and the complete history and audit log.

Two of those deserve a specific note:

**The learning system works fully at zero cost.** Its signals come from
*your* edits, approvals and rejections, not from the model. Learning
behaves identically in MANUAL mode as in API mode.

**The radar collects real data at zero cost.** RSS feeds are free and
unlimited. Only the *ranking* of collected items normally uses AI, and
there is a free fallback: a heuristic score from recency, source
weight and keyword match against your services. It is less nuanced than
AI ranking, and it is genuinely useful. AI ranking is an upgrade to a
working feature, not a prerequisite for one.

### 3.3 What genuinely cannot be free

Only two things, and both are honest limits rather than design choices:

1. **One click generation.** MANUAL mode needs you to paste. That is the
   real trade.
2. **Anything unattended.** Scheduled generation and Auto Publish require
   the system to call a model by itself at 3am. No paste based mode can
   ever do that. **This is the actual reason the API tier exists**, and
   it only matters once you want the machine working without you.

### 3.4 The cost tiers, for when you decide to switch modes

Everything in the design falls into one of four tiers.

### Tier 0: free, no AI, no new accounts

- The entire trend radar **collection** layer. Official RSS feeds are
  free and unlimited. Verified working on 2026-08-30 (see section 4).
- All storage, logging, history, scheduling (Cloudflare Cron), admin
  screens, settings, and every safety gate.
- All SEO **mechanics**: slug, canonical, sitemap, Open Graph, JSON-LD
  structured data, breadcrumbs, index/noindex, internal link resolution.
  These are code and templates, not AI.
- All image **processing**: WebP/AVIF conversion, responsive sizes,
  compression, lazy loading, dimensions. Standard build tooling.

**This is the majority of the system by volume of work.**

### Tier 1: the model's own writing (free in MOCK and MANUAL modes)

Below is what these steps would cost **in API mode only**. In MANUAL
mode all of them cost nothing and still produce real, full quality
output, because they run on a subscription you already have.

- Scoring and summarising radar items into ranked opportunities.
- Writing the article.
- Producing the SEO package (titles, meta, keywords, structure).
- Generating SVG diagrams as code.
- Writing alt text and captions.
- Condensing your edits into learned rules.

Estimated cost **if and when you activate API mode**, with a sensible
model split, at 4 articles a month:

| Item | Model | Cost |
|---|---|---|
| Weekly radar scoring | Sonnet 5 | ~$0.04 per run, ~$0.16/month |
| Article + SEO package + SVG | Opus 5 | ~$0.27 per article |
| Fact verification searches | see Tier 3 | ~$0.04 per article |
| **Total** | | **~$1.40/month** |

A $5 credit would last roughly **3 to 4 months** at this rate, or about
8 months on Sonnet instead of Opus. Real spend is logged per call in
`ai_generations`, so this is measured, never guessed.

**None of this is needed now.** It is recorded so the number is known in
advance, and so the decision to activate API mode later is made with a
real figure rather than a guess.

### Tier 2: would require a separate image API (NOT recommended, see section 7)

Raster image generation is a different product from Claude and needs its
own account and key. Verified prices:

| Provider | Per image |
|---|---|
| Cloudflare Workers AI (FLUX.1 Schnell) | **free**, ~2,000/day allowance |
| GPT Image 1 Mini | ~$0.005 |
| Google Imagen 4 Fast / Standard / Ultra | ~$0.02 / $0.04 / $0.06 |
| FLUX.2 pro | ~$0.03 |
| GPT Image 1.5 | ~$0.04 |

**My recommendation is to buy none of these.** Section 7 explains why,
and it is the single biggest cost and quality finding in this document.

### Tier 3: requires live web access

Two ways to get fresh information, with very different prices:

| Method | Cost | Good for |
|---|---|---|
| **RSS feeds** | **free**, unlimited | discovery. What is new, from official sources. |
| **Claude web search tool** | **$10 per 1,000 searches**, so $0.01 each | verification. Checking a specific claim before it becomes an article. |

**Recommended split: RSS for discovery, paid search only for
verification.** Discovery happens constantly and is cheap to do with
feeds. Verification happens a handful of times per article and is worth
paying for, because it is what stops a false claim reaching the site.
Budget roughly 3 to 5 searches per article, about $0.04.

**Free fallback for verification:** every opportunity already carries
its source URL. In zero cost mode the gate does not silently pass an
unverified claim. It shows you the claim and its source link, you click
and confirm, and the draft records that a human verified it. Slower than
automated verification, and equally trustworthy. Arguably more so.

### Tier 4: deferrable with no rebuild

Because `generate.ts` is the only file that talks to a provider and the
visual layer sits behind its own interface, all of the following can be
added later without touching anything else: raster image generation, a
second text provider, extra radar sources, true Auto Publish, and the
full dashboard. Each is a new implementation of an existing interface.

---

## 4. Fresh news and trend radar

### Sources, actually tested

Verified reachable and free on 2026-08-30:

| Source | Feed | Covers |
|---|---|---|
| Google Search Central | `developers.google.com/search/blog/feed.xml` | SEO and ranking changes |
| OpenAI | `openai.com/news/rss.xml` | product releases |
| Google AI | `blog.google/technology/ai/rss/` | product releases |
| Microsoft / Azure | `azure.microsoft.com/en-us/blog/feed/` | product releases |
| Hugging Face | `huggingface.co/blog/feed.xml` | new models and tooling |
| TechCrunch AI | `techcrunch.com/category/artificial-intelligence/feed/` | industry news |
| The Verge AI | `theverge.com/rss/ai-artificial-intelligence/index.xml` | industry news |
| Simon Willison | `simonwillison.net/atom/everything/` | practical AI tooling |

### Honest gaps, tested and confirmed

**These three do not have a free feed, and I will not pretend otherwise:**

- **Anthropic.** No RSS at any standard path (all returned 404). Reachable
  only by checking the news page directly or via a paid search.
- **Meta AI.** No RSS at the documented path (404).
- **TikTok Creative Center.** **No free public API.** Its trend data sits
  behind an authenticated business product. Getting it automatically
  would mean scraping, which is fragile and likely against their terms.

For TikTok specifically, the honest design is a **manual inspiration
input**: a box where you paste something you saw trending. The system
then researches and verifies it properly through the same pipeline. You
get the benefit of social trend awareness without the system depending
on a source it cannot legitimately reach.

### What an opportunity record contains

Every item in "Latest Opportunities" carries exactly the fields you
asked for:

```
  source + URL
  publication date
  what is actually new         (one line, plain Hebrew)
  why it matters to an Israeli business owner
  verified: yes / no / partially   + what was checked
  suggested LAHAV AI angle
  freshness score + priority
  linked LAHAV AI service, if any
```

**Verification is a separate field from the claim itself**, and an
unverified item is visibly marked as such. An unverified item can still
become an article, but the gates in section 9 will not allow its
unverified claim to be stated as fact.

### Not blindly copying influencers

Enforced structurally, in two ways. First, a social observation enters
as an *input to research*, never as content. Second, a trend article is
required by the gates to separate **FACT** (what verifiably happened,
with a source), **INTERPRETATION** (what it likely means), and
**RECOMMENDATION** (what a business owner should consider doing). A
draft that blurs these is rejected before it can be published.

---

## 5. Practical and hack content

The radar classifies every opportunity into a content kind, and the
writer uses a different structure for each:

| Kind | Shape |
|---|---|
| **Practical / hack** | "3 new AI features you can use this week", step by step, concrete |
| **New release explained** | what shipped, what it actually does, who it helps |
| **Workflow** | a real end to end automation, with the steps |
| **Comparison** | tool A vs tool B for a specific job |
| **Evergreen** | the durable educational pieces |

Tone target: current and genuinely useful, business first, no hype and
no fake claims. The existing truth rules apply unchanged, and one is
worth restating because it constrains this content type most: **no
invented numbers, quantities, time savings or results.** A hack article
may say a workflow removes a manual step. It may not say it saves 4
hours a week unless that was actually measured.

---

## 6. SEO engine

Every generation produces a full SEO package alongside the body. Split
by who produces it:

**Claude produces** (judgement required): primary search intent, primary
keyword, supporting keywords and entities, SEO title, H1, meta title,
meta description, H2/H3 outline, internal link suggestions, the relevant
LAHAV AI service link, related article suggestions, and source citations.

**Code produces** (deterministic, free, and therefore always correct):
URL slug, canonical URL, Article/BlogPosting JSON-LD, breadcrumb
structured data, author information, datePublished and dateModified,
Open Graph and social tags, og:image wiring, index/noindex, and sitemap
inclusion.

Putting the mechanical half in code rather than in the prompt is
deliberate. A model can forget a canonical tag. A template cannot.

**No keyword stuffing.** A gate measures keyword density and rejects
drafts that exceed a natural threshold, and alt text is checked
separately for the same problem.

---

## 7. Visual layer: the biggest finding in this document

You asked for original imagery that matches LAHAV AI's visual language,
and explicitly not generic AI robot or glowing brain pictures.

**The right answer is not an image API. It is generating SVG code.**

This site's visual identity is already a system of hand built SVG
diagrams: `HeroStage.astro`, and eight diagrams in `Viz.astro` with
their own mobile layouts, all drawn with the design tokens in
`global.css`. That is the visual language. A photographic AI image would
not match it, no matter which provider generated it.

Claude writes SVG. So the writer can produce a diagram **as code**,
using the existing tokens and the same patterns as the current
diagrams. Compared to a raster image API this is better on every axis
that matters here:

| | Generated SVG | Raster image API |
|---|---|---|
| Matches the site's visual language | **by construction** | never exactly |
| Cost | **included in the article call** | $0.005 to $0.06 each |
| Editable afterwards | **yes, it is code** | no, regenerate and hope |
| Sharpness | **perfect at any size** | fixed resolution |
| File size | **tiny** | large |
| Text inside the image in Hebrew | **correct, it is real text** | frequently mangled |
| Accessible to screen readers | **yes, real text** | no |
| Risk of generic robot imagery | **structurally impossible** | the default failure mode |

That last row is the point. You cannot accidentally get a glowing brain
from a diagram generator constrained to your own design tokens.

The Hebrew row matters too: raster image models still garble Hebrew
text, and this is a Hebrew first site.

### So what is a raster image actually needed for?

Only one thing: **`og:image`**, the preview picture shown when a link is
shared on WhatsApp, LinkedIn or X. Social platforms want a real bitmap.

Three ways to solve that, cheapest first:

1. **Render the article's own SVG diagram to a PNG at build time.**
   Free, perfectly on brand, no API, no account. **Recommended.**
2. **Cloudflare Workers AI**, FLUX.1 Schnell. Free within the 10,000
   neurons/day allowance already on your account, roughly 2,000 small
   images a day. No new signup, no card. A fallback if you ever want a
   non diagram hero.
3. **A paid image API**, $0.005 to $0.06 per image. Only if you later
   decide you want photographic hero images specifically.

**Recommendation: option 1, and buy no image API at all.** Option 2 costs
nothing and is already available if you want to experiment. Option 3
stays behind the provider interface, addable in a day whenever you want,
which is exactly the deferability you asked for.

### Zero cost mode for visuals

The visual layer follows the same three mode pattern. **MOCK** inserts a
correctly sized on brand placeholder diagram, which is enough to build
and test the entire image pipeline: filenames, alt text, dimensions,
responsive versions, WebP and AVIF, `og:image`, structured data and the
completeness gates all exercise fully against a placeholder. **MANUAL**
gives you the diagram spec to paste into your own subscription and
paste the SVG back. **API** generates it inline.

Because the recommended visual output is SVG produced by the same call
that writes the article, activating visuals costs nothing extra beyond
the article itself. There is no separate image bill in the recommended
design at all.

---

## 8. Image SEO and accessibility

Applies to every visual regardless of how it was made. Split again by
producer:

**Claude produces**: alt text describing what the image actually shows,
in natural Hebrew, and an optional caption.

**Code produces**: descriptive filename from the slug and subject,
width and height attributes, responsive sizes, WebP and AVIF versions,
compression, lazy loading below the fold, `og:image`, the structured
data image field, and `primaryImageOfPage` where relevant.

Two gates: alt text must exist and must not be keyword stuffed. A
decorative image gets an empty alt attribute deliberately, which is the
correct accessible behaviour, rather than a keyword dump.

---

## 9. Quality gates

Nothing publishes without passing all of these. **A failed gate saves a
draft and notifies. It never publishes and never silently discards.**

**Truth** (the existing project rules, enforced in code): no invented
numbers, quantities, time savings or results; no invented credentials,
experience or customers; no unproven vendor or platform claims; no
physical address or company registration details; **no em dash
character**.

**Freshness and fact**: every factual claim traceable to a cited source;
source date within a configurable window for trend articles; no
contradiction of a newer known update; **FACT, INTERPRETATION and
RECOMMENDATION clearly separated** in trend articles.

**Content**: not a duplicate topic or near duplicate of an existing
article; every link resolves (checked, not assumed); a clear useful
takeaway is present; Hebrew spelling and grammar check; RTL correctness.

**Completeness**: SEO package complete; metadata complete; structured
data valid; at least one internal link; alt text present on every
non decorative image; no keyword stuffing in body or alt text.

**Disclosure**: Google's current guidance asks whether the use of
automation is self evident to visitors. So AI assisted articles carry a
short, honest disclosure line. This costs nothing in ranking, is what
Google actually asks for, and fits the truth rules this project already
follows.

---

## 10. Learning, extended to topic selection

Still no fine tuning, for the reasons in the previous version: it needs
data that does not exist yet, costs money to train and host, must be
redone whenever the style shifts, and produces a black box that cannot
be corrected.

The learning layers now capture six signals rather than one:

| Signal | Improves |
|---|---|
| ideas approved vs rejected | **topic selection** |
| headlines you rewrote | headline style |
| SEO titles you rewrote | search framing |
| images accepted or regenerated | visual direction |
| article structures you kept | preferred shape |
| categories you repeatedly approve | what the blog is about |

These condense periodically into a short, **plain readable rule list
that you can open and edit**. A rule that is wrong gets deleted by you.
The learning stays inspectable and correctable, which is the whole
reason for preferring this over fine tuning.

Topic selection improves fastest, because approving or rejecting an idea
is one click and produces a signal immediately, long before there are
enough published articles to learn writing style from.

---

## 11. Admin experience

One screen, five tabs, non technical language:

```
  LATEST      fresh opportunities from the radar, ranked
  TRENDING    gaining attention now
  EVERGREEN   durable topics worth owning
  DRAFTS      generated, waiting for you
  PUBLISHED   live, with how much you edited each one
```

Actions: Research, Generate, Generate image, Regenerate image, Preview,
Edit, Publish, Reject, Schedule.

Every card shows source, date, why it matters, and whether it is
verified, before you click anything. Rejecting asks for one optional
line explaining why, which is the highest value learning signal in the
system and takes three seconds to give.

**Built, ahead of this five-tab vision:** a "what to write about today"
card, the first real step toward this admin experience. See section 15.

---

## 12. Auto Publish safety (unchanged, and now better grounded)

All eleven layers from the approved version stand: off by default;
**structurally unable to enable itself** because no writer function
exists in the engine's reachable code; `settings:manage` admin only;
session and CSRF; typed confirmation; **automatic expiry so it turns
itself off and must be deliberately re armed**; hard weekly cap;
content gates; email on every auto publish; one click unpublish; full
audit trail.

The expanded scope adds independent support for the weekly cap. Google's
current guidance explicitly names as a warning sign: *using extensive
automation to produce content on many topics*. A hard cap on volume is
therefore not only a safety measure, it is aligned with what Google
actually asks for. Volume is the risk. Quality is the goal.

---

## 13. Data model

| Table | Holds |
|---|---|
| `ai_opportunities` | radar items: source, URL, date, what is new, why it matters, verification state, angle, freshness, priority, status |
| `ai_generations` | one row per generation: brief, model, raw output, article id, tokens, measured cost, status |
| `ai_feedback` | approvals, rejections with reason, and what you changed |
| `ai_rules` | the readable, editable learned rule list |
| `ai_settings` | auto publish state, expiry, caps, schedule, counters |
| `ai_assets` | generated visuals, alt text, dimensions, derived formats |

Cleanup first: `migrations/0002_seed.sql` is a stale file from a rename.
It holds the admin email and a password hash, duplicates migration
number 0002 with the real `0002_leads.sql`, and is **not gitignored**, so
`git add -A` would stage it. It is regenerable with
`node scripts/cms-seed.mjs`. It should be deleted and covered by a
`migrations/*_seed.sql` ignore rule before new migrations land.

---

## 14. Build order

Ordered so that **nothing costs money until Stage D, and Stage D is
optional.**

**Stage A, the spine, in MOCK mode. Cost: zero.** The provider interface
with its mock implementation, radar collection from the verified free
feeds, the opportunities table and list screen, generation into a draft,
the SEO package, the image pipeline against placeholders, the full gate
suite, logging, and the learning substrate. At the end of Stage A the
entire workflow runs end to end, repeatably, with no account anywhere.

**Stage B, real quality output, in MANUAL mode. Cost: zero.** Prompt
assembly and the paste back screen. At the end of Stage B you are
producing **real, publishable articles** using the subscription you
already pay for. This is the point at which the system becomes genuinely
useful, and it is still free.

**Stage C, refinement. Cost: zero.** The five tab dashboard, image SEO
derivatives, related articles, the editable rule list UI, and human
verification wired into the gates.

**Stage D, optional, and only if you want it.** Activate API mode for one
click generation, then scheduled unattended generation, then eventually
Auto Publish. Every safety layer for it was already built in Stage A and
sits switched off until deliberately armed.

I will come back to you at the end of Stage C, show you the working
system, and only then tell you exactly what activating Stage D costs and
what the minimum purchase is. If the answer at that point is that
MANUAL mode is good enough, Stage D never has to happen.

Nothing in B, C or D requires rebuilding A.

---

## 15. Recommendation layer: "what to write about today" (built)

Built in response to a direct request: the radar should not just collect
and rank, it should actively tell you what to write and why, so you are
never required to think of a topic yourself. Implemented as its own
provider-swappable layer, mirroring the generate.ts pattern exactly.

**What it does.** On every load of the admin AI screen, the system
automatically (no button) surfaces the top 3 topics worth covering right
now, each with: a plain-language reason ("why now"), a specific LAHAV AI
business angle, and a note when it found related developments elsewhere
in the radar. One click generates a draft from any pick.

**Two providers, same free-first discipline as the rest of the engine:**

- **heuristic (live today, $0).** Real math over real already-collected
  data: recency decay, source trust, whether a LAHAV AI service matches,
  and a keyword-overlap scan (capped to the top 40 items, so cost stays
  bounded regardless of how large the radar grows) that finds and groups
  related items — this is the "connect related developments" behaviour,
  done without a model. The reason sentence and the business-angle
  sentence are both built entirely from real fields (source, date,
  priority, matched service, content kind); nothing is invented, and the
  same quality gates from section 9 still apply once a draft is actually
  generated from a pick. Near-duplicate picks are filtered out
  so the 3 picks are not the same story from three sources.
- **api (wired, not built).** Where genuine judgment belongs, once
  approved: reading across opportunities the way a person would, weighing
  nuance a formula cannot, and writing the reason/angle text itself. The
  code path exists (`pickRecommender()` in `recommend/index.ts`) and
  throws a clear, visible error if selected — proven by actually setting
  `recommendation_mode` to `'api'` and confirming the page fails loudly
  instead of silently calling anything. Turning this on is a deliberate,
  future, paid decision, not a side effect of this build.

**Automatic without being unbounded.** A computed batch of picks is
cached (default 6 hours) so refreshing the admin page repeatedly does not
recompute — and, once `api` mode exists, does not re-bill — on every
view. `getOrComputeRecommendation()` is a plain function with no
dependency on being called from an HTTP request, so a future Cloudflare
Cron Trigger can call it on a schedule for genuinely unattended
recommendations, without changing this function at all.

**Data model addition:** `ai_recommendations` (one row per computed
batch: mode, model, cost, the picks as JSON) and `ai_settings.
recommendation_mode` (`heuristic` | `api`, defaults to `heuristic`, no
admin toggle built yet since there is nothing real to switch to until
`api` mode is implemented).

---

## Sources

Verified 2026-08-30.

- Claude web search tool pricing, $10 per 1,000 searches: [Anthropic API pricing overview](https://www.finout.io/blog/anthropic-api-pricing)
- Image API pricing: [AI image generation API pricing comparison](https://www.digitalapplied.com/blog/ai-image-generation-api-pricing-comparison-2026), [Google vs OpenAI image cost analysis](https://intuitionlabs.ai/articles/ai-image-generation-pricing-google-openai)
- Cloudflare Workers AI free allowance, 10,000 neurons/day, FLUX and Stable Diffusion available: [Workers AI free tier limits](https://costbench.com/software/llm-api-providers/cloudflare-workers-ai/free-plan/), [10K neurons/day guide](https://aicreditmart.com/ai-credits-providers/cloudflare-workers-ai-free-tier-10k-neurons-day-guide-2026/)
- Google guidance on AI content, automation disclosure, people first content and E-E-A-T: [Google Search Central, Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- RSS feed availability: tested directly by HTTP request, results in section 4.

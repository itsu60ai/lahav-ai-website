# Website Content CMS

STATUS: **LIVE in production** (2026-09-01). Schema and content applied to the
remote D1 database; the built site carrying every wiring change described
here is deployed at https://lahav-ai-website.itsu60ai.workers.dev.

This is a second, separate CMS layer next to the existing article CMS
(`docs/CMS.md`). It does not replace or touch the article system — a
different set of tables, a different set of admin routes, sharing only the
existing login/session/permission machinery.

---

## The one rule everything else follows

**Design and layout stay in code. Content becomes editable.** Nothing in
this system lets an editor add a section, remove a service, reorder the
navigation, resize anything, or touch CSS. Every editor page is a plain
form over a fixed set of named fields; the public template decides what
those fields look like and where they sit, exactly as before this CMS
existed. This is why the CMS could be added at all without a redesign risk:
it edits `{ headline, body, ... }` objects that the same Astro templates
already rendered from hardcoded strings — the strings just moved to D1.

## What is and isn't editable

| Area | Editable | Fixed |
|---|---|---|
| Home | Hero copy, section headings/body, SEO | Section order, layout, animation |
| Services (5 fixed) | Name, lead, pain paragraph, 3 points, page copy, symptoms, build steps, closing, SEO | Which 5 services exist, their slugs/routes, card/page layout, row counts (3 points / 4 symptoms / 4 build steps match the grid the design assumes) |
| About | All copy blocks, SEO | Layout, imagery |
| FAQ | Full CRUD: add/edit/delete/reorder/enable-disable question+answer | Accordion design |
| Contact | Hero copy, booking note, WhatsApp note, SEO | Form fields, Cal.com embed, Turnstile |
| Navigation | Each item's **label** and **enabled** flag | Route, order, logo position — changing these could break a link or the header layout, so they are not exposed |
| Footer | Invitation lines, note, blurb | Column layout, social icons |
| Settings (global) | WhatsApp number/message, booking URL, primary CTA label | Everything else — see "What settings deliberately excludes" below. The business **name** is intentionally not here — see "The `site_name` decision" |
| Media | Upload/delete images for SEO/OG use | Not a DAM: no folders, no cropping, no CDN transforms |
| SEO (per page) | Title, description, OG image, `noindex` | — |
| Portfolio ("תיק עבודות") | A growable list of example projects: name, industry, hero image, story, SEO -- add/delete/reorder/enable, each publishes on its own | Not linked from navigation and not published by default -- see below |

### Portfolio is fictional example content, not real clients (2026-09-01)

Every portfolio item is a made-up business (client instruction: "לקוחות
כאילו" -- pretend clients), so nothing on the site claims a real company
relationship that doesn't exist. It reuses the exact same draft/published
mechanism as everything else in this document (`portfolio_items`, added
in migration 0010, shares its per-item content shape with `content_pages`
via the same generic store -- see `PortfolioListStore` in `types.ts` for
the create/list/delete/reorder operations content_pages never needed).
The navigation entry was added disabled by default, and the index/every
item's SEO defaults to `noindex: true`, so the feature exists, is fully
editable and previewable, but shows nothing to a real visitor until an
admin deliberately enables the nav link and publishes each item. Four
example items with AI-generated generic photos (no real company depicted)
were created as drafts -- built, verified end to end, and left unpublished
on the live site exactly as requested.

The presenter video/audio/captions on the home page are **not** part of
this CMS and were not touched: they stay exactly as approved, served from
their existing static files.

### What Settings deliberately excludes

Per the original brief, Settings can never hold a secret. The allow-list
in `SETTINGS_KEYS` (`src/lib/cms/content.ts`) is the enforcement — the
settings API silently ignores any key outside it, so this isn't just a
convention, a request naming an unlisted key cannot write it:

```
whatsapp_number, whatsapp_message, discovery_booking_url,
cta_primary_label
```

API keys, the Turnstile secret, the Anthropic key, the Resend key, and
admin credentials are environment variables / D1 rows outside this table
and were never candidates for it.

---

## Architecture

```
migrations/0007_website_cms.sql   content_pages, services_content,
                                   faq_items, site_settings, media,
                                   content_audit_log
migrations/0008_website_seed.sql  generated seed = the exact current
                                   copy, draft == published
migrations/0009_faq_settings_draft_publish.sql
                                   FAQ and Settings gain the same
                                   draft/published split content_pages
                                   already had; site_name is dropped

src/lib/cms/
  content.ts    every content shape + its default (= current copy),
                getPublicContent / getDraftContent, getServiceNames,
                buildWhatsappHref, SETTINGS_KEYS / validateSettingValue
  preview.ts    resolvePreview() — auth check for ?preview=1 on public pages
  media.ts      upload validation, base64 encode/decode, dimension reader
  types.ts      Permission / ROLE_PERMISSIONS, store interfaces
  d1.ts         D1-backed implementation of every store interface

src/pages/admin/website/    one editor page per content area
src/pages/admin/{faq,settings,media}.astro   management UI (faq/settings: draft + publish)
src/pages/api/admin/website/{save-draft,publish}.ts
src/pages/api/admin/faq.ts                 draft create/update/delete/reorder
src/pages/api/admin/faq/publish.ts         ADMIN only: FAQ draft -> published
src/pages/api/admin/settings.ts            draft write only
src/pages/api/admin/settings/publish.ts    ADMIN only: settings draft -> published
src/pages/api/admin/media/{upload,delete}.ts
src/pages/api/media/[id].ts        public image-serving route
```

**The storage seam is the same pattern the article CMS already
established**: every concern (`content`, `services`, `faq`, `settings`,
`media`, `audit`) is an interface in `types.ts`, with one D1-backed class
implementing it in `d1.ts`. A route never touches D1 directly.

### Draft / Published, not versioned rows

`content_pages` and `services_content` each carry **two JSON columns on
one row**: `draft_json` and `published_json`. Saving a draft only ever
writes `draft_json`. Publishing copies `draft_json` → `published_json` in
one statement. There is no history of prior published versions — the user
explicitly approved skipping full revision history for this phase in
favor of shipping the safe draft/published model first.

**FAQ and Settings now use the same split** (migration 0009, 2026-09-01).
They started immediate-write in 0007 — a considered decision at the time,
reasoning that an FAQ's `enabled` flag or a settings value felt more like
a "fact" than "marketing copy" — but a later review against the brief
correctly rejected that: public content must never change production the
instant someone clicks Save, full stop, with no carve-out for FAQ or
Settings. See "FAQ's draft/publish shape" and "Settings' draft/publish
shape" below for how each was fitted into the same model without turning
either into a version-control system.

Media stays **immediate-upload**: uploading a file to the library does not
change any public page on its own (nothing points at it yet). What *does*
require draft/publish is picking that file for a page's SEO image or
similar field — that's an edit to the page's own JSON, already
draft-gated by the mechanism above. Deleting an in-use asset is still
blocked regardless of draft/publish state (see "Media deletion" below).

### FAQ's draft/publish shape

Each `faq_items` row carries a full draft copy (`draft_question`,
`draft_answer`, `draft_sort_order`, `draft_enabled`) and a full published
copy (`published_question`, …, nullable until first publish). The admin
page's create/edit/enable/reorder/delete actions all write only the
`draft_*` columns; nothing on `/faq/` moves until an ADMIN clicks
"פרסום" (`faq:publish`, not granted to EDITOR), which copies every
non-deleted row's draft fields onto its published fields in one query.

Deleting an item is soft while it's live: marking `draft_deleted = 1`
hides it from the draft editor and from `?preview=1` immediately, but
`/faq/` keeps showing it — using its still-intact `published_*` columns —
until Publish, at which point the row is actually removed. An item that
was **never** published is removed outright the moment it's deleted:
there is nothing live to protect, and keeping a ghost row forever would
be exactly the over-engineering the brief warned against.

### Settings' draft/publish shape

`site_settings` gained `draft_value`/`published_value` per key (plus
`draft_updated_*`/`published_*` timestamps). The admin form's "שמירת
טיוטה" writes every changed key's `draft_value`; "פרסום" copies every
key's `draft_value` onto `published_value` in one statement — Settings is
edited as one small form, not five independent pages, so it publishes as
one unit rather than key-by-key. Every public-facing reader of Settings
(`SiteHeader`, `SiteFooter`, `SiteDock`, `ContactBlock`, `BaseLayout`,
`contact.astro`) now takes a `preview: boolean` (threaded down from
`SiteLayout`, which gets it from the calling page's own
`resolvePreview()`) and reads `getDraft()` in preview, `getPublished()`
otherwise.

### The deep-merge safety fix

Every editor page only renders inputs for the fields it needs — Home's
editor has no `seo.ogImage` field, for instance. Save-draft
(`src/pages/api/admin/website/save-draft.ts`) therefore **deep-merges**
the incoming value onto the row's current draft rather than overwriting
it outright: nested objects merge key by key, arrays and primitives from
the incoming value replace what was there. Without this, saving Home's
hero text would have silently wiped Home's `seo.ogImage`, because that
editor page never sends it.

This merge is also why an editor must always send a **complete** replacement
for any array field it owns (e.g. Navigation's `items`) — arrays replace
wholesale, they don't merge element-by-element (verified directly during
testing: sending a single-item array to Navigation's draft replaced all
five items with that one, harmlessly, because it stayed in the draft and
nothing was published until it was corrected).

### Preview is the real page, not a mock

`?preview=1` on a public URL (`/`, `/about/`, `/services/crm/`, …) renders
that exact page with `getDraftContent` instead of `getPublicContent`. It
is independently authenticated in `preview.ts` by reading the session
cookie directly — it does **not** rely on the `/admin` middleware, because
these routes live at the public URL, not under `/admin`. An anonymous
`?preview=1` request is treated as a completely normal visitor request: no
draft leaks, no special headers, verified by testing (curl with no cookie
against `/?preview=1` returns the published page with no `x-robots-tag`
and no `cache-control` override). An authenticated request gets
`cache-control: no-store, no-cache, must-revalidate` and
`x-robots-tag: noindex, nofollow` — also curl-verified against a real
session.

### One published source for a service's name

`getServiceNames(services, preview)` (`content.ts`) resolves all 5 slugs'
names at once, draft or published depending on `preview`. Every place a
service's name is shown **outside its own page** reads through this
instead of the static `SERVICES` array: the header mega menu and mobile
menu (`SiteHeader.astro`), the footer's service list (`SiteFooter.astro`),
the contact form's dropdown (`ContactBlock.astro`, and again directly in
`contact.astro`), the services index cards (`ServiceStory.astro`, given
the map as a `names` prop) and its "leads to" chooser list
(`services/index.astro`), and the "other services" rail at the bottom of
every service page (`ServicePage.astro`). A slug missing from the map (a
D1 failure, or `Astro.locals.stores` unavailable on a static page) falls
back to that slug's own static name — the same code default that seeds
the CMS — so this can never render a blank name.

Verified end to end: renamed CRM's draft name, confirmed all of the above
still showed the old name publicly and the new name only under
`?preview=1` (services index, home, the automations page's "other
services" rail, and the contact dropdown all checked), published,
confirmed every one of those surfaces updated, then restored the
original name and republished.

### Settings write-path validation

`whatsapp_number` and `discovery_booking_url` render directly into an
`href` on the public site, which Astro does not HTML-escape the way it
escapes text content — a `javascript:` URL saved there would actually
execute on click. `/api/admin/settings.ts` validates every value before
writing anything (all-or-nothing: one bad field fails the whole request,
nothing partially applies): the WhatsApp number must be 7–15 digits, and
the booking URL must parse as a valid `https://` URL. Verified directly:
`not-a-number` and `javascript:alert(1)` are both rejected with a 400 and
a field-specific Hebrew message, and neither reaches the database.

### Media deletion is guarded, not just soft

`/api/admin/media/delete.ts` scans every content/services row (draft and
published) for the image id before deleting. If it's referenced anywhere,
the delete is refused with a 409 and the list of pages that use it, unless
the caller passes `force: true`. Verified end to end: uploading an image,
referencing it in Home's `seo.ogImage` draft, and attempting delete
returned 409 with `usedIn: ["עמוד הבית"]`; clearing the reference first let
the delete succeed.

### The `site_name` decision

Settings originally had a `site_name` field that saved correctly but was
never read by any public template — a dead control that looked like it
did something and didn't. Two ways to close that gap were considered:
wire it everywhere a business name appears (footer copyright, JSON-LD
`organization.name`, `og:site_name`, admin brand), or remove it. The
client's explicit call: LAHAV AI is a protected business identity, not
something that should be casually renamed from an admin form, so the
field was **removed** rather than wired (migration 0009 drops the row;
`SETTINGS_KEYS`/`SETTINGS_DEFAULT`/`SETTINGS_LABELS` no longer mention
it). `SITE.name` in `src/lib/site.ts` remains the single place the
business name is defined, exactly as it was before this CMS existed.

### Media storage: D1, not R2 (documented limitation)

Cloudflare R2 is not enabled on this account (`wrangler r2 bucket create`
fails with error code 10042 — this requires a one-time manual action in
the Cloudflare dashboard by the account owner). Media is therefore stored
as base64 in the `media` D1 table, capped at 700KB per upload
(`MAX_UPLOAD_BYTES` in `media.ts`). This is fine at the current, small
scale this site needs (a handful of OG images), but it is not a real media
library: no folders, no transforms, no CDN-level caching beyond whatever
Cloudflare puts in front of the Worker response. If image usage grows,
migrating to R2 is a contained change (`D1MediaStore` → an R2-backed
implementation of the same `MediaStore` interface) once R2 is enabled.

---

## Permissions

Reuses the existing `Role` / `Permission` / `ROLE_PERMISSIONS` system from
the article CMS — no new auth mechanism.

| Permission | admin | editor |
|---|:---:|:---:|
| `content:edit` (save drafts on any website content area) | ✅ | ✅ |
| `content:publish` (move a draft live) | ✅ | ❌ |
| `faq:manage` (draft create/edit/enable/reorder/delete) | ✅ | ✅ |
| `faq:publish` (move FAQ's draft live) | ✅ | ❌ |
| `media:upload` | ✅ | ✅ |
| `media:delete` | ✅ | ❌ |
| `settings:sensitive` (Settings page + both draft-save and publish) | ✅ | ❌ |

EDITOR can write and preview everything, exactly like the article CMS's
existing draft model, but can never make anything public or destroy
anything. This was **functionally tested**, not just read from the
permission table: a real `editor`-role user was created directly in local
D1 with the same password hashing the app uses, logged in for real, and
exercised against the live API —

- saved a draft on About → `200 {"ok":true}`
- attempted to publish that same draft → `403`, `{"permission":"content:publish"}`, and the public page was confirmed unaffected
- attempted `/admin/settings` → redirected to `/admin` (denied, not shown)
- attempted `/api/admin/media/delete` → `403`, `{"permission":"media:delete"}`

Re-run after the 2026-09-01 finalization pass (a fresh test editor, same
throwaway method) against the two new endpoints:

- created a FAQ draft item → `200 {"ok":true}`
- attempted `/api/admin/faq/publish` → `403`, `{"permission":"faq:publish"}`
- attempted `/api/admin/settings` (draft save) → `403`, `{"permission":"settings:sensitive"}`
- attempted `/api/admin/settings/publish` → `403`, `{"permission":"settings:sensitive"}`

Each test user, its session, and any draft-only rows it created were
deleted from local D1 afterward; no editor account exists in production
as a result of either test.

---

## Fallback safety

Every public page reads content through `getPublicContent(store, id,
DEFAULT)`, where `DEFAULT` is the exact current approved copy, hardcoded
in `content.ts`. If a D1 read fails or a row is missing, the page falls
back to `DEFAULT` rather than rendering blank or throwing — the public
site cannot go blank because of a database hiccup.

---

## What was tested (this session, against a real running app, not read from code)

- **Home**: draft → preview (authenticated) → preview (anonymous, correctly
  shows published, not draft) → publish → verify live → restore → republish.
- **About**: the same full draft → preview → publish → verify → restore →
  republish cycle, on a different content area, to confirm the pattern
  generalizes.
- **CRM service page**: same full cycle, plus a real bug this testing
  found and fixed (`ServicePage.astro` was rendering the *static* service
  name instead of the CMS draft's name — `{me.name}` → `{data.name}`).
- **FAQ**: create, disable (public count drops), delete, all with the
  public list re-checked after each step.
- **Navigation**: disabled the FAQ nav item and published → confirmed it
  disappeared from the rendered header `<nav>`; restored and republished →
  confirmed it came back. (Also surfaced, harmlessly, the array-replace
  behavior of deep-merge described above — caught because nothing was
  published in between.)
- **Settings**: a WhatsApp-number change, which surfaced a real
  propagation bug (see below) — and the validation behavior described
  above (bad values rejected, nothing partially written, good values still
  save).
- **Media**: upload → served publicly at `/api/media/[id]` with the
  correct content-type → in-use protection blocks delete → removing the
  reference allows delete → confirmed gone (404).
- **EDITOR role**: see Permissions above.
- **Preview headers**: `cache-control: no-store...` and
  `x-robots-tag: noindex, nofollow` confirmed present on an authenticated
  `?preview=1` request and absent on an anonymous one, via real HTTP
  headers, not code reading.
- **Production**: migrations 0007+0008 applied to the remote D1, site
  rebuilt and deployed, and the above WhatsApp-consistency and route-health
  checks re-run against the live URL (not just localhost).

### A real bug found and fixed during this work: WhatsApp settings propagation

Testing a Settings change to the WhatsApp number end-to-end (not asked for
directly, but the only way to honestly claim "tested") found that several
places on the site still imported the hardcoded `WHATSAPP_HREF` constant
directly instead of resolving it through Settings:
`ContactBlock.astro` (the contact band on every page that has one),
`SiteHeader.astro`'s CTA label, `BaseLayout.astro`'s JSON-LD `sameAs`, and
the main `contact.astro` page's own WhatsApp button and booking-fallback
link. All were fixed to resolve through `buildWhatsappHref(settings)` /
`settings.discovery_booking_url`, the same pattern already used in
`SiteFooter.astro` and `SiteDock.astro`. Re-tested: every WhatsApp link on
the homepage and the contact page now resolves to a single, consistent
number.

## Known, documented limitations

- **404, and the article footer CTA (`ArticleView.astro`), keep their
  static `CTA_PRIMARY.label`.** Both are edge pages relative to the
  primary conversion path (Header, Footer, ContactBlock, the Contact page,
  and the floating dock are all Settings-wired). 404 is deliberately
  static-prerendered rather than SSR, which is a good property for an
  error page — it does not depend on D1 being reachable at all.
- **No full revision history.** Draft/published is two columns per row
  (content pages/services) or two columns per FAQ item/setting, not a
  versioned log — explicitly approved as an acceptable simplification for
  this phase, and now applied consistently to every public-facing content
  area including FAQ and Settings (2026-09-01).
- **Media is D1 base64, not R2** — see above.
- **The AI chat's grounding data is intentionally unaffected by any of
  this.** It was not wired to read draft or unpublished CMS content, so an
  in-progress content edit can never leak into a chat answer before it is
  published (and the AI engine does not read CMS content at all in its
  current form — this is a statement about what was deliberately *not*
  connected, not a claim about what it does read).
- **No dedicated user-management UI** exists yet for creating additional
  EDITOR accounts — the EDITOR role test above created one directly via a
  throwaway local script mirroring the existing seed script's password
  hashing, then deleted it. A real "invite an editor" admin page is future
  work, tracked the same way article-CMS user management already was.

## Manual test checklist (for a human to re-run after any future change)

1. Home: edit a headline in the draft editor → Save → open `?preview=1` in
   an incognito-but-signed-in tab → confirm the new text shows → confirm
   the public URL in a normal tab still shows the old text → Publish →
   confirm the public URL now shows the new text.
2. Repeat step 1 for About and Contact.
3. Open a service editor (any of the 5) → change the lead sentence → the
   same preview/public/publish check on `/services/<slug>/`.
4. FAQ: add a new question → confirm it's on `?preview=1` but NOT on the
   live `/faq/` → Publish → confirm it now appears live. Disable an
   already-published question → confirm it drops from preview only →
   Publish → confirm it drops live. Delete a published question →
   confirm `/faq/` still shows it until Publish, then it's actually gone.
5. Navigation: disable one item, confirm it's gone from the header after
   publish; re-enable, confirm it returns. Always send **all** items in
   one save (see deep-merge note above).
6. Footer: change the invitation line, confirm it publishes.
7. Settings: try an obviously bad WhatsApp number and an obviously bad
   booking URL — confirm both are rejected with a clear message and
   nothing was saved. Save a real value → confirm the LIVE site is
   unchanged and `?preview=1` shows the new value → Publish → confirm the
   WhatsApp button in the footer, the header CTA, the contact page, and
   the floating dock all agree, live.
11. Rename a service in draft → confirm the live header mega menu,
    mobile menu, footer service list, services index cards, the
    "leads to" chooser text, the other-services rail on a different
    service page, and the contact dropdown ALL still show the old name →
    confirm `?preview=1` on each of those pages shows the new name
    everywhere → Publish → confirm all of them update live → restore the
    original name and republish.
8. SEO: set a page's title/description, publish, view page source, confirm
   `<title>` and `<meta name="description">` changed. Set `noindex` on a
   page, confirm `<meta name="robots" content="noindex, nofollow">`
   appears.
9. Media: upload a small image, use its id in a page's OG image field,
   confirm `/api/media/<id>` serves it with the right content-type, try
   deleting it while in use (expect a clear block), remove the reference,
   delete again (expect success).
10. Log in as an EDITOR-role account (if one exists) and confirm: can save
    drafts, cannot publish, cannot reach Settings, cannot delete media.

## Portfolio fields added 2026-09-02 (F-38, F-39)

A project (`portfolio_items` JSON) gained five OPTIONAL fields, all
editable in `/admin/website/portfolio/<id>`: `heroVideo` (external https
MP4/WebM, autoplays muted and looped; the media library stays images-only,
700KB), `tagline` (the line under the name on the index), `gallery[]` and
`mobileGallery[]` (media ids, one per line in the editor: desktop
screenshots in two staggered columns, phone screens as a strip), and
`serviceSlug` (a select of the five services) which chooses the detail
page's layout and living diagram. Items saved before this date have none of
them and render with the generic layout. Set `serviceSlug` on each example
project and add screenshots to get the per-service pages.

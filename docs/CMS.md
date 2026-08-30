# CMS / Admin foundation

Stage: **foundation complete**. Article management works end to end. The AI
article engine is deliberately not built; this is the thing it will plug
into.

---

## What you can do

Sign in at `/admin`.

| Action | Where |
|---|---|
| Log in / log out | `/admin/login`, button in the header |
| See all articles with status | `/admin` |
| Create a new article | "+ מאמר חדש" |
| Edit | click a title, or "עריכה" |
| Save draft | "שמירת טיוטה" in the editor |
| Preview | "תצוגה מקדימה" (works for drafts too) |
| Publish | "פרסום" |
| Unpublish | "הסרה מפרסום" |
| Delete | in the editor sidebar |

A **draft is invisible**: not in the blog index, and its URL returns 404.
Publishing makes it live immediately; unpublishing removes it immediately.
No rebuild, no deploy step.

## Writing without Markdown or Git

The article body is a list of **typed blocks**, not Markdown and not HTML.
The editor gives a button per block type: פסקה, כותרת, כותרת משנה, ציטוט,
רשימה, תרשים. Each block can be moved up, moved down, or deleted.

This matters for three reasons:

1. Nobody has to learn Markdown or touch Git.
2. The public template decides how each block looks, so an author cannot
   break the design.
3. The future AI engine produces these objects directly. It never has to
   generate markup, and its output goes through the same validation.

`תרשים` inserts the site diagram chosen in the sidebar, so articles reuse
the real brand visuals rather than stock images.

## Architecture

```
src/lib/cms/
  types.ts   Article, Block, and the ArticleStore INTERFACE
  db.ts      SQLite connection + schema
  store.ts   SqliteArticleStore (implements ArticleStore)
  auth.ts    passwords, sessions, CSRF
src/middleware.ts        gate for /admin and /api/admin
src/pages/admin/         login, list, editor, preview
src/pages/api/admin/     new, article, status, delete, logout
scripts/cms-setup.mjs    one-time: first admin + import existing articles
```

**The storage seam is `ArticleStore` in `types.ts`.** Nothing outside
`store.ts` knows the database is SQLite. Moving to a hosted database later
means writing one more class that satisfies that interface. No page, route
or component changes.

### Rendering

The public site is still **prerendered**, exactly as before. Only these
render on demand, because they depend on the database:

- `/admin/*` and `/api/admin/*`
- `/articles/` and `/articles/[slug]`

Twelve public pages remain static.

### Cost

Zero. SQLite is built into Node 25 (`node:sqlite`), so the database added
**no dependency and no service**. The only package added was Astro's Node
adapter, which is free and official.

## Security

Written against the project's stated requirements.

| Requirement | How |
|---|---|
| Real authentication, not hidden URLs | Session required; `/admin` redirects to login, `/api/admin` returns 401 |
| Admin not publicly accessible | Middleware gate + `no-store` + `noindex` on every admin response |
| Public forms cannot grant admin | There is **no signup route**. Accounts are created only by running a script with shell access |
| Least privilege | Every user has a role; one admin seeded |
| Passwords | scrypt, per-user random salt, timing-safe compare. Plaintext never stored or logged |
| Sessions | 32 random bytes; only the SHA-256 **hash** is stored, so a DB leak does not hand over live sessions |
| Cookies | httpOnly, sameSite=lax, Secure over https, 7-day expiry |
| CSRF | Per-session token required on every state-changing request, plus Astro's built-in origin check |
| Brute force | 5 failed attempts locks the account for 15 minutes |
| Enumeration | Wrong email and wrong password give the same response, with comparable timing |
| Secrets | The database is gitignored. Content and users are never committed |

### Verified

| Test | Result |
|---|---|
| `/admin` without session | redirect to login |
| `/api/admin/*` without session | 401 |
| Wrong password | rejected |
| Correct password | session cookie issued |
| Draft article URL | 404 |
| Publish | live immediately, appears in index |
| Unpublish | 404 immediately, gone from index |
| Publish with no title | refused, 400 |
| Publish with no body | refused, 400 |
| Bad CSRF token | 403 |
| POST with no Origin header | 403 |

## Setup

```
npm run cms:setup
```

Creates the first admin and imports the articles that were in source.
Prints a generated password once; it is not stored anywhere. Pass
`ADMIN_EMAIL` / `ADMIN_PASSWORD` to choose your own.

Run the site with a server (the admin needs one):

```
npm run build && node ./dist/server/entry.mjs
```

## Known gaps, deliberately not built

1. **Changing your own password** has no screen yet. Today it means
   re-running setup against a fresh database. This should be the next
   small piece.
2. **Adding more users** works in code (`createUser`, roles exist) but has
   no UI. Adding one is straightforward.
3. **MFA** is not implemented. TOTP is free and is the natural next
   security step once a host is chosen.
4. **Image uploads** are not supported. Articles use the site's own
   diagrams, which is a deliberate constraint for now.
5. **Revision history** is not kept. Saving overwrites.

## The open decision this foundation defers

Where this runs in production is **not decided**, and it is coupled to the
still-open domain and hosting question.

The foundation was built so that decision stays cheap:

- SQLite on a small always-on host, or
- a hosted database behind the same `ArticleStore` interface, or
- an auth provider taking over `auth.ts` while everything else stands.

What must not change: no public signup, real authentication, and the admin
never being reachable without a session.

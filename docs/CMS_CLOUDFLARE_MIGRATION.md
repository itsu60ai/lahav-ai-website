# CMS production architecture: Cloudflare Workers + D1

Migration completed 2026-08-30. The admin UX is unchanged; storage, runtime
and the auth boundary changed underneath it.

---

## 1. Is Workers + D1 the right fit?

**For storage and hosting: yes.** D1 is SQLite-compatible, so the schema
and almost all query shapes carried over unchanged. The site was already
mostly prerendered, and Workers serve static assets plus the handful of
on-demand routes from one deployment.

**For password hashing: it is a real downgrade, and worth stating plainly.**

| | Before (Node) | After (Workers) |
|---|---|---|
| Algorithm | scrypt | PBKDF2-SHA256 |
| Cost factor | N=16384 default | 100,000 iterations |
| Constraint | none | Cloudflare caps PBKDF2 at 100,000 |
| OWASP guidance | met | 600,000 recommended, so **not met** |

Two platform facts cause this:

1. Cloudflare's SubtleCrypto **rejects PBKDF2 above 100,000 iterations**.
2. Workers Free allows **10ms CPU per request**, and PBKDF2 is deliberately
   CPU-heavy.

Node's scrypt is not a way out: even where `nodejs_compat` exposes it, the
10ms budget is the binding constraint, not the API.

### What carries the security instead

- **Password entropy.** The seeded password is 24 characters from a
  55-character alphabet, roughly 98 bits. Brute force at that entropy is
  infeasible regardless of iteration count. This holds **only while
  passwords are generated**, which is why a future "change password"
  screen must enforce a strong generated password rather than a
  user-chosen one.
- **Lockout.** 5 failed attempts locks the account for 15 minutes, so
  online guessing is throttled.
- **Salted per user, hash only.** The plaintext is never stored.

### Recommended before launch

Move admin authentication to **Cloudflare Access** (Zero Trust). It is free
for up to 50 users, enforces at the edge before the Worker runs, removes
password handling from the application entirely, and provides MFA at no
cost, which is already on the pre-launch list. It requires the domain to be
on Cloudflare, which is still an open decision.

The refactor in this migration was done so that swap touches `auth.ts` and
nothing else.

## 2. Does it stay ₪0?

Yes, with large headroom.

| Resource | Free allowance | Expected use |
|---|---|---|
| Worker requests | 100,000 / day | a marketing site plus occasional admin |
| D1 storage | 5 GB | articles are text; megabytes at most |
| D1 rows read | 5,000,000 / day | a page view reads a handful of rows |
| D1 rows written | 100,000 / day | writes happen only when editing |
| Static assets | not billed as Worker requests | 12 prerendered pages |

The only cost driver that could ever bite is the 10ms CPU limit, which
constrains hashing strength rather than price.

## 3. What changed

### Removed

- `@astrojs/node` adapter
- `src/lib/cms/db.ts` (node:sqlite connection)
- `src/lib/cms/store.ts` (node:sqlite implementation)
- `scripts/cms-setup.mjs`
- the local `data/cms.db` file
- **every `node:sqlite` and `node:crypto` import** from runtime code

### Added

| File | Purpose |
|---|---|
| `src/lib/cms/d1.ts` | D1 implementations of all three stores. **The only file containing SQL** |
| `src/lib/cms/context.ts` | The only file that imports `cloudflare:workers`. Builds stores from the binding |
| `src/lib/cms/guard.ts` | `require_(user, permission)` returning 401/403 |
| `wrangler.jsonc` | D1 binding, `nodejs_compat`, compatibility date |
| `migrations/0001_init.sql` | schema |
| `scripts/cms-seed.mjs` | generates seed SQL + credentials, prints no password |

### Changed

- `src/lib/cms/types.ts` gained `Role`, `Permission`, `ROLE_PERMISSIONS`,
  `can()`, `UserStore`, `SessionStore`, `CmsStores`
- `src/lib/cms/auth.ts` rewritten: WebCrypto only, and it now receives
  stores instead of reaching for a database
- `src/middleware.ts` builds the per-request stores and exposes them
- every admin page and API route reads `Astro.locals.stores`
- `astro.config.mjs` uses `@astrojs/cloudflare` with `platformProxy`

The **UI was not rebuilt.** Markup and styles are unchanged except for
permission-gated buttons.

## 4. The storage/auth boundary, corrected

The previous claim that "only ArticleStore is affected" was wrong:
`auth.ts` talked to SQLite directly. That is fixed.

`auth.ts` now has exactly one import:

```ts
import type { Role, SessionStore, User, UserStore } from './types.ts';
```

Verified after the migration:

| Check | Result |
|---|---|
| SQL keywords in `auth.ts` | 0 |
| `node:sqlite` anywhere in `src/` | 0 |
| `node:crypto` imports in `src/` | 0 |
| Files containing SQL | 1 (`d1.ts`) |
| Files importing `cloudflare:workers` | 1 (`context.ts`) |

## 5. Roles, actually enforced

Permissions are checked server-side in every mutating route. The UI hides
what a user cannot do, but hiding is not the control.

| Permission | admin | editor |
|---|---|---|
| `article:create` | yes | yes |
| `article:edit` | yes | yes |
| `article:preview` | yes | yes |
| `article:publish` | **yes** | **no** |
| `article:delete` | **yes** | **no** |
| `user:manage` | yes | no |
| `settings:manage` | yes | no |

**Publish and unpublish are ADMIN only.** Publishing is the moment content
becomes public in the company's name, so it stays with the owner. This also
matches how the AI engine is meant to behave: it produces drafts, a human
publishes.

Verified by calling the API directly as an editor, bypassing the UI:

| Action as editor | Result |
|---|---|
| create | 303 allowed |
| edit | 200 allowed |
| publish | **403 denied** |
| delete | **403 denied** |

## 6. Bugs found and fixed during the migration

1. **`csrfFor` became async and was not awaited in `AdminLayout`**, so the
   CSRF token rendered as a Promise and every action 403'd.
2. **A partial update blanked the rest of the article.** The API wrote all
   fields unconditionally, so a request omitting a field cleared it. It now
   applies only the keys actually present.
3. **A partial update silently changed the slug.** The slug was recomputed
   from the title on every save, which would move a published article to a
   new URL. The slug now changes only when explicitly supplied. This
   matters most for the future AI engine, which will send partial updates.

## 7. Running it

```
npm run cms:seed                                   # writes seed SQL + credentials file
npx wrangler d1 execute lahav-cms --local --file=./migrations/0001_init.sql
npx wrangler d1 execute lahav-cms --local --file=./migrations/0002_seed.sql
npm run dev                                        # workerd, with local D1
```

Credentials land in `data/ADMIN_PASSWORD.txt` (gitignored). The password is
never printed to the console. Move it to a password manager and delete the
file.

`wrangler dev` also works but its proxy controller crashed repeatedly on
this machine; `astro dev` runs the same workerd runtime and was stable.

### Before first deploy

```
npx wrangler d1 create lahav-cms      # put the real database_id in wrangler.jsonc
npx wrangler d1 execute lahav-cms --remote --file=./migrations/0001_init.sql
npx wrangler d1 execute lahav-cms --remote --file=./migrations/0002_seed.sql
```

## 8. Still open

1. **Password change screen** — required pre-launch. Must enforce a strong
   generated password, given the KDF ceiling.
2. **MFA** — required pre-launch. Cheapest path is Cloudflare Access.
3. **User management UI** — roles and permissions work; the screen does not
   exist. `user:manage` is defined and ready.
4. **Domain and hosting decision** — still open, and it gates whether
   Cloudflare Access is available.
5. **Deployment** — nothing is deployed. `database_id` in `wrangler.jsonc`
   is a placeholder.

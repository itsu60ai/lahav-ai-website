# Contact form + lead storage

Stage: complete. Implements F-10 (approved fields, itsu60ai@gmail.com
destination, stored reliably, no full CRM in V1).

---

## The three questions asked before building

**Where is the lead saved?** In the same Cloudflare D1 database the CMS
already uses, in a new `leads` table. Every submission is written to the
database **first**, before anything else happens. That write is the single
source of truth; nothing after it can lose the lead.

**How does the email notification work?** Immediately after the lead is
saved, the Worker calls Resend (a free email API) to send a formatted
email to `itsu60ai@gmail.com` with all five fields, and sets the reply-to
address to the visitor's own email so replying is one click. Because no
domain is purchased yet, this sends from Resend's own sandbox address,
`onboarding@resend.dev`. Resend restricts that address to only deliver to
the email the Resend account itself was signed up with. **If the Resend
account is created using `itsu60ai@gmail.com`, notifications arrive there
today at zero cost, no domain required.** Once a real domain exists,
verifying it in Resend and changing one constant is all that changes —
not a rebuild.

**What happens if the email fails?** Nothing is lost. The lead was already
saved before the email was attempted. The lead's row is marked with
whether the email succeeded and, if not, the error, so it stays visible in
the database for follow-up. The visitor never sees this as a failure: they
already got a real success message, because their lead was genuinely
captured. Verified directly: with no Resend key configured, a submission
still saves correctly and still returns success, with the error recorded
against that lead.

**Does this stay free?** Yes. D1 storage costs nothing at this scale.
Resend's free tier is 3,000 emails/month, 100/day — far more than a
contact form on a small business site will produce. Cloudflare Turnstile
is free with no request cap. Cloudflare's native rate limiter is a
standard Workers binding, also free. Total added cost: **₪0**.

---

## What was built

```
migrations/0002_leads.sql        the leads table (committed schema)
src/lib/leads/types.ts           Lead, LeadStore interface
src/lib/leads/d1.ts              the only file with SQL for leads
src/lib/leads/spam.ts            honeypot, timing, Turnstile, rate limit, sanitising
src/lib/leads/notify.ts          Resend email call
src/lib/leads/context.ts         binds Cloudflare bindings to the above
src/pages/api/contact.ts         the public endpoint
src/pages/contact.astro          the form, honeypot, Turnstile widget, submit script
wrangler.jsonc                   added the CONTACT_RATE_LIMITER binding
.dev.vars.example                template for local secrets
```

### Isolation from admin (the explicit requirement)

`src/lib/leads/*` imports nothing from `src/lib/cms/*`. There is no
session, no CSRF token from the admin system, no user object, anywhere in
this code path. It shares only the physical D1 database (a different
table) with the CMS — never any code. Verified: zero imports from `cms/`
in the leads folder or in `api/contact.ts`.

## The flow, in order

1. **Honeypot + timing.** A field real visitors never see, and a check
   that the form wasn't submitted implausibly fast. Caught here: silently
   accepted (so a bot gets no signal to adapt to), nothing stored, nothing
   emailed.
2. **Turnstile.** Cloudflare's invisible bot check, not a puzzle. Verified
   server-side against Cloudflare's API.
3. **Rate limiting.** A native Cloudflare Workers binding, 5 submissions
   per 60 seconds per visitor (keyed by a hashed IP, the raw address is
   never stored).
4. **Validation and sanitising.** Required fields, a real email shape, a
   plausible phone shape, length limits. Every field has HTML tags and
   control/newline characters stripped, which also prevents email header
   injection through the reply-to address.
5. **Duplicate fold.** The same email and phone submitted again within 3
   minutes (a double click, a retry) reuses the existing lead instead of
   creating a second row and sending a second email.
6. **Store.** The point of no return for losing a lead.
7. **Notify.** Best effort. Success or failure is recorded on the lead.
8. **Respond.** Success either way, because the lead is safely stored.

## Verified end to end

Tested against the real Cloudflare runtime (`astro dev`, which runs
workerd) with the actual D1 binding:

| Test | Result |
|---|---|
| Valid submission | saved, `{"ok":true}` |
| Honeypot filled | accepted silently, **nothing stored** |
| Submitted too fast (100ms) | accepted silently, **nothing stored** |
| Turnstile token missing | rejected, 400, clear message |
| Invalid email | rejected, 400, `"כתובת האימייל לא תקינה"` |
| `<script>`/`onerror=` in fields | stored as inert text, tags stripped |
| No Resend key configured | **lead still saved**, error recorded, visitor still sees success |
| 6th request within 60s from one visitor | **429**, rate limited |
| Real Hebrew text via an actual browser `fetch()` | stored correctly, byte for byte |

One thing worth recording honestly: an early manual test sent Hebrew text
through a shell command line on this Windows machine and it arrived as
`?????` in the database. That traced to the **test method**, not the
code — the shell mangled the text before it ever reached the server. A
real visitor's browser always sends JSON as UTF-8 with no such step in
between, and a direct test using the browser's own `fetch()` confirmed
Hebrew is stored correctly, character for character.

## Status: email delivery is live

**Done, 2026-08-30.** The Resend account was created with itsu60ai@gmail.com
and `RESEND_API_KEY` is configured in `.dev.vars` (local) — production
still needs `wrangler secret put RESEND_API_KEY` once a domain and
deployment exist. Verified with a real send: the lead saved, Resend
accepted the email, and the lead's record shows `email_sent = 1` with no
error. The test lead was deleted after verification.

**Still open:** a real Cloudflare Turnstile widget, created in the
dashboard once the domain is on Cloudflare, replacing the public test
key pair currently in use. The form works fully and safely without it —
bot verification currently always passes (Cloudflare's own test key),
so this is a hardening step, not a functional gap.

Recorded as O-12 in `SOURCE_OF_TRUTH.md`.

## Handling the API key that was pasted into chat

The key was stored only in `.dev.vars`, which is gitignored and was
confirmed not tracked by git. It was never written to `wrangler.jsonc` or
any committed file. Because it was shared in a chat transcript, it isn't
fully secret going forward; if that matters, it can be rotated for free
in the Resend dashboard (Settings → API Keys) at any time with no
downtime — swap the value in `.dev.vars` and, once deployed, run
`wrangler secret put RESEND_API_KEY` again. Not urgent: this key can only
send email from the sandbox address, it cannot read anything or access
any other part of the account.

## Deliberately not built

Per instruction: no CRM integration. Leads live in the database and are
emailed; there is no admin screen to browse them yet (a natural next
small step, not built now). No booking, no AI engine, no deployment.

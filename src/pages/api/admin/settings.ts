// Global settings: the reusable business facts (WhatsApp number/message,
// booking url, primary CTA label). ADMIN only (settings:sensitive) --
// these values feed WhatsApp links and the booking CTA across the whole
// public site, so a mistake here is a wide-radius mistake.
//
// DRAFT-ONLY (2026-09-01, SOURCE_OF_TRUTH.md F-35): this route writes
// draft_value, never published_value. A Settings change must not
// silently change production the moment someone clicks Save -- see
// /api/admin/settings/publish.ts for the separate, explicit action that
// does. `?preview=1` on any public page reads the draft values written
// here; the public site itself never does.
//
// ONLY keys in SETTINGS_KEYS can ever be written. This is the enforced
// half of the "never put a secret in settings" rule from
// migrations/0007_website_cms.sql: even a compromised admin session
// cannot use this route to write an arbitrary key.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../lib/cms/guard.ts';
import { SETTINGS_KEYS, validateSettingValue } from '../../../lib/cms/content.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'settings:sensitive');
  if (denied) return denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const values = body.values;
  if (!values || typeof values !== 'object') return json({ error: 'missing values' }, 400);

  // Validate everything before writing anything: a request with one bad
  // field (e.g. a non-numeric WhatsApp number) must not partially apply.
  const toWrite: Array<[string, string]> = [];
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!(SETTINGS_KEYS as readonly string[]).includes(key)) continue; // silently ignore, never error-leak the allowlist
    if (typeof value !== 'string') continue;
    const trimmed = value.slice(0, 2000);
    const error = validateSettingValue(key, trimmed);
    if (error) { errors[key] = error; continue; }
    toWrite.push([key, trimmed]);
  }
  if (Object.keys(errors).length) return json({ error: 'invalid values', fields: errors }, 400);

  const { settings } = locals.stores!;
  for (const [key, value] of toWrite) {
    await settings.setDraft(key, value, locals.user!.id);
  }
  await locals.stores!.audit.record('settings', 'draft_updated', locals.user!.id);

  return json({ ok: true });
};

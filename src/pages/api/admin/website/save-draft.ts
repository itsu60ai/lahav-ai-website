// Save a draft for one website content area (a content_pages row, keyed
// by id, or a services_content row, keyed by slug). Publishing is a
// SEPARATE endpoint (publish.ts) -- this route never touches the
// published copy, so a draft save can never accidentally go live.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// A hard ceiling on any one draft blob. Every shape in content.ts is a
// handful of short fields; this only exists to stop a malformed or
// abusive payload from being written at all.
const MAX_JSON_BYTES = 50_000;

/**
 * DEEP-MERGES the incoming value onto the row's CURRENT draft, rather
 * than overwriting it outright. This exists because every simple editor
 * page only renders inputs for the fields it needs -- Home's editor has
 * no `seo.ogImage` field, for instance -- and a naive overwrite would
 * silently erase every field a given editor does not happen to expose,
 * the moment someone clicks "save draft" on that editor. Nested objects
 * merge key by key; arrays and primitives from the incoming value simply
 * replace what was there (an array is an ordered list like `points` --
 * merging it element-by-element would not mean anything).
 */
function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch) || typeof patch !== 'object' || patch === null) return patch;
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return patch;
  const out: any = { ...base };
  for (const k of Object.keys(patch)) out[k] = deepMerge(base[k], patch[k]);
  return out;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'content:edit');
  if (denied) return denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const store =
    body.store === 'services' ? locals.stores!.services :
    body.store === 'portfolio' ? locals.stores!.portfolio :
    locals.stores!.content;
  const id = typeof body.id === 'string' ? body.id.slice(0, 64) : '';
  if (!id) return json({ error: 'missing id' }, 400);
  if (!body.value || typeof body.value !== 'object') return json({ error: 'missing value' }, 400);

  const currentRaw = await store.getDraftRaw(id).catch(() => null);
  let current: any = {};
  try { current = currentRaw ? JSON.parse(currentRaw) : {}; } catch { current = {}; }
  const merged = deepMerge(current, body.value);

  const json_ = JSON.stringify(merged);
  if (json_.length > MAX_JSON_BYTES) return json({ error: 'payload too large' }, 413);

  await store.saveDraft(id, json_, locals.user!.id);
  return json({ ok: true });
};

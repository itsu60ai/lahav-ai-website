// Portfolio structural operations: create a new (empty, disabled) item,
// toggle its enabled flag, delete it, or reorder the list. All DRAFT-only
// -- same content:edit / content:publish split as every other website
// content area (2026-09-01). A new item's actual content (name, story,
// image) is written through the existing /api/admin/website/save-draft
// with store:"portfolio"; this route only ever touches the structural
// columns (draft_enabled, draft_sort_order, draft_deleted), never
// draft_json.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const str = (v: unknown, max = 64) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'content:edit');
  if (denied) return denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const { portfolioList } = locals.stores!;
  const userId = locals.user!.id;
  const action = body.action;

  if (action === 'create') {
    const row = await portfolioList.create(userId);
    return json({ ok: true, id: row.id });
  }

  if (action === 'setEnabled') {
    const id = str(body.id);
    if (!id) return json({ error: 'missing id' }, 400);
    if (typeof body.enabled !== 'boolean') return json({ error: 'missing enabled' }, 400);
    await portfolioList.setEnabled(id, body.enabled, userId);
    return json({ ok: true });
  }

  if (action === 'delete') {
    const id = str(body.id);
    if (!id) return json({ error: 'missing id' }, 400);
    await portfolioList.remove(id);
    return json({ ok: true });
  }

  if (action === 'reorder') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : null;
    if (!ids || !ids.length) return json({ error: 'missing ids' }, 400);
    await portfolioList.reorder(ids, userId);
    return json({ ok: true });
  }

  return json({ error: 'unknown action' }, 400);
};

// FAQ: create / update / delete / reorder -- all DRAFT-ONLY. None of
// these actions touch the public /faq/ page; only /api/admin/faq/publish
// does that, and only ADMIN can call it (faq:publish). This is the
// 2026-09-01 fix: FAQ was immediate-write before, which let an EDITOR
// (or a slip of the mouse) change the live public site with no review
// step -- see SOURCE_OF_TRUTH.md F-34.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'faq:manage');
  if (denied) return denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const { faq } = locals.stores!;
  const userId = locals.user!.id;
  const action = body.action;

  if (action === 'create') {
    const question = str(body.question, 300);
    const answer = str(body.answer, 2000);
    if (!question || !answer) return json({ error: 'שאלה ותשובה נדרשות' }, 400);
    const row = await faq.create(question, answer, userId);
    return json({ ok: true, item: row });
  }

  if (action === 'update') {
    const id = str(body.id, 64);
    if (!id) return json({ error: 'missing id' }, 400);
    const patch: any = {};
    if (typeof body.question === 'string') patch.question = str(body.question, 300);
    if (typeof body.answer === 'string') patch.answer = str(body.answer, 2000);
    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
    if (patch.question === '' || patch.answer === '') return json({ error: 'שאלה ותשובה לא יכולות להיות ריקות' }, 400);
    const row = await faq.update(id, patch, userId);
    return json({ ok: true, item: row });
  }

  if (action === 'delete') {
    const id = str(body.id, 64);
    if (!id) return json({ error: 'missing id' }, 400);
    await faq.remove(id);
    return json({ ok: true });
  }

  if (action === 'reorder') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : null;
    if (!ids || !ids.length) return json({ error: 'missing ids' }, 400);
    await faq.reorder(ids, userId);
    return json({ ok: true });
  }

  return json({ error: 'unknown action' }, 400);
};

// F-46: self-service radar sources. Same permission split as rules.ts:
// add/deactivate is `article:create` (reversible), delete is
// `settings:manage` (permanent).
//
// A URL is verified with a real fetch before it is saved, so the source
// list can never silently fill up with dead or fake links -- the same
// honesty rule as the built-in list in radar/feeds.ts.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';

const BACK = '/admin/ai/sources';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const f = await request.formData();
  const action = String(f.get('action') ?? '');
  const id = String(f.get('id') ?? '').trim();
  const stores = getAiStores();

  if (action === 'delete') {
    const denied = require_(locals.user, 'settings:manage');
    if (denied) return denied;
    if (id) await stores.radarSources.remove(id);
    return redirect(`${BACK}?done=deleted`, 303);
  }

  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  if (action === 'add') {
    const name = String(f.get('name') ?? '').trim();
    const url = String(f.get('url') ?? '').trim();
    const topic = String(f.get('topic') ?? '').trim();
    if (!name || !url) return redirect(`${BACK}?err=empty`, 303);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return redirect(`${BACK}?err=badurl`, 303);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return redirect(`${BACK}?err=badurl`, 303);
    }
    // A real fetch, not a format check: a URL that returns 404 or isn't a
    // feed at all would sit in the list looking fine and quietly never
    // produce anything.
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'LAHAV-AI-Radar/1.0 (+https://lahav.ai)' } });
      if (!res.ok) return redirect(`${BACK}?err=unreachable`, 303);
      const text = await res.text();
      if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<rdf')) {
        return redirect(`${BACK}?err=notfeed`, 303);
      }
    } catch {
      return redirect(`${BACK}?err=unreachable`, 303);
    }
    await stores.radarSources.add({ name, url, topic });
    return redirect(`${BACK}?done=added`, 303);
  }

  if ((action === 'activate' || action === 'deactivate') && id) {
    await stores.radarSources.setActive(id, action === 'activate');
    return redirect(`${BACK}?done=${action === 'activate' ? 'activated' : 'deactivated'}`, 303);
  }

  return redirect(BACK, 303);
};

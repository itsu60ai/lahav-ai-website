// Delete an uploaded image. ADMIN only (media:delete) -- this can break
// a page still using it as its social preview image.
//
// "Delete only when not in use, or warn clearly" (brief §10): this route
// scans every content_pages and services_content row (draft AND
// published) for the media id and refuses with a clear list of what
// references it, unless the caller passes force:true after seeing that
// list.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const PAGE_LABELS: Record<string, string> = {
  home: 'עמוד הבית',
  about: 'עמוד אודות',
  contact: 'עמוד צור קשר',
  faq: 'עמוד שאלות נפוצות',
  services: 'עמוד השירותים',
  navigation: 'ניווט',
  footer: 'פוטר',
};

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'media:delete');
  if (denied) return denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return json({ error: 'missing id' }, 400);
  const force = body.force === true;

  const usedIn: string[] = [];

  // Scan via the store interfaces rather than raw SQL, so this route
  // never needs direct D1 access.
  const contentIds = ['home', 'about', 'contact', 'faq', 'services', 'navigation', 'footer'];
  for (const pid of contentIds) {
    const draft = await locals.stores!.content.getDraftRaw(pid).catch(() => null);
    const pub = await locals.stores!.content.getPublishedRaw(pid).catch(() => null);
    if ((draft && draft.includes(id)) || (pub && pub.includes(id))) {
      usedIn.push(PAGE_LABELS[pid] ?? pid);
    }
  }
  // Services are keyed by slug, not a fixed content_pages id.
  for (const slug of ['crm', 'automations', 'web-development', 'app-development', 'ai-content']) {
    const draft = await locals.stores!.services.getDraftRaw(slug).catch(() => null);
    const pub = await locals.stores!.services.getPublishedRaw(slug).catch(() => null);
    if ((draft && draft.includes(id)) || (pub && pub.includes(id))) {
      usedIn.push(`שירות: ${slug}`);
    }
  }

  if (usedIn.length && !force) {
    return json(
      {
        error: 'התמונה בשימוש ולא נמחקה',
        usedIn,
        hint: 'אפשר למחוק בכל זאת, אבל העמודים שמופיעים למעלה יאבדו את התמונה הזו.',
      },
      409
    );
  }

  await locals.stores!.media.remove(id);
  return json({ ok: true, forcedPastUsage: usedIn.length > 0 });
};

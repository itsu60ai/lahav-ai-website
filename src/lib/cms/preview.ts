// Draft preview on the PUBLIC pages themselves.
//
// The article preview (admin/preview/[id].astro) lives under /admin/,
// which the existing middleware already protects. Page content preview
// works differently on purpose: it renders at the SAME url a visitor
// would use (?preview=1 on / or /about/ etc.), using the exact same
// template, because that is the only way "preview" is not a lie (brief
// §11: "do not create a fake text-only preview").
//
// That means these routes are NOT behind the /admin middleware gate, so
// this file does its own, independent auth check. A ?preview=1 with no
// valid admin/editor session is silently treated as a normal visitor
// request — it must never leak draft text (brief §24).
import type { AstroGlobal } from 'astro';
import { sessionCookieName, userFromToken } from './auth.ts';
import type { CmsStores } from './types.ts';

/**
 * True only when ?preview=1 is present AND the request carries a valid,
 * signed-in admin/editor session cookie. Also sets no-store + noindex on
 * the response so a draft can never be cached or crawled.
 *
 * Takes `Astro` from a page's frontmatter (AstroGlobal), not an
 * APIContext -- `.response` is only on the former.
 */
export async function resolvePreview(astro: AstroGlobal, stores: CmsStores): Promise<boolean> {
  if (astro.url.searchParams.get('preview') !== '1') return false;
  const token = astro.cookies.get(sessionCookieName)?.value;
  const user = await userFromToken(stores.sessions, token);
  if (!user) return false;
  astro.response.headers.set('cache-control', 'no-store, no-cache, must-revalidate');
  astro.response.headers.set('x-robots-tag', 'noindex, nofollow');
  return true;
}

// Access control for the admin.
//
// Two responsibilities, in order:
//   1. establish identity (session -> user) and expose the stores
//   2. refuse anything the user is not entitled to
//
// Per-permission checks live in the routes themselves, because only they
// know which permission applies. This gate handles authentication, CSRF
// and the blanket "must be signed in" rule.
import { defineMiddleware } from 'astro:middleware';
import { sessionCookieName, userFromToken, csrfValid } from './lib/cms/auth.ts';
import { getStores } from './lib/cms/context.ts';

const PROTECTED = ['/admin', '/api/admin'];
const PUBLIC_IN_ADMIN = ['/admin/login', '/api/admin/login'];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const p = url.pathname.replace(/\/+$/, '') || '/';

  // Every on-demand route gets the stores. This used to be a whitelist
  // (admin, /api/admin, /articles) but the website content CMS means
  // most public pages now read D1 too -- Home, Services, About, Contact,
  // FAQ, and the header/footer on every page that includes them.
  // getStores() only wraps the D1 binding; it performs no I/O itself, so
  // doing this unconditionally costs nothing on the pages that don't
  // end up querying anything.
  ctx.locals.stores = getStores();

  const isProtected = PROTECTED.some((b) => p === b || p.startsWith(b + '/'));
  if (!isProtected) return next();

  const token = ctx.cookies.get(sessionCookieName)?.value;
  const user = await userFromToken(ctx.locals.stores!.sessions, token);
  ctx.locals.user = user ?? undefined;
  ctx.locals.sessionToken = token;

  const isLoginRoute = PUBLIC_IN_ADMIN.some((b) => p === b);

  if (!user && !isLoginRoute) {
    if (p.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const to = new URL('/admin/login', url);
    if (p !== '/admin') to.searchParams.set('next', url.pathname);
    return ctx.redirect(to.pathname + to.search, 302);
  }

  if (user && p === '/admin/login') return ctx.redirect('/admin', 302);

  // Every state-changing admin request must carry a matching CSRF token.
  if (user && ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') {
    const sent =
      ctx.request.headers.get('x-csrf-token') ?? url.searchParams.get('csrf');
    if (!(await csrfValid(token, sent))) {
      return new Response(JSON.stringify({ error: 'bad csrf token' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  const res = await next();
  res.headers.set('cache-control', 'no-store, no-cache, must-revalidate');
  res.headers.set('x-robots-tag', 'noindex, nofollow');
  return res;
});

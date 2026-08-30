export const prerender = false;

import type { APIRoute } from 'astro';
import { logout, sessionCookieName } from '../../../lib/cms/auth.ts';

export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
  await logout(locals.stores!.sessions, cookies.get(sessionCookieName)?.value);
  cookies.delete(sessionCookieName, { path: '/' });
  return redirect('/admin/login', 303);
};

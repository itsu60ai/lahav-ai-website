// Server-side permission enforcement.
//
// Pages may hide buttons, but hiding is not security. Every protected
// route calls `require()` and gets a 403 Response if the signed-in user
// lacks the permission. The role string is never checked directly.
import { can, type Permission, type User } from './types.ts';

export function require_(user: User | undefined, permission: Permission): Response | null {
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (!can(user, permission)) {
    return new Response(
      JSON.stringify({ error: 'אין לכם הרשאה לבצע את הפעולה הזו', permission }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }
  return null;
}

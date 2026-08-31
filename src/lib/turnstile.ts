// The Turnstile SITE key is public by design: it is embedded in the page
// HTML for every visitor's browser. Only the SECRET key, used server-side
// in src/pages/api/contact.ts, is sensitive and it is never read here.
//
// Cloudflare's official always-pass test key is the fallback, so every
// form on the site stays testable before a real widget exists in the
// client's own dashboard.
import { env } from 'cloudflare:workers';

export function turnstileSiteKey(): string {
  return (env as any)?.TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
}

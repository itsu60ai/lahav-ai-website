// The Turnstile SITE key is public by design: it is embedded in the page
// HTML for every visitor's browser. Only the SECRET key, used server-side
// in src/pages/api/contact.ts, is sensitive and it is never read here.
//
// IT IS READ FROM TWO PLACES, and it has to be.
//
// Most routes are server rendered and can read a Worker secret at request
// time. The five service pages, /privacy and /404 are PRERENDERED: they
// are built before any runtime binding exists, so a Worker secret can
// never reach them and they would always fall back to the test key even
// with a real widget configured. That is exactly what was happening.
//
// So the build-time variable wins when it is set. Because the value is
// public, putting it in .env is correct rather than a compromise.
//
// Cloudflare's official always-pass test key remains the last resort, so
// every form on the site stays testable before a real widget exists in
// the client's own dashboard. When it is in use the widget shows visitors
// a red "For testing only" notice and provides NO bot protection.
import { env } from 'cloudflare:workers';

/** Cloudflare's documented always-pass test key. Not protection. */
export const TURNSTILE_TEST_KEY = '1x00000000000000000000AA';

export function turnstileSiteKey(): string {
  const atBuild = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
  if (atBuild) return atBuild;
  try {
    return (env as any)?.TURNSTILE_SITE_KEY || TURNSTILE_TEST_KEY;
  } catch {
    return TURNSTILE_TEST_KEY;
  }
}

/** True when the form is running on the test key, i.e. unprotected. */
export function turnstileIsTestKey(): boolean {
  return turnstileSiteKey() === TURNSTILE_TEST_KEY;
}

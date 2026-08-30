// The one place this folder touches Cloudflare bindings. Deliberately does
// NOT import anything from src/lib/cms/*.
import { env } from 'cloudflare:workers';
import { createLeadStore } from './d1.ts';
import type { LeadStore } from './types.ts';

export interface LeadEnv {
  leads: LeadStore;
  resendApiKey: string | undefined;
  turnstileSecretKey: string | undefined;
  rateLimiter: RateLimit | undefined;
}

export function getLeadEnv(): LeadEnv {
  const e = env as any;
  const db = e.DB as D1Database | undefined;
  if (!db) {
    throw new Error('D1 binding "DB" is missing. Check wrangler.jsonc.');
  }
  return {
    leads: createLeadStore(db),
    resendApiKey: e.RESEND_API_KEY,
    turnstileSecretKey: e.TURNSTILE_SECRET_KEY,
    rateLimiter: e.CONTACT_RATE_LIMITER,
  };
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // not cryptographic; just enough to group repeat submissions for abuse
  // review without keeping the raw address around
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return 'ip_' + (h >>> 0).toString(16);
}

export const newLeadId = () => crypto.randomUUID();

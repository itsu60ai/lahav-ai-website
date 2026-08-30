// The one place that binds the app to Cloudflare.
//
// Everything else asks for `CmsStores` and gets an interface. If the host
// changes, this file and `d1.ts` are what get replaced.
import { env } from 'cloudflare:workers';
import { createStores } from './d1.ts';
import type { CmsStores } from './types.ts';

export function getStores(): CmsStores {
  const db = (env as any).DB as D1Database | undefined;
  if (!db) {
    throw new Error(
      'D1 binding "DB" is missing. Check wrangler.jsonc and run through wrangler/astro dev.'
    );
  }
  return createStores(db);
}

/** Hebrew-friendly slug: keeps letters and digits, collapses the rest. */
export function slugify(input: string): string {
  const s = (input || '')
    .trim()
    .toLowerCase()
    .replace(/["'׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'article';
}

export const newId = () => crypto.randomUUID();

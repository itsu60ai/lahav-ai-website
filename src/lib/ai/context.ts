// Binds the AI engine to the same Cloudflare D1 database the CMS uses.
// Mirrors src/lib/cms/context.ts exactly, on purpose: same pattern, same
// physical database, different tables, zero shared code.
import { env } from 'cloudflare:workers';
import { createAiStores } from './d1.ts';
import type { AiStores } from './types.ts';

export function getAiStores(): AiStores {
  const db = (env as any).DB as D1Database | undefined;
  if (!db) {
    throw new Error(
      'D1 binding "DB" is missing. Check wrangler.jsonc and run through wrangler/astro dev.'
    );
  }
  return createAiStores(db);
}

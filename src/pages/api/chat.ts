// PUBLIC AI ASSISTANT ENDPOINT.
//
// Deliberately isolated from every existing backend system. It does not
// import from src/lib/cms/*, does not touch D1, does not read or write
// leads, and has no path to admin identity. It reads approved public
// copy, calls a model, and returns text.
//
// COST CONTROL, in order:
//   · its own rate-limit namespace, separate from the contact form
//   · a hard cap on message length
//   · a short history window, so a long conversation cannot grow the
//     prompt without bound
//   · a hard max_tokens in the provider layer
//   · prompt caching on the system block when Anthropic is the provider
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildKnowledge, SYSTEM_PROMPT } from '../../lib/chat/knowledge.ts';
import { askModel, providerName, type ChatTurn } from '../../lib/chat/provider.ts';

/** Longest single question we will forward. */
const MAX_CHARS = 500;
/** Turns of history kept. Four exchanges is plenty for this job. */
const MAX_TURNS = 8;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function limited(request: Request): Promise<boolean> {
  const limiter = (env as any)?.CHAT_RATE_LIMITER;
  if (!limiter) return false;
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'unknown';
  // Hash so a raw IP is never used as a durable key.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const key = [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16)).join('');
  try {
    const { success } = await limiter.limit({ key });
    return !success;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async () =>
  json({ ok: true, configured: providerName(env) !== null });

export const POST: APIRoute = async ({ request }) => {
  if (await limited(request)) {
    return json(
      { ok: false, code: 'rate_limited', error: 'יותר מדי הודעות בזמן קצר. אפשר לנסות שוב בעוד רגע.' },
      429
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: 'bad_request', error: 'הבקשה לא תקינה.' }, 400);
  }

  const incoming: ChatTurn[] = Array.isArray(body?.messages) ? body.messages : [];
  const history = incoming
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS);

  if (!history.length || history[history.length - 1].role !== 'user') {
    return json({ ok: false, code: 'bad_request', error: 'הבקשה לא תקינה.' }, 400);
  }

  const system = `${SYSTEM_PROMPT}\n\n${buildKnowledge()}`;
  const result = await askModel(env, system, history);

  if (!result.ok) {
    // We never fabricate an answer. When the assistant cannot run, it
    // says so and hands the visitor a real route to a person.
    const error =
      result.reason === 'not_configured'
        ? 'העוזר לא פעיל כרגע. אפשר לכתוב לנו בוואטסאפ או לתאם שיחה קצרה, ונענה בעצמנו.'
        : 'משהו לא עבד כרגע. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ.';
    // `detail` names internal models and upstream errors, so it stays in
    // the log and never goes to the visitor.
    if (result.detail) console.warn('[chat] upstream:', result.detail);
    return json({ ok: false, code: result.reason, error }, 503);
  }

  return json({ ok: true, reply: result.text });
};

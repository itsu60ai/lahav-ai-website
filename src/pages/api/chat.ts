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
//   · follow-up chips and "call me back" detection are keyword tables,
//     never a second model call
//
// TWO RESPONSE SHAPES, one behaviour:
//   · Accept: text/event-stream  -> Server-Sent Events, the answer as it
//     is written. Events: `delta` (a piece of text), `done` (the final
//     text plus follow-ups), `error`.
//   · anything else              -> the original single JSON object.
// The client feature-detects on the response content-type, so an old
// cached page and a new one both keep working.
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildKnowledge, SYSTEM_PROMPT, CLOSING_RULES, followUps, wantsCallback } from '../../lib/chat/knowledge.ts';
import { askModel, streamModel, providerName, type ChatTurn } from '../../lib/chat/provider.ts';
import { pageContextLine } from '../../lib/chat/pages.ts';

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

const NOT_CONFIGURED =
  'העוזר לא פעיל כרגע. אפשר לכתוב לנו בוואטסאפ או לתאם שיחה קצרה, ונענה בעצמנו.';
const UPSTREAM_ERROR = 'משהו לא עבד כרגע. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ.';

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
  const lastUser = history[history.length - 1].content;

  // The page the visitor is on is a hint, never text. `pageContextLine`
  // matches it against a closed table and returns a hand-written line,
  // so a crafted path cannot reach the prompt.
  const system = `${SYSTEM_PROMPT}\n\n${buildKnowledge()}${pageContextLine(body?.page)}\n${CLOSING_RULES}`;

  const wantsStream = (request.headers.get('accept') ?? '').includes('text/event-stream');

  if (!wantsStream) {
    const result = await askModel(env, system, history);
    if (!result.ok) {
      // We never fabricate an answer. When the assistant cannot run, it
      // says so and hands the visitor a real route to a person.
      const error = result.reason === 'not_configured' ? NOT_CONFIGURED : UPSTREAM_ERROR;
      // `detail` names internal models and upstream errors, so it stays
      // in the log and never goes to the visitor.
      if (result.detail) console.warn('[chat] upstream:', result.detail);
      return json({ ok: false, code: result.reason, error }, 503);
    }
    // A successful answer that still carries a detail means the preferred
    // provider failed and we fell back. Worth knowing about.
    if (result.detail) console.warn('[chat] fell back:', result.via, result.detail);
    return json({
      ok: true,
      reply: result.text,
      followUps: followUps(lastUser, result.text ?? ''),
      leadIntent: wantsCallback(lastUser, result.text ?? ''),
    });
  }

  // ── streamed ────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        for await (const evt of streamModel(env, system, history)) {
          if (evt.type === 'delta') {
            send('delta', { text: evt.text });
          } else if (evt.type === 'done') {
            if (evt.detail) console.warn('[chat] fell back:', evt.via, evt.detail);
            send('done', {
              reply: evt.text,
              followUps: followUps(lastUser, evt.text),
              leadIntent: wantsCallback(lastUser, evt.text),
            });
          } else {
            if (evt.detail) console.warn('[chat] upstream:', evt.detail);
            send('error', {
              code: evt.reason,
              error: evt.reason === 'not_configured' ? NOT_CONFIGURED : UPSTREAM_ERROR,
            });
          }
        }
      } catch (err) {
        console.warn('[chat] stream failed:', String((err as any)?.message ?? err).slice(0, 200));
        send('error', { code: 'upstream_error', error: UPSTREAM_ERROR });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
};

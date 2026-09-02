// MODEL PROVIDER ABSTRACTION.
//
// The rest of the chat never knows which model answered. Swapping the
// provider is a change to this file only.
//
// Order of preference:
//   1. Anthropic, when ANTHROPIC_API_KEY is set as a Worker secret.
//      Best Hebrew by a clear margin. Costs roughly $0.015 per
//      conversation on Haiku.
//   2. Cloudflare Workers AI, through the `AI` binding. Runs on the same
//      platform inside the free daily allocation, so the assistant works
//      with no external account at all. Weaker Hebrew.
//   3. Nothing configured. We say so honestly. We do NOT fake an answer.
//
// The frontend never sees a key: every call happens here, server side.
//
// STREAMING, and why only one provider streams.
//
// `streamModel` below yields the answer as it is written. Anthropic is
// streamed for real: its SSE deltas go straight out, so the visitor sees
// the reply appear. Workers AI is NOT streamed, on purpose. Its models
// are the ones that loop (see looksDegenerate), and the guard can only
// judge a FINISHED reply. Streaming a Workers AI model would mean either
// showing the visitor a degenerate reply we would otherwise have thrown
// away, or buffering the whole thing anyway and gaining nothing. So a
// Workers AI answer is produced whole, checked, and then emitted as a
// single chunk: the typing indicator stays up while the chain is tried,
// and the fallback behaviour is exactly what it was before.
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderResult {
  ok: boolean;
  text?: string;
  /** which provider actually answered, for logging only */
  via?: 'anthropic' | 'workers-ai';
  /** set when no provider could answer */
  reason?: 'not_configured' | 'upstream_error';
  /** upstream failure text, for diagnostics only, never shown to a visitor */
  detail?: string;
}

/** One step of a streamed answer. */
export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; via: 'anthropic' | 'workers-ai'; text: string; detail?: string }
  | { type: 'fail'; reason: 'not_configured' | 'upstream_error'; detail?: string };

/** Hard ceiling on a reply, so one question can never run up a bill. */
const MAX_TOKENS = 420;

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

/** Tried in order until one answers ACCEPTABLY. See askModel. */
const WORKERS_AI_MODELS = [
  '@cf/google/gemma-3-12b-it',
  '@cf/mistralai/mistral-small-3.1-24b-instruct',
  '@cf/qwen/qwen2.5-14b-instruct',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

// DEGENERACY GUARD.
//
// Small open models loop in Hebrew. Llama 3.3 answered "how much does it
// cost" with 1,467 characters of the same clause repeated. Serving that
// is worse than serving nothing, so a reply that repeats itself is
// rejected and the next model is tried.
function looksDegenerate(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // an answer this long is already off-brief; the prompt asks for 2-4
  // sentences
  if (t.length > 900) return true;
  const words = t.split(/\s+/).filter((w) => w.length > 1);
  if (words.length < 4) return false;
  // repeated 4-grams
  const grams = new Map<string, number>();
  for (let i = 0; i + 4 <= words.length; i++) {
    const g = words.slice(i, i + 4).join(' ');
    grams.set(g, (grams.get(g) ?? 0) + 1);
    if ((grams.get(g) ?? 0) > 2) return true;
  }
  // vocabulary collapse
  const unique = new Set(words).size;
  return words.length > 25 && unique / words.length < 0.42;
}

export function providerName(env: any): 'anthropic' | 'workers-ai' | null {
  if (env?.ANTHROPIC_API_KEY) return 'anthropic';
  if (env?.AI) return 'workers-ai';
  return null;
}

function anthropicBody(system: string, history: ChatTurn[], stream: boolean) {
  return JSON.stringify({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    stream,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });
}

function anthropicHeaders(key: string) {
  return {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  };
}

// Workers AI. The chat template takes the system prompt as its own first
// message rather than a separate field.
// A chain, not one id. Workers AI retires models on a schedule and a
// single hard-coded name turns the assistant off the day that happens,
// which is exactly how this broke the first time. Ordered by Hebrew
// quality; the first that answers ACCEPTABLY wins.
async function runWorkersAI(
  env: any,
  system: string,
  history: ChatTurn[],
  anthropicDetail: string
): Promise<ProviderResult> {
  if (!env?.AI) {
    return { ok: false, reason: 'upstream_error', detail: anthropicDetail || 'no AI binding' };
  }
  const messages = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  let lastDetail = anthropicDetail;
  for (const model of WORKERS_AI_MODELS) {
    try {
      const out: any = await env.AI.run(model, {
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        repetition_penalty: 1.15,
        messages,
      });
      const text = String(out?.response ?? '').trim();
      if (!text) { lastDetail = `empty from ${model}`; continue; }
      if (looksDegenerate(text)) { lastDetail = `degenerate from ${model}`; continue; }
      // Carry the Anthropic failure through even on success, so a silent
      // downgrade to the free model is visible in the log rather than
      // looking like everything is fine.
      return { ok: true, text, via: 'workers-ai', detail: anthropicDetail || undefined };
    } catch (err) {
      lastDetail = `${model}: ${String((err as any)?.message ?? err).slice(0, 120)}`;
    }
  }
  return { ok: false, reason: 'upstream_error', detail: lastDetail };
}

export async function askModel(
  env: any,
  system: string,
  history: ChatTurn[]
): Promise<ProviderResult> {
  const which = providerName(env);
  if (!which) return { ok: false, reason: 'not_configured' };

  let anthropicDetail = '';
  try {
    if (which === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: anthropicHeaders(env.ANTHROPIC_API_KEY),
        body: anthropicBody(system, history, false),
      });
      if (!res.ok) {
        // The upstream body says WHY: a bad key, a retired model id, an
        // exhausted balance. It used to be discarded, which turned every
        // one of those into an indistinguishable "upstream_error".
        anthropicDetail = `anthropic ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`;
      } else {
        const data: any = await res.json();
        const text = (data?.content ?? [])
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('')
          .trim();
        if (text) return { ok: true, text, via: 'anthropic' };
        anthropicDetail = 'anthropic returned no text';
      }
      // FALL THROUGH TO WORKERS AI rather than giving up. Preferring
      // Anthropic must never make the assistant WORSE than it was
      // without a key, which is what an early return did: configuring
      // the key took the free fallback out of the chain entirely.
    }
    return await runWorkersAI(env, system, history, anthropicDetail);
  } catch (err) {
    return { ok: false, reason: 'upstream_error', detail: String((err as any)?.message ?? err).slice(0, 200) };
  }
}

/**
 * The same chain as askModel, delivered progressively.
 *
 * Anthropic streams token by token. Workers AI arrives in one piece,
 * after the degeneracy guard has passed it. Either way the caller sees
 * `delta` events followed by exactly one terminal `done` or `fail`.
 */
export async function* streamModel(
  env: any,
  system: string,
  history: ChatTurn[]
): AsyncGenerator<StreamEvent> {
  const which = providerName(env);
  if (!which) {
    yield { type: 'fail', reason: 'not_configured' };
    return;
  }

  let anthropicDetail = '';
  let emitted = '';

  try {
    if (which === 'anthropic') {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: anthropicHeaders(env.ANTHROPIC_API_KEY),
          body: anthropicBody(system, history, true),
        });
        if (!res.ok || !res.body) {
          anthropicDetail = `anthropic ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`;
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          let streamError = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            // SSE frames are separated by a blank line
            let cut: number;
            while ((cut = buf.indexOf('\n\n')) >= 0) {
              const frame = buf.slice(0, cut);
              buf = buf.slice(cut + 2);
              for (const rawLine of frame.split('\n')) {
                const line = rawLine.trim();
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === '[DONE]') continue;
                let evt: any;
                try { evt = JSON.parse(payload); } catch { continue; }
                if (evt?.type === 'content_block_delta' && typeof evt?.delta?.text === 'string') {
                  const piece = evt.delta.text;
                  if (piece) {
                    emitted += piece;
                    yield { type: 'delta', text: piece };
                  }
                } else if (evt?.type === 'error') {
                  streamError = `anthropic stream error: ${String(evt?.error?.message ?? '').slice(0, 200)}`;
                }
              }
            }
          }
          const finished = emitted.trim();
          if (finished) {
            // Text already reached the visitor. Even if the stream ended
            // badly we finish honestly with what was said rather than
            // wiping the bubble and starting a second answer under it.
            yield { type: 'done', via: 'anthropic', text: finished, detail: streamError || undefined };
            return;
          }
          anthropicDetail = streamError || 'anthropic stream returned no text';
        }
      } catch (err) {
        anthropicDetail = `anthropic stream: ${String((err as any)?.message ?? err).slice(0, 200)}`;
      }
      // Nothing was emitted, so falling back is still safe: the client
      // is showing the typing indicator and no partial text.
    }

    const result = await runWorkersAI(env, system, history, anthropicDetail);
    if (result.ok && result.text) {
      yield { type: 'delta', text: result.text };
      yield { type: 'done', via: 'workers-ai', text: result.text, detail: result.detail };
      return;
    }
    yield { type: 'fail', reason: result.reason ?? 'upstream_error', detail: result.detail };
  } catch (err) {
    yield {
      type: 'fail',
      reason: 'upstream_error',
      detail: String((err as any)?.message ?? err).slice(0, 200),
    };
  }
}

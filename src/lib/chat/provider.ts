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

/** Hard ceiling on a reply, so one question can never run up a bill. */
const MAX_TOKENS = 420;

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

export async function askModel(
  env: any,
  system: string,
  history: ChatTurn[]
): Promise<ProviderResult> {
  const which = providerName(env);
  if (!which) return { ok: false, reason: 'not_configured' };

  try {
    if (which === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: MAX_TOKENS,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) return { ok: false, reason: 'upstream_error' };
      const data: any = await res.json();
      const text = (data?.content ?? [])
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('')
        .trim();
      return text ? { ok: true, text, via: 'anthropic' } : { ok: false, reason: 'upstream_error' };
    }

    // Workers AI. The chat template takes the system prompt as its own
    // first message rather than a separate field.
    // A chain, not one id. Workers AI retires models on a schedule and a
    // single hard-coded name turns the assistant off the day that
    // happens, which is exactly how this broke the first time. Ordered by
    // Hebrew quality; the first that answers wins.
    const messages = [
      { role: 'system', content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];
    let lastDetail = '';
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
        return { ok: true, text, via: 'workers-ai' };
      } catch (err) {
        lastDetail = `${model}: ${String((err as any)?.message ?? err).slice(0, 120)}`;
      }
    }
    return { ok: false, reason: 'upstream_error', detail: lastDetail };
  } catch (err) {
    return { ok: false, reason: 'upstream_error', detail: String((err as any)?.message ?? err).slice(0, 200) };
  }
}

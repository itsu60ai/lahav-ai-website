// Stage D, D1: the PAID text provider. Calls the Anthropic Messages API.
//
// THIS IS THE ONLY FILE IN THE PROJECT THAT SPENDS MONEY ON TEXT
// GENERATION, and it only runs when ai_settings.provider_mode is 'api',
// which is not the default and which only a `settings:manage` admin can
// set. A fresh deploy never reaches this file.
//
// WHY IT STREAMS (2026-09-03, after every generation in production failed):
// the first version sent one non-streaming request with max_tokens 16000.
// A full article takes minutes to write, Cloudflare cuts a request that
// waits that long, and the recorded failure in ai_generations was always
// the same: "Anthropic החזיר תשובה שאינה קריאה (סטטוס 524)". A 524 is
// Cloudflare's own timeout, not an Anthropic error, so the engine had
// never once produced an article through this path. Streaming fixes it at
// the root: bytes arrive continuously from the first second, so nothing
// idles long enough to be cut. The same technique already works in
// src/lib/chat/provider.ts, which is where the SSE handling here comes
// from. Streaming is also what Anthropic asks for on long generations.
//
// WHY RAW fetch AND NOT @anthropic-ai/sdk: this runs inside a Cloudflare
// Worker, where bundle size is a real constraint, and the build was asked
// not to add heavy dependencies. The Messages API is one POST with three
// headers; the SDK would add a dependency for no behaviour this needs.
//
// WHY IT REUSES THE MANUAL PARSER: manual mode already defines the exact
// output contract (buildOutputFormatInstructions) and already parses it
// into a GeneratorOutput (parseManualResult). Sending the same instructions
// to the API and running the reply through the same parser means API mode
// cannot drift from manual mode, and the downstream
// validateGeneratorOutput + runGates see an identical shape either way.
// One contract, one parser, two transports.
import { buildOutputFormatInstructions, parseManualResult } from './manual.ts';
import type { GeneratorInput, GeneratorMeta, GeneratorOutput, TextGenerator } from '../types.ts';

/**
 * Article generation model. Sonnet 5 is used deliberately rather than a
 * larger model: the article body is a constrained, heavily instructed
 * writing task with the style guide, truth rules and learned rules all
 * supplied in the prompt, and the output goes through the same human
 * review as every other mode.
 */
const MODEL = 'claude-sonnet-5';
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Published Anthropic list pricing for claude-sonnet-5, in US dollars per
 * million tokens: $2.00 input, $10.00 output.
 *
 * These are constants in code rather than a live lookup on purpose: a
 * generation must never make a second billed call just to price the first
 * one. If Anthropic changes list pricing, this is the one place to update,
 * and every historical row in ai_generations keeps the cost that was
 * actually computed at the time, which is what an audit trail should do.
 */
const USD_PER_INPUT_TOKEN = 2.0 / 1_000_000;
const USD_PER_OUTPUT_TOKEN = 10.0 / 1_000_000;

export function computeCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * USD_PER_INPUT_TOKEN + outputTokens * USD_PER_OUTPUT_TOKEN;
}

/** max_tokens for one article: body, SEO package and its diagrams. Lowered
 *  from 16000 once real output was measured. A finished article in this
 *  format lands well under this, and a lower ceiling is faster and cheaper
 *  for the same result. */
const MAX_TOKENS = 12000;

export class ApiGenerationError extends Error {}

export const apiGenerator: TextGenerator = {
  mode: 'api',

  async generate(input: GeneratorInput): Promise<{ output: GeneratorOutput; meta: GeneratorMeta }> {
    const { env } = await import('cloudflare:workers');
    const apiKey = (env as any)?.ANTHROPIC_API_KEY as string | undefined;

    if (!apiKey) {
      throw new ApiGenerationError(
        'מפתח ANTHROPIC_API_KEY אינו מוגדר. מצב API אינו יכול לפעול בלעדיו. הגדירו אותו כסוד ב-Cloudflare, או החזירו את מצב הספק ל"בדיקה" או ל"הדבקה ידנית" במסך ההגדרות.'
      );
    }

    // Same contract as manual mode, byte for byte.
    const prompt = `${input.promptText}\n\n---\n\n${buildOutputFormatInstructions()}`;

    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (e) {
      // A network failure must surface as a failure, never as an article.
      throw new ApiGenerationError(
        `הקריאה ל-Anthropic נכשלה ברמת הרשת ולכן לא נוצרה כתבה. פרטים: ${String(e).slice(0, 200)}`
      );
    }

    // An error reply is NOT streamed: it comes back as ordinary JSON with a
    // non-2xx status, so it is read here, before the stream loop.
    if (!res.ok) {
      let detail = `סטטוס ${res.status}`;
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body?.error?.message) detail = body.error.message;
      } catch {
        /* keep the status-only detail */
      }
      // Deliberately specific about the common, actionable cases. An
      // opaque "something went wrong" would send the admin hunting.
      const hint =
        res.status === 401
          ? ' נראה שהמפתח שגוי או פג תוקף.'
          : res.status === 429
            ? ' חריגה ממגבלת קצב או מיתרת החשבון. אפשר לנסות שוב מאוחר יותר.'
            : res.status >= 500
              ? ' תקלה זמנית בצד Anthropic. אפשר לנסות שוב.'
              : '';
      throw new ApiGenerationError(
        `הקריאה ל-Anthropic נכשלה ולכן לא נוצרה כתבה.${hint} פרטים: ${String(detail).slice(0, 300)}`
      );
    }

    if (!res.body) {
      throw new ApiGenerationError('Anthropic לא החזיר תוכן כלל. לא נוצרה כתבה.');
    }

    // ── read the SSE stream ──
    // Frame handling mirrors src/lib/chat/provider.ts, which has been
    // running against this API in production. Usage and stop_reason arrive
    // on their own events rather than in one final object, so they are
    // captured as they pass.
    let text = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason = '';
    let streamError = '';

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    try {
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
            try {
              evt = JSON.parse(payload);
            } catch {
              continue;
            }
            if (evt?.type === 'content_block_delta' && typeof evt?.delta?.text === 'string') {
              text += evt.delta.text;
            } else if (evt?.type === 'message_start') {
              inputTokens = evt?.message?.usage?.input_tokens ?? 0;
            } else if (evt?.type === 'message_delta') {
              if (evt?.usage?.output_tokens) outputTokens = evt.usage.output_tokens;
              if (evt?.delta?.stop_reason) stopReason = evt.delta.stop_reason;
            } else if (evt?.type === 'error') {
              streamError = String(evt?.error?.message ?? 'שגיאה בזרם').slice(0, 300);
            }
          }
        }
      }
    } catch (e) {
      throw new ApiGenerationError(
        `הזרם מ-Anthropic נקטע ולכן לא נוצרה כתבה. פרטים: ${String(e).slice(0, 200)}`
      );
    }

    if (streamError) {
      throw new ApiGenerationError(
        `הקריאה ל-Anthropic נכשלה באמצע ולכן לא נוצרה כתבה. פרטים: ${streamError}`
      );
    }

    const costUsd = computeCostUsd(inputTokens, outputTokens);

    // A refusal is a real, documented outcome. Treat it as a failure with
    // a clear message; never fabricate an article to fill the gap.
    if (stopReason === 'refusal') {
      throw new ApiGenerationError(
        'המודל סירב לכתוב את הכתבה הזו. לא נוצרה כתבה. בדקו את הבריף ואת ההערות, ונסו לנסח מחדש.'
      );
    }

    const raw = text.trim();
    if (!raw) {
      throw new ApiGenerationError('Anthropic החזיר תשובה ריקה. לא נוצרה כתבה. אפשר לנסות שוב.');
    }

    // Truncation is not a silent condition: a cut-off article would parse
    // into something that looks complete and is not. Checked BEFORE the
    // parse, so a truncated reply can never reach the article table.
    if (stopReason === 'max_tokens') {
      throw new ApiGenerationError(
        'התשובה נקטעה באמצע כי היא חרגה מאורך התשובה המרבי. לא נוצרה כתבה חלקית בכוונה. נסו שוב, או קצרו את הבריף.'
      );
    }

    // The same parser manual mode uses, so the same guarantees apply.
    const parsed = parseManualResult(raw, input.opportunity, input.brief);

    if (parsed.blocked || !parsed.output) {
      throw new ApiGenerationError(
        `התשובה שהתקבלה לא הייתה בפורמט הנדרש ולכן לא נוצרה כתבה. ${parsed.warnings.join(' ')}`.trim()
      );
    }

    return {
      output: { ...parsed.output, photoPrompts: parsed.photoPrompts },
      meta: {
        model: MODEL,
        mode: 'api',
        // Real, measured numbers straight from the stream. Never estimated.
        inputTokens,
        outputTokens,
        costUsd,
      },
    };
  },
};

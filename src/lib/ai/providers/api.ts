// Stage D, D1: the PAID text provider. Calls the Anthropic Messages API.
//
// THIS IS THE ONLY FILE IN THE PROJECT THAT SPENDS MONEY ON TEXT
// GENERATION, and it only runs when ai_settings.provider_mode is 'api',
// which is not the default and which only a `settings:manage` admin can
// set. A fresh deploy never reaches this file.
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

/** max_tokens for one article. Generous enough that a full article plus its
 *  SEO package and SVG diagram is never cut off mid-sentence. */
const MAX_TOKENS = 16000;

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
  stop_reason?: string;
  error?: { type?: string; message?: string };
}

/** Reads the key from the Worker environment. Configured as a secret. */
function readApiKey(): string {
  // Imported lazily and defensively: `cloudflare:workers` env is present
  // in the Worker runtime, and a missing key must produce a clear Hebrew
  // error rather than a crash.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const key = (globalThis as any).__ANTHROPIC_API_KEY__;
    if (typeof key === 'string' && key) return key;
  } catch {
    /* falls through to the env read below */
  }
  return '';
}

export class ApiGenerationError extends Error {}

export const apiGenerator: TextGenerator = {
  mode: 'api',

  async generate(input: GeneratorInput): Promise<{ output: GeneratorOutput; meta: GeneratorMeta }> {
    const { env } = await import('cloudflare:workers');
    const apiKey = ((env as any)?.ANTHROPIC_API_KEY as string | undefined) || readApiKey();

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
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (e) {
      // A network failure must surface as a failure, never as an article.
      throw new ApiGenerationError(
        `הקריאה ל-Anthropic נכשלה ברמת הרשת ולכן לא נוצרה כתבה. פרטים: ${String(e).slice(0, 200)}`
      );
    }

    let data: AnthropicResponse;
    try {
      data = (await res.json()) as AnthropicResponse;
    } catch {
      throw new ApiGenerationError(
        `Anthropic החזיר תשובה שאינה קריאה (סטטוס ${res.status}). לא נוצרה כתבה.`
      );
    }

    if (!res.ok) {
      const detail = data.error?.message ?? `סטטוס ${res.status}`;
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

    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const costUsd = computeCostUsd(inputTokens, outputTokens);

    // A refusal is a real, documented outcome. Treat it as a failure with
    // a clear message; never fabricate an article to fill the gap.
    if (data.stop_reason === 'refusal') {
      throw new ApiGenerationError(
        'המודל סירב לכתוב את הכתבה הזו. לא נוצרה כתבה. בדקו את הבריף ואת ההערות, ונסו לנסח מחדש.'
      );
    }

    const raw = (data.content ?? [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('\n')
      .trim();

    if (!raw) {
      throw new ApiGenerationError(
        'Anthropic החזיר תשובה ריקה. לא נוצרה כתבה. אפשר לנסות שוב.'
      );
    }

    // The same parser manual mode uses, so the same guarantees apply.
    const parsed = parseManualResult(raw, input.opportunity, input.brief);

    if (parsed.blocked || !parsed.output) {
      throw new ApiGenerationError(
        `התשובה שהתקבלה לא הייתה בפורמט הנדרש ולכן לא נוצרה כתבה. ${parsed.warnings.join(' ')}`.trim()
      );
    }

    // Truncation is not a silent condition: a cut-off article would parse
    // into something that looks complete and is not.
    if (data.stop_reason === 'max_tokens') {
      throw new ApiGenerationError(
        'התשובה נקטעה באמצע כי היא חרגה מאורך התשובה המרבי. לא נוצרה כתבה חלקית בכוונה. נסו שוב, או קצרו את הבריף.'
      );
    }

    return {
      output: parsed.output,
      meta: {
        model: MODEL,
        mode: 'api',
        // Real, measured numbers straight from the response. Never estimated.
        inputTokens,
        outputTokens,
        costUsd,
      },
    };
  },
};

// Describes a photo in Hebrew, for automatic alt text on a manually
// uploaded image — the thing Cloudflare Workers AI could not cleanly do:
// its dedicated captioner (@cf/unum/uform-gen2-qwen-500m) is deprecated,
// and its general vision model's exact request shape (and a Meta license
// gate on top of it) could not be confirmed against current documentation
// without shipping blind. Claude already has vision, this project already
// pays for the Claude API for article writing, and it can be instructed
// in Hebrew directly — no separate account, no separate uncertainty.
//
// NOT the same file as src/lib/ai/providers/api.ts: that one writes whole
// articles (minutes long, must stream to survive Cloudflare's ~100s
// non-streaming cutoff — see that file's own header). A caption is one
// short sentence back in well under a second; a plain request is enough
// and keeps this file simple.
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/** Haiku, not Sonnet: this is a short, low-stakes description task — the
 *  same tier already used for the site chat (see src/lib/chat/provider.ts)
 *  rather than the model reserved for writing whole articles. */
const MODEL = 'claude-haiku-4-5';

const MAX_TOKENS = 120;

const PROMPT =
  'תארו במשפט אחד קצר בעברית מה רואים בתמונה הזו. זה ישמש כטקסט חלופי (alt) ' +
  'לנגישות ול-SEO, אז תארו רק את מה שממש רואים בפריים בפועל, קונקרטי ולא כללי. ' +
  'בלי מבוא, בלי "בתמונה רואים", ישר התיאור. עד כ-15 מילים.';

export class CaptionError extends Error {}

/**
 * `mimeType` must be one of Claude's supported image formats
 * (image/jpeg, image/png, image/gif, image/webp) — the same set already
 * enforced on upload by src/lib/cms/media.ts, so nothing extra to validate
 * here.
 */
export async function captionImage(base64Data: string, mimeType: string): Promise<string> {
  const { env } = await import('cloudflare:workers');
  const apiKey = (env as any)?.ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) throw new CaptionError('ANTHROPIC_API_KEY אינו מוגדר');

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
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    throw new CaptionError(`הקריאה נכשלה ברמת הרשת: ${String(e).slice(0, 200)}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new CaptionError(`Anthropic החזיר ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    stop_reason?: string;
    content?: { type: string; text?: string }[];
  };

  // A refusal here just means "no caption", never a fabricated one.
  if (data.stop_reason === 'refusal') throw new CaptionError('המודל סירב לתאר את התמונה הזו');

  const text = (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join(' ')
    .trim();
  if (!text) throw new CaptionError('לא התקבל תיאור');

  return text.slice(0, 300);
}

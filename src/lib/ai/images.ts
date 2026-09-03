// Generates a real photograph-style image for an article, on Cloudflare's
// own Workers AI. The engine could previously only draw vector diagrams,
// which is why every article looked the same and why the client called the
// pictures boring.
//
// WHY WORKERS AI AND NOT AN EXTERNAL IMAGE API: the `AI` binding is already
// configured in wrangler.jsonc and already used by the chat fallback, so
// this needs no new account, no new secret and no new vendor. It also runs
// inside the same Worker, so the bytes never cross the public internet
// before they are stored.
//
// WHERE THE BYTES GO: straight into the EXISTING media library
// (MediaStore), the same one a human upload uses, and the article
// references it as /api/media/<id> like any other image on the site. The
// AI engine gets no private storage path of its own.
import type { MediaStore } from '../cms/types.ts';

/**
 * FLUX.1 [schnell] — a distilled model built for very few steps, which is
 * what makes it usable inside a request. Quality is well past "stock photo
 * of a robot", and it is the strongest text-to-image model on the platform.
 */
const MODEL = '@cf/black-forest-labs/flux-1-schnell';

/** Fewer steps is faster and cheaper; 4 is this model's designed operating
 *  point and going higher buys very little. */
const STEPS = 4;

/** The media library stores base64 in D1 and caps uploads well below this,
 *  so an oversized generation is rejected rather than bloating a row. */
const MAX_IMAGE_BYTES = 700_000;

export class ImageGenerationError extends Error {}

/**
 * House style, applied to every prompt so a run of articles looks like one
 * publication rather than a stock-photo grab bag. Deliberately describes a
 * REAL photographic scene: the brief asks for pictures that look like a
 * person chose them, and an abstract "AI concept" render is exactly the
 * generic filler being replaced.
 */
const STYLE_SUFFIX =
  'editorial photograph, natural window light, muted realistic colours, ' +
  'shallow depth of field, candid documentary feel, real workplace, ' +
  'no text, no words, no letters, no logos, no charts, no user interface, ' +
  'not an illustration, not 3d render, no robots, no glowing brains';

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  // Chunked: a single spread over a large array blows the call stack.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export interface GeneratedImage {
  /** the URL to put in an `img` block */
  src: string;
  mediaId: string;
  sizeBytes: number;
}

/**
 * Generates one image and files it in the media library.
 *
 * Returns null rather than throwing when the image cannot be produced: an
 * article without a picture is a perfectly good article, and a failed
 * decoration must never destroy a finished piece of writing. Every failure
 * reason is returned in `warnings` for the review screen.
 */
export async function generateAndStoreImage(args: {
  description: string;
  alt: string;
  media: MediaStore;
  createdBy: string;
  slug: string;
  warnings: string[];
}): Promise<GeneratedImage | null> {
  const { description, alt, media, createdBy, slug, warnings } = args;
  const clean = description.trim();
  if (!clean) return null;

  let ai: any;
  try {
    const { env } = await import('cloudflare:workers');
    ai = (env as any)?.AI;
  } catch {
    ai = null;
  }
  if (!ai) {
    warnings.push('לא נוצרה תמונה: חיבור ה-AI של Cloudflare אינו זמין.');
    return null;
  }

  let bytes: Uint8Array;
  try {
    const res: any = await ai.run(MODEL, {
      prompt: `${clean}. ${STYLE_SUFFIX}`,
      steps: STEPS,
    });

    // The model returns base64 JPEG on `image`. Newer runtimes may hand
    // back a stream instead, so both shapes are accepted rather than
    // assuming one and failing opaquely on the other.
    if (typeof res?.image === 'string') {
      bytes = base64ToBytes(res.image);
    } else if (res instanceof ReadableStream) {
      const buf = await new Response(res).arrayBuffer();
      bytes = new Uint8Array(buf);
    } else if (res?.image instanceof ReadableStream) {
      const buf = await new Response(res.image).arrayBuffer();
      bytes = new Uint8Array(buf);
    } else {
      warnings.push('לא נוצרה תמונה: התקבלה תשובה בפורמט לא מוכר ממודל התמונות.');
      return null;
    }
  } catch (e) {
    warnings.push(`לא נוצרה תמונה: ${String((e as any)?.message ?? e).slice(0, 160)}`);
    return null;
  }

  if (!bytes.length) {
    warnings.push('לא נוצרה תמונה: מודל התמונות החזיר קובץ ריק.');
    return null;
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    warnings.push('לא נוצרה תמונה: הקובץ שהתקבל גדול מהמותר בספריית המדיה.');
    return null;
  }

  try {
    const row = await media.create({
      filename: `${slug || 'article'}-ai.jpg`.slice(0, 200),
      alt: alt.slice(0, 300),
      mime: 'image/jpeg',
      // FLUX schnell renders square by default on this binding. Recorded
      // as the real values rather than parsed back out of the JPEG.
      width: 1024,
      height: 1024,
      sizeBytes: bytes.byteLength,
      dataB64: bytesToBase64(bytes),
      createdBy,
    });
    return { src: `/api/media/${row.id}`, mediaId: row.id, sizeBytes: bytes.byteLength };
  } catch (e) {
    warnings.push(`התמונה נוצרה אך לא נשמרה: ${String((e as any)?.message ?? e).slice(0, 160)}`);
    return null;
  }
}

// Media upload validation.
//
// Images are stored as base64 in D1 (see migrations/0007_website_cms.sql
// for why: R2 is not enabled on this Cloudflare account yet). D1 rows
// have a practical size ceiling well under the account's page-level
// limits, so uploads are capped hard, before the bytes ever reach a
// query. This is a "simple practical media library" by design (brief
// §10), not a general asset store.
export const MAX_UPLOAD_BYTES = 700_000; // ~700 KB original file
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface ValidatedUpload {
  ok: true;
  mime: string;
  bytes: Uint8Array;
}
export interface RejectedUpload {
  ok: false;
  error: string;
}

export async function validateUpload(file: File): Promise<ValidatedUpload | RejectedUpload> {
  if (!ALLOWED_MIME.includes(file.type as any)) {
    return { ok: false, error: 'סוג קובץ לא נתמך. אפשר להעלות JPG, PNG או WebP בלבד.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `הקובץ גדול מדי (${Math.round(file.size / 1024)}KB). הגודל המרבי הוא ${Math.round(
        MAX_UPLOAD_BYTES / 1024
      )}KB. אפשר לכווץ את התמונה ולנסות שוב.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: 'הקובץ ריק.' };
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  // Confirm the bytes actually look like the claimed type, rather than
  // trusting the browser-supplied MIME string alone.
  const looksLike = {
    'image/jpeg': buf[0] === 0xff && buf[1] === 0xd8,
    'image/png': buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
    'image/webp': buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50,
  }[file.type as string];
  if (!looksLike) {
    return { ok: false, error: 'תוכן הקובץ לא תואם לסוג שהוצהר.' };
  }
  return { ok: true, mime: file.type, bytes: buf };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Best-effort dimensions for PNG/JPEG/WebP, no image library required. */
export function readDimensions(bytes: Uint8Array, mime: string): { width: number; height: number } | null {
  try {
    if (mime === 'image/png') {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return { width: view.getUint32(16), height: view.getUint32(20) };
    }
    if (mime === 'image/jpeg') {
      let i = 2;
      while (i < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const marker = bytes[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const len = view.getUint16(i + 2);
        i += 2 + len;
      }
      return null;
    }
    if (mime === 'image/webp') {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      // VP8X extended format carries explicit dimensions; the simple
      // lossy/lossless variants are left unmeasured rather than guessed.
      if (String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]) === 'VP8X') {
        const width = 1 + (view.getUint32(24, true) & 0xffffff);
        const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
        return { width, height };
      }
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

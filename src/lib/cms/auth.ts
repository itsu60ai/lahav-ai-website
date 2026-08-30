// Authentication and sessions.
//
// STORAGE BOUNDARY (this was a real defect in the previous version):
// this file imports NO database driver and contains NO SQL. It receives a
// UserStore and a SessionStore. Changing the database, or handing
// authentication to an external provider later, does not touch this file.
//
// RUNTIME: everything here uses WebCrypto, which exists in Workers and in
// Node. There is no `node:crypto` import, so the same code runs in both.
//
// PASSWORD HASHING, AND AN HONEST NOTE ABOUT IT:
// Cloudflare caps PBKDF2 at 100,000 iterations, and the Workers free plan
// allows 10ms CPU per request. OWASP recommends 600,000 for PBKDF2-SHA256,
// so this is measurably weaker than the scrypt used when this ran on Node.
//
// Three things carry the load instead:
//   1. Passwords are GENERATED, long and high entropy (see the setup
//      script). Brute force against ~100 bits of entropy is infeasible
//      regardless of iteration count.
//   2. Failed logins lock the account, so online guessing is throttled.
//   3. Only the hash is stored, salted per user.
//
// Before launch this should move to Cloudflare Access, which removes
// password handling from the application entirely and brings MFA at no
// cost. See docs/CMS.md.
import type { Role, SessionStore, User, UserStore } from './types.ts';

const SESSION_COOKIE = 'lahav_session';
const SESSION_DAYS = 7;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

// Cloudflare's hard ceiling. Do not raise: SubtleCrypto rejects above it.
const PBKDF2_ITERATIONS = 100_000;
const HASH_BYTES = 32;

const enc = new TextEncoder();

// ───────────────────────────────── helpers

function toHex(buf: ArrayBufferLike): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function sha256Hex(v: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(v)));
}

/** constant time compare, so a wrong guess leaks nothing through timing */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function randomHex(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b.buffer);
}

function randomToken(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ───────────────────────────────── passwords

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_BYTES * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = fromHex(randomHex(16));
  const hash = await derive(password, salt);
  return { hash: toHex(hash.buffer), salt: toHex(salt.buffer) };
}

async function verifyPassword(password: string, hashHex: string, saltHex: string) {
  const expected = fromHex(hashHex);
  const actual = await derive(password, fromHex(saltHex));
  return timingSafeEqual(expected, actual);
}

// ───────────────────────────────── users

export async function createUser(
  users: UserStore,
  opts: { email: string; name: string; password: string; role?: Role }
): Promise<User> {
  const email = opts.email.trim().toLowerCase();
  if (await users.findByEmail(email)) throw new Error('a user with that email already exists');
  const { hash, salt } = await hashPassword(opts.password);
  return users.create({
    id: randomHex(16),
    email,
    name: opts.name,
    role: opts.role ?? 'admin',
    passwordHash: hash,
    passwordSalt: salt,
  });
}

export async function changePassword(users: UserStore, userId: string, newPassword: string) {
  const { hash, salt } = await hashPassword(newPassword);
  await users.setPassword(userId, hash, salt);
}

// ───────────────────────────────── login

export type LoginResult =
  | { ok: true; token: string; user: User }
  | { ok: false; reason: 'invalid' | 'locked' };

export async function login(
  stores: { users: UserStore; sessions: SessionStore },
  email: string,
  password: string
): Promise<LoginResult> {
  const row = await stores.users.findByEmail(email);

  // Identical answer whether or not the account exists, and a decoy
  // derivation so the timing does not reveal it either.
  if (!row) {
    await derive('decoy', fromHex(randomHex(16)));
    return { ok: false, reason: 'invalid' };
  }

  if (row.lockedUntil && new Date(row.lockedUntil) > new Date()) {
    return { ok: false, reason: 'locked' };
  }

  const good = await verifyPassword(password, row.passwordHash, row.passwordSalt);
  if (!good) {
    const failed = row.failedCount + 1;
    const lockedUntil =
      failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
    await stores.users.recordFailedLogin(row.id, failed, lockedUntil);
    return { ok: false, reason: lockedUntil ? 'locked' : 'invalid' };
  }

  await stores.users.clearFailedLogins(row.id);

  const token = randomToken(32);
  await stores.sessions.create({
    tokenHash: await sha256Hex(token),
    userId: row.id,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5).toISOString(),
  });

  return {
    ok: true,
    token,
    user: { id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.createdAt },
  };
}

export async function logout(sessions: SessionStore, token: string | undefined) {
  if (!token) return;
  await sessions.remove(await sha256Hex(token));
}

export async function userFromToken(
  sessions: SessionStore,
  token: string | undefined
): Promise<User | null> {
  if (!token) return null;
  const nowIso = new Date().toISOString();
  const found = await sessions.findValid(await sha256Hex(token), nowIso);
  return found?.user ?? null;
}

// ───────────────────────────────── cookies + CSRF

export const sessionCookieName = SESSION_COOKIE;

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  };
}

/**
 * CSRF: a value derived from the session token, embedded in every form and
 * required on every state-changing request. sameSite=lax plus the
 * platform's origin check cover most of this; the token covers the rest.
 */
export async function csrfFor(token: string | undefined): Promise<string> {
  return token ? sha256Hex('csrf:' + token) : '';
}

export async function csrfValid(
  sessionToken: string | undefined,
  submitted: string | null
): Promise<boolean> {
  if (!sessionToken || !submitted) return false;
  const expected = await csrfFor(sessionToken);
  return timingSafeEqual(enc.encode(expected), enc.encode(submitted));
}

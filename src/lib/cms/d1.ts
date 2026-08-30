// Cloudflare D1 implementations of every storage interface.
//
// THIS IS THE ONLY FILE THAT KNOWS A DATABASE EXISTS. It is the single
// place containing SQL. `auth.ts`, the pages and the API routes depend on
// the interfaces in `types.ts` and never on this file directly; they
// receive stores through the request context in `context.ts`.
//
// D1 hands out its binding per request, so these are constructed per
// request rather than being module-level singletons.
import type {
  Article,
  ArticleDraft,
  ArticleStatus,
  ArticleStore,
  Block,
  CmsStores,
  Role,
  Session,
  SessionStore,
  User,
  UserCredentials,
  UserStore,
} from './types.ts';

type D1 = D1Database;
type Row = Record<string, any>;

const now = () => new Date().toISOString();

function toArticle(r: Row): Article {
  return {
    id: r.id,
    slug: r.slug,
    kind: r.kind,
    status: r.status,
    title: r.title,
    standfirst: r.standfirst,
    excerpt: r.excerpt,
    readingTime: r.reading_time,
    topic: r.topic,
    featured: !!r.featured,
    viz: r.viz,
    vizCaption: r.viz_caption,
    serviceName: r.service_name,
    serviceSlug: r.service_slug,
    body: safeBody(r.body_json),
    isPlaceholder: !!r.is_placeholder,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at ?? null,
  };
}

function safeBody(json: string): Block[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toUser(r: Row): User {
  return { id: r.id, email: r.email, name: r.name, role: r.role as Role, createdAt: r.created_at };
}

// ───────────────────────────────────────────────── articles

class D1ArticleStore implements ArticleStore {
  constructor(private db: D1) {}

  async list(opts: { status?: ArticleStatus } = {}): Promise<Article[]> {
    const { results } = opts.status
      ? await this.db
          .prepare(
            'SELECT * FROM articles WHERE status = ?1 ORDER BY COALESCE(published_at, updated_at) DESC'
          )
          .bind(opts.status)
          .all()
      : await this.db.prepare('SELECT * FROM articles ORDER BY updated_at DESC').all();
    return (results as Row[]).map(toArticle);
  }

  async get(id: string): Promise<Article | null> {
    const r = await this.db.prepare('SELECT * FROM articles WHERE id = ?1').bind(id).first<Row>();
    return r ? toArticle(r) : null;
  }

  async getBySlug(slug: string): Promise<Article | null> {
    const r = await this.db.prepare('SELECT * FROM articles WHERE slug = ?1').bind(slug).first<Row>();
    return r ? toArticle(r) : null;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const r = exceptId
      ? await this.db
          .prepare('SELECT 1 AS x FROM articles WHERE slug = ?1 AND id != ?2')
          .bind(slug, exceptId)
          .first()
      : await this.db.prepare('SELECT 1 AS x FROM articles WHERE slug = ?1').bind(slug).first();
    return !!r;
  }

  async create(d: ArticleDraft): Promise<Article> {
    const t = now();
    await this.db
      .prepare(
        `INSERT INTO articles
         (id, slug, kind, status, title, standfirst, excerpt, reading_time, topic,
          featured, viz, viz_caption, service_name, service_slug, body_json,
          is_placeholder, created_at, updated_at, published_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)`
      )
      .bind(
        d.id, d.slug, d.kind, d.status, d.title, d.standfirst, d.excerpt,
        d.readingTime, d.topic, d.featured ? 1 : 0, d.viz, d.vizCaption,
        d.serviceName, d.serviceSlug, JSON.stringify(d.body),
        d.isPlaceholder ? 1 : 0, t, t, d.status === 'published' ? t : null
      )
      .run();
    return (await this.get(d.id))!;
  }

  async update(id: string, patch: Partial<ArticleDraft>): Promise<Article> {
    const cur = await this.get(id);
    if (!cur) throw new Error('article not found');

    const map: Record<string, string> = {
      slug: 'slug', kind: 'kind', status: 'status', title: 'title',
      standfirst: 'standfirst', excerpt: 'excerpt', readingTime: 'reading_time',
      topic: 'topic', featured: 'featured', viz: 'viz', vizCaption: 'viz_caption',
      serviceName: 'service_name', serviceSlug: 'service_slug',
      body: 'body_json', isPlaceholder: 'is_placeholder',
    };

    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, col] of Object.entries(map)) {
      if (!(k in patch)) continue;
      let v: any = (patch as any)[k];
      if (k === 'body') v = JSON.stringify(v ?? []);
      if (k === 'featured' || k === 'isPlaceholder') v = v ? 1 : 0;
      sets.push(`${col} = ?${i++}`);
      vals.push(v);
    }
    sets.push(`updated_at = ?${i++}`);
    vals.push(now());
    const whereIdx = i;
    vals.push(id);

    await this.db
      .prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?${whereIdx}`)
      .bind(...vals)
      .run();
    return (await this.get(id))!;
  }

  async setStatus(id: string, status: ArticleStatus): Promise<Article> {
    const cur = await this.get(id);
    if (!cur) throw new Error('article not found');
    const t = now();
    // stamped the first time it goes live, and kept afterwards, so
    // unpublishing and republishing does not rewrite its date
    const publishedAt = status === 'published' ? (cur.publishedAt ?? t) : cur.publishedAt;
    await this.db
      .prepare('UPDATE articles SET status = ?1, published_at = ?2, updated_at = ?3 WHERE id = ?4')
      .bind(status, publishedAt, t, id)
      .run();
    return (await this.get(id))!;
  }

  async remove(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM articles WHERE id = ?1').bind(id).run();
  }
}

// ───────────────────────────────────────────────── users

class D1UserStore implements UserStore {
  constructor(private db: D1) {}

  async findByEmail(email: string): Promise<UserCredentials | null> {
    const r = await this.db
      .prepare('SELECT * FROM users WHERE email = ?1')
      .bind(email.trim().toLowerCase())
      .first<Row>();
    if (!r) return null;
    return {
      ...toUser(r),
      passwordHash: r.password_hash,
      passwordSalt: r.password_salt,
      failedCount: r.failed_count ?? 0,
      lockedUntil: r.locked_until ?? null,
    };
  }

  async findById(id: string): Promise<User | null> {
    const r = await this.db.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first<Row>();
    return r ? toUser(r) : null;
  }

  async create(u: {
    id: string; email: string; name: string; role: Role;
    passwordHash: string; passwordSalt: string;
  }): Promise<User> {
    const email = u.email.trim().toLowerCase();
    const createdAt = now();
    await this.db
      .prepare(
        `INSERT INTO users (id, email, name, role, password_hash, password_salt, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7)`
      )
      .bind(u.id, email, u.name, u.role, u.passwordHash, u.passwordSalt, createdAt)
      .run();
    return { id: u.id, email, name: u.name, role: u.role, createdAt };
  }

  async list(): Promise<User[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM users ORDER BY created_at')
      .all();
    return (results as Row[]).map(toUser);
  }

  async count(): Promise<number> {
    const r = await this.db.prepare('SELECT COUNT(*) AS n FROM users').first<Row>();
    return r?.n ?? 0;
  }

  async recordFailedLogin(id: string, failedCount: number, lockedUntil: string | null) {
    await this.db
      .prepare('UPDATE users SET failed_count = ?1, locked_until = ?2 WHERE id = ?3')
      .bind(failedCount, lockedUntil, id)
      .run();
  }

  async clearFailedLogins(id: string) {
    await this.db
      .prepare('UPDATE users SET failed_count = 0, locked_until = NULL WHERE id = ?1')
      .bind(id)
      .run();
  }

  async setPassword(id: string, passwordHash: string, passwordSalt: string) {
    await this.db
      .prepare('UPDATE users SET password_hash = ?1, password_salt = ?2 WHERE id = ?3')
      .bind(passwordHash, passwordSalt, id)
      .run();
  }
}

// ───────────────────────────────────────────────── sessions

class D1SessionStore implements SessionStore {
  constructor(private db: D1) {}

  async create(s: Session) {
    await this.db
      .prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?1,?2,?3,?4)')
      .bind(s.tokenHash, s.userId, s.expiresAt, now())
      .run();
  }

  async findValid(tokenHash: string, nowIso: string) {
    const r = await this.db
      .prepare(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?1 AND s.expires_at > ?2`
      )
      .bind(tokenHash, nowIso)
      .first<Row>();
    return r ? { user: toUser(r) } : null;
  }

  async remove(tokenHash: string) {
    await this.db.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(tokenHash).run();
  }

  async removeExpired(nowIso: string) {
    await this.db.prepare('DELETE FROM sessions WHERE expires_at < ?1').bind(nowIso).run();
  }
}

export function createStores(db: D1): CmsStores {
  return {
    articles: new D1ArticleStore(db),
    users: new D1UserStore(db),
    sessions: new D1SessionStore(db),
  };
}

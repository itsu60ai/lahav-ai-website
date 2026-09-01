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
  AuditLogStore,
  Block,
  CmsStores,
  ContentPageStore,
  FaqItemRow,
  FaqStore,
  MediaRow,
  MediaStore,
  Role,
  Session,
  SessionStore,
  SettingsStore,
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

// ───────────────────────────────────────────── website content (pages)

/**
 * Backs BOTH `content_pages` (home/about/contact/navigation/footer) and
 * `services_content` (keyed by slug instead of a fixed id). One class,
 * parameterised by table name, because the draft/published/publish
 * behaviour is identical for both -- only what the id column is called
 * differs.
 */
class D1ContentPageStore implements ContentPageStore {
  constructor(private db: D1, private table: 'content_pages' | 'services_content') {}

  private col(): 'id' | 'slug' {
    return this.table === 'content_pages' ? 'id' : 'slug';
  }

  async getDraftRaw(id: string): Promise<string | null> {
    const r = await this.db
      .prepare(`SELECT draft_json FROM ${this.table} WHERE ${this.col()} = ?1`)
      .bind(id)
      .first<Row>();
    return r ? (r.draft_json as string) : null;
  }

  async getPublishedRaw(id: string): Promise<string | null> {
    const r = await this.db
      .prepare(`SELECT published_json FROM ${this.table} WHERE ${this.col()} = ?1`)
      .bind(id)
      .first<Row>();
    return r && r.published_json ? (r.published_json as string) : null;
  }

  async saveDraft(id: string, json: string, userId: string): Promise<void> {
    const ts = now();
    const col = this.col();
    // UPSERT: the row may not exist yet on a brand new install before the
    // seed migration has run, which must never 500 the admin page.
    await this.db
      .prepare(
        `INSERT INTO ${this.table} (${col}, draft_json, draft_updated_at, draft_updated_by)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(${col}) DO UPDATE SET
           draft_json = excluded.draft_json,
           draft_updated_at = excluded.draft_updated_at,
           draft_updated_by = excluded.draft_updated_by`
      )
      .bind(id, json, ts, userId)
      .run();
  }

  async publish(id: string, userId: string): Promise<void> {
    const ts = now();
    await this.db
      .prepare(
        `UPDATE ${this.table}
         SET published_json = draft_json, published_at = ?2, published_by = ?3
         WHERE ${this.col()} = ?1`
      )
      .bind(id, ts, userId)
      .run();
  }

  async meta(id: string) {
    const r = await this.db
      .prepare(`SELECT * FROM ${this.table} WHERE ${this.col()} = ?1`)
      .bind(id)
      .first<Row>();
    if (!r) return null;
    return {
      draftUpdatedAt: r.draft_updated_at ?? null,
      draftUpdatedBy: r.draft_updated_by ?? null,
      publishedAt: r.published_at ?? null,
      publishedBy: r.published_by ?? null,
      hasUnpublishedChanges: r.draft_json !== r.published_json,
    };
  }
}

// ───────────────────────────────────────────────────────────────── FAQ

function toFaq(r: Row): FaqItemRow {
  return {
    id: r.id,
    question: r.draft_question,
    answer: r.draft_answer,
    sortOrder: r.draft_sort_order,
    enabled: !!r.draft_enabled,
    deleted: !!r.draft_deleted,
    published:
      r.published_question == null
        ? null
        : {
            question: r.published_question,
            answer: r.published_answer,
            sortOrder: r.published_sort_order,
            enabled: !!r.published_enabled,
          },
    createdAt: r.created_at,
    updatedAt: r.draft_updated_at,
    publishedAt: r.published_at ?? null,
    publishedBy: r.published_by ?? null,
  };
}

class D1FaqStore implements FaqStore {
  constructor(private db: D1) {}

  async listDraft(): Promise<FaqItemRow[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM faq_items WHERE draft_deleted = 0 ORDER BY draft_sort_order ASC')
      .all();
    return (results as Row[]).map(toFaq);
  }

  async listPublished(): Promise<{ question: string; answer: string }[]> {
    const { results } = await this.db
      .prepare(
        `SELECT published_question AS q, published_answer AS a FROM faq_items
         WHERE published_question IS NOT NULL AND published_enabled = 1
         ORDER BY published_sort_order ASC`
      )
      .all();
    return (results as Row[]).map((r) => ({ question: r.q, answer: r.a }));
  }

  async create(question: string, answer: string, userId: string): Promise<FaqItemRow> {
    const id = crypto.randomUUID();
    const ts = now();
    const { results } = await this.db
      .prepare('SELECT COALESCE(MAX(draft_sort_order), -1) + 1 AS n FROM faq_items')
      .all();
    const nextOrder = (results as Row[])[0]?.n ?? 0;
    await this.db
      .prepare(
        `INSERT INTO faq_items
         (id, draft_question, draft_answer, draft_sort_order, draft_enabled, draft_deleted,
          created_at, draft_updated_at, draft_updated_by)
         VALUES (?1, ?2, ?3, ?4, 1, 0, ?5, ?5, ?6)`
      )
      .bind(id, question, answer, nextOrder, ts, userId)
      .run();
    return {
      id, question, answer, sortOrder: nextOrder, enabled: true, deleted: false,
      published: null, createdAt: ts, updatedAt: ts, publishedAt: null, publishedBy: null,
    };
  }

  async update(
    id: string,
    patch: Partial<Pick<FaqItemRow, 'question' | 'answer' | 'enabled'>>,
    userId: string
  ): Promise<FaqItemRow> {
    const sets: string[] = [];
    const vals: any[] = [];
    let n = 1;
    if (patch.question !== undefined) { sets.push(`draft_question = ?${n++}`); vals.push(patch.question); }
    if (patch.answer !== undefined) { sets.push(`draft_answer = ?${n++}`); vals.push(patch.answer); }
    if (patch.enabled !== undefined) { sets.push(`draft_enabled = ?${n++}`); vals.push(patch.enabled ? 1 : 0); }
    sets.push(`draft_updated_at = ?${n++}`);
    vals.push(now());
    sets.push(`draft_updated_by = ?${n++}`);
    vals.push(userId);
    vals.push(id);
    await this.db
      .prepare(`UPDATE faq_items SET ${sets.join(', ')} WHERE id = ?${n}`)
      .bind(...vals)
      .run();
    const r = await this.db.prepare('SELECT * FROM faq_items WHERE id = ?1').bind(id).first<Row>();
    return toFaq(r!);
  }

  async remove(id: string): Promise<void> {
    const r = await this.db
      .prepare('SELECT published_question FROM faq_items WHERE id = ?1')
      .bind(id)
      .first<Row>();
    if (!r) return;
    if (r.published_question == null) {
      // never published -- nothing live to protect, remove it outright
      await this.db.prepare('DELETE FROM faq_items WHERE id = ?1').bind(id).run();
    } else {
      // still live -- hide from draft/preview, keep public showing it
      // until Publish actually removes the row
      await this.db.prepare('UPDATE faq_items SET draft_deleted = 1 WHERE id = ?1').bind(id).run();
    }
  }

  async reorder(ids: string[], userId: string): Promise<void> {
    const ts = now();
    const stmts = ids.map((id, i) =>
      this.db
        .prepare('UPDATE faq_items SET draft_sort_order = ?1, draft_updated_at = ?2, draft_updated_by = ?3 WHERE id = ?4')
        .bind(i, ts, userId, id)
    );
    await this.db.batch(stmts);
  }

  async publishAll(userId: string): Promise<void> {
    const ts = now();
    await this.db
      .prepare(
        `UPDATE faq_items SET
           published_question = draft_question,
           published_answer = draft_answer,
           published_sort_order = draft_sort_order,
           published_enabled = draft_enabled,
           published_at = ?1,
           published_by = ?2
         WHERE draft_deleted = 0`
      )
      .bind(ts, userId)
      .run();
    // items staged for deletion are only actually removed once published,
    // so a mistaken delete stays recoverable (by an admin restoring the
    // row directly) right up until this point
    await this.db.prepare('DELETE FROM faq_items WHERE draft_deleted = 1').run();
  }

  async meta() {
    const r = await this.db
      .prepare(
        `SELECT
           COUNT(*) FILTER (WHERE draft_deleted = 1) AS pending_delete,
           COUNT(*) FILTER (WHERE published_question IS NULL) AS pending_create,
           COUNT(*) FILTER (
             WHERE published_question IS NOT NULL AND draft_deleted = 0 AND (
               draft_question != published_question OR
               draft_answer != published_answer OR
               draft_sort_order != published_sort_order OR
               draft_enabled != published_enabled
             )
           ) AS pending_edit,
           MAX(published_at) AS published_at
         FROM faq_items`
      )
      .first<Row>();
    const lastPublisher = await this.db
      .prepare('SELECT published_by FROM faq_items WHERE published_at = (SELECT MAX(published_at) FROM faq_items) LIMIT 1')
      .first<Row>();
    const hasUnpublishedChanges =
      !!r && (r.pending_delete > 0 || r.pending_create > 0 || r.pending_edit > 0);
    return {
      hasUnpublishedChanges,
      publishedAt: r?.published_at ?? null,
      publishedBy: lastPublisher?.published_by ?? null,
    };
  }
}

// ──────────────────────────────────────────────────────────── settings

class D1SettingsStore implements SettingsStore {
  constructor(private db: D1) {}

  async getDraft(): Promise<Record<string, string>> {
    const { results } = await this.db.prepare('SELECT key, draft_value FROM site_settings').all();
    const out: Record<string, string> = {};
    for (const r of results as Row[]) out[r.key] = r.draft_value;
    return out;
  }

  async getPublished(): Promise<Record<string, string>> {
    const { results } = await this.db
      .prepare('SELECT key, published_value FROM site_settings WHERE published_value IS NOT NULL')
      .all();
    const out: Record<string, string> = {};
    for (const r of results as Row[]) out[r.key] = r.published_value;
    return out;
  }

  async setDraft(key: string, value: string, userId: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO site_settings (key, draft_value, draft_updated_at, draft_updated_by)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(key) DO UPDATE SET
           draft_value = excluded.draft_value,
           draft_updated_at = excluded.draft_updated_at,
           draft_updated_by = excluded.draft_updated_by`
      )
      .bind(key, value, now(), userId)
      .run();
  }

  async publish(userId: string): Promise<void> {
    const ts = now();
    await this.db
      .prepare(
        `UPDATE site_settings SET published_value = draft_value, published_at = ?1, published_by = ?2`
      )
      .bind(ts, userId)
      .run();
  }

  async meta() {
    const r = await this.db
      .prepare(
        `SELECT
           COUNT(*) FILTER (WHERE draft_value IS NOT published_value) AS pending,
           MAX(published_at) AS published_at
         FROM site_settings`
      )
      .first<Row>();
    const lastPublisher = await this.db
      .prepare('SELECT published_by FROM site_settings WHERE published_at = (SELECT MAX(published_at) FROM site_settings) LIMIT 1')
      .first<Row>();
    return {
      hasUnpublishedChanges: !!r && r.pending > 0,
      publishedAt: r?.published_at ?? null,
      publishedBy: lastPublisher?.published_by ?? null,
    };
  }
}

// ────────────────────────────────────────────────────────────── media

function toMedia(r: Row): MediaRow {
  return {
    id: r.id,
    filename: r.filename,
    alt: r.alt,
    mime: r.mime,
    width: r.width ?? null,
    height: r.height ?? null,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at,
  };
}

class D1MediaStore implements MediaStore {
  constructor(private db: D1) {}

  async list(): Promise<MediaRow[]> {
    const { results } = await this.db
      .prepare(
        'SELECT id, filename, alt, mime, width, height, size_bytes, created_at FROM media ORDER BY created_at DESC'
      )
      .all();
    return (results as Row[]).map(toMedia);
  }

  async getWithData(id: string) {
    const r = await this.db.prepare('SELECT * FROM media WHERE id = ?1').bind(id).first<Row>();
    return r ? { ...toMedia(r), dataB64: r.data_b64 as string } : null;
  }

  async create(row: {
    filename: string;
    alt: string;
    mime: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    dataB64: string;
    createdBy: string;
  }): Promise<MediaRow> {
    const id = crypto.randomUUID();
    const ts = now();
    await this.db
      .prepare(
        `INSERT INTO media (id, filename, alt, mime, width, height, size_bytes, data_b64, created_at, created_by)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`
      )
      .bind(id, row.filename, row.alt, row.mime, row.width, row.height, row.sizeBytes, row.dataB64, ts, row.createdBy)
      .run();
    return {
      id,
      filename: row.filename,
      alt: row.alt,
      mime: row.mime,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      createdAt: ts,
    };
  }

  async remove(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM media WHERE id = ?1').bind(id).run();
  }
}

// ─────────────────────────────────────────────────────────────── audit

class D1AuditLogStore implements AuditLogStore {
  constructor(private db: D1) {}

  async record(area: string, action: string, userId: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO content_audit_log (id, area, action, user_id, created_at) VALUES (?1,?2,?3,?4,?5)')
      .bind(crypto.randomUUID(), area, action, userId, now())
      .run();
  }

  async recent(limit: number) {
    const { results } = await this.db
      .prepare('SELECT * FROM content_audit_log ORDER BY created_at DESC LIMIT ?1')
      .bind(limit)
      .all();
    return (results as Row[]).map((r) => ({
      area: r.area,
      action: r.action,
      userId: r.user_id,
      createdAt: r.created_at,
    }));
  }
}

export function createStores(db: D1): CmsStores {
  return {
    articles: new D1ArticleStore(db),
    users: new D1UserStore(db),
    sessions: new D1SessionStore(db),
    content: new D1ContentPageStore(db, 'content_pages'),
    services: new D1ContentPageStore(db, 'services_content'),
    faq: new D1FaqStore(db),
    settings: new D1SettingsStore(db),
    media: new D1MediaStore(db),
    audit: new D1AuditLogStore(db),
  };
}

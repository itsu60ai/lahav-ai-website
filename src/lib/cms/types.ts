// Article shapes shared by the public site and the admin.
//
// The body is STRUCTURED BLOCKS, not Markdown or HTML. That is deliberate:
// the editor gives buttons for each block type, so writing an article never
// requires knowing Markdown, and the public template controls how each block
// is rendered. It also means the future AI article system can produce these
// objects directly without generating markup.

export type ArticleStatus = 'draft' | 'published';

export type Block =
  | { t: 'p'; x: string }
  | { t: 'h2'; x: string }
  | { t: 'h3'; x: string }
  | { t: 'quote'; x: string }
  | { t: 'ul'; items: string[] }
  | { t: 'viz' }
  /** an article-specific SVG the AI engine produced (see src/lib/ai/).
   *  Self-contained — the markup lives on the block itself, not looked up
   *  from another table at render time — so it round-trips through the
   *  block editor exactly like every other block. */
  | { t: 'aiviz'; svg: string; alt: string; caption: string };

export const BLOCK_LABELS: Record<Block['t'], string> = {
  p: 'פסקה',
  h2: 'כותרת',
  h3: 'כותרת משנה',
  quote: 'ציטוט',
  ul: 'רשימה',
  viz: 'תרשים',
  aiviz: 'תרשים AI',
};

/** guide = a considered piece; hack = a short practical tip */
export type ArticleKind = 'guide' | 'hack';

export const ARTICLE_KINDS: Record<ArticleKind, { label: string; tone: string }> = {
  guide: { label: 'מדריך', tone: 'royal' },
  hack: { label: 'טיפ מהיר', tone: 'electric' },
};

/** the diagram that can be dropped into an article, reusing site visuals */
export const VIZ_KINDS = ['crm', 'automation', 'web', 'app', 'content', 'services'] as const;
export type VizKind = (typeof VIZ_KINDS)[number];

export interface Article {
  id: string;
  slug: string;
  kind: ArticleKind;
  status: ArticleStatus;
  title: string;
  standfirst: string;
  excerpt: string;
  readingTime: string;
  topic: string;
  featured: boolean;
  viz: VizKind;
  vizCaption: string;
  serviceName: string;
  serviceSlug: string;
  body: Block[];
  /** review-only placeholder content, flagged in the UI and on the page */
  isPlaceholder: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type ArticleDraft = Omit<Article, 'createdAt' | 'updatedAt' | 'publishedAt'>;

export type Role = 'admin' | 'editor';

/**
 * Every distinct thing a signed-in person can attempt. Routes check these,
 * never the role string, so adding a role later is a table change and not
 * a hunt through the codebase.
 */
export type Permission =
  | 'article:create'
  | 'article:edit'
  | 'article:preview'
  | 'article:publish'
  | 'article:delete'
  | 'user:manage'
  | 'settings:manage'
  // ── website content CMS ──
  // Draft edits on Home/Services/About/Contact/Navigation/Footer.
  | 'content:edit'
  // Moving a draft to published -- the moment content goes live in the
  // company's name. ADMIN only, same reasoning as article:publish.
  | 'content:publish'
  // Draft edits to FAQ items: create/edit/enable/reorder/delete-in-draft.
  | 'faq:manage'
  // Moving FAQ's draft state live -- same admin-only reasoning as
  // content:publish. Added when FAQ moved from immediate-write to
  // draft/published (2026-09-01, SOURCE_OF_TRUTH.md F-34).
  | 'faq:publish'
  | 'media:upload'
  // Deleting an uploaded image, which can break a page still using it.
  | 'media:delete'
  // Turning a public page noindex, or editing the WhatsApp/booking
  // numbers everything else on the site points at.
  | 'settings:sensitive';

/**
 * LEAST PRIVILEGE.
 *
 * EDITOR may write and preview, but may NOT put anything on the public
 * site and may not destroy anything. Publishing is the moment content
 * becomes public in the company's name, so it stays with ADMIN. This also
 * matches how the future AI engine is meant to behave: it produces drafts,
 * a human publishes.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    'article:create',
    'article:edit',
    'article:preview',
    'article:publish',
    'article:delete',
    'user:manage',
    'settings:manage',
    'content:edit',
    'content:publish',
    'faq:manage',
    'faq:publish',
    'media:upload',
    'media:delete',
    'settings:sensitive',
  ],
  // EDITOR may write and preview website content exactly as it may write
  // and preview articles, and may manage the FAQ (each item's own
  // `enabled` flag already gives a safe staging step, so this does not
  // need a separate publish permission). EDITOR may NOT publish page
  // content, delete media, or touch settings -- those are the actions
  // that change what a visitor sees or that are hard to undo.
  editor: [
    'article:create',
    'article:edit',
    'article:preview',
    'content:edit',
    'faq:manage',
    'media:upload',
  ],
};

export function can(user: { role: Role } | undefined | null, p: Permission): boolean {
  if (!user) return false;
  return (ROLE_PERMISSIONS[user.role] ?? []).includes(p);
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/** the fields auth needs but never hands to a page */
export interface UserCredentials extends User {
  passwordHash: string;
  passwordSalt: string;
  failedCount: number;
  lockedUntil: string | null;
}

export interface Session {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}

/**
 * The seam the rest of the app talks to.
 *
 * Everything above this line is storage agnostic. Swapping SQLite for a
 * hosted database later means writing one more class that satisfies this
 * interface; no page, route or component changes.
 */
export interface ArticleStore {
  list(opts?: { status?: ArticleStatus }): Promise<Article[]>;
  get(id: string): Promise<Article | null>;
  getBySlug(slug: string): Promise<Article | null>;
  create(draft: ArticleDraft): Promise<Article>;
  update(id: string, patch: Partial<ArticleDraft>): Promise<Article>;
  setStatus(id: string, status: ArticleStatus): Promise<Article>;
  remove(id: string): Promise<void>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
}


/**
 * Storage seam for identity.
 *
 * `auth.ts` depends on these interfaces ONLY. It contains no SQL, no
 * driver import and no knowledge of where users live. That is what makes
 * swapping the database (or handing authentication to an external
 * provider) a change in one file rather than a change in authentication.
 */
export interface UserStore {
  findByEmail(email: string): Promise<UserCredentials | null>;
  findById(id: string): Promise<User | null>;
  create(u: {
    id: string;
    email: string;
    name: string;
    role: Role;
    passwordHash: string;
    passwordSalt: string;
  }): Promise<User>;
  list(): Promise<User[]>;
  count(): Promise<number>;
  recordFailedLogin(id: string, failedCount: number, lockedUntil: string | null): Promise<void>;
  clearFailedLogins(id: string): Promise<void>;
  setPassword(id: string, passwordHash: string, passwordSalt: string): Promise<void>;
}

export interface SessionStore {
  create(s: Session): Promise<void>;
  findValid(tokenHash: string, now: string): Promise<{ user: User } | null>;
  remove(tokenHash: string): Promise<void>;
  removeExpired(now: string): Promise<void>;
}

/** everything a request needs, assembled once per request */
// ─────────────────────────────────────────────────── website content CMS

/**
 * Storage seam for one JSON-shaped content area (home, about, contact,
 * navigation, footer, or one service). Draft and published are two
 * separate columns on one row, not two rows -- see migrations/0007.
 */
export interface ContentPageStore {
  getDraftRaw(id: string): Promise<string | null>;
  getPublishedRaw(id: string): Promise<string | null>;
  saveDraft(id: string, json: string, userId: string): Promise<void>;
  publish(id: string, userId: string): Promise<void>;
  meta(id: string): Promise<{
    draftUpdatedAt: string | null;
    draftUpdatedBy: string | null;
    publishedAt: string | null;
    publishedBy: string | null;
    hasUnpublishedChanges: boolean;
  } | null>;
}

/**
 * A FAQ item's DRAFT fields, always present, are what the admin editor
 * shows and what preview (`?preview=1`) reads. `published` is null until
 * the first publish -- the public /faq/ page never sees this item until
 * then. `deleted` marks a draft-side removal of an item that IS already
 * published: it disappears from preview and the admin list immediately,
 * but the public site keeps showing it until Publish, at which point the
 * row is actually removed. An item that was never published is removed
 * outright when deleted -- nothing live to protect.
 */
export interface FaqItemRow {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  enabled: boolean;
  deleted: boolean;
  published: { question: string; answer: string; sortOrder: number; enabled: boolean } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface FaqStore {
  /** admin editor: every non-deleted item, draft fields, draft order. */
  listDraft(): Promise<FaqItemRow[]>;
  /** the public /faq/ page: published fields only, published order,
   *  published_enabled only -- items never published or already
   *  draft-deleted never appear here regardless of their draft state. */
  listPublished(): Promise<{ question: string; answer: string }[]>;
  create(question: string, answer: string, userId: string): Promise<FaqItemRow>;
  update(
    id: string,
    patch: Partial<Pick<FaqItemRow, 'question' | 'answer' | 'enabled'>>,
    userId: string
  ): Promise<FaqItemRow>;
  /** hard-deletes an item never published; soft-deletes (draft_deleted)
   *  one that is, so Publish is what actually removes it from the site. */
  remove(id: string): Promise<void>;
  /** ids in their new display order, all of them, every time --
   *  partial reorders are rejected by the route, not this store. */
  reorder(ids: string[], userId: string): Promise<void>;
  /** copies every non-deleted item's draft fields onto its published
   *  fields, and permanently removes any item marked draft_deleted. */
  publishAll(userId: string): Promise<void>;
  meta(): Promise<{ hasUnpublishedChanges: boolean; publishedAt: string | null; publishedBy: string | null }>;
}

/**
 * Same draft/published split as content pages, but one row per key
 * rather than one JSON blob for the whole page -- Settings is edited as
 * one small form, so `publish()` moves every key's draft value to
 * published in one action.
 */
export interface SettingsStore {
  getDraft(): Promise<Record<string, string>>;
  getPublished(): Promise<Record<string, string>>;
  setDraft(key: string, value: string, userId: string): Promise<void>;
  publish(userId: string): Promise<void>;
  meta(): Promise<{ hasUnpublishedChanges: boolean; publishedAt: string | null; publishedBy: string | null }>;
}

export interface MediaRow {
  id: string;
  filename: string;
  alt: string;
  mime: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  createdAt: string;
}

export interface MediaStore {
  list(): Promise<MediaRow[]>;
  /** the row plus its base64 payload, for the serving route only */
  getWithData(id: string): Promise<(MediaRow & { dataB64: string }) | null>;
  create(row: {
    filename: string;
    alt: string;
    mime: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    dataB64: string;
    createdBy: string;
  }): Promise<MediaRow>;
  remove(id: string): Promise<void>;
}

export interface AuditLogStore {
  record(area: string, action: string, userId: string): Promise<void>;
  recent(limit: number): Promise<{ area: string; action: string; userId: string; createdAt: string }[]>;
}

/**
 * Portfolio ("תיק עבודות"): a growable list of example projects. Each
 * item's own content (name, story, image, SEO -- including its `slug`)
 * is a JSON blob with the exact same draft/published shape content_pages
 * uses, keyed by a stable `id` -- so `stores.portfolio` (a
 * `ContentPageStore` over the `portfolio_items` table) handles reading
 * and saving one item's content with zero new code. This interface
 * covers only what content_pages never needed: listing, creating,
 * deleting and reordering rows, and finding one by its public slug.
 */
export interface PortfolioListStore {
  /** admin list page: every non-deleted item, draft order, with just
   *  enough of the draft content (name) to label the row. */
  listDraftMeta(): Promise<
    { id: string; name: string; enabled: boolean; hasUnpublishedChanges: boolean; publishedAt: string | null }[]
  >;
  /** the public index page: published items only, published order. */
  listPublished(): Promise<{ id: string; content: Record<string, any> }[]>;
  /** the public detail page: one published item by its slug (a field
   *  inside the JSON, not a column) -- null if never published, disabled,
   *  deleted, or the slug does not match any item. */
  getPublishedBySlug(slug: string): Promise<Record<string, any> | null>;
  /** the preview detail page: one DRAFT item by its draft slug. */
  getDraftBySlug(slug: string): Promise<{ id: string; content: Record<string, any> } | null>;
  /** creates a new row with a starter content blob, empty and disabled
   *  until the admin fills it in; returns its new stable id. */
  create(userId: string): Promise<{ id: string }>;
  setEnabled(id: string, enabled: boolean, userId: string): Promise<void>;
  /** hard-deletes an item never published; soft-deletes (draft_deleted)
   *  one that is, so Publish is what actually removes it -- same
   *  reasoning as FaqStore.remove. */
  remove(id: string): Promise<void>;
  reorder(ids: string[], userId: string): Promise<void>;
  /** Publishes ONE item: copies its draft content, enabled flag and sort
   *  order onto the published columns, and -- if it was staged for
   *  deletion -- actually removes the row. Deliberately NOT the generic
   *  `ContentPageStore.publish()` on `stores.portfolio`: that only knows
   *  about the JSON column, not the enabled/sort_order/deleted columns
   *  this table also carries. */
  publish(id: string, userId: string): Promise<void>;
}

export interface CmsStores {
  articles: ArticleStore;
  users: UserStore;
  sessions: SessionStore;
  content: ContentPageStore;
  services: ContentPageStore;
  portfolio: ContentPageStore;
  portfolioList: PortfolioListStore;
  faq: FaqStore;
  settings: SettingsStore;
  media: MediaStore;
  audit: AuditLogStore;
}

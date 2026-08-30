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
  | 'settings:manage';

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
  ],
  editor: ['article:create', 'article:edit', 'article:preview'],
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
export interface CmsStores {
  articles: ArticleStore;
  users: UserStore;
  sessions: SessionStore;
}

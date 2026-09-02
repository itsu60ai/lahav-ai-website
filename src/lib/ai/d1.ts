// Cloudflare D1 implementations of every AI-engine storage interface.
//
// THIS IS THE ONLY FILE WITH SQL FOR THE AI ENGINE, mirroring src/lib/cms/d1.ts.
// Everything else in src/lib/ai/* depends on the interfaces in types.ts and
// gets stores through context.ts. Same physical database as the CMS and the
// leads table, different tables, zero shared code.
import type {
  AiSettings,
  AiStores,
  AllowlistTopic,
  ArmAutoPublishInput,
  AssetStore,
  AutoPublication,
  AutoPublicationStore,
  EngineSettingsPatch,
  Feedback,
  FeedbackStore,
  Generation,
  GenerationStore,
  Opportunity,
  OpportunityDraft,
  OpportunityStatus,
  OpportunityStore,
  RadarSource,
  RadarSourceStore,
  RecommendationRun,
  RecommendationStore,
  Rule,
  RuleStore,
  SettingsStore,
  TopicAllowlistStore,
  VerificationState,
  VisualAsset,
} from './types.ts';

type D1 = D1Database;
type Row = Record<string, any>;

const now = () => new Date().toISOString();
const j = (v: unknown) => JSON.stringify(v ?? null);
const parseJson = <T,>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

function toOpportunity(r: Row): Opportunity {
  return {
    id: r.id,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    publishedAt: r.published_at ?? null,
    headline: r.headline,
    summary: r.summary,
    whyItMatters: r.why_it_matters,
    suggestedAngle: r.suggested_angle,
    contentKind: r.content_kind,
    serviceSlug: r.service_slug,
    verification: r.verification,
    verificationNote: r.verification_note,
    verifiedBy: r.verified_by ?? '',
    verifiedAt: r.verified_at ?? null,
    freshnessScore: r.freshness_score,
    priority: r.priority,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

class D1OpportunityStore implements OpportunityStore {
  constructor(private db: D1) {}

  async list(opts: { status?: OpportunityStatus } = {}): Promise<Opportunity[]> {
    const { results } = opts.status
      ? await this.db
          .prepare(
            'SELECT * FROM ai_opportunities WHERE status = ?1 ORDER BY freshness_score DESC, created_at DESC'
          )
          .bind(opts.status)
          .all()
      : await this.db
          .prepare('SELECT * FROM ai_opportunities ORDER BY freshness_score DESC, created_at DESC')
          .all();
    return (results as Row[]).map(toOpportunity);
  }

  async get(id: string): Promise<Opportunity | null> {
    const r = await this.db.prepare('SELECT * FROM ai_opportunities WHERE id = ?1').bind(id).first<Row>();
    return r ? toOpportunity(r) : null;
  }

  async urlExists(sourceUrl: string): Promise<boolean> {
    const r = await this.db
      .prepare('SELECT 1 AS x FROM ai_opportunities WHERE source_url = ?1')
      .bind(sourceUrl)
      .first();
    return !!r;
  }

  async create(d: OpportunityDraft): Promise<Opportunity> {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        `INSERT INTO ai_opportunities
         (id, source_name, source_url, published_at, headline, summary, why_it_matters,
          suggested_angle, content_kind, service_slug, verification, verification_note,
          freshness_score, priority, status, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,'new',?15,?16)`
      )
      .bind(
        id, d.sourceName, d.sourceUrl, d.publishedAt, d.headline, d.summary, d.whyItMatters,
        d.suggestedAngle, d.contentKind, d.serviceSlug, d.verification, d.verificationNote,
        d.freshnessScore, d.priority, t, t
      )
      .run();
    return (await this.get(id))!;
  }

  async setStatus(id: string, status: OpportunityStatus): Promise<Opportunity> {
    await this.db
      .prepare('UPDATE ai_opportunities SET status = ?1, updated_at = ?2 WHERE id = ?3')
      .bind(status, now(), id)
      .run();
    const r = await this.get(id);
    if (!r) throw new Error('opportunity not found');
    return r;
  }

  /**
   * The human verification write (Stage C, docs/AI_ENGINE.md 3.4).
   *
   * `verifiedBy` is stamped from the signed-in admin by the calling route,
   * never from the request body, so "who verified this" cannot be forged
   * by whoever submits the form.
   */
  async setVerification(
    id: string,
    v: { verification: VerificationState; note: string; verifiedBy: string }
  ): Promise<Opportunity> {
    const t = now();
    // Clearing a verification (back to unverified) must also clear who
    // verified it, or the audit line would keep claiming a person stood
    // behind a claim they have since withdrawn.
    const cleared = v.verification === 'unverified';
    await this.db
      .prepare(
        `UPDATE ai_opportunities
         SET verification = ?1, verification_note = ?2, verified_by = ?3,
             verified_at = ?4, updated_at = ?5
         WHERE id = ?6`
      )
      .bind(v.verification, v.note, cleared ? '' : v.verifiedBy, cleared ? null : t, t, id)
      .run();
    const r = await this.get(id);
    if (!r) throw new Error('opportunity not found');
    return r;
  }
}

// ───────────────────────────────────────────────── generations

function toGeneration(r: Row): Generation {
  return {
    id: r.id,
    opportunityId: r.opportunity_id ?? null,
    articleId: r.article_id ?? null,
    brief: parseJson(r.brief_json, {} as any),
    providerMode: r.provider_mode,
    model: r.model,
    promptText: r.prompt_text,
    output: r.raw_output_json ? parseJson(r.raw_output_json, null) : null,
    inputTokens: r.input_tokens,
    outputTokens: r.output_tokens,
    costUsd: r.cost_usd,
    status: r.status,
    gates: parseJson(r.gate_results_json, { passed: !!r.gates_passed, failures: [] }),
    createdAt: r.created_at,
  };
}

class D1GenerationStore implements GenerationStore {
  constructor(private db: D1) {}

  async list(): Promise<Generation[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_generations ORDER BY created_at DESC')
      .all();
    return (results as Row[]).map(toGeneration);
  }

  async get(id: string): Promise<Generation | null> {
    const r = await this.db.prepare('SELECT * FROM ai_generations WHERE id = ?1').bind(id).first<Row>();
    return r ? toGeneration(r) : null;
  }

  async create(g: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        `INSERT INTO ai_generations
         (id, opportunity_id, article_id, brief_json, provider_mode, model, prompt_text,
          raw_output_json, input_tokens, output_tokens, cost_usd, status,
          gate_results_json, gates_passed, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)`
      )
      .bind(
        id, g.opportunityId, g.articleId, j(g.brief), g.providerMode, g.model, g.promptText,
        j(g.output), g.inputTokens, g.outputTokens, g.costUsd, g.status,
        j(g.gates), g.gates.passed ? 1 : 0, t
      )
      .run();
    return (await this.get(id))!;
  }

  async update(
    id: string,
    patch: Partial<Pick<Generation, 'articleId' | 'output' | 'inputTokens' | 'outputTokens' | 'costUsd' | 'status' | 'gates'>>
  ): Promise<Generation> {
    const map: Record<string, string> = {
      articleId: 'article_id',
      output: 'raw_output_json',
      inputTokens: 'input_tokens',
      outputTokens: 'output_tokens',
      costUsd: 'cost_usd',
      status: 'status',
      gates: 'gate_results_json',
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, col] of Object.entries(map)) {
      if (!(k in patch)) continue;
      let v: any = (patch as any)[k];
      if (k === 'output') v = j(v);
      if (k === 'gates') v = j(v);
      sets.push(`${col} = ?${i++}`);
      vals.push(v);
    }
    // gates_passed mirrors gate_results_json.passed as its own indexed
    // column (used for quick filtering elsewhere), so it must move with it.
    if (patch.gates) {
      sets.push(`gates_passed = ?${i++}`);
      vals.push(patch.gates.passed ? 1 : 0);
    }
    if (sets.length === 0) return (await this.get(id))!;
    vals.push(id);
    await this.db
      .prepare(`UPDATE ai_generations SET ${sets.join(', ')} WHERE id = ?${i}`)
      .bind(...vals)
      .run();
    return (await this.get(id))!;
  }
}

// ───────────────────────────────────────────────── feedback (learning)

function toFeedback(r: Row): Feedback {
  return {
    id: r.id,
    generationId: r.generation_id,
    articleId: r.article_id ?? null,
    kind: r.kind,
    field: r.field,
    beforeText: r.before_text,
    afterText: r.after_text,
    note: r.note,
    createdAt: r.created_at,
  };
}

class D1FeedbackStore implements FeedbackStore {
  constructor(private db: D1) {}

  async create(f: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        `INSERT INTO ai_feedback
         (id, generation_id, article_id, kind, field, before_text, after_text, note, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
      )
      .bind(id, f.generationId, f.articleId, f.kind, f.field, f.beforeText, f.afterText, f.note, t)
      .run();
    const r = await this.db.prepare('SELECT * FROM ai_feedback WHERE id = ?1').bind(id).first<Row>();
    return toFeedback(r!);
  }

  async listByGeneration(generationId: string): Promise<Feedback[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_feedback WHERE generation_id = ?1 ORDER BY created_at')
      .bind(generationId)
      .all();
    return (results as Row[]).map(toFeedback);
  }

  async listRecent(limit: number): Promise<Feedback[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_feedback ORDER BY created_at DESC LIMIT ?1')
      .bind(limit)
      .all();
    return (results as Row[]).map(toFeedback);
  }
}

// ───────────────────────────────────────────────── learned rules

function toRule(r: Row): Rule {
  return {
    id: r.id,
    ruleText: r.rule_text,
    sourceCount: r.source_count,
    active: !!r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

class D1RuleStore implements RuleStore {
  constructor(private db: D1) {}

  async listActive(): Promise<Rule[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_rules WHERE active = 1 ORDER BY source_count DESC, updated_at DESC')
      .all();
    return (results as Row[]).map(toRule);
  }

  async upsertByText(ruleText: string): Promise<Rule> {
    const existing = await this.db
      .prepare('SELECT * FROM ai_rules WHERE rule_text = ?1')
      .bind(ruleText)
      .first<Row>();
    const t = now();
    if (existing) {
      await this.db
        .prepare('UPDATE ai_rules SET source_count = source_count + 1, updated_at = ?1 WHERE id = ?2')
        .bind(t, existing.id)
        .run();
      return toRule({ ...existing, source_count: existing.source_count + 1, updated_at: t });
    }
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        'INSERT INTO ai_rules (id, rule_text, source_count, active, created_at, updated_at) VALUES (?1,?2,1,1,?3,?3)'
      )
      .bind(id, ruleText, t)
      .run();
    return { id, ruleText, sourceCount: 1, active: true, createdAt: t, updatedAt: t };
  }

  async listAll(): Promise<Rule[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_rules ORDER BY active DESC, source_count DESC, updated_at DESC')
      .all();
    return (results as Row[]).map(toRule);
  }

  async get(id: string): Promise<Rule | null> {
    const r = await this.db.prepare('SELECT * FROM ai_rules WHERE id = ?1').bind(id).first<Row>();
    return r ? toRule(r) : null;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.db
      .prepare('UPDATE ai_rules SET active = ?1, updated_at = ?2 WHERE id = ?3')
      .bind(active ? 1 : 0, now(), id)
      .run();
  }

  async updateText(id: string, ruleText: string): Promise<void> {
    await this.db
      .prepare('UPDATE ai_rules SET rule_text = ?1, updated_at = ?2 WHERE id = ?3')
      .bind(ruleText, now(), id)
      .run();
  }

  async remove(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM ai_rules WHERE id = ?1').bind(id).run();
  }
}

// ───────────────────────────────────────────────── settings

/**
 * The settings store gained writers in Stage D. The auto publish safety
 * property from docs/AI_ENGINE.md section 12 layer 2 is preserved, but it
 * is now enforced by SHAPE rather than by absence:
 *
 *   arm() is the only method that can write auto_publish_enabled = 1. It
 *   demands a named human (`armedBy`) and an expiry date, both required,
 *   and it is imported by exactly ONE file in the codebase:
 *   src/pages/api/admin/ai/auto-publish.ts, which sits behind the admin
 *   session, CSRF, the `settings:manage` permission and a typed Hebrew
 *   confirmation phrase.
 *
 *   Nothing under src/lib/ai/* calls arm(). The unattended scheduled job
 *   in autopublish.ts reads get() and calls disarm()/recordAutoPublishUse()
 *   only, so the machine can switch itself OFF and can never switch itself
 *   ON. Grep for `.arm(` to confirm: one call site, in an admin route.
 */
class D1SettingsStore implements SettingsStore {
  constructor(private db: D1) {}

  async get(): Promise<AiSettings> {
    const r = await this.db.prepare('SELECT * FROM ai_settings WHERE id = 1').first<Row>();
    // A missing row cannot mean "auto publish on" — the safe default wins.
    if (!r) {
      return {
        providerMode: 'mock',
        recommendationMode: 'heuristic',
        disclosureEnabled: false,
        autoPublishEnabled: false,
        autoPublishExpiresAt: null,
        autoPublishWeeklyCap: 0,
        autoPublishWeekStart: null,
        autoPublishCountThisWeek: 0,
        autoPublishArmedBy: '',
        autoPublishArmedAt: null,
        autoPublishNotifyEmail: '',
        autoPublishKilledAt: null,
        autoPublishKilledBy: '',
        updatedAt: now(),
        updatedBy: '',
      };
    }
    return {
      providerMode: r.provider_mode,
      // A missing column (pre-migration row) cannot mean "spend money" —
      // the safe default wins, same reasoning as the missing-row case above.
      recommendationMode: r.recommendation_mode ?? 'heuristic',
      disclosureEnabled: !!r.disclosure_enabled,
      autoPublishEnabled: !!r.auto_publish_enabled,
      autoPublishExpiresAt: r.auto_publish_expires_at ?? null,
      autoPublishWeeklyCap: r.auto_publish_weekly_cap,
      autoPublishWeekStart: r.auto_publish_week_start ?? null,
      autoPublishCountThisWeek: r.auto_publish_count_this_week,
      autoPublishArmedBy: r.auto_publish_armed_by ?? '',
      autoPublishArmedAt: r.auto_publish_armed_at ?? null,
      autoPublishNotifyEmail: r.auto_publish_notify_email ?? '',
      autoPublishKilledAt: r.auto_publish_killed_at ?? null,
      autoPublishKilledBy: r.auto_publish_killed_by ?? '',
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
    };
  }

  /**
   * Engine modes only. Note what is NOT in EngineSettingsPatch:
   * auto_publish_enabled and auto_publish_expires_at. Even the settings
   * form cannot reach them; arming has its own method and its own route.
   */
  async update(patch: EngineSettingsPatch, updatedBy: string): Promise<AiSettings> {
    const map: [keyof EngineSettingsPatch, string, (v: any) => any][] = [
      ['providerMode', 'provider_mode', (v) => v],
      ['recommendationMode', 'recommendation_mode', (v) => v],
      ['disclosureEnabled', 'disclosure_enabled', (v) => (v ? 1 : 0)],
      ['autoPublishWeeklyCap', 'auto_publish_weekly_cap', (v) => Math.max(0, Math.floor(v))],
      ['autoPublishNotifyEmail', 'auto_publish_notify_email', (v) => String(v)],
    ];
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [key, col, conv] of map) {
      if (!(key in patch) || patch[key] === undefined) continue;
      sets.push(`${col} = ?${i++}`);
      vals.push(conv(patch[key]));
    }
    const t = now();
    sets.push(`updated_at = ?${i++}`);
    vals.push(t);
    sets.push(`updated_by = ?${i++}`);
    vals.push(updatedBy);
    await this.db.prepare(`UPDATE ai_settings SET ${sets.join(', ')} WHERE id = 1`).bind(...vals).run();
    return this.get();
  }

  async arm(input: ArmAutoPublishInput): Promise<AiSettings> {
    // Defence in depth. The route already validates all three, but a
    // store method that can turn auto publish on must never accept a
    // missing operator, a missing expiry, or an unlimited cap, no matter
    // who calls it or from where.
    if (!input.armedBy) throw new Error('arm() requires the name of the admin who armed it');
    if (!input.expiresAt) throw new Error('arm() requires an expiry date');
    const expiry = new Date(input.expiresAt).getTime();
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error('arm() requires an expiry date in the future');
    }
    const cap = Math.floor(input.weeklyCap);
    if (!Number.isFinite(cap) || cap < 1) throw new Error('arm() requires a weekly cap of at least 1');

    const t = now();
    await this.db
      .prepare(
        `UPDATE ai_settings
         SET auto_publish_enabled = 1,
             auto_publish_expires_at = ?1,
             auto_publish_weekly_cap = ?2,
             auto_publish_week_start = ?3,
             auto_publish_count_this_week = 0,
             auto_publish_armed_by = ?4,
             auto_publish_armed_at = ?5,
             auto_publish_killed_at = NULL,
             auto_publish_killed_by = '',
             updated_at = ?5,
             updated_by = ?4
         WHERE id = 1`
      )
      .bind(input.expiresAt, cap, weekStartOf(new Date()), input.armedBy, t)
      .run();
    return this.get();
  }

  async disarm(by: string, killed: boolean): Promise<AiSettings> {
    const t = now();
    await this.db
      .prepare(
        `UPDATE ai_settings
         SET auto_publish_enabled = 0,
             auto_publish_expires_at = NULL,
             auto_publish_killed_at = ?1,
             auto_publish_killed_by = ?2,
             updated_at = ?3,
             updated_by = ?4
         WHERE id = 1`
      )
      .bind(killed ? t : null, killed ? by : '', t, by)
      .run();
    return this.get();
  }

  async recordAutoPublishUse(weekStart: string, count: number): Promise<void> {
    await this.db
      .prepare(
        'UPDATE ai_settings SET auto_publish_week_start = ?1, auto_publish_count_this_week = ?2, updated_at = ?3 WHERE id = 1'
      )
      .bind(weekStart, count, now())
      .run();
  }
}

/** ISO date (yyyy-mm-dd) of the Sunday that starts this date's week. */
export function weekStartOf(d: Date): string {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay());
  return copy.toISOString().slice(0, 10);
}

// ───────────────────────────────────────────────── auto publish allow list

class D1TopicAllowlistStore implements TopicAllowlistStore {
  constructor(private db: D1) {}

  async list(): Promise<AllowlistTopic[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_topic_allowlist ORDER BY created_at DESC')
      .all();
    return (results as Row[]).map((r) => ({
      id: r.id,
      topic: r.topic,
      createdAt: r.created_at,
      createdBy: r.created_by ?? '',
    }));
  }

  async add(topic: string, createdBy: string): Promise<void> {
    const clean = topic.trim().toLowerCase();
    if (!clean) return;
    await this.db
      .prepare(
        'INSERT OR IGNORE INTO ai_topic_allowlist (id, topic, created_at, created_by) VALUES (?1,?2,?3,?4)'
      )
      .bind(crypto.randomUUID(), clean, now(), createdBy)
      .run();
  }

  async remove(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM ai_topic_allowlist WHERE id = ?1').bind(id).run();
  }
}

// ───────────────────────────────────────────────── auto publish audit trail

function toAutoPublication(r: Row): AutoPublication {
  return {
    id: r.id,
    articleId: r.article_id,
    generationId: r.generation_id,
    articleTitle: r.article_title ?? '',
    articleSlug: r.article_slug ?? '',
    publishedAt: r.published_at,
    armedBy: r.armed_by ?? '',
    unpublishToken: r.unpublish_token,
    unpublishedAt: r.unpublished_at ?? null,
    unpublishedBy: r.unpublished_by ?? '',
    notified: !!r.notified,
    notifyError: r.notify_error ?? '',
  };
}

class D1AutoPublicationStore implements AutoPublicationStore {
  constructor(private db: D1) {}

  async create(
    p: Omit<AutoPublication, 'id' | 'unpublishedAt' | 'unpublishedBy' | 'notified' | 'notifyError'>
  ): Promise<AutoPublication> {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        `INSERT INTO ai_auto_publications
         (id, article_id, generation_id, article_title, article_slug, published_at,
          armed_by, unpublish_token, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
      )
      .bind(
        id, p.articleId, p.generationId, p.articleTitle, p.articleSlug,
        p.publishedAt, p.armedBy, p.unpublishToken, t
      )
      .run();
    return { ...p, id, unpublishedAt: null, unpublishedBy: '', notified: false, notifyError: '' };
  }

  async listRecent(limit: number): Promise<AutoPublication[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_auto_publications ORDER BY published_at DESC LIMIT ?1')
      .bind(limit)
      .all();
    return (results as Row[]).map(toAutoPublication);
  }

  async listSince(isoDate: string): Promise<AutoPublication[]> {
    const { results } = await this.db
      .prepare(
        'SELECT * FROM ai_auto_publications WHERE published_at >= ?1 AND unpublished_at IS NULL ORDER BY published_at DESC'
      )
      .bind(isoDate)
      .all();
    return (results as Row[]).map(toAutoPublication);
  }

  async byToken(token: string): Promise<AutoPublication | null> {
    if (!token) return null;
    const r = await this.db
      .prepare('SELECT * FROM ai_auto_publications WHERE unpublish_token = ?1')
      .bind(token)
      .first<Row>();
    return r ? toAutoPublication(r) : null;
  }

  async markUnpublished(id: string, by: string): Promise<void> {
    await this.db
      .prepare('UPDATE ai_auto_publications SET unpublished_at = ?1, unpublished_by = ?2 WHERE id = ?3')
      .bind(now(), by, id)
      .run();
  }

  async markNotified(id: string, error: string): Promise<void> {
    await this.db
      .prepare('UPDATE ai_auto_publications SET notified = ?1, notify_error = ?2 WHERE id = ?3')
      .bind(error ? 0 : 1, error, id)
      .run();
  }
}

// ───────────────────────────────────────────────── generated visuals

function toAsset(r: Row): VisualAsset & { id: string } {
  return {
    id: r.id,
    kind: r.kind,
    format: 'svg',
    filename: r.filename,
    altText: r.alt_text,
    caption: r.caption,
    width: r.width,
    height: r.height,
    svgMarkup: r.svg_markup,
    source: r.source,
  };
}

class D1AssetStore implements AssetStore {
  constructor(private db: D1) {}

  async create(generationId: string, a: Omit<VisualAsset, 'id'>) {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        `INSERT INTO ai_assets
         (id, generation_id, article_id, kind, format, filename, alt_text, caption,
          width, height, svg_markup, source, created_at)
         VALUES (?1,?2,NULL,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`
      )
      .bind(id, generationId, a.kind, a.format, a.filename, a.altText, a.caption, a.width, a.height, a.svgMarkup, a.source, t)
      .run();
    return { ...a, id };
  }

  async listByGeneration(generationId: string): Promise<VisualAsset[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_assets WHERE generation_id = ?1 ORDER BY created_at')
      .bind(generationId)
      .all();
    return (results as Row[]).map(toAsset);
  }

  async listByArticle(articleId: string): Promise<VisualAsset[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_assets WHERE article_id = ?1 ORDER BY created_at')
      .bind(articleId)
      .all();
    return (results as Row[]).map(toAsset);
  }

  async attachToArticle(generationId: string, articleId: string): Promise<void> {
    await this.db
      .prepare('UPDATE ai_assets SET article_id = ?1 WHERE generation_id = ?2')
      .bind(articleId, generationId)
      .run();
  }
}

// ───────────────────────────────────────────────── recommendations

function toRecommendationRun(r: Row): RecommendationRun {
  return {
    id: r.id,
    mode: r.mode,
    model: r.model,
    costUsd: r.cost_usd,
    picks: parseJson(r.picks_json, []),
    createdAt: r.created_at,
  };
}

class D1RecommendationStore implements RecommendationStore {
  constructor(private db: D1) {}

  async latest(maxAgeMs: number): Promise<RecommendationRun | null> {
    const r = await this.db
      .prepare('SELECT * FROM ai_recommendations ORDER BY created_at DESC LIMIT 1')
      .first<Row>();
    if (!r) return null;
    const ageMs = Date.now() - new Date(r.created_at).getTime();
    if (ageMs > maxAgeMs) return null;
    return toRecommendationRun(r);
  }

  async create(run: Omit<RecommendationRun, 'id' | 'createdAt'>): Promise<RecommendationRun> {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        'INSERT INTO ai_recommendations (id, mode, model, cost_usd, picks_json, created_at) VALUES (?1,?2,?3,?4,?5,?6)'
      )
      .bind(id, run.mode, run.model, run.costUsd, j(run.picks), t)
      .run();
    return { ...run, id, createdAt: t };
  }
}

// ───────────────────────────────────────────────── radar sources (admin-added)

function toRadarSource(r: Row): RadarSource {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    topic: r.topic ?? '',
    active: !!r.active,
    createdAt: r.created_at,
  };
}

class D1RadarSourceStore implements RadarSourceStore {
  constructor(private db: D1) {}

  async listActive(): Promise<RadarSource[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_radar_sources WHERE active = 1 ORDER BY created_at DESC')
      .all();
    return (results as Row[]).map(toRadarSource);
  }

  async listAll(): Promise<RadarSource[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM ai_radar_sources ORDER BY active DESC, created_at DESC')
      .all();
    return (results as Row[]).map(toRadarSource);
  }

  async add(input: { name: string; url: string; topic: string }): Promise<RadarSource> {
    const id = crypto.randomUUID();
    const t = now();
    await this.db
      .prepare(
        'INSERT INTO ai_radar_sources (id, name, url, topic, active, created_at) VALUES (?1,?2,?3,?4,1,?5)'
      )
      .bind(id, input.name, input.url, input.topic, t)
      .run();
    return { id, name: input.name, url: input.url, topic: input.topic, active: true, createdAt: t };
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.db.prepare('UPDATE ai_radar_sources SET active = ?1 WHERE id = ?2').bind(active ? 1 : 0, id).run();
  }

  async remove(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM ai_radar_sources WHERE id = ?1').bind(id).run();
  }
}

export function createAiStores(db: D1): AiStores {
  return {
    opportunities: new D1OpportunityStore(db),
    generations: new D1GenerationStore(db),
    feedback: new D1FeedbackStore(db),
    rules: new D1RuleStore(db),
    settings: new D1SettingsStore(db),
    assets: new D1AssetStore(db),
    recommendations: new D1RecommendationStore(db),
    allowlist: new D1TopicAllowlistStore(db),
    autoPublications: new D1AutoPublicationStore(db),
    radarSources: new D1RadarSourceStore(db),
  };
}

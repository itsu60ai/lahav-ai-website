// Cloudflare D1 implementations of every AI-engine storage interface.
//
// THIS IS THE ONLY FILE WITH SQL FOR THE AI ENGINE, mirroring src/lib/cms/d1.ts.
// Everything else in src/lib/ai/* depends on the interfaces in types.ts and
// gets stores through context.ts. Same physical database as the CMS and the
// leads table, different tables, zero shared code.
import type {
  AiSettings,
  AiStores,
  AssetStore,
  Feedback,
  FeedbackStore,
  Generation,
  GenerationStore,
  Opportunity,
  OpportunityDraft,
  OpportunityStatus,
  OpportunityStore,
  RecommendationRun,
  RecommendationStore,
  Rule,
  RuleStore,
  SettingsStore,
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

  async setActive(id: string, active: boolean): Promise<void> {
    await this.db
      .prepare('UPDATE ai_rules SET active = ?1, updated_at = ?2 WHERE id = ?3')
      .bind(active ? 1 : 0, now(), id)
      .run();
  }
}

// ───────────────────────────────────────────────── settings (read only)

class D1SettingsStore implements SettingsStore {
  constructor(private db: D1) {}

  async get(): Promise<AiSettings> {
    const r = await this.db.prepare('SELECT * FROM ai_settings WHERE id = 1').first<Row>();
    // A missing row cannot mean "auto publish on" — the safe default wins.
    if (!r) {
      return {
        providerMode: 'mock',
        recommendationMode: 'heuristic',
        autoPublishEnabled: false,
        autoPublishExpiresAt: null,
        autoPublishWeeklyCap: 0,
        autoPublishWeekStart: null,
        autoPublishCountThisWeek: 0,
        updatedAt: now(),
        updatedBy: '',
      };
    }
    return {
      providerMode: r.provider_mode,
      // A missing column (pre-migration row) cannot mean "spend money" —
      // the safe default wins, same reasoning as the missing-row case above.
      recommendationMode: r.recommendation_mode ?? 'heuristic',
      autoPublishEnabled: !!r.auto_publish_enabled,
      autoPublishExpiresAt: r.auto_publish_expires_at ?? null,
      autoPublishWeeklyCap: r.auto_publish_weekly_cap,
      autoPublishWeekStart: r.auto_publish_week_start ?? null,
      autoPublishCountThisWeek: r.auto_publish_count_this_week,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
    };
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

export function createAiStores(db: D1): AiStores {
  return {
    opportunities: new D1OpportunityStore(db),
    generations: new D1GenerationStore(db),
    feedback: new D1FeedbackStore(db),
    rules: new D1RuleStore(db),
    settings: new D1SettingsStore(db),
    assets: new D1AssetStore(db),
    recommendations: new D1RecommendationStore(db),
  };
}

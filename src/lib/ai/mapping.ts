// Small heuristic mappings shared by every path that turns a Brief into an
// Article — the mock generator (generate.ts) and the manual paste-back
// flow (pages/admin/ai/manual/[id].astro) both need the exact same
// contentKind → ArticleKind and serviceSlug → VizKind decisions.
import type { ArticleKind, VizKind } from '../cms/types.ts';
import type { ContentKind } from './types.ts';

export function contentKindToArticleKind(k: ContentKind): ArticleKind {
  return k === 'hack' || k === 'release' || k === 'workflow' ? 'hack' : 'guide';
}

const SERVICE_SLUG_TO_VIZ: Record<string, VizKind> = {
  crm: 'crm',
  automations: 'automation',
  'web-development': 'web',
  'app-development': 'app',
  'ai-content': 'content',
};

export function vizForServiceSlug(serviceSlug: string): VizKind {
  return SERVICE_SLUG_TO_VIZ[serviceSlug] ?? 'automation';
}

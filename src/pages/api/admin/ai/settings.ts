// D2: the engine settings WRITER. There was none before this.
//
// What this route CAN change: provider_mode, recommendation_mode,
// disclosure_enabled, the auto publish weekly cap, and the notification
// address.
//
// What this route CANNOT change, deliberately: auto_publish_enabled and
// auto_publish_expires_at. Those are not fields in EngineSettingsPatch, so
// they are unreachable from here even by posting extra form fields.
// Arming lives in its own route with its own typed confirmation, because
// "switch the engine to API mode" and "let the site publish in my name
// without me" are not decisions of the same weight and must not share a
// single Save button.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import type { EngineSettingsPatch, ProviderMode, RecommendationMode } from '../../../../lib/ai/types.ts';

const PROVIDER_MODES: ProviderMode[] = ['mock', 'manual', 'api'];
const RECOMMENDATION_MODES: RecommendationMode[] = ['heuristic', 'api'];
const BACK = '/admin/settings';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  // Engine modes decide whether the site spends money, so this is
  // settings:manage, not article:create.
  const denied = require_(locals.user, 'settings:manage');
  if (denied) return denied;

  const f = await request.formData();
  const patch: EngineSettingsPatch = {};

  const provider = String(f.get('providerMode') ?? '');
  if (PROVIDER_MODES.includes(provider as ProviderMode)) patch.providerMode = provider as ProviderMode;

  const rec = String(f.get('recommendationMode') ?? '');
  if (RECOMMENDATION_MODES.includes(rec as RecommendationMode)) {
    patch.recommendationMode = rec as RecommendationMode;
  }

  // An unchecked checkbox sends nothing, so the presence of the field is
  // the value. The form always submits the hidden marker below it, which
  // is how "the admin unticked this" is distinguished from "the field was
  // not part of this form at all".
  if (f.has('disclosureSubmitted')) {
    patch.disclosureEnabled = String(f.get('disclosureEnabled') ?? '') === 'on';
  }

  if (f.has('autoPublishWeeklyCap')) {
    const cap = Number(f.get('autoPublishWeeklyCap'));
    if (Number.isFinite(cap) && cap >= 0 && cap <= 50) patch.autoPublishWeeklyCap = Math.floor(cap);
  }

  if (f.has('autoPublishNotifyEmail')) {
    const email = String(f.get('autoPublishNotifyEmail') ?? '').trim();
    // Empty is valid and means "use the built in default address".
    if (!email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) patch.autoPublishNotifyEmail = email;
    else return redirect(`${BACK}?ai=bademail`, 303);
  }

  if (Object.keys(patch).length === 0) return redirect(`${BACK}?ai=nochange`, 303);

  const who = locals.user!.name || locals.user!.email;
  await getAiStores().settings.update(patch, who);

  return redirect(`${BACK}?ai=saved`, 303);
};

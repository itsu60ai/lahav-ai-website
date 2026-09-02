// D4: the ONLY route in the codebase that can turn auto publish on.
//
// ─────────────────────────────────────────────────────────────────────
// THIS FILE IS SAFETY LAYERS 2, 3 AND 4.
// ─────────────────────────────────────────────────────────────────────
// Layer 2, "structurally unable to enable itself": `settings.arm()` is
// imported and called from HERE AND NOWHERE ELSE. Grep the repository for
// `.arm(` and this is the only call site outside the store that defines
// it. Nothing under src/lib/ai/* calls it, which means no scheduled job,
// no generation, no gate, no radar collection and no model output can
// reach the switch. The unattended job (src/lib/ai/autopublish.ts) imports
// `disarm()` only: the machine can turn auto publish OFF, and has no
// function available to it that turns it ON.
//
// Layer 3: require_('settings:manage'), which only the admin role holds.
// Plus the session check and CSRF that middleware.ts already applies to
// every /api/admin request.
//
// Layer 4: a typed confirmation phrase. Arming is refused unless the exact
// Hebrew phrase below is typed by hand, so it cannot be a mis-click, and a
// forged cross-site request would have to already know the phrase.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { killAutoPublish, KILL_SWITCH_DEFAULT_DAYS } from '../../../../lib/ai/autopublish.ts';

/** Layer 4. Must be typed exactly, by hand, to arm. */
export const ARM_CONFIRMATION_PHRASE = 'אני מאשר פרסום אוטומטי';

const BACK = '/admin/settings';
const MAX_EXPIRY_DAYS = 90;
const DEFAULT_EXPIRY_DAYS = 30;
const MAX_WEEKLY_CAP = 10;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'settings:manage');
  if (denied) return denied;

  const f = await request.formData();
  const action = String(f.get('action') ?? '');
  const stores = getAiStores();
  const who = locals.user!.name || locals.user!.email;

  // ── turning it OFF, and taking back what it published ──
  // Note there is no confirmation phrase on these. Making the safe
  // direction frictionless is deliberate.
  if (action === 'disarm') {
    await stores.settings.disarm(who, false);
    return redirect(`${BACK}?ai=disarmed`, 303);
  }

  if (action === 'kill') {
    const { articles } = locals.stores!;
    const result = await killAutoPublish({
      aiStores: stores,
      articles,
      by: who,
      days: KILL_SWITCH_DEFAULT_DAYS,
    });
    return redirect(`${BACK}?ai=killed&n=${result.unpublished.length}`, 303);
  }

  // ── the topic allow list (layer 7) ──
  if (action === 'allow-add') {
    const topic = String(f.get('topic') ?? '').trim();
    if (!topic) return redirect(`${BACK}?ai=badtopic`, 303);
    await stores.allowlist.add(topic, who);
    return redirect(`${BACK}?ai=topicadded`, 303);
  }

  if (action === 'allow-remove') {
    const id = String(f.get('id') ?? '').trim();
    if (id) await stores.allowlist.remove(id);
    return redirect(`${BACK}?ai=topicremoved`, 303);
  }

  // ── turning it ON ──
  if (action !== 'arm') return redirect(BACK, 303);

  // LAYER 4: the typed confirmation.
  const typed = String(f.get('confirm') ?? '').trim();
  if (typed !== ARM_CONFIRMATION_PHRASE) {
    return redirect(`${BACK}?ai=badconfirm`, 303);
  }

  // LAYER 5: an expiry is mandatory and bounded. There is no "forever".
  const daysRaw = Number(f.get('expiryDays'));
  const days =
    Number.isFinite(daysRaw) && daysRaw >= 1 && daysRaw <= MAX_EXPIRY_DAYS
      ? Math.floor(daysRaw)
      : DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

  // LAYER 6: a cap is mandatory and bounded. Zero would be pointless and
  // an unbounded value is the thing Google's guidance warns about
  // (docs/AI_ENGINE.md section 12), so the range is enforced here rather
  // than trusted from the form.
  const capRaw = Number(f.get('weeklyCap'));
  const weeklyCap =
    Number.isFinite(capRaw) && capRaw >= 1 && capRaw <= MAX_WEEKLY_CAP ? Math.floor(capRaw) : 1;

  // LAYER 7, checked at arming time too, so the admin finds out now rather
  // than wondering later why nothing was ever published.
  const allow = await stores.allowlist.list();
  if (allow.length === 0) {
    return redirect(`${BACK}?ai=noallowlist`, 303);
  }

  await stores.settings.arm({ expiresAt, weeklyCap, armedBy: who });

  return redirect(`${BACK}?ai=armed&days=${days}`, 303);
};

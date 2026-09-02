// Reads engine settings. THIS FILE EXPORTS READERS ONLY.
//
// This is the structural half of Auto Publish safety (docs/AI_ENGINE.md,
// section 12, layer 2). Stage D added a writer, so the guarantee is now
// stated precisely rather than loosely:
//
//   The ONLY function that can set auto_publish_enabled to 1 is
//   SettingsStore.arm() in d1.ts. It requires a named human and a
//   mandatory future expiry date, and it has exactly ONE call site in the
//   whole repository: src/pages/api/admin/ai/auto-publish.ts, behind the
//   admin session, CSRF, the `settings:manage` permission and a typed
//   Hebrew confirmation phrase. Grep `.arm(` to confirm.
//
//   Nothing in src/lib/ai/* calls it. The unattended scheduled job
//   (autopublish.ts) uses get(), disarm() and recordAutoPublishUse() only,
//   so the engine can switch Auto Publish OFF and has no function
//   available to it that switches it ON.
import type { AiSettings, AiStores } from './types.ts';

export async function getSettings(stores: AiStores): Promise<AiSettings> {
  return stores.settings.get();
}

export async function currentProviderMode(stores: AiStores) {
  return (await stores.settings.get()).providerMode;
}

export async function currentRecommendationMode(stores: AiStores) {
  return (await stores.settings.get()).recommendationMode;
}

export async function isAutoPublishArmed(stores: AiStores): Promise<boolean> {
  const s = await stores.settings.get();
  if (!s.autoPublishEnabled) return false;
  if (!s.autoPublishExpiresAt) return false; // no expiry set means it can never be armed
  return new Date(s.autoPublishExpiresAt).getTime() > Date.now();
}

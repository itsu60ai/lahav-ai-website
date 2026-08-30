// Reads engine settings. THIS FILE EXPORTS READERS ONLY.
//
// This is the structural half of Auto Publish safety (docs/AI_ENGINE.md,
// section 12, layer 2): there is no function anywhere in src/lib/ai/* that
// can set auto_publish_enabled to 1. Grep for it — it does not exist. When
// Auto Publish is built (Stage D), its one writer will live in an
// admin-only API route gated on the `settings:manage` permission, imported
// from nowhere in this directory.
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

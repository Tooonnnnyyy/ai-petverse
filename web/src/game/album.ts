// Album: deterministic souvenir order and idempotent rewards (spec §4.5, R3). Pure.
import type { AlbumState, OutingReward, PlaceId, SouvenirId } from "../shared/types";
import { KEEPSAKE_MIN_ELAPSED, POSTCARD_LOG_MAX, SOUVENIR_MIN_ELAPSED } from "./config";
import { PLACES, PLACE_IDS, SOUVENIR_IDS, placeOfStory, storyAt } from "./catalog";
import { deriveSeed, seededShuffle } from "./rng";

export function emptyAlbum(): AlbumState {
  return { souvenirs: [], postcards: [], moments: [], storyCursor: { garden: 0, riverside: 0, market: 0, hills: 0 }, outingsCompleted: 0 };
}

/** The 5 everyday items of a place in this install's seeded order. */
export function everydayOrder(place: PlaceId, installSeed: number): SouvenirId[] {
  return seededShuffle(PLACES[place].everyday, deriveSeed(installSeed, `souvenirs:${place}`));
}

/** Next unowned souvenir for an outing of elapsedMin, or null when it brings a postcard. */
export function nextSouvenir(place: PlaceId, owned: ReadonlySet<SouvenirId>, installSeed: number, elapsedMin: number): SouvenirId | null {
  if (!(elapsedMin >= SOUVENIR_MIN_ELAPSED)) return null;
  const next = everydayOrder(place, installSeed).find((id) => !owned.has(id));
  if (next) return next;
  const keepsake = PLACES[place].keepsake;
  return elapsedMin >= KEEPSAKE_MIN_ELAPSED && !owned.has(keepsake) ? keepsake : null;
}

function rewardPlace(r: OutingReward): PlaceId | null {
  return r.kind === "postcard" ? r.place : placeOfStory(r.storyId);
}

/**
 * Applies a gift. Idempotent: the story cursor only advances when the reward's story is
 * the one at the cursor, so applying the same reward twice changes nothing the second time.
 */
export function addReward(a: AlbumState, r: OutingReward): AlbumState {
  const place = rewardPlace(r);
  if (!place) return a;
  const fresh = storyAt(place, a.storyCursor[place]) === r.storyId;
  const souvenirs = r.kind === "souvenir" && !a.souvenirs.includes(r.id) ? [...a.souvenirs, r.id] : a.souvenirs;
  if (!fresh) return souvenirs === a.souvenirs ? a : { ...a, souvenirs };
  const postcards = r.kind === "postcard" ? [...a.postcards, r.storyId].slice(-POSTCARD_LOG_MAX) : a.postcards;
  return {
    ...a,
    souvenirs,
    postcards,
    storyCursor: { ...a.storyCursor, [place]: a.storyCursor[place] + 1 },
    outingsCompleted: a.outingsCompleted + 1,
  };
}

export function albumCounts(a: AlbumState): {
  owned: number;
  total: number;
  complete: boolean;
  byPlace: Record<PlaceId, { owned: number; total: number }>;
} {
  const owned = new Set(a.souvenirs);
  const byPlace = {} as Record<PlaceId, { owned: number; total: number }>;
  for (const p of PLACE_IDS) {
    const all = [...PLACES[p].everyday, PLACES[p].keepsake];
    byPlace[p] = { owned: all.filter((id) => owned.has(id)).length, total: all.length };
  }
  const n = SOUVENIR_IDS.filter((id) => owned.has(id)).length;
  return { owned: n, total: SOUVENIR_IDS.length, complete: n === SOUVENIR_IDS.length, byPlace };
}

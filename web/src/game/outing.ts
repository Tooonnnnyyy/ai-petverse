// Outings: start, load-time resolution, deterministic rewards and the pay-once return (spec §4.4, §4.5). Pure.
import type { Outing, OutingMinutes, OutingReward, PlaceId, SaveV2, AlbumState } from "../shared/types";
import { KEEPSAKE_MIN_ELAPSED, SOUVENIR_MIN_ELAPSED } from "./config";
import { PLACES, storyAt } from "./catalog";
import { awardBond, outingBond } from "./bond";
import { nextSouvenir, addReward } from "./album";
import { localDayKey } from "./time";
import { deriveSeed, mulberry32 } from "./rng";
import { rareChance, rememberOuting } from "./life";

const MIN = 60_000;

export function startOuting(place: PlaceId, plannedMin: OutingMinutes, now: number, id: string): Outing {
  return { id, place, plannedMin, startedAt: now, endsAt: now + plannedMin * MIN, recalledAt: null, creditedAt: null };
}

/** "Call back": marks the outing recalled now (clamped into the outing's window). */
export function recallOuting(o: Outing, now: number): Outing {
  if (o.recalledAt !== null || o.creditedAt !== null) return o;
  return { ...o, recalledAt: Math.min(o.endsAt, Math.max(o.startedAt, now)) };
}

/** Includes the clock guard: a clock moved back (now < startedAt) returns at once. */
export function resolveOnLoad(o: Outing | null, now: number): "none" | "away" | "returnNow" {
  if (!o) return "none";
  if (o.creditedAt !== null || o.recalledAt !== null) return "returnNow";
  if (now < o.startedAt || now >= o.endsAt) return "returnNow";
  return "away";
}

/** When the pet counts as back: the recall time, else now clamped into [startedAt, endsAt]. */
export function returnedAtFor(o: Outing, now: number): number {
  if (o.recalledAt !== null) return Math.min(o.endsAt, Math.max(o.startedAt, o.recalledAt));
  return Math.min(o.endsAt, Math.max(o.startedAt, now));
}

/** Elapsed minutes, clamped to [0, planned]. */
export function elapsedMin(o: Outing, returnedAt: number): number {
  return Math.min(o.plannedMin, Math.max(0, (returnedAt - o.startedAt) / MIN));
}

export function rewardFor(o: Outing, returnedAt: number, album: AlbumState, installSeed: number): OutingReward {
  const elapsed = elapsedMin(o, returnedAt);
  const storyId = storyAt(o.place, album.storyCursor[o.place]);
  const owned = new Set(album.souvenirs);
  // Outings created before rule v1 retain their original reward contract.
  // New outings freeze their discovery inputs at departure; reload/purchases cannot reroll them.
  if (o.discovery) {
    const place = PLACES[o.place];
    const rng = mulberry32(deriveSeed(installSeed, `discovery-v1:${o.id}:${o.startedAt}:${o.place}`));
    if (o.plannedMin !== 1 && elapsed >= SOUVENIR_MIN_ELAPSED) {
      if (!owned.has(place.keepsake) && rng.next() < rareChance(o.discovery)) {
        return { kind: "souvenir", id: place.keepsake, storyId, isNew: true, rarity: "rare" };
      }
      const available = place.everyday.filter((id) => !owned.has(id));
      if (available.length) return { kind: "souvenir", id: rng.pick(available), storyId, isNew: true, rarity: rng.next() < 0.25 ? "uncommon" : "common" };
    }
    return { kind: "postcard", place: o.place, storyId, hint: null, rarity: "common" };
  }
  const id = o.plannedMin === 1 ? null : nextSouvenir(o.place, owned, installSeed, elapsed);
  if (id) return { kind: "souvenir", id, storyId, isNew: true };
  const place = PLACES[o.place];
  const keepsakeWaiting = place.everyday.every((s) => owned.has(s)) && !owned.has(place.keepsake);
  const hint = keepsakeWaiting && elapsed >= SOUVENIR_MIN_ELAPSED && elapsed < KEEPSAKE_MIN_ELAPSED ? "longerTrip" : null;
  return { kind: "postcard", place: o.place, storyId, hint };
}

/**
 * §4.4 return procedure. Pure; the caller writes the save once.
 * With creditedAt already set it pays nothing and returns the pending gift.
 * reward is null only when there is nothing to show (no outing and no pending gift).
 */
export function resolveReturn(
  s: SaveV2,
  now: number,
): { save: SaveV2; reward: OutingReward | null; bondGranted: number; levelUp: number | null } {
  const o = s.outing;
  if (!o) return { save: s, reward: s.pendingGift, bondGranted: 0, levelUp: null };
  if (o.creditedAt !== null) {
    // Already paid. Without a pending gift the card was dismissed elsewhere: just tidy up.
    if (s.pendingGift) return { save: s, reward: s.pendingGift, bondGranted: 0, levelUp: null };
    return { save: { ...s, outing: null }, reward: null, bondGranted: 0, levelUp: null };
  }
  const returnedAt = returnedAtFor(o, now);
  const reward = rewardFor(o, returnedAt, s.album, s.installSeed);
  const bp = outingBond(o.plannedMin, elapsedMin(o, returnedAt));
  const { ledger, granted, levelUp } = awardBond(s.bond, "outing", bp, localDayKey(now));
  const recalledAt = o.recalledAt ?? (returnedAt < o.endsAt ? returnedAt : null);
  return {
    save: { ...s, bond: ledger, album: addReward(s.album, reward), life: o.discovery ? rememberOuting(s.life, o, reward, now, elapsedMin(o, returnedAt) >= SOUVENIR_MIN_ELAPSED) : s.life, pendingGift: reward, outing: { ...o, recalledAt, creditedAt: now } },
    reward,
    bondGranted: granted,
    levelUp,
  };
}

/** After the gift card is dismissed: clear the outing and the pending gift. */
export function clearGift(s: SaveV2): SaveV2 {
  return { ...s, outing: s.outing && s.outing.creditedAt === null ? s.outing : null, pendingGift: null };
}

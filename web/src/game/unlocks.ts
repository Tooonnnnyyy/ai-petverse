// Unlocks by id (spec §4.3). Pure.
import type { Unlock, UnlockId } from "../shared/types";
import { FLAGS } from "./config";

export const UNLOCKS: readonly Unlock[] = [
  { id: "cushion", level: 2, phase: "P0" },
  { id: "talkSet2", level: 2, phase: "P1" },
  { id: "market", level: 3, phase: "P0" },
  { id: "windowSeat", level: 4, phase: "P0" },
  { id: "scarf", level: 4, phase: "P1" },
  { id: "hills", level: 5, phase: "P0" },
  { id: "lamp", level: 6, phase: "P1" },
  { id: "bow", level: 7, phase: "P1" },
  { id: "plantRug", level: 8, phase: "P1" },
  { id: "rainWindow", level: 9, phase: "P1" },
  { id: "albumCover", level: 10, phase: "P1" },
];

/** Unlocks live in this build. */
export const SHIPPED_UNLOCKS: readonly Unlock[] = UNLOCKS.filter((u) => u.phase === "P0" || FLAGS.P1_SHIPPED);

/** Reached-but-unseen unlock ids, lowest level first. */
export function pendingUnlocks(level: number, seen: readonly UnlockId[], shipped: readonly Unlock[] = SHIPPED_UNLOCKS): UnlockId[] {
  const seenSet = new Set(seen);
  return shipped
    .filter((u) => u.level <= level && !seenSet.has(u.id))
    .sort((a, b) => a.level - b.level)
    .map((u) => u.id);
}

/** Every shipped unlock at or below the level (for Ctx.unlocked). */
export function unlockedSet(level: number, shipped: readonly Unlock[] = SHIPPED_UNLOCKS): Set<UnlockId> {
  return new Set(shipped.filter((u) => u.level <= level).map((u) => u.id));
}

export function unlockLevel(id: UnlockId): number {
  return UNLOCKS.find((u) => u.id === id)?.level ?? Infinity;
}

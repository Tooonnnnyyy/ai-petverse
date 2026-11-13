// Glue between the save and the card queue (spec §3 R7, §4.1–§4.3). Pure; used by hooks/useGame.ts.
import type { BondSource, Card, SaveV2, UnlockId } from "../shared/types";
import { awardBond, levelFor } from "./bond";
import { ECONOMY } from "./config";
import { localDayKey } from "./time";
import { pendingUnlocks } from "./unlocks";
import { addLifeSignal } from "./life";

export const GIFT_CARD_ID = "gift";
export const WELCOME_CARD_ID = "welcome";
export const levelCardId = (level: number) => `levelUp-${level}`;

/** The level a levelUp card id stands for, or null. */
export function levelOfCard(id: string): number | null {
  const m = /^levelUp-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

/** Awards Bond for an effect within the caps (amount defaults to the source's BP). */
export function awardTo(
  s: SaveV2,
  source: BondSource,
  amount: number | undefined,
  now: number,
): { save: SaveV2; granted: number; levelUp: number | null } {
  const { ledger, granted, levelUp } = awardBond(s.bond, source, amount ?? ECONOMY[source].bp, localDayKey(now));
  const life = granted > 0 && (source === "pet" || source === "feed" || source === "play" || source === "talk") ? addLifeSignal(s.life, "interaction", now) : s.life;
  return { save: granted > 0 || ledger !== s.bond ? { ...s, bond: ledger, life } : s, granted, levelUp };
}

/** Unlocks a levelUp card announces: reached, not yet seen, at or below the level. */
export function unlocksForCard(s: SaveV2, level: number): UnlockId[] {
  return pendingUnlocks(level, s.unlocksSeen);
}

/** After a levelUp card is dismissed: every reached unlock at or below the level counts as seen. */
export function markLevelSeen(s: SaveV2, level: number): SaveV2 {
  const add = pendingUnlocks(level, s.unlocksSeen);
  return add.length === 0 ? s : { ...s, unlocksSeen: [...s.unlocksSeen, ...add] };
}

/** Cards rebuilt at the start of a Room session: a waiting gift, one card for unseen unlocks, the welcome card. */
export function startupCards(s: SaveV2, now: number): Card[] {
  const cards: Card[] = [];
  if (s.pendingGift) cards.push({ kind: "gift", id: GIFT_CARD_ID, enqueuedAt: now });
  const level = levelFor(s.bond.total).level;
  if (pendingUnlocks(level, s.unlocksSeen).length > 0) {
    cards.push({ kind: "levelUp", id: levelCardId(level), enqueuedAt: now });
  }
  if (!s.flags.welcomeSeen) cards.push({ kind: "welcome", id: WELCOME_CARD_ID, enqueuedAt: now });
  return cards;
}

// Profile-driven reactions to a tap and to a drop (spec §6.1, §6.2). Pure; randomness comes from the passed Rng.
import type { Rng } from "../game/rng";
import type { DropZone, EffectiveProfile } from "../shared/types";
import { PET_TIMING as T } from "./timing";

export type PetReaction = {
  reaction: "purr" | "lean" | "earFlick" | "slowBlink";
  overPetting: null | "hide" | "walkAway" | "slowBlink" | "stay";
  delayMs: number;
};

/** 15% of reactions to a tap, Feed, Play, Talk or a support chip wait 300–900 ms (§5.3). */
export function rollDelay(rng: Rng): number {
  return rng.next() < T.delay.p ? rng.int(T.delay.minMs, T.delay.maxMs) : 0;
}

/** Taps in 8 s that count as over-petting: 4, or 3 with "too much energy" or the "likes space" correction. */
export function overPetThreshold(p: EffectiveProfile): number {
  const sensitive =
    p.trigger === "too_much_energy" || (p.comfortStyle === "space" && p.sources.comfortStyle === "correction");
  return sensitive ? T.overPet.tapsSensitive : T.overPet.taps;
}

/** `recentPets` includes the current tap. */
export function petReaction(
  p: EffectiveProfile,
  recentPets: readonly number[],
  now: number,
  inSupportWindow: boolean,
  rng: Rng,
): PetReaction {
  const delayMs = rollDelay(rng);
  const taps = recentPets.filter((t) => t <= now && now - t < T.overPet.windowMs).length;
  if (taps >= overPetThreshold(p)) {
    if (inSupportWindow) return { reaction: "earFlick", overPetting: "stay", delayMs };
    if (p.comfortStyle === "space" || p.startleHide) return { reaction: "earFlick", overPetting: "hide", delayMs };
    if (p.comfortStyle === "nearby") return { reaction: "earFlick", overPetting: "walkAway", delayMs };
    return { reaction: "slowBlink", overPetting: "slowBlink", delayMs };
  }
  const o = T.petOdds[p.comfortStyle];
  const reaction = rng.weighted([
    ["purr", o.purr],
    ["lean", o.lean],
    ["earFlick", o.earFlick],
  ] as const);
  return { reaction, overPetting: null, delayMs };
}

/** Hide chance after a release outside a drop zone (§6.2). */
export function hideChance(p: EffectiveProfile, speedPxS: number): number {
  const h = T.hideChance;
  const fast = speedPxS > h.fastPxS;
  let chance = h[p.comfortStyle];
  if (fast) chance += h.fast;
  if (fast && p.trigger === "sudden_noise") chance += h.suddenNoise;
  if (p.startleHide) chance += h.startleHide;
  return Math.min(h.cap, chance);
}

export function landingReaction(
  p: EffectiveProfile,
  speedPxS: number,
  zone: DropZone | null,
  inSupportWindow: boolean,
  rng: Rng,
): { action: "zone" | "hide" | "land"; startle: boolean } {
  if (zone) return { action: "zone", startle: false };
  // Inside the R9 window there is no hide roll: the pet lands and rests.
  if (inSupportWindow) return { action: "land", startle: false };
  const startle = speedPxS > T.hideChance.fastPxS;
  return { action: rng.next() < hideChance(p, speedPxS) ? "hide" : "land", startle };
}

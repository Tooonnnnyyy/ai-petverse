// Every pet-behaviour number from spec §5 and §6 (durations in ms, speeds in px/s, ratios of stage width).
// Tests import from here so the spec and the machine cannot drift apart.
import type { ComfortStyle, DropZone, Edge, Energy } from "../shared/types";

export const PET_TIMING = {
  rest: { minMs: 20_000, maxMs: 60_000, firstMinMs: 10_000, firstMaxMs: 20_000, variants: 2 },
  /** Next long state after rest (and the generic "autonomous pick"). */
  restExit: { walk: 0.55, rest: 0.3, sit: 0.15 },
  walkExit: { rest: 0.75, sit: 0.25 },
  sitExit: { rest: 0.5, walk: 0.5 },
  wakeExit: { rest: 0.5, walk: 0.5 },
  sleepAfterRests: 3,
  sleepAfterRestsNight: 2,
  walk: {
    minPxS: 45,
    maxPxS: 70,
    slowFactor: 0.8, // energy < 30
    fastFactor: 1.2, // energy > 75
    minDistRatio: 0.15,
    marginPx: 16,
    spriteHalfPx: 60, // half of the smallest sprite box (120 px)
    capMs: 12_000,
    arriveSlackMs: 1_000,
  },
  sit: { minMs: 4_000, maxMs: 8_000 },
  transition: { minMs: 1_600, maxMs: 2_400, p: 1 / 3 },
  land: { ms: 800 },
  fall: { fallMs: 300, squashMs: 120 },
  sleep: { minMs: 60_000, maxMs: 180_000 },
  petted: { minMs: 1_200, maxMs: 2_000, slowBlinkMs: 2_500, chainMs: 1_500, maxHearts: 3 },
  overPet: { windowMs: 8_000, taps: 4, tapsSensitive: 3 },
  eat: { minMs: 3_000, maxMs: 4_000 },
  feed: { windowMs: 20 * 60_000, maxInWindow: 2 }, // the 3rd feed in 20 min is declined
  play: { minMs: 6_000, maxMs: 10_000, triggerMs: 6_000, cooldownMs: 45_000, triggerCooldownMs: 60_000, tiredBelow: 25 },
  talk: { minMs: 3_000, maxMs: 6_000 },
  decline: { ms: 3_000 },
  approach: { normalPxS: 60, slowPxS: 40, arriveSlackMs: 1_500 },
  settle: {
    minMs: 20_000,
    maxMs: 40_000,
    quietMs: 60_000,
    near: [0.03, 0.12] as const,
    nearby: [0.2, 0.3] as const,
    room: [0.35, 0.45] as const,
  },
  walkAway: [0.3, 0.4] as const,
  hide: { minMs: 8_000, maxMs: 20_000 },
  leaving: { minMs: 3_000, maxMs: 5_000 },
  returning: { minMs: 3_000, maxMs: 5_000 },
  calmFadeMs: 1_000, // fadeTo: 200 out + move + 200 in, plus slack before the timeout fallback
  zoneAction: {
    bedSleep: [60_000, 120_000] as const,
    bowlEatMs: 3_000,
    cushionRest: [20_000, 40_000] as const,
    windowSit: [10_000, 20_000] as const,
  },
  bubble: { minGapMs: 120_000, idleChance: 0.5 },
  delay: { p: 0.15, minMs: 300, maxMs: 900 },
  visibleYawnAfterMs: 60_000,
  supportWindowMs: 120_000, // R9: 2 min after a support action, comfort intent or urgent card
  lastLines: 3,
  energy: {
    min: 10,
    max: 100,
    walkPer4s: -1,
    restPer4s: 1,
    play: -15,
    feed: 5,
    lowBelow: 30,
    highAbove: 75,
    lowWalk: 0.6,
    lowRest: 1.5,
    highWalk: 1.5,
    highRest: 0.7,
  },
  curiosity: { initial: 40, per10s: 2, afterWalk: 20, highAt: 70, highFactor: 1.5, min: 0, max: 100 },
  night: { restFactor: 1.5 },
  hideChance: { space: 0.5, nearby: 0.15, close: 0, fastPxS: 1_500, fast: 0.3, suddenNoise: 0.2, startleHide: 0.3, cap: 0.9 },
  petOdds: {
    nearby: { purr: 0.7, lean: 0.2, earFlick: 0.1 },
    close: { purr: 0.6, lean: 0.35, earFlick: 0.05 },
    space: { purr: 0.5, lean: 0.25, earFlick: 0.25 },
  } satisfies Record<ComfortStyle, { purr: number; lean: number; earFlick: number }>,
} as const;

export const ENERGY_BASELINE: Record<Energy, number> = { low: 45, steady: 65, high: 85 };

/** Drop-zone band centres (stage ratios, §6.2). Each band is 14% of the stage and at least 44 px wide. */
export const ZONE_X: Record<DropZone, number> = { bed: 0.12, bowl: 0.32, cushion: 0.58, windowSeat: 0.84 };
export const ZONE_BAND = { ratio: 0.14, minPx: 44 } as const;

/** Where a returning pet stops after walking in from an edge (state.x after "returning"). */
export const RETURN_X: Record<Edge, number> = { left: 0.25, right: 0.75 };

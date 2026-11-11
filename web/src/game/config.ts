// Every tunable number for the gamification layer (spec §4, Review notes v0.4).
// Tests import from here so the spec and the code cannot drift apart.
import type { BondSource, OutingMinutes } from "../shared/types";

/** BP per accepted action and its daily cap (per local day). Outing BP is computed by outingBond. */
export const ECONOMY: Record<BondSource, { bp: number; cap: number }> = {
  pet: { bp: 1, cap: 2 },
  feed: { bp: 1, cap: 1 },
  play: { bp: 1, cap: 1 },
  talk: { bp: 1, cap: 1 },
  care: { bp: 4, cap: 8 },
  outing: { bp: 0, cap: 9 }, // amount always comes from outingBond(planned, elapsed)
};

/** Total BP per visit (local day). Source caps add up to 22, so this binds only on heavy days. */
export const DAILY_TOTAL_CAP = 20;

/** Minutes of outing per BP: floor(min(elapsed, planned) / 5). */
export const OUTING_MIN_PER_BP = 5;

/** Reward thresholds in minutes (§4.5). */
export const SOUVENIR_MIN_ELAPSED = 15;
export const KEEPSAKE_MIN_ELAPSED = 25;

export const OUTING_DURATIONS: readonly OutingMinutes[] = [5, 15, 25, 45];
/** The 1-min "Quick look" (0 BP, always a postcard); shown with ?quick=1 or the demo pet. */
export const QUICK_OUTING_MIN = 1;

/** A new session starts after this long hidden (§3 Terms). */
export const SESSION_HIDDEN_MS = 30 * 60 * 1000;

/** Cards: invitations and outing offers are dropped if they cannot show within this time (R7). */
export const PROMPT_SHOW_WINDOW_MS = 10_000;

/** Album: the postcard log keeps the last N story ids. */
export const POSTCARD_LOG_MAX = 30;

export const MAX_LEVEL = 10;

/** Level names for L1–L10 (index 0 = L1). */
export const LEVEL_NAMES = [
  "New friend",
  "Curious",
  "Familiar",
  "Comfy",
  "Trusted",
  "Cosy",
  "Close",
  "Dear",
  "Kindred",
  "Old friends",
] as const;

/** Feature flags. */
export const FLAGS = {
  SHOW_COMMUNITY: false,
  /** P1 content (moments, P1 unlocks) is not shipped in P0. */
  P1_SHIPPED: false,
  QUICK_OUTING_MIN,
} as const;
export const SHOW_COMMUNITY = FLAGS.SHOW_COMMUNITY;

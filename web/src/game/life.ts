// Local, versioned life economy. No payment provider, remote agents or analytics.
import type { CourseId, LifeProgress, LifeSignal, Outing, OutingReward, SaveV2, ShopId } from "../shared/types";
import { levelFor } from "./bond";
import { localDayKey } from "./time";

export const LIFE_RULES = {
  version: 1,
  dailyCaps: { interaction: 8, activeMinute: 10, outing: 3, course: 1 },
  weights: { interaction: 1, activeMinute: 1, outing: 4, course: 8 },
  rareBase: 0.05,
  rareGrowthMax: 0.20,
  purchaseBoostMax: 0.05,
  pityAfter: 8,
  idleMs: 60_000,
} as const;

export const COURSES: { id: CourseId; name: string; detail: string; cost: number; minutes: number; level: number }[] = [
  { id: "gardenClub", name: "Garden club", detail: "A gentle afternoon exploring leaves and scents.", cost: 12, minutes: 5, level: 1 },
  { id: "manners", name: "Little manners", detail: "A patient lesson in waiting, greeting and curiosity.", cost: 18, minutes: 15, level: 2 },
  { id: "trailSchool", name: "Trail school", detail: "Follow a quiet trail and notice something new.", cost: 24, minutes: 25, level: 3 },
];

export const SHOP: { id: ShopId; name: string; detail: string; cost: number; level: number; kind: "outfit" | "food" }[] = [
  { id: "bandana", name: "Sage bandana", detail: "A soft little scarf to wear in the room.", cost: 10, level: 1, kind: "outfit" },
  { id: "picnic", name: "Picnic basket", detail: "A snack collection for quiet adventures.", cost: 8, level: 1, kind: "food" },
  { id: "bow", name: "Coral bow", detail: "A small celebration, just for your companion.", cost: 18, level: 2, kind: "outfit" },
  { id: "feast", name: "Garden feast", detail: "A special menu for a familiar friend.", cost: 24, level: 3, kind: "food" },
];

const emptySignals = (): Record<LifeSignal, number> => ({ interaction: 0, activeMinute: 0, outing: 0, course: 0 });
export function newLife(): LifeProgress {
  return { signals: emptySignals(), daily: { day: "", counts: emptySignals() }, coins: 30, purchases: [], equipped: null, completedCourses: [], activeCourse: null, rareMisses: 0, memories: [] };
}

/** Only accepted game events count. Per-day caps also cap earnings; no streak decay. */
export function addLifeSignal(life: LifeProgress, signal: LifeSignal, now: number): LifeProgress {
  const day = localDayKey(now);
  // A backwards clock never opens another allowance.
  if (life.daily.day > day) return life;
  const counts = life.daily.day === day ? life.daily.counts : emptySignals();
  if (counts[signal] >= LIFE_RULES.dailyCaps[signal]) return life;
  return {
    ...life,
    signals: { ...life.signals, [signal]: life.signals[signal] + 1 },
    daily: { day, counts: { ...counts, [signal]: counts[signal] + 1 } },
    coins: life.coins + (signal === "interaction" ? 2 : signal === "activeMinute" ? 1 : 5),
  };
}

export function discoverySnapshot(life: LifeProgress): NonNullable<Outing["discovery"]> {
  const score = Math.min(100, Object.entries(LIFE_RULES.weights).reduce((sum, [key, weight]) => sum + Math.min(1000, life.signals[key as LifeSignal]) * weight, 0));
  return { score, purchaseBoost: Math.min(LIFE_RULES.purchaseBoostMax, life.purchases.length * 0.01), rareMisses: Math.min(LIFE_RULES.pityAfter, life.rareMisses) };
}

export function rareChance(snapshot: NonNullable<Outing["discovery"]>): number {
  if (snapshot.rareMisses >= LIFE_RULES.pityAfter) return 1;
  return Math.min(0.30, LIFE_RULES.rareBase + Math.max(0, Math.min(100, snapshot.score)) / 100 * LIFE_RULES.rareGrowthMax + Math.max(0, Math.min(LIFE_RULES.purchaseBoostMax, snapshot.purchaseBoost)));
}

export function purchaseItem(s: SaveV2, id: ShopId): SaveV2 {
  const item = SHOP.find((x) => x.id === id);
  if (!item || s.life.purchases.includes(id) || s.life.coins < item.cost || levelFor(s.bond.total).level < item.level) return s;
  return { ...s, life: { ...s.life, coins: s.life.coins - item.cost, purchases: [...s.life.purchases, id], equipped: item.kind === "outfit" ? id as "bandana" | "bow" : s.life.equipped } };
}

export function enrollCourse(s: SaveV2, id: CourseId, now: number, quick = false): SaveV2 {
  const course = COURSES.find((x) => x.id === id);
  if (!course || s.life.activeCourse || s.life.completedCourses.includes(id) || s.life.coins < course.cost || levelFor(s.bond.total).level < course.level || s.outing) return s;
  return { ...s, life: { ...s.life, coins: s.life.coins - course.cost, activeCourse: { id, startedAt: now, endsAt: now + (quick ? 1 : course.minutes) * 60_000 } } };
}

/** Once-only completion; reloading a ready course cannot award twice. */
export function completeCourse(s: SaveV2, now: number): SaveV2 {
  const c = s.life.activeCourse;
  if (!c || now < c.endsAt) return s;
  const life = addLifeSignal(s.life, "course", now);
  return { ...s, life: { ...life, activeCourse: null, completedCourses: [...new Set([...life.completedCourses, c.id])] } };
}

export function rememberOuting(life: LifeProgress, o: Outing, reward: OutingReward, now: number, qualified: boolean): LifeProgress {
  if (life.memories.some((m) => m.id === o.id)) return life;
  const rarity = reward.rarity ?? "common";
  const next = qualified ? addLifeSignal(life, "outing", now) : life;
  return {
    ...next,
    rareMisses: qualified ? rarity === "rare" ? 0 : Math.min(LIFE_RULES.pityAfter, life.rareMisses + 1) : life.rareMisses,
    memories: [...next.memories, { id: o.id, place: o.place, rarity, at: now, storyId: reward.storyId, souvenir: reward.kind === "souvenir" ? reward.id : null }].slice(-50),
  };
}

/** A tab must be visible, recently used, unpaused and not in a support interruption. */
export function isActiveCompanionship(now: number, lastInput: number, visible: boolean, paused: boolean): boolean {
  return visible && !paused && now >= lastInput && now - lastInput < LIFE_RULES.idleMs;
}

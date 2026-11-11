// Bond ledger, daily caps and levels (spec §4.1, §4.2). Pure.
import type { BondLedger, BondSource } from "../shared/types";
import { DAILY_TOTAL_CAP, ECONOMY, LEVEL_NAMES, MAX_LEVEL, OUTING_MIN_PER_BP } from "./config";

/** threshold(L) = L² − 1 for L1–L10. */
export const LEVEL_THRESHOLDS = [0, 3, 8, 15, 24, 35, 48, 63, 80, 99] as const;

export function emptyLedger(): BondLedger {
  return { total: 0, day: "", today: {}, todayTotal: 0 };
}

/** Ledger with today's counters reset when the day key changed. */
export function ledgerForDay(l: BondLedger, dayKey: string): BondLedger {
  return l.day === dayKey ? l : { total: l.total, day: dayKey, today: {}, todayTotal: 0 };
}

/** BP still available today for a source (min of its cap and the total cap). */
export function remainingToday(l: BondLedger, src: BondSource, dayKey: string): number {
  const d = ledgerForDay(l, dayKey);
  const srcLeft = ECONOMY[src].cap - (d.today[src] ?? 0);
  return Math.max(0, Math.min(srcLeft, DAILY_TOTAL_CAP - d.todayTotal));
}

/** True when the total cap is reached ("Bond is resting for today"). */
export function isResting(l: BondLedger, dayKey: string): boolean {
  return ledgerForDay(l, dayKey).todayTotal >= DAILY_TOTAL_CAP;
}

/** Awards BP within the caps. Never lowers total; a bad amount grants 0. */
export function awardBond(
  l: BondLedger,
  src: BondSource,
  amount: number,
  dayKey: string,
): { ledger: BondLedger; granted: number; levelUp: number | null } {
  const d = ledgerForDay(l, dayKey);
  const want = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  const granted = Math.min(want, remainingToday(d, src, dayKey));
  if (granted === 0) return { ledger: d, granted: 0, levelUp: null };
  const ledger: BondLedger = {
    total: d.total + granted,
    day: dayKey,
    today: { ...d.today, [src]: (d.today[src] ?? 0) + granted },
    todayTotal: d.todayTotal + granted,
  };
  const before = levelFor(d.total).level;
  const after = levelFor(ledger.total).level;
  return { ledger, granted, levelUp: after > before ? after : null };
}

export function levelFor(total: number): { level: number; name: string; nextAt: number | null; progress: number } {
  const t = Number.isFinite(total) ? Math.max(0, total) : 0;
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) if (t >= LEVEL_THRESHOLDS[i]) level = i + 1;
  const name = LEVEL_NAMES[level - 1];
  if (level >= MAX_LEVEL) return { level, name, nextAt: null, progress: 1 };
  const from = LEVEL_THRESHOLDS[level - 1];
  const nextAt = LEVEL_THRESHOLDS[level];
  return { level, name, nextAt, progress: (t - from) / (nextAt - from) };
}

/** floor(min(elapsed, planned) / 5). The 1-min Quick look always gives 0. */
export function outingBond(plannedMin: number, elapsedMin: number): number {
  if (!Number.isFinite(plannedMin) || !Number.isFinite(elapsedMin) || plannedMin <= 1) return 0;
  return Math.floor(Math.max(0, Math.min(elapsedMin, plannedMin)) / OUTING_MIN_PER_BP);
}

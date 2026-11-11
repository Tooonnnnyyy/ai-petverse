// Sessions and visit days (spec §3 Terms). Pure.
import type { SaveV2 } from "../shared/types";
import { SESSION_HIDDEN_MS } from "./config";
import { localDayKey } from "./time";

export type SessionInfo = { sessionId: string; startedAt: number; isNewVisitDay: boolean; visitIndex: number };
type Visits = SaveV2["visits"];

/** Counts the local day of `now` as a visit day once. */
export function countVisitDay(visits: Visits, now: number): { visits: Visits; isNewVisitDay: boolean } {
  const day = localDayKey(now);
  if (visits.lastDay === day) return { visits, isNewVisitDay: false };
  return { visits: { days: visits.days + 1, lastDay: day }, isNewVisitDay: true };
}

/**
 * New session on load (prev null) or after ≥ 30 min hidden; otherwise the same session.
 * A resumed session that crossed midnight still counts the new day as a visit day.
 */
export function startOrResumeSession(
  prev: SessionInfo | null,
  now: number,
  hiddenMs: number,
  visits: Visits,
): { session: SessionInfo; isNew: boolean; visits: Visits } {
  const counted = countVisitDay(visits, now);
  if (prev && hiddenMs < SESSION_HIDDEN_MS) {
    return { session: prev, isNew: false, visits: counted.visits };
  }
  const session: SessionInfo = {
    sessionId: `s-${now.toString(36)}-${counted.visits.days}`,
    startedAt: now,
    isNewVisitDay: counted.isNewVisitDay,
    visitIndex: counted.visits.days,
  };
  return { session, isNew: true, visits: counted.visits };
}

import { describe, expect, it } from "vitest";
import { startOrResumeSession } from "./session";

const MIN = 60_000;
const T0 = new Date(2026, 10, 11, 9, 0).getTime();
const NEXT_DAY = new Date(2026, 10, 12, 9, 0).getTime();

describe("session", () => {
  it("starts on load and counts the visit day once", () => {
    const a = startOrResumeSession(null, T0, 0, { days: 0, lastDay: "" });
    expect(a.isNew).toBe(true);
    expect(a.visits).toEqual({ days: 1, lastDay: "2026-11-11" });
    expect(a.session).toMatchObject({ startedAt: T0, isNewVisitDay: true, visitIndex: 1 });
    const b = startOrResumeSession(null, T0 + 120 * MIN, 0, a.visits); // reload later the same day
    expect(b.isNew).toBe(true);
    expect(b.visits.days).toBe(1);
    expect(b.session.isNewVisitDay).toBe(false);
  });

  it("new after ≥ 30 min hidden, not after 29", () => {
    const a = startOrResumeSession(null, T0, 0, { days: 0, lastDay: "" });
    const b = startOrResumeSession(a.session, T0 + 29 * MIN, 29 * MIN, a.visits);
    expect(b.isNew).toBe(false);
    expect(b.session).toBe(a.session);
    const c = startOrResumeSession(a.session, T0 + 30 * MIN, 30 * MIN, a.visits);
    expect(c.isNew).toBe(true);
    expect(c.session.sessionId).not.toBe(a.session.sessionId);
  });

  it("a new local day increments visits.days once", () => {
    const a = startOrResumeSession(null, T0, 0, { days: 3, lastDay: "2026-11-10" });
    expect(a.visits.days).toBe(4);
    const b = startOrResumeSession(null, NEXT_DAY, 0, a.visits);
    const c = startOrResumeSession(b.session, NEXT_DAY + 40 * MIN, 40 * MIN, b.visits);
    expect(c.visits).toEqual({ days: 5, lastDay: "2026-11-12" });
  });
});

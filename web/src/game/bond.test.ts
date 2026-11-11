import { describe, expect, it } from "vitest";
import { DAILY_TOTAL_CAP, ECONOMY, LEVEL_NAMES } from "./config";
import { LEVEL_THRESHOLDS, awardBond, emptyLedger, isResting, levelFor, outingBond } from "./bond";
import type { BondLedger, BondSource } from "../shared/types";

const DAY = "2026-11-11";

function run(l: BondLedger, steps: Array<[BondSource, number]>, day = DAY) {
  let ledger = l;
  const ups: number[] = [];
  for (const [src, amt] of steps) {
    const r = awardBond(ledger, src, amt, day);
    ledger = r.ledger;
    if (r.levelUp !== null) ups.push(r.levelUp);
  }
  return { ledger, ups };
}

describe("bond", () => {
  it("thresholds are L² − 1", () => {
    expect([...LEVEL_THRESHOLDS]).toEqual([0, 3, 8, 15, 24, 35, 48, 63, 80, 99]);
    LEVEL_THRESHOLDS.forEach((t, i) => expect(t).toBe((i + 1) ** 2 - 1));
    expect(LEVEL_NAMES).toHaveLength(10);
  });

  it("enforces each per-source cap", () => {
    for (const src of ["pet", "feed", "play", "talk", "care"] as BondSource[]) {
      const steps = Array.from({ length: 10 }, () => [src, ECONOMY[src].bp] as [BondSource, number]);
      expect(run(emptyLedger(), steps).ledger.today[src]).toBe(ECONOMY[src].cap);
    }
    expect(run(emptyLedger(), [["outing", 9], ["outing", 9]]).ledger.today.outing).toBe(9);
  });

  it("enforces the 20 total per visit", () => {
    const { ledger } = run(emptyLedger(), [
      ["pet", 1], ["pet", 1], ["feed", 1], ["play", 1], ["talk", 1],
      ["care", 4], ["care", 4], ["outing", 9],
    ]);
    expect(ledger.todayTotal).toBe(DAILY_TOTAL_CAP);
    expect(ledger.total).toBe(20);
    expect(isResting(ledger, DAY)).toBe(true);
    expect(awardBond(ledger, "pet", 1, DAY).granted).toBe(0);
  });

  it("resets caps on a new day and never lowers total", () => {
    const a = run(emptyLedger(), [["feed", 1], ["feed", 1]]).ledger;
    expect(a.total).toBe(1);
    const b = awardBond(a, "feed", 1, "2026-11-12");
    expect(b.granted).toBe(1);
    expect(b.ledger.total).toBe(2);
    expect(b.ledger.todayTotal).toBe(1);
    for (const amt of [-5, NaN, Infinity, 0]) expect(awardBond(b.ledger, "pet", amt, "2026-11-12").ledger.total).toBe(2);
  });

  it("first session: Feed, Play and Hi reach L2 on the third action", () => {
    const { ledger, ups } = run(emptyLedger(), [["feed", 1], ["play", 1], ["talk", 1]]);
    expect(ledger.total).toBe(3);
    expect(levelFor(ledger.total).level).toBe(2);
    expect(ups).toEqual([2]);
  });

  it("first session: 5 tap BP plus a 15-min outing reaches L3", () => {
    const { ledger, ups } = run(emptyLedger(), [
      ["feed", 1], ["play", 1], ["talk", 1], ["pet", 1], ["pet", 1], ["pet", 1], ["outing", outingBond(15, 15)],
    ]);
    expect(ledger.total).toBe(8);
    expect(ups).toEqual([2, 3]);
  });

  it("levelFor reports name, next threshold and progress", () => {
    expect(levelFor(0)).toEqual({ level: 1, name: "New friend", nextAt: 3, progress: 0 });
    expect(levelFor(5).level).toBe(2);
    expect(levelFor(5).progress).toBeCloseTo(0.4);
    expect(levelFor(99)).toEqual({ level: 10, name: "Old friends", nextAt: null, progress: 1 });
    expect(levelFor(500).level).toBe(10);
  });

  it("outingBond = floor(min(elapsed, planned) / 5)", () => {
    expect(outingBond(5, 5)).toBe(1);
    expect(outingBond(15, 15)).toBe(3);
    expect(outingBond(25, 25)).toBe(5);
    expect(outingBond(45, 45)).toBe(9);
    expect(outingBond(25, 12)).toBe(2);
    expect(outingBond(25, 2)).toBe(0);
    expect(outingBond(15, 60)).toBe(3);
    expect(outingBond(1, 1)).toBe(0);
  });
});

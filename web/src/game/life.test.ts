import { describe, expect, it } from "vitest";
import { addLifeSignal, completeCourse, discoverySnapshot, enrollCourse, newLife, rareChance, purchaseItem, LIFE_RULES } from "./life";
import { newSave } from "../storage/save";

const DAY = new Date("2026-11-12T12:00:00Z").getTime();

describe("life economy", () => {
  it("caps active signals per local day and does not reward idle catch-up", () => {
    let l = newLife();
    for (let i = 0; i < LIFE_RULES.dailyCaps.activeMinute + 2; i += 1) l = addLifeSignal(l, "activeMinute", DAY);
    expect(l.signals.activeMinute).toBe(LIFE_RULES.dailyCaps.activeMinute);
    expect(l.coins).toBe(30 + LIFE_RULES.dailyCaps.activeMinute);
  });

  it("increases rare chance from real progress and applies pity", () => {
    const base = rareChance(discoverySnapshot(newLife()));
    let l = newLife();
    for (let i = 0; i < 8; i += 1) l = addLifeSignal(l, "outing", DAY + i * 1000);
    expect(rareChance(discoverySnapshot(l))).toBeGreaterThan(base);
    expect(rareChance({ ...discoverySnapshot(l), rareMisses: 8 })).toBe(1);
  });

  it("keeps purchase and course completion idempotent", () => {
    let s = { ...newSave(4), life: { ...newLife(), coins: 100 }, bond: { ...newSave(4).bond, total: 10 } };
    s = purchaseItem(s, "bandana");
    expect(purchaseItem(s, "bandana")).toBe(s);
    s = enrollCourse(s, "gardenClub", DAY, true);
    expect(s.life.activeCourse?.id).toBe("gardenClub");
    const finished = completeCourse(s, DAY + 60_001);
    expect(finished.life.completedCourses).toEqual(["gardenClub"]);
    expect(completeCourse(finished, DAY + 60_002)).toBe(finished);
  });
});

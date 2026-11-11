import { describe, expect, it } from "vitest";
import { deriveSeed, mulberry32, seededShuffle } from "./rng";
import { isNight, localDayKey, partOfDay } from "./time";

describe("rng", () => {
  it("is reproducible for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it("weighted picks follow weights over 10,000 draws", () => {
    const rng = mulberry32(7);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 10000; i += 1) counts[rng.weighted([["a", 3], ["b", 1]] as const)] += 1;
    expect(counts.a / 10000).toBeGreaterThan(0.72);
    expect(counts.a / 10000).toBeLessThan(0.78);
  });

  it("int stays inside bounds", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i += 1) {
      const n = rng.int(2, 4);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
    }
  });

  it("shuffle keeps every item and is seed-stable", () => {
    const xs = ["a", "b", "c", "d", "e"];
    expect(seededShuffle(xs, 9).sort()).toEqual(xs);
    expect(seededShuffle(xs, 9)).toEqual(seededShuffle(xs, 9));
    expect(deriveSeed(1, "souvenirs")).not.toBe(deriveSeed(1, "stories"));
  });
});

describe("time", () => {
  it("maps hours to parts of day", () => {
    const at = (h: number) => new Date(2026, 10, 10, h, 30).getTime();
    expect(partOfDay(at(6))).toBe("morning");
    expect(partOfDay(at(12))).toBe("afternoon");
    expect(partOfDay(at(18))).toBe("evening");
    expect(partOfDay(at(23))).toBe("night");
    expect(partOfDay(at(3))).toBe("night");
    expect(isNight(at(23))).toBe(true);
    expect(isNight(at(7))).toBe(false);
    expect(localDayKey(at(12))).toBe("2026-11-10");
  });
});

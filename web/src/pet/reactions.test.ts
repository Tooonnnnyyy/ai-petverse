import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import type { ComfortStyle, EffectiveProfile } from "../shared/types";
import { hideChance, landingReaction, overPetThreshold, petReaction } from "./reactions";
import { PET_TIMING } from "./timing";

const prof = (comfortStyle: ComfortStyle, extra: Partial<EffectiveProfile> = {}): EffectiveProfile => ({
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle,
  trigger: "none",
  startleHide: false,
  coat: "ginger",
  sources: { energy: "fact", comfortStyle: "fact", trigger: "fact", startleHide: "default" },
  ...extra,
});

describe("petReaction", () => {
  it.each(["nearby", "close", "space"] as const)("matches the %s odds within 3%%", (style) => {
    const rng = mulberry32(42);
    const n = 10_000;
    const counts = { purr: 0, lean: 0, earFlick: 0, slowBlink: 0 };
    let delayed = 0;
    for (let k = 0; k < n; k += 1) {
      const r = petReaction(prof(style), [1000], 1000, false, rng);
      counts[r.reaction] += 1;
      if (r.delayMs > 0) {
        delayed += 1;
        expect(r.delayMs).toBeGreaterThanOrEqual(300);
        expect(r.delayMs).toBeLessThanOrEqual(900);
      }
    }
    const o = PET_TIMING.petOdds[style];
    expect(Math.abs(counts.purr / n - o.purr)).toBeLessThan(0.03);
    expect(Math.abs(counts.lean / n - o.lean)).toBeLessThan(0.03);
    expect(Math.abs(counts.earFlick / n - o.earFlick)).toBeLessThan(0.03);
    expect(Math.abs(delayed / n - 0.15)).toBeLessThan(0.03);
  });

  it("over-petting thresholds and mapping by comfort style", () => {
    const rng = mulberry32(1);
    const three = [1000, 2000, 3000];
    const four = [1000, 2000, 3000, 4000];
    expect(overPetThreshold(prof("nearby"))).toBe(4);
    expect(overPetThreshold(prof("nearby", { trigger: "too_much_energy" }))).toBe(3);
    expect(overPetThreshold(prof("space", { sources: { energy: "fact", comfortStyle: "correction", trigger: "fact", startleHide: "default" } }))).toBe(3);
    expect(petReaction(prof("nearby"), three, 3000, false, rng).overPetting).toBeNull();
    expect(petReaction(prof("space"), four, 4000, false, rng).overPetting).toBe("hide");
    expect(petReaction(prof("nearby"), four, 4000, false, rng).overPetting).toBe("walkAway");
    const close = petReaction(prof("close"), four, 4000, false, rng);
    expect(close.overPetting).toBe("slowBlink");
    expect(close.reaction).toBe("slowBlink");
    expect(petReaction(prof("close", { startleHide: true }), four, 4000, false, rng).overPetting).toBe("hide");
    expect(petReaction(prof("nearby", { trigger: "too_much_energy" }), three, 3000, false, rng).overPetting).toBe("walkAway");
    // taps older than 8 s do not count
    expect(petReaction(prof("space"), [0, 9000, 9500, 10_000], 10_000, false, rng).overPetting).toBeNull();
    for (const style of ["nearby", "close", "space"] as const) {
      const r = petReaction(prof(style), four, 4000, true, rng);
      expect(r).toMatchObject({ reaction: "earFlick", overPetting: "stay" });
    }
  });
});

describe("landingReaction", () => {
  it("hide chance by style, speed, trigger and correction, capped at .9", () => {
    expect(hideChance(prof("space"), 100)).toBeCloseTo(0.5);
    expect(hideChance(prof("nearby"), 100)).toBeCloseTo(0.15);
    expect(hideChance(prof("close"), 100)).toBe(0);
    expect(hideChance(prof("nearby"), 2000)).toBeCloseTo(0.45);
    expect(hideChance(prof("nearby", { trigger: "sudden_noise" }), 2000)).toBeCloseTo(0.65);
    expect(hideChance(prof("nearby", { trigger: "sudden_noise" }), 100)).toBeCloseTo(0.15);
    expect(hideChance(prof("close", { startleHide: true }), 100)).toBeCloseTo(0.3);
    expect(hideChance(prof("space", { trigger: "sudden_noise", startleHide: true }), 2000)).toBeCloseTo(0.9);
  });

  it("zones win, R9 never hides, and the roll matches the chance", () => {
    const rng = mulberry32(5);
    expect(landingReaction(prof("space"), 3000, "bed", false, rng)).toEqual({ action: "zone", startle: false });
    for (let k = 0; k < 200; k += 1) expect(landingReaction(prof("space"), 3000, null, true, rng).action).toBe("land");
    let hides = 0;
    for (let k = 0; k < 10_000; k += 1) if (landingReaction(prof("space"), 100, null, false, rng).action === "hide") hides += 1;
    expect(Math.abs(hides / 10_000 - 0.5)).toBeLessThan(0.03);
    expect(landingReaction(prof("close"), 2000, null, false, rng).startle).toBe(true);
  });
});

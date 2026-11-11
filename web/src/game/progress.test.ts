import { describe, expect, it } from "vitest";
import { newSave } from "../storage/save";
import { awardTo, levelCardId, levelOfCard, markLevelSeen, startupCards, unlocksForCard } from "./progress";

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();

describe("progress", () => {
  it("feed + play + hi reach L2 with the cushion unlock", () => {
    let s = newSave(7);
    let levelUp: number | null = null;
    for (const src of ["feed", "play", "talk"] as const) {
      const r = awardTo(s, src, undefined, NOW);
      expect(r.granted).toBe(1);
      s = r.save;
      levelUp = r.levelUp ?? levelUp;
    }
    expect(s.bond.total).toBe(3);
    expect(levelUp).toBe(2);
    expect(unlocksForCard(s, 2)).toEqual(["cushion"]);
  });

  it("caps hold: a second feed the same day grants 0", () => {
    const a = awardTo(newSave(1), "feed", undefined, NOW);
    const b = awardTo(a.save, "feed", undefined, NOW);
    expect(b.granted).toBe(0);
    expect(b.save.bond.total).toBe(1);
  });

  it("dismissing a levelUp card marks its unlocks seen; startup cards rebuild otherwise", () => {
    let s = newSave(1);
    s = { ...s, bond: { ...s.bond, total: 9 }, flags: { ...s.flags, welcomeSeen: true } };
    expect(startupCards(s, NOW).map((c) => c.id)).toEqual([levelCardId(3)]);
    s = markLevelSeen(s, 3);
    expect(s.unlocksSeen).toEqual(["cushion", "market"]);
    expect(startupCards(s, NOW)).toEqual([]);
  });

  it("startup cards include a waiting gift and the welcome card", () => {
    const s = { ...newSave(1), pendingGift: { kind: "postcard" as const, place: "garden" as const, storyId: "garden.1", hint: null } };
    expect(startupCards(s, NOW).map((c) => c.kind)).toEqual(["gift", "welcome"]);
    expect(levelOfCard("levelUp-4")).toBe(4);
    expect(levelOfCard("welcome")).toBeNull();
  });
});

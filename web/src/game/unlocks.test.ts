import { describe, expect, it } from "vitest";
import { SHIPPED_UNLOCKS, UNLOCKS, pendingUnlocks, unlockedSet } from "./unlocks";

describe("unlocks", () => {
  it("returns reached-but-unseen P0 ids only", () => {
    expect(pendingUnlocks(1, [])).toEqual([]);
    expect(pendingUnlocks(2, [])).toEqual(["cushion"]);
    expect(pendingUnlocks(5, ["cushion"])).toEqual(["market", "windowSeat", "hills"]);
    expect(pendingUnlocks(10, ["cushion", "market", "windowSeat", "hills"])).toEqual([]);
  });

  it("a P1 unlock below the current level appears once after P1 ships", () => {
    const seen = ["cushion", "market", "windowSeat", "hills"] as const;
    const p1 = pendingUnlocks(7, seen, UNLOCKS);
    expect(p1).toEqual(["talkSet2", "scarf", "lamp", "bow"]);
    expect(pendingUnlocks(7, [...seen, ...p1], UNLOCKS)).toEqual([]);
  });

  it("unlockedSet lists shipped unlocks at or below the level", () => {
    expect([...unlockedSet(4)].sort()).toEqual(["cushion", "market", "windowSeat"]);
    expect(SHIPPED_UNLOCKS.every((u) => u.phase === "P0")).toBe(true);
  });
});

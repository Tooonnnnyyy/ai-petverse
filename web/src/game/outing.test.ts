import { describe, expect, it } from "vitest";
import type { OutingMinutes, PlaceId, SaveV2 } from "../shared/types";
import { newSave } from "../storage/save";
import { PLACES, SOUVENIR_IDS } from "./catalog";
import { everydayOrder } from "./album";
import { clearGift, recallOuting, resolveOnLoad, resolveReturn, rewardFor, startOuting } from "./outing";

const MIN = 60_000;
const T0 = new Date(2026, 10, 11, 10, 0).getTime();
const SEED = 77;

function trip(s: SaveV2, place: PlaceId, planned: OutingMinutes, at: number, recallAfterMin?: number) {
  let o = startOuting(place, planned, at, `o-${at}`);
  if (recallAfterMin !== undefined) o = recallOuting(o, at + recallAfterMin * MIN);
  const r = resolveReturn({ ...s, outing: o }, at + planned * MIN + 1);
  return { ...r, save: clearGift(r.save) };
}

describe("outing", () => {
  it("resolveOnLoad: null, before end, after end, clock moved back", () => {
    const o = startOuting("garden", 15, T0, "o1");
    expect(o.endsAt).toBe(T0 + 15 * MIN);
    expect(resolveOnLoad(null, T0)).toBe("none");
    expect(resolveOnLoad(o, T0 + 5 * MIN)).toBe("away");
    expect(resolveOnLoad(o, T0 + 15 * MIN)).toBe("returnNow");
    expect(resolveOnLoad(o, T0 - MIN)).toBe("returnNow");
    expect(resolveOnLoad(recallOuting(o, T0 + MIN), T0 + 2 * MIN)).toBe("returnNow");
  });

  it("clock moved back resolves as a 0-minute recall (postcard, 0 BP)", () => {
    const s = { ...newSave(SEED), outing: startOuting("garden", 25, T0, "o1") };
    const r = resolveReturn(s, T0 - 10 * MIN);
    expect(r.reward?.kind).toBe("postcard");
    expect(r.bondGranted).toBe(0);
    expect(r.save.outing?.recalledAt).toBe(T0);
  });

  it("clamps elapsed to planned and paces rewards", () => {
    const o = startOuting("garden", 15, T0, "o1");
    const album = newSave(SEED).album;
    expect(rewardFor(o, T0 + 10 * MIN, album, SEED).kind).toBe("postcard");
    const r = rewardFor(o, T0 + 600 * MIN, album, SEED);
    expect(r).toMatchObject({ kind: "souvenir", id: everydayOrder("garden", SEED)[0], storyId: "garden.1" });
    expect(rewardFor(startOuting("garden", 1, T0, "q"), T0 + MIN, album, SEED).kind).toBe("postcard");
  });

  it("hints at a longer trip when only the keepsake is left", () => {
    const s = newSave(SEED);
    const album = { ...s.album, souvenirs: [...PLACES.hills.everyday] };
    const o = startOuting("hills", 15, T0, "o1");
    expect(rewardFor(o, o.endsAt, album, SEED)).toMatchObject({ kind: "postcard", hint: "longerTrip" });
    const long = startOuting("hills", 25, T0, "o2");
    expect(rewardFor(long, long.endsAt, album, SEED)).toMatchObject({ kind: "souvenir", id: "cometShard" });
  });

  it("resolveReturn credits Bond and album once", () => {
    const s = { ...newSave(SEED), outing: startOuting("riverside", 25, T0, "o1") };
    const first = resolveReturn(s, T0 + 26 * MIN);
    expect(first.bondGranted).toBe(5);
    expect(first.save.bond.total).toBe(5);
    expect(first.save.album.souvenirs).toHaveLength(1);
    expect(first.save.outing?.creditedAt).toBe(T0 + 26 * MIN);
    const again = resolveReturn(first.save, T0 + 27 * MIN);
    expect(again.bondGranted).toBe(0);
    expect(again.save).toBe(first.save);
    expect(again.reward).toEqual(first.reward);
    const cleared = clearGift(first.save);
    expect(cleared.outing).toBeNull();
    expect(cleared.pendingGift).toBeNull();
    expect(resolveReturn(cleared, T0 + 28 * MIN).bondGranted).toBe(0);
  });

  it("a recall at 12 min pays 2 BP and a postcard", () => {
    const r = trip(newSave(SEED), "garden", 25, T0, 12);
    expect(r.bondGranted).toBe(2);
    expect(r.reward?.kind).toBe("postcard");
  });

  it("no duplicates across 100 outings and all 24 owned in bounded outings", () => {
    let s = { ...newSave(SEED), bond: { ...newSave(SEED).bond, total: 99 } };
    const places: PlaceId[] = ["garden", "riverside", "market", "hills"];
    const got: string[] = [];
    let at = T0;
    let completeAfter = -1;
    for (let i = 0; i < 100; i += 1) {
      const r = trip(s, places[i % 4], 45, at);
      s = r.save;
      if (r.reward?.kind === "souvenir") got.push(r.reward.id);
      if (completeAfter < 0 && s.album.souvenirs.length === 24) completeAfter = i + 1;
      at += 60 * MIN;
    }
    expect(new Set(got).size).toBe(got.length);
    expect([...s.album.souvenirs].sort()).toEqual([...SOUVENIR_IDS].sort());
    expect(completeAfter).toBe(24);
    expect(s.album.outingsCompleted).toBe(100);
  });
});

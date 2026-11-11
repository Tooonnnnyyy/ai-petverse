import { describe, expect, it } from "vitest";
import { PLACES, PLACE_IDS, SOUVENIR_IDS, STORY_IDS, SNACKS } from "./catalog";
import { addReward, albumCounts, emptyAlbum, everydayOrder, nextSouvenir } from "./album";
import { catalogCopy } from "../copy/en/catalog";

describe("catalog", () => {
  it("has 24 souvenirs and 16 stories with copy for each", () => {
    expect(SOUVENIR_IDS).toHaveLength(24);
    expect(new Set(SOUVENIR_IDS).size).toBe(24);
    expect(STORY_IDS).toHaveLength(16);
    for (const id of SOUVENIR_IDS) expect(catalogCopy.souvenirs[id as keyof typeof catalogCopy.souvenirs]).toBeTruthy();
    for (const id of STORY_IDS) expect(catalogCopy.stories[id as keyof typeof catalogCopy.stories]).toBeTruthy();
    expect(SNACKS.cat).toEqual(["crunchy", "soft", "fishy"]);
    expect(SNACKS.dog).toEqual(["crunchy", "soft", "chewy"]);
    expect(PLACE_IDS.map((p) => PLACES[p].unlockLevel)).toEqual([1, 1, 3, 5]);
  });

  it("copy avoids the banned phrases and the old collectable nouns", () => {
    const text = JSON.stringify(catalogCopy);
    expect(text).not.toMatch(
      /misses you|miss you|lonely|sad because|hungry|starving|streak|don't forget|come back soon|waiting for you|last chance|hurry up|don't leave|you seem|you feel|you look|because of you|cure|therapy/i,
    );
    expect(text).not.toMatch(/bottle cap|pinecone|pine cone/i);
  });
});

describe("album", () => {
  const seed = 1234;

  it("everyday order is a stable seeded permutation", () => {
    const a = everydayOrder("garden", seed);
    expect(a).toEqual(everydayOrder("garden", seed));
    expect([...a].sort()).toEqual([...PLACES.garden.everyday].sort());
  });

  it("nextSouvenir: postcard below 15 min, seeded order, keepsake needs 25 min", () => {
    const order = everydayOrder("riverside", seed);
    expect(nextSouvenir("riverside", new Set(), seed, 14.9)).toBeNull();
    expect(nextSouvenir("riverside", new Set(), seed, 15)).toBe(order[0]);
    expect(nextSouvenir("riverside", new Set(order.slice(0, 2)), seed, 15)).toBe(order[2]);
    const all = new Set(order);
    expect(nextSouvenir("riverside", all, seed, 24)).toBeNull();
    expect(nextSouvenir("riverside", all, seed, 25)).toBe("moonstone");
    expect(nextSouvenir("riverside", new Set([...order, "moonstone"]), seed, 45)).toBeNull();
  });

  it("addReward is idempotent", () => {
    const r = { kind: "souvenir" as const, id: everydayOrder("garden", seed)[0], storyId: "garden.1", isNew: true as const };
    const once = addReward(emptyAlbum(), r);
    expect(addReward(once, r)).toEqual(once);
    expect(once.souvenirs).toEqual([r.id]);
    expect(once.storyCursor.garden).toBe(1);
    expect(once.outingsCompleted).toBe(1);
    const p = { kind: "postcard" as const, place: "garden" as const, storyId: "garden.2", hint: null };
    const twice = addReward(once, p);
    expect(addReward(twice, p)).toEqual(twice);
    expect(twice.postcards).toEqual(["garden.2"]);
    expect(albumCounts(twice).owned).toBe(1);
  });
});

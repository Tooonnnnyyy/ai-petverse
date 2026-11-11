import { describe, expect, it } from "vitest";
import {
  LEGACY_PROFILE_KEY,
  PHOTO_DB_NAME,
  SAVE_KEY,
  type StorageLike,
  deleteAllMyData,
  loadSave,
  migrateV1,
  newSave,
  parseSave,
  writeSave,
} from "./save";

const NOW = new Date(2026, 10, 11, 9, 0).getTime();

function fakeStorage(init: Record<string, string> = {}, opts: { failWrites?: boolean } = {}) {
  const map = new Map(Object.entries(init));
  const s: StorageLike & { map: Map<string, string> } = {
    map,
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (opts.failWrites) throw new Error("QuotaExceededError");
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
  return s;
}

function fakeIdb() {
  const deleted: string[] = [];
  return {
    deleted,
    deleteDatabase(name: string) {
      deleted.push(name);
      const req = {} as IDBOpenDBRequest;
      queueMicrotask(() => req.onsuccess?.call(req, new Event("success")));
      return req;
    },
  };
}

const MISO_V1 = {
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "close",
  trigger: "sudden noise",
  favouriteActivity: "window watching",
  correction: "hides when startled",
  published: false,
};

describe("parseSave", () => {
  it("never throws on corrupt input and falls back to a fresh save", () => {
    for (const raw of [undefined, null, "", "{", "null", "[]", 42, "\"text\"", { v: 9 }]) {
      const s = parseSave(raw, 7);
      expect(s).toEqual(newSave(7));
    }
  });

  it("falls back field by field and keeps the valid ones", () => {
    const raw = JSON.stringify({
      v: 2,
      installSeed: 99,
      profile: { name: "Biscuit", species: "dog", energy: "zoomies", coat: "tan" },
      bond: { total: 12, day: "2026-11-10", today: { pet: 2, feed: -1, bogus: 4 }, todayTotal: "x" },
      album: { souvenirs: ["moonstone", "moonstone", "bottleCap"], postcards: ["garden.1", "nope"], storyCursor: { garden: 2, hills: -3 } },
      outing: { id: "o1", place: "moon", plannedMin: 15, startedAt: NOW },
      pendingGift: { kind: "souvenir", id: "moonstone", storyId: "riverside.1", isNew: true },
      unlocksSeen: ["cushion", "cushion", "jetpack"],
      settings: { calmMotion: "sometimes", paused: true },
      visits: { days: 3, lastDay: "2026-11-10" },
      flags: "broken",
    });
    const s = parseSave(raw, 1);
    expect(s.installSeed).toBe(99);
    expect(s.profile).toMatchObject({ name: "Biscuit", species: "dog", energy: null, coat: "tan" });
    expect(s.bond).toEqual({ total: 12, day: "2026-11-10", today: { pet: 2 }, todayTotal: 0 });
    expect(s.album.souvenirs).toEqual(["moonstone"]);
    expect(s.album.postcards).toEqual(["garden.1"]);
    expect(s.album.storyCursor).toEqual({ garden: 2, riverside: 0, market: 0, hills: 0 });
    expect(s.outing).toBeNull();
    expect(s.pendingGift).toMatchObject({ kind: "souvenir", id: "moonstone" });
    expect(s.unlocksSeen).toEqual(["cushion"]);
    expect(s.settings).toEqual({ calmMotion: "auto", paused: true, invitations: true, fillGapsDrawn: false });
    expect(s.visits).toEqual({ days: 3, lastDay: "2026-11-10" });
    expect(s.flags).toEqual({ welcomeSeen: false, isDemo: false });
  });

  it("derives endsAt from plannedMin so a tampered save cannot stretch an outing", () => {
    const s = parseSave({ installSeed: 1, outing: { id: "o", place: "garden", plannedMin: 5, startedAt: NOW, endsAt: NOW + 1e9, creditedAt: null } });
    expect(s.outing?.endsAt).toBe(NOW + 5 * 60_000);
  });

  it("round-trips a written save", () => {
    const st = fakeStorage();
    const s = { ...newSave(5), visits: { days: 2, lastDay: "2026-11-11" } };
    expect(writeSave(s, st)).toBe(true);
    expect(loadSave(st, NOW)).toEqual(s);
  });
});

describe("writeSave and loadSave", () => {
  it("returns false when storage is full or missing, and never throws", () => {
    expect(writeSave(newSave(1), fakeStorage({}, { failWrites: true }))).toBe(false);
    expect(writeSave(newSave(1), null)).toBe(false);
  });

  it("the demo pet writes nothing", () => {
    const st = fakeStorage();
    expect(writeSave({ ...newSave(1), flags: { welcomeSeen: true, isDemo: true } }, st)).toBe(true);
    expect(st.map.size).toBe(0);
  });

  it("loads a fresh save when storage throws", () => {
    const broken = { ...fakeStorage(), getItem: () => { throw new Error("SecurityError"); } } as StorageLike;
    expect(loadSave(broken, NOW).profile).toBeNull();
  });
});

describe("migrateV1", () => {
  it("returns null for the untouched Miso defaults and for junk", () => {
    expect(migrateV1(MISO_V1, NOW)).toBeNull();
    expect(migrateV1(JSON.stringify(MISO_V1), NOW)).toBeNull();
    expect(migrateV1({}, NOW)).toBeNull(); // the old sanitizer filled every field with the defaults
    expect(migrateV1("{bad", NOW)).toBeNull();
    expect(migrateV1(null, NOW)).toBeNull();
  });

  it("migrates a real profile, mapping the trigger and keeping the correction as a note", () => {
    const m = migrateV1({ ...MISO_V1, name: "Pepper", species: "dog", trigger: "strangers", correction: "loves the sofa" }, NOW);
    expect(m?.profile).toEqual({
      name: "Pepper",
      species: "dog",
      energy: "steady",
      comfortStyle: "close",
      trigger: "strangers",
      favouriteActivity: "window watching",
      coat: null,
    });
    expect(m?.corrections).toEqual([{ id: "v1-note", at: "2026-11-11", field: "note", value: "loves the sofa" }]);
  });

  it("'not sure yet' becomes no trigger and no note", () => {
    const m = migrateV1({ ...MISO_V1, name: "Tofu", trigger: "not sure yet", correction: "" }, NOW);
    expect(m?.profile?.trigger).toBeNull();
    expect(m?.corrections).toEqual([]);
  });

  it("loadSave uses the legacy profile only when no v2 save exists", () => {
    const legacy = JSON.stringify({ ...MISO_V1, name: "Pepper" });
    expect(loadSave(fakeStorage({ [LEGACY_PROFILE_KEY]: legacy }), NOW).profile?.name).toBe("Pepper");
    expect(loadSave(fakeStorage({ [LEGACY_PROFILE_KEY]: JSON.stringify(MISO_V1) }), NOW).profile).toBeNull();
    const v2 = JSON.stringify({ ...newSave(3), profile: { name: "Bean", species: "cat" } });
    expect(loadSave(fakeStorage({ [SAVE_KEY]: v2, [LEGACY_PROFILE_KEY]: legacy }), NOW).profile?.name).toBe("Bean");
  });
});

describe("deleteAllMyData", () => {
  it("removes petverse.* keys, the legacy key and the photo db, and keeps foreign keys", async () => {
    const st = fakeStorage({
      [SAVE_KEY]: "{}",
      "petverse.events.v1": "[]",
      [LEGACY_PROFILE_KEY]: "{}",
      "other-app.token": "keep",
      "petversefoo": "keep", // no dot: not ours
      "ai-petverse.other": "keep",
    });
    const idb = fakeIdb();
    await deleteAllMyData({ storage: st, idb });
    expect([...st.map.keys()].sort()).toEqual(["ai-petverse.other", "other-app.token", "petversefoo"]);
    expect(idb.deleted).toEqual([PHOTO_DB_NAME]);
  });

  it("resolves even when storage and IndexedDB are unavailable", async () => {
    await expect(deleteAllMyData({ storage: null, idb: null })).resolves.toBeUndefined();
  });
});

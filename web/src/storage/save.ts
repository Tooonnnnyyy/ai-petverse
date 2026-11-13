// SaveV2: one JSON blob in localStorage, parsed field by field (spec §10.1, §7.6).
// Storage is namespaced (petverse.*) because the github.io origin is shared.
import type {
  AlbumState,
  BondLedger,
  BondSource,
  CareMomentId,
  CoatId,
  CourseId,
  ComfortStyle,
  Correction,
  Energy,
  Outing,
  OutingMinutes,
  OutingReward,
  PetProfile,
  PlaceId,
  SaveV2,
  Settings,
  Species,
  Trigger,
  UnlockId,
} from "../shared/types";
import { POSTCARD_LOG_MAX } from "../game/config";
import { PLACE_IDS, SOUVENIR_IDS, STORY_IDS, placeOfStory } from "../game/catalog";
import { UNLOCKS } from "../game/unlocks";
import { emptyLedger } from "../game/bond";
import { emptyAlbum } from "../game/album";
import { newInstallSeed } from "../game/rng";

export const SAVE_KEY = "petverse.save.v2";
export const EVENTS_KEY = "petverse.events.v1";
export const LEGACY_PROFILE_KEY = "ai-petverse.preview.profile";
export const PHOTO_DB_NAME = "petverse-photos";
const KEY_PREFIX = "petverse.";

/** The subset of Storage we use, so tests can pass a fake. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // the accessor itself throws when storage is blocked
  }
}

export function newSave(installSeed: number): SaveV2 {
  return {
    v: 2,
    installSeed: installSeed >>> 0,
    profile: null,
    photo: null,
    life: {
      signals: { interaction: 0, activeMinute: 0, outing: 0, course: 0 },
      daily: { day: "", counts: { interaction: 0, activeMinute: 0, outing: 0, course: 0 } },
      coins: 30, purchases: [], equipped: null, completedCourses: [], activeCourse: null, rareMisses: 0, memories: [],
    },
    corrections: [],
    bond: emptyLedger(),
    album: emptyAlbum(),
    outing: null,
    pendingGift: null,
    invites: { lastShown: [], notNowStreak: 0, skipSessions: 0 },
    unlocksSeen: [],
    feedback: { likenessAskedAtVisit: null, usefulnessLastDay: null },
    settings: { calmMotion: "auto", paused: false, invitations: true, fillGapsDrawn: false },
    visits: { days: 0, lastDay: "" },
    flags: { welcomeSeen: false, isDemo: false },
  };
}

// ---- field validators ----
type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const oneOf = <T extends string>(x: unknown, allowed: readonly T[]): T | null =>
  typeof x === "string" && (allowed as readonly string[]).includes(x) ? (x as T) : null;
const count = (x: unknown, fallback = 0): number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : fallback;
const time = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? x : null);
const str = (x: unknown, max: number, fallback = ""): string => (typeof x === "string" ? x.slice(0, max) : fallback);
const bool = (x: unknown, fallback: boolean): boolean => (typeof x === "boolean" ? x : fallback);
const uniq = <T>(xs: T[]): T[] => [...new Set(xs)];

const SPECIES: readonly Species[] = ["cat", "dog"];
const ENERGY: readonly Energy[] = ["low", "steady", "high"];
const COMFORT: readonly ComfortStyle[] = ["close", "nearby", "space"];
const TRIGGERS: readonly Trigger[] = ["sudden_noise", "strangers", "too_much_energy", "none"];
const COATS: readonly CoatId[] = ["ginger", "grey", "tan", "blackTan"];
const CARE: readonly CareMomentId[] = ["water", "breaths", "stretch", "oneThing"];
const MINUTES: readonly OutingMinutes[] = [1, 5, 15, 25, 45];
const SOURCES: readonly BondSource[] = ["pet", "feed", "play", "talk", "care", "outing"];
const UNLOCK_IDS: readonly UnlockId[] = UNLOCKS.map((u) => u.id);
const FIELDS: readonly Correction["field"][] = ["energy", "comfortStyle", "trigger", "startleHide", "note"];

function parseProfile(x: unknown): PetProfile | null {
  if (!isObj(x)) return null;
  const name = str(x.name, 40).trim();
  const species = oneOf(x.species, SPECIES);
  if (!name || !species) return null;
  return {
    name,
    species,
    energy: oneOf(x.energy, ENERGY),
    comfortStyle: oneOf(x.comfortStyle, COMFORT),
    trigger: oneOf(x.trigger, TRIGGERS),
    favouriteActivity: str(x.favouriteActivity, 40),
    coat: oneOf(x.coat, COATS),
    ...(oneOf(x.breed, species === "cat" ? ["orangeCat", "tabbyCat"] as const : ["goldenRetriever", "blackLab"] as const) ? { breed: x.breed as PetProfile["breed"] } : {}),
  };
}

function parseLife(x: unknown): SaveV2["life"] {
  const d = newSave(0).life;
  if (!isObj(x)) return d;
  const signals = isObj(x.signals) ? x.signals : {};
  const daily = isObj(x.daily) ? x.daily : {};
  const dailyCounts = isObj(daily.counts) ? daily.counts : {};
  const purchases = Array.isArray(x.purchases) ? uniq(x.purchases.filter((v): v is SaveV2["life"]["purchases"][number] => typeof v === "string" && ["bandana", "bow", "picnic", "feast"].includes(v)).slice(-20)) : [];
  return {
    signals: {
      interaction: count(signals.interaction), activeMinute: count(signals.activeMinute), outing: count(signals.outing),
      course: count(signals.course),
    },
    daily: { day: str(daily.day, 10), counts: {
      interaction: count(dailyCounts.interaction), activeMinute: count(dailyCounts.activeMinute), outing: count(dailyCounts.outing), course: count(dailyCounts.course),
    } },
    coins: count(x.coins, d.coins),
    purchases,
    equipped: x.equipped === "bandana" || x.equipped === "bow" ? x.equipped : null,
    completedCourses: Array.isArray(x.completedCourses) ? uniq(x.completedCourses.filter((v): v is SaveV2["life"]["completedCourses"][number] => typeof v === "string" && ["gardenClub", "trailSchool", "manners"].includes(v)).slice(-20)) : [],
    activeCourse: isObj(x.activeCourse) && typeof x.activeCourse.id === "string" && ["gardenClub", "trailSchool", "manners"].includes(x.activeCourse.id) ? {
      id: x.activeCourse.id as CourseId,
      startedAt: typeof x.activeCourse.startedAt === "number" ? x.activeCourse.startedAt : 0,
      endsAt: typeof x.activeCourse.endsAt === "number" ? x.activeCourse.endsAt : 0,
    } : null,
    rareMisses: count(x.rareMisses),
    memories: Array.isArray(x.memories) ? x.memories.filter(isObj).slice(-50).map((m) => ({
      id: str(m.id, 64), place: oneOf(m.place, ["garden", "riverside", "market", "hills"] as const) ?? "garden", rarity: oneOf(m.rarity, ["common", "uncommon", "rare"] as const) ?? "common", at: time(m.at) ?? 0, storyId: str(m.storyId, 64), souvenir: typeof m.souvenir === "string" ? m.souvenir.slice(0, 64) : null,
    })) : [],
  };
}

function parseCorrections(x: unknown): Correction[] {
  if (!Array.isArray(x)) return [];
  const out: Correction[] = [];
  for (const c of x) {
    if (!isObj(c)) continue;
    const field = oneOf(c.field, FIELDS);
    if (!field || typeof c.id !== "string" || typeof c.value !== "string") continue;
    out.push({ id: c.id.slice(0, 64), at: str(c.at, 10), field, value: c.value.slice(0, 280) });
  }
  return out.slice(-200);
}

function parseBond(x: unknown): BondLedger {
  if (!isObj(x)) return emptyLedger();
  const today: BondLedger["today"] = {};
  if (isObj(x.today)) for (const s of SOURCES) if (count(x.today[s]) > 0) today[s] = count(x.today[s]);
  return { total: count(x.total), day: str(x.day, 10), today, todayTotal: count(x.todayTotal) };
}

function parseAlbum(x: unknown): AlbumState {
  const a = emptyAlbum();
  if (!isObj(x)) return a;
  const souvenirs = Array.isArray(x.souvenirs) ? uniq(x.souvenirs.filter((s): s is string => SOUVENIR_IDS.includes(s as string))) : [];
  const postcards = Array.isArray(x.postcards)
    ? x.postcards.filter((s): s is string => STORY_IDS.includes(s as string)).slice(-POSTCARD_LOG_MAX)
    : [];
  const moments = Array.isArray(x.moments) ? uniq(x.moments.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 40))) : [];
  const storyCursor = { ...a.storyCursor };
  if (isObj(x.storyCursor)) for (const p of PLACE_IDS) storyCursor[p] = count(x.storyCursor[p]);
  return { souvenirs, postcards, moments, storyCursor, outingsCompleted: count(x.outingsCompleted) };
}

function parseOuting(x: unknown): Outing | null {
  if (!isObj(x)) return null;
  const place = oneOf(x.place, PLACE_IDS);
  const plannedMin = MINUTES.find((m) => m === x.plannedMin) ?? null;
  const startedAt = time(x.startedAt);
  if (!place || plannedMin === null || startedAt === null) return null;
  return {
    id: str(x.id, 64, `o-${startedAt.toString(36)}`) || `o-${startedAt.toString(36)}`,
    place,
    plannedMin,
    startedAt,
    endsAt: startedAt + plannedMin * 60_000, // derived, so a tampered endsAt cannot stretch an outing
    recalledAt: time(x.recalledAt),
    creditedAt: time(x.creditedAt),
    ...(isObj(x.discovery) ? { discovery: {
      score: Math.min(100, count(x.discovery.score)),
      purchaseBoost: typeof x.discovery.purchaseBoost === "number" && Number.isFinite(x.discovery.purchaseBoost) ? Math.min(0.05, Math.max(0, x.discovery.purchaseBoost)) : 0,
      rareMisses: Math.min(8, count(x.discovery.rareMisses)),
    } } : {}),
  };
}

function parseReward(x: unknown): OutingReward | null {
  if (!isObj(x) || typeof x.storyId !== "string" || !STORY_IDS.includes(x.storyId)) return null;
  if (x.kind === "souvenir" && typeof x.id === "string" && SOUVENIR_IDS.includes(x.id)) {
    const rarity = oneOf(x.rarity, ["common", "uncommon", "rare"] as const);
    return { kind: "souvenir", id: x.id, storyId: x.storyId, isNew: true, ...(rarity ? { rarity } : {}) };
  }
  const place = oneOf(x.place, PLACE_IDS) ?? placeOfStory(x.storyId);
  if (x.kind === "postcard" && place) {
    return { kind: "postcard", place, storyId: x.storyId, hint: x.hint === "longerTrip" ? "longerTrip" : null, ...(oneOf(x.rarity, ["common", "uncommon", "rare"] as const) ? { rarity: x.rarity as "common" | "uncommon" | "rare" } : {}) };
  }
  return null;
}

function parseSettings(x: unknown): Settings {
  const d = newSave(0).settings;
  if (!isObj(x)) return d;
  return {
    calmMotion: oneOf(x.calmMotion, ["auto", "on", "off"] as const) ?? d.calmMotion,
    paused: bool(x.paused, d.paused),
    invitations: bool(x.invitations, d.invitations),
    fillGapsDrawn: bool(x.fillGapsDrawn, d.fillGapsDrawn),
  };
}

/**
 * Never throws. Accepts the raw JSON string or an already-parsed value; every invalid
 * field falls back on its own. A missing install seed uses fallbackSeed (or a fresh one).
 */
export function parseSave(raw: unknown, fallbackSeed?: number): SaveV2 {
  let x: unknown = raw;
  if (typeof raw === "string") {
    try {
      x = JSON.parse(raw);
    } catch {
      x = null;
    }
  }
  const seed =
    isObj(x) && typeof x.installSeed === "number" && Number.isInteger(x.installSeed) && x.installSeed >= 0 && x.installSeed <= 0xffffffff
      ? x.installSeed
      : (fallbackSeed ?? newInstallSeed());
  const base = newSave(seed);
  if (!isObj(x)) return base;
  const inv = isObj(x.invites) ? x.invites : {};
  const fb = isObj(x.feedback) ? x.feedback : {};
  const visits = isObj(x.visits) ? x.visits : {};
  const flags = isObj(x.flags) ? x.flags : {};
  return {
    ...base,
    profile: parseProfile(x.profile),
    photo: isObj(x.photo) && x.photo.consent === true ? { consent: true, count: count(x.photo.count), updatedAt: str(x.photo.updatedAt, 30), avatarVersion: count(x.photo.avatarVersion, 1) } : null,
    life: parseLife(x.life),
    corrections: parseCorrections(x.corrections),
    bond: parseBond(x.bond),
    album: parseAlbum(x.album),
    outing: parseOuting(x.outing),
    pendingGift: parseReward(x.pendingGift),
    invites: {
      lastShown: Array.isArray(inv.lastShown) ? inv.lastShown.filter((c): c is CareMomentId => oneOf(c, CARE) !== null).slice(-3) : [],
      notNowStreak: count(inv.notNowStreak),
      skipSessions: count(inv.skipSessions),
    },
    unlocksSeen: Array.isArray(x.unlocksSeen) ? uniq(x.unlocksSeen.filter((u): u is UnlockId => oneOf(u, UNLOCK_IDS) !== null)) : [],
    feedback: {
      likenessAskedAtVisit: typeof fb.likenessAskedAtVisit === "number" && Number.isFinite(fb.likenessAskedAtVisit) ? fb.likenessAskedAtVisit : null,
      usefulnessLastDay: typeof fb.usefulnessLastDay === "string" ? fb.usefulnessLastDay.slice(0, 10) : null,
    },
    settings: parseSettings(x.settings),
    visits: { days: count(visits.days), lastDay: str(visits.lastDay, 10) },
    flags: { welcomeSeen: bool(flags.welcomeSeen, false), isDemo: bool(flags.isDemo, false) },
  };
}

// ---- v1 migration ----
/** The old app pre-filled and auto-saved these, so an unchanged copy is not the user's data. */
const V1_DEFAULTS = {
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "close",
  trigger: "sudden noise",
  favouriteActivity: "window watching",
  correction: "hides when startled",
} as const;

/** The old "not sure yet" option (and similar) means no answer: no trigger and no note. */
const V1_UNSURE = /^(not sure( yet)?|unsure|don.?t know|unknown)$/;

function mapV1Trigger(text: string): Trigger | null {
  const t = text.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (!t || V1_UNSURE.test(t)) return null;
  if (/noise|loud|bang/.test(t)) return "sudden_noise";
  if (/stranger|visitor|guest/.test(t)) return "strangers";
  if (/too much energy|energy|excite/.test(t)) return "too_much_energy";
  if (/^(none|nothing|no|n\/a)$/.test(t)) return "none";
  return null;
}

/** Returns null for a non-object or a profile equal to the old Miso defaults. */
export function migrateV1(legacyProfile: unknown, nowMs: number = Date.now()): Pick<SaveV2, "profile" | "corrections"> | null {
  if (typeof legacyProfile === "string") {
    try {
      legacyProfile = JSON.parse(legacyProfile);
    } catch {
      return null;
    }
  }
  if (!isObj(legacyProfile)) return null;
  // Same fallbacks as the old sanitizeProfile, so missing fields read as the defaults.
  const v1 = {
    name: str(legacyProfile.name, 200, V1_DEFAULTS.name).trim(),
    species: oneOf(legacyProfile.species, SPECIES) ?? V1_DEFAULTS.species,
    energy: oneOf(legacyProfile.energy, ENERGY) ?? V1_DEFAULTS.energy,
    comfortStyle: oneOf(legacyProfile.comfortStyle, COMFORT) ?? V1_DEFAULTS.comfortStyle,
    trigger: str(legacyProfile.trigger, 200, V1_DEFAULTS.trigger).trim(),
    favouriteActivity: str(legacyProfile.favouriteActivity, 200, V1_DEFAULTS.favouriteActivity).trim(),
    correction: str(legacyProfile.correction, 200, V1_DEFAULTS.correction).trim(),
  };
  const same = (Object.keys(V1_DEFAULTS) as (keyof typeof V1_DEFAULTS)[]).every((k) => v1[k] === V1_DEFAULTS[k]);
  if (same || !v1.name) return null;

  const at = new Date(nowMs).toISOString().slice(0, 10);
  const trigger = mapV1Trigger(v1.trigger);
  const corrections: Correction[] = [];
  // Unmappable trigger text is kept as a note rather than dropped.
  if (v1.trigger && trigger === null && !V1_UNSURE.test(v1.trigger.toLowerCase())) corrections.push({ id: "v1-trigger", at, field: "note", value: `Trigger: ${v1.trigger}`.slice(0, 280) });
  if (v1.correction) corrections.push({ id: "v1-note", at, field: "note", value: v1.correction.slice(0, 280) });
  return {
    profile: {
      name: v1.name.slice(0, 40),
      species: v1.species,
      energy: v1.energy,
      comfortStyle: v1.comfortStyle,
      trigger,
      favouriteActivity: v1.favouriteActivity.slice(0, 40),
      coat: null,
    },
    corrections,
  };
}

// ---- storage access ----
/** Reads the v2 save, else migrates the legacy profile, else a fresh save. Never throws. */
export function loadSave(storage: StorageLike | null = defaultStorage(), nowMs: number = Date.now()): SaveV2 {
  let raw: string | null = null;
  let legacy: string | null = null;
  try {
    raw = storage?.getItem(SAVE_KEY) ?? null;
    if (raw === null) legacy = storage?.getItem(LEGACY_PROFILE_KEY) ?? null;
  } catch {
    // blocked storage: fall through to a fresh in-memory save
  }
  if (raw !== null) return parseSave(raw);
  const save = newSave(newInstallSeed());
  const migrated = legacy !== null ? migrateV1(legacy, nowMs) : null;
  return migrated ? { ...save, ...migrated } : save;
}

/** False when storage is blocked or full; the app keeps running. The demo pet writes nothing. */
export function writeSave(s: SaveV2, storage: StorageLike | null = defaultStorage()): boolean {
  if (s.flags.isDemo) return true;
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

type IdbFactoryLike = { deleteDatabase(name: string): IDBOpenDBRequest };

function defaultIdb(): IdbFactoryLike | null {
  try {
    return typeof indexedDB !== "undefined" ? indexedDB : null;
  } catch {
    return null;
  }
}

/** Removes petverse.* keys, the legacy key and the photo database. Never calls clear(). */
export async function deleteAllMyData(
  deps: { storage?: StorageLike | null; idb?: IdbFactoryLike | null } = {},
): Promise<void> {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  const idb = deps.idb === undefined ? defaultIdb() : deps.idb;
  if (storage) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const k = storage.key(i);
        if (k !== null && (k.startsWith(KEY_PREFIX) || k === LEGACY_PROFILE_KEY)) doomed.push(k);
      }
      for (const k of doomed) storage.removeItem(k);
    } catch {
      // storage blocked: nothing was stored there
    }
  }
  if (idb) {
    await new Promise<void>((resolve) => {
      try {
        const req = idb.deleteDatabase(PHOTO_DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve(); // deletion completes once other tabs close the db
      } catch {
        resolve();
      }
    });
  }
}

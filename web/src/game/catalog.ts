// Content ids for places, souvenirs, stories and snacks (spec §4.4, §4.5, §6.3).
// User-facing text lives in copy/en/catalog.ts, keyed by these ids.
import type { PlaceId, SnackId, Species, SouvenirId, StoryId } from "../shared/types";

export type Place = { id: PlaceId; unlockLevel: number; everyday: readonly SouvenirId[]; keepsake: SouvenirId; stories: readonly StoryId[] };

export const PLACE_IDS: readonly PlaceId[] = ["garden", "riverside", "market", "hills"];

export const PLACES: Record<PlaceId, Place> = {
  garden: {
    id: "garden",
    unlockLevel: 1,
    everyday: ["ladybugSticker", "cloverSprig", "gardenTwine", "seedPacket", "wateringCanCharm"],
    keepsake: "goldenAcorn",
    stories: ["garden.1", "garden.2", "garden.3", "garden.4"],
  },
  riverside: {
    id: "riverside",
    unlockLevel: 1,
    everyday: ["skippingStone", "reedFlute", "paperBoat", "riverGlass", "cattailFluff"],
    keepsake: "moonstone",
    stories: ["riverside.1", "riverside.2", "riverside.3", "riverside.4"],
  },
  market: {
    id: "market",
    unlockLevel: 3,
    everyday: ["paperLantern", "spiceTin", "priceTag", "orangePeelCurl", "beadString"],
    keepsake: "brassKey",
    stories: ["market.1", "market.2", "market.3", "market.4"],
  },
  hills: {
    id: "hills",
    unlockLevel: 5,
    everyday: ["thymeBundle", "pressedFern", "cloudStone", "kiteTail", "mapScrap"],
    keepsake: "cometShard",
    stories: ["hills.1", "hills.2", "hills.3", "hills.4"],
  },
};

/** All 24 souvenirs, place by place (everyday then keepsake). */
export const SOUVENIR_IDS: readonly SouvenirId[] = PLACE_IDS.flatMap((p) => [...PLACES[p].everyday, PLACES[p].keepsake]);
export const STORY_IDS: readonly StoryId[] = PLACE_IDS.flatMap((p) => PLACES[p].stories);

const souvenirPlace = new Map<SouvenirId, PlaceId>(
  PLACE_IDS.flatMap((p) => [...PLACES[p].everyday, PLACES[p].keepsake].map((s) => [s, p] as const)),
);
const storyPlace = new Map<StoryId, PlaceId>(PLACE_IDS.flatMap((p) => PLACES[p].stories.map((s) => [s, p] as const)));

export function placeOfSouvenir(id: SouvenirId): PlaceId | null {
  return souvenirPlace.get(id) ?? null;
}
export function placeOfStory(id: StoryId): PlaceId | null {
  return storyPlace.get(id) ?? null;
}
export function isKeepsake(id: SouvenirId): boolean {
  const p = placeOfSouvenir(id);
  return p !== null && PLACES[p].keepsake === id;
}
export function isPlaceUnlocked(place: PlaceId, level: number): boolean {
  return level >= PLACES[place].unlockLevel;
}
/** The story shown at a place's cursor (stories are used in turn). */
export function storyAt(place: PlaceId, cursor: number): StoryId {
  const list = PLACES[place].stories;
  const i = Number.isFinite(cursor) ? Math.max(0, Math.floor(cursor)) % list.length : 0;
  return list[i];
}

export const SNACKS: Record<Species, readonly SnackId[]> = {
  cat: ["crunchy", "soft", "fishy"],
  dog: ["crunchy", "soft", "chewy"],
};

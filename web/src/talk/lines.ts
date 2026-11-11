// Bubble line picker (spec §6.5). P0 has one voice; never one of the last 3 lines when the set allows it.
import type { Rng } from "../game/rng";
import type { PartOfDay } from "../game/time";
import type { EffectiveProfile, LineId, LineSet } from "../shared/types";
import { talkLines } from "../copy/en/talk";

/** Line ids grouped by set (the id prefix before the first "."). */
export const LINE_SETS: Readonly<Record<string, readonly LineId[]>> = Object.keys(talkLines).reduce(
  (acc, id) => {
    const set = id.slice(0, id.indexOf("."));
    (acc[set] ??= []).push(id);
    return acc;
  },
  {} as Record<string, LineId[]>,
);

const RECENT = 3;

export function lineFor(
  set: LineSet,
  _p: EffectiveProfile,
  part: PartOfDay,
  rng: Rng,
  recent: readonly LineId[],
): LineId {
  if (set === "greeting") return `greeting.${part}`;
  const ids = LINE_SETS[set === "day" ? "homeStory" : set] ?? LINE_SETS.idle;
  const last3 = recent.slice(-RECENT);
  let pool = ids.filter((id) => !last3.includes(id));
  if (pool.length === 0) pool = ids.filter((id) => id !== recent[recent.length - 1]);
  if (pool.length === 0) pool = ids.slice();
  return rng.pick(pool);
}

/** Bubble text for a line id with {name} filled in; "" for an unknown id. */
export function lineText(id: LineId, name: string): string {
  const t = talkLines[id];
  return t === undefined ? "" : t.replace(/\{name\}/g, name);
}

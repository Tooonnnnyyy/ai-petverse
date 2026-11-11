// Effective profile (spec §10.1, PRD §6): latest correction per field > profile fact > generic default. Pure.
import type {
  CoatId,
  ComfortStyle,
  Correction,
  EffectiveProfile,
  Energy,
  PetProfile,
  Source,
  Species,
  Trigger,
} from "../shared/types";

export const PROFILE_DEFAULTS = {
  energy: "steady" as Energy,
  comfortStyle: "nearby" as ComfortStyle,
  trigger: "none" as Trigger,
  startleHide: false,
};

export const DEFAULT_COAT: Record<Species, CoatId> = { cat: "ginger", dog: "tan" };

const ENERGIES: readonly Energy[] = ["low", "steady", "high"];
const STYLES: readonly ComfortStyle[] = ["close", "nearby", "space"];
const TRIGGERS: readonly Trigger[] = ["sudden_noise", "strangers", "too_much_energy", "none"];

type BehaviourField = "energy" | "comfortStyle" | "trigger" | "startleHide";

/** The latest valid correction value for a field: latest `at`, ties broken by list order (later wins). */
function latestValue(c: readonly Correction[], field: BehaviourField): string | null {
  let best: { at: string; idx: number; value: string } | null = null;
  c.forEach((x, idx) => {
    if (x.field !== field || !isValid(field, x.value)) return;
    if (!best || x.at > best.at || (x.at === best.at && idx > best.idx)) best = { at: x.at, idx, value: x.value };
  });
  return best ? (best as { value: string }).value : null;
}

function isValid(field: BehaviourField, v: string): boolean {
  if (field === "energy") return (ENERGIES as readonly string[]).includes(v);
  if (field === "comfortStyle") return (STYLES as readonly string[]).includes(v);
  if (field === "trigger") return (TRIGGERS as readonly string[]).includes(v);
  return v === "true" || v === "false";
}

function pick<T extends string>(
  c: readonly Correction[],
  field: BehaviourField,
  fact: T | null,
  fallback: T,
): [T, Source] {
  const corr = latestValue(c, field);
  if (corr !== null) return [corr as T, "correction"];
  if (fact !== null) return [fact, "fact"];
  return [fallback, "default"];
}

export function effectiveProfile(p: PetProfile, c: readonly Correction[]): EffectiveProfile {
  const [energy, eSrc] = pick(c, "energy", p.energy, PROFILE_DEFAULTS.energy);
  const [comfortStyle, cSrc] = pick(c, "comfortStyle", p.comfortStyle, PROFILE_DEFAULTS.comfortStyle);
  const [trigger, tSrc] = pick(c, "trigger", p.trigger, PROFILE_DEFAULTS.trigger);
  const hide = latestValue(c, "startleHide");
  return {
    name: p.name,
    species: p.species,
    energy,
    comfortStyle,
    trigger,
    startleHide: hide === null ? PROFILE_DEFAULTS.startleHide : hide === "true",
    coat: p.coat ?? DEFAULT_COAT[p.species],
    sources: { energy: eSrc, comfortStyle: cSrc, trigger: tSrc, startleHide: hide === null ? "default" : "correction" },
  };
}

export type CorrectionChip = "moreEnergetic" | "calmer" | "likesCloseness" | "likesSpace" | "hidesWhenStartled";

/** What a correction chip writes (§4.7); null when the result equals the effective value ("already applied"). */
export function chipCorrection(
  chip: CorrectionChip,
  eff: EffectiveProfile,
): { field: Correction["field"]; value: string } | null {
  const i = ENERGIES.indexOf(eff.energy);
  switch (chip) {
    case "moreEnergetic":
      return i >= ENERGIES.length - 1 ? null : { field: "energy", value: ENERGIES[i + 1] };
    case "calmer":
      return i <= 0 ? null : { field: "energy", value: ENERGIES[i - 1] };
    case "likesCloseness":
      return eff.comfortStyle === "close" ? null : { field: "comfortStyle", value: "close" };
    case "likesSpace":
      return eff.comfortStyle === "space" ? null : { field: "comfortStyle", value: "space" };
    case "hidesWhenStartled":
      return eff.startleHide ? null : { field: "startleHide", value: "true" };
  }
}

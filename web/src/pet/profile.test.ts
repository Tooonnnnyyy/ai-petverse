import { describe, expect, it } from "vitest";
import type { Correction, PetProfile } from "../shared/types";
import { chipCorrection, effectiveProfile } from "./profile";

const base: PetProfile = {
  name: "Miso",
  species: "cat",
  energy: "low",
  comfortStyle: null,
  trigger: null,
  favouriteActivity: "",
  coat: null,
};
const corr = (id: string, at: string, field: Correction["field"], value: string): Correction => ({ id, at, field, value });

describe("effectiveProfile", () => {
  it("uses defaults, facts and default coat per species", () => {
    const e = effectiveProfile(base, []);
    expect(e.energy).toBe("low");
    expect(e.sources.energy).toBe("fact");
    expect(e.comfortStyle).toBe("nearby");
    expect(e.sources.comfortStyle).toBe("default");
    expect(e.trigger).toBe("none");
    expect(e.startleHide).toBe(false);
    expect(e.coat).toBe("ginger");
    expect(effectiveProfile({ ...base, species: "dog" }, []).coat).toBe("tan");
    expect(effectiveProfile({ ...base, coat: "grey" }, []).coat).toBe("grey");
  });

  it("a correction beats a fact; the latest correction per field wins; removing one falls back", () => {
    const cs = [
      corr("a", "2026-11-01", "energy", "high"),
      corr("b", "2026-11-05", "energy", "steady"),
      corr("c", "2026-11-03", "energy", "low"),
    ];
    const e = effectiveProfile(base, cs);
    expect(e.energy).toBe("steady");
    expect(e.sources.energy).toBe("correction");
    expect(effectiveProfile(base, cs.filter((c) => c.id !== "b")).energy).toBe("low");
    expect(effectiveProfile(base, []).energy).toBe("low");
    // same day: later in the list wins
    const same = [corr("x", "2026-11-05", "comfortStyle", "close"), corr("y", "2026-11-05", "comfortStyle", "space")];
    expect(effectiveProfile(base, same).comfortStyle).toBe("space");
  });

  it("a note changes no behaviour field and invalid values are ignored", () => {
    const e = effectiveProfile(base, [corr("n", "2026-11-05", "note", "likes boxes"), corr("z", "2026-11-06", "energy", "zoomy")]);
    expect(e).toEqual(effectiveProfile(base, []));
  });

  it("startleHide comes from corrections only", () => {
    const e = effectiveProfile(base, [corr("h", "2026-11-05", "startleHide", "true")]);
    expect(e.startleHide).toBe(true);
    expect(e.sources.startleHide).toBe("correction");
  });

  it("correction chips write one step and are no-ops when already applied", () => {
    const high = effectiveProfile({ ...base, energy: "high" }, []);
    expect(chipCorrection("moreEnergetic", high)).toBeNull();
    expect(chipCorrection("calmer", high)).toEqual({ field: "energy", value: "steady" });
    const low = effectiveProfile(base, []);
    expect(chipCorrection("moreEnergetic", low)).toEqual({ field: "energy", value: "steady" });
    expect(chipCorrection("likesSpace", low)).toEqual({ field: "comfortStyle", value: "space" });
    expect(chipCorrection("hidesWhenStartled", low)).toEqual({ field: "startleHide", value: "true" });
  });
});

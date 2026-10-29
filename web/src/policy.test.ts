import { describe, expect, it } from "vitest";
import { interpretIntent, petModeForIntent, responseForIntent } from "./policy";
import type { PetProfile } from "./types";

const profile: PetProfile = {
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "close",
  trigger: "sudden noise",
  favouriteActivity: "window watching",
  correction: "hides when startled",
  published: false,
};

describe("preview pet policy", () => {
  it("routes an explicit overload statement to comfort", () => {
    expect(interpretIntent("I feel overwhelmed").intent).toBe("comfort");
  });

  it("keeps the animation command bounded by pet preferences", () => {
    expect(petModeForIntent("come_closer", profile)).toBe("approaching");
    expect(responseForIntent("play", profile)).toContain("window watching");
  });

  it("does not guess an unsupported request", () => {
    const result = interpretIntent("tell me something complicated");
    expect(result.intent).toBe("no_match");
    expect(result.confidence).toBeLessThan(0.5);
  });
});

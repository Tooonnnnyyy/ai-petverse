import { describe, expect, it } from "vitest";
import { talkLines, talkNarration } from "../copy/en/talk";
import { mulberry32 } from "../game/rng";
import type { EffectiveProfile, LineId, LineSet } from "../shared/types";
import { LINE_SETS, lineFor, lineText } from "./lines";

const p: EffectiveProfile = {
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "nearby",
  trigger: "none",
  startleHide: false,
  coat: "ginger",
  sources: { energy: "fact", comfortStyle: "fact", trigger: "fact", startleHide: "default" },
};

const BANNED =
  /misses you|miss you|lonely|sad because|hungry|starving|streak|don't forget|come back soon|waiting for you|last chance|hurry up|don't leave|you seem|you feel|you look (sad|stressed|anxious)|I can tell you|you scared|because of you|exact (copy|replica|twin)|cure|therapy|treat(s|ment) (anxiety|depression)/i;

describe("lines", () => {
  it("has about 40 lines covering every P0 set, all short and on-policy", () => {
    const ids = Object.keys(talkLines);
    expect(ids.length).toBeGreaterThanOrEqual(38);
    expect(ids.length).toBeLessThanOrEqual(50);
    for (const set of ["greet", "goodnight", "come_closer", "comfort", "rest", "play", "idle"]) {
      expect(LINE_SETS[set]).toHaveLength(3);
    }
    for (const set of ["decline_full", "decline_tired", "decline_cooldown", "no_match"]) expect(LINE_SETS[set]).toHaveLength(2);
    expect(LINE_SETS.greeting).toHaveLength(4);
    expect(LINE_SETS.homeStory).toHaveLength(4);
    for (const t of [...Object.values(talkLines), ...Object.values(talkNarration)]) {
      expect(t).not.toMatch(BANNED);
      expect(t.replace("{name}", "x".repeat(12)).length).toBeLessThanOrEqual(70);
    }
    for (const t of Object.values(talkLines)) expect(t.replace("{name}", "Miso").length).toBeLessThanOrEqual(60);
  });

  it("never repeats one of the last 3 lines and never repeats immediately", () => {
    const rng = mulberry32(3);
    const sets: LineSet[] = ["greet", "idle", "homeStory", "decline_full", "comfort", "day"];
    for (const set of sets) {
      const recent: LineId[] = [];
      for (let k = 0; k < 200; k += 1) {
        const id = lineFor(set, p, "afternoon", rng, recent);
        expect(id).not.toBe(recent[recent.length - 1]);
        const pool = LINE_SETS[set === "day" ? "homeStory" : set];
        if (pool.length > 3) expect(recent.slice(-3)).not.toContain(id);
        recent.push(id);
      }
    }
  });

  it("greeting follows the part of day and text fills {name}", () => {
    expect(lineFor("greeting", p, "morning", mulberry32(1), [])).toBe("greeting.morning");
    expect(lineText("decline_full.1", "Miso")).toBe("Miso is full. Maybe later.");
    expect(lineText("nope.1", "Miso")).toBe("");
  });
});

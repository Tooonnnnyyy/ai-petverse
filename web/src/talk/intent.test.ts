import { describe, expect, it } from "vitest";
import { detectUrgent, interpretIntent, URGENT_EN, URGENT_ZH } from "./intent";

describe("interpretIntent (ported from policy.test.ts)", () => {
  it("routes an explicit overload statement to comfort", () => {
    expect(interpretIntent("I feel overwhelmed").intent).toBe("comfort");
  });

  it("routes come here to come_closer with high confidence", () => {
    const r = interpretIntent("come here");
    expect(r.intent).toBe("come_closer");
    expect(r.confidence).toBeGreaterThan(0.8);
    expect(r.source).toBe("rules-v2");
  });

  it("does not guess an unsupported request", () => {
    const r = interpretIntent("tell me something complicated");
    expect(r.intent).toBe("no_match");
    expect(r.confidence).toBeLessThan(0.5);
  });
});

describe("interpretIntent rules v2", () => {
  it.each(["display", "function", "breakfast", "interest", "forest", "disclose", "closed", "the door is closed"])(
    "%s is no_match",
    (t) => expect(interpretIntent(t).intent).toBe("no_match"),
  );

  it("negation and removed bare keywords", () => {
    expect(interpretIntent("I have no energy").intent).not.toBe("play");
    expect(interpretIntent("I don't want to play").intent).not.toBe("play");
    expect(interpretIntent("I don’t want to play").intent).not.toBe("play");
    expect(interpretIntent("never play").intent).toBe("no_match");
    expect(interpretIntent("that was fun").intent).toBe("no_match");
    expect(interpretIntent("let's play!").intent).toBe("play");
    expect(interpretIntent("Good night").intent).toBe("goodnight");
    expect(interpretIntent("How was your day?").intent).toBe("day");
    expect(interpretIntent("Hi").intent).toBe("greet");
    expect(interpretIntent("quiet time please").intent).toBe("rest");
  });

  it("Chinese keywords and negators", () => {
    expect(interpretIntent("不想玩").intent).not.toBe("play");
    expect(interpretIntent("一起玩吧").intent).toBe("play");
    expect(interpretIntent("我好累").intent).toBe("rest");
    expect(interpretIntent("陪陪我").intent).toBe("comfort");
    expect(interpretIntent("过来").intent).toBe("come_closer");
    expect(interpretIntent("别过来").intent).toBe("no_match");
    expect(interpretIntent("晚安").intent).toBe("goodnight");
  });

  it("several intents give confidence 0.6 with alternatives", () => {
    const r = interpretIntent("hi, let's play");
    expect(r.confidence).toBe(0.6);
    expect(r.intent).toBe("play");
    expect(r.alternatives).toEqual(["greet"]);
  });

  it("evidence never echoes the raw text", () => {
    const r = interpretIntent("my secret plan: play");
    expect(r.evidence.join(" ")).not.toContain("secret");
  });
});

describe("detectUrgent", () => {
  it("detects every listed phrase, in context and with odd casing", () => {
    for (const ph of URGENT_EN) {
      expect(detectUrgent(ph)).toBe(true);
      expect(detectUrgent(`Honestly I ${ph.toUpperCase()} today.`)).toBe(true);
    }
    for (const kw of URGENT_ZH) {
      expect(detectUrgent(kw)).toBe(true);
      expect(detectUrgent(`我真的${kw}了`)).toBe(true);
    }
    expect(detectUrgent("I want to end it all")).toBe(true);
    expect(detectUrgent("I don’t want to be alive")).toBe(true);
    expect(detectUrgent("self-harm")).toBe(true);
    expect(detectUrgent("我 不想 活")).toBe(true);
  });

  // Negative controls (owner reviews). False positives are acceptable; these are documented choices.
  it.each([
    ["kill time", false],
    ["dead tired", false],
    ["this bug is killing me", false],
    ["I'm dying to play", false],
    ["I walked 5 kms today", false],
    ["hello there", false],
    ["我想玩", false],
  ] as const)("%s -> %s", (t, expected) => expect(detectUrgent(t)).toBe(expected));
});

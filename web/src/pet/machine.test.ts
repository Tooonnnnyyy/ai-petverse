import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import type {
  Ctx,
  EffectiveProfile,
  Intent,
  Outing,
  OutingReward,
  PetCommand,
  PetInput,
  PetState,
  PetStateName,
} from "../shared/types";
import { initPet, longWeights, step, supportWindowAfter, zoneAt } from "./machine";
import { PET_TIMING as T, ZONE_X } from "./timing";

// Local noon, so isNight/partOfDay are the same in every time zone.
const T0 = new Date(2026, 10, 11, 12, 0, 0).getTime();
const NIGHT = new Date(2026, 10, 11, 23, 0, 0).getTime();

const profile = (extra: Partial<EffectiveProfile> = {}): EffectiveProfile => ({
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "nearby",
  trigger: "none",
  startleHide: false,
  coat: "ginger",
  sources: { energy: "fact", comfortStyle: "fact", trigger: "fact", startleHide: "default" },
  ...extra,
});

const ctxAt = (now: number, extra: Partial<Ctx> = {}): Ctx => ({
  now,
  profile: profile(),
  stageWidthPx: 800,
  calm: false,
  unlocked: new Set(["cushion"]),
  seenMoments: new Set(),
  gamificationPaused: false,
  supportWindowUntil: 0,
  firstPlayDone: true,
  userAnchorX: 0.5,
  ...extra,
});

const reward: OutingReward = { kind: "postcard", place: "garden", storyId: "garden.1", hint: null };
const outing = (startedAt: number): Outing => ({
  id: "o1",
  place: "garden",
  plannedMin: 5,
  startedAt,
  endsAt: startedAt + 5 * 60_000,
  recalledAt: null,
  creditedAt: null,
});

/** Force a state for unit checks (keeps rng state). */
function force(s: PetState, cmd: PetCommand, name: PetStateName, now: number, endsAt: number | null): PetState {
  return { ...s, name, cmd, enteredAt: now, endsAt, plan: [] };
}

function tickUntilNamed(s: PetState, names: PetStateName[], c: (now: number) => Ctx, max = 50): PetState {
  let st = s;
  for (let k = 0; k < max && !names.includes(st.name); k += 1) {
    if (st.endsAt === null) break;
    st = step(st, { t: "tick" }, c(st.endsAt)).state;
  }
  return st;
}

describe("startup and autonomous behaviour", () => {
  it("startup is a transition followed by a walk, and the greeting matches the part of day", () => {
    for (let seed = 1; seed < 50; seed += 1) {
      const { state, commands, greeting } = initPet(seed, T0, ctxAt(T0));
      expect(commands).toHaveLength(1);
      expect(commands[0].kind).toBe("transition");
      expect(state.name).toBe("transition");
      expect(state.plan?.[0].kind).toBe("walk");
      expect((state.endsAt as number) - T0).toBeLessThanOrEqual(T.transition.maxMs);
      expect(greeting).toBe("greeting.afternoon");
      const after = step(state, { t: "tick" }, ctxAt(state.endsAt as number));
      expect(after.state.name).toBe("walk");
    }
  });

  it("calm motion replaces walks with fadeTo", () => {
    const { state } = initPet(3, T0, ctxAt(T0, { calm: true }));
    expect(state.plan?.[0].kind).toBe("fadeTo");
  });

  it("timeouts always leave a state", () => {
    let { state } = initPet(11, T0, ctxAt(T0));
    for (let k = 0; k < 500; k += 1) {
      expect(state.endsAt).not.toBeNull();
      const now = state.endsAt as number;
      const r = step(state, { t: "tick" }, ctxAt(now));
      expect(r.commands.length).toBeGreaterThanOrEqual(1);
      expect(r.state.enteredAt).toBe(now);
      expect(r.state.endsAt === null || (r.state.endsAt as number) > now).toBe(true);
      state = r.state;
    }
    // an early tick is ignored
    expect(step(state, { t: "tick" }, ctxAt((state.endsAt as number) - 1)).state).toBe(state);
  });

  it("rest exits follow the weighted factors and transitions appear at about 1/3", () => {
    const n = 10_000;
    const counts: Record<string, number> = { rest: 0, walk: 0, sit: 0 };
    let transitions = 0;
    let { state } = initPet(42, T0, ctxAt(T0));
    for (let k = 0; k < n; k += 1) {
      const s = force({ ...state, energy: 65, curiosity: 40, restsInRow: 0, lastBubbleAt: T0 }, { kind: "rest", variant: 0, mirror: false, ms: 1000 }, "rest", T0, T0 + 1000);
      const r = step(s, { t: "tick" }, ctxAt(T0 + 1000));
      let first = r.commands[0];
      if (first.kind === "transition") {
        transitions += 1;
        first = (r.state.plan as PetCommand[])[0];
      }
      counts[first.kind === "fadeTo" ? "walk" : first.kind] += 1;
      state = r.state;
    }
    expect(Math.abs(counts.walk / n - 0.55)).toBeLessThan(0.03);
    expect(Math.abs(counts.rest / n - 0.3)).toBeLessThan(0.03);
    expect(Math.abs(counts.sit / n - 0.15)).toBeLessThan(0.03);
    expect(Math.abs(transitions / n - 1 / 3)).toBeLessThan(0.03);
  });

  it("applies the energy, curiosity and night factors", () => {
    const low = longWeights({ energy: 20, curiosity: 0 }, T0, T.restExit);
    expect(low.walk).toBeCloseTo(0.55 * 0.6);
    expect(low.rest).toBeCloseTo(0.3 * 1.5);
    const high = longWeights({ energy: 90, curiosity: 80 }, T0, T.restExit);
    expect(high.walk).toBeCloseTo(0.55 * 1.5 * 1.5);
    expect(high.rest).toBeCloseTo(0.3 * 0.7);
    expect(high.sit).toBeCloseTo(0.15 * 1.5);
    expect(longWeights({ energy: 65, curiosity: 0 }, NIGHT, T.restExit).rest).toBeCloseTo(0.45);
  });

  it("sleep replaces rest after 3 quiet rests (2 at night)", () => {
    const { state } = initPet(5, T0, ctxAt(T0));
    const restEnd = (s: PetState, n: number, now: number) =>
      step(force({ ...s, restsInRow: n }, { kind: "sit", ms: 1 }, "sit", now, now + 1), { t: "tick" }, ctxAt(now + 1));
    // sit → rest/walk; find a seed path that picks rest and check the replacement rule directly
    let sawSleep = false;
    let sawRestAt2 = false;
    let s = state;
    for (let k = 0; k < 200; k += 1) {
      const r = restEnd(s, 3, T0);
      const kinds = [r.commands[0].kind, ...(r.state.plan ?? []).map((c) => c.kind)];
      if (kinds.includes("sleep")) sawSleep = true;
      expect(kinds).not.toContain("rest");
      const r2 = restEnd(s, 2, T0);
      if ([r2.commands[0].kind, ...(r2.state.plan ?? []).map((c) => c.kind)].includes("rest")) sawRestAt2 = true;
      const night = restEnd(s, 2, NIGHT);
      expect([night.commands[0].kind, ...(night.state.plan ?? []).map((c) => c.kind)]).not.toContain("rest");
      s = r.state;
    }
    expect(sawSleep).toBe(true);
    expect(sawRestAt2).toBe(true);
  });

  it("walk targets are at least 15% away and inside the margins", () => {
    let { state } = initPet(9, T0, ctxAt(T0));
    const lo = (T.walk.marginPx + T.walk.spriteHalfPx) / 800;
    let walks = 0;
    for (let k = 0; k < 2000; k += 1) {
      const now = state.endsAt as number;
      const r = step(state, { t: "tick" }, ctxAt(now));
      if (r.state.cmd.kind === "walk") {
        walks += 1;
        const c = r.state.cmd;
        expect(Math.abs(c.toX - r.state.x)).toBeGreaterThanOrEqual(T.walk.minDistRatio - 1e-9);
        expect(c.toX).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(c.toX).toBeLessThanOrEqual(1 - lo + 1e-9);
        expect((r.state.endsAt as number) - now).toBeLessThanOrEqual(T.walk.capMs);
      }
      state = r.state;
    }
    expect(walks).toBeGreaterThan(100);
  });

  it("the seed-7 idle run of 10 minutes contains rest, walk, sit and transition", () => {
    let { state } = initPet(7, T0, ctxAt(T0));
    const seen = new Set<string>([state.name]);
    while ((state.endsAt as number) < T0 + 10 * 60_000) {
      state = step(state, { t: "tick" }, ctxAt(state.endsAt as number)).state;
      seen.add(state.name);
    }
    for (const n of ["rest", "walk", "sit", "transition"]) expect(seen).toContain(n);
  });

  it("zoneAt finds the drop bands", () => {
    expect(zoneAt(ZONE_X.bed, 800)).toBe("bed");
    expect(zoneAt(0.33, 800)).toBe("bowl");
    expect(zoneAt(0.45, 800)).toBeNull();
    expect(zoneAt(0.85, 800)).toBe("windowSeat");
  });
});

describe("interrupts, priority and declines", () => {
  const start = () => initPet(21, T0, ctxAt(T0)).state;
  const states: Array<[PetStateName, PetCommand]> = [
    ["walk", { kind: "walk", toX: 0.8, pxPerS: 60 }],
    ["sleep", { kind: "sleep", ms: 60_000 }],
    ["eat", { kind: "eat", snack: "soft", ms: 3000 }],
    ["play", { kind: "play", toy: "wand", ms: 6000 }],
  ];

  it.each(states)("dragStart during %s is accepted", (name, cmd) => {
    const s = force(start(), cmd, name, T0, T0 + 5000);
    const r = step(s, { t: "dragStart" }, ctxAt(T0 + 100));
    expect(r.state.name).toBe("held");
    expect(r.commands).toEqual([{ kind: "held" }]);
  });

  it.each([
    ["leaving", { kind: "outingLeave", edge: "left" }],
    ["away", { kind: "away" }],
    ["returning", { kind: "outingReturn", edge: "right" }],
  ] as Array<[PetStateName, PetCommand]>)("dragStart during %s is ignored", (name, cmd) => {
    const s = force(start(), cmd, name, T0, null);
    expect(step(s, { t: "dragStart" }, ctxAt(T0 + 100)).state).toBe(s);
  });

  const rest = (s: PetState) => force(s, { kind: "rest", variant: 0, mirror: false, ms: 30_000 }, "rest", T0, T0 + 30_000);

  it("play during cooldown declines; low energy declines tired; the first play is accepted at energy 10", () => {
    const s = rest(start());
    const played = step(s, { t: "play" }, ctxAt(T0 + 10));
    expect(played.state.name).toBe("play");
    expect(played.effects).toContainEqual({ type: "bond", source: "play" });
    const again = step(rest(played.state), { t: "play" }, ctxAt(T0 + 20_000));
    expect(again.commands[0]).toMatchObject({ kind: "decline", reason: "cooldown" });
    expect(again.effects.filter((e) => e.type === "bond")).toHaveLength(0);
    const tired = step(rest({ ...s, energy: 20 }), { t: "play" }, ctxAt(T0 + 10));
    expect(tired.commands[0]).toMatchObject({ kind: "decline", reason: "tired" });
    const first = step(rest({ ...s, energy: 10, playCooldownUntil: T0 + 99_999 }), { t: "play" }, ctxAt(T0 + 10, { firstPlayDone: false }));
    expect(first.state.name).toBe("play");
    // with the "too much energy" trigger play lasts 6 s and the cooldown is 60 s
    const trig = step(s, { t: "play" }, ctxAt(T0 + 10, { profile: profile({ trigger: "too_much_energy" }) }));
    expect(trig.state.cmd).toMatchObject({ kind: "play", ms: 6000 });
    expect(trig.state.playCooldownUntil).toBe(T0 + 10 + 6000 + 60_000);
  });

  it("a 3rd feed within 20 minutes declines full with 0 Bond", () => {
    let s = rest(start());
    const kinds: string[] = [];
    const bonds: number[] = [];
    for (let k = 0; k < 3; k += 1) {
      const r = step(rest(s), { t: "feed", snack: "soft" }, ctxAt(T0 + k * 60_000));
      kinds.push(r.commands[0].kind);
      bonds.push(r.effects.filter((e) => e.type === "bond").length);
      s = r.state;
    }
    expect(kinds).toEqual(["eat", "eat", "decline"]);
    expect(bonds).toEqual([1, 1, 0]);
    const later = step(rest(s), { t: "feed", snack: "soft" }, ctxAt(T0 + 21 * 60_000));
    expect(later.commands[0].kind).toBe("eat");
  });

  it("a tap during sleep gives a yawn with no hearts and no Bond", () => {
    const s = force(start(), { kind: "sleep", ms: 60_000 }, "sleep", T0, T0 + 60_000);
    const r = step(s, { t: "pet" }, ctxAt(T0 + 1000));
    expect(r.commands[0]).toMatchObject({ kind: "transition", variant: "yawn" });
    expect(r.commands.some((c) => c.kind === "petted")).toBe(false);
    expect(r.effects).toEqual([]);
  });

  it("purr/lean taps give Bond and chain hearts; ear-flicks give none", () => {
    let s = rest(start());
    let maxHearts = 0;
    let earFlickBond = false;
    for (let k = 0; k < 60; k += 1) {
      const now = T0 + k * 9000; // never over-petting
      const r = step(rest(s), { t: "pet" }, ctxAt(now));
      const c = r.commands[0];
      expect(c.kind).toBe("petted");
      if (c.kind === "petted") {
        const bond = r.effects.some((e) => e.type === "bond" && e.source === "pet");
        if (c.reaction === "earFlick") earFlickBond ||= bond;
        else expect(bond).toBe(true);
      }
      s = r.state;
    }
    expect(earFlickBond).toBe(false);
    // quick chain within 1.5 s
    s = rest(start());
    for (let k = 0; k < 3; k += 1) {
      const r = step(s, { t: "pet" }, ctxAt(T0 + k * 1000, { profile: profile({ comfortStyle: "close" }) }));
      if (r.commands[0].kind === "petted") maxHearts = Math.max(maxHearts, r.commands[0].hearts);
      s = r.state;
    }
    expect(maxHearts).toBeGreaterThanOrEqual(2);
  });

  it("over-petting: space hides, nearby walks away, close slow-blinks; R9 keeps the pet put", () => {
    const tap4 = (style: EffectiveProfile["comfortStyle"], extra: Partial<Ctx> = {}) => {
      let s = rest(start());
      let r = step(s, { t: "pet" }, ctxAt(T0));
      for (let k = 1; k < 4; k += 1) {
        s = r.state;
        r = step(s, { t: "pet" }, ctxAt(T0 + k * 1000, { profile: profile({ comfortStyle: style }), ...extra }));
      }
      return r;
    };
    expect(tap4("space").state.name).toBe("hide");
    expect(tap4("space").effects).toContainEqual({ type: "narrate", textId: "hide" });
    const away = tap4("nearby");
    expect(away.state.name).toBe("walk");
    expect(away.state.plan?.[0].kind).toBe("sit");
    expect(Math.abs((away.state.cmd as { toX: number }).toX - 0.5)).toBeGreaterThanOrEqual(0.3 - 1e-9);
    expect(tap4("close").commands[0]).toMatchObject({ kind: "petted", reaction: "slowBlink" });
    for (const style of ["space", "nearby", "close"] as const) {
      const r = tap4(style, { supportWindowUntil: T0 + 60_000 });
      expect(r.commands[0]).toMatchObject({ kind: "petted", reaction: "earFlick", hearts: 0 });
      expect(r.effects.filter((e) => e.type === "bond")).toHaveLength(0);
    }
  });

  it("inside the R9 window declines become a quiet settle and drops never hide", () => {
    const r9 = { supportWindowUntil: T0 + 120_000 };
    const s = rest(start());
    const play = step(rest({ ...s, playCooldownUntil: T0 + 50_000 }), { t: "play" }, ctxAt(T0 + 10, r9));
    expect(["approach", "settle"]).toContain(play.state.name);
    expect(play.commands.some((c) => c.kind === "decline")).toBe(false);
    const fed = step(rest({ ...s, feedTimes: [T0 - 1000, T0 - 500] }), { t: "feed", snack: "soft" }, ctxAt(T0 + 10, r9));
    expect(["approach", "settle"]).toContain(fed.state.name);
    for (let k = 0; k < 100; k += 1) {
      const held = step(rest({ ...s, rngState: k + 1 }), { t: "dragStart" }, ctxAt(T0, r9)).state;
      const drop = step(held, { t: "dragEnd", x: 0.5, speedPxS: 3000, zone: null }, ctxAt(T0 + 500, { ...r9, profile: profile({ comfortStyle: "space" }) }));
      expect(drop.state.plan?.some((c) => c.kind === "hide")).toBe(false);
    }
  });

  it("drops: zones act, fast releases can startle and hide, calm skips the fall", () => {
    const s = rest(start());
    const held = step(s, { t: "dragStart" }, ctxAt(T0)).state;
    const bed = step(held, { t: "dragEnd", x: 0.12, speedPxS: 100, zone: "bed" }, ctxAt(T0 + 500));
    expect(bed.commands[0].kind).toBe("fall");
    expect(bed.state.plan?.[0].kind).toBe("sleep");
    expect(bed.state.x).toBe(ZONE_X.bed);
    const locked = step(held, { t: "dragEnd", x: 0.84, speedPxS: 100, zone: "windowSeat" }, ctxAt(T0 + 500));
    expect(locked.state.plan?.some((c) => c.kind === "sit")).toBe(false);
    const calm = step(held, { t: "dragEnd", x: 0.32, speedPxS: 100, zone: "bowl" }, ctxAt(T0 + 500, { calm: true }));
    expect(calm.commands[0].kind).toBe("eat");
    let hid = 0;
    for (let k = 0; k < 200; k += 1) {
      const h = step({ ...held, rngState: k * 7 + 1 }, { t: "dragEnd", x: 0.5, speedPxS: 2000, zone: null }, ctxAt(T0 + 500, { profile: profile({ comfortStyle: "space" }) }));
      expect(h.state.plan?.[0]).toMatchObject({ kind: "transition", variant: "startle" });
      if (h.state.plan?.some((c) => c.kind === "hide")) hid += 1;
    }
    expect(hid / 200).toBeGreaterThan(0.6);
    expect(step(held, { t: "dragCancel" }, ctxAt(T0 + 500)).commands[0]).toMatchObject({ kind: "transition", variant: "land" });
  });

  it("sendTo walks to the zone with no hide roll", () => {
    const s = rest({ ...start(), x: 0.8 });
    const r = step(s, { t: "sendTo", zone: "bed" }, ctxAt(T0 + 10));
    expect(r.commands[0]).toMatchObject({ kind: "walk", toX: ZONE_X.bed });
    expect(r.state.plan).toEqual([expect.objectContaining({ kind: "sleep" })]);
    const arrived = step(r.state, { t: "arrived", x: ZONE_X.bed }, ctxAt(T0 + 5000));
    expect(arrived.state.name).toBe("sleep");
  });

  it("support chips settle by comfort style with 0 Bond (ported policy case)", () => {
    const s = rest({ ...start(), x: 0.9 });
    const close = step(s, { t: "support", intent: "come_closer", source: "chip" }, ctxAt(T0, { profile: profile({ comfortStyle: "close" }) }));
    expect(close.commands[0]).toMatchObject({ kind: "approach", pace: "normal" });
    expect(close.state.plan?.[0]).toMatchObject({ kind: "settle", distance: "near" });
    expect(close.effects).toEqual([{ type: "narrate", textId: "comeCloser" }]);
    const space = step(s, { t: "support", intent: "come_closer", source: "chip" }, ctxAt(T0, { profile: profile({ comfortStyle: "space" }) }));
    expect(space.effects).toContainEqual({ type: "narrate", textId: "comeCloserSpace" });
    const quiet = step(s, { t: "support", intent: "rest", source: "chip" }, ctxAt(T0));
    const settle = [quiet.state.cmd, ...(quiet.state.plan ?? [])].find((c) => c.kind === "settle");
    expect(settle).toMatchObject({ ms: T.settle.quietMs });
    expect(supportWindowAfter(quiet.state, T0)).toBeGreaterThanOrEqual(T0 + T.settle.quietMs + T.supportWindowMs);
    for (const r of [close, space, quiet]) expect(r.effects.some((e) => e.type === "bond")).toBe(false);
    // typed play routes like the Play button and narrates the favourite
    const typed = step(s, { t: "talk", intent: "play", confidence: 0.86 }, ctxAt(T0));
    expect(typed.state.name).toBe("play");
    expect(typed.effects).toContainEqual({ type: "narrate", textId: "playStart" });
  });

  it("talk chips give one talk Bond and never anything but bond/narrate effects", () => {
    const s = rest(start());
    const intents: Intent[] = ["greet", "day", "goodnight", "no_match"];
    for (const intent of intents) {
      const r = step(s, { t: "talk", intent, confidence: 0.86 }, ctxAt(T0));
      expect(r.state.name).toBe("talk");
      expect(r.effects.every((e) => e.type === "bond" || e.type === "narrate")).toBe(true);
      expect(r.effects.filter((e) => e.type === "bond").length).toBe(intent === "no_match" ? 0 : 1);
    }
    const night = step(s, { t: "talk", intent: "goodnight", confidence: 0.86 }, ctxAt(T0));
    expect(night.state.plan?.[0].kind).toBe("sleep");
    const day = step(s, { t: "talk", intent: "day", confidence: 0.86 }, ctxAt(T0));
    expect((day.state.cmd as { lineId: string }).lineId.startsWith("homeStory.")).toBe(true);
  });

  it("urgent settles quietly with no effects; pause holds and buttons return to the hold", () => {
    const s = rest(start());
    const u = step(s, { t: "urgent" }, ctxAt(T0));
    expect(["approach", "settle"]).toContain(u.state.name);
    expect(u.effects).toEqual([]);
    expect(u.delayMs).toBe(0);
    const p = step(s, { t: "setPaused", on: true }, ctxAt(T0));
    expect(p.state.name).toBe("paused");
    expect(p.state.endsAt).toBeNull();
    expect(step(p.state, { t: "pet" }, ctxAt(T0 + 100)).effects).toEqual([{ type: "narrate", textId: "pausedPet" }]);
    const fed = step(p.state, { t: "feed", snack: "soft" }, ctxAt(T0 + 100));
    expect(fed.state.plan?.[fed.state.plan.length - 1]).toEqual({ kind: "hold" });
    const back = tickUntilNamed(fed.state, ["paused"], (n) => ctxAt(n));
    expect(back.name).toBe("paused");
    const off = step(back, { t: "setPaused", on: false }, ctxAt(T0 + 60_000));
    expect(off.state.name).not.toBe("paused");
  });

  it("a long hidden tab yawns on return", () => {
    const s = rest(start());
    expect(step(s, { t: "visible", hiddenMs: 30_000 }, ctxAt(T0)).state).toBe(s);
    expect(step(s, { t: "visible", hiddenMs: 90_000 }, ctxAt(T0)).commands[0]).toMatchObject({ kind: "transition", variant: "yawn" });
  });
});

describe("outing flow", () => {
  it("leave, away, return and gift", () => {
    let s = initPet(4, T0, ctxAt(T0)).state;
    s = step(s, { t: "tick" }, ctxAt(s.endsAt as number)).state;
    const now = s.enteredAt + 500;
    const leave = step(s, { t: "outingStart", outing: outing(now) }, ctxAt(now));
    expect(leave.state.name).toBe("leaving");
    expect(leave.commands[0].kind).toBe("outingLeave");
    expect(step(leave.state, { t: "pet" }, ctxAt(now + 10)).state).toBe(leave.state);
    expect(step(leave.state, { t: "feed", snack: "soft" }, ctxAt(now + 10)).state).toBe(leave.state);
    const away = step(leave.state, { t: "tick" }, ctxAt(leave.state.endsAt as number));
    expect(away.state.name).toBe("away");
    expect(away.state.endsAt).toBeNull();
    expect(step(away.state, { t: "talk", intent: "greet", confidence: 0.86 }, ctxAt(now + 9000)).effects).toEqual([
      { type: "narrate", textId: "out" },
    ]);
    const ret = step(away.state, { t: "outingEnd", reward }, ctxAt(now + 300_000));
    expect(ret.state.name).toBe("returning");
    expect(ret.commands[0].kind).toBe("outingReturn");
    const gift = step(ret.state, { t: "tick" }, ctxAt(ret.state.endsAt as number));
    expect(gift.state.name).toBe("gift");
    expect(gift.commands[0]).toEqual({ kind: "gift", reward });
    expect(gift.state.endsAt).toBeNull();
    expect(gift.effects.filter((e) => e.type === "bond")).toHaveLength(0); // outing Bond comes from resolveReturn
    const done = step(gift.state, { t: "giftDismissed" }, ctxAt(now + 320_000));
    expect(done.commands[0].kind).toBe("transition");
    expect(done.state.plan?.[0].kind).toBe("rest");
  });

  it("a reload during an outing goes straight to away; a finished one on load goes straight to gift", () => {
    const s = initPet(4, T0, ctxAt(T0)).state;
    expect(step(s, { t: "outingStart", outing: outing(T0 - 60_000) }, ctxAt(T0)).state.name).toBe("away");
    expect(step(s, { t: "outingEnd", reward }, ctxAt(T0)).state.name).toBe("gift");
    expect(step(s, { t: "outingEnd", reward }, ctxAt(T0, { gamificationPaused: true })).state).toBe(s);
  });
});

describe("seeded replay", () => {
  function replay(seed: number): string[] {
    const trace: string[] = [];
    const g = mulberry32(seed * 31 + 1);
    let now = T0;
    let firstPlayDone = false;
    let supportWindowUntil = 0;
    let lastOuting = 0;
    const c = () => ctxAt(now, { firstPlayDone, supportWindowUntil, userAnchorX: 0.4 });
    const init = initPet(seed, now, c());
    let s = init.state;
    trace.push(`init|${s.name}|${JSON.stringify(init.commands)}|${init.greeting}`);
    const intents: Intent[] = ["greet", "day", "goodnight", "comfort", "come_closer", "rest", "play", "no_match"];
    for (let k = 0; k < 200; k += 1) {
      let input: PetInput;
      const roll = g.next();
      if (s.name === "held") {
        input = g.next() < 0.2 ? { t: "dragCancel" } : { t: "dragEnd", x: g.next(), speedPxS: g.int(0, 3000), zone: g.pick([null, "bed", "bowl", "cushion"] as const) };
        now += g.int(200, 2000);
      } else if ((s.name === "away" || s.name === "gift") && g.next() < 0.5) {
        input = s.name === "away" ? { t: "outingEnd", reward } : { t: "giftDismissed" };
        now += g.int(200, 5000);
      } else if (roll < 0.45) {
        input = { t: "tick" };
        now = Math.max(now, s.endsAt ?? now + 1000);
      } else {
        now += g.int(200, 5000);
        if ((s.name === "walk" || s.name === "approach") && g.next() < 0.5) {
          input = { t: "arrived", x: (s.cmd as { toX: number }).toX };
        } else {
          const choice = g.int(0, 11);
          input = [
            { t: "pet" },
            { t: "pet" },
            { t: "dragStart" },
            { t: "feed", snack: "soft" },
            { t: "play" },
            { t: "talk", intent: g.pick(intents), confidence: 0.86 },
            { t: "support", intent: g.pick(["come_closer", "comfort", "rest"] as const), source: "chip" },
            { t: "sendTo", zone: g.pick(["bed", "bowl"] as const) },
            { t: "visible", hiddenMs: g.int(0, 120_000) },
            { t: "setPaused", on: s.name !== "paused" },
            g.next() < 0.3 ? { t: "outingStart", outing: outing(now) } : { t: "pet" },
            { t: "urgent" },
          ][choice] as PetInput;
          if (input.t === "outingStart") lastOuting = now;
        }
      }
      const r = step(s, input, c());
      if (input.t === "play") firstPlayDone = true;
      if (input.t === "support" || input.t === "urgent") supportWindowUntil = supportWindowAfter(r.state, now);
      s = r.state;
      trace.push(
        [
          now - T0,
          input.t,
          s.name,
          JSON.stringify(r.commands),
          JSON.stringify(r.effects),
          r.delayMs,
          s.x.toFixed(4),
          s.energy,
          s.curiosity,
        ].join("|"),
      );
    }
    expect(lastOuting).toBeGreaterThanOrEqual(0);
    return trace;
  }

  it("200 mixed inputs with seed 7 replay identically (golden)", () => {
    const a = replay(7);
    expect(a).toHaveLength(201);
    expect(replay(7)).toEqual(a);
    expect(replay(8)).not.toEqual(a);
    expect(a).toMatchSnapshot();
  });
});

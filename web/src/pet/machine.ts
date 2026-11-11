// Pet behaviour state machine (spec §5, §6). `step` is a pure seeded reducer: the same (state, input, ctx)
// always yields the same output. Randomness lives in PetState.rngState (mulberry32).
//
// Renderer contract notes:
// - state.x is where the pet is when the state starts; for walk/fadeTo/approach the target is cmd.toX and the
//   renderer reports "arrived". leaving ends at the edge; returning walks in from cmd.edge to RETURN_X[edge]
//   over (endsAt - enteredAt).
// - a "petted" earFlick emitted while hidden is a micro reaction; the state stays "hide".
// - delayMs > 0: play an ear twitch, then show the commands after delayMs (state times are already shifted).
import { mulberry32, type Rng } from "../game/rng";
import { isNight, partOfDay } from "../game/time";
import type {
  Ctx,
  DropZone,
  Edge,
  Effect,
  LineId,
  LineSet,
  PetCommand,
  PetInput,
  PetState,
  PetStateName,
} from "../shared/types";
import { lineFor } from "../talk/lines";
import { landingReaction, petReaction, rollDelay } from "./reactions";
import { ENERGY_BASELINE, PET_TIMING as T, RETURN_X, ZONE_BAND, ZONE_X } from "./timing";

export type StepResult = { state: PetState; commands: PetCommand[]; effects: Effect[]; delayMs: number };
type LongName = "rest" | "walk" | "sit";
type Weights = Partial<Record<LongName, number>>;
type Distance = "near" | "nearby" | "room";

type W = {
  s: PetState;
  plan: PetCommand[];
  rng: Rng;
  ctx: Ctx;
  now: number;
  cmds: PetCommand[];
  fx: Effect[];
  delay: number;
};

const OUTING_FLOW: ReadonlySet<PetStateName> = new Set(["leaving", "away", "returning", "gift"]);
/** States where Feed, Play, Talk, support chips and Put to bed are accepted (§5.1 "buttons"). */
const BUTTON_OK: ReadonlySet<PetStateName> = new Set([
  "rest", "walk", "sit", "transition", "sleep", "moment", "petted", "talk", "approach", "settle", "hide", "paused",
]);
const YAWN_OK: ReadonlySet<PetStateName> = new Set([
  "rest", "walk", "sit", "transition", "sleep", "petted", "talk", "approach", "settle", "hide",
]);
const TRANSITIONS = ["stretch", "yawn", "shake"] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---- geometry ----

function bounds(ctx: Ctx): [number, number] {
  const m = (T.walk.marginPx + T.walk.spriteHalfPx) / Math.max(1, ctx.stageWidthPx);
  return m >= 0.5 ? [0.5, 0.5] : [m, 1 - m];
}

/** The drop zone whose band contains x (nearest wins on overlap), or null. */
export function zoneAt(x: number, stageWidthPx: number): DropZone | null {
  const half = Math.max(ZONE_BAND.ratio * stageWidthPx, ZONE_BAND.minPx) / 2 / Math.max(1, stageWidthPx);
  let best: DropZone | null = null;
  let bestD = Infinity;
  for (const z of Object.keys(ZONE_X) as DropZone[]) {
    const d = Math.abs(x - ZONE_X[z]);
    if (d <= half && d < bestD) {
      best = z;
      bestD = d;
    }
  }
  return best;
}

export function inSupportWindow(ctx: Ctx): boolean {
  return ctx.now < ctx.supportWindowUntil;
}

/** R9 window end after a support action, comfort intent or the urgent card: the settle plus 2 minutes. */
export function supportWindowAfter(state: PetState, now: number): number {
  const settled = state.name === "approach" || state.name === "settle" ? (state.endsAt ?? now) : now;
  const queued = (state.plan ?? []).reduce((ms, c) => (c.kind === "settle" ? ms + c.ms : ms), 0);
  return Math.max(settled + queued, now) + T.supportWindowMs;
}

function nearestEdge(x: number): Edge {
  return x < 0.5 ? "left" : "right";
}

function walkSpeed(energy: number, rng: Rng): number {
  const f = energy < T.energy.lowBelow ? T.walk.slowFactor : energy > T.energy.highAbove ? T.walk.fastFactor : 1;
  return Math.round(rng.range(T.walk.minPxS, T.walk.maxPxS) * f);
}

function approachSpeed(pace: "slow" | "normal", energy: number): number {
  return pace === "slow" || energy < T.energy.lowBelow ? T.approach.slowPxS : T.approach.normalPxS;
}

/** A seeded walk target at least 15% of the stage away, inside the margins and reachable within the cap. */
function walkTarget(x: number, pxPerS: number, ctx: Ctx, rng: Rng): number {
  const [lo, hi] = bounds(ctx);
  const minD = T.walk.minDistRatio;
  const maxD = Math.max(minD, (pxPerS * T.walk.capMs * 0.85) / 1000 / Math.max(1, ctx.stageWidthPx));
  const left: [number, number] = [Math.max(lo, x - maxD), x - minD];
  const right: [number, number] = [x + minD, Math.min(hi, x + maxD)];
  const lLen = Math.max(0, left[1] - left[0]);
  const rLen = Math.max(0, right[1] - right[0]);
  if (lLen + rLen <= 0) return x - lo > hi - x ? lo : hi;
  const r = rng.next() * (lLen + rLen);
  return r < lLen ? left[0] + r : right[0] + (r - lLen);
}

/** A point min..max from the user anchor, preferring the pet's side; `mustReach` falls back to the farthest edge. */
function fromAnchor(w: W, range: readonly [number, number], mustReach: boolean): number {
  const [lo, hi] = bounds(w.ctx);
  const a = clamp(w.ctx.userAnchorX, 0, 1);
  const off = w.rng.range(range[0], range[1]);
  const prefer = w.s.x >= a ? 1 : -1;
  for (const o of [off, range[0]]) {
    for (const side of [prefer, -prefer]) {
      const t = a + side * o;
      if (t >= lo && t <= hi) return t;
    }
  }
  if (mustReach) return a - lo > hi - a ? lo : hi;
  return clamp(a + prefer * off, lo, hi);
}

// ---- durations and entering a state ----

function nameFor(cmd: PetCommand): PetStateName {
  switch (cmd.kind) {
    case "fadeTo":
      return "walk";
    case "decline":
      return "talk";
    case "outingLeave":
      return "leaving";
    case "outingReturn":
      return "returning";
    case "hold":
      return "paused";
    default:
      return cmd.kind;
  }
}

function durationOf(w: W, cmd: PetCommand): number | null {
  const W_ = Math.max(1, w.ctx.stageWidthPx);
  switch (cmd.kind) {
    case "rest":
    case "sit":
    case "transition":
    case "sleep":
    case "moment":
    case "eat":
    case "play":
    case "talk":
    case "settle":
    case "hide":
      return cmd.ms;
    case "walk":
      return Math.min(
        T.walk.capMs,
        Math.round((Math.abs(cmd.toX - w.s.x) * W_ * 1000) / cmd.pxPerS) + T.walk.arriveSlackMs,
      );
    case "fadeTo":
      return T.calmFadeMs;
    case "approach":
      return Math.min(
        T.walk.capMs,
        Math.round((Math.abs(cmd.toX - w.s.x) * W_ * 1000) / approachSpeed(cmd.pace, w.s.energy)) +
          T.approach.arriveSlackMs,
      );
    case "petted":
      return cmd.reaction === "slowBlink" ? T.petted.slowBlinkMs : w.rng.int(T.petted.minMs, T.petted.maxMs);
    case "fall":
      return T.fall.fallMs + T.fall.squashMs;
    case "decline":
      return T.decline.ms;
    case "outingLeave":
      return w.rng.int(T.leaving.minMs, T.leaving.maxMs);
    case "outingReturn":
      return w.rng.int(T.returning.minMs, T.returning.maxMs);
    case "held":
    case "away":
    case "gift":
    case "hold":
      return null;
  }
}

function begin(w: W, cmd: PetCommand): void {
  const s = w.s;
  const ms = durationOf(w, cmd);
  s.name = nameFor(cmd);
  s.cmd = cmd;
  s.enteredAt = w.now;
  s.endsAt = ms === null ? null : w.now + ms;
  if (cmd.kind === "rest") s.lastRestVariant = cmd.variant;
  if (cmd.kind === "hide") s.x = bounds(w.ctx)[cmd.edge === "left" ? 0 : 1];
  if (cmd.kind === "outingReturn") s.x = cmd.edge === "left" ? 0 : 1;
  w.cmds.push(cmd);
}

/** Apply time-based stat changes for the state that is ending, and settle x (§5.2). */
function closeOut(w: W, arrivedX?: number): void {
  const s = w.s;
  const end = s.endsAt === null ? w.now : Math.min(w.now, s.endsAt);
  const el = Math.max(0, end - s.enteredAt);
  const c = s.cmd;
  if (c.kind === "walk" || c.kind === "fadeTo" || c.kind === "approach") {
    if (arrivedX !== undefined) s.x = clamp(arrivedX, 0, 1);
    else if (c.kind === "fadeTo") s.x = c.toX;
    else {
      const speed = c.kind === "walk" ? c.pxPerS : approachSpeed(c.pace, s.energy);
      const moved = (speed * el) / 1000 / Math.max(1, w.ctx.stageWidthPx);
      const d = c.toX - s.x;
      s.x = s.x + Math.sign(d) * Math.min(Math.abs(d), moved);
    }
  }
  if (s.name === "leaving" && c.kind === "outingLeave") s.x = c.edge === "left" ? 0 : 1;
  if (s.name === "returning" && c.kind === "outingReturn") s.x = RETURN_X[c.edge];

  const ticks4 = Math.floor(el / 4000);
  const ticks10 = Math.floor(el / 10_000);
  switch (s.name) {
    case "rest":
    case "sleep":
    case "settle":
    case "hide":
      s.energy += ticks4 * T.energy.restPer4s;
      break;
    case "walk":
    case "approach":
    case "leaving":
    case "returning":
      s.energy += ticks4 * T.energy.walkPer4s;
      break;
  }
  if (s.name === "rest" || s.name === "sit") s.curiosity += ticks10 * T.curiosity.per10s;
  if (s.name === "walk") s.curiosity = T.curiosity.afterWalk;
  s.energy = clamp(s.energy, T.energy.min, T.energy.max);
  s.curiosity = clamp(s.curiosity, T.curiosity.min, T.curiosity.max);
}

// ---- long states ----

/** Base weights multiplied by the energy, curiosity and night factors (§5.2), not yet renormalised. */
export function longWeights(s: Pick<PetState, "energy" | "curiosity">, now: number, base: Weights): Weights {
  const f: Weights = { ...base };
  const mul = (k: LongName, m: number) => {
    if (f[k] !== undefined) f[k] = (f[k] as number) * m;
  };
  if (s.energy < T.energy.lowBelow) {
    mul("walk", T.energy.lowWalk);
    mul("rest", T.energy.lowRest);
  } else if (s.energy > T.energy.highAbove) {
    mul("walk", T.energy.highWalk);
    mul("rest", T.energy.highRest);
  }
  if (s.curiosity >= T.curiosity.highAt) {
    mul("walk", T.curiosity.highFactor);
    mul("sit", T.curiosity.highFactor);
  }
  if (isNight(now)) mul("rest", T.night.restFactor);
  return f;
}

function chooseLong(w: W, base: Weights): LongName {
  const f = longWeights(w.s, w.now, base);
  const items = (Object.keys(f) as LongName[]).filter((k) => (f[k] ?? 0) > 0).map((k) => [k, f[k] as number] as const);
  return w.rng.weighted(items);
}

function pickLine(w: W, set: LineSet): LineId {
  const id = lineFor(set, w.ctx.profile, partOfDay(w.now), w.rng, w.s.lastLineIds);
  w.s.lastLineIds = [...w.s.lastLineIds, id].slice(-T.lastLines);
  w.s.lastBubbleAt = w.now;
  return id;
}

function restCmd(w: W): PetCommand {
  const first = w.s.lastRestVariant < 0;
  const n = T.rest.variants;
  const last = w.s.lastRestVariant;
  const variant = n < 2 || last < 0 ? w.rng.int(0, n - 1) : (last + 1 + w.rng.int(0, n - 2)) % n;
  const ms = first ? w.rng.int(T.rest.firstMinMs, T.rest.firstMaxMs) : w.rng.int(T.rest.minMs, T.rest.maxMs);
  return { kind: "rest", variant, mirror: w.rng.next() < 0.5, ms };
}

function walkCmd(w: W, toX?: number): PetCommand {
  const pxPerS = walkSpeed(w.s.energy, w.rng);
  const target = toX ?? walkTarget(w.s.x, pxPerS, w.ctx, w.rng);
  return w.ctx.calm ? { kind: "fadeTo", toX: target } : { kind: "walk", toX: target, pxPerS };
}

function bubbleAllowed(w: W): boolean {
  return !w.ctx.calm && !inSupportWindow(w.ctx) && w.now - w.s.lastBubbleAt >= T.bubble.minGapMs;
}

/** The commands for a long state (sleep replaces rest after enough quiet rests; sit may open with an idle line). */
function buildLong(w: W, name: LongName): PetCommand[] {
  const s = w.s;
  if (name === "rest") {
    const limit = isNight(w.now) ? T.sleepAfterRestsNight : T.sleepAfterRests;
    if (s.restsInRow >= limit) {
      s.restsInRow = 0;
      return [{ kind: "sleep", ms: w.rng.int(T.sleep.minMs, T.sleep.maxMs) }];
    }
    s.restsInRow += 1;
    return [restCmd(w)];
  }
  if (name === "walk") return [walkCmd(w)];
  const sit: PetCommand = { kind: "sit", ms: w.rng.int(T.sit.minMs, T.sit.maxMs) };
  if (bubbleAllowed(w) && w.rng.next() < T.bubble.idleChance) {
    return [{ kind: "talk", lineId: pickLine(w, "idle"), ms: w.rng.int(T.talk.minMs, T.talk.maxMs) }, sit];
  }
  return [sit];
}

function transitionCmd(w: W, variant?: "stretch" | "yawn" | "shake" | "land" | "startle"): PetCommand {
  const v = variant ?? w.rng.pick(TRANSITIONS);
  const ms = v === "land" ? T.land.ms : w.rng.int(T.transition.minMs, T.transition.maxMs);
  return { kind: "transition", variant: v, ms };
}

/** Start a sequence now (its tail goes to the front of the plan). */
function run(w: W, seq: PetCommand[]): void {
  if (seq.length === 0) return;
  w.plan.unshift(...seq.slice(1));
  begin(w, seq[0]);
}

/** Enter a long state, with a transition first at p = 1/3 when allowed (§5.1). */
function goLong(w: W, name: LongName, allowTransition: boolean): void {
  const insert = allowTransition && w.rng.next() < T.transition.p;
  const seq = buildLong(w, name);
  run(w, insert ? [transitionCmd(w), ...seq] : seq);
}

function pickLong(w: W, base: Weights, allowTransition = true): void {
  goLong(w, chooseLong(w, base), allowTransition);
}

function resumeLong(w: W): void {
  const r = w.s.resume;
  w.s.resume = null;
  if (r) goLong(w, r, false);
  else pickLong(w, T.restExit, false);
}

/** The natural follow-up when the current state ends. */
function next(w: W): void {
  const queued = w.plan.shift();
  if (queued) {
    begin(w, queued);
    return;
  }
  const s = w.s;
  switch (s.name) {
    case "rest":
    case "settle":
      pickLong(w, T.restExit);
      return;
    case "walk":
      pickLong(w, T.walkExit);
      return;
    case "sit":
      pickLong(w, T.sitExit);
      return;
    case "transition":
      pickLong(w, T.restExit, false);
      return;
    case "sleep": {
      s.restsInRow = 0;
      const yawn = transitionCmd(w, "yawn");
      run(w, [yawn, ...buildLong(w, chooseLong(w, T.wakeExit))]);
      return;
    }
    case "petted":
    case "talk":
    case "moment":
      resumeLong(w);
      return;
    case "eat":
      goLong(w, "rest", true);
      return;
    case "play": {
      const t = transitionCmd(w);
      run(w, [t, ...buildLong(w, chooseLong(w, T.restExit))]);
      return;
    }
    case "hide":
      goLong(w, "sit", false);
      return;
    case "leaving":
      begin(w, { kind: "away" });
      return;
    case "fall":
    case "approach":
    case "returning":
    default:
      goLong(w, "rest", true);
  }
}

// ---- helpers for inputs ----

function markResume(w: W): void {
  const n = w.s.name;
  if (n === "rest" || n === "walk" || n === "sit") w.s.resume = n;
  else if (n === "petted" || n === "talk" || n === "transition" || n === "moment" || n === "paused") return;
  else w.s.resume = null;
}

/** A user interrupt: close the current state, remember what to resume, drop the plan, reset quiet rests. */
function interrupt(w: W): void {
  closeOut(w);
  markResume(w);
  w.plan = [];
  w.s.restsInRow = 0;
}

function zoneAllowed(zone: DropZone, ctx: Ctx): boolean {
  if (zone === "cushion") return ctx.unlocked.has("cushion");
  if (zone === "windowSeat") return ctx.unlocked.has("windowSeat");
  return true;
}

function zoneCmds(w: W, zone: DropZone): PetCommand[] {
  const z = T.zoneAction;
  switch (zone) {
    case "bed":
      return [{ kind: "sleep", ms: w.rng.int(z.bedSleep[0], z.bedSleep[1]) }];
    case "bowl":
      return [{ kind: "eat", snack: "crunchy", ms: z.bowlEatMs }];
    case "cushion":
      return [{ kind: "rest", variant: 0, mirror: false, ms: w.rng.int(z.cushionRest[0], z.cushionRest[1]) }];
    case "windowSeat":
      return [{ kind: "sit", ms: w.rng.int(z.windowSit[0], z.windowSit[1]) }];
  }
}

/** Approach the user anchor to a comfort distance, then settle (§5.1, §6.6). */
function settleAt(w: W, distance: Distance, ms: number, pace: "slow" | "normal"): void {
  const range = T.settle[distance];
  const toX = fromAnchor(w, range, distance === "room");
  const settle: PetCommand = { kind: "settle", distance, ms };
  if (Math.abs(toX - w.s.x) < 0.02) run(w, [settle]);
  else run(w, [{ kind: "approach", pace, toX }, settle]);
}

function comfortDistance(w: W): Distance {
  const c = w.ctx.profile.comfortStyle;
  return c === "close" ? "near" : c === "nearby" ? "nearby" : "room";
}

function settleMs(w: W): number {
  return w.rng.int(T.settle.minMs, T.settle.maxMs);
}

function narrate(w: W, textId: string): void {
  w.fx.push({ type: "narrate", textId });
}

/** Run a button action; from Pause pet, return to the held pose afterwards. */
function button(w: W, act: () => void): void {
  const wasPaused = w.s.name === "paused";
  interrupt(w);
  act();
  if (wasPaused) w.plan.push({ kind: "hold" });
}

function doSupport(w: W, intent: "come_closer" | "comfort" | "rest"): void {
  const style = w.ctx.profile.comfortStyle;
  if (intent === "come_closer") {
    if (style === "space") {
      settleAt(w, "room", settleMs(w), "slow");
      narrate(w, "comeCloserSpace");
    } else {
      settleAt(w, "near", settleMs(w), "normal");
      narrate(w, "comeCloser");
    }
  } else if (intent === "comfort") {
    const d = comfortDistance(w);
    settleAt(w, d, settleMs(w), "normal");
    narrate(w, d === "near" ? "comfortNear" : d === "nearby" ? "comfortNearby" : "comfortRoom");
  } else {
    settleAt(w, style === "space" ? "room" : "near", T.settle.quietMs, "normal");
    narrate(w, "quietTime");
  }
}

function doFeed(w: W, snack: Extract<PetInput, { t: "feed" }>["snack"]): void {
  const s = w.s;
  s.feedTimes = s.feedTimes.filter((t) => w.now - t < T.feed.windowMs);
  if (s.feedTimes.length >= T.feed.maxInWindow) {
    if (inSupportWindow(w.ctx)) settleAt(w, "near", settleMs(w), "normal");
    else run(w, [{ kind: "decline", reason: "full", lineId: pickLine(w, "decline_full") }]);
    return;
  }
  s.feedTimes = [...s.feedTimes, w.now];
  s.energy = clamp(s.energy + T.energy.feed, T.energy.min, T.energy.max);
  run(w, [{ kind: "eat", snack, ms: w.rng.int(T.eat.minMs, T.eat.maxMs) }]);
  w.fx.push({ type: "bond", source: "feed" });
}

function doPlay(w: W): void {
  const s = w.s;
  const tooMuch = w.ctx.profile.trigger === "too_much_energy";
  if (w.ctx.firstPlayDone) {
    const reason = w.now < s.playCooldownUntil ? "cooldown" : s.energy < T.play.tiredBelow ? "tired" : null;
    if (reason) {
      if (inSupportWindow(w.ctx)) settleAt(w, "near", settleMs(w), "normal");
      else run(w, [{ kind: "decline", reason, lineId: pickLine(w, reason === "cooldown" ? "decline_cooldown" : "decline_tired") }]);
      return;
    }
  }
  const ms = tooMuch ? T.play.triggerMs : w.rng.int(T.play.minMs, T.play.maxMs);
  s.energy = clamp(s.energy + T.energy.play, T.energy.min, T.energy.max);
  s.playCooldownUntil = w.now + ms + (tooMuch ? T.play.triggerCooldownMs : T.play.cooldownMs);
  run(w, [{ kind: "play", toy: w.ctx.profile.species === "dog" ? "rope" : "wand", ms }]);
  w.fx.push({ type: "bond", source: "play" });
  narrate(w, "playStart");
}

function doPet(w: W): void {
  const s = w.s;
  const wasPlaying = s.name === "play";
  interrupt(w);
  if (wasPlaying) s.playCooldownUntil = w.now + (w.ctx.profile.trigger === "too_much_energy" ? T.play.triggerCooldownMs : T.play.cooldownMs);
  s.petTimes = [...s.petTimes.filter((t) => w.now - t < T.overPet.windowMs), w.now];
  const r = petReaction(w.ctx.profile, s.petTimes, w.now, inSupportWindow(w.ctx), w.rng);
  w.delay = r.delayMs;
  switch (r.overPetting) {
    case "hide":
      s.resume = null;
      run(w, [{ kind: "hide", edge: nearestEdge(s.x), ms: w.rng.int(T.hide.minMs, T.hide.maxMs) }]);
      narrate(w, "hide");
      return;
    case "walkAway": {
      s.resume = null;
      run(w, [walkCmd(w, fromAnchor(w, T.walkAway, true)), { kind: "sit", ms: w.rng.int(T.sit.minMs, T.sit.maxMs) }]);
      narrate(w, "walkAway");
      return;
    }
    case "slowBlink":
      run(w, [{ kind: "petted", reaction: "slowBlink", hearts: 0 }]);
      return;
    case "stay":
      run(w, [{ kind: "petted", reaction: "earFlick", hearts: 0 }]);
      return;
  }
  let hearts: 0 | 1 | 2 | 3 = 0;
  if (r.reaction !== "earFlick") {
    let chain = 1;
    for (let k = s.petTimes.length - 1; k > 0 && chain < T.petted.maxHearts; k -= 1) {
      if (s.petTimes[k] - s.petTimes[k - 1] <= T.petted.chainMs) chain += 1;
      else break;
    }
    hearts = chain as 1 | 2 | 3;
    w.fx.push({ type: "bond", source: "pet" });
  }
  run(w, [{ kind: "petted", reaction: r.reaction, hearts }]);
}

function doTalk(w: W, intent: Extract<PetInput, { t: "talk" }>["intent"]): void {
  const set: LineSet = intent === "day" ? "homeStory" : intent;
  const talk: PetCommand = { kind: "talk", lineId: pickLine(w, set), ms: w.rng.int(T.talk.minMs, T.talk.maxMs) };
  if (intent === "goodnight") run(w, [talk, { kind: "sleep", ms: w.rng.int(T.sleep.minMs, T.sleep.maxMs) }]);
  else run(w, [talk]);
  if (intent === "greet" || intent === "day" || intent === "goodnight") w.fx.push({ type: "bond", source: "talk" });
}

// ---- public API ----

export function initPet(
  seed: number,
  now: number,
  ctx: Ctx,
): { state: PetState; commands: PetCommand[]; greeting: LineId } {
  const rng = mulberry32(seed);
  const [lo, hi] = bounds(ctx);
  const s: PetState = {
    name: "transition",
    cmd: { kind: "hold" },
    enteredAt: now,
    endsAt: null,
    resume: null,
    x: lo + rng.next() * (hi - lo),
    energy: ENERGY_BASELINE[ctx.profile.energy],
    curiosity: T.curiosity.initial,
    restsInRow: 0,
    longsSinceMoment: 0,
    lastMomentAt: 0,
    lastRestVariant: -1,
    petTimes: [],
    feedTimes: [],
    playCooldownUntil: 0,
    lastBubbleAt: now,
    lastLineIds: [],
    rngState: 0,
    plan: [],
  };
  const w: W = { s, plan: [], rng, ctx, now, cmds: [], fx: [], delay: 0 };
  // Startup: always a transition, then a walk so the pet visibly moves within ~3 s (§5.1).
  run(w, [transitionCmd(w), walkCmd(w)]);
  const greeting = pickLine(w, "greeting"); // the session greeting counts as the first unprompted bubble
  s.plan = w.plan;
  s.rngState = rng.state();
  return { state: s, commands: w.cmds, greeting };
}

/** Pure. Same (state, input, ctx) always yields the same output. */
export function step(prev: PetState, i: PetInput, ctx: Ctx): StepResult {
  const noop: StepResult = { state: prev, commands: [], effects: [], delayMs: 0 };
  const name = prev.name;
  const now = ctx.now;
  const s: PetState = {
    ...prev,
    petTimes: [...prev.petTimes],
    feedTimes: [...prev.feedTimes],
    lastLineIds: [...prev.lastLineIds],
  };
  const w: W = { s, plan: [...(prev.plan ?? [])], rng: mulberry32(prev.rngState), ctx, now, cmds: [], fx: [], delay: 0 };
  const flow = OUTING_FLOW.has(name);

  switch (i.t) {
    case "tick":
      if (prev.endsAt === null || now < prev.endsAt) return noop;
      closeOut(w);
      next(w);
      break;

    case "arrived":
      if (name !== "walk" && name !== "approach") return noop;
      closeOut(w, i.x);
      next(w);
      break;

    case "pet":
      if (name === "paused") {
        narrate(w, "pausedPet");
        break;
      }
      if (name === "hide") {
        w.cmds.push({ kind: "petted", reaction: "earFlick", hearts: 0 });
        break;
      }
      if (name === "sleep") {
        // Wakes with a yawn: no hearts, no Bond.
        interrupt(w);
        run(w, [transitionCmd(w, "yawn"), ...buildLong(w, chooseLong(w, T.wakeExit))]);
        break;
      }
      if (!BUTTON_OK.has(name) && name !== "play") return noop;
      doPet(w);
      break;

    case "dragStart":
      if (flow || name === "held" || name === "paused") return noop;
      interrupt(w);
      begin(w, { kind: "held" });
      break;

    case "dragCancel":
      if (name !== "held") return noop;
      run(w, [transitionCmd(w, "land"), ...buildLong(w, s.resume ?? "rest")]);
      s.resume = null;
      break;

    case "dragEnd": {
      if (name !== "held") return noop;
      s.x = clamp(i.x, 0, 1);
      const zone = i.zone && zoneAllowed(i.zone, ctx) ? i.zone : null;
      const r = landingReaction(ctx.profile, i.speedPxS, zone, inSupportWindow(ctx), w.rng);
      const out: PetCommand[] = [];
      if (zone) {
        s.x = ZONE_X[zone];
        out.push(...zoneCmds(w, zone));
      } else {
        if (r.startle) out.push(transitionCmd(w, "startle"));
        if (r.action === "hide") {
          out.push({ kind: "hide", edge: nearestEdge(s.x), ms: w.rng.int(T.hide.minMs, T.hide.maxMs) });
          narrate(w, "hide");
        } else {
          out.push(transitionCmd(w, "land"), ...buildLong(w, "rest"));
        }
      }
      s.resume = null;
      run(w, ctx.calm ? out : [{ kind: "fall" }, ...out]);
      break;
    }

    case "sendTo":
      if (!BUTTON_OK.has(name) || !zoneAllowed(i.zone, ctx)) return noop;
      button(w, () => {
        const zx = ZONE_X[i.zone];
        const act = zoneCmds(w, i.zone);
        run(w, Math.abs(zx - s.x) < 0.02 ? act : [walkCmd(w, zx), ...act]);
      });
      break;

    case "feed":
      if (!BUTTON_OK.has(name)) return noop;
      button(w, () => doFeed(w, i.snack));
      w.delay = rollDelay(w.rng);
      break;

    case "play":
      if (!BUTTON_OK.has(name)) return noop;
      button(w, () => doPlay(w));
      w.delay = rollDelay(w.rng);
      break;

    case "talk": {
      const support = i.intent === "come_closer" || i.intent === "comfort" || i.intent === "rest";
      if (name === "leaving" || name === "away" || name === "returning") {
        narrate(w, support ? "supportAway" : "out");
        break;
      }
      if (!BUTTON_OK.has(name)) return noop;
      if (support) button(w, () => doSupport(w, i.intent as "come_closer" | "comfort" | "rest"));
      else if (i.intent === "play") button(w, () => doPlay(w));
      else button(w, () => doTalk(w, i.intent));
      w.delay = rollDelay(w.rng);
      break;
    }

    case "support":
      if (name === "leaving" || name === "away" || name === "returning") {
        narrate(w, "supportAway");
        break;
      }
      if (!BUTTON_OK.has(name)) return noop;
      button(w, () => doSupport(w, i.intent));
      w.delay = rollDelay(w.rng);
      break;

    case "careStart":
      if (!BUTTON_OK.has(name)) return noop;
      button(w, () => settleAt(w, comfortDistance(w), settleMs(w), "normal"));
      break;

    case "outingStart":
      if (flow || name === "held" || name === "fall") return noop;
      interrupt(w);
      s.resume = null;
      if (now - i.outing.startedAt > T.leaving.maxMs) {
        s.x = nearestEdge(s.x) === "left" ? 0 : 1;
        begin(w, { kind: "away" }); // reload during an outing: already out
      } else begin(w, { kind: "outingLeave", edge: nearestEdge(s.x) });
      break;

    case "outingEnd":
      if (name === "leaving" || name === "away") {
        closeOut(w);
        w.plan = ctx.gamificationPaused ? [] : [{ kind: "gift", reward: i.reward }];
        begin(w, { kind: "outingReturn", edge: w.rng.next() < 0.5 ? "left" : "right" });
        break;
      }
      // Pet already home (resolved on load). During the urgent pause the gift waits in pendingGift.
      if (name === "returning" || name === "gift" || name === "held" || name === "fall" || ctx.gamificationPaused) {
        return noop;
      }
      interrupt(w);
      s.resume = null;
      begin(w, { kind: "gift", reward: i.reward });
      break;

    case "giftDismissed":
      if (name !== "gift") return noop;
      closeOut(w);
      run(w, [transitionCmd(w), ...buildLong(w, "rest")]);
      break;

    case "setPaused":
      if (i.on) {
        if (flow || name === "held" || name === "fall" || name === "paused") return noop;
        closeOut(w);
        markResume(w);
        w.plan = [];
        begin(w, { kind: "hold" });
      } else {
        w.plan = w.plan.filter((c) => c.kind !== "hold");
        if (name !== "paused") break;
        resumeLong(w);
      }
      break;

    case "visible":
      if (i.hiddenMs <= T.visibleYawnAfterMs || !YAWN_OK.has(name)) return noop;
      closeOut(w);
      markResume(w);
      w.plan = [];
      run(w, [transitionCmd(w, "yawn"), ...buildLong(w, chooseLong(w, T.restExit))]);
      break;

    case "urgent": {
      // Never delayed, never logged, no bubbles: settle at a comfort distance (§6.8).
      if (flow || name === "held" || name === "fall" || name === "paused") return noop;
      interrupt(w);
      s.resume = null;
      settleAt(w, comfortDistance(w), T.settle.quietMs, "normal");
      break;
    }
  }

  if (w.delay > 0 && w.cmds.length > 0) {
    s.enteredAt += w.delay;
    if (s.endsAt !== null) s.endsAt += w.delay;
  } else w.delay = 0;
  s.plan = w.plan;
  s.rngState = w.rng.state();
  return { state: s, commands: w.cmds, effects: w.fx, delayMs: w.delay };
}

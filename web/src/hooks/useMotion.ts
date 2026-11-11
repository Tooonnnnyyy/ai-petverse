// Renderer motion (spec §10.2): requestAnimationFrame only while the pet moves; px/s by elapsed time;
// walk frames advance on distance; reports arrival for walk / fadeTo / approach.
// Writes transforms straight to the DOM so a moving pet does not re-render the room each frame.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { PetState } from "../shared/types";
import { PET_TIMING as T, RETURN_X } from "../pet/timing";

type Plan =
  | { k: "idle" }
  | { k: "line"; to: number; pxS: number; report: boolean; start: number }
  | { k: "timed"; from: number; to: number; start: number; end: number; fade: "in" | "out" | null }
  | { k: "fade"; to: number; start: number; jumped: boolean }
  | { k: "drag" }
  | { k: "fall"; fromY: number; toX: number; fromX: number; start: number }
  | { k: "chase"; start: number };

const STRIDE_PX = 22; // one walk frame per this many px
const CHASE_PXS = 110;
const POUNCE_PX = 24;
const OFF = 0.12; // how far past the edge leaving/returning starts or ends (ratio)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type Motion = {
  frame: number;
  facing: 1 | -1;
  getX: () => number;
  setDragTarget: (x: number, y: number) => void;
  nudge: (dxPx: number) => void;
};

export function useMotion(o: {
  state: PetState;
  stageW: number;
  size: number;
  calm: boolean;
  moverRef: RefObject<HTMLDivElement | null>;
  tiltRef: RefObject<HTMLDivElement | null>;
  getWandX: () => number;
  onArrived: (x: number) => void;
  onPounce: () => void;
}): Motion {
  const opts = useRef(o);
  opts.current = o;
  const x = useRef(o.state.x);
  const y = useRef(0);
  const tilt = useRef(0);
  const target = useRef({ x: o.state.x, y: 0 });
  const plan = useRef<Plan>({ k: "idle" });
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const dist = useRef(0);
  const lastPounce = useRef(0);
  const prevName = useRef(o.state.name);
  const [frame, setFrame] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const facingRef = useRef<1 | -1>(1);

  const face = (d: number) => {
    const f: 1 | -1 = d < 0 ? -1 : 1;
    if (d !== 0 && f !== facingRef.current) {
      facingRef.current = f;
      setFacing(f);
    }
  };

  const paint = useCallback(() => {
    const { stageW, size, moverRef, tiltRef } = opts.current;
    const el = moverRef.current;
    if (el) el.style.transform = `translate3d(${(x.current * stageW - size / 2).toFixed(1)}px, ${(-y.current).toFixed(1)}px, 0)`;
    const t = tiltRef.current;
    if (t) t.style.transform = tilt.current ? `rotate(${tilt.current.toFixed(2)}deg)` : "";
  }, []);

  const setOpacity = (v: string) => {
    const el = opts.current.moverRef.current;
    if (el) el.style.opacity = v;
  };

  const advance = (px: number) => {
    dist.current += px;
    if (dist.current >= STRIDE_PX) {
      dist.current %= STRIDE_PX;
      setFrame((f) => f + 1);
    }
  };

  const loop = useCallback((ts: number) => {
    raf.current = null;
    const now = Date.now();
    const dt = last.current ? Math.min(0.05, (ts - last.current) / 1000) : 0;
    last.current = ts;
    const W = Math.max(1, opts.current.stageW);
    const p = plan.current;
    let keep = true;
    switch (p.k) {
      case "idle":
        keep = false;
        break;
      case "line": {
        if (now < p.start) break;
        const d = p.to - x.current;
        const step = (p.pxS * dt) / W;
        face(d);
        if (Math.abs(d) <= step) {
          x.current = p.to;
          plan.current = { k: "idle" };
          keep = false;
          if (p.report) opts.current.onArrived(p.to);
        } else {
          x.current += Math.sign(d) * step;
          advance(step * W);
        }
        break;
      }
      case "timed": {
        if (now < p.start) break;
        const t = clamp((now - p.start) / Math.max(1, p.end - p.start), 0, 1);
        if (p.fade) setOpacity(String(p.fade === "out" ? 1 - t : t));
        else {
          const nx = p.from + (p.to - p.from) * t;
          advance(Math.abs(nx - x.current) * W);
          x.current = nx;
        }
        if (t >= 1) {
          plan.current = { k: "idle" };
          keep = false;
        }
        break;
      }
      case "fade": {
        const e = now - p.start;
        if (e < 0) break;
        if (e < 200) setOpacity(String(1 - e / 200));
        else if (!p.jumped) {
          p.jumped = true;
          face(p.to - x.current);
          x.current = p.to;
        } else if (e < 400) setOpacity(String((e - 200) / 200));
        else {
          setOpacity("1");
          plan.current = { k: "idle" };
          keep = false;
          opts.current.onArrived(p.to);
        }
        break;
      }
      case "drag": {
        const nx = x.current + (target.current.x - x.current) * 0.35;
        const vx = dt > 0 ? ((nx - x.current) * W) / dt : 0;
        x.current = nx;
        y.current += (target.current.y - y.current) * 0.35;
        tilt.current = clamp(vx / 60, -12, 12);
        face(vx);
        break;
      }
      case "fall": {
        const t = clamp((now - p.start) / T.fall.fallMs, 0, 1);
        y.current = p.fromY * (1 - t * t);
        x.current = p.fromX + (p.toX - p.fromX) * t;
        tilt.current *= 0.8;
        if (t >= 1) {
          y.current = 0;
          tilt.current = 0;
          plan.current = { k: "idle" };
          keep = false;
        }
        break;
      }
      case "chase": {
        if (now < p.start) break;
        const wx = clamp(opts.current.getWandX(), 0.05, 0.95);
        const d = wx - x.current;
        const step = Math.min(Math.abs(d) * 0.08, (CHASE_PXS * dt) / W);
        face(d);
        x.current += Math.sign(d) * step;
        advance(step * W);
        if (Math.abs(d) * W < POUNCE_PX && now - lastPounce.current > 900) {
          lastPounce.current = now;
          opts.current.onPounce();
        }
        break;
      }
    }
    paint();
    if (keep) raf.current = requestAnimationFrame(loop);
    else last.current = 0;
  }, [paint]);

  const kick = useCallback(() => {
    if (raf.current === null) {
      last.current = 0;
      raf.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  // New state → new plan.
  useLayoutEffect(() => {
    const s = o.state;
    const c = s.cmd;
    const W = Math.max(1, o.stageW);
    const prev = prevName.current;
    const fromHeld = prev === "held";
    prevName.current = s.name;
    const start = s.enteredAt;
    if (s.name !== "held") tilt.current = 0;
    setOpacity(s.name === "away" ? "0" : "1");
    let p: Plan = { k: "idle" };
    switch (s.name) {
      case "walk":
        if (c.kind === "fadeTo") p = { k: "fade", to: c.toX, start, jumped: false };
        else if (c.kind === "walk") p = { k: "line", to: c.toX, pxS: c.pxPerS, report: true, start };
        break;
      case "approach":
        if (c.kind === "approach") {
          const pxS = c.pace === "slow" || s.energy < T.energy.lowBelow ? T.approach.slowPxS : T.approach.normalPxS;
          p = { k: "line", to: c.toX, pxS, report: true, start };
        }
        break;
      case "leaving":
        if (c.kind === "outingLeave") {
          const to = c.edge === "left" ? -OFF : 1 + OFF;
          p = o.calm
            ? { k: "timed", from: x.current, to: x.current, start, end: s.endsAt ?? start + 1000, fade: "out" }
            : { k: "timed", from: x.current, to, start, end: s.endsAt ?? start + 4000, fade: null };
          face(to - x.current);
        }
        break;
      case "returning":
        if (c.kind === "outingReturn") {
          const to = RETURN_X[c.edge];
          const from = c.edge === "left" ? -OFF : 1 + OFF;
          if (o.calm) {
            x.current = to;
            setOpacity("0");
            p = { k: "timed", from: to, to, start, end: start + 600, fade: "in" };
          } else {
            x.current = from;
            p = { k: "timed", from, to, start, end: s.endsAt ?? start + 4000, fade: null };
          }
          face(to - from);
        }
        break;
      case "hide":
        p = { k: "line", to: s.x, pxS: 260, report: false, start };
        break;
      case "held":
        target.current = { x: x.current, y: Math.max(y.current, o.size * 0.25) };
        p = { k: "drag" };
        break;
      case "fall":
        p = { k: "fall", fromY: y.current, fromX: x.current, toX: s.x, start: Date.now() };
        break;
      case "play":
        p = { k: "chase", start };
        break;
      default:
        if (fromHeld) {
          // calm drop: no fall, settle onto the drop position
          y.current = 0;
          x.current = s.x;
        } else if (prev === "fall" || Math.abs(s.x - x.current) * W > 2) {
          // zone drops and hides set x; glide there rather than jump
          if (c.kind !== "hold") p = { k: "line", to: s.x, pxS: 300, report: false, start: Date.now() };
        }
        y.current = 0;
    }
    plan.current = p;
    paint();
    if (p.k !== "idle") kick();
    // state identity is the trigger; other inputs are read through opts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.state]);

  // Repaint on resize.
  useLayoutEffect(() => {
    paint();
  }, [o.stageW, o.size, paint]);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  return {
    frame,
    facing,
    getX: () => x.current,
    setDragTarget: (tx: number, ty: number) => {
      target.current = { x: clamp(tx, 0.02, 0.98), y: Math.max(0, ty) };
      if (plan.current.k === "drag") kick();
    },
    nudge: (dxPx: number) => {
      const W = Math.max(1, opts.current.stageW);
      target.current = { x: clamp(target.current.x + dxPx / W, 0.04, 0.96), y: Math.max(target.current.y, opts.current.size * 0.2) };
      if (plan.current.k === "drag") kick();
    },
  };
}

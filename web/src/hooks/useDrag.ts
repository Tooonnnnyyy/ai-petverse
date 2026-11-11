// Drag the pet (spec §6.2): pointer capture, 6 px threshold, release velocity, drop-zone hit test.
// A press that never crosses the threshold is left to the button's click (a tap = pet).
import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { DropZone } from "../shared/types";
import { zoneAt } from "../pet/machine";

const THRESHOLD_PX = 6;

export type DragHandlers = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  /** True right after a drag, so the click that follows is not a pet. */
  consumeClick: () => boolean;
};

export function useDrag(o: {
  stageRef: RefObject<HTMLElement | null>;
  floorY: () => number; // px from the stage top to the floor line
  /** Ask the engine to pick the pet up; false when the pet cannot be held now. */
  start: () => boolean;
  move: (xRatio: number, liftPx: number) => void;
  end: (xRatio: number, speedPxS: number, zone: DropZone | null) => void;
  cancel: () => void;
  getX: () => number;
  onHover?: (zone: DropZone | null) => void;
}): DragHandlers {
  const opts = useRef(o);
  opts.current = o;
  const down = useRef<{ id: number; x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const samples = useRef<{ t: number; x: number; y: number }[]>([]);
  const suppress = useRef(false);
  const lastX = useRef(0.5);

  const local = (e: ReactPointerEvent<HTMLElement>) => {
    const r = opts.current.stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 0.5, lift: 0, px: 0, py: 0, w: 1 };
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    return { x: px / Math.max(1, r.width), lift: opts.current.floorY() - py, px, py, w: r.width };
  };

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    down.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    dragging.current = false;
    suppress.current = false;
    samples.current = [];
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const d = down.current;
    if (!d || d.id !== e.pointerId) return;
    if (!dragging.current) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) <= THRESHOLD_PX) return;
      if (!opts.current.start()) {
        down.current = null;
        return;
      }
      dragging.current = true;
      suppress.current = true;
      lastX.current = opts.current.getX();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // capture is best effort
      }
    }
    const p = local(e);
    // the pointer holds the pet by its middle: lift so the paws hang below the pointer
    lastX.current = Math.min(0.98, Math.max(0.02, p.x));
    opts.current.move(p.x, Math.max(0, p.lift - 40));
    const now = performance.now();
    samples.current = [...samples.current.filter((s) => now - s.t < 100), { t: now, x: p.px, y: p.py }];
    opts.current.onHover?.(zoneAt(lastX.current, p.w));
  }, []);

  const finish = useCallback((e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const d = down.current;
    down.current = null;
    if (!d || d.id !== e.pointerId || !dragging.current) return;
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    opts.current.onHover?.(null);
    if (cancelled) {
      opts.current.cancel();
      return;
    }
    const s = samples.current;
    let speed = 0;
    if (s.length >= 2) {
      const a = s[0];
      const b = s[s.length - 1];
      const dt = (b.t - a.t) / 1000;
      if (dt > 0) speed = Math.hypot(b.x - a.x, b.y - a.y) / dt;
    }
    const w = opts.current.stageRef.current?.getBoundingClientRect().width ?? 1;
    // drop where the pointer is (the pet lags behind it by a lerp)
    const x = lastX.current;
    opts.current.end(x, speed, zoneAt(x, w));
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e) => finish(e, false),
    onPointerCancel: (e) => finish(e, true),
    consumeClick: () => {
      const v = suppress.current;
      suppress.current = false;
      return v;
    },
  };
}

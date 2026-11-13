// The cozy room (spec §9.1 Stage): wall, window, floor, props, drop zones, the pet and its overlays.
// Bounds come from a ResizeObserver; the pet's floor anchor (y = 450 of 512) sits on the floor line.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MutableRefObject, type ReactNode } from "react";
import type { DropZone, EffectiveProfile, PetState, UnlockId } from "../shared/types";
import { Bed, Bowl, Cushion, FeatherWand, PROP_SIZE, RopeToy, Window, WindowSeat, type PropId } from "../art/props";
import { ZONE_X } from "../pet/timing";
import { zoneAt } from "../pet/machine";
import { useMotion, type Motion } from "../hooks/useMotion";
import { useDrag } from "../hooks/useDrag";
import { lookFor } from "./pose";
import { PetSprite } from "./PetSprite";
import { Bubble, type BubbleData } from "./Bubble";
import { Hearts, type Float } from "./Hearts";
import { DropZones } from "./DropZones";

const FLOOR = 0.8; // floor line as a ratio of stage height
const ANCHOR = 450 / 512;
const KEY_STEP_PX = 24;

export type StageProps = {
  state: PetState;
  profile: EffectiveProfile;
  calm: boolean;
  unlocked: ReadonlySet<UnlockId>;
  label: string;
  bubble: BubbleData | null;
  floats: Float[];
  juice: number;
  twitch: boolean;
  motionRef: MutableRefObject<Motion | null>;
  stageLabel: string;
  onWidth: (w: number) => void;
  onPointerX: (x: number) => void;
  onArrived: (x: number) => void;
  onPet: () => void;
  onDragStart: () => boolean;
  onDragEnd: (x: number, speedPxS: number, zone: DropZone | null) => void;
  onDragCancel: () => void;
  onPounce: () => void;
  photoSrc?: string | null;
  overlay?: ReactNode;
  cards?: ReactNode;
};

function Prop({ id, x, size, floorY, children, className }: { id: PropId; x: number; size: number; floorY: number; children: ReactNode; className?: string }) {
  const [w, h] = PROP_SIZE[id];
  const pw = (w / 512) * size;
  const ph = (pw * (h + 6)) / (w + 12);
  return (
    <div className={`room-prop prop-${id}${className ? ` ${className}` : ""}`} style={{ left: x - pw / 2, top: floorY - ph + 2, width: pw }}>
      {children}
    </div>
  );
}

export function Stage(p: StageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const moverRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const wandRef = useRef<HTMLDivElement | null>(null);
  const petRef = useRef<HTMLButtonElement | null>(null);
  const [dims, setDims] = useState({ w: 800, h: 400 });
  const [hover, setHover] = useState<DropZone | null>(null);
  const [kbHeld, setKbHeld] = useState(false);
  const pointer = useRef({ x: 0.5, at: 0, touch: false });
  const playStart = useRef({ at: 0, x: 0.5 });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDims({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
      p.onWidth(r.width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const W = dims.w;
  const floorY = dims.h * FLOOR;
  const size = Math.round(Math.max(110, Math.min(W * (W < 560 ? 0.34 : 0.2), dims.h * 0.5, 210)));
  const s = p.state;

  if (s.name === "play" && playStart.current.at !== s.enteredAt) playStart.current = { at: s.enteredAt, x: s.x };

  // The wand follows a recent mouse/pen pointer; on touch, keyboard or an idle pointer it wiggles by itself.
  const getWandX = () => {
    const now = Date.now();
    const ptr = pointer.current;
    let x: number;
    if (!ptr.touch && now - ptr.at < 3000) x = ptr.x;
    else {
      const t = (now - playStart.current.at) / 1000;
      x = playStart.current.x + 0.22 * Math.sin(t * 1.4) + 0.06 * Math.sin(t * 4.1);
    }
    x = Math.min(0.94, Math.max(0.06, x));
    const el = wandRef.current;
    if (el) el.style.transform = `translate3d(${(x * W).toFixed(1)}px, 0, 0) rotate(${(Math.sin(now / 160) * 8).toFixed(1)}deg)`;
    return x;
  };

  const motion = useMotion({
    state: s,
    stageW: W,
    size,
    calm: p.calm,
    moverRef,
    tiltRef,
    getWandX,
    onArrived: p.onArrived,
    onPounce: p.onPounce,
  });
  p.motionRef.current = motion;

  const drag = useDrag({
    stageRef,
    floorY: () => floorY,
    start: p.onDragStart,
    move: (x, lift) => motion.setDragTarget(x, lift),
    end: (x, speed, zone) => p.onDragEnd(x, speed, zone),
    cancel: p.onDragCancel,
    getX: motion.getX,
    onHover: setHover,
  });

  useEffect(() => {
    if (s.name !== "held") {
      setKbHeld(false);
      setHover(null);
    }
  }, [s.name]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (!kbHeld) {
        if (s.name === "held" || !p.onDragStart()) return;
        setKbHeld(true);
      }
      motion.nudge(e.key === "ArrowLeft" ? -KEY_STEP_PX : KEY_STEP_PX);
      window.setTimeout(() => setHover(zoneAt(motion.getX(), W)), 220);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (kbHeld) {
        const x = motion.getX();
        p.onDragEnd(x, 0, zoneAt(x, W));
      } else p.onPet();
    } else if (e.key === "Escape" && kbHeld) {
      e.preventDefault();
      p.onDragCancel();
    }
  };

  // Pause holds the current pose; a delayed reaction (ear twitch first) keeps the old pose until it starts.
  const lastLook = useRef(lookFor(s));
  const delayed = s.enteredAt > Date.now();
  const look = s.name === "paused" || delayed ? lastLook.current : lookFor(s);
  if (!delayed && s.name !== "paused") lastLook.current = look;
  const [, rerender] = useState(0);
  useEffect(() => {
    const d = s.enteredAt - Date.now();
    if (d <= 0) return;
    const id = window.setTimeout(() => rerender((n) => n + 1), d + 5);
    return () => window.clearTimeout(id);
  }, [s]);
  const held = s.name === "held";
  const zones: DropZone[] = ["bed", "bowl", ...(p.unlocked.has("cushion") ? (["cushion"] as const) : []), ...(p.unlocked.has("windowSeat") ? (["windowSeat"] as const) : [])];
  const eating = s.name === "eat";
  const atBowl = Math.abs(s.x - ZONE_X.bowl) < 0.07;
  const showRoomBowl = !eating || atBowl;
  const facing = motion.facing;

  return (
    <div
      ref={stageRef}
      className={`stage${held ? " holding" : ""}`}
      role="region"
      aria-label={p.stageLabel}
      onPointerMove={(e) => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return;
        const x = (e.clientX - r.left) / Math.max(1, r.width);
        pointer.current = { x, at: Date.now(), touch: e.pointerType === "touch" };
        p.onPointerX(x);
      }}
    >
      <div className="wall" />
      <div className="wall-art" style={{ left: W * 0.36, top: floorY * 0.18, width: Math.max(56, size * 0.5), height: Math.max(44, size * 0.38) }} aria-hidden="true" />
      <div className="wall-shelf" style={{ left: W * 0.08, top: floorY * 0.36, width: Math.max(70, size * 0.7) }} aria-hidden="true"><i /><i /><i /></div>
      <div className="floor" style={{ top: floorY }} />
      <div className="room-prop prop-window" style={{ left: ZONE_X.windowSeat * W - size * 0.28, top: Math.max(8, floorY - size * 1.62), width: size * 0.56 }}>
        <Window />
      </div>
      {p.unlocked.has("windowSeat") && (
        <Prop id="windowSeat" x={ZONE_X.windowSeat * W} size={size} floorY={floorY}><WindowSeat /></Prop>
      )}
      <Prop id="bed" x={ZONE_X.bed * W} size={size} floorY={floorY}><Bed /></Prop>
      {showRoomBowl && <Prop id="bowl" x={ZONE_X.bowl * W} size={size} floorY={floorY}><Bowl full={eating && atBowl} /></Prop>}
      {p.unlocked.has("cushion") && (
        <Prop id="cushion" x={ZONE_X.cushion * W} size={size} floorY={floorY} className="pop-in"><Cushion /></Prop>
      )}
      {held && <DropZones stageW={W} zones={zones} hover={hover} />}
      {s.name === "play" && (
        <div ref={wandRef} className="wand" style={{ top: floorY - size * 0.7, width: size * 0.42, marginLeft: -size * 0.12 }} aria-hidden="true">
          {p.profile.species === "dog" ? <RopeToy /> : <FeatherWand />}
        </div>
      )}
      <div
        ref={moverRef}
        className={`pet-mover${look.moving || held ? " moving" : ""}${s.name === "away" ? " gone" : ""}`}
        style={{ top: floorY - size * ANCHOR, width: size, height: size }}
      >
        <Bubble bubble={p.bubble} />
        <Hearts floats={p.floats} calm={p.calm} />
        {eating && !atBowl && (
          <div className="eat-bowl" style={{ left: `${50 + facing * 30}%`, width: size * 0.34 }} aria-hidden="true"><Bowl full /></div>
        )}
        <div ref={tiltRef} className="pet-tilt">
          <PetSprite
            ref={petRef}
            species={p.profile.species}
            coat={p.profile.coat}
            look={look}
            frame={motion.frame}
            facing={facing}
            frozen={s.name === "paused"}
            twitch={p.twitch}
            label={p.label}
            drag={drag}
            onPet={p.onPet}
            onKey={onKey}
            juice={p.juice}
            photoSrc={p.photoSrc}
          />
        </div>
      </div>
      {p.overlay}
      {p.cards && <div className="card-slot">{p.cards}</div>}
    </div>
  );
}

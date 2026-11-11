// The pet as one <button> (spec §10.2, §11): tap = pet, drag = held, Enter pets, arrows move.
// Movement is done by the parent mover (translate3d); this flips facing and crossfades poses over 120 ms.
import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from "react";
import PlaceholderPet from "../art/PlaceholderPet";
import type { CoatId, Species } from "../shared/types";
import type { DragHandlers } from "../hooks/useDrag";
import type { Look } from "./pose";

type Layer = { key: string; look: Look; frame: number };

const lookKey = (l: Look, frame: number) =>
  `${l.slot}|${l.eyes ?? ""}|${l.mouth ?? ""}|${l.slot === "walk" || l.slot === "play" ? frame % 2 : ""}`;

export const PetSprite = forwardRef<HTMLButtonElement, {
  species: Species;
  coat: CoatId;
  look: Look;
  frame: number;
  facing: 1 | -1;
  frozen: boolean;
  twitch: boolean;
  label: string;
  drag: DragHandlers;
  onPet: () => void;
  onKey: (e: KeyboardEvent<HTMLButtonElement>) => void;
  juice: number; // bumps on every accepted pet
}>(function PetSprite(p, ref) {
  const cur: Layer = { key: lookKey(p.look, p.frame), look: p.look, frame: p.frame };
  const [prev, setPrev] = useState<Layer | null>(null);
  const last = useRef<Layer>(cur);
  const innerRef = useRef<HTMLSpanElement | null>(null);

  // Crossfade: keep the previous layer for 120 ms, except between walk frames (those swap instantly).
  useEffect(() => {
    const old = last.current;
    last.current = cur;
    if (old.key === cur.key) return;
    const walkSwap = (old.look.slot === "walk" || old.look.slot === "play") && old.look.slot === cur.look.slot;
    if (walkSwap) return;
    setPrev(old);
    const id = window.setTimeout(() => setPrev(null), 140);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.key]);

  // Tap juice (CSS keyframes via WAAPI): squash, stretch, settle, anchored at 50% 88%.
  useEffect(() => {
    if (!p.juice || !innerRef.current?.animate) return;
    innerRef.current.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: "scale(1.06, 0.92)", offset: 0.3 },
        { transform: "scale(0.97, 1.04)", offset: 0.6 },
        { transform: "scale(1, 1)" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }, [p.juice]);

  const render = (l: Layer, cls: string) => (
    <span key={l.key} className={`pet-layer ${cls}`}>
      <PlaceholderPet species={p.species} coat={p.coat} slot={l.look.slot} frame={l.frame} eyes={l.look.eyes} mouth={l.look.mouth} />
    </span>
  );

  return (
    <button
      ref={ref}
      type="button"
      className={`pet-button${p.frozen ? " frozen" : ""}`}
      aria-label={p.label}
      onClick={() => {
        if (!p.drag.consumeClick()) p.onPet();
      }}
      onKeyDown={p.onKey}
      onPointerDown={p.drag.onPointerDown}
      onPointerMove={p.drag.onPointerMove}
      onPointerUp={p.drag.onPointerUp}
      onPointerCancel={p.drag.onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className={`pet-flip${p.facing < 0 ? " flipped" : ""}`}>
        <span ref={innerRef} className={`pet-inner${p.look.anim ? ` anim-${p.look.anim}` : ""}${p.twitch ? " anim-twitch" : ""}`}>
          {prev && render(prev, "out")}
          {render(cur, prev ? "in" : "")}
        </span>
      </span>
    </button>
  );
});

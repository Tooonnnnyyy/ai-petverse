// Drawn stand-in pet: maps a PoseSlot to a P0 pose, with derived slots per spec §8.2.
import type { ReactNode } from "react";
import type { CoatId, PoseSlot, Species } from "../shared/types";
import { CAT_POSES } from "./cat";
import { DOG_POSES } from "./dog";
import { HEART, ZED, coatStyle, resolveCoat, type EyeState, type Face, type MouthState } from "./parts";

export type PlaceholderPetProps = {
  species: Species;
  coat?: CoatId | null; // null or a coat of the other species falls back to the species' first preset
  slot: PoseSlot;
  frame?: number; // walk / play: even = contact, odd = passing
  eyes?: EyeState;
  mouth?: MouthState; // slot "transition" + mouth "yawn" = yawn; otherwise "transition" = stretch
  title?: string;
  className?: string;
};

const HEARTS = (
  <g>
    {[[124, 150, 1.6], [392, 124, 1.9], [356, 52, 1.3]].map(([x, y, s]) => (
      <path key={x} d={HEART} transform={`translate(${x} ${y}) scale(${s})`} className="hrt o4" vectorEffect="non-scaling-stroke" />
    ))}
  </g>
);

const ZS = (
  <g>
    {[[356, 190, 1.2], [394, 140, 1.6], [436, 80, 2.1]].map(([x, y, s], i) => (
      <g key={x} className="pet-z" style={{ animationDelay: `${i * 0.6}s` }}>
        <path d={ZED} transform={`translate(${x} ${y}) scale(${s})`} className="nf o4" vectorEffect="non-scaling-stroke" />
      </g>
    ))}
  </g>
);

export default function PlaceholderPet({ species, coat, slot, frame = 0, eyes, mouth, title, className }: PlaceholderPetProps) {
  const set = species === "dog" ? DOG_POSES : CAT_POSES;
  const f = Math.abs(Math.trunc(frame)) % 2;
  let Pose = set.talk;
  const face: Face = { eyes: eyes ?? "open", mouth: mouth ?? "closed" };
  let idle = true, tilt = false, extra: ReactNode = null;

  switch (slot) {
    case "happy":
      face.eyes = eyes ?? "happy"; face.mouth = mouth ?? "open"; extra = HEARTS; break;
    case "rest": Pose = set.rest; break;
    case "eat": Pose = set.rest; face.eyes = eyes ?? "closed"; face.headDy = 18; break;
    case "sleep": Pose = set.rest; face.eyes = eyes ?? "closed"; extra = ZS; break;
    case "walk": case "play": Pose = set.walk[f]; idle = false; tilt = slot === "play"; break;
    case "held": Pose = set.held; idle = false; break;
    case "transition":
      if (mouth === "yawn") face.eyes = eyes ?? "closed";
      else { Pose = set.stretch; idle = false; }
      break;
  }

  const pose = <Pose {...face} />;
  return (
    <svg
      viewBox="0 0 512 512"
      className={className ? `pet ${className}` : "pet"}
      style={coatStyle(resolveCoat(species, coat))}
      data-species={species}
      data-slot={slot}
      data-idle={idle ? "" : undefined}
      data-mood={slot === "happy" ? "happy" : undefined}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {tilt ? <g transform="rotate(-8 170 450)">{pose}</g> : pose}
      {extra}
    </svg>
  );
}

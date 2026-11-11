// Maps a PetState to what the drawn pet shows (spec §8.2 slots, §10.2). Pure.
import type { EyeState, MouthState } from "../art/parts";
import type { PetState, PoseSlot } from "../shared/types";

export type Look = {
  slot: PoseSlot;
  eyes?: EyeState;
  mouth?: MouthState;
  /** CSS motion class on the pet (squish, lean, flick, shake, land, startle, hide, munch, sigh). */
  anim?: string;
  moving: boolean;
};

export function lookFor(s: PetState): Look {
  const c = s.cmd;
  switch (s.name) {
    case "rest":
      return { slot: "rest", eyes: c.kind === "rest" && c.variant === 1 ? "closed" : undefined, moving: false };
    case "walk":
    case "approach":
    case "leaving":
    case "returning":
      return { slot: "walk", moving: true };
    case "sit":
    case "moment":
      return { slot: "talk", moving: false };
    case "transition":
      if (c.kind !== "transition") return { slot: "talk", moving: false };
      switch (c.variant) {
        case "stretch":
          return { slot: "transition", moving: false };
        case "yawn":
          return { slot: "transition", mouth: "yawn", moving: false };
        case "shake":
          return { slot: "talk", eyes: "closed", anim: "shake", moving: false };
        case "land":
          return { slot: "talk", anim: "land", moving: false };
        case "startle":
          return { slot: "talk", mouth: "open", anim: "startle", moving: false };
      }
      return { slot: "talk", moving: false };
    case "sleep":
      return { slot: "sleep", moving: false };
    case "petted":
      if (c.kind !== "petted") return { slot: "happy", moving: false };
      if (c.reaction === "purr") return { slot: "happy", anim: "squish", moving: false };
      if (c.reaction === "lean") return { slot: "happy", anim: "lean", moving: false };
      if (c.reaction === "slowBlink") return { slot: "talk", eyes: "closed", moving: false };
      return { slot: "talk", anim: "flick", moving: false };
    case "held":
      return { slot: "held", mouth: "open", anim: "dangle", moving: false };
    case "fall":
      return { slot: "held", anim: "fall", moving: false };
    case "eat":
      return { slot: "eat", anim: "munch", moving: false };
    case "play":
      return { slot: "play", moving: true };
    case "talk":
      return c.kind === "decline"
        ? { slot: "talk", eyes: "closed", anim: "sigh", moving: false }
        : { slot: "talk", mouth: "open", moving: false };
    case "settle":
      return c.kind === "settle" && c.distance === "near"
        ? { slot: "rest", moving: false }
        : { slot: "talk", moving: false };
    case "hide":
      return { slot: "rest", eyes: "closed", anim: "hide", moving: false };
    case "gift":
      return { slot: "happy", moving: false };
    case "away":
    case "paused":
      return { slot: "talk", moving: false };
  }
}

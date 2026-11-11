// English talk copy (spec §6.5). Bubble lines are the pet's own voice (<= 60 chars) and describe the pet only;
// they never state or guess the user's feelings and never mention absence. {name} is the pet's name.
// Line ids are "<set>.<n>"; talk/lines.ts groups them into sets by the prefix.
import type { LineId } from "../../shared/types";

export const talkLines: Record<LineId, string> = {
  "greet.1": "Oh, hello there!",
  "greet.2": "Hi! Nice and cosy in here.",
  "greet.3": "Hey! Perfect timing for a stretch.",

  "goodnight.1": "Night night. *curls up*",
  "goodnight.2": "Sleepy time. Paws tucked in.",
  "goodnight.3": "Good night. Dreaming of soft blankets.",

  "come_closer.1": "Coming! *pads over*",
  "come_closer.2": "On my way, nice and slow.",
  "come_closer.3": "Here I am.",

  "comfort.1": "I'll stay right here.",
  "comfort.2": "*settles in nearby*",
  "comfort.3": "Not going anywhere. Comfy spot.",

  "rest.1": "*slow breath in, slow breath out*",
  "rest.2": "Quiet time. I like quiet.",
  "rest.3": "*tucks paws in*",

  "play.1": "Ooh, a toy! *wiggle*",
  "play.2": "Got it! Almost got it!",
  "play.3": "Again? Again!",

  "idle.1": "*sniffs the air*",
  "idle.2": "Hm. That corner looks interesting.",
  "idle.3": "*watches a dust mote drift by*",

  "decline_full.1": "{name} is full. Maybe later.",
  "decline_full.2": "All full up. Maybe later?",
  "decline_tired.1": "*yawn* Later?",
  "decline_tired.2": "A bit sleepy. Later?",
  "decline_cooldown.1": "*catching breath* Later?",
  "decline_cooldown.2": "Just played! Later?",

  "no_match.1": "Not sure. One of these?",
  "no_match.2": "Hmm? One of these, maybe?",

  "greeting.morning": "Morning! The light is nice today.",
  "greeting.afternoon": "Afternoon! I found a sunny patch.",
  "greeting.evening": "Evening. Cosy time.",
  "greeting.night": "Late and quiet. Very cosy.",

  "homeStory.1": "I chased a sunbeam across the floor. It won.",
  "homeStory.2": "I napped in three different spots. All good.",
  "homeStory.3": "A leaf blew past the window. I watched it all the way.",
  "homeStory.4": "I found a crumb under the bowl. Mystery solved.",

  "petted.1": "*purr*",
  "petted.2": "Mm, right there.",
  "eat.1": "Nom nom.",
  "eat.2": "Crunch. Very good.",
  "held.1": "Whee!",
  "land.1": "Paws down. All good.",
  "outingLeave.1": "Off for a little wander!",
  "outingReturn.1": "Home again. Look what I found!",
};

/** Third-person narration under the stage. Placeholders: {name}, {favourite}, {time}. */
export const talkNarration = {
  playStart: "{name} perks up, maybe thinking about {favourite}.",
  playStartPlain: "{name} perks up for a quick chase.",
  comeCloser: "{name} pads over at an unhurried pace.",
  comeCloserSpace: "{name} looks over, then picks a respectful distance.",
  comfortNear: "{name} comes close and settles in.",
  comfortNearby: "{name} settles nearby, keeping watch.",
  comfortRoom: "{name} settles across the room and watches.",
  quietTime: "{name} settles into a quiet rhythm. Nothing else is required.",
  hide: "{name} tucks into a corner for a bit.",
  walkAway: "{name} wanders off a little and sits.",
  pausedPet: "{name} holds still and enjoys that.",
  out: "{name} is out. Back around {time}.",
  supportAway: "{name} is out for now. Back around {time}.",
} as const;

export type NarrationId = keyof typeof talkNarration;

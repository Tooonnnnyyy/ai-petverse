// English UI copy (spec §9, §6.8). Placeholders: {name}, {place}, {time}, {n}, {of}, {level}.
// Copy describes the pet only; it never states or guesses the user's feelings and never guilts.
import type { ComfortStyle, Energy, SnackId, Species, UnlockId } from "../../shared/types";

export const ui = {
  app: {
    title: "AI Petverse",
    demoBadge: "Demo",
    exitDemo: "Exit demo",
    savingOff: "Saving is off in this window. Everything still works until you close it.",
  },

  welcome: {
    kicker: "A small pet that lives in your browser",
    title: "A cosy room for a pet that feels like yours.",
    pitch:
      "Pet, feed and play with a drawn stand-in for your real cat or dog. Send it on little outings, collect what it brings home, and build a bond that only ever goes up.",
    continueWith: "Continue with {name}",
    meet: "Meet my pet",
    demo: "Try a demo pet",
    demoNote: "The demo pet resets when you reload. Nothing is saved.",
    footnote: "Everything stays in this browser. No account.",
  },

  onboarding: {
    stepOf: "Step {n} of {of}",
    back: "Back",
    next: "Next",
    cancel: "Cancel",
    finish: "Meet {name}",
    notSure: "Not sure yet",
    species: {
      title: "Who are we drawing?",
      hint: "Pick the kind of pet and a coat. The drawing is a stand-in, not a likeness.",
      cat: "Cat",
      dog: "Dog",
      coat: "Coat",
    } satisfies Record<string, string>,
    name: {
      title: "What is their name?",
      hint: "One letter is fine. Up to 24 characters.",
      label: "Pet name",
      placeholder: "Type a name",
      tooLong: "Please keep it to 24 characters.",
    },
    company: {
      title: "How do they like company?",
      hint: "This shapes how close they come and how they react. You can change it later.",
      comfortLabel: "Company",
      energyLabel: "Energy",
    },
  },

  comfort: {
    close: { label: "Comes close", detail: "Likes contact and leaning in" },
    nearby: { label: "Stays nearby", detail: "Company from a little distance" },
    space: { label: "Likes space", detail: "Watches first, comes over when ready" },
  } satisfies Record<ComfortStyle, { label: string; detail: string }>,

  energy: {
    low: { label: "Soft and slow", detail: "Mostly calm, short bursts" },
    steady: { label: "Steady", detail: "A little of everything" },
    high: { label: "Always curious", detail: "Play first, nap later" },
  } satisfies Record<Energy, { label: string; detail: string }>,

  coats: {
    ginger: "Ginger",
    grey: "Grey",
    tan: "Tan",
    blackTan: "Black and tan",
  },

  room: {
    album: "Album",
    stageLabel: "{name}'s room",
    petName: "{name}, {state}. Press Enter to pet. Arrow keys to move.",
    petNameHeld: "{name}, held. Arrow keys to move, Enter to put down, Escape to cancel.",
    drawnStandIn: "Drawn stand-in for {name}",
    welcomeCard: "This is {name}'s room. Say hi, feed or play, or just let {name} be.",
    close: "Close",
    states: {
      rest: "resting",
      walk: "wandering",
      sit: "sitting",
      transition: "stretching",
      sleep: "sleeping",
      moment: "busy",
      petted: "enjoying a pat",
      held: "held",
      fall: "landing",
      eat: "eating",
      play: "playing",
      talk: "chatting",
      approach: "coming over",
      settle: "settled",
      hide: "tucked away",
      leaving: "heading out",
      away: "out",
      returning: "coming home",
      gift: "holding something",
      paused: "paused",
    } satisfies Record<string, string>,
    zones: { bed: "Bed", bowl: "Bowl", cushion: "Cushion", windowSeat: "Window seat" },
  },

  dock: {
    feed: "Feed",
    play: "Play",
    talk: "Talk",
    outing: "Outing",
    more: "More",
    putToBed: "Put to bed",
    leadToBowl: "Lead to bowl",
    toCushion: "To the cushion",
    pickSnack: "Pick a snack",
    isOut: "{name} is out",
    playHint: "Wiggle the pointer over the room. On touch, the wand moves by itself.",
  },

  snacks: {
    crunchy: "Crunchy bites",
    soft: "Soft treat",
    fishy: "Fishy flakes",
    chewy: "Chewy stick",
  } satisfies Record<SnackId, string>,

  support: {
    label: "Support",
    come_closer: "Come closer",
    comfort: "Stay with me",
    rest: "Quiet time",
    callBack: "Call {name} back",
  },

  talk: {
    label: "Say something to {name}",
    placeholder: "Say hi, ask about the day, or anything",
    send: "Send",
    chips: { greet: "Hi", day: "How was your day?", goodnight: "Good night" },
    pickOne: "One of these?",
    playChip: "Play",
  },

  bond: {
    label: "Bond",
    level: "L{level} · {name}",
    toNext: "{n} to next level",
    max: "Highest level",
    today: "Today {n} of {of}",
    resting: "Bond is resting for today. Everything still works, and nothing is lost.",
    simulation: "Bond is a simulation, not {name}'s real feelings.",
    plus: "+{n} Bond",
  },

  levelUp: {
    title: "Bond level {level}",
    unlocked: "New:",
    ok: "Lovely",
    unlocks: {
      cushion: "A cushion for the room. Drag {name} onto it, or use More.",
      market: "A new place for outings: the Market.",
      windowSeat: "A window seat. {name} likes the view.",
      hills: "A new place for outings: the Hills.",
      talkSet2: "New things to say.",
      scarf: "A scarf for {name}.",
      lamp: "A warm lamp.",
      bow: "A bow for {name}.",
      plantRug: "A plant and a rug.",
      rainWindow: "Rain on the window.",
      albumCover: "A new album cover.",
    } satisfies Record<UnlockId, string>,
  },

  outing: {
    title: "Send {name} on an outing",
    hint: "Outings never fail. Call {name} back any time. Longer trips can bring home souvenirs.",
    place: "Where to?",
    duration: "How long?",
    locked: "Opens at L{level}",
    go: "Off you go",
    cancel: "Not now",
    leaving: "{name} heads off to the {place}.",
    awayNote: "{name} is at the {place} · back around {time}.",
    awaySub: "Focus on one thing, or don't. {name} comes back either way.",
    countdown: "{time} left",
    callBack: "Call {name} back",
    returned: "{name} is back from the {place}.",
    blockedHeld: "Put {name} down first.",
    blockedPaused: "Outings are resting for now.",
  },

  gift: {
    title: "{name} brought something back",
    open: "Open it",
    keep: "Keep it",
    souvenir: "A {item}",
    postcard: "A postcard from the {place}",
    newStamp: "NEW",
  },

  album: {
    title: "Album",
    souvenirs: "Souvenirs",
    postcards: "Postcards",
    count: "{n} of {of}",
    days: "Days together: {n}",
    outings: "Outings: {n}",
    locked: "Not found yet",
    noPostcards: "No postcards yet. Send {name} on an outing.",
    close: "Close",
  },

  urgent: {
    title: "You deserve support right now",
    body:
      "If you might be in danger or thinking about hurting yourself, please contact your local emergency number now. You can also find free, confidential support at findahelpline.com.",
    link: "Open findahelpline.com",
    safe: "I'm safe right now",
  },

  footer: {
    disclaimer:
      "A companion and reflection tool, not healthcare or crisis support. If you might be in danger, contact local emergency services now.",
    help: "Need help now?",
    pause: "Pause pet",
    resume: "Resume pet",
    motion: "Calm motion: {mode}",
    motionModes: { auto: "Auto", on: "On", off: "Off" },
    delete: "Delete my data",
    confirmTitle: "Delete all your data?",
    confirmBody:
      "This removes {name}'s profile, bond, album and settings from this browser. It cannot be undone.",
    confirmBodyNoPet: "This removes everything this app stored in this browser. It cannot be undone.",
    confirmYes: "Delete everything",
    confirmNo: "Keep my data",
    deleted: "Your data was deleted from this browser.",
  },

  narration: {
    gotHome: "{name} is back from the {place} and brought something.",
    asleep: "{name} wakes with a big yawn.",
    zoneBed: "{name} curls up in bed.",
    zoneBowl: "{name} checks the bowl.",
    zoneCushion: "{name} loafs on the cushion.",
    zoneWindow: "{name} sits and watches the window.",
    feed: "{name} munches the {snack}.",
    callBack: "{name} turns around and heads home.",
  },

  species: { cat: "cat", dog: "dog" } satisfies Record<Species, string>,
};

/** Replaces {key} placeholders. Unknown keys stay as written. */
export function fill(t: string, vars: Record<string, string | number>): string {
  return t.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

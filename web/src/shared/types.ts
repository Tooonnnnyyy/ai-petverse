// Shared contracts for the living-pet web MVP (spec docs/WEB_PET_GAMIFICATION_SPEC.md §10.1).
// Types only: every module imports cross-module types from here so parallel work stays consistent.

// ---- content ids (catalog-owned strings) ----
export type SouvenirId = string;
export type StoryId = string;
export type LineId = string;
export type MomentId = string; // P1
export type SnackId = "crunchy" | "soft" | "fishy" | "chewy"; // cat: crunchy/soft/fishy, dog: crunchy/soft/chewy

// ---- profile ----
export type Species = "cat" | "dog";
export type Energy = "low" | "steady" | "high";
export type ComfortStyle = "close" | "nearby" | "space";
export type Trigger = "sudden_noise" | "strangers" | "too_much_energy" | "none";
export type CoatId = "ginger" | "grey" | "tan" | "blackTan";

export type PetProfile = {
  name: string;
  species: Species;
  energy: Energy | null;
  comfortStyle: ComfortStyle | null;
  trigger: Trigger | null;
  favouriteActivity: string; // <= 40 chars, display and play narration only
  coat: CoatId | null;
};

export type Correction = {
  id: string;
  at: string; // ISO date only
  field: "energy" | "comfortStyle" | "trigger" | "startleHide" | "note";
  value: string;
};

export type Source = "correction" | "fact" | "default";

export type EffectiveProfile = {
  name: string;
  species: Species;
  energy: Energy;
  comfortStyle: ComfortStyle;
  trigger: Trigger;
  startleHide: boolean;
  coat: CoatId;
  sources: Record<"energy" | "comfortStyle" | "trigger" | "startleHide", Source>;
};

// ---- talk ----
export type Intent = "come_closer" | "comfort" | "play" | "rest" | "greet" | "day" | "goodnight" | "no_match";
export type IntentResult = {
  intent: Intent;
  confidence: number;
  source: "rules-v2";
  evidence: string[];
  alternatives: Intent[];
};
export type LineSet =
  | Intent
  | "decline_full"
  | "decline_tired"
  | "decline_cooldown"
  | "greeting"
  | "idle"
  | "homeStory"
  | "petted"
  | "eat"
  | "play"
  | "held"
  | "land"
  | "outingLeave"
  | "outingReturn";

// ---- bond, levels, unlocks ----
export type BondSource = "pet" | "feed" | "play" | "talk" | "care" | "outing";
export type BondLedger = {
  total: number;
  day: string;
  today: Partial<Record<BondSource, number>>;
  todayTotal: number;
};
export type UnlockId =
  | "cushion"
  | "market"
  | "windowSeat"
  | "hills" // P0
  | "talkSet2"
  | "scarf"
  | "lamp"
  | "bow"
  | "plantRug"
  | "rainWindow"
  | "albumCover"; // P1
export type Unlock = { id: UnlockId; level: number; phase: "P0" | "P1" };

// ---- outings and album ----
export type PlaceId = "garden" | "riverside" | "market" | "hills";
export type OutingMinutes = 1 | 5 | 15 | 25 | 45;
export type Outing = {
  id: string;
  place: PlaceId;
  plannedMin: OutingMinutes;
  startedAt: number;
  endsAt: number;
  recalledAt: number | null;
  creditedAt: number | null;
};
export type OutingReward =
  | { kind: "souvenir"; id: SouvenirId; storyId: StoryId; isNew: true }
  | { kind: "postcard"; place: PlaceId; storyId: StoryId; hint: "longerTrip" | null };
export type AlbumState = {
  souvenirs: SouvenirId[];
  postcards: StoryId[];
  moments: MomentId[]; // stays [] in P0
  storyCursor: Record<PlaceId, number>;
  outingsCompleted: number;
};

// ---- care invitations and feedback (iteration 2) ----
export type CareMomentId = "water" | "breaths" | "stretch" | "oneThing";
export type InviteHistory = { lastShown: CareMomentId[]; notNowStreak: number; skipSessions: number };
export type FeedbackHistory = { likenessAskedAtVisit: number | null; usefulnessLastDay: string | null };

// ---- cards ----
export type CardKind =
  | "gift"
  | "levelUp"
  | "unlock"
  | "welcome"
  | "feedbackLikeness"
  | "feedbackUsefulness"
  | "invitation"
  | "outingOffer";
export type Card = { kind: CardKind; id: string; enqueuedAt: number };
export type CardQueue = { visible: Card | null; queue: Card[] };

// ---- save ----
export type Settings = { calmMotion: "auto" | "on" | "off"; paused: boolean; invitations: boolean; fillGapsDrawn: boolean };
export type SaveV2 = {
  v: 2;
  installSeed: number;
  profile: PetProfile | null;
  corrections: Correction[];
  bond: BondLedger;
  album: AlbumState;
  outing: Outing | null;
  pendingGift: OutingReward | null;
  invites: InviteHistory;
  unlocksSeen: UnlockId[];
  feedback: FeedbackHistory;
  settings: Settings;
  visits: { days: number; lastDay: string };
  flags: { welcomeSeen: boolean; isDemo: boolean };
};

// ---- pet engine ----
export type PoseSlot = "talk" | "rest" | "walk" | "held" | "transition" | "eat" | "play" | "sleep" | "happy";
export type Motion = "none" | "breathe" | "bob" | "dangle" | "squash" | "tilt" | "shiver" | "dip" | "glance";
export type Edge = "left" | "right";
export type DropZone = "bed" | "bowl" | "cushion" | "windowSeat";

export type PetCommand =
  | { kind: "rest"; variant: number; mirror: boolean; ms: number }
  | { kind: "walk"; toX: number; pxPerS: number } // toX: stage ratio 0..1 (seeded)
  | { kind: "fadeTo"; toX: number } // calm-motion replacement for walk
  | { kind: "sit"; ms: number }
  | { kind: "transition"; variant: "stretch" | "yawn" | "shake" | "land" | "startle"; ms: number }
  | { kind: "sleep"; ms: number }
  | { kind: "moment"; id: MomentId; ms: number } // P1
  | { kind: "petted"; reaction: "purr" | "lean" | "earFlick" | "slowBlink"; hearts: 0 | 1 | 2 | 3 }
  | { kind: "held" }
  | { kind: "fall" }
  | { kind: "eat"; snack: SnackId; ms: number }
  | { kind: "play"; toy: "wand" | "rope"; ms: number }
  | { kind: "talk"; lineId: LineId; ms: number }
  | { kind: "approach"; pace: "slow" | "normal"; toX: number }
  | { kind: "settle"; distance: "near" | "nearby" | "room"; ms: number }
  | { kind: "hide"; edge: Edge; ms: number }
  | { kind: "decline"; reason: "full" | "tired" | "cooldown"; lineId: LineId }
  | { kind: "outingLeave"; edge: Edge }
  | { kind: "away" }
  | { kind: "outingReturn"; edge: Edge }
  | { kind: "gift"; reward: OutingReward }
  | { kind: "hold" }; // Pause pet: freeze current pose

export type PetStateName =
  | "rest"
  | "walk"
  | "sit"
  | "transition"
  | "sleep"
  | "moment" /* P1 */
  | "petted"
  | "held"
  | "fall"
  | "eat"
  | "play"
  | "talk"
  | "approach"
  | "settle"
  | "hide"
  | "leaving"
  | "away"
  | "returning"
  | "gift"
  | "paused";

export type PetState = {
  name: PetStateName;
  cmd: PetCommand;
  enteredAt: number;
  endsAt: number | null;
  resume: "rest" | "walk" | "sit" | null;
  x: number; // 0..1, confirmed by renderer via "arrived"
  energy: number; // 0..100, simulated
  curiosity: number; // 0..100, simulated
  restsInRow: number;
  longsSinceMoment: number;
  lastMomentAt: number;
  lastRestVariant: number;
  petTimes: number[];
  feedTimes: number[];
  playCooldownUntil: number;
  lastBubbleAt: number;
  lastLineIds: LineId[];
  rngState: number;
  plan?: PetCommand[]; // queued follow-up commands (e.g. the long state after a transition); pet/machine.ts only
};

export type PetInput =
  | { t: "tick" } // scheduler: now >= endsAt
  | { t: "arrived"; x: number } // renderer finished walk/fade/approach
  | { t: "pet" }
  | { t: "dragStart" }
  | { t: "dragEnd"; x: number; speedPxS: number; zone: DropZone | null }
  | { t: "dragCancel" }
  | { t: "sendTo"; zone: DropZone }
  | { t: "feed"; snack: SnackId }
  | { t: "play" }
  | { t: "talk"; intent: Intent; confidence: number }
  | { t: "support"; intent: "come_closer" | "comfort" | "rest"; source: "chip" | "typed" }
  | { t: "outingStart"; outing: Outing }
  | { t: "outingEnd"; reward: OutingReward }
  | { t: "giftDismissed" }
  | { t: "careStart"; id: CareMomentId }
  | { t: "setPaused"; on: boolean }
  | { t: "visible"; hiddenMs: number }
  | { t: "urgent" };

export type Ctx = {
  now: number;
  profile: EffectiveProfile;
  stageWidthPx: number;
  calm: boolean;
  unlocked: ReadonlySet<UnlockId>;
  seenMoments: ReadonlySet<MomentId>;
  gamificationPaused: boolean; // true after urgent help in this page load (memory only)
  supportWindowUntil: number; // R9 window end (ms); 0 when not in it
  firstPlayDone: boolean; // first play of a session skips energy/cooldown checks
  userAnchorX: number; // 0..1, §5.1
};

export type AnalyticsEvent = { name: string; props: Record<string, string | number | boolean> };

export type Effect =
  | { type: "bond"; source: BondSource; amount?: number } // amount defaults to ECONOMY[source].bp
  | { type: "momentSeen"; id: MomentId } // P1
  | { type: "narrate"; textId: string }
  | { type: "track"; event: AnalyticsEvent };

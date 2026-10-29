export type Species = "cat" | "dog";
export type Energy = "low" | "steady" | "high";
export type ComfortStyle = "close" | "nearby" | "space";
export type PetMode =
  | "idle"
  | "watching"
  | "approaching"
  | "comforting"
  | "playing"
  | "resting"
  | "hiding";

export type PetProfile = {
  name: string;
  species: Species;
  energy: Energy;
  comfortStyle: ComfortStyle;
  trigger: string;
  favouriteActivity: string;
  correction: string;
  published: boolean;
};

export type Intent = "come_closer" | "comfort" | "play" | "rest" | "no_match";

export type IntentResult = {
  intent: Intent;
  confidence: number;
  source: "rule-preview";
  evidence: string[];
};

export type Feedback = "yes" | "partly" | "no";

export type PetEvent = {
  name:
    | "session_started"
    | "profile_completed"
    | "support_action_used"
    | "likeness_feedback_submitted"
    | "community_preview_opened";
  timestamp: string;
  properties: Record<string, string | number | boolean>;
};

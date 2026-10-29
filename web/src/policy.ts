import type { Intent, IntentResult, PetMode, PetProfile } from "./types";

const intentMatchers: Array<{ intent: Intent; words: string[] }> = [
  {
    intent: "comfort",
    words: ["overwhelmed", "anxious", "stress", "stressed", "comfort", "hard day"],
  },
  {
    intent: "come_closer",
    words: ["come here", "come over", "near me", "sit with me", "close"],
  },
  {
    intent: "play",
    words: ["play", "fun", "toy", "energy", "walk"],
  },
  {
    intent: "rest",
    words: ["rest", "break", "quiet", "sleep", "pause", "breathe"],
  },
];

export function interpretIntent(text: string): IntentResult {
  const normalized = text.trim().toLowerCase();
  const match = intentMatchers.find(({ words }) =>
    words.some((word) => normalized.includes(word)),
  );

  if (!match) {
    return {
      intent: "no_match",
      confidence: 0.2,
      source: "rule-preview",
      evidence: ["No supported intent phrase matched in the preview classifier."],
    };
  }

  return {
    intent: match.intent,
    confidence: 0.86,
    source: "rule-preview",
    evidence: [`Matched a ${match.intent} phrase in the preview classifier.`],
  };
}

export function petModeForIntent(intent: Intent, profile: PetProfile): PetMode {
  if (intent === "comfort") return "comforting";
  if (intent === "come_closer") return profile.comfortStyle === "space" ? "watching" : "approaching";
  if (intent === "play") return profile.energy === "low" ? "watching" : "playing";
  if (intent === "rest") return "resting";
  return "watching";
}

export function responseForIntent(intent: Intent, profile: PetProfile): string {
  switch (intent) {
    case "comfort":
      return profile.comfortStyle === "close"
        ? `${profile.name} comes close and settles beside you.`
        : `${profile.name} stays nearby, giving you room while keeping watch.`;
    case "come_closer":
      return profile.comfortStyle === "space"
        ? `${profile.name} looks over, then chooses a respectful distance.`
        : `${profile.name} pads over at an unhurried pace.`;
    case "play":
      return profile.energy === "low"
        ? `${profile.name} watches the invitation, then offers one small play signal.`
        : `${profile.name} perks up for a short ${profile.favouriteActivity} break.`;
    case "rest":
      return `${profile.name} settles into a quiet rhythm. Nothing else is required.`;
    default:
      return `${profile.name} watches you for a moment. Try a short request or choose an action.`;
  }
}

// Rule-based talk classifier v2 (spec §6.5, fixes bug 9) and urgent-help detection (§6.8).
// The text is never stored or logged; evidence names the curated rule only, never the user's words.
import type { Intent, IntentResult } from "../shared/types";

type Rule = { intent: Exclude<Intent, "no_match">; en: string[]; zh: string[] };

// Priority order (first wins when several match; the rest become alternatives).
const RULES: Rule[] = [
  {
    intent: "comfort",
    en: [
      "overwhelmed", "anxious", "anxiety", "stress", "stressed", "stressful", "comfort", "hard day", "rough day",
      "bad day", "stay with me", "keep me company", "upset", "worried", "panic", "panicking", "sad", "lonely",
      "hug", "cuddle",
    ],
    zh: ["陪陪我", "陪着我", "难受", "焦虑", "压力好大", "压力大", "好烦", "崩溃", "抱抱", "难过"],
  },
  {
    intent: "come_closer",
    en: ["come here", "come over", "come closer", "closer", "near me", "sit with me", "over here", "come sit", "nearer"],
    zh: ["过来", "来这里", "靠近", "到我身边", "来我这"],
  },
  {
    intent: "rest",
    en: [
      "rest", "quiet", "pause", "breathe", "tired", "nap", "relax", "calm", "chill", "no energy", "low energy",
      "slow down", "need a minute",
    ],
    zh: ["好累", "累了", "休息", "安静", "歇一会", "歇歇", "放松"],
  },
  {
    intent: "play",
    en: ["play", "toy", "toys", "game", "games", "chase", "wand", "fetch", "rope", "zoomies"],
    zh: ["一起玩", "想玩", "玩吧", "陪我玩", "玩耍", "玩游戏", "做游戏"],
  },
  {
    intent: "goodnight",
    en: [
      "good night", "goodnight", "night night", "nighty night", "sleep well", "sleep tight", "bedtime",
      "time for bed", "going to bed", "go to sleep", "time to sleep",
    ],
    zh: ["晚安", "睡觉了", "去睡了"],
  },
  {
    intent: "day",
    en: ["how was your day", "your day", "what did you do", "what have you been up to", "any news", "tell me a story"],
    zh: ["今天怎么样", "今天过得", "你今天", "讲个故事"],
  },
  {
    intent: "greet",
    en: ["hi", "hello", "hey", "hiya", "howdy", "good morning", "good afternoon", "good evening", "morning", "how are you"],
    zh: ["你好", "嗨", "哈喽", "早上好", "早安", "下午好", "晚上好"],
  },
];

const EN_NEGATORS = new Set(["not", "no", "don't", "dont", "never", "can't", "cant", "cannot"]);
const ZH_NEGATORS = ["不想", "不", "别", "没"];
const NEGATION_WINDOW = 3;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[‘’ʼ`]/g, "'").normalize("NFKC");
}

function tokenize(s: string): string[] {
  return s.split(/[^a-z0-9']+/).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
}

/** Whole-phrase match on tokens; a negator within 3 tokens before a match cancels that occurrence. */
function matchEn(words: readonly string[], phrase: string): boolean {
  const pt = phrase.split(" ");
  for (let i = 0; i + pt.length <= words.length; i += 1) {
    if (!pt.every((w, k) => words[i + k] === w)) continue;
    const before = words.slice(Math.max(0, i - NEGATION_WINDOW), i);
    if (!before.some((w) => EN_NEGATORS.has(w))) return true;
  }
  return false;
}

/** Substring match; a negator immediately before the keyword cancels that occurrence. */
function matchZh(s: string, kw: string): boolean {
  let from = 0;
  for (;;) {
    const at = s.indexOf(kw, from);
    if (at < 0) return false;
    const negated = ZH_NEGATORS.some((n) => s.slice(Math.max(0, at - n.length), at) === n);
    if (!negated) return true;
    from = at + 1;
  }
}

export function interpretIntent(text: string): IntentResult {
  const s = normalize(text.trim());
  const words = tokenize(s);
  const matched: Intent[] = [];
  const evidence: string[] = [];
  for (const r of RULES) {
    const en = r.en.find((ph) => matchEn(words, ph));
    const zh = en ? undefined : r.zh.find((kw) => matchZh(s, kw));
    if (en !== undefined || zh !== undefined) {
      matched.push(r.intent);
      evidence.push(`rules-v2:${r.intent}:${en ?? zh}`);
    }
  }
  if (matched.length === 0) {
    return { intent: "no_match", confidence: 0.2, source: "rules-v2", evidence: ["rules-v2:no_match"], alternatives: [] };
  }
  return {
    intent: matched[0],
    confidence: matched.length === 1 ? 0.86 : 0.6,
    source: "rules-v2",
    evidence,
    alternatives: matched.slice(1),
  };
}

// ---- urgent help (§6.8): false positives are acceptable, false negatives are not. Owner reviews the list. ----

export const URGENT_EN: readonly string[] = [
  "kill myself", "killing myself", "end my life", "ending my life", "end it all", "want to die", "wanna die",
  "want to be dead", "don't want to be alive", "dont want to be alive", "do not want to be alive",
  "don't want to live", "dont want to live", "do not want to live", "no reason to live", "better off dead",
  "take my own life", "hurt myself", "hurting myself", "harm myself", "cut myself", "self harm", "selfharm",
  "suicide", "suicidal", "unalive myself",
];

export const URGENT_ZH: readonly string[] = [
  "不想活", "想死", "活不下去", "自杀", "轻生", "伤害自己", "结束生命", "结束自己", "割腕", "不想活了",
];

export function detectUrgent(text: string): boolean {
  const s = normalize(text).replace(/[-_]+/g, " ");
  const words = tokenize(s);
  const joined = ` ${words.join(" ")} `;
  if (URGENT_EN.some((ph) => joined.includes(` ${ph} `))) return true;
  const compact = s.replace(/\s+/g, "");
  return URGENT_ZH.some((kw) => compact.includes(kw));
}

// R7 card queue: one card on the stage, by priority (spec §3 R7). Pure.
import type { Card, CardKind, CardQueue } from "../shared/types";
import { PROMPT_SHOW_WINDOW_MS } from "./config";

/** Higher shows first. Urgent help is a modal dialog, not a card. */
export const CARD_PRIORITY: Record<CardKind, number> = {
  gift: 50,
  levelUp: 40,
  unlock: 40,
  welcome: 30,
  feedbackLikeness: 20,
  feedbackUsefulness: 20,
  invitation: 10,
  outingOffer: 10,
};

const isPrompt = (c: Card) => c.kind === "invitation" || c.kind === "outingOffer";
const isFeedback = (c: Card) => c.kind === "feedbackLikeness" || c.kind === "feedbackUsefulness";

export function emptyQueue(): CardQueue {
  return { visible: null, queue: [] };
}

/** Stable insert: after every card of equal or higher priority. */
function insert(queue: Card[], c: Card): Card[] {
  const p = CARD_PRIORITY[c.kind];
  const i = queue.findIndex((q) => CARD_PRIORITY[q.kind] < p);
  return i === -1 ? [...queue, c] : [...queue.slice(0, i), c, ...queue.slice(i)];
}

/** Adds a card (ignored when the same id is already present). A higher card replaces the visible one. */
export function enqueue(q: CardQueue, c: Card): CardQueue {
  if (q.visible?.id === c.id || q.queue.some((x) => x.id === c.id)) return q;
  if (!q.visible) return { visible: c, queue: q.queue };
  if (CARD_PRIORITY[c.kind] > CARD_PRIORITY[q.visible.kind]) {
    // The replaced card goes back to the front of its priority band.
    const back = q.visible;
    const p = CARD_PRIORITY[back.kind];
    const i = q.queue.findIndex((x) => CARD_PRIORITY[x.kind] <= p);
    const queue = i === -1 ? [...q.queue, back] : [...q.queue.slice(0, i), back, ...q.queue.slice(i)];
    return { visible: c, queue };
  }
  return { visible: q.visible, queue: insert(q.queue, c) };
}

/** Closes the visible card and shows the next; prompts that waited over 10 s are dropped. */
export function dismiss(q: CardQueue, now: number): CardQueue {
  return promote({ visible: null, queue: q.queue }, now);
}

/** Removes a card by id wherever it is (e.g. the welcome card closing on the first interaction). */
export function removeCard(q: CardQueue, id: string, now: number): CardQueue {
  if (q.visible?.id === id) return dismiss(q, now);
  const queue = q.queue.filter((c) => c.id !== id);
  return queue.length === q.queue.length ? q : { visible: q.visible, queue };
}

/** End of session: feedback cards are dropped (gift, level-up, unlock and welcome stay). */
export function endSession(q: CardQueue): CardQueue {
  const queue = q.queue.filter((c) => !isFeedback(c));
  if (q.visible && isFeedback(q.visible)) {
    const [next, ...rest] = queue;
    return { visible: next ?? null, queue: rest };
  }
  return { visible: q.visible, queue };
}

function promote(q: CardQueue, now: number): CardQueue {
  const queue = q.queue.filter((c) => !(isPrompt(c) && now - c.enqueuedAt > PROMPT_SHOW_WINDOW_MS));
  if (q.visible) return { visible: q.visible, queue };
  const [next, ...rest] = queue;
  return { visible: next ?? null, queue: rest };
}

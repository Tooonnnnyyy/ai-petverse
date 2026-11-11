import { describe, expect, it } from "vitest";
import type { Card, CardKind } from "../shared/types";
import { dismiss, emptyQueue, endSession, enqueue, removeCard } from "./cards";

const card = (kind: CardKind, id: string = kind, enqueuedAt = 0): Card => ({ kind, id, enqueuedAt });

describe("cards", () => {
  it("shows by R7 priority", () => {
    let q = emptyQueue();
    for (const c of [card("invitation"), card("feedbackLikeness"), card("welcome"), card("levelUp"), card("gift")]) q = enqueue(q, c);
    const order: string[] = [];
    while (q.visible) {
      order.push(q.visible.kind);
      q = dismiss(q, 1000);
    }
    expect(order).toEqual(["gift", "levelUp", "welcome", "feedbackLikeness", "invitation"]);
  });

  it("a higher card replaces the visible one, which returns to the queue", () => {
    let q = enqueue(emptyQueue(), card("welcome"));
    q = enqueue(q, card("levelUp"));
    expect(q.visible?.kind).toBe("levelUp");
    expect(q.queue.map((c) => c.kind)).toEqual(["welcome"]);
    q = enqueue(q, card("levelUp")); // same id ignored
    expect(q.queue).toHaveLength(1);
  });

  it("drops prompts that waited over 10 s; never gift or level-up", () => {
    let q = enqueue(emptyQueue(), card("gift", "g", 0));
    q = enqueue(q, card("invitation", "i", 0));
    q = enqueue(q, card("levelUp", "l", 0));
    q = dismiss(q, 60_000);
    expect(q.visible?.kind).toBe("levelUp");
    q = dismiss(q, 60_000);
    expect(q.visible).toBeNull();
  });

  it("endSession drops feedback cards only", () => {
    let q = enqueue(emptyQueue(), card("feedbackLikeness"));
    q = enqueue(q, card("feedbackUsefulness"));
    q = enqueue(q, card("invitation", "i", 0));
    q = enqueue(q, card("gift"));
    q = endSession(q);
    expect(q.visible?.kind).toBe("gift");
    expect(q.queue.map((c) => c.kind)).toEqual(["invitation"]);
    expect(endSession(enqueue(emptyQueue(), card("feedbackLikeness"))).visible).toBeNull();
  });

  it("removeCard closes the welcome card wherever it is", () => {
    let q = enqueue(emptyQueue(), card("welcome"));
    q = removeCard(q, "welcome", 0);
    expect(q.visible).toBeNull();
    q = enqueue(enqueue(emptyQueue(), card("gift")), card("welcome"));
    q = removeCard(q, "welcome", 0);
    expect(q).toEqual({ visible: card("gift"), queue: [] });
  });
});

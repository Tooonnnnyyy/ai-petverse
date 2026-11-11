// Owns SaveV2 and the R7 card queue (spec §10.2). Writes are debounced 250 ms, flushed at once on
// pagehide / hidden, and immediate for outing start, the return procedure and deletes.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BondSource, Card, CardKind, CardQueue, PetProfile, SaveV2 } from "../shared/types";
import { dismiss, emptyQueue, endSession, enqueue, removeCard } from "../game/cards";
import { awardTo, levelCardId } from "../game/progress";
import { newInstallSeed } from "../game/rng";
import { SAVE_KEY, deleteAllMyData, loadSave, newSave, parseSave, writeSave } from "../storage/save";

const DEBOUNCE_MS = 250;

export const DEMO_PROFILE: PetProfile = {
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "nearby",
  trigger: "none",
  favouriteActivity: "window watching",
  coat: "ginger",
};

export type GameApi = {
  save: SaveV2;
  get: () => SaveV2;
  /** Applies a change; `immediate` writes now instead of after the debounce. */
  update: (fn: (s: SaveV2) => SaveV2, immediate?: boolean) => void;
  /** Bond for an effect, within caps. Queues a level-up card unless celebrations are paused. */
  award: (source: BondSource, amount: number | undefined, now: number) => { granted: number; levelUp: number | null };
  cards: CardQueue;
  enqueueCard: (kind: CardKind, id: string) => void;
  dismissCard: () => void;
  removeCardById: (id: string) => void;
  endSessionCards: () => void;
  /** R8: true after the urgent card in this page load. Memory only, never saved. */
  celebrationsPaused: boolean;
  pauseCelebrations: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  startDemo: () => void;
  exitDemo: () => void;
  saveProfile: (p: PetProfile) => void;
  deleteAll: () => Promise<void>;
};

export function useGame(savingOffMsg: string): GameApi {
  const ref = useRef<SaveV2 | null>(null);
  if (ref.current === null) ref.current = loadSave();
  const [save, setSave] = useState<SaveV2>(ref.current);
  const [cards, setCards] = useState<CardQueue>(emptyQueue);
  const cardsRef = useRef(cards);
  const [celebrationsPaused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);
  const warned = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 5000);
  }, []);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current || !ref.current) return;
    dirty.current = false;
    if (!writeSave(ref.current) && !warned.current) {
      warned.current = true;
      showToast(savingOffMsg);
    }
  }, [savingOffMsg, showToast]);

  const update = useCallback(
    (fn: (s: SaveV2) => SaveV2, immediate = false) => {
      const prev = ref.current as SaveV2;
      const next = fn(prev);
      if (next === prev) return;
      ref.current = next;
      setSave(next);
      dirty.current = true;
      if (immediate) flush();
      else {
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(flush, DEBOUNCE_MS);
      }
    },
    [flush],
  );

  const setQueue = useCallback((fn: (q: CardQueue) => CardQueue) => {
    const next = fn(cardsRef.current);
    if (next === cardsRef.current) return;
    cardsRef.current = next;
    setCards(next);
  }, []);

  const enqueueCard = useCallback(
    (kind: CardKind, id: string) => {
      const c: Card = { kind, id, enqueuedAt: Date.now() };
      setQueue((q) => enqueue(q, c));
    },
    [setQueue],
  );

  const award = useCallback(
    (source: BondSource, amount: number | undefined, now: number) => {
      const r = awardTo(ref.current as SaveV2, source, amount, now);
      update(() => r.save);
      if (r.levelUp !== null && !pausedRef.current) enqueueCard("levelUp", levelCardId(r.levelUp));
      return { granted: r.granted, levelUp: r.levelUp };
    },
    [update, enqueueCard],
  );

  // Flush on pagehide and when hidden; adopt another tab's save (P0 two-tab rule).
  useEffect(() => {
    const onHide = () => flush();
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SAVE_KEY || ref.current?.flags.isDemo) return;
      const next = e.newValue === null ? newSave(newInstallSeed()) : parseSave(e.newValue);
      ref.current = next;
      dirty.current = false;
      setSave(next);
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [flush]);

  const replace = useCallback(
    (s: SaveV2) => {
      flush();
      ref.current = s;
      dirty.current = false;
      setSave(s);
      cardsRef.current = emptyQueue();
      setCards(cardsRef.current);
    },
    [flush],
  );

  return useMemo<GameApi>(
    () => ({
      save,
      get: () => ref.current as SaveV2,
      update,
      award,
      cards,
      enqueueCard,
      dismissCard: () => setQueue((q) => dismiss(q, Date.now())),
      removeCardById: (id) => setQueue((q) => removeCard(q, id, Date.now())),
      endSessionCards: () => setQueue(endSession),
      celebrationsPaused,
      pauseCelebrations: () => {
        pausedRef.current = true;
        setPaused(true);
        // Nothing celebratory shows for the rest of this page load (R8); the save keeps everything.
        setQueue((q) => ({
          visible: q.visible && q.visible.kind === "welcome" ? q.visible : null,
          queue: q.queue.filter((c) => c.kind === "welcome"),
        }));
      },
      toast,
      showToast,
      startDemo: () => {
        const s = newSave(newInstallSeed());
        replace({ ...s, profile: { ...DEMO_PROFILE }, flags: { welcomeSeen: false, isDemo: true } });
      },
      exitDemo: () => replace(loadSave()),
      saveProfile: (p) => {
        const cur = ref.current as SaveV2;
        if (cur.flags.isDemo) {
          replace({ ...newSave(newInstallSeed()), profile: p });
          dirty.current = true;
          flush();
          return;
        }
        update((s) => ({ ...s, profile: p }), true);
      },
      deleteAll: async () => {
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = null;
        dirty.current = false;
        await deleteAllMyData();
        replace(newSave(newInstallSeed()));
      },
    }),
    [save, update, award, cards, enqueueCard, setQueue, celebrationsPaused, toast, showToast, replace, flush],
  );
}

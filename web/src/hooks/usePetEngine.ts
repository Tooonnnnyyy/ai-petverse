// Pet engine host (spec §10.2): holds PetState, runs ONE timeout for endsAt, pauses while the tab is hidden.
// step() is pure, so dispatch runs it synchronously against a ref (safe under StrictMode) and hands
// the commands and effects to the caller.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ctx, LineId, PetInput, PetState } from "../shared/types";
import { initPet, step, type StepResult } from "../pet/machine";

export type EngineResult = StepResult & { input: PetInput; changed: boolean };

export type PetEngine = {
  state: PetState;
  greeting: LineId;
  dispatch: (i: PetInput) => EngineResult;
  /** Renderer-confirmed position (e.g. after a play chase moved the pet). */
  syncX: (x: number) => void;
  get: () => PetState;
};

export function usePetEngine(opts: {
  seed: number;
  getCtx: () => Ctx;
  onResult: (r: EngineResult) => void;
  /** Called before every step so the renderer can confirm x for states it moved itself (play). */
  beforeDispatch?: () => void;
  onVisible?: (hiddenMs: number) => void;
}): PetEngine {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const init = useRef<{ state: PetState; greeting: LineId } | null>(null);
  if (init.current === null) {
    const r = initPet(opts.seed, Date.now(), opts.getCtx());
    init.current = { state: r.state, greeting: r.greeting };
  }
  const ref = useRef<PetState>(init.current.state);
  const [state, setState] = useState<PetState>(ref.current);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.visibilityState === "hidden");

  const dispatch = useCallback((input: PetInput): EngineResult => {
    optsRef.current.beforeDispatch?.();
    const prev = ref.current;
    const r = step(prev, input, optsRef.current.getCtx());
    const changed = r.state !== prev;
    if (changed) {
      ref.current = r.state;
      setState(r.state);
    }
    const out = { ...r, input, changed };
    if (changed || r.effects.length > 0 || r.commands.length > 0) optsRef.current.onResult(out);
    return out;
  }, []);

  const syncX = useCallback((x: number) => {
    const s = ref.current;
    if (Math.abs(s.x - x) < 1e-4) return;
    ref.current = { ...s, x: Math.min(1, Math.max(0, x)) };
  }, []);

  // The single scheduler timeout.
  useEffect(() => {
    if (hidden || state.endsAt === null) return;
    const id = window.setTimeout(() => {
      dispatch({ t: "tick" });
    }, Math.max(0, state.endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [state, hidden, dispatch]);

  // No ticks while hidden; "visible" with the hidden duration on return.
  useEffect(() => {
    let hiddenAt = document.visibilityState === "hidden" ? Date.now() : 0;
    const on = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        setHidden(true);
        return;
      }
      const ms = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = 0;
      setHidden(false);
      optsRef.current.onVisible?.(ms);
      dispatch({ t: "visible", hiddenMs: ms });
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [dispatch]);

  return { state, greeting: init.current.greeting, dispatch, syncX, get: () => ref.current };
}

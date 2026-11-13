import { useEffect, useRef } from "react";
import type { GameApi } from "./useGame";
import { addLifeSignal, completeCourse, isActiveCompanionship } from "../game/life";

/** Count foreground use, never hidden-tab elapsed time or unlimited idle time. */
export function useCompanionship(game: GameApi, paused: boolean) {
  const current = useRef({ game, paused });
  current.current = { game, paused };
  useEffect(() => {
    let lastInput = -Infinity;
    let lastTick = Date.now();
    let seconds = 0;
    const input = (e: Event) => { if (e.isTrusted) lastInput = Date.now(); };
    const visibility = () => { lastTick = Date.now(); lastInput = -Infinity; };
    document.addEventListener("pointerdown", input);
    document.addEventListener("keydown", input);
    document.addEventListener("visibilitychange", visibility);
    const timer = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      if (!isActiveCompanionship(now, lastInput, document.visibilityState === "visible", current.current.paused)) return;
      // A throttled browser/suspended device earns no catch-up credit.
      if (delta < 0 || delta > 15_000) return;
      seconds += delta / 1000;
      if (seconds < 60) return;
      seconds -= 60;
      current.current.game.update((s) => ({ ...s, life: addLifeSignal(s.life, "activeMinute", now) }));
    }, 5000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("pointerdown", input);
      document.removeEventListener("keydown", input);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  const course = game.save.life.activeCourse;
  useEffect(() => {
    if (!course) return;
    const finish = () => current.current.game.update((s) => completeCourse(s, Date.now()), true);
    const timer = window.setTimeout(finish, Math.max(0, course.endsAt - Date.now()) + 30);
    return () => window.clearTimeout(timer);
  }, [course]);
}

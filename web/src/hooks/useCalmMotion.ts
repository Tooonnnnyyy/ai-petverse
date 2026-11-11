// Calm motion (spec §5.4, §11): Auto follows prefers-reduced-motion; On and Off override it.
import { useEffect, useState } from "react";
import type { Settings } from "../shared/types";

const QUERY = "(prefers-reduced-motion: reduce)";

function osPrefersReduced(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
  } catch {
    return false;
  }
}

export function useCalmMotion(setting: Settings["calmMotion"]): boolean {
  const [os, setOs] = useState(osPrefersReduced);
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia(QUERY);
    } catch {
      return;
    }
    const on = () => setOs(mq?.matches ?? false);
    mq.addEventListener("change", on);
    return () => mq?.removeEventListener("change", on);
  }, []);
  return setting === "on" ? true : setting === "off" ? false : os;
}

// The away scene (spec §4.4): where the pet is, when it is back, and Call back.
import { useEffect, useState } from "react";
import type { Outing } from "../shared/types";
import { catalogCopy } from "../copy/en/catalog";
import { fill, ui } from "../copy/en/ui";

export const clockTime = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function left(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function AwayCard({ outing, name, onCallBack }: { outing: Outing; name: string; onCallBack: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const place = catalogCopy.places[outing.place].name;
  return (
    <div className="away-card pop-in">
      <p className="away-title">{fill(ui.outing.awayNote, { name, place, time: clockTime(outing.endsAt) })}</p>
      <p className="muted">{fill(ui.outing.awaySub, { name })}</p>
      <p className="away-count" aria-hidden="true">{fill(ui.outing.countdown, { time: left(outing.endsAt - now) })}</p>
      <button type="button" className="btn primary small" onClick={onCallBack}>{fill(ui.outing.callBack, { name })}</button>
    </div>
  );
}

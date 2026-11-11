// Outing sheet (spec §4.4): pick a place and 5/15/25/45 min (+ 1 min Quick look with ?quick=1 or the demo).
import { useState } from "react";
import type { OutingMinutes, PlaceId } from "../shared/types";
import { OUTING_DURATIONS, QUICK_OUTING_MIN } from "../game/config";
import { PLACE_IDS, PLACES, isPlaceUnlocked } from "../game/catalog";
import { catalogCopy } from "../copy/en/catalog";
import { fill, ui } from "../copy/en/ui";

export function OutingPanel(p: {
  name: string;
  level: number;
  quick: boolean;
  blocked: string | null;
  onGo: (place: PlaceId, min: OutingMinutes) => void;
  onClose: () => void;
}) {
  const [place, setPlace] = useState<PlaceId>("garden");
  const durations: OutingMinutes[] = p.quick ? [QUICK_OUTING_MIN, ...OUTING_DURATIONS] : [...OUTING_DURATIONS];
  const [min, setMin] = useState<OutingMinutes>(p.quick ? QUICK_OUTING_MIN : 15);
  return (
    <section className="sheet pop-in" aria-labelledby="outing-title" onKeyDown={(e) => e.key === "Escape" && p.onClose()}>
      <h2 id="outing-title">{fill(ui.outing.title, { name: p.name })}</h2>
      <p className="muted">{fill(ui.outing.hint, { name: p.name })}</p>
      <h3>{ui.outing.place}</h3>
      <div className="option-grid" role="radiogroup" aria-label={ui.outing.place}>
        {PLACE_IDS.map((id) => {
          const open = isPlaceUnlocked(id, p.level);
          const c = catalogCopy.places[id];
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={place === id}
              disabled={!open}
              className={`option${place === id ? " selected" : ""}`}
              onClick={() => setPlace(id)}
            >
              <strong>{c.name}</strong>
              <span>{open ? c.blurb : fill(ui.outing.locked, { level: PLACES[id].unlockLevel })}</span>
            </button>
          );
        })}
      </div>
      <h3>{ui.outing.duration}</h3>
      <div className="chip-row" role="radiogroup" aria-label={ui.outing.duration}>
        {durations.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={min === d} className={`chip${min === d ? " selected" : ""}`} onClick={() => setMin(d)}>
            {d === QUICK_OUTING_MIN ? catalogCopy.durations.quick : fill(catalogCopy.durations.minutes, { n: d })}
          </button>
        ))}
      </div>
      {p.blocked && <p className="note">{p.blocked}</p>}
      <div className="row-end">
        <button type="button" className="btn ghost" onClick={p.onClose}>{ui.outing.cancel}</button>
        <button type="button" className="btn primary" disabled={!!p.blocked} onClick={() => p.onGo(place, min)}>{ui.outing.go}</button>
      </div>
    </section>
  );
}

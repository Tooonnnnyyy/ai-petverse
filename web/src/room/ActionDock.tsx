// Feed (snack chips) · Play · Talk · Outing · More (Put to bed, Lead to bowl) (spec §9.1 Dock).
import { useState } from "react";
import type { DropZone, SnackId, Species } from "../shared/types";
import { SNACKS } from "../game/catalog";
import { fill, ui } from "../copy/en/ui";

export function ActionDock(p: {
  species: Species;
  name: string;
  away: boolean;
  canSendCushion: boolean;
  onFeed: (s: SnackId) => void;
  onPlay: () => void;
  onTalk: () => void;
  onOuting: () => void;
  onSendTo: (z: DropZone) => void;
}) {
  const [open, setOpen] = useState<"feed" | "more" | null>(null);
  const out = fill(ui.dock.isOut, { name: p.name });
  const toggle = (k: "feed" | "more") => setOpen((o) => (o === k ? null : k));
  return (
    <div className="dock">
      <div className="dock-row" role="toolbar" aria-label="Actions">
        <button type="button" className="dock-btn" disabled={p.away} aria-expanded={open === "feed"} onClick={() => toggle("feed")} title={p.away ? out : undefined}>
          <span className="dock-ico" aria-hidden="true">●</span>{ui.dock.feed}
        </button>
        <button type="button" className="dock-btn" disabled={p.away} onClick={() => { setOpen(null); p.onPlay(); }} title={p.away ? out : undefined}>
          <span className="dock-ico" aria-hidden="true">✦</span>{ui.dock.play}
        </button>
        <button type="button" className="dock-btn" onClick={() => { setOpen(null); p.onTalk(); }}>
          <span className="dock-ico" aria-hidden="true">❝</span>{ui.dock.talk}
        </button>
        <button type="button" className="dock-btn" disabled={p.away} onClick={() => { setOpen(null); p.onOuting(); }} title={p.away ? out : undefined}>
          <span className="dock-ico" aria-hidden="true">➶</span>{ui.dock.outing}
        </button>
        <button type="button" className="dock-btn" disabled={p.away} aria-expanded={open === "more"} onClick={() => toggle("more")}>
          <span className="dock-ico" aria-hidden="true">⋯</span>{ui.dock.more}
        </button>
      </div>
      {p.away && <p className="dock-note">{out}</p>}
      {open === "feed" && !p.away && (
        <div className="chip-row pop-in" role="group" aria-label={ui.dock.pickSnack}>
          {SNACKS[p.species].map((s) => (
            <button key={s} type="button" className="chip" onClick={() => { setOpen(null); p.onFeed(s); }}>
              {ui.snacks[s]}
            </button>
          ))}
        </div>
      )}
      {open === "more" && !p.away && (
        <div className="chip-row pop-in" role="group" aria-label={ui.dock.more}>
          <button type="button" className="chip" onClick={() => { setOpen(null); p.onSendTo("bed"); }}>{ui.dock.putToBed}</button>
          <button type="button" className="chip" onClick={() => { setOpen(null); p.onSendTo("bowl"); }}>{ui.dock.leadToBowl}</button>
          {p.canSendCushion && (
            <button type="button" className="chip" onClick={() => { setOpen(null); p.onSendTo("cushion"); }}>{ui.dock.toCushion}</button>
          )}
        </div>
      )}
    </div>
  );
}

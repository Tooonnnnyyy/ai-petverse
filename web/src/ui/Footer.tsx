// Footer (spec §9.1): the disclaimer, "Need help now?", Pause pet, Calm motion and "Delete my data".
import { useState } from "react";
import type { Settings } from "../shared/types";
import { fill, ui } from "../copy/en/ui";
import { ConfirmDialog } from "./ConfirmDialog";

export function Footer(p: {
  name: string | null;
  onHelp: () => void;
  onDelete: () => void;
  paused?: boolean;
  onTogglePause?: () => void;
  motion?: Settings["calmMotion"];
  onMotion?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <footer className="footer">
      <p className="disclaimer">{ui.footer.disclaimer}</p>
      <div className="footer-links">
        <button type="button" className="link" onClick={p.onHelp}>{ui.footer.help}</button>
        {p.onTogglePause && (
          <button type="button" className="link" aria-pressed={!!p.paused} onClick={p.onTogglePause}>
            {p.paused ? ui.footer.resume : ui.footer.pause}
          </button>
        )}
        {p.onMotion && p.motion && (
          <button type="button" className="link" onClick={p.onMotion}>
            {fill(ui.footer.motion, { mode: ui.footer.motionModes[p.motion] })}
          </button>
        )}
        <button type="button" className="link danger" onClick={() => setConfirm(true)}>{ui.footer.delete}</button>
      </div>
      {confirm && (
        <ConfirmDialog
          title={ui.footer.confirmTitle}
          body={p.name ? fill(ui.footer.confirmBody, { name: p.name }) : ui.footer.confirmBodyNoPet}
          yes={ui.footer.confirmYes}
          no={ui.footer.confirmNo}
          onNo={() => setConfirm(false)}
          onYes={() => {
            setConfirm(false);
            p.onDelete();
          }}
        />
      )}
    </footer>
  );
}

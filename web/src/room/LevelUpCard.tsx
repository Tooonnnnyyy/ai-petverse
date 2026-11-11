// Level-up and unlock card (spec §4.2, §4.3): waits for a dismiss; a small burst unless calm.
import type { UnlockId } from "../shared/types";
import { LEVEL_NAMES } from "../game/config";
import { fill, ui } from "../copy/en/ui";

export function LevelUpCard({ level, unlocks, name, calm, onOk }: { level: number; unlocks: UnlockId[]; name: string; calm: boolean; onOk: () => void }) {
  return (
    <div className="stage-card level-card pop-in" role="group" aria-label={fill(ui.levelUp.title, { level })}>
      {!calm && <div className="burst" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}</div>}
      <p className="eyebrow">{fill(ui.levelUp.title, { level })}</p>
      <p className="card-title big">{LEVEL_NAMES[level - 1]}</p>
      {unlocks.length > 0 && (
        <ul className="unlock-list">
          {unlocks.map((u) => (
            <li key={u}><strong>{ui.levelUp.unlocked}</strong> {fill(ui.levelUp.unlocks[u], { name })}</li>
          ))}
        </ul>
      )}
      <p className="muted small">{fill(ui.bond.simulation, { name })}</p>
      <button type="button" className="btn primary small" onClick={onOk}>{ui.levelUp.ok}</button>
    </div>
  );
}

export function WelcomeCard({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="stage-card welcome-card pop-in" role="group" aria-label="Welcome">
      <p>{fill(ui.room.welcomeCard, { name })}</p>
      <button type="button" className="icon-btn" aria-label={ui.room.close} onClick={onClose}>×</button>
    </div>
  );
}

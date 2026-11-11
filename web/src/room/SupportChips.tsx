// Come closer · Stay with me · Quiet time (spec §6.6). 0 Bond; they work while the pet is out too.
import { fill, ui } from "../copy/en/ui";

export type SupportIntent = "come_closer" | "comfort" | "rest";

export function SupportChips(p: { name: string; away: boolean; onSupport: (i: SupportIntent) => void; onCallBack: () => void; offerCallBack: boolean }) {
  return (
    <div className="chip-row support" role="group" aria-label={ui.support.label}>
      {(["come_closer", "comfort", "rest"] as const).map((i) => (
        <button key={i} type="button" className="chip soft" onClick={() => p.onSupport(i)}>
          {ui.support[i]}
        </button>
      ))}
      {p.away && p.offerCallBack && (
        <button type="button" className="chip" onClick={p.onCallBack}>{fill(ui.support.callBack, { name: p.name })}</button>
      )}
    </div>
  );
}

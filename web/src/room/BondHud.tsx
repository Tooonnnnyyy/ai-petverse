// Bond level, progress to the next level and today's earned / cap, shown gently (spec §4.1, §4.2).
import type { BondLedger } from "../shared/types";
import { levelFor } from "../game/bond";
import { DAILY_TOTAL_CAP } from "../game/config";
import { localDayKey } from "../game/time";
import { fill, ui } from "../copy/en/ui";

export function BondHud({ bond, name, bump }: { bond: BondLedger; name: string; bump: number }) {
  const lv = levelFor(bond.total);
  const today = bond.day === localDayKey(Date.now()) ? bond.todayTotal : 0;
  const pct = Math.round(lv.progress * 100);
  const left = lv.nextAt === null ? null : lv.nextAt - bond.total;
  return (
    <div className="bond-hud" title={fill(ui.bond.simulation, { name })}>
      <div className="bond-top">
        <span className="bond-label">{ui.bond.label}</span>
        <strong key={bump} className={bump ? "bond-level pop" : "bond-level"}>
          {fill(ui.bond.level, { level: lv.level, name: lv.name })}
        </strong>
      </div>
      <div
        className="bond-bar"
        role="progressbar"
        aria-label={fill(ui.bond.level, { level: lv.level, name: lv.name })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={left === null ? ui.bond.max : fill(ui.bond.toNext, { n: left })}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="bond-sub">
        <span>{left === null ? ui.bond.max : fill(ui.bond.toNext, { n: left })}</span>
        <span className="bond-today">{fill(ui.bond.today, { n: today, of: DAILY_TOTAL_CAP })}</span>
      </div>
    </div>
  );
}

// Floor bands shown while the pet is held (spec §6.2): 14% of the stage, at least 44 px.
import type { DropZone } from "../shared/types";
import { ZONE_BAND, ZONE_X } from "../pet/timing";
import { ui } from "../copy/en/ui";

export function DropZones({ stageW, zones, hover }: { stageW: number; zones: DropZone[]; hover: DropZone | null }) {
  const w = Math.max(ZONE_BAND.ratio * stageW, ZONE_BAND.minPx);
  return (
    <div className="drop-zones" aria-hidden="true">
      {zones.map((z) => (
        <div
          key={z}
          className={`drop-zone${hover === z ? " hover" : ""}`}
          style={{ left: ZONE_X[z] * stageW - w / 2, width: w }}
        >
          <span>{ui.room.zones[z]}</span>
        </div>
      ))}
    </div>
  );
}

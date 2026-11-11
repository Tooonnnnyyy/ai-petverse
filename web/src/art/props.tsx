// Room props (spec §8.2), drawn in pet units: render each at (viewBox width / 512) x the pet's rendered size
// so they share the pet's scale. Bottom edge of each viewBox is the floor.
import type { ReactNode } from "react";
import { ell, rr } from "./parts";

export type PropId = "bed" | "bowl" | "window" | "cushion" | "windowSeat" | "featherWand" | "ropeToy";
export type PropProps = { className?: string; title?: string };

export const PROP_SIZE: Record<PropId, [number, number]> = {
  bed: [380, 150], bowl: [180, 100], window: [240, 260], cushion: [220, 90],
  windowSeat: [300, 130], featherWand: [260, 240], ropeToy: [260, 90],
};

function Svg({ id, className, title, children }: PropProps & { id: PropId; children: ReactNode }) {
  const [w, h] = PROP_SIZE[id];
  return (
    <svg viewBox={`-6 -6 ${w + 12} ${h + 6}`} className={className ? `prop ${className}` : "prop"} data-prop={id}
      role={title ? "img" : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export const Bed = (p: PropProps) => (
  <Svg id="bed" {...p}>
    <path d={ell(190, 96, 180, 50)} className="pc o6" />
    <path d={ell(190, 118, 150, 22)} className="pcd" />
    <path d={ell(190, 82, 136, 30)} className="pd o4" />
    <path d={ell(190, 92, 110, 16)} className="pdd" />
    <path d={ell(190, 100, 162, 40)} className="nf dash" />
  </Svg>
);

export const Bowl = ({ full, ...p }: PropProps & { full?: boolean }) => (
  <Svg id="bowl" {...p}>
    {full && <>
      <path d="M30 44Q46 14 90 14Q134 14 150 44Z" className="pk o4" />
      <path d={ell(64, 32, 6, 4) + ell(92, 24, 6, 4) + ell(118, 32, 6, 4) + ell(80, 38, 5, 3) + ell(106, 38, 5, 3)} className="pkl" />
    </>}
    <path d="M16 42H164L148 90Q90 100 32 90Z" className="ps o6" />
    <path d={ell(90, 42, 74, 11)} className={full ? "nf o4" : "psd o4"} />
    <path d="M78 64c0-5-8-6-8 0 0 5 8 8 8 11 0-3 8-6 8-11 0-6-8-5-8 0Z" className="pw" />
  </Svg>
);

export const Window = (p: PropProps) => (
  <Svg id="window" {...p}>
    <path d={rr(10, 6, 220, 224, 14)} className="pw o6" />
    {[[28, 24, 92], [128, 24, 92], [28, 132, 80], [128, 132, 80]].map(([x, y, h]) => (
      <path key={`${x}-${y}`} d={rr(x, y, 84, h, 6)} className="sky o4" />
    ))}
    <path d="M44 84q4-16 20-12q8-12 22-2q14 0 12 14Z" className="pw" />
    <path d="M150 182q4-12 16-9q7-9 17-1q11 0 9 10Z" className="pw" />
    <path d={rr(0, 222, 240, 28, 9)} className="po o6" />
  </Svg>
);

export const Cushion = (p: PropProps) => (
  <Svg id="cushion" {...p}>
    <path d="M20 40Q20 12 60 16Q110 4 160 16Q200 12 200 40Q208 74 168 80Q110 90 52 80Q12 74 20 40Z" className="ps o6" />
    <path d="M40 62Q110 74 180 62" className="nf o4 soft" />
    <path d={ell(70, 42, 5, 4) + ell(110, 38, 5, 4) + ell(150, 42, 5, 4)} className="psd" />
  </Svg>
);

export const WindowSeat = (p: PropProps) => (
  <Svg id="windowSeat" {...p}>
    <path d={rr(10, 52, 280, 76, 10)} className="po o6" />
    <path d={rr(30, 70, 110, 44, 6) + rr(160, 70, 110, 44, 6)} className="nf o4 soft" />
    <path d={rr(14, 22, 272, 40, 20)} className="pc o6" />
    <path d="M40 40H260" className="nf dash" />
  </Svg>
);

export const FeatherWand = (p: PropProps) => (
  <Svg id="featherWand" {...p}>
    <path d="M24 228L150 40" className="tk" strokeWidth={22} />
    <path d="M24 228L150 40" className="tpo" strokeWidth={10} />
    <path d="M150 40Q222 34 214 128" className="nf o4" />
    <path d="M214 128q-30 34-8 92q22-34 8-92Z" className="pc o4" />
    <path d="M214 128q30 30 34 82q-36-18-34-82Z" className="po o4" />
    <path d="M214 128q-8 42 20 70q4-40-20-70Z" className="ps o4" />
  </Svg>
);

export const RopeToy = (p: PropProps) => (
  <Svg id="ropeToy" {...p}>
    <path d="M44 46Q130 30 216 46" className="tk" strokeWidth={36} />
    <path d="M44 46Q130 30 216 46" className="tpw" strokeWidth={24} />
    <path d="M44 46Q130 30 216 46" className="tpc" strokeWidth={24} strokeDasharray="10 12" />
    <path d="M10 30l-8-10M8 50l-8 4M14 66l-6 12M250 30l8-10M252 50l8 4M246 66l6 12" className="nf o4" />
    <path d={ell(30, 46, 22, 26) + ell(230, 46, 22, 26)} className="pc o6" />
  </Svg>
);

export const PROPS: Record<PropId, (p: PropProps) => ReactNode> = {
  bed: Bed, bowl: Bowl, window: Window, cushion: Cushion, windowSeat: WindowSeat, featherWand: FeatherWand, ropeToy: RopeToy,
};

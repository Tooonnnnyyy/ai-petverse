// A small drawn token for a souvenir: shape by place, colour from the id. Original placeholder art.
import type { PlaceId, SouvenirId } from "../shared/types";

const SHAPES: Record<PlaceId, string> = {
  garden: "M24 6C34 6 42 14 42 24S34 42 24 42 6 34 6 24 14 6 24 6Z",
  riverside: "M24 4L42 24 24 44 6 24Z",
  market: "M8 10H40V38H8Z",
  hills: "M24 4L44 40H4Z",
};
const COLORS = ["#de735a", "#d29a49", "#98a98e", "#7fa3c0", "#b98ab0", "#c9b26a"];

export function Keepsake({ id, place, locked = false }: { id: SouvenirId; place: PlaceId; locked?: boolean }) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const fillColor = locked ? "var(--paper-deep)" : COLORS[h % COLORS.length];
  return (
    <svg viewBox="0 0 48 48" className={`keepsake${locked ? " locked" : ""}`} aria-hidden="true">
      <path d={SHAPES[place]} fill={fillColor} stroke="var(--ink-soft)" strokeWidth={locked ? 2 : 3} strokeDasharray={locked ? "4 4" : undefined} strokeLinejoin="round" />
      {!locked && <circle cx={18} cy={18} r={4} fill="#fffdf8" opacity={0.7} />}
      {locked && <text x="24" y="30" textAnchor="middle" fontSize="16" fill="var(--ink-soft)">?</text>}
    </svg>
  );
}

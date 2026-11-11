// Floating hearts and "+1 Bond" numbers over the pet (spec §6.1). Calm motion: one static heart.
import { HEART } from "../art/parts";

export type Float = { id: number; kind: "hearts" | "plus" | "ring"; n: number; text?: string };

function HeartIcon({ i }: { i: number }) {
  return (
    <svg viewBox="-16 -16 32 36" className="float-heart" style={{ animationDelay: `${i * 90}ms`, left: `${36 + i * 14 - (i % 2) * 22}%` }} aria-hidden="true">
      <path d={HEART} />
    </svg>
  );
}

export function Hearts({ floats, calm }: { floats: Float[]; calm: boolean }) {
  return (
    <div className="floats" aria-hidden="true">
      {floats.map((f) => {
        if (f.kind === "ring") return calm ? null : <span key={f.id} className="purr-ring" />;
        if (f.kind === "plus") return <span key={f.id} className="float-plus">{f.text}</span>;
        const n = calm ? 1 : f.n;
        return (
          <span key={f.id} className={`float-hearts${calm ? " still" : ""}`}>
            {Array.from({ length: n }, (_, i) => <HeartIcon key={i} i={i} />)}
          </span>
        );
      })}
    </div>
  );
}

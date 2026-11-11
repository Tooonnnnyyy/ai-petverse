// Shared SVG rig for the original placeholder pets (spec §8.1). viewBox 0 0 512 512, floor at y = 450.
// Animated groups carry data-part and never a transform attribute (CSS transforms would override it);
// positioning lives on an inner <g>.
import { useId, type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { CoatId, Species } from "../shared/types";
import "./art.css";

export type EyeState = "open" | "closed" | "happy";
export type MouthState = "closed" | "open" | "yawn";
export type PartName =
  | "body" | "head" | "ear-l" | "ear-r" | "eyes" | "pupils" | "mouth" | "tail"
  | "paw-fl" | "paw-fr" | "paw-bl" | "paw-br" | "accessory";
export type Face = { eyes: EyeState; mouth: MouthState; headDy?: number };
export type Pose = ComponentType<Face>;
export type PoseSet = { talk: Pose; rest: Pose; walk: [Pose, Pose]; held: Pose; stretch: Pose };
export type TailSpec = { d: string; w: number; o: [number, number] };
type PoseArgs = Face & { sp: Species; tail: TailSpec };

type Coat = { coat: string; shade: string; belly: string; earInner: string; eye: string; nose: string };
export const COATS: Record<CoatId, Coat> = {
  ginger: { coat: "#ec9a54", shade: "#c9733b", belly: "#fde7c8", earInner: "#f4a99c", eye: "#9bb84e", nose: "#e9877b" },
  grey: { coat: "#a3abb5", shade: "#7a8490", belly: "#eef0f2", earInner: "#f1b4ab", eye: "#e8b84a", nose: "#d98d8e" },
  tan: { coat: "#dcaa6c", shade: "#b4824a", belly: "#f8e9d0", earInner: "#9d6c3c", eye: "#5e3d27", nose: "#2e2622" },
  blackTan: { coat: "#4a423e", shade: "#2f2927", belly: "#d69d5c", earInner: "#2f2927", eye: "#80502e", nose: "#1f1a18" },
};
export const COAT_SPECIES: Record<CoatId, Species> = { ginger: "cat", grey: "cat", tan: "dog", blackTan: "dog" };
export const DEFAULT_COAT: Record<Species, CoatId> = { cat: "ginger", dog: "tan" };

/** A coat that belongs to the species, else the species' first preset ("Not sure yet"). */
export function resolveCoat(species: Species, coat?: CoatId | null): CoatId {
  return coat && COAT_SPECIES[coat] === species ? coat : DEFAULT_COAT[species];
}

export function coatStyle(id: CoatId): CSSProperties {
  const c = COATS[id];
  return {
    "--coat": c.coat, "--coat-shade": c.shade, "--belly": c.belly,
    "--ear-inner": c.earInner, "--eye": c.eye, "--nose": c.nose,
  } as CSSProperties;
}

// ---- path helpers ----
export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
export const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

// ---- primitives ----
export function Part({ name, t, o, children }: { name: PartName; t?: string; o?: [number, number]; children?: ReactNode }) {
  return (
    <g data-part={name} style={o ? { transformOrigin: `${o[0]}px ${o[1]}px` } : undefined}>
      <g transform={t}>{children}</g>
    </g>
  );
}

/** Filled shape with a 6 px ink outline; children are clipped inside it (shading, belly patches). */
export function Blob({ d, f = "c", t, children }: { d: string; f?: string; t?: string; children?: ReactNode }) {
  const id = "pc" + useId().replace(/\W/g, "");
  if (!children) return <path d={d} className={`${f} o6`} transform={t} />;
  return (
    <g transform={t}>
      <path d={d} className={f} />
      <clipPath id={id}><path d={d} /></clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
      <path d={d} className="nf o6" />
    </g>
  );
}

/** Round-capped limb or tail: ink stroke under a coat stroke. */
export const Tube = ({ d, w, f = "c" }: { d: string; w: number; f?: string }) => (
  <g>
    <path d={d} className="tk" strokeWidth={w + 12} />
    <path d={d} className={f === "s" ? "ts" : "tc"} strokeWidth={w} />
  </g>
);

export const Paw = ({ x, y, rx = 24, ry = 12 }: { x: number; y: number; rx?: number; ry?: number }) => (
  <Blob d={ell(x, y, rx, ry)}>
    <path d={`M${x - rx / 3} ${y + ry}v-8M${x + rx / 3} ${y + ry}v-8`} className="nf o4" />
  </Blob>
);

export const TailPart = ({ t, dy = 0 }: { t: TailSpec; dy?: number }) => (
  <Part name="tail" o={t.o} t={dy ? `translate(0 ${dy})` : undefined}><Tube d={t.d} w={t.w} /></Part>
);

// ---- head (front or 3/4 via `look`), coordinates relative to the head centre ----
const CAT_HEAD = "M-94 8C-94-52-52-80 0-80S94-52 94 8C94 58 50 78 0 78S-94 58-94 8Z";
const DOG_HEAD = "M-86 2C-86-56-48-82 0-82S86-56 86 2C86 54 50 80 0 80S-86 54-86 2Z";
const CAT_EAR = "M-82-30L-72-110Q-68-120-58-113L-8-72Z";
const CAT_EAR_IN = "M-70-46L-64-98L-30-70Z";
const DOG_EAR = "M-58-64C-100-68-112-8-104 36C-99 58-74 60-70 38C-66 14-56-30-44-58Z";

function Eyes({ cat, state, L }: { cat: boolean; state: EyeState; L: number }) {
  const ex = cat ? 40 : 37, ey = cat ? 0 : -4;
  const xs = [L - ex, L + ex];
  if (state !== "open") {
    const d = xs.map((x) => (state === "closed" ? `M${x - 17} ${ey}q17 13 34 0` : `M${x - 17} ${ey + 7}q17-22 34 0`)).join("");
    return <g data-part="eyes" data-state={state}><path d={d} className="nf o6" /><g data-part="pupils" /></g>;
  }
  return (
    <g data-part="eyes" data-state="open">
      <path d={xs.map((x) => ell(x, ey, 20, 24)).join("")} className="ey o4" />
      <g data-part="pupils">
        <path d={xs.map((x) => ell(x + L * 0.25, ey + 3, 13, 16)).join("")} className="k" />
        <path d={xs.map((x) => ell(x - 6, ey - 8, 6, 6) + ell(x + 7, ey + 10, 3, 3)).join("")} className="w" />
      </g>
    </g>
  );
}

function Muzzle({ cat, mouth, L }: { cat: boolean; mouth: MouthState; L: number }) {
  const ny = cat ? 24 : 20, my = cat ? 40 : 42;
  const nose = cat ? `M${L - 11} ${ny}q11-6 22 0q-5 10-11 11q-6-1-11-11Z` : ell(L, ny, 17, 12);
  const stem = <path d={`M${L} ${ny + 10}V${my}`} className="nf o4" />;
  return (
    <g data-part="mouth">
      {mouth === "closed" && <path d={`M${L} ${ny + 10}V${my}m-16 0q8 10 16 0q8 10 16 0`} className="nf o4" />}
      {mouth === "open" && <>{stem}<path d={`M${L - 16} ${my}Q${L} ${my + 36} ${L + 16} ${my}Z`} className="mo o4" /><path d={ell(L, my + 11, 8, 5)} className="tg" /></>}
      {mouth === "yawn" && <>
        <path d={ell(L, my + 16, 21, 24)} className="mo o4" />
        <path d={ell(L, my + 30, 12, 7)} className="tg" />
        {cat && <path d={`M${L - 11} ${my}l3 8 3-8zM${L + 11} ${my}l-3 8-3-8z`} className="w" />}
      </>}
      <path d={nose} className="n o4" />
      {!cat && <path d={ell(L - 5, ny - 4, 5, 3)} className="w" opacity={0.7} />}
    </g>
  );
}

export function Head({ sp, x, y, s = 1, look = 0, ears = "down", eyes, mouth }: {
  sp: Species; x: number; y: number; s?: number; look?: number; ears?: "down" | "out"; eyes: EyeState; mouth: MouthState;
}) {
  const cat = sp === "cat", L = look;
  const flop = ears === "out" ? "rotate(34 -58 -62)" : "";
  return (
    <Part name="head" t={`translate(${x} ${y}) scale(${s})`}>
      {cat && <>
        <Part name="ear-l"><path d={CAT_EAR} className="c o6" /><path d={CAT_EAR_IN} className="ei" /></Part>
        <Part name="ear-r" t="scale(-1 1)"><path d={CAT_EAR} className="c o6" /><path d={CAT_EAR_IN} className="ei" /></Part>
      </>}
      <Blob d={cat ? CAT_HEAD : DOG_HEAD}>
        <path d={ell(64, 54, 74, 60)} className="s" opacity={0.5} />
        <path d={ell(L, cat ? 34 : 40, cat ? 44 : 48, cat ? 28 : 34)} className="b" />
        {!cat && <path d={ell(L * 0.6 - 38, -32, 11, 7) + ell(L * 0.6 + 38, -32, 11, 7)} className="b" />}
      </Blob>
      {!cat && <>
        <Part name="ear-l" t={flop || undefined}><path d={DOG_EAR} className="s o6" /></Part>
        <Part name="ear-r" t={`scale(-1 1) ${flop}`}><path d={DOG_EAR} className="s o6" /></Part>
      </>}
      <path d={ell(L - 60, 30, 13, 8) + ell(L + 60, 30, 13, 8)} className="bl" />
      <Eyes cat={cat} state={eyes} L={L} />
      <Muzzle cat={cat} mouth={mouth} L={L} />
      {cat && <path d={`M${L - 56} 26L-112 14M${L - 56} 36L-114 40M${L + 56} 26L112 14M${L + 56} 36L114 40`} className="nf o3" />}
    </Part>
  );
}

// ---- shared poses (species-specific tails come from cat.tsx / dog.tsx) ----

/** Talk / stand: sitting front-on. */
export function SitPose({ sp, tail, eyes, mouth, headDy = 0 }: PoseArgs) {
  const w = sp === "dog" ? 6 : 0;
  return <>
    <TailPart t={tail} />
    <Part name="paw-bl"><Blob d={ell(196 - w, 416, 44, 34)} /></Part>
    <Part name="paw-br"><Blob d={ell(316 + w, 416, 44, 34)} /></Part>
    <Part name="body">
      <Blob d={`M256 ${244 - w}C${204 - w} ${244 - w} ${174 - w} 300 ${172 - w} 362C${170 - w} 424 196 450 256 450C316 450 ${342 + w} 424 ${340 + w} 362C${338 + w} 300 ${308 + w} ${244 - w} 256 ${244 - w}Z`}>
        <path d={ell(354 + w, 372, 56, 124)} className="s" />
        <path d={ell(256, 300, 48, 52)} className="b" />
      </Blob>
    </Part>
    <Part name="paw-fl"><Blob d={rr(216 - w / 2, 330, 36 + w / 2, 110, 18)} /><Paw x={234 - w / 2} y={438} /></Part>
    <Part name="paw-fr"><Blob d={rr(260, 330, 36 + w / 2, 110, 18)} /><Paw x={278 + w / 2} y={438} /></Part>
    <Head sp={sp} x={256} y={196 - w + headDy} eyes={eyes} mouth={mouth} />
    <Part name="accessory" />
  </>;
}

// Side-view legs per walk frame: near back, near front, far back, far front (P0: contact, passing).
const WALK = [
  ["M192 360L160 429", "M318 360L352 429", "M212 360L236 429", "M300 360L276 429"],
  ["M192 360L198 429", "M318 360L314 429", "M210 360Q198 398 182 414", "M300 360Q314 398 334 412"],
];

/** Walk frames, side view facing right (the renderer mirrors). */
export function WalkPose({ sp, tail, eyes, mouth, headDy = 0, frame }: PoseArgs & { frame: number }) {
  const l = WALK[frame % 2], b = frame % 2 ? -4 : 0, dog = sp === "dog";
  return <>
    <TailPart t={tail} dy={b} />
    <Part name="paw-br"><Tube d={l[2]} w={30} f="s" /></Part>
    <Part name="paw-fr"><Tube d={l[3]} w={30} f="s" /></Part>
    <Part name="paw-bl"><Tube d={l[0]} w={30} /></Part>
    <Part name="paw-fl"><Tube d={l[1]} w={30} /></Part>
    <Part name="body" t={b ? `translate(0 ${b})` : undefined}>
      <Blob d={ell(254, 336, dog ? 110 : 104, dog ? 60 : 56)}>
        <path d={ell(254, 398, 130, 34)} className="s" />
        <path d={ell(290, 392, 64, 22)} className="b" />
      </Blob>
    </Part>
    <Head sp={sp} x={348} y={262 + b + headDy} s={0.92} look={12} eyes={eyes} mouth={mouth} />
    <Part name="accessory" />
  </>;
}

/** Held: front view, stretched tall, front legs up under the arms, back legs dangling. */
export function HeldPose({ sp, tail, eyes, mouth, headDy = 0 }: PoseArgs) {
  return <>
    <TailPart t={tail} />
    <Part name="paw-bl"><Tube d="M232 384L226 428" w={30} /></Part>
    <Part name="paw-br"><Tube d="M280 384L286 428" w={30} /></Part>
    <Part name="paw-fl"><Tube d="M214 254L166 226" w={28} /></Part>
    <Part name="paw-fr"><Tube d="M298 254L346 226" w={28} /></Part>
    <Part name="body">
      <Blob d="M256 206C206 206 190 262 194 322C198 384 220 414 256 414C292 414 314 384 318 322C322 262 306 206 256 206Z">
        <path d={ell(338, 330, 50, 124)} className="s" />
        <path d={ell(256, 236, 44, 46) + ell(256, 352, 38, 54)} className="b" />
      </Blob>
    </Part>
    <Head sp={sp} x={256} y={150 + headDy} ears={sp === "dog" ? "out" : "down"} eyes={eyes} mouth={mouth} />
    <Part name="accessory" />
  </>;
}

/** Stretch: play bow facing right, front low, rear up. */
export function StretchPose({ sp, tail, eyes, mouth, headDy = 0 }: PoseArgs) {
  const dog = sp === "dog";
  return <>
    <TailPart t={tail} />
    <Part name="paw-br"><Tube d="M214 330L216 429" w={30} f="s" /></Part>
    <Part name="paw-fr"><Tube d="M304 396L420 424" w={30} f="s" /></Part>
    <Part name="paw-bl"><Tube d="M192 330L184 429" w={30} /></Part>
    <Part name="paw-fl"><Tube d="M316 404L396 429" w={30} /></Part>
    <Part name="body">
      <Blob d={ell(250, 350, dog ? 106 : 100, dog ? 56 : 52)} t="rotate(22 250 350)">
        <path d={ell(250, 410, 130, 40)} className="s" />
      </Blob>
    </Part>
    <Head sp={sp} x={354} y={318 + headDy} s={0.92} look={12} eyes={eyes} mouth={mouth} />
    <Part name="accessory" />
  </>;
}

// ---- overlay glyphs ----
export const HEART = "M0-4C0-12-14-14-14-3C-14 7 0 12 0 18C0 12 14 7 14-3C14-14 0-12 0-4Z";
export const ZED = "M-10-10H10L-10 10H10";

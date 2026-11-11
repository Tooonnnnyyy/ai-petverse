// Dev-only contact sheet (?artsheet=1, spec §8.2 review gate): every pose per P0 coat, plus all props.
// The dashed line marks the floor (y = 450) so baseline jumps are easy to spot.
import type { CoatId, PoseSlot, Species } from "../shared/types";
import PlaceholderPet from "./PlaceholderPet";
import type { EyeState, MouthState } from "./parts";
import { Bowl, PROPS, type PropId } from "./props";

const COMBOS: [Species, CoatId][] = [["cat", "ginger"], ["cat", "grey"], ["dog", "tan"], ["dog", "blackTan"]];
type Cell = { label: string; slot: PoseSlot; frame?: number; eyes?: EyeState; mouth?: MouthState };
const CELLS: Cell[] = [
  { label: "talk", slot: "talk" },
  { label: "talk · mouth open", slot: "talk", mouth: "open" },
  { label: "slow blink", slot: "talk", eyes: "closed" },
  { label: "happy", slot: "happy" },
  { label: "yawn", slot: "transition", mouth: "yawn" },
  { label: "stretch", slot: "transition" },
  { label: "rest A", slot: "rest" },
  { label: "eat", slot: "eat" },
  { label: "sleep", slot: "sleep" },
  { label: "walk 1 (contact)", slot: "walk", frame: 0 },
  { label: "walk 2 (passing)", slot: "walk", frame: 1 },
  { label: "play", slot: "play" },
  { label: "held", slot: "held" },
];
const PROP_LABELS: Record<PropId, string> = {
  bed: "bed", bowl: "bowl", window: "window", cushion: "cushion (L2)",
  windowSeat: "window seat (L4)", featherWand: "feather wand", ropeToy: "rope toy",
};

export default function ArtSheet() {
  return (
    <main className="artsheet">
      <h1>Placeholder art contact sheet</h1>
      <p>Original drawn stand-ins. Dashed line = floor (y 450). Walk faces right; the room mirrors it.</p>
      {COMBOS.map(([species, coat]) => (
        <section key={coat}>
          <h2>{species} · {coat}</h2>
          <div className="artsheet-grid">
            {CELLS.map((c) => (
              <figure className="artsheet-cell" key={c.label}>
                <div className="artsheet-box">
                  <span className="artsheet-floor" />
                  <PlaceholderPet species={species} coat={coat} slot={c.slot} frame={c.frame} eyes={c.eyes} mouth={c.mouth} title={`${species} ${c.label}`} />
                </div>
                <figcaption>{c.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2>props</h2>
        <div className="artsheet-grid">
          {(Object.keys(PROPS) as PropId[]).map((id) => {
            const Prop = PROPS[id];
            return (
              <figure className="artsheet-cell" key={id}>
                <div className="artsheet-box"><Prop title={PROP_LABELS[id]} /></div>
                <figcaption>{PROP_LABELS[id]}</figcaption>
              </figure>
            );
          })}
          <figure className="artsheet-cell">
            <div className="artsheet-box"><Bowl full title="bowl, full" /></div>
            <figcaption>bowl (full)</figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}

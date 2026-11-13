import type { PoseSlot } from "../shared/types";

export function PhotoPet({ src, name, slot }: { src: string; name: string; slot: PoseSlot }) {
  return <span className={`photo-pet photo-pet-${slot}`} role="img" aria-label={`${name}, photo-grounded pet`}>
    <img src={src} alt="" draggable={false} />
    <span className="photo-pet-glow" aria-hidden="true" />
  </span>;
}

// Speech bubble above the pet (spec §6.5). Announced through the live region, so hidden from AT here.
export type BubbleData = { key: number; text: string };

export function Bubble({ bubble }: { bubble: BubbleData | null }) {
  if (!bubble || !bubble.text) return null;
  return (
    <div key={bubble.key} className="bubble" aria-hidden="true">
      {bubble.text}
    </div>
  );
}

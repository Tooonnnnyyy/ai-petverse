// The single polite live region (spec §11): bubbles, results of the user's own actions, outings, level-ups.
export function LiveRegion({ text }: { text: string }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {text}
    </div>
  );
}

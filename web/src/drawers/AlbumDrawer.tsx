// Album drawer (spec §9.1): Souvenirs (silhouettes until found) and Postcards, each "n of 24", plus days together.
import { useEffect, useRef, useState } from "react";
import type { AlbumState } from "../shared/types";
import { albumCounts } from "../game/album";
import { PLACE_IDS, PLACES, placeOfStory } from "../game/catalog";
import { catalogCopy } from "../copy/en/catalog";
import { souvenirCopy, storyCopy } from "../copy/lookup";
import { fill, ui } from "../copy/en/ui";
import { Keepsake } from "../room/Keepsake";

export function AlbumDrawer({ album, days, name, onClose }: { album: AlbumState; days: number; name: string; onClose: () => void }) {
  const [tab, setTab] = useState<"souvenirs" | "postcards">("souvenirs");
  const ref = useRef<HTMLDivElement | null>(null);
  const counts = albumCounts(album);
  const owned = new Set(album.souvenirs);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    return () => prev?.focus?.();
  }, []);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const f = ref.current?.querySelectorAll<HTMLElement>("button");
            if (!f || f.length === 0) return;
            const first = f[0];
            const last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }}
      >
        <div className="drawer-head">
          <h2 id="album-title">{ui.album.title}</h2>
          <button type="button" className="icon-btn" aria-label={ui.album.close} onClick={onClose}>×</button>
        </div>
        <p className="muted">
          {fill(ui.album.days, { n: days })} · {fill(ui.album.outings, { n: album.outingsCompleted })}
        </p>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "souvenirs"} className={tab === "souvenirs" ? "tab on" : "tab"} onClick={() => setTab("souvenirs")}>
            {ui.album.souvenirs} <span className="count">{fill(ui.album.count, { n: counts.owned, of: counts.total })}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "postcards"} className={tab === "postcards" ? "tab on" : "tab"} onClick={() => setTab("postcards")}>
            {ui.album.postcards} <span className="count">{album.postcards.length}</span>
          </button>
        </div>
        {tab === "souvenirs" ? (
          <div role="tabpanel">
            {PLACE_IDS.map((place) => (
              <section key={place} className="album-place">
                <h3>
                  {catalogCopy.places[place].name}{" "}
                  <span className="count">{fill(ui.album.count, { n: counts.byPlace[place].owned, of: counts.byPlace[place].total })}</span>
                </h3>
                <ul className="souvenir-grid">
                  {[...PLACES[place].everyday, PLACES[place].keepsake].map((id) => {
                    const have = owned.has(id);
                    const c = souvenirCopy(id);
                    return (
                      <li key={id} className={have ? "souvenir" : "souvenir locked"}>
                        <Keepsake id={id} place={place} locked={!have} />
                        <span className="small">{have ? c.name : ui.album.locked}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div role="tabpanel">
            {album.postcards.length === 0 ? (
              <p className="muted">{fill(ui.album.noPostcards, { name })}</p>
            ) : (
              <ul className="postcards">
                {[...album.postcards].reverse().map((id, i) => {
                  const place = placeOfStory(id);
                  return (
                    <li key={`${id}-${i}`} className="postcard">
                      <strong>{place ? catalogCopy.places[place].name : ""}</strong>
                      <span>{storyCopy(id, name)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// The gift card (spec §4.4): flips over in 600 ms (a fade in calm motion), NEW stamp, a 1–2 line story.
import { useState } from "react";
import type { OutingReward } from "../shared/types";
import { catalogCopy } from "../copy/en/catalog";
import { placeOfSouvenir } from "../game/catalog";
import { fill, ui } from "../copy/en/ui";
import { Keepsake } from "./Keepsake";
import { souvenirCopy, storyCopy } from "../copy/lookup";

export function GiftCard({ reward, name, onKeep }: { reward: OutingReward; name: string; onKeep: () => void }) {
  const [open, setOpen] = useState(false);
  const story = storyCopy(reward.storyId, name);
  const place = reward.kind === "postcard" ? reward.place : placeOfSouvenir(reward.id) ?? "garden";
  const placeName = catalogCopy.places[place].name;
  return (
    <div className={`stage-card gift-card${open ? " open" : ""}`} role="group" aria-label={fill(ui.gift.title, { name })}>
      <div className="gift-inner">
        <div className="gift-face gift-back">
          <div className="parcel" aria-hidden="true" />
          <p className="card-title">{fill(ui.gift.title, { name })}</p>
          <button type="button" className="btn primary small" onClick={() => setOpen(true)} autoFocus>{ui.gift.open}</button>
        </div>
        <div className="gift-face gift-front" aria-hidden={!open}>
          {reward.kind === "souvenir" ? (
            <>
              <span className="stamp">{ui.gift.newStamp}</span>
              <Keepsake id={reward.id} place={place} />
              <p className="card-title">{fill(ui.gift.souvenir, { item: souvenirCopy(reward.id).name })}</p>
              <p className="muted small">{souvenirCopy(reward.id).note}</p>
            </>
          ) : (
            <p className="card-title">{fill(ui.gift.postcard, { place: placeName })}</p>
          )}
          <p className="story">{story}</p>
          {reward.kind === "postcard" && reward.hint === "longerTrip" && <p className="muted small">{catalogCopy.gift.longerTripHint}</p>}
          {open && <button type="button" className="btn primary small" onClick={onKeep} autoFocus>{ui.gift.keep}</button>}
        </div>
      </div>
    </div>
  );
}

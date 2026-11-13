// Onboarding (spec §9.1, trimmed to 3 quick steps for iteration 1): nothing pre-filled, "Not sure yet"
// on every choice, progress from steps.length, saves only on "Meet {name}".
import { useState } from "react";
import type { BreedId, CoatId, ComfortStyle, Energy, PetProfile, Species } from "../shared/types";
import PlaceholderPet from "../art/PlaceholderPet";
import { fill, ui } from "../copy/en/ui";

const COATS: Record<Species, CoatId[]> = { cat: ["ginger", "grey"], dog: ["tan", "blackTan"] };
const STEPS = ["species", "name", "photos", "company"] as const;
const BREEDS: Record<Species, { value: BreedId; label: string }[]> = {
  cat: [{ value: "orangeCat", label: "Orange cat" }, { value: "tabbyCat", label: "Tabby cat" }],
  dog: [{ value: "goldenRetriever", label: "Golden retriever" }, { value: "blackLab", label: "Black lab" }],
};
const MAX_NAME = 24;

function Options<T extends string>(p: { label: string; value: T | null; options: { value: T | null; label: string; detail?: string }[]; onPick: (v: T | null) => void }) {
  return (
    <div className="option-grid" role="radiogroup" aria-label={p.label}>
      {p.options.map((o) => (
        <button
          key={o.value ?? "unsure"}
          type="button"
          role="radio"
          aria-checked={p.value === o.value}
          className={`option${p.value === o.value ? " selected" : ""}`}
          onClick={() => p.onPick(o.value)}
        >
          <strong>{o.label}</strong>
          {o.detail && <span>{o.detail}</span>}
        </button>
      ))}
    </div>
  );
}

export function Onboarding({ onDone, onCancel }: { onDone: (p: PetProfile, photos: File[]) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [species, setSpecies] = useState<Species | null>(null);
  const [coat, setCoat] = useState<CoatId | null>(null);
  const [breed, setBreed] = useState<BreedId | null>(null);
  const [name, setName] = useState("");
  const [comfort, setComfort] = useState<ComfortStyle | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [comfortTouched, setComfortTouched] = useState(false);
  const [energyTouched, setEnergyTouched] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoConsent, setPhotoConsent] = useState(false);

  const trimmed = name.trim();
  const id = STEPS[step];
  const canNext = id === "species" ? species !== null : id === "name" ? trimmed.length >= 1 && trimmed.length <= MAX_NAME : id === "photos" ? photos.length === 0 || photoConsent : comfortTouched && energyTouched;
  const finish = () =>
    onDone({
      name: trimmed,
      species: species ?? "cat",
      energy,
      comfortStyle: comfort,
      trigger: null,
      favouriteActivity: "",
      coat,
      breed,
    }, photos);

  return (
    <main className="onboarding">
      <div className="ob-progress">
        <span>{fill(ui.onboarding.stepOf, { n: step + 1, of: STEPS.length })}</span>
        <div className="bar" aria-hidden="true"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>

      <form
        className="ob-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canNext) return;
          if (step < STEPS.length - 1) setStep(step + 1);
          else finish();
        }}
      >
        {id === "species" && (
          <>
            <h1>{ui.onboarding.species.title}</h1>
            <p className="muted">{ui.onboarding.species.hint}</p>
            <div className="species-row" role="radiogroup" aria-label="Species">
              {(["cat", "dog"] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  role="radio"
                  aria-checked={species === sp}
                  className={`species-card${species === sp ? " selected" : ""}`}
                  onClick={() => {
                    setSpecies(sp);
                    setBreed(null);
                    if (coat && !COATS[sp].includes(coat)) setCoat(null);
                  }}
                >
                  <PlaceholderPet species={sp} coat={species === sp ? coat : null} slot="talk" />
                  <strong>{sp === "cat" ? ui.onboarding.species.cat : ui.onboarding.species.dog}</strong>
                </button>
              ))}
            </div>
            {species && (
              <>
                <h2 className="h3">{ui.onboarding.species.coat}</h2>
                <div className="coat-row" role="radiogroup" aria-label={ui.onboarding.species.coat}>
                  {COATS[species].map((c) => (
                    <button key={c} type="button" role="radio" aria-checked={coat === c} className={`coat-swatch${coat === c ? " selected" : ""}`} onClick={() => setCoat(c)}>
                      <PlaceholderPet species={species} coat={c} slot="rest" />
                      <span>{ui.coats[c]}</span>
                    </button>
                  ))}
                  <button type="button" role="radio" aria-checked={coat === null} className={`coat-swatch unsure${coat === null ? " selected" : ""}`} onClick={() => setCoat(null)}>
                    <span>{ui.onboarding.notSure}</span>
                  </button>
                </div>
                <h2 className="h3">Type (optional)</h2>
                <div className="chip-row" role="radiogroup" aria-label="Type">
                  {BREEDS[species].map((b) => <button key={b.value} type="button" role="radio" aria-checked={breed === b.value} className={`chip${breed === b.value ? " selected" : ""}`} onClick={() => setBreed(b.value)}>{b.label}</button>)}
                  <button type="button" role="radio" aria-checked={breed === null} className={`chip${breed === null ? " selected" : ""}`} onClick={() => setBreed(null)}>Not sure yet</button>
                </div>
              </>
            )}
          </>
        )}

        {id === "photos" && (
          <>
            <h1>Bring your pet in</h1>
            <p className="muted">Add up to 3 clear photos so the room can use your pet as a visual reference. Photos stay in this browser for this MVP.</p>
            <label className="photo-picker"><span className="btn primary">Choose cat or dog photos</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []).filter((f) => f.size <= 8 * 1024 * 1024).slice(0, 3))} /></label>
            {photos.length > 0 && <p className="small">{photos.length} photo{photos.length === 1 ? "" : "s"} selected · local only</p>}
            <label className="consent-row"><input type="checkbox" checked={photoConsent} onChange={(e) => setPhotoConsent(e.target.checked)} /><span>I agree to keep these photos locally for my pet profile.</span></label>
            <p className="note">This creates a photo-grounded approximation with gentle motion. It is not a medical, identity or perfect 3D reconstruction.</p>
          </>
        )}

        {id === "name" && (
          <>
            <div className="ob-name-pet" aria-hidden="true">
              <PlaceholderPet species={species ?? "cat"} coat={coat} slot="happy" />
            </div>
            <h1>{ui.onboarding.name.title}</h1>
            <p className="muted">{ui.onboarding.name.hint}</p>
            <label className="field">
              <span>{ui.onboarding.name.label}</span>
              <input autoFocus value={name} maxLength={40} placeholder={ui.onboarding.name.placeholder} onChange={(e) => setName(e.target.value)} />
            </label>
            {trimmed.length > MAX_NAME && <p className="note">{ui.onboarding.name.tooLong}</p>}
          </>
        )}

        {id === "company" && (
          <>
            <h1>{ui.onboarding.company.title}</h1>
            <p className="muted">{ui.onboarding.company.hint}</p>
            <h2 className="h3">{ui.onboarding.company.comfortLabel}</h2>
            <Options<ComfortStyle>
              label={ui.onboarding.company.comfortLabel}
              value={comfortTouched ? comfort : ("-" as ComfortStyle)}
              options={[
                ...(["close", "nearby", "space"] as const).map((v) => ({ value: v, label: ui.comfort[v].label, detail: ui.comfort[v].detail })),
                { value: null, label: ui.onboarding.notSure },
              ]}
              onPick={(v) => { setComfort(v); setComfortTouched(true); }}
            />
            <h2 className="h3">{ui.onboarding.company.energyLabel}</h2>
            <Options<Energy>
              label={ui.onboarding.company.energyLabel}
              value={energyTouched ? energy : ("-" as Energy)}
              options={[
                ...(["low", "steady", "high"] as const).map((v) => ({ value: v, label: ui.energy[v].label, detail: ui.energy[v].detail })),
                { value: null, label: ui.onboarding.notSure },
              ]}
              onPick={(v) => { setEnergy(v); setEnergyTouched(true); }}
            />
          </>
        )}

        <div className="ob-nav">
          <button type="button" className="btn ghost" onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>
            {step === 0 ? ui.onboarding.cancel : ui.onboarding.back}
          </button>
          <button type="submit" className="btn primary" disabled={!canNext}>
            {step < STEPS.length - 1 ? ui.onboarding.next : fill(ui.onboarding.finish, { name: trimmed || "them" })}
          </button>
        </div>
      </form>
    </main>
  );
}

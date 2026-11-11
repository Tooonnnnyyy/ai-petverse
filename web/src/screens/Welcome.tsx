// Welcome (spec §9.1): short pitch, Continue / Meet my pet / Try a demo pet. No account, no email.
import PlaceholderPet from "../art/PlaceholderPet";
import { fill, ui } from "../copy/en/ui";

export function Welcome(p: { savedName: string | null; onContinue: () => void; onMeet: () => void; onDemo: () => void }) {
  return (
    <main className="welcome">
      <div className="welcome-art" aria-hidden="true">
        <PlaceholderPet species="cat" coat="ginger" slot="happy" />
        <PlaceholderPet species="dog" coat="tan" slot="talk" />
      </div>
      <div className="welcome-copy">
        <p className="eyebrow">{ui.welcome.kicker}</p>
        <h1>{ui.welcome.title}</h1>
        <p className="lead">{ui.welcome.pitch}</p>
        <div className="welcome-actions">
          {p.savedName && (
            <button type="button" className="btn primary big" onClick={p.onContinue}>
              {fill(ui.welcome.continueWith, { name: p.savedName })}
            </button>
          )}
          <button type="button" className={`btn big ${p.savedName ? "ghost" : "primary"}`} onClick={p.onMeet}>{ui.welcome.meet}</button>
          <button type="button" className="btn ghost big" onClick={p.onDemo}>
            {ui.welcome.demo} <span className="badge">{ui.app.demoBadge}</span>
          </button>
        </div>
        <p className="muted small">{ui.welcome.demoNote}</p>
        <p className="muted small">{ui.welcome.footnote}</p>
      </div>
    </main>
  );
}

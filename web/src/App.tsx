import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { interpretIntent, petModeForIntent, responseForIntent } from "./policy";
import type {
  ComfortStyle,
  Energy,
  Feedback,
  Intent,
  PetEvent,
  PetMode,
  PetProfile,
  Species,
} from "./types";

type Screen = "signin" | "onboarding" | "studio";
type View = "companion" | "community";

const defaultProfile: PetProfile = {
  name: "Miso",
  species: "cat",
  energy: "steady",
  comfortStyle: "close",
  trigger: "sudden noise",
  favouriteActivity: "window watching",
  correction: "hides when startled",
  published: false,
};

const profileStorageKey = "ai-petverse.preview.profile";

const energyOptions: Array<{ value: Energy; label: string; detail: string }> = [
  { value: "low", label: "Soft and slow", detail: "Mostly calm, short bursts" },
  { value: "steady", label: "Steady", detail: "A little of everything" },
  { value: "high", label: "Always curious", detail: "Play first, nap later" },
];

const comfortOptions: Array<{ value: ComfortStyle; label: string; detail: string }> = [
  { value: "close", label: "Come close", detail: "Likes contact and company" },
  { value: "nearby", label: "Stay nearby", detail: "Comfort from a little distance" },
  { value: "space", label: "Give me space", detail: "Watches until ready" },
];

const communityPets = [
  { name: "Nori", species: "cat", note: "quiet watcher", color: "ochre" },
  { name: "Pico", species: "dog", note: "greets everyone", color: "blue" },
  { name: "Juniper", species: "cat", note: "hides, then returns", color: "coral" },
];

function logEvent(
  events: PetEvent[],
  name: PetEvent["name"],
  properties: PetEvent["properties"],
) {
  return [...events, { name, timestamp: new Date().toISOString(), properties }];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [view, setView] = useState<View>("companion");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<PetProfile>(() => {
    try {
      const saved = window.localStorage.getItem(profileStorageKey);
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<PetMode>("idle");
  const [intentText, setIntentText] = useState("");
  const [response, setResponse] = useState("Your pet is ready when you are.");
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correction, setCorrection] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (screen !== "studio" || mode === "idle" || mode === "watching") return;
    const timer = window.setTimeout(() => setMode("idle"), 5200);
    return () => window.clearTimeout(timer);
  }, [mode, screen]);

  useEffect(() => {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  }, [profile]);

  const profileCompletion = useMemo(() => {
    const answers = [profile.name, profile.trigger, profile.favouriteActivity, profile.correction];
    return Math.round((answers.filter(Boolean).length / answers.length) * 100);
  }, [profile]);

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@")) {
      setNotice("Use an email address so your pet profile can stay yours across sessions.");
      return;
    }
    setNotice("");
    setScreen("onboarding");
    setEvents((current) => logEvent(current, "session_started", { auth: "preview_email" }));
  }

  function useDemo() {
    setProfile(defaultProfile);
    setScreen("studio");
    setView("companion");
    setEvents((current) => logEvent(current, "profile_completed", { mode: "demo", species: "cat" }));
  }

  function updateProfile(patch: Partial<PetProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function finishOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScreen("studio");
    setEvents((current) =>
      logEvent(current, "profile_completed", { mode: "custom", species: profile.species }),
    );
  }

  function runAction(intent: Intent, text = "") {
    const result = text ? interpretIntent(text) : { intent, confidence: 1, source: "rule-preview" as const, evidence: ["User chose a bounded action."] };
    const chosenMode = petModeForIntent(result.intent, profile);
    setMode(chosenMode);
    setLastIntent(result.intent);
    setLastConfidence(result.confidence);
    setResponse(responseForIntent(result.intent, profile));
    setFeedback(null);
    setCorrection("");
    setFeedbackOpen(true);
    setEvents((current) =>
      logEvent(current, "support_action_used", {
        intent: result.intent,
        confidence: result.confidence,
        source: result.source,
      }),
    );
  }

  function handleIntentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intentText.trim()) return;
    runAction("no_match", intentText);
    setIntentText("");
  }

  function submitFeedback(value: Feedback) {
    setFeedback(value);
    setEvents((current) =>
      logEvent(current, "likeness_feedback_submitted", {
        likeness: value,
        correction_added: correction.trim().length > 0,
      }),
    );
  }

  function togglePublish() {
    updateProfile({ published: !profile.published });
    setNotice(
      profile.published
        ? "Your pet is private again."
        : "Preview published: only the fields you chose are public.",
    );
  }

  if (screen === "signin") {
    return (
      <main className="entry-screen">
        <div className="entry-copy">
          <div className="brand-mark"><span>AP</span><strong>AI Petverse</strong></div>
          <div className="entry-headline">
            <p className="overline">A familiar presence for noisy days</p>
            <h1>Your pet,<br /><em>understood.</em></h1>
            <p className="entry-description">
              Build a digital companion around the little things that make your real pet yours.
              Your corrections always win.
            </p>
          </div>
          <div className="entry-footnote">
            <span className="signal-dot" />
            <span>Private by default · Preview mode · No camera required</span>
          </div>
        </div>
        <div className="entry-panel">
          <div className="panel-kicker">Start a private profile</div>
          <h2>Let’s meet your pet.</h2>
          <p>Sign in to keep your profile adjustable as your companion learns with you.</p>
          <form className="entry-form" onSubmit={handleSignIn}>
            <label htmlFor="email">Your email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <button className="button button-primary" type="submit">Continue privately <span>↗</span></button>
          </form>
          <button className="text-button" type="button" onClick={useDemo}>Try the demo pet instead</button>
          {notice && <p className="form-notice">{notice}</p>}
          <div className="entry-rule"><span /> <small>What happens next</small> <span /></div>
          <ol className="entry-steps">
            <li><span>01</span><p>Tell us the facts only you know.</p></li>
            <li><span>02</span><p>Meet a first version of your pet.</p></li>
            <li><span>03</span><p>Correct it until it feels like home.</p></li>
          </ol>
        </div>
      </main>
    );
  }

  if (screen === "onboarding") {
    return (
      <Onboarding
        step={step}
        profile={profile}
        setStep={setStep}
        updateProfile={updateProfile}
        onComplete={finishOnboarding}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark compact"><span>AP</span><strong>AI Petverse</strong></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === "companion" ? "nav-link active" : "nav-link"} onClick={() => setView("companion")} type="button">Companion</button>
          <button className={view === "community" ? "nav-link active" : "nav-link"} onClick={() => { setView("community"); setEvents((current) => logEvent(current, "community_preview_opened", {})); }} type="button">Community <span className="nav-count">Preview</span></button>
        </nav>
        <div className="topbar-right">
          <span className="private-status"><span className="signal-dot" /> Private profile</span>
          <button className="avatar-button" type="button" aria-label="Open profile">T</button>
        </div>
      </header>

      {view === "companion" ? (
        <section className="workspace">
          <aside className="profile-rail">
            <div className="rail-topline"><span>YOUR PET</span><span className="micro-status">SYNCED</span></div>
            <div className="profile-intro">
              <PetBadge species={profile.species} />
              <div><h2>{profile.name}</h2><p>{profile.species === "cat" ? "A thoughtful house cat" : "A steady-hearted dog"}</p></div>
            </div>
            <div className="profile-meter"><div><span>Profile detail</span><strong>{profileCompletion}%</strong></div><span className="meter-track"><i style={{ width: `${profileCompletion}%` }} /></span></div>
            <div className="trait-list">
              <TraitRow label="Energy" value={labelForEnergy(profile.energy)} />
              <TraitRow label="Comfort" value={labelForComfort(profile.comfortStyle)} />
              <TraitRow label="Trigger" value={profile.trigger} />
              <TraitRow label="Favourite" value={profile.favouriteActivity} />
            </div>
            <button className="edit-profile" type="button" onClick={() => { setStep(0); setScreen("onboarding"); }}>Edit profile <span>↗</span></button>
            <div className="rail-bottom">
              <div className="truth-note"><span className="note-mark">✦</span><p><strong>Your corrections win.</strong><br />The model is allowed to be unsure.</p></div>
              <div className="profile-privacy"><span>Profile visibility</span><strong>{profile.published ? "Community preview" : "Private"}</strong></div>
            </div>
          </aside>

          <section className="scene-column">
            <div className="scene-heading"><div><p className="overline">A small moment together</p><h1>{profile.name} is here.</h1></div><span className="scene-time">{modeLabel(mode)}</span></div>
            <div className={`scene-card mode-${mode}`}>
              <div className="scene-sun" />
              <div className="scene-window"><span /><span /><span /></div>
              <div className="scene-note"><span className="note-mark">✦</span><div><strong>{mode === "idle" ? "No rush." : mode === "watching" ? "Watching with you." : "A response, not a performance."}</strong><small>{response}</small></div></div>
              <div className="scene-floor"><span className="floor-line" /><span className="floor-rug" /></div>
              <PetIllustration species={profile.species} mode={mode} />
              <div className="scene-caption"><span className="scene-live-dot" />Live companion preview <span>·</span> behaviour model: local</div>
            </div>
            <div className="interaction-panel">
              <div className="interaction-prompt"><span className="prompt-index">{lastIntent ? "02" : "01"}</span><div><p className="overline">Say what you need</p><h2>How should {profile.name} respond?</h2></div></div>
              <div className="action-grid">
                <ActionButton label="Come here" detail="a little closer" onClick={() => runAction("come_closer")} icon="↗" />
                <ActionButton label="Comfort me" detail="stay with me" onClick={() => runAction("comfort")} icon="◌" active={lastIntent === "comfort"} />
                <ActionButton label="Let's play" detail="change the rhythm" onClick={() => runAction("play")} icon="✳" />
              </div>
              <form className="intent-form" onSubmit={handleIntentSubmit}>
                <input value={intentText} onChange={(event) => setIntentText(event.target.value)} placeholder="Or tell {profile.name} in your own words..." aria-label="Tell your pet what you need" />
                <button type="submit" aria-label="Send message">Send <span>↗</span></button>
              </form>
            </div>
            {feedbackOpen && <FeedbackPanel feedback={feedback} correction={correction} setCorrection={setCorrection} onFeedback={submitFeedback} />}
          </section>

          <aside className="insight-rail">
            <div className="insight-heading"><span className="overline">Today’s read</span><span className="confidence-dot" /></div>
            <h2>{mode === "comforting" ? "Soft response" : mode === "playing" ? "Playful window" : "Room to notice"}</h2>
            <p className="insight-copy">{lastIntent ? `Intent: ${lastIntent.replace("_", " ")}` : "Your pet is not a button. Let the next moment be small."}</p>
            <div className="insight-divider" />
            <div className="signal-block"><span className="overline">Model signal</span><div className="signal-line"><strong>{lastConfidence ? `${Math.round(lastConfidence * 100)}%` : "—"}</strong><span>{lastConfidence ? "preview confidence" : "waiting for input"}</span></div></div>
            <div className="signal-block"><span className="overline">Camera</span><div className="permission-line"><span className="permission-dot" /> Off by default <button type="button" onClick={() => setNotice("Camera is not connected in this preview. The future gesture adapter will be local and opt-in.")}>Why?</button></div></div>
            <div className="insight-callout"><span className="note-mark">✦</span><p>Later: standardized gestures, not raw camera frames. Your pet only receives a bounded event.</p></div>
            <div className="publish-card"><div><span className="overline">Community</span><strong>{profile.published ? "Visible as a preview" : "Private by default"}</strong></div><button type="button" onClick={togglePublish}>{profile.published ? "Unpublish" : "Preview publish"}</button></div>
            {notice && <div className="notice-box">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}
          </aside>
        </section>
      ) : (
        <CommunityView profile={profile} onPublish={togglePublish} />
      )}
      <footer className="app-footer"><span>AI Petverse / browser MVP</span><span>Local preview · {events.length} events in this session · <button type="button" onClick={() => { setScreen("signin"); setView("companion"); }}>Reset demo</button></span></footer>
    </main>
  );
}

function Onboarding({
  step,
  profile,
  setStep,
  updateProfile,
  onComplete,
}: {
  step: number;
  profile: PetProfile;
  setStep: (step: number) => void;
  updateProfile: (patch: Partial<PetProfile>) => void;
  onComplete: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const steps = ["species", "name", "energy", "comfort", "trigger", "ritual"] as const;
  const current = steps[step];
  const canContinue = current === "name" ? profile.name.trim().length > 1 : true;

  function next() {
    if (step === steps.length - 1) return;
    setStep(step + 1);
  }

  return (
    <main className="onboarding-screen">
      <header className="onboarding-topbar"><div className="brand-mark compact"><span>AP</span><strong>AI Petverse</strong></div><span className="save-label">Profile saves as you go <span className="signal-dot" /></span></header>
      <div className="onboarding-layout">
        <aside className="onboarding-sidebar"><div className="onboarding-count"><span>PROFILE BUILD</span><strong>0{step + 1}<i>/</i>06</strong></div><div className="onboarding-progress"><i style={{ height: `${((step + 1) / 6) * 100}%` }} /></div><div className="onboarding-sidebar-copy"><h1>Tell us the<br /><em>small things.</em></h1><p>The details you notice every day are what make a digital pet feel like yours.</p></div><div className="onboarding-sidebar-foot"><span className="note-mark">✦</span><p>Facts first.<br />AI guesses later.</p></div></aside>
        <form className="question-panel" onSubmit={step === steps.length - 1 ? onComplete : (event) => { event.preventDefault(); next(); }}>
          <div className="question-header"><span className="overline">{step < 2 ? "Start with the basics" : "Build the relationship"}</span><span className="question-step">{String(step + 1).padStart(2, "0")} / 06</span></div>
          {current === "species" && <QuestionBlock title="Who are we getting to know?" detail="Start with the animal you know best." ><div className="species-options"><ChoiceCard selected={profile.species === "cat"} onClick={() => updateProfile({ species: "cat" })} icon="cat" label="Cat" detail="quiet signals, sharp rituals" /><ChoiceCard selected={profile.species === "dog"} onClick={() => updateProfile({ species: "dog" })} icon="dog" label="Dog" detail="open signals, moving energy" /></div></QuestionBlock>}
          {current === "name" && <QuestionBlock title="What do you call them?" detail="The name is the first anchor for every interaction."><label className="large-field"><span>Pet name</span><input autoFocus value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} placeholder="Miso" /></label></QuestionBlock>}
          {current === "energy" && <QuestionBlock title={`What is ${profile.name}'s usual rhythm?`} detail="Not a diagnosis. Just the pace you recognize."><div className="stack-options">{energyOptions.map((option) => <OptionRow key={option.value} selected={profile.energy === option.value} onClick={() => updateProfile({ energy: option.value })} label={option.label} detail={option.detail} />)}</div></QuestionBlock>}
          {current === "comfort" && <QuestionBlock title={`When you need them, what does ${profile.name} do?`} detail="This shapes the distance and timing of a comforting response."><div className="stack-options">{comfortOptions.map((option) => <OptionRow key={option.value} selected={profile.comfortStyle === option.value} onClick={() => updateProfile({ comfortStyle: option.value })} label={option.label} detail={option.detail} />)}</div></QuestionBlock>}
          {current === "trigger" && <QuestionBlock title={`What makes ${profile.name} pull away?`} detail="A boundary is as important as a preference."><div className="stack-options">{["sudden noise", "strangers", "too much energy", "not sure yet"].map((value) => <OptionRow key={value} selected={profile.trigger === value} onClick={() => updateProfile({ trigger: value })} label={value} detail={value === "not sure yet" ? "We can learn this together" : "I want the pet to respect this"} />)}</div></QuestionBlock>}
          {current === "ritual" && <QuestionBlock title={`What small thing always gets ${profile.name}'s attention?`} detail="This gives the first avatar a recognizable ritual."><label className="large-field"><span>Favourite activity</span><input value={profile.favouriteActivity} onChange={(event) => updateProfile({ favouriteActivity: event.target.value })} placeholder="window watching" /></label><label className="large-field optional-field"><span>One correction the model should remember</span><input value={profile.correction} onChange={(event) => updateProfile({ correction: event.target.value })} placeholder="hides when startled" /></label></QuestionBlock>}
          <div className="question-footer"><button className="back-button" type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button><div className="question-footer-right"><span>{step === steps.length - 1 ? "You can keep editing this later" : "You can change this later"}</span><button className="button button-primary" type="submit" disabled={!canContinue}>{step === steps.length - 1 ? "Meet your pet" : "Continue"} <span>↗</span></button></div></div>
        </form>
      </div>
    </main>
  );
}

function QuestionBlock({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <div className="question-block"><h1>{title}</h1><p>{detail}</p><div className="question-content">{children}</div></div>;
}

function ChoiceCard({ selected, onClick, icon, label, detail }: { selected: boolean; onClick: () => void; icon: Species; label: string; detail: string }) {
  return <button className={`choice-card ${selected ? "selected" : ""}`} type="button" onClick={onClick}><PetBadge species={icon} /><span><strong>{label}</strong><small>{detail}</small></span><i>{selected ? "✓" : ""}</i></button>;
}

function OptionRow({ selected, onClick, label, detail }: { selected: boolean; onClick: () => void; label: string; detail: string }) {
  return <button className={`option-row ${selected ? "selected" : ""}`} type="button" onClick={onClick}><span><strong>{label}</strong><small>{detail}</small></span><i>{selected ? "✓" : ""}</i></button>;
}

function ActionButton({ label, detail, icon, onClick, active = false }: { label: string; detail: string; icon: string; onClick: () => void; active?: boolean }) {
  return <button className={`action-button ${active ? "active" : ""}`} type="button" onClick={onClick}><span className="action-icon">{icon}</span><span><strong>{label}</strong><small>{detail}</small></span></button>;
}

function FeedbackPanel({ feedback, correction, setCorrection, onFeedback }: { feedback: Feedback | null; correction: string; setCorrection: (value: string) => void; onFeedback: (value: Feedback) => void }) {
  return <div className="feedback-panel"><div><span className="overline">Reality check</span><h3>Did that feel like your pet?</h3></div><div className="feedback-options"><button className={feedback === "yes" ? "selected" : ""} type="button" onClick={() => onFeedback("yes")}>Yes</button><button className={feedback === "partly" ? "selected" : ""} type="button" onClick={() => onFeedback("partly")}>Partly</button><button className={feedback === "no" ? "selected" : ""} type="button" onClick={() => onFeedback("no")}>Not yet</button></div>{feedback && <input value={correction} onChange={(event) => setCorrection(event.target.value)} placeholder="What should the next version understand?" aria-label="Pet correction" />}</div>;
}

function CommunityView({ profile, onPublish }: { profile: PetProfile; onPublish: () => void }) {
  return <section className="community-view"><div className="community-heading"><div><p className="overline">A public layer, later</p><h1>Pets can meet<br /><em>when they are ready.</em></h1><p>Community publishing is a separate public version of your private pet profile. This preview uses synthetic pets and no real social backend.</p></div><button className="button button-primary" type="button" onClick={onPublish}>{profile.published ? "Unpublish my preview" : "Preview my public pet"} <span>↗</span></button></div><div className="community-grid">{communityPets.map((pet) => <div className={`community-card ${pet.color}`} key={pet.name}><div className="community-pet-art"><PetIllustration species={pet.species as Species} mode="idle" /></div><div><span className="overline">Public pet preview</span><h2>{pet.name}</h2><p>{pet.note}</p></div><span className="community-arrow">↗</span></div>)}</div><div className="community-rule"><span className="note-mark">✦</span><p>Public does not mean everything. Owners choose what leaves the private profile; moderation and unpublish controls come first.</p></div></section>;
}

function PetIllustration({ species, mode }: { species: Species; mode: PetMode }) {
  return <div className={`pet-avatar ${species} mode-${mode}`} aria-label={`${species} avatar ${mode}`} role="img"><svg viewBox="0 0 420 300" aria-hidden="true"><ellipse className="pet-shadow" cx="210" cy="250" rx="90" ry="13" /><g className="pet-form"><ellipse className="pet-tail" cx="126" cy="155" rx="42" ry="22" /><ellipse className="pet-body-shape" cx="210" cy="170" rx="86" ry="67" /><ellipse className="pet-chest" cx="238" cy="175" rx="53" ry="46" /><path className="pet-ear pet-ear-left" d={species === "cat" ? "M157 106 L159 40 L202 92 Z" : "M156 105 L132 50 L207 88 Z"} /><path className="pet-ear pet-ear-right" d={species === "cat" ? "M249 91 L292 39 L292 112 Z" : "M245 88 L308 51 L286 112 Z"} /><ellipse className="pet-head" cx="222" cy="113" rx="66" ry="58" /><ellipse className="pet-muzzle" cx="222" cy="137" rx="34" ry="24" /><circle className="pet-eye" cx="200" cy="112" r="5" /><circle className="pet-eye" cx="245" cy="112" r="5" /><path className="pet-nose" d="M218 132 Q222 137 226 132" /><path className="pet-leg pet-leg-left" d="M178 202 Q169 231 176 250" /><path className="pet-leg pet-leg-right" d="M244 204 Q252 232 246 250" /><path className="pet-marking" d="M185 81 Q218 69 250 82" /></g></svg></div>;
}

function PetBadge({ species }: { species: Species }) {
  return <span className={`pet-badge ${species}`} aria-hidden="true"><span>{species === "cat" ? "⌁" : "◒"}</span></span>;
}

function TraitRow({ label, value }: { label: string; value: string }) {
  return <div className="trait-row"><span>{label}</span><strong>{value}</strong></div>;
}

function labelForEnergy(value: Energy) {
  return value === "low" ? "Soft" : value === "high" ? "Curious" : "Steady";
}

function labelForComfort(value: ComfortStyle) {
  return value === "close" ? "Close" : value === "space" ? "Room" : "Nearby";
}

function modeLabel(mode: PetMode) {
  return mode === "idle" ? "quiet presence" : mode.replace("ing", "ing").replace("watching", "watching").replace("approaching", "coming closer");
}

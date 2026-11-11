// Typed talk plus chat chips (spec §6.5). Text is never stored or logged; the input clears after each send.
import { forwardRef, useState, type FormEvent } from "react";
import type { Intent } from "../shared/types";
import { fill, ui } from "../copy/en/ui";

export const TalkBox = forwardRef<HTMLInputElement, {
  name: string;
  away: boolean;
  choices: Intent[] | null;
  onSend: (text: string) => void;
  onChip: (i: Intent) => void;
}>(function TalkBox(p, ref) {
  const [text, setText] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    setText("");
    if (t) p.onSend(t);
  };
  const label = fill(ui.talk.label, { name: p.name });
  const chipText = (i: Intent): string =>
    i === "greet" ? ui.talk.chips.greet : i === "day" ? ui.talk.chips.day : i === "goodnight" ? ui.talk.chips.goodnight
      : i === "play" ? ui.talk.playChip : i === "come_closer" || i === "comfort" || i === "rest" ? ui.support[i] : i;
  return (
    <div className="talk">
      <form className="talk-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="talk-input">{label}</label>
        <input
          id="talk-input"
          ref={ref}
          value={text}
          maxLength={200}
          autoComplete="off"
          placeholder={ui.talk.placeholder}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn primary small">{ui.talk.send}</button>
      </form>
      {p.choices && p.choices.length > 0 && (
        <div className="chip-row" role="group" aria-label={ui.talk.pickOne}>
          <span className="chip-label">{ui.talk.pickOne}</span>
          {p.choices.map((i) => (
            <button key={i} type="button" className="chip" onClick={() => p.onChip(i)}>{chipText(i)}</button>
          ))}
        </div>
      )}
      <div className="chip-row" role="group" aria-label={ui.dock.talk}>
        {(["greet", "day", "goodnight"] as const).map((i) => (
          <button key={i} type="button" className="chip" disabled={p.away} onClick={() => p.onChip(i)}>
            {ui.talk.chips[i]}
          </button>
        ))}
      </div>
    </div>
  );
});

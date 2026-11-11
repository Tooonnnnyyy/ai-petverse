// Urgent help (spec §6.8): calm copy, findahelpline.com, focus kept inside until dismissed. Never logged.
import { useEffect, useRef } from "react";
import { ui } from "../copy/en/ui";

export function UrgentHelpCard({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => prev?.focus?.();
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        ref={ref}
        className="urgent-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="urgent-title"
        aria-describedby="urgent-body"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const f = ref.current?.querySelectorAll<HTMLElement>("a,button");
          if (!f || f.length === 0) return;
          const first = f[0];
          const last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }}
      >
        <h2 id="urgent-title">{ui.urgent.title}</h2>
        <p id="urgent-body">{ui.urgent.body}</p>
        <a className="btn ghost" href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">{ui.urgent.link}</a>
        <button type="button" className="btn primary" onClick={onClose}>{ui.urgent.safe}</button>
      </div>
    </div>
  );
}

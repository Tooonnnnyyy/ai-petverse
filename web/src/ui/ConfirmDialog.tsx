// A small modal confirm (used for "Delete my data").
import { useEffect, useRef } from "react";

export function ConfirmDialog(p: { title: string; body: string; yes: string; no: string; onYes: () => void; onNo: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);
  return (
    <div className="modal-backdrop" onClick={p.onNo}>
      <div ref={ref} className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === "Escape" && p.onNo()}>
        <h2 id="confirm-title">{p.title}</h2>
        <p>{p.body}</p>
        <div className="row-end">
          <button type="button" className="btn ghost" onClick={p.onNo}>{p.no}</button>
          <button type="button" className="btn danger" onClick={p.onYes}>{p.yes}</button>
        </div>
      </div>
    </div>
  );
}

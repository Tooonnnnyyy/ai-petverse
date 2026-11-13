import type { GameApi } from "../hooks/useGame";
import type { CourseId, ShopId } from "../shared/types";
import { COURSES, SHOP, enrollCourse, purchaseItem } from "../game/life";

export function LifePanel(p: { game: GameApi; level: number; quick: boolean; onClose: () => void; onFeed: (s: any) => void; onOuting: () => void }) {
  const s = p.game.save;
  const startCourse = (id: CourseId) => p.game.update((x) => enrollCourse(x, id, Date.now(), p.quick), true);
  const buy = (id: ShopId) => p.game.update((x) => purchaseItem(x, id), true);
  return <section className="life-panel" aria-label="Pet life, courses and shop">
    <div className="life-head"><div><h2>Pet life</h2><p className="muted small">Care, classes and small adventures build a shared rhythm.</p></div><strong>{s.life.coins} ✦</strong><button type="button" className="icon-btn" onClick={p.onClose} aria-label="Close">×</button></div>
    <div className="life-stats"><span>signals {Object.values(s.life.signals).reduce((a, b) => a + b, 0)}</span><span>memories {s.life.memories.length}</span><span>courses {s.life.completedCourses.length}</span></div>
    {s.life.activeCourse && <p className="note">In class: {COURSES.find((c) => c.id === s.life.activeCourse?.id)?.name ?? "course"}. Your pet will return when it is complete.</p>}
    <div className="life-grid"><div><h3>Classes</h3>{COURSES.map((c) => <button key={c.id} className="life-item" type="button" disabled={!!s.life.activeCourse || s.life.completedCourses.includes(c.id) || s.life.coins < c.cost || p.level < c.level} onClick={() => startCourse(c.id)}><span><b>{c.name}</b><small>{c.detail}</small></span><em>{s.life.completedCourses.includes(c.id) ? "done" : `${c.cost} ✦`}</em></button>)}</div><div><h3>Shop</h3>{SHOP.map((item) => <button key={item.id} className="life-item" type="button" disabled={s.life.purchases.includes(item.id) || s.life.coins < item.cost || p.level < item.level} onClick={() => buy(item.id)}><span><b>{item.name}</b><small>{item.detail}</small></span><em>{s.life.purchases.includes(item.id) ? "owned" : `${item.cost} ✦`}</em></button>)}</div></div>
    <div className="life-actions"><button type="button" className="btn ghost small" onClick={p.onOuting}>Plan an adventure</button><span className="muted small">Social park unlock: account + consent + moderation.</span></div>
  </section>;
}

// The Room (spec §9.1): wires the pet engine, the save, cards, outings and every control together.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ctx, DropZone, Intent, MomentId, OutingMinutes, PetInput, PlaceId, SnackId } from "../shared/types";
import type { GameApi } from "../hooks/useGame";
import { usePetEngine, type EngineResult } from "../hooks/usePetEngine";
import { useCalmMotion } from "../hooks/useCalmMotion";
import type { Motion } from "../hooks/useMotion";
import { effectiveProfile } from "../pet/profile";
import { supportWindowAfter } from "../pet/machine";
import { lineText } from "../talk/lines";
import { detectUrgent, interpretIntent } from "../talk/intent";
import { isResting, levelFor } from "../game/bond";
import { SESSION_HIDDEN_MS } from "../game/config";
import { unlockedSet } from "../game/unlocks";
import { clearGift, recallOuting, resolveOnLoad, resolveReturn, startOuting } from "../game/outing";
import { startOrResumeSession } from "../game/session";
import { deriveSeed } from "../game/rng";
import { localDayKey } from "../game/time";
import { discoverySnapshot } from "../game/life";
import { useCompanionship } from "../hooks/useCompanionship";
import { LifePanel } from "../room/LifePanel";
import { loadPetPhotoUrl } from "../storage/photo";
import { GIFT_CARD_ID, WELCOME_CARD_ID, levelCardId, levelOfCard, markLevelSeen, startupCards, unlocksForCard } from "../game/progress";
import { talkNarration, type NarrationId } from "../copy/en/talk";
import { catalogCopy } from "../copy/en/catalog";
import { fill, ui } from "../copy/en/ui";
import { Stage } from "../room/Stage";
import type { BubbleData } from "../room/Bubble";
import type { Float } from "../room/Hearts";
import { ActionDock } from "../room/ActionDock";
import { SupportChips, type SupportIntent } from "../room/SupportChips";
import { TalkBox } from "../room/TalkBox";
import { BondHud } from "../room/BondHud";
import { OutingPanel } from "../room/OutingPanel";
import { AwayCard, clockTime } from "../room/AwayCard";
import { GiftCard } from "../room/GiftCard";
import { LevelUpCard, WelcomeCard } from "../room/LevelUpCard";
import { AlbumDrawer } from "../drawers/AlbumDrawer";
import { UrgentHelpCard } from "../ui/UrgentHelpCard";
import { Footer } from "../ui/Footer";
import { LiveRegion } from "../ui/LiveRegion";

const NO_MOMENTS: ReadonlySet<MomentId> = new Set();
const FLOW = new Set(["leaving", "away", "returning", "gift"]);
const OUT = new Set(["leaving", "away", "returning"]);
const ZONE_NARRATION: Record<DropZone, string> = {
  bed: ui.narration.zoneBed,
  bowl: ui.narration.zoneBowl,
  cushion: ui.narration.zoneCushion,
  windowSeat: ui.narration.zoneWindow,
};
const MOTION_CYCLE = { auto: "on", on: "off", off: "auto" } as const;

export function Room({ game, onExit, onDeleted }: { game: GameApi; onExit: () => void; onDeleted: () => void }) {
  const save = game.save;
  const profile = save.profile!;
  const eff = useMemo(() => effectiveProfile(profile, save.corrections), [profile, save.corrections]);
  const name = eff.name;
  const level = levelFor(save.bond.total).level;
  const unlocked = useMemo(() => unlockedSet(level), [level]);
  const calm = useCalmMotion(save.settings.calmMotion);
  const quick = useMemo(() => new URLSearchParams(window.location.search).get("quick") === "1" || save.flags.isDemo, [save.flags.isDemo]);

  // ---- Ctx inputs (read at dispatch time) ----
  const live = useRef({ eff, calm, unlocked, paused: game.celebrationsPaused });
  live.current = { eff, calm, unlocked, paused: game.celebrationsPaused || live.current.paused };
  const stageW = useRef(Math.max(320, Math.min(window.innerWidth - 32, 1100)));
  const supportUntil = useRef(0);
  const firstPlayDone = useRef(false);
  const anchor = useRef({ x: 0.5, at: 0 });
  const motionRef = useRef<Motion | null>(null);

  const getCtx = useCallback((): Ctx => {
    const now = Date.now();
    const l = live.current;
    return {
      now,
      profile: l.eff,
      stageWidthPx: stageW.current,
      calm: l.calm,
      unlocked: l.unlocked,
      seenMoments: NO_MOMENTS,
      gamificationPaused: l.paused,
      supportWindowUntil: supportUntil.current,
      firstPlayDone: firstPlayDone.current,
      userAnchorX: now - anchor.current.at < 10_000 ? anchor.current.x : 0.5,
    };
  }, []);

  // ---- feedback UI ----
  const [bubble, setBubble] = useState<BubbleData | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [juice, setJuice] = useState(0);
  const [twitch, setTwitch] = useState(false);
  const [narration, setNarration] = useState("");
  const [announce, setAnnounce] = useState("");
  const [bump, setBump] = useState(0);
  const [panel, setPanel] = useState<"outing" | "album" | null>(null);
  const [growthOpen, setGrowthOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [choices, setChoices] = useState<Intent[] | null>(null);
  const [offerCallBack, setOfferCallBack] = useState(false);
  const seq = useRef(0);
  const bubbleTimer = useRef<number | null>(null);
  const restingShown = useRef(false);
  const playHintShown = useRef(false);
  const talkRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    let alive = true;
    loadPetPhotoUrl().then((url) => { if (alive) setPhotoSrc(url); }).catch(() => undefined);
    return () => { alive = false; };
  }, [save.photo?.avatarVersion]);

  const say = useCallback((text: string, ms: number, speak = true) => {
    if (!text) return;
    seq.current += 1;
    setBubble({ key: seq.current, text });
    if (bubbleTimer.current !== null) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), Math.max(1200, ms));
    if (speak) setAnnounce(`${name}: ${text}`);
  }, [name]);

  const narrate = useCallback((text: string) => {
    setNarration(text);
    setAnnounce(text);
  }, []);

  const addFloat = useCallback((f: Omit<Float, "id">) => {
    seq.current += 1;
    const id = seq.current;
    setFloats((xs) => [...xs, { ...f, id }]);
    window.setTimeout(() => setFloats((xs) => xs.filter((x) => x.id !== id)), 1100);
  }, []);

  const backTime = () => {
    const o = game.get().outing;
    return o ? clockTime(o.endsAt) : "";
  };

  const showBond = useCallback((granted: number, levelUp: number | null) => {
    if (granted > 0) {
      addFloat({ kind: "plus", n: granted, text: fill(ui.bond.plus, { n: granted }) });
      setBump((b) => b + 1);
    } else if (!restingShown.current && isResting(game.get().bond, localDayKey(Date.now()))) {
      restingShown.current = true;
      narrate(ui.bond.resting);
    }
    if (levelUp !== null && !live.current.paused) {
      setAnnounce(`${fill(ui.levelUp.title, { level: levelUp })}: ${levelFor(game.get().bond.total).name}`);
    }
  }, [addFloat, game, narrate]);

  // ---- engine results → visuals, Bond, narration ----
  const onResult = useCallback((r: EngineResult) => {
    const run = () => {
      for (const c of r.commands) {
        switch (c.kind) {
          case "talk":
            say(lineText(c.lineId, name), c.ms);
            break;
          case "decline":
            say(lineText(c.lineId, name), 3000);
            break;
          case "petted":
            if (c.hearts > 0) {
              addFloat({ kind: "hearts", n: c.hearts });
              if (c.reaction === "purr") addFloat({ kind: "ring", n: 1 });
              setJuice((j) => j + 1);
              if (Math.random() < 0.5) say(lineText(c.reaction === "purr" ? "petted.1" : "petted.2", name), 1300, false);
            }
            break;
          case "eat":
            say(lineText(Math.random() < 0.5 ? "eat.1" : "eat.2", name), 2200, false);
            break;
          case "held":
            say(lineText("held.1", name), 1200, false);
            break;
          case "outingLeave":
            say(lineText("outingLeave.1", name), 2500);
            break;
          case "gift":
            say(lineText("outingReturn.1", name), 3000);
            break;
        }
      }
      for (const fx of r.effects) {
        if (fx.type === "bond") {
          const g = game.award(fx.source, fx.amount, Date.now());
          showBond(g.granted, g.levelUp);
        } else if (fx.type === "narrate") {
          let id = fx.textId as NarrationId;
          if (id === "playStart" && !profile.favouriteActivity.trim()) id = "playStartPlain";
          const t = talkNarration[id];
          if (!t) continue;
          let text = fill(t, { name, favourite: profile.favouriteActivity.trim(), time: backTime() });
          if ((id === "playStart" || id === "playStartPlain") && !playHintShown.current) {
            playHintShown.current = true;
            text = `${text} ${ui.dock.playHint}`;
          }
          narrate(text);
        }
      }
    };
    if (r.delayMs > 0) {
      setTwitch(true);
      window.setTimeout(() => {
        setTwitch(false);
        run();
      }, r.delayMs);
    } else run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, say, addFloat, narrate, game, showBond, profile.favouriteActivity]);

  const engine = usePetEngine({
    seed: useMemo(() => deriveSeed(save.installSeed, `pet:${Date.now()}`), [save.installSeed]),
    getCtx,
    onResult,
    beforeDispatch: () => {
      const m = motionRef.current;
      if (m && engineRef.current?.get().name === "play") engineRef.current.syncX(m.getX());
    },
    onVisible: (ms) => {
      if (ms < SESSION_HIDDEN_MS) return;
      // a new session: once-per-session rules restart, feedback cards drop
      firstPlayDone.current = false;
      game.endSessionCards();
      game.update((s) => ({ ...s, visits: startOrResumeSession(null, Date.now(), ms, s.visits).visits }));
    },
  });
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const pet = engine.state;
  useCompanionship(game, pet.name === "paused" || game.celebrationsPaused);
  const act = useCallback((i: PetInput) => engineRef.current.dispatch(i), []);

  // ---- session start: visit day, rebuilt cards, greeting ----
  useEffect(() => {
    const now = Date.now();
    game.update((s) => ({ ...s, visits: startOrResumeSession(null, now, 0, s.visits).visits }));
    for (const c of startupCards(game.get(), now)) game.enqueueCard(c.kind, c.id);
    const t = window.setTimeout(() => say(lineText(engine.greeting, name), 3500), 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const interacted = useCallback(() => {
    if (!game.get().flags.welcomeSeen) {
      game.update((s) => ({ ...s, flags: { ...s.flags, welcomeSeen: true } }));
      game.removeCardById(WELCOME_CARD_ID);
    }
  }, [game]);

  // ---- outings ----
  const doReturn = useCallback(() => {
    const s = game.get();
    if (!s.outing) return;
    const r = resolveReturn(s, Date.now());
    game.update(() => r.save, true);
    if (r.bondGranted > 0) showBond(r.bondGranted, r.levelUp);
    if (r.levelUp !== null && !live.current.paused) game.enqueueCard("levelUp", levelCardId(r.levelUp));
    if (r.reward) {
      const place = catalogCopy.places[s.outing.place].name;
      narrate(fill(ui.outing.returned, { name, place }));
      act({ t: "outingEnd", reward: r.reward });
    }
  }, [game, act, name, narrate, showBond]);

  const callBack = useCallback(() => {
    const o = game.get().outing;
    if (!o || o.creditedAt !== null) return;
    game.update((s) => ({ ...s, outing: s.outing ? recallOuting(s.outing, Date.now()) : null }), true);
    narrate(fill(ui.narration.callBack, { name }));
    setOfferCallBack(false);
    doReturn();
  }, [game, doReturn, narrate, name]);

  const outingBlocked = save.life.activeCourse ? "Your pet is attending a class. Let them finish before a trip." : pet.name === "held" ? fill(ui.outing.blockedHeld, { name }) : game.celebrationsPaused ? ui.outing.blockedPaused : null;

  const goOuting = (place: PlaceId, min: OutingMinutes) => {
    if (outingBlocked || game.get().outing) return;
    interacted();
    const now = Date.now();
    const base = startOuting(place, min, now, `o-${now.toString(36)}`);
    const o = { ...base, discovery: discoverySnapshot(game.get().life) };
    game.update((s) => ({ ...s, outing: o }), true);
    setPanel(null);
    act({ t: "outingStart", outing: o });
    narrate(fill(ui.outing.leaving, { name, place: catalogCopy.places[place].name }));
  };


  // Reconcile the pet with the saved outing (load, reload mid-outing, another tab).
  const outing = save.outing;
  const pendingGift = save.pendingGift;
  useEffect(() => {
    const n = pet.name;
    if (outing && outing.creditedAt === null) {
      if (resolveOnLoad(outing, Date.now()) === "returnNow") doReturn();
      else if (!FLOW.has(n) && n !== "held" && n !== "fall") act({ t: "outingStart", outing });
      return;
    }
    if (pendingGift && (n === "leaving" || n === "away")) act({ t: "outingEnd", reward: pendingGift });
    else if (pendingGift && !FLOW.has(n) && n !== "held" && n !== "fall" && !game.celebrationsPaused) act({ t: "outingEnd", reward: pendingGift });
    else if (!outing && !pendingGift && n === "gift") act({ t: "giftDismissed" });
  }, [outing, pendingGift, pet.name, doReturn, act, game.celebrationsPaused]);

  // The pet comes home at endsAt, even if nobody touches anything.
  useEffect(() => {
    if (!outing || outing.creditedAt !== null || !OUT.has(pet.name)) return;
    const id = window.setTimeout(doReturn, Math.max(0, outing.endsAt - Date.now()) + 50);
    return () => window.clearTimeout(id);
  }, [outing, pet.name, doReturn]);

  // Gift card follows pendingGift.
  const visible = game.cards.visible;
  useEffect(() => {
    if (pendingGift && !game.celebrationsPaused) game.enqueueCard("gift", GIFT_CARD_ID);
    if (!pendingGift && (visible?.id === GIFT_CARD_ID || game.cards.queue.some((c) => c.id === GIFT_CARD_ID))) game.removeCardById(GIFT_CARD_ID);
  }, [pendingGift, game, visible]);

  // ---- user actions ----
  const markSupport = () => {
    supportUntil.current = supportWindowAfter(engineRef.current.get(), Date.now());
  };

  const onPet = () => {
    interacted();
    act({ t: "pet" });
  };
  const onFeed = (snack: SnackId) => {
    interacted();
    const r = act({ t: "feed", snack });
    if (r.state.name === "eat") narrate(fill(ui.narration.feed, { name, snack: ui.snacks[snack].toLowerCase() }));
  };
  const onPlay = () => {
    interacted();
    act({ t: "play" });
    firstPlayDone.current = true;
  };
  const talkIntent = (intent: Intent, confidence: number) => {
    interacted();
    setChoices(null);
    act({ t: "talk", intent, confidence });
    if (intent === "play") firstPlayDone.current = true;
    if (intent === "come_closer" || intent === "comfort" || intent === "rest") markSupport();
  };
  const onSend = (text: string) => {
    if (detectUrgent(text)) {
      openUrgent();
      return;
    }
    const r = interpretIntent(text);
    if (r.intent === "no_match") {
      interacted();
      act({ t: "talk", intent: "no_match", confidence: r.confidence });
      setChoices(["greet", "play", "come_closer"]);
    } else if (r.confidence < 0.7 && r.alternatives.length > 0) {
      interacted();
      act({ t: "talk", intent: "no_match", confidence: r.confidence });
      setChoices([r.intent, ...r.alternatives]);
    } else talkIntent(r.intent, r.confidence);
  };
  const onSupport = (intent: SupportIntent) => {
    interacted();
    act({ t: "support", intent, source: "chip" });
    markSupport();
    if (OUT.has(engineRef.current.get().name)) setOfferCallBack(intent === "comfort");
  };
  const onSendTo = (zone: DropZone) => {
    interacted();
    const r = act({ t: "sendTo", zone });
    if (r.changed) narrate(fill(ZONE_NARRATION[zone], { name }));
  };
  const onDragStart = () => {
    const r = act({ t: "dragStart" });
    if (r.state.name !== "held") return false;
    interacted();
    return true;
  };
  const onDragEnd = (x: number, speedPxS: number, zone: DropZone | null) => {
    const allowed = zone && (zone === "bed" || zone === "bowl" || unlocked.has(zone)) ? zone : null;
    act({ t: "dragEnd", x, speedPxS, zone: allowed });
    if (allowed) narrate(fill(ZONE_NARRATION[allowed], { name }));
  };

  function openUrgent() {
    setUrgent(true);
    live.current.paused = true;
    game.pauseCelebrations();
    act({ t: "urgent" });
    supportUntil.current = supportWindowAfter(engineRef.current.get(), Date.now());
  }

  const keepGift = () => {
    game.update(clearGift, true);
    game.removeCardById(GIFT_CARD_ID);
    act({ t: "giftDismissed" });
  };

  // ---- cards (R7: one at a time) ----
  let card = null;
  if (visible?.kind === "gift" && pendingGift && !OUT.has(pet.name)) {
    card = <GiftCard key={visible.id} reward={pendingGift} name={name} onKeep={keepGift} />;
  } else if (visible?.kind === "levelUp") {
    const lv = levelOfCard(visible.id) ?? level;
    card = (
      <LevelUpCard
        key={visible.id}
        level={lv}
        unlocks={unlocksForCard(save, lv)}
        name={name}
        calm={calm}
        onOk={() => {
          game.update((s) => markLevelSeen(s, lv));
          game.removeCardById(visible.id);
        }}
      />
    );
  } else if (visible?.kind === "welcome") {
    card = <WelcomeCard name={name} onClose={interacted} />;
  }

  const away = OUT.has(pet.name);
  const paused = pet.name === "paused";
  const stateLabel = ui.room.states[pet.name] ?? pet.name;
  const label = pet.name === "held" ? fill(ui.room.petNameHeld, { name }) : fill(ui.room.petName, { name, state: stateLabel });
  const rootCls = `room-screen${calm ? " calm" : ""}${save.settings.calmMotion === "off" ? " motion-ok" : ""}`;

  return (
    <div className={rootCls}>
      <header className="topbar">
        <div className="topbar-name">
          {save.flags.isDemo && <span className="badge">{ui.app.demoBadge}</span>}
          <strong>{name}</strong>
          <span className="muted small">{fill(ui.room.drawnStandIn, { name })}</span>
        </div>
        <BondHud bond={save.bond} name={name} bump={bump} />
        <div className="topbar-actions">
          <button type="button" className="btn ghost small" onClick={() => setPanel(panel === "album" ? null : "album")}>{ui.room.album}</button>
          <button type="button" className="btn ghost small" aria-expanded={growthOpen} onClick={() => setGrowthOpen((v) => !v)}>Pet life · {save.life.coins} ✦</button>
          {save.flags.isDemo && (
            <button type="button" className="btn ghost small" onClick={() => { game.exitDemo(); onExit(); }}>{ui.app.exitDemo}</button>
          )}
        </div>
      </header>

      <Stage
        state={pet}
        profile={eff}
        calm={calm}
        unlocked={unlocked}
        label={label}
        bubble={bubble}
        floats={floats}
        juice={juice}
        twitch={twitch}
        motionRef={motionRef}
        stageLabel={fill(ui.room.stageLabel, { name })}
        onWidth={(w) => { stageW.current = w; }}
        onPointerX={(x) => { anchor.current = { x, at: Date.now() }; }}
        onArrived={(x) => act({ t: "arrived", x })}
        onPet={onPet}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => act({ t: "dragCancel" })}
        onPounce={() => addFloat({ kind: "ring", n: 1 })}
        photoSrc={photoSrc}
        overlay={pet.name === "away" && outing ? <AwayCard outing={outing} name={name} onCallBack={callBack} /> : null}
        cards={card}
      />
      <p className="narration" aria-hidden="true">{narration || " "}</p>

      <section className="controls" aria-label="Controls">
        <SupportChips name={name} away={away} offerCallBack={offerCallBack} onSupport={onSupport} onCallBack={callBack} />
        <ActionDock
          species={eff.species}
          name={name}
          away={away}
          canSendCushion={unlocked.has("cushion")}
          onFeed={onFeed}
          onPlay={onPlay}
          onTalk={() => talkRef.current?.focus()}
          onOuting={() => setPanel(panel === "outing" ? null : "outing")}
          onSendTo={onSendTo}
        />
        {panel === "outing" && !away && (
          <OutingPanel name={name} level={level} quick={quick} blocked={outingBlocked} onGo={goOuting} onClose={() => setPanel(null)} />
        )}
        <TalkBox ref={talkRef} name={name} away={away} choices={choices} onSend={onSend} onChip={(i) => talkIntent(i, 1)} />
      </section>

      {growthOpen && <LifePanel game={game} level={level} quick={quick} onClose={() => setGrowthOpen(false)} onFeed={onFeed} onOuting={() => { setGrowthOpen(false); setPanel("outing"); }} />}

      <Footer
        name={save.flags.isDemo ? null : name}
        onHelp={openUrgent}
        paused={paused}
        onTogglePause={() => act({ t: "setPaused", on: !paused })}
        motion={save.settings.calmMotion}
        onMotion={() => game.update((s) => ({ ...s, settings: { ...s.settings, calmMotion: MOTION_CYCLE[s.settings.calmMotion] } }))}
        onDelete={async () => {
          await game.deleteAll();
          onDeleted();
        }}
      />

      {panel === "album" && <AlbumDrawer album={save.album} days={save.visits.days} name={name} onClose={() => setPanel(null)} />}
      {urgent && <UrgentHelpCard onClose={() => setUrgent(false)} />}
      <LiveRegion text={announce} />
    </div>
  );
}

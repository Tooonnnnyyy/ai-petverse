# AI Petverse Web: Living Pet and Gamification Spec (v0.4)

**Status:** Reviewed design spec (v0.4). Building can start now on the stated defaults. The owner's open questions are listed at the end of the "Review notes" section, and each one has a default. No code in this document has been implemented yet.
**Branch:** `feat/web-pet-gamification` (base commit `c27a244`).
**Target:** `web/` (React 19, Vite 6, TypeScript 5.7), shipped as a static site.
**Owner gates:** nothing is pushed, merged or deployed without the owner saying so (see §14).
**How this spec was made:** three candidate designs ("delight", "wellbeing" and "ship-fast") were scored and merged (Appendix A). Two critical reviews (v0.3 and v0.4) then rebalanced the numbers, trimmed P0 and filled gaps. The "Review notes" section at the end lists the v0.4 changes. Where Appendix A and the main text disagree, the main text wins.

---

## 1. Goals and non-goals

### Goals

1. **The pet looks like the owner's real pet.** It ships with original drawn art (SVG), and the user can upload their own photos per pose. The upload follows the DockCat pose-pack *idea* (no DockCat code or images): standing/dialogue, resting, walk frames, held and transition (stretch/yawn). Photos stay in the browser (IndexedDB) and are never uploaded.
2. **The pet feels alive.** It has autonomous idle life (rest, walk, sit, stretch, sleep; collectable "moments" in P1) and reacts to petting, dragging, feeding, play and talk. It does not react at full strength to everything; it can pause, decline, ignore, pull away or hide (PRD §3.7, §4.3).
3. **Fun that is safe for anxious, overloaded users.** It offers a bond level that only goes up, an outing that cannot fail and brings back a souvenir, a finite album, and at most one unprompted prompt per session. There is no decay, no streak, no fail state, no loot odds and no guilt copy. Skipping days never takes anything away. The unlock track is paced in visits, not calendar days: a typical visitor reaches the last level in about 8 visits, which is about 2 weeks when visiting every other day (§4.2).
4. **It feeds the PRD evidence loop.** Likeness feedback, structured corrections and the usefulness question stay central (PRD §4.5, §10). Gamification never awards points for feedback or support actions, so those metrics stay clean.
5. **It ships in about 5 focused days (P0)** as a static site, with pure, seeded and unit-tested game logic. v0.3 and v0.4 trimmed P0 to make this realistic. Anything not needed for the first public URL moved to P1, and §15 lists what to cut first if the build slips.

### Non-goals (v0.3)

- **Not built:** accounts, a backend, sync, sending analytics anywhere, or push notifications.
- **Left out on purpose:** streaks, need decay or hunger, outings that can fail, random rarity drops, gacha, currency, a shop, payments, trading, leaderboards, "your pet misses you" copy, and tab-title or favicon badges that signal a waiting gift.
- **Not in the UI:** Community and publishing (PRD §5, §8). They are hidden behind `SHOW_COMMUNITY = false`.
- **Not built:**
  - camera, microphone, gesture recognition, speech, LLM chat, and emotion detection (PRD §5, §7)
  - AI-generated poses, background removal, and photo-to-3D
  - a browser extension and PWA install
  - iOS (paused)
- **No claims:** no health or clinical claims, and no claim that the art is an exact copy. The UI says "photo-grounded approximation" (PRD §6).

---

## 2. Reference products and what we borrow

| Product | What we borrow | What we refuse or invert |
|---|---|---|
| DockCat (studied from a local copy, PolyForm Noncommercial: **ideas only, no code, no images, no text**) | Long states (walk, rest) with short transition poses; a random image per pose folder with random mirroring; walk frames drawn facing one way and mirrored; images bottom-aligned with a shared floor anchor; missing poses fall back; an outing stored as an end timestamp and resolved on wake | Long 2–5 min states (ours are shorter for browser tabs); drag only from long states (ours allows drag from every non-outing state); rarity tiers; any code, art, collectable names, outing stories or UI strings |
| oneko.js, MIT ([repo](https://github.com/adryd325/oneko.js)) | One fixed element, frames stepped on accumulated time, facing from the target vector, an idle counter that leads to an idle animation | Hiding the pet under reduced motion (we keep it visible and calm it down instead) |
| Shimeji ([listing](https://awesome.ecosyste.ms/projects/github.com%2Fdalekcraft2%2Fshimeji-desktop)), Desktop Goose ([article](https://gamesradar.com/untitled-goose-game-but-the-goose-wreaks-havoc-on-your-computer)) | Being picked up, dangling and set down; an autonomous body that wanders | Throwing and mischief that blocks the UI (opt-in "playful mode" in P2 at most) |
| Travel Frog ([guide](https://www.gadgetmatch.com/how-to-play-travel-frog), [article](https://www.themarysue.com/tabikaeru/)) | The pet leaves and comes back with a souvenir and a story; an album; packing (P1) | Unpredictable absence and postcards with "no guarantee" |
| Neko Atsume ([wiki](https://nekoatsume.fandom.com/wiki/Game_Menu), [MDA analysis](https://mechanicsofmagic.com/2024/04/07/mda-neko-atsume/)) | A behaviour catalogue ("Moments") seen as silhouettes until found; placing objects that bring out behaviours (drop zones) | A currency grind |
| Pokémon Sleep ([news](https://www.pokemon.com/us/pokemon-news/pokemon-sleep-and-pokemon-go-plus-coming-summer-2023)) | A dex of observed behaviours; time-of-day flavour | Exclusive time windows (FOMO) |
| Finch ([App Store](https://apps.apple.com/app/id1528595748), [streaks help](https://help.finchcare.com/hc/en-us/articles/37780736136205-Understanding-Streaks), [review](https://makeheadway.com/blog/finch-app-review/)) | Self-care actions that power the pet's adventure; free cosmetic unlocks | Streaks and streak repair |
| Forest ([App Store](https://apps.apple.com/us/app/id866450515), [critique](https://desirabilitylab.com/posts/forest)) | Using the outing as a focus companion | **Inverted:** nothing withers if you switch tabs; the pet returns either way |
| Habitica ([Death](https://habitica.fandom.com/wiki/Death), [Rest in the Inn](https://habitica.fandom.com/wiki/Rest_in_the_Inn)) | Nothing | Health damage and death |
| Bongo Cat ([PC Gamer](https://www.pcgamer.com/games/life-sim/one-of-the-biggest-games-on-steam-right-now-is-bongo-cat-a-cat-with-a-hat-who-smacks-your-windows-taskbar-like-a-bongo-drum-when-you-type), [drops](https://www.esports.net/news/bongo-cat-steam-popularity)) | Paws tapping while the user types in our own talk box (P1) | Timed rarity drops, trading, and global key tracking |
| Tabby Cat ([listing](https://chromeboard.com/extension/tabby-cat-mefhakmgclhhfbdadeojlkbllmecialg)) | Delight in passing; accessories | Extension scope (later) |
| Duolingo streak research ([Decision Lab](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification), [Desirability Lab](https://desirabilitylab.com/backfill/backfill-2023-154-duolingo-streak-design)) | Nothing | Streaks and paid freezes. We show a "days together" count that never resets |
| Furever Dock ([site](https://www.fureverdock.com/), PRD §12) | A rhythm of presence and a free preset path | Stored conversations used as memory |
| Ethics sources ([JMIR review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6617915/), [UX Mag](https://uxmag.com/articles/gamification-or-manipulation-understanding-the-ethics-of-engagement-loops), [Yu-kai Chou](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term/)) | Rewards are deterministic; the user chooses durations; nothing fails; nothing notifies by default | Points and social comparison for users in distress |

**Clean-room rule for DockCat (applies to every contributor and agent):**

- This spec is the only input for Petverse code, art and copy. Nobody opens DockCat source files (`DockCatApp/**`), images (`README_figs/`, pose packs, `DockCat.zip`) or content files (`Resources/Outing/*.json`, `AppStrings.swift`) while writing Petverse code, drawing art or writing copy.
- Souvenir names, postcard stories, bubble lines and care prompts are written from scratch.
  - v0.3 claimed the souvenirs had been renamed, but the list still shared names with DockCat's collectables, including two exact matches.
  - v0.4 compared the list with DockCat's collectable names and renamed 11 items (§4.5). Ten shared a name or a core noun, and one, "pressed wildflower", was the same idea as a DockCat item. A reviewer did this check once; implementers do not open DockCat.
  - A reviewer repeats the check whenever the catalog grows.
- The floor anchor (y = 450 of 512, §7.4) and the pose list are generic ideas, not copied values or assets. DockCat's code does not use this anchor value.
- Acceptance check: no file in the repo is byte-identical to a DockCat file, and `git grep -i dockcat -- web/` finds only comments that credit the idea (§16).

---

## 3. Core loop

```text
Moment loop (5–60 s)      pet acts on its own → user pets / drags / feeds / plays / talks
                          → pet reacts by profile (may delay, decline, ear-flick, pull away, hide)
                          → hearts, a bubble (P1: sometimes a new Moment for the album)

Session loop (2–30 min)   greeting by time of day (never mentions absence)
                          → a waiting gift card, if an outing finished while the tab was closed
                          → free play and support chips (Come closer · Stay with me · Quiet time)
                          → at most ONE unprompted prompt: a care invitation OR the pet's outing offer
                            (in the first session the welcome card uses this slot)
                          → optional outing (5/15/25/45 min) that cannot fail
                          → return walk-in → gift card (souvenir or postcard)
                          → at most one likeness check-in and one usefulness question (with back-off, §4.7)
                          → leave at any time; nothing is lost

Long loop (about 8 visits) Bond only goes up (daily caps rarely bind on one visit) → levels L1–L10 unlock
                          free room items, places and drawn-pet cosmetics (L2–L5 in P0) → a finite
                          album (24 souvenirs, postcards; 12 moments in P1) → "days together"
                          count (never resets)
```

**First 5-minute session (the pacing target for P0):**

| Time | What happens | Bond total (level) |
|---|---|---|
| 0:00 | Welcome → "Set up my pet" | – |
| 0:10–1:30 | Onboarding, 5 short steps; the photo step is skippable | – |
| ~1:30 | Room. After the startup transition the pet walks (the first long state of a session is always a walk, §5.1). Welcome card: "This is {name}'s room. Say hi, feed or play, or just let {name} be." | 0 (L1) |
| ~1:45–2:30 | Feed (+1), Play (+1), "Hi" (+1). Each is always accepted the first time (§4.1), so no luck is needed. The welcome card closes on the first of them | 3 → **L2 (cushion)** |
| ~2:30–4:00 | Pet the pet (+1 each, at most 2; an ear-flick gives 0), drop it on the cushion (0), then the likeness check-in, at least 10 s after the level-up card | 3–5 |
| any time | Optional: "Take a moment" (+4, about 30 s), or a 15-min outing (+3 on return, even if the tab was closed in between) | 8–9 → **L3 (Market)** |

The first unlock therefore arrives about 45 seconds after the Room opens. It needs only the three actions that the welcome card names, and the L2 threshold is 3 BP (§4.2). Petting luck never blocks it. With all 5 tap BP (the three actions plus 2 pets that land), adding one care moment or one 15-minute outing also reaches L3 (8 BP) in the first session.

**Design rules that apply to every system:**

- **R1 Finite commands.** Behaviour is chosen by deterministic code using seeded randomness, and emitted as a finite `PetCommand` union. The renderer maps commands to motion. Pointer coordinates are user input and are allowed. Walk targets are seeded ratios in [0, 1] (PRD §9).
- **R2 No decay, no fail state.** Progress values (Bond, album, days together) only go up or stay put. The simulated energy and curiosity reset to the profile baseline on every load, so absence never "costs" anything.
- **R3 Deterministic rewards.** Nothing collectable has an odds table. "Next unowned in seeded order" decides what comes next. Seeded randomness varies only behaviour (which rest pose, how long a walk), never what the user collects.
- **R4 The user chooses.** Durations, invitations, motion level, photos and data deletion are all the user's choice.
- **R5 Honest framing.**
  - Bond is "a simulation, not {name}'s real feelings".
  - A photo pet is a "photo-grounded approximation", and the drawn pet is a "drawn stand-in" (§9.1).
  - Copy never states or guesses the user's emotion.
- **R6 Clean evidence.** Feedback, support actions and corrections earn 0 Bond.
- **R7 One card at a time on the stage.** Priority order: urgent help, then gift, then level-up/unlock, then welcome, then feedback, then invitation or outing offer.
  - Cards wait in a queue (`game/cards.ts`). A higher-priority card replaces the visible one, and the replaced card goes back into the queue.
  - Gift, level-up and welcome cards wait until they are shown. Feedback cards are dropped at the end of the session. Invitations and outing offers are dropped if they cannot show within 10 s.
  - No card times out while it is visible, except the invitation and outing offer (60 s, §4.6). The level-up card waits for a dismiss like the others. The away scene is a stage state, not a card, and the outing panel is a sheet the user opens, not a card.
  - Cards never block the dock, the talk box or the pet. Only the urgent-help dialog is modal. The welcome card closes itself on the first interaction.
  - Gift, level-up and unlock cards survive a reload: they are rebuilt from `pendingGift` and `unlocksSeen` (§10.1). Other cards are in memory only.
- **R8 Safety first.** Once the urgent-help card has been triggered, gamification pauses for the rest of that page load (§6.8). The pause is an in-memory flag and is never saved.
- **R9 Support first.** The R9 window is the time the pet is settled after a support action, plus 2 minutes after a support action, a comfort intent or the urgent card. Inside it:
  - The pet never hides from, walks away from or declines the user.
  - Over-petting gives an ear-flick, and the pet stays put (§6.1, §6.2).
  - A Feed or Play that would be declined becomes a quiet settle near the user, with no decline line (0 BP either way).
  - No unprompted prompt appears (§4.6).

**Terms used throughout:**

- **Session:** starts on page load, or when a tab becomes visible again after 30 or more minutes hidden. It has its own `sessionId`. Every "once per session" rule uses this definition. The urgent-help pause (R8) lasts for the page load, not just the session.
- **Visit day:** a local calendar day (`localDayKey`) with at least one session. "Days together" counts visit days.
- **Visit:** all sessions on one visit day. Daily caps (§4.1) apply per visit, and pacing in §4.2 is counted in visits.
- **Room time:** time spent visible on the Room screen in this session. Onboarding does not count.
- **Interaction:** a user-initiated pet, drag, feed, play, talk or support action, whether it was accepted, declined or delayed.
- **Idle:** no user input on a visible Room for the stated time.

---

## 4. Gamification systems (exact numbers)

All numbers live in `web/src/game/config.ts` (`ECONOMY`, `PET_TIMING`). Tests import from there.

### 4.1 Bond points (BP)

| Source | BP | Daily cap | Notes |
|---|---|---|---|
| Pet (purr or lean reaction only) | 1 | 2 | 0 for an ear-flick, for over-petting, for a pet that wakes the pet and for pets during a hide |
| Feed (accepted) | 1 | 1 | Declined feeds give 0. The first feed of a day is always accepted |
| Play (accepted) | 1 | 1 | Declined play gives 0. The first play of a session is always accepted: it skips the energy and cooldown checks |
| Talk (chat chips and chat intents: greet, day, goodnight) | 1 | 1 | Support intents give 0 |
| Care moment completed (§4.6) | 4 | 8 | Self-reported, no verification. "Did it" is enabled only after the moment's minimum length (10–30 s), so two in a day take about a minute, not two taps |
| Outing returns (at its planned end, or called back early) | `floor(min(elapsed, planned) / 5)` with minutes: 5→1, 15→3, 25→5, 45→9; a recall at 12 min gives 2; under 5 min gives 0 | 9 | One formula for both cases. There is no minimum and no penalty wording, so a start-and-recall loop earns nothing extra. The 1-min "Quick look" outing gives 0 |
| Drag, drop zones, support chips, feedback, corrections, moments seen | 0 | – | Keeps PRD §10 metrics clean |
| **Total per visit (local day)** | – | **20** | Taps alone reach at most 5. The source caps add up to 22, so the total binds only on very heavy days |

- **Caps:** the day key is the local date (`YYYY-MM-DD`), and caps reset at local midnight. An outing's BP counts on the day it returns (or is resolved on load).
- **Past a cap:** actions still work and reactions still play. The only sign is a line in the Bond panel (§9.1): "Bond is resting for today. Everything else still works." It never says "come back" or "tomorrow", and there is never a popup.
- **Nothing decays.** `total` never decreases.
- **Each outing credits BP once.** `Outing.creditedAt` is set when its BP is awarded, so a reload, a second resolve or a second tab cannot pay twice.
- **Why the caps are low:**
  - A typical visit (2 pets, feed, play, "Hi", one care moment and one 25-min outing) earns 14 BP and never meets the 20 total. A quick tap-only visit earns 5.
  - The caps stop tap grinding within one day. They do not reward daily attendance.
  - Pacing is counted in visits (§4.2). Visiting every other day spreads the same visits over more calendar days, and skipping a day loses nothing already earned. This is the "no daily obligation" rule in numbers.
  - A "rested bond" catch-up for missed days is not in P0. It is an open question (Review notes).

### 4.2 Levels

`threshold(L) = L² − 1`, giving 0, 3, 8, 15, 24, 35, 48, 63, 80 and 99 for L1–L10. L10 is the last level. Bond keeps counting after it, but there are no more unlocks.

Pacing is counted in visits (one visit = one visit day, §3 Terms):

| Usage pattern | BP per visit | L2 (3) | L3 (8) | L5 (24) | L10 (99) |
|---|---|---|---|---|---|
| Light: taps only, about 2 min | 5 | visit 1 | visit 2 | visit 5 | visit 20 |
| Typical: taps, 1 care moment, a 25-min outing (the first visit has taps and a 15-min outing, 8 BP) | 14 | visit 1 | visit 1 | visit 3 | visit 8 |
| Full: every cap reached | 20 | visit 1 | visit 1 | visit 2 | visit 5 |

**In calendar time:**
- A typical user who visits every other day reaches L10 on about day 15, which is "about 2 weeks".
- The same user visiting daily reaches it on about day 8. A light daily user reaches it on about day 20.
- The earliest possible L6 (the first P1 unlock) is day 2, at the full pattern. §4.3 covers what happens if P1 is not live yet.
- Album completion (24 souvenirs, §4.5) is paced by outings, not Bond, and keeps going after L10.

**Level names** (HUD ring and level card): 1 New friend · 2 Curious · 3 Familiar · 4 Comfy · 5 Trusted · 6 Cosy · 7 Close · 8 Dear · 9 Kindred · 10 Old friends.

**HUD:** a ring around a heart with the level number. Its accessible name is "Bond level 3, Familiar. A simulation, not Miso's real feelings."

### 4.3 Unlocks (free and permanent; each shown once as a dismissible card)

| Level | Unlock | Phase |
|---|---|---|
| L2 | Cushion (a drop zone where the pet rests in a loaf pose). P1 adds a second set of talk lines here | P0 |
| L3 | Market destination | P0 |
| L4 | Window seat (a low drop zone under the window where the pet sits and watches; in P1 it also makes the "window watch" Moment eligible). P1 adds a scarf for the drawn pet here | P0 |
| L5 | Hills destination | P0 |
| L6 | Evening lamp (warm tint 19:00–06:00 local) | P1 |
| L7 | Bow for the drawn pet; the "belly-up" Moment becomes eligible | P1 |
| L8 | Plant and rug | P1 |
| L9 | Rain-window ambience toggle (visual only, no sound) | P1 |
| L10 | "Old friends" album cover and stamp | P1 |

- **Cosmetics** (scarf, bow) render only on the drawn pet. Photo pets get room items instead, so their real look is never covered.
- **Unlocks are tracked by id, not by level.** `unlocks.ts` lists `{ id, level, phase }`. `SaveV2.unlocksSeen` holds the unlock ids whose card has been shown.
- **P0 without P1 content:** P0 defines all 10 level names. Reaching L6–L10 before P1 is live shows the level-up card with the level name only. There is no "coming soon" line and no promise.
- **When P1 ships:** every unlock whose level the user has already reached and whose id is not in `unlocksSeen` is granted on the next load, in one combined card: "New things in {name}'s room". One card, not one per level (R7).
- This removes any release deadline for P1. Shipping P1 within about a week of launch is still the plan.

### 4.4 Outings

- **Places:** Garden and Riverside are available from the start. Market unlocks at L3 and Hills at L5.
- **Durations:** 5, 15, 25 or 45 min. A 1-min "Quick look" option (0 BP, always a postcard) appears when the URL has `?quick=1` or the demo pet is active. It exists for reviewers and QA.
- **Rules:**
  - Outings never fail.
  - The user can call the pet back at any time.
  - Outings use wall-clock time, so they survive reloads and hidden tabs.
  - There are no notifications.
- **Leaving:** the pet walks to the nearest edge (or fades, in calm motion).
- **While away:**
  - The stage shows a dented bed and a note: "{name} is at the Riverside · back around 14:32. Focus on one thing, or don't. {name} comes back either way."
  - Feed, Play, the chat chips and the pet itself are disabled, labelled "{name} is out".
  - The support chips still work. They narrate a calm line, and "Stay with me" offers "Call {name} back".
  - **The typed talk box stays enabled.** Urgent detection always runs (§6.8). Support intents act like the chips. Other intents narrate "{name} is out. Back around 14:32."
- **Midpoint postcard (P1):** at `postcardAt = startedAt + planned/2` the away card shows one postcard line. The timing is predictable.
- **Return:**
  - The pet walks in from a random edge.
  - A gift card flips over in 600 ms (a fade in calm motion). It has a NEW stamp if the item is new, and a 1–2 line story.
  - The card waits as long as needed. On load, if the outing has ended, the pet is already home: "{name} is back from the Garden and brought something."
- **Persistence:** `{ id, place, plannedMin, startedAt, endsAt, recalledAt, creditedAt }` is saved. `resolveOnLoad` returns `"none" | "away" | "returnNow"`.
- **Return procedure (`resolveReturn`, one save write):**
  1. If `creditedAt` is set, skip to step 4. This is what stops a reload or a second tab from paying twice.
  2. `returnedAt = recalledAt ?? endsAt`. Compute the reward with `rewardFor` and the Bond with `outingBond`.
  3. Award the Bond, add the reward to the album, set `pendingGift`, and set `creditedAt = now`.
  4. Write the save. When the gift card is dismissed, set `outing = null` and `pendingGift = null`, then write again.
  - The album and Bond therefore update when the pet returns, not when the card is dismissed. Closing the tab before dismissing loses nothing.
- **Clock guard:** if `now < startedAt` on load (the clock moved back), the outing resolves at once as a recall with 0 elapsed minutes (a postcard). A clock moved forward simply ends the outing early. This is harmless because nothing is competitive.
- **Gating:** an outing cannot start while the pet is held, while another outing is running, or after the urgent-help card has been triggered in this page load.

### 4.5 Album: souvenirs, postcards, moments

**Souvenirs: 24 in total (4 places × 6).** Each place has 5 "everyday" items and 1 "keepsake".

| Place | Everyday (seeded order per install) | Keepsake |
|---|---|---|
| Garden | ladybug sticker, clover sprig, garden twine, seed packet, watering-can charm | golden acorn |
| Riverside | skipping stone, reed flute, paper boat, river glass, cattail fluff | moonstone |
| Market | paper lantern, spice tin, price tag, orange-peel curl, bead string | brass key |
| Hills | thyme bundle, pressed fern, cloud stone, kite tail, map scrap | comet shard |

v0.4 renamed 11 items (§2):
- ladybug button → ladybug sticker
- snail-shell bead → garden twine
- smooth pebble → skipping stone
- heron feather → reed flute
- ribbon scrap → paper lantern
- bottle cap → spice tin
- bell charm → price tag
- orange-peel star → orange-peel curl
- pinecone → thyme bundle
- pressed wildflower → pressed fern
- star crystal → comet shard

"Bottle cap" and "pinecone" were exact matches. No word in a current name appears in a DockCat collectable name.

**Reward rule (`rewardFor`, deterministic, no odds):**

1. Compute elapsed minutes: `elapsed = min(plannedMin, (returnedAt − startedAt)/60000)`.
2. If `elapsed < 15`, the reward is a postcard.
3. Otherwise, take the first unowned everyday item at that place, in the order given by `seededShuffle(installSeed, place)`.
4. If all 5 everyday items at the place are owned and `elapsed ≥ 25`, the reward is the keepsake. If `elapsed < 25`, it is a postcard plus a neutral hint: "Something special might turn up on a longer trip."
5. Once a place is complete, its rewards are postcards. Once all 24 are owned, the album shows a "complete" stamp and outings keep bringing postcards.
6. Duplicates are impossible.

**Postcards and stories:**
- P0 has 4 stories per place (16 in total). P1 raises this to 8 per place (32).
- Stories are used in turn through `storyCursor[place]`. Every gift card, whether it holds a souvenir or a postcard, shows one story.
- The postcard log keeps the last 30 story ids.

**Moments: 12 observed pet behaviours (P1).** They are recorded on first sighting and shown as silhouettes until then. They record nothing about the user.

- **P0 ships no part of the Moments album:** no Moments tab, no toast, no `moment` state and no `game/moments.ts`.
- The behaviours P0 needs exist as plain reactions instead:
  - slow blink is a `petted` reaction (§6.1)
  - a drop on the cushion or the window seat plays a rest or sit pose (§6.2)
  - yawn and stretch are transitions (§5.1)

| Id | Host state | Rendered as `{slot, motion}` | Gate |
|---|---|---|---|
| loaf | rest | rest + breathe | – |
| curlUp | rest | rest + breathe | – |
| bellyUp | rest | rest + tilt 180° (drawn: its own pose) | L7 |
| yawn | transition | talk + squash | – |
| bigStretch | transition | transition + squash | – |
| tailChase (cat) / playBow (dog) | sit | walk + spin / transition | – |
| headTilt | sit | talk + tilt 8° | – |
| sideEye | sit | talk + glance (drawn eyes) | – |
| blep | sit | talk + tongue overlay (drawn) / bounce (photo) | – |
| dreamTwitch | sleep | sleep + shiver | – |
| slowBlink | petted (comfort style "close") | talk + eyes-close | – |
| windowWatch | sit on the window seat | rest + tilt | L4 |

- **Discovery is deterministic (R3), with no odds:**
  - On every 6th long-state entry, the next unseen eligible moment in seeded order plays.
  - On other entries, a moment the user has already seen may replay with p = 0.1. This only adds variety.
  - (v0.3's 10% odds plus a pity timer was a variable-ratio schedule for a collection, which R3 rules out.)
- **Rate limit:** at most one moment per 60 s.
- **New sighting:** a 2.5 s toast, also announced through the live region. Moments give 0 BP.

**Days together:** the count of distinct local days with a session. It never resets and never says "in a row".

### 4.6 Care invitation (the only "quest")

**P0 care moments (4).** In each one the pet acts alongside the user. "Did it" (or "Got it") is enabled only after the minimum length, so the +4 BP cannot be collected in two taps.

| Id | Prompt | Pet does | Minimum length |
|---|---|---|---|
| water | "A sip of water with {name}?" | Drinks from the bowl | 10 s, then "Did it" |
| breaths | "Three slow breaths?" | A 30 s breathing circle (4 s in, 6 s out); the pet breathes in sync | 30 s |
| stretch | "Stretch with {name}?" | Big stretch (the transition pose) | 20 s |
| oneThing | "Pick one tiny next step?" | Sits beside the user. After 10 s: "Got it", or "Send {name} out while I do it", which opens the outing panel with 15 min preselected | 10 s |

P1 adds four more: look away from the screen for 20 s, stand up, tidy one thing, and "a 5-min outing". `oneThing` stays in P0 because it is the closest match to the PRD job "help me start".

**When an invitation can appear (`shouldOffer`), all of these must hold:**

- at least 90 s into the session
- the pet is resting or sitting
- no outing is running
- no bubble in the last 30 s
- no typing in the last 10 s
- invitations are on in Settings
- the urgent-help card has not been triggered in this page load
- the user is not in the R9 window (no support action or comfort intent in the last 2 minutes)
- no unprompted prompt has been shown yet this session (the care invitation and the pet's outing offer share this single slot)

**Picking (`pickInvitation`):**

- seeded, and never one of the last 3 shown
- before 11:00, water and stretch get weight ×2
- after 21:00, breaths gets ×2, and stand-up (P1) is never offered

**Responses:**

- "Did it" gives +4 BP.
- "Not now" closes the card.
- With no answer, the card disappears silently after 60 s. Misses are never counted against the user.
- **Back-off:** "Not now" in 2 sessions in a row means the next 2 sessions offer nothing.
- **Always available:** a "Take a moment" button in the dock overflow lists all care moments at any time. Doing one this way still earns BP, within its cap.

**Pet's outing offer:** "{name} looks at the door. Go exploring?" It appears at most once per session, after 3 or more idle minutes, under the same `shouldOffer` gates, and uses the same single prompt slot.

### 4.7 Feedback timing (PRD §4.5)

- **Likeness:** "Did that feel like {name}?" with the answers Yes / Partly / Not yet.
  - **When (unprompted):**
    - In the first session: after the 3rd interaction or the first outing return, whichever comes first.
    - After that: at most once every 3 visit days, on the same trigger.
    - Never within 10 s of a level-up card.
    - Asking every session would repeat the old "feedback after every action" nag.
  - **On demand:** a "Does this feel like {name}?" button in the Profile drawer opens the same card at any time.
  - **Corrections:** structured correction chips and the free-text field are visible immediately (fixes bug 5).
  - **Chips and what they write:**
    - "More energetic": energy one step above the effective value (low → steady → high)
    - "Calmer": energy one step below the effective value
    - "Likes closeness": comfortStyle `close`
    - "Likes space": comfortStyle `space`
    - "Hides when startled": `startleHide` `true`
    - A chip whose result equals the current effective value shows as already applied.
  - Each chip writes a `Correction`, which immediately changes behaviour through `effectiveProfile` (PRD §3.3, §6).
  - Free text is stored locally as a `note` correction. It is shown in the Profile drawer and never interpreted.
- **Usefulness:** "Did {name} help you pause, start, continue or reset?" with an option for each and "Not this time".
  - **When:** at most once per visit day, after a care moment marked "Did it" or after an outing of 15 minutes or more returns.
- **Dismissing** either card without answering counts as asked, for the timing rules above.
- **Bond:** both questions give 0 BP.
- **State:** `SaveV2.feedback` keeps `likenessAskedAtVisit` (the `visits.days` count when it was last asked) and `usefulnessLastDay` (§10.1). `game/feedback.ts` holds the timing rules, which are unit-tested.

---

## 5. Pet behaviour state machine

`step(state, input, ctx)` is a pure reducer, and its random-number state lives in `PetState.rngState` (mulberry32). Seeded replay is exact. Times are in ms, and every range is uniform and seeded.

### 5.1 States

The PRD §4.3 states map as follows: idle → rest/sit, watch → sit, approach → approach, settle → settle, play → play, rest → rest, hide → hide.

| State | Pose slot (fallback in §7.5) | Duration | Transitions out | User interrupts accepted |
|---|---|---|---|---|
| rest | rest (random variant, never the same as last time when there are 2 or more, mirrored at random when allowed) | 20–60 s (the first rest of a session: 10–20 s) | Next long state: walk .55, rest .30, sit .15. After 3 rests in a row with no interaction (2 at night), sleep replaces rest | all |
| walk | walk frames at 5 fps; 45–70 px/s × speed factor (0.8 when energy < 30, 1.2 when energy > 75, otherwise 1) | until arrival (target ≥15% of stage width away, 16 px margin from the sprite edges), hard cap 12 s | rest .75, sit .25 | all |
| sit (watch) | talk | 4–8 s | rest .5, walk .5 | all |
| transition | transition (stretch, yawn or shake) | 1.6–2.4 s | the long state chosen before it | all |
| sleep | sleep | 60–180 s | transition (yawn), then rest .5 / walk .5 | pet (wakes with a yawn, no hearts, no BP), drag, buttons |
| moment (P1) | per moment `{slot, motion}` | 1.5–6 s | resume the previous long state | all |
| petted | happy (slow blink: talk pose with the eyes closed) | 1.2–2 s (slow blink 2.5 s) | resume | pet (chains), drag, buttons |
| held | held | while the pointer is down | fall 300 ms, squash 120 ms, then a drop-zone action, a hide roll, or land (transition 0.8 s) and rest | Esc (cancel: back to the origin x) |
| eat | eat | 3–4 s | rest | drag |
| play | play (wand chase) | 6–10 s (6 s with the "too much energy" trigger) | transition. Cooldown 45 s (60 s with that trigger) | drag; a pet ends play early |
| talk | talk + bubble | 3–6 s, or until the bubble is dismissed | resume | all |
| approach | walk (40 px/s when energy < 30, otherwise 60) | until it reaches the comfort distance | settle | all |
| settle | rest near the user anchor. "close": ≤12% of stage width from the anchor; "nearby": 20–30%; "space": ≥35% (clamped to the stage; if no spot that far exists, the farthest edge) | 20–40 s ("Quiet time": 60 s, no bubbles) | autonomous pick | all |
| hide | rest at the nearest edge, 60% opacity, 30% off-stage | 8–20 s | sit | drag, buttons; a pet only gives an ear-flick (0 BP) |
| leaving | walk to the nearest edge | 3–5 s | away | Call back |
| away | none (empty dented bed and a note) | until `endsAt` | returning | Call back |
| returning | walk from a random edge | 3–5 s | gift | none |
| gift | talk + GiftCard | until dismissed | transition, then rest | dismiss |
| paused | the current pose held still | while "Pause pet" is on | resume | Pet gives a text reaction only; buttons work, using fades |

**Transition insertion:** before any long state (rest, walk, sit, sleep) a transition is inserted with p = 1/3. One is always inserted at startup, after sleep and after landing.

**Startup:** after the startup transition, the first long state of a session is always a walk, so the pet visibly moves within about 3 s of the Room opening.

**User anchor:** approach and settle distances are measured from the user anchor. It is the last pointer x over the stage if that is less than 10 s old, and otherwise the stage centre (x = 0.5). The user has no other position on the stage.

**Sprite size and position:**
- The 512 canvas renders in a square box of `clamp(120px, 45% of the stage height, 200px)`.
- `PetState` tracks only x along the floor line.
- While the pet is held, the renderer moves the sprite in both x and y. On release it falls back to the floor.

**Unprompted bubbles:** at most one every 2 minutes, from the `idle` line set (the session greeting counts as one), and none in calm motion or Quiet time.

### 5.2 Simulated stats (0–100, labelled as a simulation)

**Energy:**
- **Baseline by profile:** low 45, steady 65, high 85, and 65 when unknown. It **resets to the baseline on every load**.
- **Changes:**
  - walking: −1 per 4 s walked
  - play: −15
  - resting or sleeping: +1 per 4 s
  - feed: +5
- **Range:** clamped to 10–100, so the pet is never "exhausted".
- **When changes apply:** the machine has no per-second tick, so time-based changes are applied when a state ends, from its elapsed time.
- **Effects:**
  - below 30: walk weight ×0.6, rest weight ×1.5, walk speed ×0.8
  - above 75: walk weight ×1.5, rest weight ×0.7, walk speed ×1.2
  - below 25: play is declined with "later?" (never the first play of a session, §4.1; never inside the R9 window)

**Curiosity:**
- **Changes:** +2 per 10 s in rest or sit, and it resets to 20 after a walk.
- **Effect:** at 70 or above, walk and sit get ×1.5.

**Night (22:00–06:00 local):** rest ×1.5, and sleep comes after 2 quiet rests.

**Applying the factors:** multiply them in, then renormalise the weights.

**No hunger, and no "sad because you left" state.**

**How the PRD §4.3 values map:**
- Energy, curiosity and the play cooldown are simulated as above.
- Arousal is not a stored number. It is the over-petting window (§6.1) plus the startle roll on release (§6.2).
- Trust is not simulated in P0. Bond is shown as a simulation and never changes behaviour, so likeness stays driven by the profile and the corrections (open question in Review notes).

### 5.3 Interrupt priority (highest first)

1. urgent-help card
2. held (drag)
3. outing flow (leaving, away, returning, gift)
4. buttons: Feed, Play, Talk, support chips
5. pet (tap)
6. autonomous behaviour

**Delays (PRD §3.7):** 15% of reactions to a tap, Feed, Play, Talk or a support chip wait 300–900 ms with an ear twitch first. Drags and the urgent-help card are never delayed.

### 5.4 Tab visibility and reduced motion

- **Hidden tab:** no ticks and no `requestAnimationFrame`. When the tab becomes visible after more than 60 s, the pet yawns (transition).
- **Calm motion** (Auto follows `prefers-reduced-motion`; On; Off):
  - walks become `fadeTo` (200 ms out, move, 200 ms in)
  - no bob, breathing, falls or tilt
  - leaving and returning fade
  - hearts become one static heart icon
  - the level-up card has no burst
- **Pause pet:** holds the current pose with no motion at all (WCAG 2.2.2).

---

## 6. Interactions

### 6.1 Pet (tap or click)

**Input:**
- A pointer that moves less than 6 px and is released within 300 ms counts as a tap.
- With the keyboard, Enter or Space on the focused pet button.

**Reaction odds:**

| Comfort style (effective) | purr | lean | earFlick |
|---|---|---|---|
| nearby (default) | .70 | .20 | .10 |
| close | .60 | .35 | .05 |
| space | .50 | .25 | .25 |

**Hearts:** purr and lean show 1 heart. Taps within 1.5 s chain to 2 and then 3 hearts (the maximum). An ear-flick shows none.

**Juice (CSS only):**
- scale to (1.06, 0.92) over 90 ms, then (0.97, 1.04) over 90 ms, then back to 1 over 120 ms, anchored at 50% 88%
- hearts rise 40 px over 700 ms
- a purr ring that fades out over 600 ms
- the drawn pet's pupils follow the pointer by up to ±3 px; a photo pet leans by up to ±3°

**Over-petting:** 4 or more taps in 8 s (3 with the "too much energy" trigger or the "likes space" correction). Outside the R9 window:
- "space", or the "hides when startled" correction: hide.
- "nearby": walk away to at least 30% of the stage width from the user anchor, then sit.
- "close": a slow-blink reaction (`petted`, reaction `slowBlink`) where the pet is. In P1 this also counts as the slowBlink Moment.
- Inside the R9 window, every comfort style gives an ear-flick and the pet stays put.
- Bond during over-petting: 0.

### 6.2 Drag (held)

**Input:**
- Pointer down, then more than 6 px of movement, starts a drag.
- Pointer Events with `setPointerCapture`, and `touch-action: none` on the pet only.
- Allowed from every state except the outing flow (leaving, away, returning, gift).

**While held:**
- the pet follows the pointer with lerp 0.35
- it tilts with horizontal velocity, up to ±12°
- the stage clamps it

**On release:**
- **Drop zones** are floor bands at fixed stage ratios: bed centred at x 0.12, bowl 0.32, cushion 0.58, window seat 0.84.
  - Each band is 14% of the stage width and at least 44 px wide.
  - A drop counts when the pet's anchor x is inside a band. Height does not matter.
  - The zones:
    - bed: sleep for 60–120 s
    - bowl: eat for 3 s (0 BP, does not count as a feed)
    - cushion (L2): rest in the loaf pose for 20–40 s
    - window seat (L4): sit facing the window for 10–20 s
- **Otherwise,** fall to the floor (300 ms ease-in), squash (120 ms), and roll for a hide:
  - base chance: space .5, nearby .15, close 0
  - +.3 if the release speed is above 1500 px/s, which also plays a startle transition first
  - +.2 more on a fast release when the trigger is "sudden noise" (the startle transition always plays)
  - +.3 if the correction "hides when startled" applies
  - capped at 0.9
  - Inside the R9 window, there is no hide roll and the pet lands and rests.
- **No Bond** for dragging.
- The trigger "strangers" is a recorded fact with no behaviour in P0, because the room has no strangers. The Profile drawer says so.

**Keyboard (WCAG 2.5.7 alternative):**
- Arrow Left or Right on the focused pet picks it up and moves it 24 px per press.
- Enter or Space drops it, onto a drop zone if it is over one.
- Esc cancels.
- The dock also has "Put to bed" and "Lead to bowl". They dispatch `sendTo` (the pet walks to the zone itself, with no drop and no hide roll).

### 6.3 Feed

- The Feed button opens 3 snack chips.
  - Cat: crunchy, soft, fishy.
  - Dog: crunchy, soft, chewy.
- The bowl slides in over 200 ms, and the pet eats (3–4 s) with a "nom" bubble.
- **Declining:** a 3rd feed within a rolling 20 minutes gets "{name} is full. Maybe later." and 0 BP.
- The pet is never hungry, and nothing asks the user to feed.
- **P1 snack quirk:** after 3 feeds, a seeded "favourite" is revealed as "seems to love soft treats (simulated)", with a [Change] button. The user's choice is a correction and always wins.

### 6.4 Play (wand chase)

- **Wand:** Play shows a feather wand (a rope toy for dogs) that follows the pointer. The pet chases the pointer x at 110 px/s with lerp, for 6–10 s.
- **Touch or keyboard without a pointer:** the wand wiggles automatically along a seeded path.
- **Pounces:** when the pet comes within 24 px of the wand, it pounces (a tilt and hop). In P1 a seeded "catch" gives an extra heart.
- **Declining:** during the cooldown, or when energy is below 25, the pet yawns and says "later?" (0 BP). The first play of a session is never declined, and inside the R9 window a decline becomes a quiet settle (§3).
- **After play:** a transition, then the 45 s cooldown (60 s with the "too much energy" trigger).

### 6.5 Talk

**Chat chips:**
- "Hi" (greet)
- "How was your day?" (day: the pet tells a seeded mini-story from home or from its last postcard)
- "Good night" (goodnight: the pet curls up)

**Free typing:** typed text goes through `detectUrgent`, then `interpretIntent`. The text is never stored or logged, only the intent and a confidence bucket. The input clears after each send.
- Typed play, come_closer, comfort and rest run the same action as the matching button or chip: the same caps, and 0 BP for the support intents.
- Typed greet, day and goodnight act like the chat chips.

**Classifier rules (fixes bug 9):**
- **English:** whole-word and whole-phrase matching on lowercased tokens (`\b` boundaries).
- **Negation:** "not", "no", "don't", "never" or "can't" within 3 tokens before a match cancels it.
- **Removed bare keywords:** "close", "fun", "energy", "walk" and "break".
- **Chinese:** curated multi-character keywords matched as substrings, with negators 不, 别, 不想 and 没 when they appear immediately before the keyword.
- **Two or more intents matched:** confidence 0.6, and the pet asks for a choice with chips (PRD §3.5).
- **No match:** confidence 0.2. The pet shows "Not sure. One of these?" with chips, and logs `intent_fallback`.

**Bubbles:**
- **Voice:** the pet's own, at most 60 characters, chosen from `lines.ts` by intent. P0 has one voice. The energy-based voices (soft, steady, bouncy) arrive in P1.
- **P0 size, about 40 lines:**
  - 3 lines each for greet, goodnight, come_closer, comfort, rest, play and idle
  - 2 lines each for the three declines and for no_match
  - 4 time-of-day greetings
  - 4 home stories for "How was your day?"
- **Repeats:** never one of the last 3 lines.
- **Narration:** a separate third-person line under the stage, for example "Miso pads over at an unhurried pace."

**Copy rules:**
- Never "you seem…", "you feel…" or "I can tell you're…", and no statement about the user's emotion (PRD §7, §11).
- Declines and hides never blame the user. No "you scared {name}" and no "because of you". For example: "{name} tucks into a corner for a bit."
- The free-text favourite activity (at most 40 characters) appears in one place only: the narration of an accepted play ("{name} perks up, maybe thinking about {favourite}.").
- These rules are enforced by the banned-phrase test (§13.1).

**Bongo paws (P1):** while the user types in the talk box, paw taps at most every 120 ms. Nothing is logged.

### 6.6 Support chips (PRD core actions)

| Chip | Intent | Pet response by effective comfort style |
|---|---|---|
| Come closer | `come_closer` | close / nearby: approach at normal pace, then settle near. space: approach slowly, then settle at room distance, saying "{name} looks over, then picks a respectful distance." |
| Stay with me | `comfort` | close: settle near and lean. nearby: settle at 20–30%. space: settle at ≥35% and watch |
| Quiet time | `rest` | settle near or at room distance for 60 s, with no bubbles and no invitations during it. Narration: "Nothing else is required." |

- **Logging:** `support_action_used {intent, source: "chip" | "typed", confBucket}`.
- **Bond:** 0 BP.
- **PRD mapping:** the PRD's three support actions are Come here, I feel overwhelmed and Let's play. Here they are Come closer, Stay with me and Play (the dock button or typed play); Quiet time is an extra. The PRD §10 metric "% of sessions reaching a support action" counts all four. Play earns BP, so the chip-only rate is also reported on its own (§12).

### 6.7 Outing

See §4.4. In P1, **packing** adds one snack and one toy to the outing panel. They change the story tone and the postcard doodle only, never the reward value.

### 6.8 Urgent help (PRD §11)

**Detection:** `detectUrgent(text)` runs on every typed message before intent classification, including while the pet is out (§4.4). It uses curated English and Chinese phrases, for example "kill myself", "end my life", "end it all", "want to die", "don't want to be alive", "hurt myself", "self harm", "suicide", 不想活, 想死, 活不下去, 自杀, 轻生 and 伤害自己. The owner reviews the final list.
- **Trade-off:** false positives are acceptable, false negatives are not. The phrase list is tested both ways.

**On a match:**
- The calm `UrgentHelpCard` appears with this text: "If you might be in danger or thinking about hurting yourself, please contact your local emergency number now. You can also find free, confidential support at findahelpline.com." (owner to confirm the link). It has one button: [I'm safe right now].
  - The link opens in a new tab with `rel="noopener noreferrer"` and carries no data.
  - The card never repeats the user's text.
- The pet settles at a comfort-appropriate distance with no bubbles.
- **Gamification pauses for the rest of this page load.** The pause is an in-memory flag and is never saved. It covers:
  - **Nothing celebratory is shown.** Bond is still recorded silently, so nothing is lost (R2). No level-up, unlock or gift card appears until the next page load. A pet that is out still comes home, and its gift waits in `pendingGift`.
  - no invitations or outing offers
  - no feedback prompts
- **Not logged.** Nothing about the urgent card goes into the event log or any storage, and the text is never stored.
  - The log stays on a device that may be shared and is never sent anywhere.
  - A stored record could only expose the user. It could not help any safety review.
  - (v0.3 logged `urgent_help_shown`; v0.4 removes it.)
- **Always available:** the footer link "Need help now?" opens the same card.

---

## 7. Pose pack and upload

### 7.1 Entry and consent

**Entry points:**
- onboarding step 5 ("Make it look like {name}", skippable)
- Profile drawer, then "Photos"
- the L1 welcome card

**Consent screen** (shown before any file picker; the upload code is lazy-loaded behind it):

> **Your photos stay on this device.** They're resized and saved only in this browser. They are never uploaded to us or anyone else and never used to train anything. They stay until you press **Delete my photos** or clear this site's data. Private windows forget them when closed, and some browsers (such as Safari) may clear site data if you don't visit for about a week. What you'll see is a **photo-grounded approximation** of {name}, not an exact copy.
>
> [Add photos] [Not now]

**After consent:**
- Call `navigator.storage.persist()`. Firefox shows its own permission prompt for this, which is expected right after consent. If it is not granted, Settings says: "Your browser may clear photos if space runs low."
- If IndexedDB cannot be opened (blocked storage, or some private modes), photos are turned off with the toast "Photos can't be saved in this window." The drawn pet stays.

**Demo pet:** photos are turned off while the demo pet is active ("Set up your own pet to add photos"). This keeps the rule that the demo writes nothing.

### 7.2 Slots

| Slot | Label | Needed for a "complete" pack | Max | Notes |
|---|---|---|---|---|
| talk | Standing / front | 1 (asked first; also used as the preview) | 4 | |
| rest | Resting | 1 | 6 | random variant, no repeats |
| walk | Walk frames (in order) | 2 | 8 | reorder with Move up / Move down (drag-to-reorder in P1); facing selector (left or right) |
| held | Being held | 1 | 3 | |
| transition | Stretch / yawn | 1 | 4 | |
| eat, play, sleep, happy (**P1**) | Optional extras | – | 3 each | P0 covers these through the fallback chain (§7.5) |

- **Pack cap:** the per-slot maxima cap the count (25 images in P0, 37 with the P1 extras), and at most 25 MB is stored.
- **Single-photo mode is the default path.** One photo covers every state through motion overlays (§7.5). The tip reads: "One photo is enough. Add more any time."
- **Cutout tip:** "For the best look, use a cut-out PNG. On iPhone, long-press your pet in Photos, then Copy or Share the subject."

### 7.3 Validation (per file, shown inline; one bad file never blocks the others)

Checks run in this order.

1. **Pack full:** the slot is at its maximum, or the pack would exceed 25 MB. Reason: `pack_full`.
2. **File size:** at most 8 MB. Reason: `too_big_bytes`.
3. **Read the first 64 KB** and sniff the magic bytes.
   - Accepted: PNG `89 50 4E 47`, JPEG `FF D8 FF`, WebP `RIFF....WEBP`.
   - Rejected: SVG (text beginning `<svg` or `<?xml`), GIF, HEIC/HEIF (`ftypheic`, `ftypmif1` and similar), and anything else. Message: "Please export as JPEG or PNG."
   - Note: iOS Safari's file picker converts HEIC to JPEG when `accept="image/png,image/jpeg,image/webp"`.
4. **Animation:** not checked in P0. For an animated PNG or WebP, decoding keeps only the first frame, which is harmless. The help text says "Only the first frame of an animation is used." (v0.4 removed the `animated` reason to save parser code and fixtures.)
5. **Dimensions from the header, before decoding** (PNG IHDR, JPEG SOFn scan, WebP VP8/VP8L/VP8X):
   - short side at least 128 px
   - long side at most 6000 px
   - at most 24 MP
   - aspect ratio between 1:3 and 3:1
6. **Decode:** `createImageBitmap(file, { imageOrientation: "from-image" })`. The fallback is `HTMLImageElement` plus `decode()`, which applies EXIF orientation by default in current browsers. Reason on failure: `decode_failed`.

**Error copy (examples):**
- "This photo is over 8 MB. Try a smaller copy."
- "This one is very tall or very wide. Try cropping closer to {name}."

### 7.4 Normalize, align and store

**Normalize** (P0 runs on the main thread; P1 moves it to a Worker with OffscreenCanvas):
1. Fit the longest side to 512 px.
2. Draw the image on a 512×512 transparent canvas.
3. Re-encode with `toBlob("image/webp", 0.9)`. If the resulting `blob.type !== "image/webp"` (Safari), re-encode as PNG. Re-encoding strips EXIF and GPS data.
4. The original `File` is never stored or kept after this step. Only the normalized 512 px image is saved.

**Align:**
- Scan alpha with `getImageData` and compute the bounding box of pixels with alpha above 16.
- Scale and offset the image so the bottom of the box sits at y = 0.88 × 512 (450 px), centred horizontally (DockCat-style anchor, our own code).
- **Photos with no alpha** (most JPEGs) are shown as a rounded "sticker card": 16 px radius, a 4 px paper border and a soft shadow, standing on the floor line.

**Walk frames:**
- Every frame is padded to the same canvas.
- A warning appears if the bounding-box height varies by more than 10% between frames, or the baseline by more than 3%: "Frames jump a little. Try nudging the baseline."

**Per-image tuner:**
- size 0.6–1.4
- baseline ±24 px, previewed against the floor line
- "Allow mirror" (on by default; turn it off for asymmetric markings)
- **P1:** a 5 fps walk loop preview

**Storage** (`idb-keyval@6.2.1`; the database is `petverse-photos`, the store is `kv`):
- `pack:index` holds a `PackIndex` as JSON.
- `img:<uuid>` holds a `Blob` (WebP or PNG).

**Object URLs:**
- Created once at load, followed by `img.decode()` for each image.
- Revoked when an image is replaced or deleted.
- Walk frames are stacked, pre-decoded `<img>` elements whose visibility is toggled. We never swap `src` per frame.

### 7.5 Per-pose fallback

`resolvePose(slot, index, fillGapsDrawn)`:

1. If the slot has user images, use them.
2. Otherwise, if the user has **any** image and "Fill gaps with drawn pet" is **off** (the default), follow the chain below within the user's own images. The pet never turns into the cartoon partway through a walk.
3. Otherwise, use the drawn placeholder pose.

| Missing slot | Uses | Motion overlay |
|---|---|---|
| talk | the first available of rest, walk, held, transition | none |
| rest | talk | breathe |
| walk | rest, else talk | bob (translateY 0 to −4 px at 2.5 Hz while travelling) |
| held | talk | dangle (rotate ±6° pendulum over 1.2 s, lifted 20 px) |
| transition | rest, else talk | squash (1.06/0.94, then 0.97/1.04, then 1, over 400 ms) |
| eat, happy | talk | squash (happy), dip (eat) |
| play | walk | fast bob |
| sleep | rest | breathe, with eyes dimmed (opacity 0.9) |

Each Moment declares `{slot, motion}`, so it works for photo pets too.

### 7.6 Delete path

**Settings, then Photos, then "Delete my photos":**
- Confirmation: "Delete all {n} photos of {name} from this browser? This can't be undone. Profile, bond and album stay."
- Clears every `img:*` key and `pack:index`, and revokes all object URLs.
- The pet switches to the drawn art, and a toast says "Photos deleted."
- Event: `photos_deleted {count}`.

**Settings, then "Delete all my data":**
- Confirmation: "Delete everything Petverse saved in this browser: profile, corrections, bond, album, photos and the event log? This can't be undone."
- Removes every `localStorage` key starting with `petverse.` plus the legacy key `ai-petverse.preview.profile`.
- Calls `indexedDB.deleteDatabase("petverse-photos")` and revokes all object URLs.
- Returns to Welcome.
- **It never calls `localStorage.clear()`.** On GitHub Pages the origin `tooonnnnyyy.github.io` is shared with the owner's other Pages sites (§14).

**Events never contain filenames, pixels, dimensions or EXIF.** They carry only `{slot, count}` and `{reason}`.

---

## 8. Original placeholder art plan

**Rules:**
- All art is drawn by us as inline SVG React components.
- Nothing is traced from or derived from DockCat or any third-party image.
- No external image files are needed, and the whole set stays under 40 KB of source.

**Canvas:** `viewBox="0 0 512 512"`, with the floor at y = 450 (the 0.88 anchor). Walk poses face right; the renderer mirrors them.

**Style:**
- flat shapes, two or three tones per coat, a soft 6 px ink outline (`--ink` at 85%), and round joints
- it matches the existing paper palette (`--paper`, `--coral`, `--ochre`, `--sage`)

### 8.1 Shared rig (`art/parts.tsx`)

**Named groups,** so CSS can animate them: `body`, `head`, `ear-l`, `ear-r`, `eyes`, `pupils`, `mouth`, `tail`, `paw-fl`, `paw-fr`, `paw-bl`, `paw-br`, `accessory`.

**Coat tokens** (CSS variables on the SVG root): `--coat`, `--coat-shade`, `--belly`, `--ear-inner`, `--eye`, `--nose`.

**Presets:**
- P0: cat ginger and grey; dog tan and black-and-tan. The user picks one in onboarding step 1 (§9.1). "Not sure yet" uses the first preset for the species.
- P1 coat picker: tabby stripes, tuxedo, calico patches, white, black, golden, white-brown. This is a cheap likeness boost for users without photos.

**Idle CSS:**
- blink: `eyes` scaleY 1 → 0.1 → 1 over 120 ms, at random 3–7 s intervals
- tail sway: ±8° around the tail base (dogs wag ±15° when happy)
- breathing: `body` scaleY 1 → 1.015 over 3.5 s, origin at the floor

### 8.2 Poses to draw (cat and dog each)

| Pose | Slot | Cat | Dog | Frames |
|---|---|---|---|---|
| Stand / dialogue | talk | Sitting front-on, tail curled round its paws, head up, mouth group for talking | Sitting front-on, ears down, tongue optional | 1 (+ a mouth-open overlay) |
| Rest A | rest | Loaf (paws tucked) | Sphinx (front paws forward) | 1 |
| Rest B (**P1**) | rest | Curled ball with the tail wrapped round | Curled, nose to tail | 1 |
| Walk | walk | Side view. P0: contact and passing. P1 adds down and up | Same, ears flap on "up" (P1) | 2 in P0, 4 in P1 |
| Held | held | Front view, body stretched tall, back legs dangling, tail hanging | Same, ears flopped outward | 1 |
| Stretch | transition | Play-bow stretch (front low, rear up) | Play-bow | 1 |
| Yawn | transition | Talk pose with a wide-mouth overlay and eyes closed | Same | overlay |

P0 draws 5 poses per species (talk, Rest A, 2 walk frames, held, stretch) plus the yawn overlay. Both species share one rig, with species-specific head, ears and tail parts.

**Derived (no new drawing):**
- happy: talk with `^ ^` eyes and hearts
- slow blink: talk with the eyes closed
- eat: Rest A with the head lowered 18 px towards the bowl
- sleep: Rest A with eyes closed and "z" glyphs (Rest B in P1)
- play: walk frames with a pounce tilt
- belly-up: Rest A rotated, with paws up (a P1 dedicated pose)

**Props** (`art/props.tsx`): bed, bowl, window, cushion (L2), window seat (L4), and the feather wand and rope toy in P0. Lamp (L6), plant and rug (L8) and rain window (L9) come in P1.

**Cosmetics (P1):** scarf (L4) and bow (L7) live in the `accessory` group, drawn pet only. Each has to fit every pose, which is why they wait for P1.

**Review gate:** before P0 ships, render a contact sheet (`?artsheet=1`, dev only) of every pose for both species. The owner approves the style from a local screenshot.

---

## 9. Screens and layout, and which existing bugs get fixed

### 9.1 Screens

**1. Welcome** (replaces the fake email gate):
- Buttons: [Continue with {name}] (shown if a save exists), [Set up my pet], [Meet demo Miso].
- Footnote: "Everything stays in this browser. No account."
- The calm disclaimer.
- **The demo is in memory only** (`isDemo: true`). It never writes a save (fixes bug 2).
  - It shows a "Demo" badge and an "Exit demo" button in the top bar. "Exit demo" returns to Welcome.
  - Every system runs on an in-memory save, so it resets on reload.
  - The 1-min Quick look outing is available. Photos are off (§7.1).
- **Legacy save:** an old `ai-petverse.preview.profile` is migrated (§10.1) only if it differs from the old Miso defaults. The old app pre-filled and auto-saved those defaults, so an unchanged copy is not the user's own data.

**2. Onboarding.** Nothing is pre-filled, every choice has "Not sure yet", and progress comes from `steps.length`.
1. Species, name (1–24 characters after trimming, required) and coat (2 swatches per species, or "Not sure yet").
2. Energy.
3. Comfort style.
4. Little things (optional, skippable): trigger, from sudden noise / strangers / too much energy / none, and favourite activity as free text.
5. Photos (optional, skippable). See §7.1.

**Saving:** it saves only on "Meet {name}". In edit mode it has Cancel, and it logs `profile_completed {mode: "edit"}`.

**3. Room.**
- **Top bar:** the name (or the Demo badge and "Exit demo"), the Bond ring, and buttons for Album, Profile and Settings.
- **Likeness label:** the pet's accessible description, and a small caption in the Profile drawer, say "Drawn stand-in for {name}" for the drawn pet, or "Photo-grounded approximation of {name}" when photos are in use (PRD §6).
- **Stage:** full width with a floor line; at least 360 px tall on desktop and 300 px on mobile.
  - Props: bed, bowl and window, plus any unlocked items.
  - Bounds come from a `ResizeObserver`.
  - Narration line below the stage.
- **Dock** (all targets at least 44 px; sticky at the bottom on mobile, in 2 rows):
  - Feed · Play · Talk · Outing · ⋯ (Take a moment, Put to bed, Lead to bowl)
  - support chips: Come closer · Stay with me · Quiet time
- **Talk box:** an input plus the chat chips, shown under the dock. The dock's Talk button focuses it (and expands it on mobile).
- **Stage cards** (one at a time, per R7): gift, level-up and unlock, welcome, feedback, and invitation or outing offer. The away scene is a stage state.
- **Footer:** "A companion and reflection tool, not healthcare or crisis support. If you might be in danger, contact local emergency services now." Plus links for "Need help now?" and "Pause pet".

**4. Album drawer.** Two tabs in P0, each with a count in the style of "11 of 24":
- Souvenirs (silhouettes until found)
- Postcards
- A Moments tab follows in P1.

It also shows the "Days together" count.

**5. Profile drawer:**
- Facts, each tagged as fact or default.
- **Corrections** in their own list (PRD §4.2), each removable.
- Photos (pack status: "3 photos · 1.2 MB · in this browser") and the likeness label.
- "Does this feel like {name}?" (opens the likeness card, §4.7).
- "Edit profile".

**6. Settings drawer:**
- Calm motion (Auto, On or Off)
- Pause pet
- Invitations (on or off)
- Fill gaps with drawn pet
- Photos (persistence status, Delete my photos)
- Event log: "N events, stays on this device", with [Download JSON] (file `petverse-events-YYYY-MM-DD.json`) and [Clear]
- Delete all my data

**7. Urgent help card.** See §6.8.

**Mobile at 390×844:** the drawers are full-screen sheets, the dock is sticky, and the stage is 300 px tall.

### 9.2 Removed

- the Community view and the publish toggle (behind the flag)
- the "SYNCED" label, and the "only the fields you chose are public" copy
- the hard-coded "T" avatar button
- the camera "Off by default" and gesture callouts, and the "Model signal %" rail
- the profile-completion meter (bug 11)
- the Google Fonts `@import` (system font stacks only; self-hosting the OFL DM Sans is optional in P1)
- the email field

### 9.3 Existing bug status (verified against `c27a244`)

| # | Bug (constraints report) | Status | Action |
|---|---|---|---|
| 1 | Placeholder shows `{profile.name}` | **Fixed in c27a244** | Keep; add it to the browser QA list |
| 2 | Demo overwrites the saved profile | Open | Demo state in memory only (`isDemo`) |
| 3 | Reset doesn't clear data | **Fixed in c27a244** | Replaced by the namespaced "Delete all my data" |
| 4 | Idle timer doesn't restart | **Fixed in c27a244** | Replaced by the engine scheduler (single `endsAt` timeout) |
| 5 | Correction never saved; `correction_added` always false | Open | Correction chips and field visible immediately; saved as `Correction` |
| 6 | Storage write throws; parse unvalidated | **Fixed in c27a244** (`sanitizeProfile`) | Replaced by `parseSave` v2 with field-by-field fallback and migration |
| 7 | One-character names rejected | **Fixed in c27a244** | Keep; covered by a unit test |
| 8 | Mobile progress bar always full | **Fixed in c27a244** | Keep. Still open: the hard-coded "06" and "/6" (App.tsx:383) move to `steps.length` |
| 9 | Substring classifier, no negation | Open | Rewrite (§6.5) |
| 10 | Trigger and correction unused; `hiding` unreachable; "space" text same as "nearby" | Open | `effectiveProfile` drives the hide, approach and settle distances; separate copy for "space" |
| 11 | Completion meter is 100% on prefill | Open | Remove the meter; nothing is pre-filled |
| 12 | `session_started` only on the email path; repeated `profile_completed` | Open | `session_started {entry}` on every path; `profile_completed {mode}` distinguishes edits |
| 13 | Notice only in the companion view; stale notice | Open | One global `LiveRegion` with toasts |
| – | Build tools in `dependencies` | Open | Move vite, typescript and @vitejs/plugin-react to `devDependencies` |
| – | Fonts 8.5–10 px; missing ARIA | Open | At least 14 px body and 16 px bubbles; `aria-pressed`, `aria-current`, `aria-live` |
| – | Docs out of date | Open | PRD:3, HANDOFF:3 and 188–189, PRD §4.1 (no account: local-only static site per owner decision), a web section in the README. Note: the three browser-MVP docs are **untracked** in git; the owner decides whether to commit them |

---

## 10. Module and file plan (`web/src`)

```text
main.tsx
App.tsx                         routing (welcome | onboarding | room) and providers only
copy/en.ts                      every user-facing string (zh in P1); banned-phrase test target
game/config.ts                  PET_TIMING, ECONOMY, LEVEL_NAMES, flags (SHOW_COMMUNITY=false)
game/rng.ts                     mulberry32, weighted picks, seeded shuffle
game/time.ts                    localDayKey, partOfDay, isNight
game/session.ts                 startOrResumeSession (30-min rule), sessionId, visit-day counting
game/bond.ts                    ledger, caps, levels
game/unlocks.ts                 unlock list { id, level, phase }, pendingUnlocks
game/catalog.ts                 places, souvenirs, stories, care moments (ids + copy keys); moments in P1
game/outing.ts                  start, resolveOnLoad, resolveReturn, rewardFor, outingBond
game/album.ts                   nextSouvenir, addReward, counts
game/cards.ts                   R7 card queue: enqueue, next, drop rules
game/feedback.ts                shouldAskLikeness, shouldAskUsefulness
game/moments.ts (P1)            nextMoment
game/invitations.ts             shouldOffer, pickInvitation, recordResponse
pet/types.ts                    PoseSlot, PetCommand, PetState, PetInput, Effect
pet/machine.ts                  initPet, step
pet/reactions.ts                petReaction, landingReaction, overPetting
pet/profile.ts                  PetProfile v2, Correction, effectiveProfile
talk/intent.ts                  interpretIntent, detectUrgent   (replaces policy.ts)
talk/lines.ts                   lineFor
pack/validate.ts                sniffImage, readDimensions
pack/align.ts                   alphaBBox, placement, walkFrameWarnings
pack/resolve.ts                 resolvePose
pack/normalize.ts               normalizeImage (browser only)
pack/store.ts                   idb-keyval store: loadPack, addImage, removeImage, deleteAllPhotos
storage/save.ts                 SaveV2, parseSave, migrateV1, loadSave, writeSave, deleteAllMyData
analytics/events.ts             AnalyticsEvent union, track, ring buffer, exportJson
hooks/useGame.ts                SaveV2 in state, applies Effects, debounced writes, storage-event reload
hooks/usePetEngine.ts           reducer + single endsAt timeout + visibilitychange
hooks/useMotion.ts              rAF loop only while walking/dragging/falling/leaving/fading
hooks/useDrag.ts                pointer capture, 6 px threshold, velocity
hooks/useCalmMotion.ts          OS preference + setting override
hooks/usePack.ts                object URLs, decode, revoke
screens/Welcome.tsx  screens/Onboarding.tsx  screens/Room.tsx
room/Stage.tsx  room/PetSprite.tsx  room/Bubble.tsx  room/Hearts.tsx  room/ActionDock.tsx
room/SupportChips.tsx  room/TalkBox.tsx  room/BondHud.tsx  room/OutingPanel.tsx
room/AwayCard.tsx  room/GiftCard.tsx  room/InvitationCard.tsx  room/FeedbackCard.tsx
room/LevelUpCard.tsx  room/DropZones.tsx
art/parts.tsx  art/cat.tsx  art/dog.tsx  art/props.tsx  art/PlaceholderPet.tsx  art/PhotoPet.tsx
drawers/Drawer.tsx  drawers/AlbumDrawer.tsx  drawers/ProfileDrawer.tsx  drawers/SettingsDrawer.tsx
upload/PhotoPackEditor.tsx (React.lazy)  upload/ConsentStep.tsx  upload/SlotGrid.tsx  upload/ImageTuner.tsx
ui/LiveRegion.tsx  ui/UrgentHelpCard.tsx  ui/Footer.tsx  ui/ConfirmDialog.tsx
```

- **Removed:** `policy.ts` (its tests are ported to `talk/intent.test.ts`), and `types.ts`, which is split into `pet/profile.ts` and `analytics/events.ts`.
- **New runtime dependency:** `idb-keyval@6.2.1` only.
- **New dev dependency:** none in P0; `@playwright/test` in P1.

### 10.1 Core TypeScript signatures

```ts
// game/rng.ts
export type Rng = {
  next(): number;                                   // [0,1)
  int(min: number, maxIncl: number): number;
  range(min: number, max: number): number;          // uniform float
  pick<T>(xs: readonly T[]): T;
  weighted<T>(items: ReadonlyArray<readonly [T, number]>): T;
  state(): number;                                  // to persist into PetState.rngState
};
export function mulberry32(seed: number): Rng;
export function deriveSeed(installSeed: number, label: string): number;   // FNV-1a(label) ^ seed
export function seededShuffle<T>(xs: readonly T[], seed: number): T[];

// game/time.ts
export type PartOfDay = "morning" | "afternoon" | "evening" | "night";
export function localDayKey(ms: number): string;     // "2026-11-10"
export function partOfDay(ms: number): PartOfDay;    // 05–11, 11–17, 17–22, 22–05
export function isNight(ms: number): boolean;        // 22:00–06:00

// pet/profile.ts
export type Species = "cat" | "dog";
export type Energy = "low" | "steady" | "high";
export type ComfortStyle = "close" | "nearby" | "space";
export type Trigger = "sudden_noise" | "strangers" | "too_much_energy" | "none";
export type CoatId = "ginger" | "grey" | "tan" | "blackTan";   // P1 adds more
export type PetProfile = {
  name: string; species: Species;
  energy: Energy | null; comfortStyle: ComfortStyle | null; trigger: Trigger | null;
  favouriteActivity: string;                        // ≤ 40 chars, display and play narration only
  coat: CoatId | null;
};
export type Correction = {
  id: string; at: string;                           // ISO date only
  field: "energy" | "comfortStyle" | "trigger" | "startleHide" | "note";
  value: string;                                    // enum value, "true", or free note text
};
export type Source = "correction" | "fact" | "default";
export type EffectiveProfile = {
  name: string; species: Species; energy: Energy; comfortStyle: ComfortStyle;
  trigger: Trigger; startleHide: boolean;
  sources: Record<"energy" | "comfortStyle" | "trigger" | "startleHide", Source>;
};
/** PRD §6 priority: latest correction per field > profile fact > generic default. Pure. */
export function effectiveProfile(p: PetProfile, c: readonly Correction[]): EffectiveProfile;

// pet/types.ts
export type PoseSlot = "talk" | "rest" | "walk" | "held" | "transition" | "eat" | "play" | "sleep" | "happy";
export type Motion = "none" | "breathe" | "bob" | "dangle" | "squash" | "tilt" | "shiver" | "dip" | "glance";
export type Edge = "left" | "right";
export type DropZone = "bed" | "bowl" | "cushion" | "windowSeat";
export type PetCommand =
  | { kind: "rest"; variant: number; mirror: boolean; ms: number }
  | { kind: "walk"; toX: number; pxPerS: number }            // toX: stage ratio 0..1 (seeded)
  | { kind: "fadeTo"; toX: number }                          // calm-motion replacement for walk
  | { kind: "sit"; ms: number }
  | { kind: "transition"; variant: "stretch" | "yawn" | "shake" | "land" | "startle"; ms: number }
  | { kind: "sleep"; ms: number }
  | { kind: "moment"; id: MomentId; ms: number }             // P1
  | { kind: "petted"; reaction: "purr" | "lean" | "earFlick" | "slowBlink"; hearts: 0 | 1 | 2 | 3 }
  | { kind: "held" } | { kind: "fall" }
  | { kind: "eat"; snack: SnackId; ms: number }
  | { kind: "play"; toy: "wand" | "rope"; ms: number }
  | { kind: "talk"; lineId: LineId; ms: number }
  | { kind: "approach"; pace: "slow" | "normal"; toX: number }
  | { kind: "settle"; distance: "near" | "nearby" | "room"; ms: number }
  | { kind: "hide"; edge: Edge; ms: number }
  | { kind: "decline"; reason: "full" | "tired" | "cooldown"; lineId: LineId }
  | { kind: "outingLeave"; edge: Edge } | { kind: "away" } | { kind: "outingReturn"; edge: Edge }
  | { kind: "gift"; reward: OutingReward }
  | { kind: "hold" };                                        // Pause pet: freeze current pose
export type PetStateName =
  | "rest" | "walk" | "sit" | "transition" | "sleep" | "moment" /* P1 */ | "petted" | "held" | "fall"
  | "eat" | "play" | "talk" | "approach" | "settle" | "hide"
  | "leaving" | "away" | "returning" | "gift" | "paused";
export type PetState = {
  name: PetStateName; cmd: PetCommand; enteredAt: number; endsAt: number | null;
  resume: "rest" | "walk" | "sit" | null;
  x: number;                                   // 0..1, confirmed by renderer via "arrived"
  energy: number; curiosity: number;           // 0..100, simulated
  restsInRow: number; longsSinceMoment: number; lastMomentAt: number; lastRestVariant: number;   // moment fields used in P1
  petTimes: number[]; feedTimes: number[]; playCooldownUntil: number; lastBubbleAt: number;
  lastLineIds: LineId[]; rngState: number;
};
export type PetInput =
  | { t: "tick" }                                   // scheduler: now >= endsAt
  | { t: "arrived"; x: number }                     // renderer finished walk/fade/approach
  | { t: "pet" }
  | { t: "dragStart" } | { t: "dragEnd"; x: number; speedPxS: number; zone: DropZone | null }
  | { t: "dragCancel" }
  | { t: "sendTo"; zone: DropZone }                 // "Put to bed", "Lead to bowl": walk there, no hide roll
  | { t: "feed"; snack: SnackId } | { t: "play" }
  | { t: "talk"; intent: Intent; confidence: number }
  | { t: "support"; intent: "come_closer" | "comfort" | "rest"; source: "chip" | "typed" }
  | { t: "outingStart"; outing: Outing } | { t: "outingEnd"; reward: OutingReward }
  | { t: "giftDismissed" }
  | { t: "careStart"; id: CareMomentId }
  | { t: "setPaused"; on: boolean }
  | { t: "visible"; hiddenMs: number }
  | { t: "urgent" };
export type Ctx = {
  now: number; profile: EffectiveProfile; stageWidthPx: number;
  calm: boolean; unlocked: ReadonlySet<UnlockId>; seenMoments: ReadonlySet<MomentId>;
  gamificationPaused: boolean;                      // true after urgent help in this page load (memory only)
  supportWindowUntil: number;                       // R9 window end (ms); 0 when not in it
  firstPlayDone: boolean;                           // first play of a session skips energy/cooldown checks
  userAnchorX: number;                              // 0..1, §5.1
};
export type Effect =
  | { type: "bond"; source: BondSource; amount?: number }   // amount defaults to ECONOMY[source].bp
  | { type: "momentSeen"; id: MomentId }                    // P1
  | { type: "narrate"; textId: string }
  | { type: "track"; event: AnalyticsEvent };
export function initPet(seed: number, now: number, ctx: Ctx): { state: PetState; commands: PetCommand[] };
/** Pure. Same (state, input, ctx) always yields the same output. */
export function step(s: PetState, i: PetInput, ctx: Ctx): { state: PetState; commands: PetCommand[]; effects: Effect[] };

// pet/reactions.ts
export function petReaction(p: EffectiveProfile, recentPets: readonly number[], now: number, inSupportWindow: boolean, rng: Rng):
  { reaction: "purr" | "lean" | "earFlick" | "slowBlink"; overPetting: null | "hide" | "walkAway" | "slowBlink" | "stay"; delayMs: number };
export function landingReaction(p: EffectiveProfile, speedPxS: number, zone: DropZone | null, inSupportWindow: boolean, rng: Rng):
  { action: "zone" | "hide" | "land"; startle: boolean };

// game/bond.ts
export type BondSource = "pet" | "feed" | "play" | "talk" | "care" | "outing";
export type BondLedger = { total: number; day: string; today: Partial<Record<BondSource, number>>; todayTotal: number };
export function awardBond(l: BondLedger, src: BondSource, amount: number, dayKey: string):
  { ledger: BondLedger; granted: number; levelUp: number | null };   // never lowers total
export const LEVEL_THRESHOLDS = [0, 3, 8, 15, 24, 35, 48, 63, 80, 99] as const;   // L² − 1
export function levelFor(total: number): { level: number; name: string; nextAt: number | null; progress: number };
export function outingBond(plannedMin: number, elapsedMin: number): number;    // floor(min(elapsed, planned) / 5)

// game/unlocks.ts
export type UnlockId = "cushion" | "market" | "windowSeat" | "hills"            // P0
  | "talkSet2" | "scarf" | "lamp" | "bow" | "plantRug" | "rainWindow" | "albumCover";   // P1
export type Unlock = { id: UnlockId; level: number; phase: "P0" | "P1" };
export function pendingUnlocks(level: number, seen: readonly UnlockId[], shipped: readonly Unlock[]): UnlockId[];

// game/session.ts
export type SessionInfo = { sessionId: string; startedAt: number; isNewVisitDay: boolean; visitIndex: number };
export function startOrResumeSession(prev: SessionInfo | null, now: number, hiddenMs: number,
  visits: SaveV2["visits"]): { session: SessionInfo; isNew: boolean; visits: SaveV2["visits"] };   // new after ≥ 30 min hidden

// game/cards.ts
export type CardKind = "gift" | "levelUp" | "unlock" | "welcome" | "feedbackLikeness" | "feedbackUsefulness" | "invitation" | "outingOffer";
export type Card = { kind: CardKind; id: string; enqueuedAt: number };
export type CardQueue = { visible: Card | null; queue: Card[] };
export function enqueue(q: CardQueue, c: Card): CardQueue;          // higher priority replaces visible; replaced goes back to queue
export function dismiss(q: CardQueue, now: number): CardQueue;      // shows next; drops invitations/offers older than 10 s
export function endSession(q: CardQueue): CardQueue;                // drops feedback cards

// game/feedback.ts
export type FeedbackHistory = { likenessAskedAtVisit: number | null; usefulnessLastDay: string | null };
export function shouldAskLikeness(h: FeedbackHistory, visitIndex: number, isFirstSession: boolean,
  interactions: number, hadReturn: boolean, sinceLevelUpMs: number, paused: boolean): boolean;
export function shouldAskUsefulness(h: FeedbackHistory, dayKey: string, trigger: "careDone" | "outing15", paused: boolean): boolean;

// game/outing.ts
export type PlaceId = "garden" | "riverside" | "market" | "hills";
export type Outing = { id: string; place: PlaceId; plannedMin: 1 | 5 | 15 | 25 | 45; startedAt: number; endsAt: number;
  recalledAt: number | null; creditedAt: number | null };
export type OutingReward =
  | { kind: "souvenir"; id: SouvenirId; storyId: StoryId; isNew: true }
  | { kind: "postcard"; place: PlaceId; storyId: StoryId; hint: "longerTrip" | null };
export function startOuting(place: PlaceId, plannedMin: Outing["plannedMin"], now: number, id: string): Outing;
export function resolveOnLoad(o: Outing | null, now: number): "none" | "away" | "returnNow";   // includes the clock guard
export function rewardFor(o: Outing, returnedAt: number, album: AlbumState, installSeed: number): OutingReward;
/** §4.4 return procedure. Pure: returns the next save; a no-op for Bond and album when creditedAt is set. */
export function resolveReturn(s: SaveV2, now: number): { save: SaveV2; reward: OutingReward; bondGranted: number };

// game/album.ts
export type AlbumState = { souvenirs: SouvenirId[]; postcards: StoryId[]; moments: MomentId[];   // moments stays [] in P0
  storyCursor: Record<PlaceId, number>; outingsCompleted: number };
export function nextSouvenir(place: PlaceId, owned: ReadonlySet<SouvenirId>, installSeed: number, elapsedMin: number): SouvenirId | null;
export function addReward(a: AlbumState, r: OutingReward): AlbumState;   // idempotent by id

// game/moments.ts (P1)
export function nextMoment(rng: Rng, host: "rest" | "sit" | "transition" | "sleep" | "petted",
  seen: ReadonlySet<MomentId>, longsSinceMoment: number, sinceLastMs: number, installSeed: number,
  ctx: Pick<Ctx, "unlocked" | "profile">): { id: MomentId; isNew: boolean } | null;   // new one every 6th entry (§4.5)

// game/invitations.ts
export type CareMomentId = "water" | "breaths" | "stretch" | "oneThing";   // P1 adds "lookAway" and three more
export type InviteHistory = { lastShown: CareMomentId[]; notNowStreak: number; skipSessions: number };
export type OfferContext = { sessionMs: number; petState: PetStateName; outingActive: boolean;
  sinceBubbleMs: number; sinceTypingMs: number; enabled: boolean; promptUsed: boolean;
  gamificationPaused: boolean; inSupportWindow: boolean; history: InviteHistory };
export function shouldOffer(c: OfferContext): boolean;
export function pickInvitation(rng: Rng, part: PartOfDay, h: InviteHistory): CareMomentId;
export function recordResponse(h: InviteHistory, id: CareMomentId, r: "done" | "notNow" | "expired"): InviteHistory;
export function startSession(h: InviteHistory): { history: InviteHistory; allowOffers: boolean };  // consumes skipSessions

// talk/intent.ts
export type Intent = "come_closer" | "comfort" | "play" | "rest" | "greet" | "day" | "goodnight" | "no_match";
export type IntentResult = { intent: Intent; confidence: number; source: "rules-v2"; evidence: string[]; alternatives: Intent[] };
export function interpretIntent(text: string): IntentResult;
export function detectUrgent(text: string): boolean;
// talk/lines.ts
export type LineSet = Intent | "decline_full" | "decline_tired" | "decline_cooldown" | "greeting" | "idle" | "homeStory";
export function lineFor(set: LineSet, p: EffectiveProfile, part: PartOfDay,
  rng: Rng, recent: readonly LineId[]): LineId;   // P0: one voice; P1 picks the voice from p.energy

// pack/validate.ts
export type RejectReason = "pack_full" | "too_big_bytes" | "type_svg" | "type_gif" | "type_heic" | "type_unknown"
  | "too_small" | "too_large_dims" | "too_many_pixels" | "aspect" | "decode_failed";
export type ImageCheck =
  | { ok: true; type: "png" | "jpeg" | "webp"; width: number; height: number }
  | { ok: false; reason: RejectReason };
export function sniffImage(head: Uint8Array, byteLength: number): ImageCheck;   // head = first 64 KB
export function readDimensions(head: Uint8Array, type: "png" | "jpeg" | "webp"): { w: number; h: number } | null;
// pack/align.ts
export type BBox = { x: number; y: number; w: number; h: number };
export function alphaBBox(px: Uint8ClampedArray, w: number, h: number, threshold?: number): BBox | null;  // null = opaque
export function placement(b: BBox | null, canvas?: number, anchorY?: number): { scale: number; dx: number; dy: number; sticker: boolean };
export function walkFrameWarnings(boxes: readonly BBox[]): Array<"height" | "baseline">;
// pack/resolve.ts
export type PackImageMeta = { id: string; slot: PoseSlot; order: number; width: number; height: number;
  bbox: BBox | null; hasAlpha: boolean; allowMirror: boolean; scale: number; offsetY: number; bytes: number };
export type PackIndex = { schemaVersion: 1; facing: "left" | "right"; walkFps: number; images: PackImageMeta[] };
export type ResolvedPose = { source: "user" | "placeholder"; slot: PoseSlot; imageIds: string[]; motion: Motion };
export function resolvePose(slot: PoseSlot, idx: PackIndex | null, fillGapsDrawn: boolean): ResolvedPose;
// pack/normalize.ts (browser only; exercised in browser QA)
export function normalizeImage(file: File, check: Extract<ImageCheck, { ok: true }>):
  Promise<{ blob: Blob; width: number; height: number; bbox: BBox | null; hasAlpha: boolean }>;
// pack/store.ts
export function loadPack(): Promise<{ index: PackIndex; blobs: Map<string, Blob> } | null>;
export function addImage(meta: PackImageMeta, blob: Blob): Promise<void>;
export function updateMeta(id: string, patch: Partial<PackImageMeta>): Promise<void>;
export function removeImage(id: string): Promise<void>;
export function deleteAllPhotos(): Promise<number>;

// storage/save.ts
export const SAVE_KEY = "petverse.save.v2";
export const EVENTS_KEY = "petverse.events.v1";
export const LEGACY_PROFILE_KEY = "ai-petverse.preview.profile";
export type Settings = { calmMotion: "auto" | "on" | "off"; paused: boolean; invitations: boolean; fillGapsDrawn: boolean };
export type SaveV2 = {
  v: 2; installSeed: number;
  profile: PetProfile | null; corrections: Correction[];
  bond: BondLedger; album: AlbumState; outing: Outing | null; pendingGift: OutingReward | null;
  invites: InviteHistory; unlocksSeen: UnlockId[]; feedback: FeedbackHistory; settings: Settings;
  visits: { days: number; lastDay: string };
  flags: { welcomeSeen: boolean };
};
export function parseSave(raw: unknown): SaveV2;          // never throws; invalid fields fall back one by one
/** Returns null when the legacy profile equals the old Miso defaults (pre-filled, not user data). */
export function migrateV1(legacyProfile: unknown): Pick<SaveV2, "profile" | "corrections"> | null;
export function loadSave(): SaveV2;                       // try/catch around storage access
export function writeSave(s: SaveV2): boolean;            // false when storage blocked/full; app keeps running
export function deleteAllMyData(): Promise<void>;         // petverse.* keys + legacy key + IDB db; never clear()

// analytics/events.ts
export type AnalyticsEvent = { name: EventName; props: Record<string, string | number | boolean> };
export function track(e: AnalyticsEvent, meta: { sessionId: string; isDemo: boolean; sessionStart: number }): void;
export function readLog(): StoredEvent[];   export function exportJson(): Blob;   export function clearLog(): void;
```

### 10.2 Scheduler and renderer contract

- **`usePetEngine`** holds `PetState` and runs **one** `setTimeout` for `endsAt − now`. On timeout it dispatches `tick`. It dispatches `arrived` when `useMotion` reports arrival, and handles `visibilitychange` (it clears the timer while hidden and dispatches `visible` on return).
- **`PetSprite`** is a `<button>`.
  - It moves with `translate3d(xPx, 0, 0)` and flips facing in an inner element with `scaleX(-1)`, using `transform-origin: 50% 88%`.
  - Pose changes crossfade over 120 ms between two stacked layers.
  - `will-change: transform` is set only while the pet is moving.
- **`useMotion`** runs `requestAnimationFrame` only while walking, approaching, chasing, dragging, falling, leaving, returning or fading.
  - It moves by elapsed time (px/s) and advances walk frames on accumulated time.
  - It reports arrival.
- **`useGame`** owns `SaveV2` and applies the machine's `Effect`s (Bond, narration, events).
  - `PetState` is never saved. Only `SaveV2` is, so the pet starts fresh on every load (R2). An outing is the exception, through `SaveV2.outing`.
  - It writes the save 250 ms after the last change (debounced), and at once on `pagehide` and on `visibilitychange` to hidden. Outing start, the return procedure (§4.4) and deletes are written at once.
  - If `writeSave` returns false, the app keeps running and shows the toast "Saving is off in this window" once.
- **Two tabs (P0):** on a `storage` event for `SAVE_KEY`, `useGame` re-reads and adopts the other tab's save.
  - This tab's unsaved changes from the last 250 ms may be lost. Nothing is ever paid twice, because Bond only goes up, `addReward` is idempotent and `creditedAt` is checked.
  - P1 replaces this with a single-engine lock (§15).

---

## 11. Accessibility

- **Pet button:**
  - Its accessible name carries the state, for example "Miso, resting. Press Enter to pet. Arrow keys to move."
  - Focus is visible: a 3 px ring with AA contrast.
- **No drag required (WCAG 2.5.7):** keyboard move mode, "Put to bed" and "Lead to bowl" in the dock, and every action is a visible button.
- **One `aria-live="polite"` region** (`ui/LiveRegion.tsx`) announces:
  - bubbles
  - the results of the user's own actions
  - outing leave and return
  - level-ups and unlocks (and new moments in P1)

  Autonomous walks and idle changes are **not** announced. The urgent-help card uses `role="alertdialog"` and keeps focus inside it until it is dismissed.
- **Pause pet (WCAG 2.2.2):** always reachable in the footer and in Settings.
- **Reduced motion (WCAG 2.3.3):** "Calm motion" defaults to Auto and follows `prefers-reduced-motion`; On and Off override it in either direction. **The pet stays visible.**
- **Targets:** at least 44×44 px for dock buttons, chips and drop zones.
- **Text:** at least 14 px for body text and 16 px for bubbles. Contrast is AA at least, checked for `--ink-soft` on `--paper`.
- **Semantics:**
  - option cards use `role="radiogroup"` with `aria-checked`
  - toggles use `aria-pressed`
  - drawer tabs use `aria-selected`
  - the current view uses `aria-current`
  - drawers are focus-trapped and close with Esc
- **No sound by default, nothing flashing** (no more than 3 flashes per second), and no autoplaying media.
- **Language:** `lang="en"`. In P1 the Chinese strings switch `lang="zh-CN"` on the root.

---

## 12. Analytics events (local only, never sent)

**Storage:**
- A ring buffer of 500 events in `localStorage` under `petverse.events.v1`.
- Each event is stored as `{ name, t, sessionId, isDemo, sinceStartBucket, props }`.
  - `t` is rounded to the minute.
  - `sessionId` comes from `crypto.randomUUID()` and is generated per session. It is not persisted as a user id.
  - `sinceStartBucket` is one of `<10s`, `<30s`, `<2m`, `<10m` or `10m+`.
- Settings can export or clear the buffer.
- `pet_interaction` events of kind `pet` or `drag` are logged at most 30 times per session, so heavy tapping cannot push the feedback and support events out of the 500-event buffer. Feed, play and talk are always logged.

**How the owner gets evidence:** events are never sent anywhere. Testers press [Download JSON] in Settings and send the file to the owner themselves, if they choose to. The file holds no names or typed text. Any remote collection is P2 and needs a privacy review and the owner's approval.

**What events never contain:** typed text, names, filenames, pixels, image dimensions, emails, or anything about the urgent-help card (§6.8).

| Area | Event `{props}` |
|---|---|
| Session and profile | `session_started {entry: "continue" \| "setup" \| "demo" \| "resume", partOfDay}`; `profile_started {mode: "custom" \| "edit"}`; `profile_completed {mode: "custom" \| "edit", species, answered: 0–4, hasPhotos}`; `correction_submitted {field}` |
| Interaction | `pet_interaction {kind: "pet" \| "drag" \| "feed" \| "play" \| "talk", source: "button" \| "typed" \| "pointer" \| "keyboard", outcome: "normal" \| "delayed" \| "ignored" \| "declined" \| "hid" \| "zone"}` (kinds pet and drag: at most 30 per session); `support_action_used {intent, source: "chip" \| "typed", confBucket: "high" \| "low"}`; `intent_fallback {}`. **No urgent-help event** (§6.8) |
| Care | `invitation_shown {id}`; `invitation_responded {id, response: "done" \| "notNow" \| "expired"}` |
| Outings and progress | `outing_started {place, plannedMin}`; `outing_returned {plannedMin, elapsedBucket, recalled, reward: "souvenir" \| "postcard"}`; `bond_level_up {level}`; `album_opened {tab}`; `moment_seen {id}` (P1) |
| Feedback | `likeness_feedback_submitted {value: "yes" \| "partly" \| "no", correction_added}`; `usefulness_submitted {value: "pause" \| "start" \| "continue" \| "reset" \| "none"}` |
| Photos | `photo_consent_given {}`; `photo_slot_filled {slot, count}`; `photo_rejected {reason}`; `photos_deleted {count}` |
| Settings and data | `setting_changed {key, value}`; `data_deleted {scope: "photos" \| "all"}`; `events_exported {}` |

**PRD §10 coverage:**

| Metric | Measured by |
|---|---|
| Onboarding completion | `profile_started` → `profile_completed` |
| Time to first response | `sinceStartBucket` on the first `support_action_used` or `pet_interaction` |
| Typed vs chip input | `source` |
| % of sessions reaching a support action | `support_action_used`, or `pet_interaction` with `kind: "play"` (PRD counts "Let's play", §6.6). The chip-only rate is reported on its own, because Play earns BP |
| Fallback rate | `intent_fallback` / typed |
| Likeness and usefulness distributions | the two feedback events |
| Correction frequency | `correction_submitted` |

**Invitation tuning:** if more than 60% of `invitation_responded` events are `notNow`, lower the offer rate in the next release. None of these numbers is a clinical or causal claim.

---

## 13. Test plan

### 13.1 Unit tests (vitest, fixed seeds, no DOM)

| Module | Assertions |
|---|---|
| `rng` | The same seed gives the same sequence. `weighted` over 10,000 draws (seed 42) lands within ±3% of each weight. `seededShuffle` is a permutation and stable per seed |
| `machine` | Rest-exit distribution over 10,000 steps matches the §5.1 weights after the energy, curiosity and night factors (±3%). A transition is inserted at about 1/3 (±3%). Startup always begins with a transition, followed by a walk. Sleep happens after 3 quiet rests (2 at night). Walk targets are at least 15% of the width away and inside the 16 px margins. The seed-7 idle run of 10 simulated minutes contains rest, walk, sit and transition |
| `machine` (priority and cooldowns) | `dragStart` during walk, sleep, eat and play is accepted. `dragStart` during leaving, away and returning is ignored. Play during cooldown gives `decline cooldown`. A 3rd feed in 20 min gives `decline full`. Energy below 25 gives `decline tired`. The first play of a session is accepted even at energy 10. A tap during sleep gives a yawn and 0 hearts. Inside the R9 window: no hide, no walk-away, and declines become a settle. The urgent input pauses gamification effects. `sendTo` walks to the zone with no hide roll |
| `machine` (replay) | A recorded sequence of 200 inputs with seed 7 produces a snapshot-identical command list (golden file) |
| `reactions` | Comfort-style odds within ±3% over 10,000 draws. Over-petting thresholds (4, or 3 with the trigger). Mapping: space → hide, nearby → walkAway, close → slowBlink; inside the R9 window → earFlick for all. Landing hide chance is .5/.15/0, with +.3 for speed above 1500 px/s, +.2 more for the "sudden noise" trigger on a fast release, and +.3 for `startleHide`, capped at .9 |
| `profile` | A correction beats a fact, which beats the default. The latest correction per field wins. Removing a correction falls back. A `note` changes no behaviour field. "More energetic" on an effective `high` is a no-op |
| `bond` | Every per-source cap and the 20 total per visit are enforced. Caps reset when the day key changes. `total` never decreases. Level thresholds are 0, 3, 8, 15, 24, 35, 48, 63, 80, 99. Feed, Play and "Hi" from 0 BP reach L2. `outingBond` gives 5→1, 15→3, 25→5, 45→9; a recall at 12 min gives 2; a recall at 2 min gives 0; the Quick look outing gives 0 |
| `outing` | `resolveOnLoad` covers before end, after end, null and the clock moved back. Elapsed time is clamped to planned. Below 15 min gives a postcard. 15 min or more gives the first unowned item in seeded order. The keepsake needs all 5 everyday items owned and at least 25 min. **No duplicates across 100 simulated outings.** All 24 items are owned within a bounded number of outings. `addReward` is idempotent. `resolveReturn` run twice on the same save credits Bond and the album once |
| `unlocks` | `pendingUnlocks` returns reached-but-unseen ids only. A P1 unlock below the current level appears once after P1 ships. In P0, L6–L10 return nothing |
| `cards` | Priority order (R7). A higher card replaces the visible one and the replaced one returns to the queue. Invitations and offers older than 10 s are dropped. `endSession` drops feedback cards. Gift and level-up cards are never dropped |
| `feedback` | Likeness: asked in the first session after the 3rd interaction or the first return; then not again until 3 visit days later; never within 10 s of a level-up; never while paused. Usefulness: at most once per visit day. A dismissal counts as asked |
| `session` | A new session starts on load and after ≥ 30 min hidden, not after 29 min. A new local day increments `visits.days` once |
| `invitations` | Each `shouldOffer` precondition blocks on its own, including the R9 window. One prompt per session, shared with the outing offer. 2 "Not now" sessions in a row skip the next 2 sessions. Never one of the last 3. Time-of-day weights apply. No stand-up after 21:00 (P1) |
| `intent` | Ported tests from `policy.test.ts`. False positives: "display", "function", "breakfast", "interest", "forest", "disclose", "closed" all give no_match. "I have no energy" is not play. "I don't want to play" is not play. "不想玩" is not play. "come here" gives come_closer. "我好累" gives rest. "陪陪我" gives comfort. A multi-intent sentence gives confidence 0.6 with alternatives |
| `urgent` | Every listed English and Chinese phrase is detected. Negative controls such as "kill time", "dead tired", "this bug is killing me" and "I'm dying to play" are listed with expected outputs and are reviewed by the owner. Being sensitive, they may trigger; the test documents the choice |
| `validate` | Byte fixtures **generated in test code** (never real photos): PNG, JPEG (SOF0 and SOF2), WebP (VP8, VP8L, VP8X), SVG, GIF, HEIC `ftyp`, truncated files, 127 px, 6001 px, 25 MP, 1:4 aspect |
| `align` | `alphaBBox` on synthetic pixel arrays, including a fully opaque one (returns null). `placement` puts the bbox bottom at 450 on a 512 canvas. `walkFrameWarnings` thresholds of 10% for height and 3% for baseline |
| `resolve` | Every row of the §7.5 chain. Single-photo mode resolves every slot to that one image. `fillGapsDrawn` toggles to the placeholder. With no pack, everything is placeholder |
| `save` | Corrupt JSON, wrong types, missing fields, a future version number and `null` all give a valid `SaveV2`. A v1 legacy profile migrates, including the trigger string mapping and correction to note. A legacy profile equal to the old Miso defaults returns null. A throwing storage accessor is handled. `deleteAllMyData` removes only `petverse.*` and the legacy key; a foreign key in the mocked storage survives |
| `copy` lint | Every string in `copy/en.ts` fails the test if it matches the banned list: `/misses you\|miss you\|lonely\|sad because\|hungry\|starving\|streak\|don't forget\|come back soon\|waiting for you\|last chance\|hurry up\|don't leave\|you seem\|you feel\|you look (sad\|stressed\|anxious)\|I can tell you\|you scared\|because of you\|exact (copy\|replica\|twin)\|cure\|therapy\|treat(s\|ment) (anxiety\|depression)/i`. Greeting templates contain no duration variables. `copy/zh.ts` (P1) gets its own list |
| `moments` (P1) | A new moment exactly on every 6th long-state entry while unseen ones remain. Replays only of seen moments otherwise. At most one per 60 s. Level gates hold (bellyUp needs L7, windowWatch needs L4) |
| No-network guard | A test greps `src/**` for `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` and `EventSource`, and fails on any match. Only an allow-listed `// network-ok` comment is permitted, and P0 allow-lists nothing |

### 13.2 Browser QA (manual in P0, Playwright in P1)

Run on Chrome desktop at 1440×900 and mobile at 390×844 (Chrome emulation, plus iOS Safari on the owner's phone).

- Every flow: Welcome (all 3 paths, plus "Exit demo"), onboarding with skips, pet, drag onto each drop zone, keyboard move, "Put to bed", Feed, Play, Talk (chips and typed), support chips, a 1-min Quick look outing (`?quick=1`), a reload during the outing, call back, the gift, the album, feedback and the correction chip effect, invitation accept and not-now, and the urgent card through typed text (also while the pet is out) and through the link.
- First-session pacing with a stopwatch: from the Room opening, Feed, Play and "Hi" show the L2 card in under 60 s.
- Two tabs open: earn Bond in one, then check that the other adopts it and nothing is paid twice.
- Legacy save: a hand-made `ai-petverse.preview.profile` with custom values migrates; one with the old Miso defaults does not.
- After the urgent card: no BP is shown, and no cards or prompts appear. Then check the event export: nothing about the card is in it.
- Photos:
  - one opaque JPEG (sticker mode)
  - one transparent PNG
  - a 2-frame walk
  - a 12 MP phone photo (memory stays reasonable)
  - an HEIC picked on iPhone (auto-converted)
  - an SVG and a GIF (both rejected inline)
  - Firefox: the persistent-storage prompt appears once after consent
  - the demo pet: the photo entry points are off
  - Delete my photos
- Delete all my data: then confirm in DevTools that no `petverse.*` keys and no `petverse-photos` database remain.
- Reduced motion emulated: the pet is visible, there is no walking, and changes fade. Pause pet works. A keyboard-only pass. A VoiceOver spot check of the pet button, live region and urgent card.
- Storage blocked (Safari private, or DevTools blocking): the app runs and shows a toast "Saving is off in this window."
- Hidden tab for 2 min: no CPU use, and the pet yawns on return.
- Performance: no `requestAnimationFrame` while idle; less than 1 ms of JavaScript per frame while walking (Performance panel); the initial JS is at most 150 KB gzipped, and the upload chunk is lazy.
- Production build preview at the `./` base, served from a sub-path (`npx vite preview --base /ai-petverse/`, or a static server in a subfolder). The console shows no CSP violations, and the lazy upload chunk loads under `connect-src 'none'`.

### 13.3 Checks recorded per change (development plan §8)

`npm run typecheck` · `npm test` · `npm run build` · the browser QA items touched, recorded with their exact results in the PR description.

---

## 14. Deployment plan: GitHub Pages via Actions (**requires owner approval**)

**Target:** the public repo `Tooonnnnyyy/ai-petverse`, served at `https://tooonnnnyyy.github.io/ai-petverse/`.

**Allowed on the branch without approval** (code only; nothing runs remotely until gate G1):

1. `web/vite.config.ts`: set `base: "./"`.
   - Why: there is no router and no deep links, so relative asset URLs work at `/ai-petverse/`, at a future custom domain, and in `vite preview` without per-host configuration.
   - Worker URLs built with `new URL("./x.ts", import.meta.url)` (P1) also resolve relative to the module.
   - Also set `build.modulePreload: { polyfill: false }`. The polyfill preloads with `fetch()`, which the CSP below blocks. Every target browser supports `modulepreload` natively.
2. A favicon (`web/public/favicon.svg`, our own art), `<html lang>`, and OG tags.
   - `og:title` and `og:description` are plain text.
   - `og:image` must be an **absolute** URL, because link previews ignore relative ones. The build plugin writes it from `VITE_SITE_URL` (default `https://tooonnnnyyy.github.io/ai-petverse/`). Without an image, leave the tag out.
   - The build plugin also writes `<meta name="build-sha">` from `VITE_BUILD_SHA` (the workflow passes `github.sha`; locally it is "dev").
3. A production-only Content Security Policy injected as a `<meta>` tag by a small `transformIndexHtml` plugin. It is enforced only at build time, so it does not break Vite's dev HMR:
   ```text
   default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
   img-src 'self' blob: data:; worker-src 'self' blob:; connect-src 'none';
   font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'
   ```
   - `connect-src 'none'` enforces the "never uploaded" promise in the browser itself. Nothing in P0 needs a network connection. v0.3 used `'self'`, which still allowed requests to the shared `github.io` origin.
   - If browser QA finds a break, fall back to `'self'` and record why.
   - `'unsafe-inline'` for styles is needed for React `style` attributes (transforms).
   - Links (the help link) are navigation, which this CSP does not restrict.
4. `.github/workflows/deploy-web.yml`, with **`workflow_dispatch` only** (no automatic trigger until the owner asks for one):
   ```yaml
   name: Deploy web to GitHub Pages
   on: { workflow_dispatch: {} }
   permissions: { contents: read, pages: write, id-token: write }
   concurrency: { group: pages, cancel-in-progress: true }
   jobs:
     build:
       runs-on: ubuntu-latest
       defaults: { run: { working-directory: web } }
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 22, cache: npm, cache-dependency-path: web/package-lock.json }
         - run: npm ci
         - run: npm run typecheck && npm test && npm run build
           env: { VITE_BUILD_SHA: "${{ github.sha }}" }
         - uses: actions/configure-pages@v5
         - uses: actions/upload-pages-artifact@v3
           with: { path: web/dist }
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
       steps:
         - id: d
           uses: actions/deploy-pages@v4
   ```
   Pin to the current major versions at implementation time.
5. `.github/workflows/web-ci.yml`: runs `npm ci`, typecheck, test and build on `pull_request` and on pushes to `main`, filtered to `paths: ["web/**"]`.
   - It has no deploy step, no secrets and `contents: read` only.
   - It gives G2 a real web check. The existing `ios.yml` runs on every PR to `main` and checks nothing in `web/`.
   - Open question: add `paths-ignore: ["web/**", "docs/**"]` to `ios.yml`, so that a web-only PR does not wait on a macOS iOS build while iOS is paused. Default: yes, in the same PR, called out in its description.

**Needs the owner's explicit words, one gate at a time:**

| Gate | Owner says | Who acts |
|---|---|---|
| G1 | "push to repo" | Claude pushes `feat/web-pet-gamification` and opens a PR |
| G2 | "merge to main" | Claude merges after the checks pass (`web-ci` at least) |
| G3 | Enable Pages | **Owner** sets Settings → Pages → Source: "GitHub Actions" (a repository setting, done by the owner) |
| G4 | "deploy" | Claude or the owner runs the workflow (`gh workflow run deploy-web.yml`) |
| G5 | – | Claude verifies the live URL: content, the commit SHA in a `<meta name="build-sha">` tag, CSP present, no network calls in DevTools. Results are recorded per development plan §8 ("a deployment log is not proof that the live product changed") |

**Public-repo and origin cautions:**

- **Never commit real pet photos or fixtures.** Test images are generated in code. Add `*.heic`, `*.HEIC`, `photos/` and `pose-packs/` to `.gitignore`.
- **Shared origin:** `tooonnnnyyy.github.io` is shared by every Pages project site of the owner. Petverse therefore namespaces its storage (`petverse.*`, `petverse-photos`), and "Delete all" never clears the whole origin. A custom domain later isolates the origin (P2, owner decision).
- **No analytics, cookies or third-party requests.** The Google Fonts import is removed.

---

## 15. Phased build order

### P0: must ship (about 5 focused days, 1 engineer)

v0.3's 4-day table packed about 8 days of work into 4: 20 states, 2 × 9 drawn poses, 9 photo slots, 63 lines, 32 stories, 12 moments and 5 care moments. v0.4 trims the content and states the real estimate. Pure logic comes first because it is the fastest to write from this spec and the most testable.

| Day | Scope | Exit check |
|---|---|---|
| 1 | **Pure logic and tests:** `game/config`, `rng`, `time`, `session`, `bond`, `unlocks`, `outing` (incl. `resolveReturn`), `album`, `catalog` ids, `cards`, `feedback`, `invitations`, `pet/profile` (`effectiveProfile`), `storage/save` (v2, migration, `deleteAllMyData`), `talk/intent` (rewrite) and `detectUrgent` | All §13.1 tables green for these modules |
| 2 | **Pet engine:** `pet/machine`, `pet/reactions` with replay tests; `usePetEngine`, `useMotion`, `useDrag`, `useGame`; `Stage`, `PetSprite` (a temporary blob shape), drop zones, keyboard move, `sendTo`; Feed, Play (wand chase), Talk box, chat chips, support chips, bubbles, hearts and narration with P0 `lines` (about 40) | Seeded replay green; the pet lives, walks, is petted, dragged, fed and played with |
| 3 | **Art and progress UI:** the drawn cat and dog (5 poses each on one shared rig, §8.2), props (bed, bowl, window, cushion, window seat, wand, rope), `?artsheet=1` contact sheet sent to the owner; BondHud, LevelUp and unlock cards, OutingPanel, AwayCard, GiftCard, AlbumDrawer (2 tabs), days together; catalog copy (24 souvenirs, 16 stories) | An outing survives a reload; the first-session L2 path works; the owner has the contact sheet |
| 4 | **Photo pack:** ConsentStep, SlotGrid (5 slots), `validate`, `align`, `normalize` (main thread), `store` (idb-keyval), `resolve`, ImageTuner (size, baseline, mirror, walk facing, Move up/down), walk-frame warnings, Delete my photos, persistence status | Single-photo mode end to end; rejects are shown inline; delete works |
| 5 | **Screens, safety and ship prep:** Welcome (incl. legacy migration, "Exit demo"), Onboarding v2, Profile and Settings drawers, corrections UI, FeedbackCard, InvitationCard (4 care moments, back-off, "Take a moment"), UrgentHelpCard, LiveRegion, footer disclaimer, calm motion and pause, a11y pass, `analytics/events` with export, CSP plugin, `base: "./"`, both workflow files (not run), devDependencies cleanup, Google Fonts removed, doc updates, full browser QA | All §16 acceptance criteria pass locally |

**Cut line if the build slips.** Cut in this order. Each cut keeps a coherent first public URL:
1. Hills and its 6 souvenirs. L5 then shows the level name only (§4.3), and Hills moves to P1.
2. Care moments down to `breaths` and `oneThing`.
3. The ImageTuner down to the baseline nudge only (no size or mirror controls).
4. Walk-frame warnings.
5. The dog becomes a recolour of the cat rig with dog ears and tail. Draw dog-specific poses in P1.

These are never cut: the urgent card, the disclaimer, delete paths, the likeness and correction loop, the demo label, typed input, and the photo consent and delete flow.

### P1: soon after launch (about 3–4 days; aim for within a week of launch, though nothing forces it, §4.3)

- **Unlock content:** L6–L10 (lamp, bow, plant, rug, rain window, album cover), the scarf for L4 and talk line set 2 for L2 (granted retroactively, §4.3), and the dedicated belly-up pose.
- **Moments album:** 12 moments with deterministic discovery (§4.5), the Moments tab and toast, and `moment_seen`.
- **Outing extras:** packing (snack plus toy changes the story tone and doodle only), the midpoint postcard, 8 stories per place, and 4 more care moments (look away, stand up, tidy one thing, 5-min outing).
- **Small delights:** firsts stickers (8: boop, carry, snack, game, chat, outing, photo, level-up), the snack quirk, bongo paws, long-press slow blink, and catches during play.
- **Content and look:** Rest B and 4-frame walks for the drawn pets, the soft and bouncy voices, Moments growing to 20 (sneeze, kneading or a dog variant, zoomies, nap pile, hide-and-peek, cushion loaf, proud gift, welcome trot), a coat colour picker for the drawn pet, and original SVG souvenir stamps (replacing emoji).
- **Photo tooling:** the optional extra slots (eat, play, sleep, happy), drag-to-reorder walk frames, the Web Worker with OffscreenCanvas for normalization, and the walk-loop preview.
- **Robustness:** a single-engine lock across tabs (`navigator.locks`, so a second tab shows "Petverse is open in another tab") and a "Show numbers" toggle.
- **Chinese UI** (`copy/zh.ts`, `lang` switch) and a Playwright smoke test (reduced motion, the outing reload, delete-all).

### P2: later (each needs an owner decision)

- PWA and offline use
- optional sound
- opt-in reminders (water or stretch at a user-set interval, one bubble, no consequence)
- an opt-in "playful mode" with tiny mischief that never blocks the UI
- multiple pets
- a custom domain
- backup export and import (a local zip)
- on-device background removal
- cosmetics on photo pets
- the Chrome extension (PRD P0.5)
- opt-in remote analytics, which needs a privacy review, a backend and owner approval

---

## 16. Acceptance criteria (P0)

1. **Alive:**
   - The pet walks within about 3 s of the Room opening.
   - In the seeded 10-minute idle simulation (§13.1), the pet shows rest, walk, sit and transition states, with timings inside the §5.1 ranges. A live 10-minute check usually shows all four too, but it is random, so the seeded run is the criterion.
   - With the tab hidden, there is no `requestAnimationFrame` and no tick.
2. **Profile-true** (outside the R9 window):
   - With comfort style "space", 4 taps in 8 s always lead to hide.
   - With "close", the same leads to a slow blink where the pet is.
   - Adding the "Likes space" correction to a "close" profile changes this behaviour immediately, and the Profile drawer lists that correction separately.
3. **Bounded reactions:** about 10% of taps (25% for "space") give an ear-flick with no hearts and no BP. About 15% of reactions are delayed by 300–900 ms. Drags are never delayed.
4. **Drag:** the pet can be picked up from every non-outing state and dropped on the bed (it sleeps) or the bowl (it eats). Keyboard move and "Put to bed" work without a pointer.
5. **Feed and play:** a 3rd feed within 20 minutes is politely declined. Play during the 45 s cooldown, or with energy below 25, gives "later?" (never for the first play of a session, and never inside the R9 window). Neither awards BP when declined.
6. **Talk:** "I don't want to play", "不想玩", "display" and "breakfast" do not trigger play. "我好累" gives rest. Typed text appears in no stored data (inspect localStorage and the event export).
7. **Urgent help:**
   - "I want to end my life" shows the urgent card, including while the pet is out.
   - After that, for the rest of the page load, no BP is shown and no card, invitation or feedback prompt appears.
   - Nothing about the card is in storage or the event export.
   - The footer link opens the same card.
8. **Outing:**
   - A 1-min Quick look outing (`?quick=1`) can be started, reloaded mid-way, and returns with a gift. The gift waits if the tab was closed.
   - Reloading after the return but before dismissing the gift does not credit Bond or the album twice.
   - Calling back a 15-min outing at minute 12 gives a postcard and 2 BP, with no penalty copy.
   - A completed 15-min outing gives an unowned souvenir.
9. **No duplicates:** 30 scripted outings of 25 minutes or more (simulated clock) never produce a duplicate souvenir.
10. **Bond:**
    - Daily caps hold: taps reach at most 5 BP, and the total at most 20 per visit.
    - Levels follow 0/3/8/15/24/35/48/63/80/99.
    - In a first session, Feed, Play and "Hi" alone reach L2 (cushion), with no luck involved.
    - No action ever lowers the total.
    - Reaching L6+ in P0 shows the level name only, with no "coming soon" copy.
11. **One prompt:** at most one unprompted prompt (invitation or outing offer) per session, and none inside the R9 window. Back-off works across sessions. An unanswered invitation disappears after 60 s with no trace in the UI. "Did it" is enabled only after the care moment's minimum length.
12. **Feedback:**
    - The likeness card appears in the first session (after the 3rd interaction or the first return), and after that at most once every 3 visit days. The correction chips and field are visible immediately. The Profile drawer can open it at any time.
    - The usefulness question appears at most once per visit day, after a care moment or an outing of 15 minutes or more.
    - Neither awards BP.
13. **Photos, happy path:** a single photo replaces the drawn pet in every state with motion overlays and never falls back to the cartoon, unless "Fill gaps" is on. A transparent PNG is aligned to the floor. An opaque JPEG shows as a sticker card. The likeness label reads "Photo-grounded approximation of {name}".
14. **Photos, rejects:** SVG, GIF, HEIC, a file over 8 MB, a 100 px image and a 1:4 image are each rejected inline with a reason, without blocking the other files.
15. **Photos are private:**
    - DevTools shows no network request during an upload (CSP `connect-src 'none'` is present in the build).
    - The original file is not stored anywhere.
    - Stored images are 512 px or smaller, WebP or PNG, with no EXIF.
    - "Delete my photos" removes every image and revokes the object URLs.
16. **Delete all:** this removes every `petverse.*` key, the legacy key and the `petverse-photos` database, and returns to Welcome. A foreign `localStorage` key on the origin survives.
17. **Demo:** "Meet demo Miso" never writes a save (localStorage or IndexedDB) and never overwrites an existing profile. The Demo badge and "Exit demo" are visible in the Room, and photos are off.
18. **Disclaimer:** the calm disclaimer is visible on Welcome and in the Room footer.
19. **Accessibility:**
    - Calm motion Auto follows the OS setting, and the pet stays visible.
    - Pause pet freezes all motion.
    - Every action is reachable by keyboard, and focus is always visible.
    - Body text is at least 14 px and bubbles 16 px.
    - The live region announces only user-caused results, plus outing returns, level-ups and unlocks.
20. **Copy:** the banned-phrase test passes, no greeting mentions time away, and the tab title and favicon never change to signal a waiting gift.
21. **Evidence:** every §12 event fires with only normalized properties. The JSON export works, the ring buffer caps at 500, and the pet and drag interaction cap of 30 per session holds.
22. **Build hygiene:**
    - `npm run typecheck`, `npm test` and `npm run build` all pass.
    - Build tools are in `devDependencies`.
    - No Google Fonts request.
    - The build works from a sub-path (base `./`).
    - The initial JS is at most 150 KB gzipped.
23. **Art and clean room:** every drawn pose, for both cat and dog, is original SVG, and the owner has approved the contact sheet. No DockCat code, images or collectable names appear anywhere in the repo.
24. **Release:** nothing is pushed, merged, enabled or deployed until gates G1–G5 are given (§14).

---

## Appendix A: Design scorecard and conflict resolutions

### A.1 Scorecard (1–5 each)

| Criterion | A: Delight | B: Wellbeing | C: Ship-fast |
|---|---|---|---|
| Fun and gamification depth | **5**: 20 moments, drop zones, toy games, snack quirk, bongo, card flips, 52 collectibles | 3: tap rewards capped very low; no rarity; a drier feel | 3: tiers and always-new souvenirs; fewer moments; no packing |
| Wellbeing safety | 3: tap-driven XP (feed and play uncapped), odds-based rarity tiers, celebrations on many actions (against PRD §3.7) | **5**: care outweighs taps, back-off, urgent help pauses gamification, no away-time copy, quiet mode | 4: silent caps, always-new; but rarity odds kept and petting rewarded |
| Fidelity to owner decisions and PRD | 3: lists bugs already fixed in `c27a244` as to-do; 52 collectibles strains "smallest complete loop" | **5**: correct bug status; truth model; urgent help; disclaimer | 4: in-memory demo, `base "./"`; re-lists fixed bugs; 12 px minimum text is too small |
| Buildable in a few days | 2: content and mini-game load far beyond 4 days | 3: 8 acted care moments, back-off, bilingual catalog | **5**: explicit 4-day plan; defers packing, worker and bongo |
| Testability | 4: pure `step`, good signature list | **5**: very explicit pure APIs including back-off and the warmth ledger | **5**: 10k-step distribution tests, fixtures, corrupt storage |
| **Total (/25)** | **17** | **21** | **21** |

**Decision:**
- **C is the structural base.** It ties with B, and the owner's "launch quickly as a static site" breaks the tie on buildability. C supplies the module layout, the day plan, always-new rewards, the in-memory demo and `base "./"`.
- **From B:** the economy (care and outings outweigh taps), back-off, urgent-help pausing gamification, never mentioning absence, a separate correction list, and the verified bug status.
- **From A:** the juice numbers, reaction odds by comfort style, drop zones, the wand play, the card flip and NEW stamp, the moment pity rule, the snack quirk (P1), the firsts stickers (P1), bongo (P1), and the single-photo "never mix in cartoon" rule.

### A.2 Conflicts resolved explicitly

| # | Conflict | A | B | C | **Resolution** |
|---|---|---|---|---|---|
| 1 | Name of the progression stat | Bond XP | Warmth | XP plus hearts | **Bond** (matches the iOS Mood/Energy/Bond and PRD "trust"), labelled as a simulation |
| 2 | What earns the most | Taps (feed and play uncapped) | Care and outings; taps ≤5/day | Taps, with a 60/day silent cap | **Hybrid (v0.4 numbers):** taps ≤5 per visit, care ≤8, outings ≤9, total 20 per visit (§4.1) |
| 3 | Support actions and feedback earn points? | Feedback 0 | – | Feedback 0 | **Both 0** (R6). Support chips are a PRD §10 metric too |
| 4 | Level curve | 15·L(L+1), L10 around day 26 | 2L(L+1)−4, L10 ≥ 14 days | 5(L−1)(L+2), L10 around day 18 | **L² − 1 (v0.4)**: L2 at 3 BP, reached about 45 s into the first Room visit; L10 at about 8 typical visits (about 2 weeks every other day). v0.3's 3·L·(L−1) put L2 at 6 BP, which taps alone (5 max) could never reach |
| 5 | Souvenir odds | Rarity odds by duration | No rarity, seeded order | Odds plus always-new | **No odds.** Seeded order, plus one keepsake per place that needs a 25-min outing (deterministic anticipation, R3) |
| 6 | Souvenir minimum duration | > demo | 15 min | 10 min | **15 min** (below that, a postcard) |
| 7 | Durations | 2/10/25/45 | 5/15/25/45 (+1 demo) | 2/10/25/45 | **5/15/25/45, plus a 1-min Quick look with `?quick=1` or the demo pet** (25 = Pomodoro) |
| 8 | Choosing a place | From the toy | Snack × toy mapping | Destination picker | **Picker in P0** (2 open, 2 unlocked at L3 and L5); **packing in P1** for flavour only |
| 9 | Pity rule | Every 5th outing new | Not needed | Not needed (always-new) | **Not needed:** every qualifying outing gives a new item until the place is complete |
| 10 | Invitation count | 1 per session | 1 per session + back-off | 1 per session | **1 unprompted prompt per session, shared with the outing offer**, plus B's back-off and an always-available "Take a moment" |
| 11 | Urgent help | Banner, pet sits | Panel, gamification off for the session | Card, nothing logged | **Card, gamification paused for the rest of the page load (in memory). Nothing logged (v0.4):** a local-only log cannot serve a safety review and could expose the user on a shared device |
| 12 | Demo storage | Own save key | In memory | In memory | **In memory only** (simplest fix for bug 2) |
| 13 | Sign-in (PRD §4.1) | Removed | Removed | Removed, with "Continue with {name}" | **Removed**, per the owner's static-site decision. PRD §4.1 gets a doc note |
| 14 | Onboarding length | 4 steps | 5 steps | 6 + photo | **5 steps** with "Not sure yet" everywhere and nothing pre-filled (PRD §3.9) |
| 15 | Image normalization | Worker | Worker | Main thread (Worker in v1.1) | **Main thread in P0** behind header-dimension guards; **Worker in P1** |
| 16 | Event buffer | 500 | 200 | 200, viewable | **500, persisted, exportable, clearable** |
| 17 | Minimum font size | 14 px | 14 px | 12 px | **14 px body, 16 px bubbles** |
| 18 | Vite base | – | – | `"./"` | **`"./"`** (no router; works at the sub-path and on a future domain) |
| 19 | Bugs to fix | Lists 1–13 | Correctly marks 1, 3, 4, 6, 7, 8 as fixed | Lists 1, 4, 6 as to-do | **Verified against `c27a244`** (§9.3): 2, 5, 9–13 plus the misc items remain open |
| 20 | Reactions vs PRD §3.7 | Hearts on most taps | Ear-flick 10% | Ear-flick 10% (25% for space) | **Comfort-based odds including ear-flick (§6.1)**, a 15% delay, and no BP for an ear-flick or over-petting |
| 21 | Energy persistence | Starts by profile | – | Resets on load | **Resets to baseline on every load** (no decay possible, R2) |
| 22 | Drag reward | – | – | – | **0 BP** (never reward rough handling) |
| 23 | Moments count | 20 | 12 | 12 | **None in P0; 12 in P1, 20 later in P1** (v0.4 trim). Discovery is deterministic (R3) |
| 24 | Play | Toy mini-games | Simple | Simple | **Wand chase in P0** (cheap and fun: the pet follows pointer x); catch and toss in P1 |
| 25 | Bubble cadence | – | ≤1 unprompted per 2 min; none in calm mode | – | **B's rule** |
| 26 | Celebrations | 12-heart bursts, toasts | Dismissible card | Hearts HUD | **One level-up card that waits for a dismiss (R7)**; burst disabled in calm motion; no feedback prompt within 10 s of it |
| 27 | Data deletion on a shared origin | – | – | – | **Namespaced keys, never `localStorage.clear()`** (GitHub Pages origin is shared) |

---

## 中文摘要

- **目标：** Web 版宠物先上线，部署为静态站点。宠物默认使用我们自己绘制的原创 SVG（猫、狗共用一套骨架，P0 每种 5 个姿势）。用户可以按姿势上传自家宠物的照片（站立/对话、休息、走路帧、被抱起、伸懒腰），照片只保存在本浏览器的 IndexedDB，从不上传，原图不保留。用照片时标注"基于照片的近似形象"，画的形象标注"手绘替身"。
- **玩法：**
  - 宠物会自己休息、走动、坐下、伸懒腰、睡觉；进入房间约 3 秒内就会走动。"小瞬间"图鉴移到 P1。
  - 用户可以摸它、拖它（放到床上它会睡，放到碗边它会吃，放到垫子或窗台它会趴着或看窗外）、喂零食、用逗猫棒陪玩、聊天。
  - 宠物会按性格回应：可能延迟、拒绝、只动动耳朵、走开或躲起来；但用户刚用过支持类操作后的 2 分钟内，它不会躲开或拒绝。
  - 外出可选 5/15/25/45 分钟，绝不会失败，随时可以叫回。满 15 分钟带回纪念品（4 地点 × 6 件，按种子顺序发放，不重复、无概率抽奖），不足 15 分钟带回明信片。v0.4 把与 DockCat 收藏品同名、同核心词或同概念的 11 件纪念品全部改名（其中 2 件完全同名）。
- **成长：** 亲密度只增不减，每次访问（按本地日计）上限：点击类 5，照顾小任务 8，外出 9，合计 20。等级门槛改为 L² − 1（0、3、8、15、24、35、48、63、80、99）：第一次进房间后约 45 秒，靠喂食、陪玩、打招呼三下就能解锁第一个物品；普通用户约 8 次访问到 L10，隔天来一次约两周。不来不扣任何东西。
- **身心安全：** 不做连续打卡、需求衰减、饥饿、失败状态、抽奖、货币、推送或标签页角标，也不说"它想你了"之类的话。每次会话最多出现一个主动邀请；"像不像"的问题第一次会话问一次，之后最多每 3 个访问日问一次。检测到危机语句时显示求助卡片，本次页面加载内暂停所有庆祝和邀请；这件事不写入任何日志或存储。
- **证据闭环：** 像不像、纠正、有没有帮助这三类反馈保留，且都不加分。事件只记归一化字段，存在本地、可导出，从不发送；测试者自愿导出 JSON 发给你。
- **技术：** 纯函数状态机加带种子的随机数，所有数值集中在 config，用 vitest 做可复现测试。只新增一个依赖 `idb-keyval`。CSP 改为 `connect-src 'none'`，在浏览器层面兑现"不上传"的承诺。
- **已修与待修：** `c27a244` 已修复 1、3、4、6、7、8 号问题；2、5、9–13 号以及字号、ARIA、依赖归类、Google Fonts 等仍待修。
- **部署：** 通过 GitHub Actions 发布到 GitHub Pages（`base: "./"`，部署工作流只支持手动触发，另加一个只做检查的 web-ci）。推送、合并、开启 Pages、部署四步都需要你明确同意。
- **排期：** P0 约 5 天（v0.3 的 4 天计划实际约 8 天工作量，已删减并给出超期时的删减顺序），P1 约 3–4 天，P2 每项都需要你决定。P1 内容晚上线也没关系：用户先到 L6 时只显示等级名，P1 上线后补发。
- **评分：** 稳妥方案（C）与身心方案（B）同为 21/25，愉悦方案（A）17/25。以 C 为骨架，嫁接 B 的经济与安全规则，以及 A 的手感、互动细节和后续创意。

---

## Review notes (v0.4)

**What was reviewed:**
- v0.3 of this spec
- the owner decisions (web first, a real-pet likeness, original placeholder art, local-only pose-pack uploads, the interaction list, more fun, branch-only until approval)
- `docs/PRD_BROWSER_MVP.md`
- the repo constraints report
- `web/src` at `c27a244`

The v0.3 header pointed to this section, but the section did not exist, and several sections still carried v0.2 numbers.

### Changes made

**Numbers that did not add up**

1. **The first unlock was unreachable in a 5-minute first session.**
   - v0.3 put L2 at 6 BP (`3·L·(L−1)`). Taps can earn at most 5 BP a day, and v0.3's own 5-minute table added up to only 3–5.
   - Now `threshold = L² − 1` (0/3/8/15/24/35/48/63/80/99).
   - Feed, Play and "Hi" (each always accepted the first time) reach L2 about 45 s after the Room opens.
   - With all 5 tap BP, one care moment or one 15-min outing also reaches L3 (8 BP) in the first session (§3, §4.2).
2. **The pacing claims were wrong.**
   - With v0.3's 20-per-day total and an L10 at 270, a typical user needed about 20 visits, which is about 6 weeks when visiting every other day. The "daily maximum: L10 on day 9" row was really day 14.
   - Now a typical visit (14 BP) reaches L10 in about 8 visits: about day 15 every other day, about day 8 daily, and day 5 at the full pattern.
   - "Skipping days costs nothing" is reworded to what is true: nothing is ever lost, and pacing counts visits, not days (§1, §4.1, §4.2).
3. **Stale cap numbers were made consistent everywhere.** §4.2, §13.1, §16.10, Appendix A.2 and the 中文摘要 still used taps 9, total 30 and thresholds up to 270. All now use 5 / 8 / 9 / 20.
4. **Outing BP is one formula,** `floor(min(elapsed, planned) / 5)`. The test that said "a recall at 2 min gives 1" now says 0.
5. **Care BP could be farmed in two taps.** Water was "until Did it". Every care moment now has a minimum length (10–30 s) before "Did it" is enabled.
6. **"Typical visit" was 12 BP in one place and 14 in another.** It is now defined once: 2 pets, feed, play, "Hi", 1 care moment and a 25-min outing, for 14 BP.

**Contradictions resolved**

7. **P0 length:** 5 days (Goal 5) against 4 days (§15 and 中文). It is now 5 days, with a real day plan and a cut line (§15).
8. **Moments:** P1 in §1 and §3, but P0 in §4.5, §15 and §16. Now P1. P0 uses plain reactions for slow blink and the cushion and window-seat drops.
9. **Urgent-help pause scope:** "page load" (R8, Terms) against "session" (§4.4, §4.6, §6.8, §16.7, `Ctx`). It is now the page load everywhere, held as an in-memory flag.
10. **Level-up card:** "4 s" (A.2 #26) against "no card times out" (R7). It now waits for a dismiss.
11. **"Demo" meant two things:** the demo pet, and the `?demo=1` 1-min outing (labelled "Demo" in one place and "Quick look" in another). It is now "Quick look", shown with `?quick=1` or with the demo pet.
12. **`Outing.creditedAt`** was used in §4.1 but missing from the type and the persistence list. It is added, with a step-by-step return procedure (§4.4) and `resolveReturn`.
13. **Drop-zone size:** 40 px against 44 px. It is 44 px.
14. **Album tabs:** "three tabs" (with Moments) became 2 tabs in P0.
15. **R9 said "never declines" but not what happens instead.** Declines now become a quiet settle, and the hide roll, walk-away and unprompted prompts are suppressed in the R9 window.
16. **"Photo-grounded approximation" also covered the drawn art.** There are now two labels: "Drawn stand-in" and "Photo-grounded approximation".

**Wellbeing and privacy**

17. **`urgent_help_shown` was written to a persistent local log** on a device that may be shared, and it is never sent anywhere. It is removed: nothing about the urgent card is stored (§6.8, §12).
18. **"No Bond" during the urgent pause would have dropped outing BP,** which breaks R2. BP is now recorded silently, and only celebrations, prompts and feedback are held back.
19. **The talk box was disabled during outings,** which would also have disabled urgent detection. It now stays enabled.
20. **The likeness question came every session,** much like the old "feedback after every action" nag.
    - Likeness: in the first session, then at most once every 3 visit days, plus an on-demand button in the Profile drawer.
    - Usefulness: at most once per visit day.
21. **Unprompted prompts are blocked inside the R9 window.** The outing offer now uses the same `shouldOffer` gates.
22. **Moments had 10% odds plus a pity timer.** That is a variable-ratio schedule for a collection, against R3. Discovery is now deterministic: a new moment every 6th long-state entry.
23. **Copy:** declines and hides never blame the user. The banned list adds "waiting for you", "last chance", "hurry up", "don't leave", "you scared" and "because of you". Tab-title and favicon badges are ruled out.
24. **CSP:** `connect-src 'self'` became `'none'`, because 'self' still allowed requests to the shared `github.io` origin. The modulepreload polyfill is off, since it uses `fetch`.
25. **Photos:** the spec now states that the original file is never stored. The demo pet turns photos off, so "the demo writes nothing" also holds for IndexedDB. A failed IndexedDB open shows a toast. The Firefox `persist()` prompt is noted.
26. **Legacy migration would have imported the old pre-filled Miso defaults as user facts** (PRD §6). The migration is skipped when the legacy profile equals those defaults.

**DockCat clean room**

27. **The v0.3 claim "souvenirs already renamed" was not true.**
    - A one-time reviewer check against DockCat's collectable names found 2 exact matches ("bottle cap", "pinecone") and 8 items that shared a core noun (button, shell, pebble, feather, ribbon, bell, and star or crystal). "Pressed wildflower" was the same idea as a DockCat item.
    - All 11 are renamed (§4.5), and no word in the new names appears in a DockCat collectable name.
    - No DockCat code, values or art was found in the spec. The floor anchor (0.88) does not appear in DockCat's code. The pose-slot ids (talk, rest, walk, held, transition) are our own.
    - The place name "Garden" is a generic word and stays.

**Missing pieces an engineer needs (added)**

28. Modules for `game/session.ts`, `game/cards.ts` (the R7 queue), `game/feedback.ts` and `hooks/useGame.ts`, with signatures and tests. R7 referred to `game/cards.ts`, but it was missing from the module plan.
29. Save write timing (250 ms debounce, plus immediate writes on `pagehide` and on hide), two-tab behaviour through the `storage` event, and what happens when saving is blocked.
30. Unlocks tracked by id, plus a P0 fallback for L6–L10 before P1 exists (the level name only, then a retroactive "New things" card). This removes v0.3's hidden "P1 must ship by day 3" deadline.
31. Stage geometry:
    - the user anchor that approach and settle distances are measured from (the user had no position before)
    - sprite size and y handling
    - drop-zone positions
    - the walk-speed factor (v0.3's "× energy factor" was undefined)
    - the first long state is a walk, and the first rest of a session is shorter
    - energy changes apply when a state ends
32. Profile:
    - what each correction chip writes
    - an effect for the "sudden noise" trigger, and an honest note that "strangers" changes nothing in P0
    - where the favourite activity is used
    - the coat pick in onboarding, with `CoatId` defined
33. Talk: typed-intent routing, the clearing of the input after each send, a content budget for lines (about 40), and the `idle` and `homeStory` line sets.
34. PRD mapping: arousal and trust (PRD §4.3) mapped honestly, and Play counted in the PRD support-action metric (PRD §4.4).
35. The evidence path (testers export the JSON themselves), and a cap of 30 per session on pet and drag events so taps cannot evict feedback events.
36. Deploy:
    - an absolute `og:image` (relative ones do not work in link previews)
    - the `build-sha` meta tag wired to `VITE_BUILD_SHA`
    - a check-only `web-ci.yml`, so G2 has a real web check
    - a note that the existing `ios.yml` runs on every PR to `main`
37. Edge cases: a clock guard for outings, "Exit demo", and the dock's Talk button behaviour.

**P0 trimmed** (v0.3's "4 days" was about 8 days of work):

38. Trims:
    - the Moments album moves to P1
    - drawn art drops from 2 × 9 poses to 5 poses per species on one shared rig (Rest B and 4-frame walks move to P1)
    - the scarf and talk line set 2 move to P1
    - one bubble voice (about 40 lines instead of 63)
    - 16 stories instead of 32
    - 5 photo slots instead of 9
    - no animated-image parsing
    - Move up/down buttons instead of drag-to-reorder
    - 4 care moments instead of 5
    - a ranked cut line, plus a list of things never cut

### Open questions for the owner (building proceeds on the default)

| # | Question | Default |
|---|---|---|
| 1 | Is the pacing right? L10 takes about 8 typical visits: about 2 weeks every other day, about 8 days daily | As written |
| 2 | Add a "rested bond" catch-up, so a visit after missed days gets doubled caps? | No in P0; revisit with data |
| 3 | Cap new souvenirs per day? Heavy Pomodoro users could finish the album in about 2 days | No cap (paced by real time away) |
| 4 | The urgent-help resource and phrase list: findahelpline.com plus the listed EN and ZH phrases. Which Chinese-language resource for the P1 zh UI? | findahelpline.com; the owner reviews the phrase list before launch |
| 5 | Keep the urgent card completely unlogged? | Yes, never logged |
| 6 | CSP `connect-src 'none'` (stricter than v0.3)? | Yes; fall back to 'self' only if QA finds a break |
| 7 | Add `web-ci.yml`, and add `paths-ignore` for `web/**` and `docs/**` to `ios.yml`, in the first PR? | Yes to both, called out in the PR description |
| 8 | Simulate PRD "trust"? For example, fewer ear-flicks at higher Bond. It would make likeness depend on grinding | No; Bond never changes behaviour |
| 9 | Likeness question cadence: the first session, then every 3 visit days | As written |
| 10 | Commit the four untracked browser-MVP docs (PRD, HANDOFF, development plan, this spec) on this branch? Local commit only, no push | Yes, with the first web commit |
| 11 | The cut-line order in §15 if the build slips | As listed |
| 12 | Skip migrating a legacy profile that equals the old Miso defaults? | Yes |

### 中文：待你确认的问题（不回复则按默认值开发）

1. 节奏：普通用户约 8 次访问到 L10（隔天来约两周，每天来约 8 天）。默认：照此。
2. 是否加"休息补偿"（错过几天后下次访问上限翻倍）？默认：P0 不加。
3. 是否限制每天新纪念品数量？重度番茄钟用户约 2 天可集齐。默认：不限。
4. 求助资源与危机词表：默认 findahelpline.com，上线前由你审一遍中英文词表；P1 中文界面用哪个中文求助资源待定。
5. 求助卡片完全不记录任何日志。默认：是。
6. CSP 改为 `connect-src 'none'`。默认：是。
7. 第一个 PR 里加 `web-ci.yml`，并给 `ios.yml` 加 `paths-ignore`（web/、docs/）。默认：都加，并在 PR 描述里写明。
8. 是否模拟 PRD 的"信任"值？默认：否，亲密度不改变行为。
9. "像不像"提问频率：首次会话一次，之后每 3 个访问日最多一次。默认：照此。
10. 四份未跟踪的浏览器 MVP 文档是否在本分支本地提交（不推送）？默认：随第一个 web 提交一起提交。
11. 超期时的删减顺序（§15）。默认：照列表。
12. 旧版存档如果等于原 Miso 默认值则不迁移。默认：是。

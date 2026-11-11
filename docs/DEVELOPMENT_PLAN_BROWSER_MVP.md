# AI Petverse Browser MVP - Development Plan

**Status:** Planning only. This document is an implementation plan, not a
permission to start development.

**Development gate:** When the user says `develop`, ask: **"Ready to start
development?"** Only begin after confirmation.

## 1. Recommended technical shape

```text
Web app (React + Vite + TypeScript)
  -> auth and versioned pet profile service
  -> shared typed domain and Zod schemas
  -> avatar provider (preset first, photo-grounded later)
  -> intent/affect adapter (explicit input first, optional server AI)
  -> deterministic behaviour policy
  -> renderer and animation controller
  -> local gesture adapter for standardized webcam events
  -> feedback/event client
  -> serverless API
  -> Supabase/Postgres for minimal anonymous events

Chrome Manifest V3 popup
  -> one user-triggered support action
  -> web app deep link
  -> no page access or background surveillance in P0

Community projection
  -> public pet card from selected private fields
  -> moderation, reporting, block, unpublish, delete
  -> shared pet park only after private likeness evidence
```

The existing SwiftUI/RealityKit implementation remains reference and rollback
evidence. It is not ported screen by screen. The browser MVP reuses domain
vocabulary such as species, traits, mood, energy, bond, scenes, and cooldown,
but uses a smaller implementation.

## 2. Repository layout

Create these directories only after the development confirmation:

```text
web/                         # public browser app
extension/                   # Manifest V3 popup companion
shared/                      # TypeScript domain models and schemas
api/                         # serverless routes, no client secrets
data/
  samples/                   # synthetic fixtures only
  exports/                   # reviewed aggregate metrics only
docs/
  PRD_BROWSER_MVP.md
  DEVELOPMENT_PLAN_BROWSER_MVP.md
  HANDOFF_BROWSER_MVP.md
  decisions/                 # short ADRs and dated tradeoffs
  evidence/                  # small, public-safe screenshots only
tests/                       # cross-surface fixtures and contract checks
```

The repository is the source of truth for source code, schemas, documentation,
decisions, test fixtures, release notes, and redacted evidence. Generated
directories such as `node_modules`, `dist`, `coverage`, browser profiles,
recordings, and local secrets stay ignored.

## 3. Web implementation sequence

### Phase A - thin playable vertical slice

**Goal:** A user can open a URL, choose cat or dog, answer a few questions,
press one action, see the pet respond, and rate the result.

Implementation order:

1. Vite/TypeScript app shell with a responsive layout.
2. `PetProfile`, `PetCorrection`, `PetIntent`, `PetCommand`, and `PetState`
   schemas in `shared/`.
3. Preset-first onboarding with local browser persistence.
4. A small procedural 2.5D or Three.js/React Three Fiber pet scene.
5. A finite state machine or utility policy for `idle`, `watch`, `approach`,
   `comfort`, `play`, `rest`, and `hide`.
6. Typed command buttons and text input.
7. Likeness/usefulness feedback panel.
8. Unit tests for profile priority, intent mapping, cooldown, and deterministic
   behaviour decisions.

**Exit criteria:** The complete loop works with no network dependency except
loading the deployed page. A backend outage does not prevent the user from
playing or leaving local feedback.

### Phase B - evidence loop

**Goal:** Observe friction without collecting unnecessary private data.

1. Add an anonymous `session_id` generated in the browser.
2. Send minimal structured events through a serverless endpoint.
3. Store only normalized values and coarse timings.
4. Add a private review query or export route for aggregate counts.
5. Commit only a redacted weekly summary to `data/exports/` after review.

**Exit criteria:** We can answer where users stop, whether the pet responds,
whether it feels like their pet, and what users correct, without exposing raw
photos, audio, transcripts, identifiers, or credentials.

### Phase C - speech and optional camera

Ship only after the typed loop is stable.

- Use the browser Web Speech API through a `SpeechProvider` interface.
- Show recording state and provide a typed fallback on every browser.
- Call semantic interpretation once per utterance, never every animation frame.
- Request camera permission only from a visible user action.
- Keep camera processing local and limited to interaction cues such as face
  presence or approximate head direction; do not claim reliable emotion
  detection.
- Do not upload raw video or audio by default.

Camera interaction is a P1 enhancement if it would delay the first online URL.

## 4. Semantic interpretation and AI boundary

The product should work without an external AI provider. Start with a local
`RuleIntentProvider` that recognizes a small phrase set and returns
`no_match` for everything else.

Keep the future provider behind this interface:

```ts
interface IntentProvider {
  interpret(input: {
    text: string;
    profile: PetProfile;
    recentState: PetState;
  }): Promise<IntentResult>;
}
```

The future server-side provider can use TypeSafe's current System One `Choice`
question for a closed intent set and use its returned confidence to route:

```text
high confidence -> deterministic pet policy
medium confidence -> safe default or ask a short clarification
low confidence -> no_match / user choice; do not guess
```

TypeSafe's JavaScript SDK requires server-side credentials and current Node.js
support. It should be added only behind a server route and feature flag after a
small labeled set of real user utterances exists. The model output is typed,
but typed output does not prove truth or authorize an action. The application
still owns thresholds, policy, cooldown, and animation.

Do not use passive webcam or voice signals as a hidden clinical emotion model.
An explicit user statement such as "I feel overwhelmed" is stronger evidence
than an inferred facial or prosodic cue.

## 5. Pet behaviour architecture

```text
raw input
  -> normalized intent + uncertainty
  -> profile priority resolver
  -> deterministic behaviour policy
  -> bounded PetCommand
  -> animation controller
  -> event receipt + feedback
```

Example bounded command:

```ts
type PetCommand =
  | { type: "approach"; pace: "slow" | "normal" }
  | { type: "settle"; distance: "near" | "room" }
  | { type: "play"; durationMs: number }
  | { type: "watch" }
  | { type: "hide" }
  | { type: "rest" };
```

The renderer maps commands to motion. The AI must not return arbitrary
coordinates, JavaScript, or a new animation name. Use seeded randomness and
bounded delays so the pet feels alive but tests remain reproducible.

For P0, a simple procedural pet is more honest and faster than promising an
exact photo-to-3D twin. A later asset pipeline may evaluate rigged glTF,
multi-view capture, or learned reconstruction only after likeness feedback
shows that the basic interaction is valuable.

## 6. Data and storage strategy for a low-storage laptop

### What belongs in the GitHub repository

- source code, schemas, tests, docs, ADRs, and small synthetic fixtures;
- public-safe screenshots or short evidence images that are small enough to
  review;
- deployment configuration without secrets;
- redacted aggregate metrics and dated release notes;
- a data dictionary explaining every event and retention rule.

### What must not be committed

- API keys, `.env` files, tokens, cookies, browser profiles, or signing files;
- raw pet photos, webcam video, microphone recordings, or user transcripts;
- raw feedback containing names, emails, addresses, or private context;
- `node_modules`, build output, coverage, simulator data, Xcode DerivedData,
  local database files, or downloaded model weights;
- unreviewed exports that may identify a user or a small group.

The current `ai-petverse` repository is public. Therefore, "store everything in
the repo" cannot safely mean storing raw user data there. GitHub is a source
control and evidence surface, not a private analytics database.

### Recommended remote storage

- **Source and project memory:** this GitHub repository, in `docs/` and tracked
  source directories.
- **Anonymous event and feedback storage:** Supabase/Postgres with row-level
  policies, minimal columns, and a documented retention period. A Vercel or
  Cloudflare serverless function mediates writes.
- **Reviewed evidence:** aggregate, redacted JSON or CSV exported into
  `data/exports/` and committed after a privacy check.
- **Large media, if ever required:** an explicit opt-in object-storage bucket
  with signed URLs, automatic expiry, and a deletion path. Do not use Git as a
  photo/video store.
- **Builds and deploys:** GitHub Actions and Vercel/Cloudflare build from the
  remote commit. Do not retain local `dist` or deployment bundles.

If a private project journal or raw export is needed, create a separate private
repository or private storage boundary; do not make the public `ai-petverse`
repository private-data storage by accident.

### Local storage reduction

The development workflow should use a shallow, sparse checkout when possible,
remote CI builds, and no local Xcode Simulator artifacts for the browser MVP.
Do not delete caches or project data automatically. A separate read-only disk
scan and confirmation-gated cleanup is required before deleting anything.

## 7. Chrome extension implementation

After Phase A is verified:

1. Add `extension/manifest.json` with Manifest V3 and only the permissions
   needed for the popup.
2. Build a popup with the pet name, one short support action, and a deep link to
   the web app.
3. Use `chrome.storage.local` only for a small, non-sensitive profile summary or
   a session handoff token; never mirror raw conversations.
4. Do not add content scripts, `<all_urls>`, history, tab capture, or hidden
   background monitoring in P0.
5. Test manual loading in Chrome and record the exact extension build version.

## 8. Verification and release gates

Every meaningful update must run a relevant check and record the exact result.

### Code checks

- TypeScript typecheck.
- Unit tests for schemas, policy, and event validation.
- Production build.
- Accessibility smoke checks for keyboard focus, labels, contrast, and reduced
  motion.
- Extension package validation after the extension exists.

### Browser checks

- Chrome desktop viewport, target 1440 x 900.
- Narrow mobile viewport, target 390 x 844.
- Onboarding completion, pet response, correction, feedback, and reset.
- Speech permission denied path and typed fallback.
- Backend unavailable path still leaves the user with a usable local loop.

### Release evidence

Record separately:

1. local test/build result;
2. browser-verified preview result;
3. pushed commit SHA;
4. deployment result;
5. live URL content and SHA verification;
6. feedback/data export window and privacy review.

Do not call a local build, a GitHub push, or a deployment log proof that the
live product changed.

## 9. Delivery sequence and rough effort

These are planning estimates for a focused MVP, not promises about external
services or debugging time.

| Phase | Scope | Rough effort | Exit artifact |
| --- | --- | ---: | --- |
| 0 | repo docs, schemas, storage boundary, branch | 0.5 day | PRD + plan + ADR |
| 1 | web onboarding + procedural pet + typed actions | 1–2 days | local playable vertical slice |
| 2 | feedback + minimal events + review export | 0.5–1 day | online evidence loop |
| 3 | responsive/accessibility/browser QA | 0.5–1 day | browser-verified preview |
| 4 | thin Chrome popup | 0.5–1 day | manually loadable extension |
| 5 | deploy and interview evidence pack | 0.5 day | live URL + screenshots + data summary |

The launch gate is Phase 1–3. Phase 4 must not block the first online web MVP.

## 10. Working agreement for future agents

- Read `docs/HANDOFF_BROWSER_MVP.md`, this plan, and `git status` first.
- Do not begin implementation merely because the PRD exists.
- When the user says `develop`, ask for confirmation before editing source.
- Use a feature branch or isolated worktree; preserve the native iOS branch.
- Do not push until the user says `push to repo`.
- Do not merge until the user says `merge to main`.
- After each substantial change, run a relevant check and record the result in
  the handoff.
- Keep public docs English-first with edited Chinese immediately afterwards
  when adding a public article or guide.

## 中文

### 技术落地原则

先做能够上线的浏览器闭环：React + Vite + TypeScript、结构化 profile、
确定性的 pet behavior policy、小型场景、文字输入和 feedback。语音和摄像头
只能在核心闭环稳定后加入。

AI 只负责把用户输入解释成有限的 intent，例如 `comfort`、`play`、`rest`、
`no_match`。真正的行为由代码决定，动画由 renderer 决定。这样才能测试、回滚、
解释失败，也避免 LLM 直接控制坐标或偷偷写入记忆。

### 低存储方案

GitHub repo 保存 source code、docs、schema、tests、synthetic fixtures、脱敏后的
aggregate metrics 和 release evidence。不要把 raw photo、audio、video、transcript、
token、`.env`、browser profile、`node_modules`、build output、DerivedData 或 model
weights 放进公开 repo。

匿名行为数据放 Supabase/Postgres；serverless API 只接收最小结构化事件。确认并脱敏
后，才把 aggregate export 放到 `data/exports/`。大文件如果未来确实需要，用有过期和
删除机制的 object storage，不用 Git 当视频数据库。

### 交付顺序

先完成 web playable vertical slice，再接数据和 browser QA，之后才做 Chrome popup。
这样即使 extension、AI provider 或摄像头权限遇到问题，仍然能够先拿出 live URL、
行为数据和面试可讲的迭代证据。

## Sources

- `docs/PRD_BROWSER_MVP.md`
- `docs/HANDOFF_BROWSER_MVP.md`
- [TypeSafe documentation index](https://docs.typesafe.ai/llms.txt)
- [TypeSafe intent routing](https://docs.typesafe.ai/patterns/intent-routing.md)
- [Furever Dock](https://www.fureverdock.com/)

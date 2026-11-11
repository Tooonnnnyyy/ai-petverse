# AI Petverse Browser MVP Handoff

**Status:** Planning only. No browser implementation has started.

**Last reviewed:** 2026-10-28

**Development gate:** Do not start implementation when this file is merely being
reviewed. When the user later says `develop`, ask for one short confirmation
before editing: "Ready to start development?" Continue only after the user
confirms.

**Planning documents:** Read [`docs/PRD_BROWSER_MVP.md`](PRD_BROWSER_MVP.md) for
product requirements and [`docs/DEVELOPMENT_PLAN_BROWSER_MVP.md`](DEVELOPMENT_PLAN_BROWSER_MVP.md)
for the technical sequence, remote-storage boundary, and verification gates.

## Product direction

AI Petverse is moving from an iOS-first delivery to a browser-first support
system: a web app plus a lightweight Chrome extension. The pet is not only a
game character or decorative mascot. It is the familiar, pet-grounded
interface that helps a person manage cognitive overload and everyday mental
activities in short, user-controlled moments.

The goal is not to finish the largest or most technically ambitious version
first. The goal is to put a real, useful web loop and a thin extension loop in
front of people quickly, collect feedback and behaviour evidence, and use that
evidence to decide the next small change.

Working principle for every future design and planning decision:

> A small, real, deployable MVP is more valuable than a theoretically better
> idea that has not shipped.

The first browser version may be rough or visually imperfect. It must still be
usable, reviewable, privacy-safe, and able to produce an interview-ready story:
live URL, source code, screenshots or video, real behaviour data, feedback,
limitations, and changes made from observation.

Project source, decisions, schemas, tests, and public-safe evidence should live
in this GitHub repository. Raw photos, audio, video, transcripts, credentials,
browser profiles, build output, and unreviewed feedback must not be stored in
the public repository. Use remote data storage for minimal anonymous events and
commit only reviewed aggregate exports.

## Product reframing

The product is a private pet-grounded support layer for moments such as
anxiety, distraction, and cognitive overload. The pet should respond in a way
that feels like the user's real cat or dog, not like a generic chatbot wearing
a pet costume.

The web app is the source of truth for the pet profile, corrections, settings,
feedback, and deeper reflection. The Chrome extension is the quick-access
companion: it should offer a small number of calm, reversible actions while the
user is browsing, without requiring the user to open a full app every time.

The first product promise should stay narrow and honest:

> Help me regain a little mental space through a familiar pet companion that
> understands how my real pet behaves.

This is not a diagnosis, medical treatment, crisis service, or replacement for
professional care. The product should avoid clinical claims and provide clear
escalation language for urgent or unsafe situations.

## Real-pet accuracy is the core success criterion

The onboarding questions are not a survey for its own sake. They create the
ground truth that lets the AI answer as this user's pet. The system should
separate three layers:

- **User-provided facts:** species, name, age or life stage, breed if known,
  routine, likes, dislikes, signals, calming behaviours, and boundaries.
- **User corrections:** explicit edits such as "my cat hides when startled" or
  "do not make my dog sound overly cheerful." These should have priority over
  generic assumptions.
- **AI inferences:** tentative interpretations that are labelled as uncertain
  and can be accepted, corrected, or deleted. Inferences must never silently
  become facts.

Onboarding must not create a new cognitive burden. Use progressive disclosure:

1. Start with a preset path for mainstream pets, especially cat and dog.
2. Ask only the highest-value questions needed for a believable first response.
3. Let the user reach a useful interaction quickly.
4. Learn more through optional follow-up questions, corrections, and feedback.

The most important feedback question is not only "Was this helpful?" It is also
"Did this feel like your real pet?" with `yes`, `partly`, `no`, and an optional
correction. This directly tests the product's central hypothesis.

## Repository state at handoff

- Repository: `Tooonnnnyyy/ai-petverse`
- Current checkout branch: `spike/realitykit-voxel-world`
- Current local commit: `ce7775b` (`feat: render trait-driven voxel pets with RealityKit`)
- Current branch remote commit: `ce7775bde164a6d1d649bf9546c689096207abd7`
- Remote `main` verified from this checkout on 2026-10-28: `036643c97b92e7a2c817c6590871ad0b2acad407`
- Existing user change: staged `.vscode/settings.json`; preserve it and do not
  reset, revert, or include it in unrelated work.
- This handoff file is an agent-maintained planning artifact. Do not commit or
  push it automatically; wait for an explicit user instruction.

## What the current source does

The current project is a native iOS 18+ app using Swift 6, SwiftUI,
RealityKit, PhotosUI, UIKit, Foundation, and XCTest. It has no third-party
packages, backend, account system, hosted AI provider, or cloud photo upload.

The implemented local flow is:

```text
onboarding
  -> photo library/camera input or preset template
  -> deterministic local pixel preview
  -> preview result
  -> customization
  -> local save
  -> immersive voxel world
  -> scene switch / play together / share / delete
```

The 3D pet is procedural and trait-driven. It is not photo-to-3D
reconstruction, and the current preview renderer intentionally does not claim
to be an AI model.

### Source map

- `AI Petverse/Models.swift`: Codable pet profile, appearance, personality,
  deterministic mood/energy/bond state, scenes, styles, draft state, and
  `UserDefaults` persistence.
- `AI Petverse/AppStore.swift`: main-actor flow state, photo loading,
  generation cancellation and retry, local persistence, interaction cooldown,
  deletion, share intent, and an in-memory string event list.
- `AI Petverse/AvatarGeneration.swift`: cancellable local preview seam and
  deterministic 48px pixel transformation/upscale. A future provider must stay
  behind this boundary and must not put credentials in the client.
- `AI Petverse/VoxelPet.swift`: pure trait model and deterministic voxel builder
  for species, size, ears, snout, tail, patterns, colours, and accessories.
  `noise` is pinned by tests so another renderer can reproduce the same spot
  pattern.
- `AI Petverse/VoxelWorldView.swift`: RealityKit orthographic camera, island
  scenes, flat-shaded mesh generation, pet roaming, drag rotation, breathing,
  tail/ear/leg animation, and play-together hops.
- `AI Petverse/ContentView.swift`: onboarding, photo input, generation,
  result, customization, home controls, stats, scene switcher, share card,
  and delete confirmation.
- `AI Petverse/Components.swift` and `AI Petverse/Theme.swift`: SwiftUI
  components, low-poly preview icon, colour palette, grid backgrounds, and
  buttons/cards.
- `AI Petverse/ShareSheet.swift`: camera bridge and explicit UIKit share-sheet
  handoff.
- `AI PetverseTests/`: model/persistence tests, preview renderer tests,
  generation failure/retry tests, interaction/cooldown tests, trait-combination
  tests, legacy decoding tests, and deterministic voxel-noise tests.
- `docs/PROJECT_SETUP.md`, `docs/PROJECT_GOVERNANCE.md`, and `docs/RELEASE.md`:
  environment, privacy/release boundaries, branch policy, and native release
  guidance.

## Web + Chrome extension MVP scope

The recommended first slice is a new `web/` app plus a `extension/` Chrome
Manifest V3 package in this repository. The web delivery can reuse the existing
pet domain vocabulary while leaving the iOS reference implementation intact.
A separate repository can be reconsidered only if deployment or repository
ownership makes the monorepo slower.

Recommended initial stack:

- React + Vite + TypeScript for fast browser iteration.
- Three.js or React Three Fiber for a small voxel-like scene; keep the first
  scene and pet model intentionally smaller than the full RealityKit world.
- Chrome Manifest V3 for a thin extension surface. Keep the extension focused
  on an explicit toolbar action or popup; do not begin with invasive browsing
  surveillance or automatic page scraping.
- A deploy target such as Vercel or Cloudflare Pages.
- A hosted data store such as Supabase only for minimal anonymous events and
  feedback, with credentials kept in deployment environment configuration.

### Two-surface MVP

**Web app:**

- Fast pet setup for cat or dog, with a small number of high-value questions.
- A pet profile editor showing what is known, what was corrected, and what is
  only an AI inference.
- A short support interaction for anxiety, overload, focus, or reset moments.
- A playable pet scene that makes the pet feel present without turning P0 into
  a full game.
- Feedback that measures both usefulness and likeness to the user's real pet.

**Chrome extension:**

- Explicit click-to-open support, not constant monitoring.
- A compact pet response and one or two actions such as `ground me`, `help me
  start`, or `take a short reset`.
- A clear link back to the web app for profile correction and deeper feedback.
- No page content access by default. Any selected text or tab context must be
  user-invoked and clearly disclosed.

### P0 user loop

```text
open live URL
  -> choose cat or dog and answer a few high-value pet questions
  -> receive a short response grounded in that pet profile
  -> enter a small playable pet scene
  -> use one support action or open the Chrome extension
  -> correct the pet's response if it feels unlike the real pet
  -> submit usefulness and likeness feedback
  -> inspect behaviour data
  -> make the next evidence-based change
```

P0 should include:

- Preset-first creation for mainstream pets, starting with cat and dog.
- A small onboarding profile that captures pet facts without forcing a long
  questionnaire.
- AI responses grounded in the structured pet profile, with user corrections
  taking priority over generic model assumptions.
- A deterministic pet model/appearance and at least one playable interaction.
- One or two scenes/styles, not a content platform.
- A thin Chrome extension that can be manually opened for one short support
  action. The extension can ship after the web loop works locally, but it is a
  P0 companion surface, not a second full product.
- Feedback with usefulness, real-pet likeness (`yes`/`partly`/`no`), a short
  correction, and reason for stopping or continuing.
- Anonymous session IDs and minimal structured events, for example:
  `session_started`, `pet_profile_started`, `pet_profile_completed`,
  `support_action_used`, `extension_opened`, `pet_likeness_feedback_submitted`,
  `pet_correction_submitted`, `play_together`, `feedback_submitted`, and
  `creation_completed`.
- A small review surface or export path so behaviour data can actually be
  inspected during iteration.

P0 should not include:

- Accounts, social feeds, stranger messaging, payments, subscriptions, or
  long-term memory.
- Hosted photo-to-3D generation before the browser loop proves demand.
- Client-side API keys, raw image storage, or automatic public publishing.
- A 1:1 port of every SwiftUI screen or every RealityKit scene.
- Automatic browsing surveillance, hidden tab/page capture, or a persistent
  always-on assistant.

## Later phase: UGC pet socialization

The idea of pets meeting in a shared park, like two people meeting while
walking their dogs, is a strong later direction. It should not be part of the
first MVP. First prove that one person feels understood by one pet and that the
support loop is useful.

After that private loop has evidence, a UGC phase can explore:

- Pet profiles meeting in shared spaces or asynchronous "park" moments.
- User-created scenes, pet stories, prompts, and interactions.
- Consent controls for whether a pet is discoverable, visible, or contactable.
- Reporting, moderation, block/mute, age safety, and privacy boundaries before
  any open social feed or messaging.

## 2026-10-29 research update: cost and platform strategy

The immediate objective remains a low-cost browser MVP, not a full real-time
generative pet platform. Current planning estimates are directional only; they
are not verified live vendor quotes and must be rechecked against official
pricing pages before purchasing a plan.

### Core technical conclusion

Do not use video generation for every interaction. The practical early-stage
architecture is:

```text
real pet photos -> appearance / identity reference
real pet videos -> motion clips and movement style
onboarding profile -> behaviour facts and preferences
LLM -> intent and emotion interpretation
bounded policy -> allowed response/action
browser renderer -> low-latency 2.5D/WebGL presentation
```

Photos help the pet look like the user's pet, but photos alone cannot reliably
recover authentic movement. Short user-provided videos are the higher-value
source for motion. Video generation should be reserved for asynchronous,
optional shareable reels until demand and unit economics are proven.

### Directional monthly budget bands

- `CAD 0-30`: self-testing with a free web host, browser libraries, local or
  free-tier data services, and a small amount of model usage.
- `CAD 30-150`: private alpha with roughly 10-50 testers, limited image
  processing, and pay-as-you-go LLM usage.
- `CAD 300-1,500+`: 100-500 users with voice, GPU processing, or frequent
  generated video. Video and real-time GPU workloads are the dominant cost.

These estimates exclude development time and may change with model, region,
resolution, storage, and usage limits. A first test should cap API spend at
approximately `CAD 50-100/month` rather than commit to multiple subscriptions.

### Recommended tools for the first experiment

- React + Vite + TypeScript, with Three.js or React Three Fiber for the browser
  runtime; use MediaPipe or TensorFlow.js for browser-side camera/gesture tests.
- Cloudflare Pages or Vercel for the frontend; Supabase for minimal auth,
  structured feedback, and anonymous events; object storage such as Cloudflare
  R2 for reviewed media only.
- One pay-as-you-go LLM provider for profile extraction, intent detection, and
  bounded response generation. Set a hard monthly budget before testing.
- One image/video API experiment only (for example fal.ai or Replicate); do not
  subscribe to several video providers before measuring whether users value the
  result.
- Start with text input and browser speech capabilities. Add paid speech
  recognition or voice generation only after repeated use is demonstrated.

### Subscription decision

Do not buy a dedicated GPU, an unlimited video plan, or a premium avatar
platform for P0. The first spend should be a small API credit for one LLM and,
optionally, a separate limited credit for one image/video experiment. Keep
deployment and storage on free tiers while the product hypothesis is still
unproven.

### Metrics that decide whether to spend more

Track onboarding completion, photo/video upload completion, real-pet likeness
(`yes`/`partly`/`no`), correction rate, repeat sessions, preferred actions,
retention, and actual API cost per active user. The product should not claim
to reproduce a user's real pet until likeness feedback supports that claim.

### Research boundary

The current research did not establish a public Meta Muse API that solves
full-body, real-time cat/dog animation. Muse-related identity and motion
conditioning ideas are useful references, but the product must not depend on an
unconfirmed or human-avatar-only capability. Re-check official provider
pricing and license terms before implementation or commercial use.

The social layer must extend a validated support product, not become a reason
to delay the first useful release.

## Privacy and evidence boundaries

- A local photo selected in the browser is not evidence of an upload. Record
  only that a photo was selected unless the user explicitly opts into an upload
  feature later.
- An event write is not evidence that a real human completed the intended task;
  separate event logs from interviews, feedback, and manual review.
- A successful local build is not evidence of browser interaction, deployment,
  or live URL behaviour.
- A deployment is not evidence that the expected commit is live. Verify the
  remote SHA, deployment result, and live content separately.
- Keep credentials, user media, private local paths, simulator data, and raw
  feedback exports out of the public repository.

## Working protocol for future agents

1. Read this handoff and inspect `git status` before changing files.
2. Preserve the native iOS checkout as reference/rollback evidence while the
   browser MVP is built.
3. Before implementation, re-check the smallest useful slice against the
   shipping principle above. If it does not produce a playable URL and evidence
   path, reduce scope.
4. When development is explicitly confirmed, use an isolated feature branch or
   worktree. Do not edit `main` directly.
5. After every meaningful update, run one relevant check and record its exact
   result in the session log below.
6. For a preview, run the local web server, open it in Chrome when available,
   verify a desktop and narrow mobile viewport, and distinguish browser-
   verified behaviour from source-only checks.
7. Only act on GitHub after the user explicitly says `push to repo`. Pushing is
   separate from merging. Only merge after the user explicitly says `merge to
   main`, then verify checks, remote SHA, deployment, and live content.
8. Append decisions, verified evidence, blockers, and next actions here so a
   later agent can resume without reconstructing the entire conversation.

## Verification at handoff

- `git ls-remote origin HEAD refs/heads/main refs/heads/spike/realitykit-voxel-world`:
  passed; remote refs were reachable and returned the hashes recorded above.
- `xcodebuild -list -project "AI Petverse.xcodeproj"`: passed; the project
  exposes the `AI Petverse` app target, `AI PetverseTests` test target, and
  `AI Petverse` scheme. Xcode also reported an unavailable CoreSimulator
  service.
- `xcodebuild -project "AI Petverse.xcodeproj" -scheme "AI Petverse" -sdk
  iphonesimulator -destination 'generic/platform=iOS Simulator'
  CODE_SIGNING_ALLOWED=NO build`: failed with exit 65 in the current machine
  environment. The failure includes CoreSimulator connection errors and a
  malformed `SwiftUIMacros.StateMacro` plugin response at the `@State`
  properties in `AI Petverse/VoxelWorldView.swift`; this is an iOS verification
  blocker, not evidence that the browser MVP is implemented.
- `git diff --check`: passed.
- No browser code, deployment, hosted data integration, or live browser
  preview was created in this planning pass.

## Session log

### 2026-10-28 — Planning handoff

- Reviewed the complete tracked Swift source, tests, project configuration,
  README, Chinese README, setup, governance, release notes, and existing P0
  implementation plan.
- Confirmed the browser-first direction: ship a small playable online loop
  before adding hosted AI or expanding the iOS implementation.
- Created this handoff file. No existing source files were changed.
- Next action is gated: wait for the user to say `develop`, ask for the short
  confirmation, then implement only the first browser slice after confirmation.

### 2026-10-28 — Product reframing

- Reframed the product from a pet website into a web app plus Chrome extension
  that supports anxiety, cognitive overload, and everyday mental activities.
- Made real-pet likeness the primary success criterion: structured pet facts,
  explicit user corrections, and clearly labelled AI inferences.
- Added cat and dog as the first mainstream-pet onboarding paths, with
  progressive disclosure to avoid making onboarding itself overwhelming.
- Kept UGC pet socialization and shared park interactions as a later phase,
  after the private one-user/one-pet support loop has evidence.

### 2026-10-28 - Browser MVP PRD and remote-storage boundary

- Added `docs/PRD_BROWSER_MVP.md` and
  `docs/DEVELOPMENT_PLAN_BROWSER_MVP.md`.
- Chose the first launch gate as a browser-only playable vertical slice with
  typed input, deterministic pet behaviour, likeness/usefulness feedback, and
  minimal anonymous events. Speech, camera, TypeSafe intent routing, and the
  Chrome popup are staged behind that gate rather than allowed to block it.
- Confirmed GitHub is the source of truth for code and public-safe project
  memory, not a raw user-data warehouse. Raw media and feedback remain outside
  the public repository; reviewed aggregate exports may be committed.
- Verified the public Furever Dock page as a product reference: real-pet
  personalization, daily desktop presence, skills, simple everyday help, and
  explicit limits around saved conversations and AI accuracy. Its private
  implementation remains unknown.

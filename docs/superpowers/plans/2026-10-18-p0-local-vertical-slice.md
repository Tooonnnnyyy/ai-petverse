# AI Petverse P0 Local Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable SwiftUI iOS prototype that validates the first value loop: create a stylized pet locally, customize and save it, perform one deterministic interaction, and open the system share flow.

**Architecture:** The app is local-first and does not require an account, backend, AI provider, or AR capability. A small app store owns the current flow and persisted pet profile; pure Swift domain types define deterministic state transitions; SwiftUI screens compose the onboarding, creation, customization, pet home, and deletion/share actions. The “generation” step is an explicit local mock seam so a future server-backed AI provider can replace it without changing the user flow.

**Tech Stack:** Swift 6.4, SwiftUI, PhotosUI, UIKit share sheet bridge, Xcode project, XCTest-compatible pure domain tests.

**Spec:** local PRD/context file used during planning; it is intentionally not committed to this repository.

## Global Constraints

- P0 is local-first and must not require authentication, cloud sync, paid services, AI API keys, or AR.
- Core growth state is deterministic; an AI model never decides mood, energy, or bond changes.
- A failed generation path must offer a preset template so the user can continue.
- The prototype must distinguish share-sheet opened from content published externally.
- User photos stay on-device in this prototype; no source image is uploaded.
- No public social feed, stranger messaging, subscriptions, or long-term memory are included.

---

### Task 1: Create the Xcode project and app shell

**Files:**
- Create: `AI Petverse.xcodeproj/project.pbxproj`
- Create: `AI Petverse/AI_PetverseApp.swift`
- Create: `AI Petverse/AppStore.swift`
- Create: `AI Petverse/Theme.swift`
- Create: `AI Petverse/Assets.xcassets/Contents.json`
- Create: `AI Petverse/Info.plist`
- Create: `AI PetverseTests/AI_PetverseTests.swift`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- `PetverseApp` is the SwiftUI `App` entry point.
- `AppStore` exposes `screen`, `pet`, `draft`, `startCreation()`, `selectPhoto(_:)`, `beginGeneration()`, `savePet()`, `performInteraction()`, and `deletePet()`.
- The test target imports no UI framework and can exercise deterministic domain behavior.

- [x] Create a minimal app target with iOS 17 deployment settings and a test target.
- [x] Add the app entry point and a root `ContentView` placeholder.
- [x] Add build instructions and the local-first/privacy boundary to README.
- [ ] Build for a generic iOS destination to prove the project opens and compiles.

### Task 2: Add deterministic domain models and persistence

**Files:**
- Create: `AI Petverse/Models.swift`
- Modify: `AI Petverse/AppStore.swift`
- Modify: `AI PetverseTests/AI_PetverseTests.swift`

**Interfaces:**
- `PetProfile): Codable value type with name, style, appearance, personality, source image data, and state.
- `PetState): Codable value type with mood, energy, bond, and last interaction date.
- `PetDraft): editable creation state.
- `PetStyle): `sunny`, `midnight`, `candy` presets with display metadata.
- `PetState.interact(at:)` deterministically clamps values to 0...100 and returns a short reaction.
- `LocalPetStore` persists one `PetProfile` and one optional source image in `UserDefaults`/Application Support.

- [x] Write tests for deterministic interaction, value clamping, encoding/decoding, and deletion.
- [ ] Run the tests and confirm they fail before implementation.
- [x] Implement models and local persistence.
- [ ] Run the tests and confirm they pass.

### Task 3: Implement the P0 creation flow

**Files:**
- Create: `AI Petverse/ContentView.swift`
- Create: `AI Petverse/Components.swift`
- Modify: `AI Petverse/AppStore.swift`

**Interfaces:**
- `Screen` enum has `onboarding`, `photoInput`, `generating`, `result`, `customize`, `home`.
- `ContentView) switches on `AppStore.screen` and renders focused screen views.
- `PhotoPicker) uses `PhotosPicker` and stores a compressed local preview.
- The mock generator transitions from loading to result and exposes a retry/fallback action.
- The fallback template remains usable if photo selection is skipped or generation fails.

- [x] Implement onboarding and photo input with camera/photo-library explanation.
- [x] Implement loading, mock generation, failure/retry, and preset fallback states.
- [x] Implement result and customization screens with style, color, name, and personality controls.
- [x] Persist the saved pet and route to the home scene.

### Task 4: Implement interaction, export, and deletion

**Files:**
- Modify: `AI Petverse/ContentView.swift`
- Modify: `AI Petverse/Components.swift`
- Create: `AI Petverse/ShareSheet.swift`
- Modify: `AI Petverse/AppStore.swift`
- Modify: `AI PetverseTests/AI_PetverseTests.swift`

**Interfaces:**
- `ShareSheet) wraps `UIActivityViewController) for an explicitly user-triggered share action.
- `AppStore.performInteraction()) updates only deterministic state and records a local analytics event.
- `AppStore.deletePet()) removes the local profile and source image, then returns to onboarding.
- Share copy states that opening the sheet is not proof of external publishing.

- [x] Add the pet home scene with mood, energy, bond, and one “Play together” action.
- [x] Add a shareable local image card and share sheet presentation.
- [x] Add delete confirmation and local data deletion.
- [x] Add tests for interaction and delete/recreate behavior.

### Task 5: Verify and document

**Files:**
- Modify: `README.md`
- Update the local PRD/context file separately; do not copy private local paths into the public repository.

- [ ] Run `xcodebuild -project "AI Petverse.xcodeproj" -scheme "AI Petverse" -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build`.
- [ ] Run the XCTest target when a simulator destination is available; otherwise record the simulator service blocker and run a compile-only build.
- [x] Inspect the project for secrets and verify only local mock generation is present.
- [ ] Append a dated Session record to the canonical PRD describing implemented, tested, unverified, and next-step items.
- [ ] Record that the simulator UI walkthrough remains unverified until CoreSimulatorService is available.


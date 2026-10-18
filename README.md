# AI Petverse

AI Petverse is an iOS-first prototype for validating whether people want to turn a real pet into a personal, stylized digital companion.

This first P0 slice is deliberately local-first:

- SwiftUI screens for onboarding, photo input, local mock generation, customization, pet home, interaction, export, and deletion.
- No account, cloud sync, paid service, API key, AI provider, or AR dependency.
- Source photos remain on-device and are stored only with the local prototype profile.
- Growth state is deterministic and testable; an AI model never controls mood, energy, or bond.
- Opening the system share sheet is recorded as an intent, not proof that content was published externally.

## Open the project

Open `AI Petverse.xcodeproj` in Xcode 27 or run:

```bash
xcodebuild -project "AI Petverse.xcodeproj" -scheme "AI Petverse" -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build
```

When CoreSimulatorService is available, select an iOS 17+ simulator and run the `AI Petverse` scheme. The current prototype uses a local preview in place of a real AI generation call; P1 will evaluate a server-proxied provider and RealityKit separately.

## Verification evidence

- `docs/evidence/p0-onboarding-ios26.jpg` — first-run onboarding screen captured on iOS 26.0.1 Simulator.
- `docs/evidence/p0-onboarding-ios26-latest.jpg` — photo-input Step 01 captured after a successful build, install, and launch on the same Simulator.
- The screenshot and launch checks verify the app is visible and installable. Full click-through of PhotosPicker, share sheet, and delete confirmation still needs a local manual review because the Simulator accessibility session timed out.

## Privacy boundary

Do not add API keys to the app target. Any future image provider must be called through a server-side proxy with validation, rate limits, cost limits, retention rules, and deletion support. This prototype does not upload the selected photo.

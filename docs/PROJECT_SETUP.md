# Project setup and environment

This page is the reproducible setup reference for AI Petverse. It describes the current P0 as it exists in the repository; it does not imply that a future AI provider or cloud backend is already configured.

## Toolchain

- macOS and Xcode 27 recommended for the current project settings.
- Swift 6.0 language mode.
- iOS 17.0 deployment target.
- iOS Simulator for build and XCTest verification.
- Apple frameworks only: SwiftUI, SceneKit, PhotosUI, UIKit, Foundation, XCTest.

## Environment variables

There are no runtime environment variables for the current P0. No `.env` file is needed. The repository ignores `.env` and `.env.*` while allowing `.env.example` if a future provider needs a documented variable contract.

The future provider boundary must remain server-side. API keys, webhook URLs, tokens, user photos, and private simulator data must never be committed to this repository or embedded in the app target.

## Xcode setup

1. Open `AI Petverse.xcodeproj`.
2. Select the `AI Petverse` scheme.
3. Select an iOS 17+ Simulator.
4. Run the app. The first launch starts at onboarding unless a local profile already exists.
5. For a clean onboarding review, uninstall the app from the Simulator or delete the local pet from the overflow menu.

The project includes camera and photo-library usage descriptions in `AI Petverse/Info.plist`. A physical-device build additionally requires the developer's signing team and provisioning profile; the local verification path intentionally uses `CODE_SIGNING_ALLOWED=NO` on Simulator.

## Verification commands

```bash
xcodebuild -project "AI Petverse.xcodeproj" \
  -scheme "AI Petverse" \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO test
```

```bash
xcodebuild -project "AI Petverse.xcodeproj" \
  -scheme "AI Petverse" \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

Current local evidence: 11 XCTest cases pass. Visual evidence is stored under `docs/evidence/`; physical-device installation and hosted AI generation are not claimed as verified.

## Troubleshooting

- If the Simulator cannot connect, unlock it, keep the screen on, and retry after CoreSimulatorService is available.
- If the app opens at Home unexpectedly, delete the saved local pet from the overflow menu or reset the app's Simulator data.
- If a photo generation attempt fails, use the preset template; the provider seam is intentionally local and cancellable.

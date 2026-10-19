# AI Petverse

[![Platform](https://img.shields.io/badge/platform-iOS%2017%2B-0A84FF?logo=apple&logoColor=white)](https://developer.apple.com/ios/)
[![Swift](https://img.shields.io/badge/Swift-6.0%2B-F05138?logo=swift&logoColor=white)](https://www.swift.org/)
[![SwiftUI](https://img.shields.io/badge/UI-SwiftUI-007AFF)](https://developer.apple.com/xcode/swiftui/)
[![3D](https://img.shields.io/badge/3D-SceneKit-8E8E93)](https://developer.apple.com/scenekit/)
[![iOS verification](https://github.com/Tooonnnnyyy/ai-petverse/actions/workflows/ios.yml/badge.svg)](https://github.com/Tooonnnnyyy/ai-petverse/actions/workflows/ios.yml)
[![License](https://img.shields.io/badge/license-MIT-6366F1)](LICENSE)

**English · [中文](docs/README.zh-CN.md)**

AI Petverse is an iOS-first prototype for turning a pet photo into a playful digital companion. The main experience is a full-screen, low-poly 3D world with a procedural pet, inspired by voxel games and Monument Valley-style geometric scenes.

## What is working now

- Camera or photo-library input, plus a preset path for fast review.
- A local, deterministic avatar preview that keeps the source photo on-device.
- A procedural SceneKit pet rendered directly inside an immersive 3D world.
- Two selectable starter scenes: **Pixel Grove** (voxel farm) and **Neon Arcade** (Y2K night glow).
- `Play together` animates the 3D pet and updates Mood, Energy, and Bond.
- Local persistence, deletion, share-sheet handoff, cancellation, retry, and cooldown handling.

The current P0 does **not** claim photo-to-3D reconstruction or a hosted AI generation service. The photo flow and generation service seam are ready for a future provider; the shipped 3D pet is a procedural low-poly shell driven by the selected style and appearance controls.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Swift 6, Xcode project, iOS 17+ |
| UI | SwiftUI |
| 3D world | SceneKit, procedural low-poly geometry, orthographic camera |
| Input | PhotosUI and UIKit camera bridge |
| Local state | Codable models and UserDefaults-backed persistence |
| Export | UIKit `UIActivityViewController` share-sheet bridge |
| Tests | XCTest on iOS Simulator |
| Dependencies | Apple frameworks only; no third-party packages |

## Project setup

### Requirements

- macOS with Xcode 27 recommended for the current project settings.
- An iOS 17 or newer Simulator. A physical device requires the developer's own signing team and provisioning setup.
- No backend, account, API key, paid service, or `.env` file is required for this P0. `.env` files are ignored so future provider credentials do not enter Git.

### Open and run

```bash
open "AI Petverse.xcodeproj"
```

In Xcode, select the `AI Petverse` scheme and an iOS 17+ Simulator, then press Run. The camera and photo-library permission strings are already configured in `AI Petverse/Info.plist`.

### Command-line verification

```bash
xcodebuild -project "AI Petverse.xcodeproj" \
  -scheme "AI Petverse" \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO test
```

Local verification recorded **11 tests passed, 0 failed**. Remote CI evidence is commit-specific; see the Actions badge and project status record. For a compile-only build, replace `test` with `build` and use `-destination 'generic/platform=iOS Simulator'`.

## Repository map

- [`AI Petverse/`](AI%20Petverse) — SwiftUI screens, local store, SceneKit world builder, and avatar preview seam.
- [`AI PetverseTests/`](AI%20PetverseTests) — deterministic model, persistence, generation, interaction, and scene-selection tests.
- [`docs/README.zh-CN.md`](docs/README.zh-CN.md) — Chinese project overview and setup guide.
- [`docs/PROJECT_SETUP.md`](docs/PROJECT_SETUP.md) — environment, simulator, signing, and troubleshooting notes.
- [`docs/PROJECT_GOVERNANCE.md`](docs/PROJECT_GOVERNANCE.md) — public-repository release and branch policy.
- [`docs/evidence/`](docs/evidence) — local Simulator screenshots used for review.

For future agents, start with [`AGENTS.md`](AGENTS.md), the [project playbook](docs/GITHUB_PROJECT_PLAYBOOK.md) and the [status record](docs/PROJECT_STATUS.json).

## Versioning and rollback

The immersive 3D source checkpoint is commit `2c60530`; it is not an App Store release. The earlier stable local-avatar checkpoint remains available as:

- Branch: `backup/pre-3d-mvp`
- Tag: `mvp-2d-stable-58df1bf`

Create feature branches for future work and merge through a pull request. `main` is protected; see [`docs/PROJECT_GOVERNANCE.md`](docs/PROJECT_GOVERNANCE.md).

## Privacy boundary

Source photos stay on the device in this prototype. The app does not upload images, call an AI provider, or publish content automatically. Opening the share sheet records a user intent; it is not evidence that a file was delivered to an external service. Do not add API keys, webhook URLs, private paths, simulator data, or raw user photos to the repository.

## License

MIT. See [`LICENSE`](LICENSE).

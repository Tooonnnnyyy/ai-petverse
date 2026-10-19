# AI Petverse agent entry

Before changing this repository, read the project facts in [`docs/PROJECT_SETUP.md`](docs/PROJECT_SETUP.md) and [`docs/PROJECT_GOVERNANCE.md`](docs/PROJECT_GOVERNANCE.md), then follow the reusable [GitHub project protocol](https://github.com/Tooonnnnyyy/knowledge-base/blob/docs/github-operating-protocol/docs/GITHUB_AGENT_ENTRY.md).

Also read [`docs/GITHUB_PROJECT_PLAYBOOK.md`](docs/GITHUB_PROJECT_PLAYBOOK.md) and maintain [`docs/PROJECT_STATUS.json`](docs/PROJECT_STATUS.json). The shared protocol is currently available on its public review branch; check for a merged revision before switching the source URL.

## Start-of-task checklist

1. Inspect `git status`, the current branch, remotes, open Issues/PRs, the latest Actions run, releases/tags, and rollback refs.
2. Map the requested work to the project's P0/P1/P2 acceptance criteria. Keep one Issue authoritative for the user outcome and link the PR with `Refs #N` while investigating; use a closing keyword only when the acceptance criteria are actually covered.
3. Preserve uncommitted work. Create a feature branch from the current intended base and keep a rollback tag or branch before a large visual or architectural change.
4. Run the relevant Xcode build/test command before and after a change. Report local, CI, device, and deployment evidence separately.
5. Before a public commit or release, inspect source files, assets, docs, Git metadata, and generated output for credentials, private paths, user media, device identifiers, and other private data.

## Current product boundary

- Stack: Swift 6, SwiftUI, SceneKit, PhotosUI, UIKit, XCTest; Apple frameworks only.
- P0: camera/photo input, local pet avatar preview, two selectable immersive 3D scenes, `Play together`, local persistence, deletion, retry/cooldown, and share-sheet handoff.
- P0 does not claim hosted AI generation or photo-to-3D reconstruction. The current pet is a procedural low-poly shell.
- P1: provider-backed generation and richer pet/scene assets after the local flow is stable.
- P2: additional scenes, multiplayer, and nonessential polish.

## Verification and recovery

The current fallback refs are `backup/pre-3d-mvp` and `mvp-2d-stable-58df1bf`. Do not force-push or rewrite public history. A green local test does not prove the GitHub macOS runner or a physical device; check the matching Actions run before calling CI verified.

When handing off, include `scope`, `source`, `checks`, `external`, `rollback`, and `open`, plus direct file/PR/Issue paths so another agent can resume without chat history.

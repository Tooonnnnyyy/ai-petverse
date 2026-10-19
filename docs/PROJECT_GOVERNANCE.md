# Project governance and public-repository policy

This page records the repository operating rules so they do not need to be reconstructed in a later session.

## Repository identity

- Repository: `Tooonnnnyyy/ai-petverse`
- Default branch: `main`
- Product: local-first iOS pet companion prototype
- Public-facing stack labels: Swift 6, SwiftUI, SceneKit, PhotosUI, UIKit, XCTest
- No backend, provider credential, webhook, or `.env` value belongs in the repository.

## Branch and rollback policy

- `main` is the review and release branch.
- New work starts on a feature branch and enters `main` through a pull request.
- Force-pushes and branch deletion are disabled for `main`.
- `Build and test` is a required status check from the GitHub Actions app, with strict base checks. Read live settings before each merge.
- Pull requests require one approving review and conversation resolution. Administrators are also subject to these rules. Only one collaborator currently exists; self-authored PRs therefore need another authorized reviewer or an explicit owner decision on a solo-maintainer policy. Do not disable protection to merge.
- Keep a dated rollback branch or tag before a large visual or architectural change.
- The current fallback references are `backup/pre-3d-mvp` and `mvp-2d-stable-58df1bf`.

## Public-release checklist

Before making a private repository public or publishing a release:

1. Scan tracked files for credentials, private paths, raw user media, and local logs.
2. Inspect website/docs content and Git commit metadata as separate audit surfaces.
3. Verify README links, screenshots, license, Topics, default branch, and branch protection.
4. Run the relevant Xcode build and test commands.
5. Verify the remote commit, repository visibility, and protection rules through GitHub after the change.
6. Report any remaining exposure by category and location. Do not rewrite existing history unless explicitly authorized.

The current public-release decision preserves the existing Git history. Commit metadata may contain the local author's identity; this is recorded as a release limitation rather than silently rewriting history.

## Evidence boundary

Local Simulator build, test, and screenshot evidence is valid for this checkpoint. It does not prove a signed physical-device install, a hosted AI provider, photo-to-3D reconstruction, or external publication through the share sheet.

# GitHub project playbook

This is the project-level entry point for the reusable workflow in the public Knowledge Base: [A Reusable GitHub Project Bootstrap Protocol](https://tooonnnnyyy.github.io/knowledge-base/notes/github-project-bootstrap-protocol/).

## Current project map

- Repository: `Tooonnnnyyy/ai-petverse`
- Source of truth: `main` plus the commit shown by `git rev-parse HEAD`
- Product slice: local-first iOS pet photo input → deterministic pixel preview → procedural low-poly 3D pet → two selectable scenes → Play Together interaction
- Current fallback: `backup/pre-3d-mvp` and `mvp-2d-stable-58df1bf`
- Project-specific setup: [`PROJECT_SETUP.md`](PROJECT_SETUP.md)
- Project-specific governance: [`PROJECT_GOVERNANCE.md`](PROJECT_GOVERNANCE.md)
- Public Wiki: https://github.com/Tooonnnnyyy/ai-petverse/wiki/Project-Governance-&-Setup

## Repeatable agent start

```bash
cd /Users/bjt/Projects/ai-petverse
git status --short --branch
git remote -v
git log -1 --oneline
```

Read the README and the two project docs before changing behavior. Search existing Issues and PRs before opening a new one. Start work on a feature branch. Before visual or architecture changes, confirm the rollback branch/tag still exists.

## Priority and evidence

- **P0:** user cannot complete photo/template → avatar preview → scene → Play Together; build or test is broken; data can be lost.
- **P1:** core flow works but feedback, accessibility, performance, or scene quality is materially weak.
- **P2:** polish, additional scenes, provider integration, 3D reconstruction, packaging or non-blocking documentation.

For every change record the user result, changed files, checks, remote/Actions evidence and remaining uncertainty. Local Simulator success does not prove physical-device installation, hosted AI generation, App Store distribution or live service behavior.

## Release routine

1. Create/update an Issue with reproduction or acceptance criteria.
2. Create a feature branch and keep the diff focused.
3. Run the local build/test command from `PROJECT_SETUP.md`.
4. Open a PR using the repository template; let Actions run.
5. If the change is release-worthy, tag a known-good commit and write release notes. Do not call a local Simulator build an App Store release.
6. Verify remote SHA, Actions result and any user-visible artifact separately.
7. If the candidate is unacceptable, restore the documented tag/branch or revert with a new commit. Do not force-push `main`.

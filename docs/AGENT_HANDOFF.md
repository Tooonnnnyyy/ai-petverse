# AI Petverse Agent Handoff

This file is the shared handoff log for Codex, Claude Code, Muse, DeepSeek harness, and Hermes. Update it whenever work changes the repository, verification state, deployment state, or the next recommended action.

## Current checkpoint — 2026-11-11

- **Product surface:** browser-first Web MVP in `web/`, with the native iOS app preserved in the same repository.
- **Baseline commit:** `28774e5125c57854eb4386e878b0ed7fcc830949` (`docs: remove a local machine path from the spec`).
- **Rollback refs:** local tag `backup/web-preview-2026-11-11-28774e5` and remote branch `backup/web-preview-2026-11-11` both point to the baseline commit.
- **Protected checkout:** `/Users/bjt/Projects/ai-petverse` remains on `feat/web-pet-gamification` and is not edited by this iteration.
- **Active isolated worktree:** `/Users/bjt/.codex/worktrees/web-preview-iteration/ai-petverse`, branch `codex/web-preview-iteration`.
- **Remote preview branch:** `feat/web-pet-gamification`; it is live at <https://tooonnnnyyy.github.io/ai-petverse/>.

## Verified at baseline

- `npm test`: 14 files / 120 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- GitHub Actions run `43023691984`: Web preview Test and build + Deploy passed.
- Live Pages response: HTTP 200; current HTML references the built JS/CSS assets.
- Current public tracked-file scan found no credential-pattern matches and no local machine path in `HEAD`.

## What is implemented

The Web MVP has onboarding, drawn cat/dog pets, autonomous idle states, pet/drag/feed/play/talk interactions, bond levels and unlocks, outings, souvenir album, local saves and migration, calm motion, urgent-help copy, and local data deletion.

## Known gaps carried into this iteration

- No user pet photo upload or photo-grounded personalization.
- No Profile / Settings / correction editor.
- No likeness or usefulness feedback loop.
- No care invitations or outing offers.
- No extension, PWA, backend, remote analytics, account, or LLM chat.
- Small visual issues reported by the previous agent: level-up card can be clipped on short screens; decorative and functional bowls are both visible; urgent-help `kms` matching needs copy review.
- The web branch is not merged to `main` and has no PR yet. Do not merge directly from this branch without a reviewable PR.

## Coordination rules

- Keep edits in the active isolated worktree. Do not reset, rebase, force-push, or edit another agent's checkout.
- Before committing, run `git status --short --branch` and inspect the diff. Before pushing, verify the target remote and branch explicitly.
- Preserve the rollback refs above. If a new stable checkpoint is created, add a new dated backup ref and record it here.
- Separate local test/build evidence, GitHub Actions evidence, deployment evidence, and live browser evidence. A passing local build does not prove the live page is updated.
- Do not upload raw pet photos, credentials, browser profiles, private paths, or unreviewed feedback to this public repository.

## Active work

- Codex is performing a small browser QA pass and will only make changes that improve the live feedback loop without changing the native iOS line.
- **2026-11-11 — Codex:** identified three low-risk fixes for the live feedback loop: remove the `kms` distance false positive from urgent-help matching, keep level-up cards usable on short mobile stages, and avoid rendering the decorative bowl while the pet is eating.
- Next agent should read this file, inspect `git status`, run the relevant Web checks, and append a dated entry before handing work off.

## Update log

- **2026-11-11 — Codex:** created rollback tag/branch and isolated worktree; documented baseline evidence, known gaps, and multi-agent coordination rules. No product source files changed yet.
- **2026-11-11 — Codex:** applied three low-risk Web fixes in the isolated worktree: removed `kms` as a standalone urgent-help trigger so distance text such as `5 kms` does not open the modal; made the mobile stage card slot scrollable so level-up content remains usable on short screens; hid the decorative room bowl while the pet is eating away from it so only the carried bowl is shown. Added a regression test for the distance false positive. Local result: 14 test files / 121 tests passed, TypeScript + Vite build passed, `git diff --check` passed. Changes are not pushed to the shared preview branch yet.

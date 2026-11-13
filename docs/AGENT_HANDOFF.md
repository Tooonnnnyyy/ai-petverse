# AI Petverse Agent Handoff

This file is the shared handoff log for Codex, Claude Code, Muse, DeepSeek harness, and Hermes. Update it whenever work changes the repository, verification state, deployment state, or the next recommended action.

## Current checkpoint — 2026-11-12

- **Product surface:** browser-first Web MVP in `web/`, with the native iOS app preserved in the same repository.
- **Baseline commit:** `28774e5125c57854eb4386e878b0ed7fcc830949` (`docs: remove a local machine path from the spec`).
- **Rollback refs:** local tag `backup/web-preview-2026-11-11-28774e5` and remote branch `backup/web-preview-2026-11-11` both point to the baseline commit.
- **Protected checkout:** `/Users/bjt/Projects/ai-petverse` remains on `feat/web-pet-gamification` and is not edited by this iteration.
- **Active isolated worktree:** `/Users/bjt/.codex/worktrees/web-preview-iteration/ai-petverse`, branch `codex/live-handoff-docs`.
- **Remote preview branch:** `feat/web-pet-gamification`; it is live at <https://tooonnnnyyy.github.io/ai-petverse/>.
- **Live commit:** `05142a015a081e51ac426fb2f09bf83ece64dbdf` (PR #16 squash merge).
- **Live workflow:** `43337939509` (Test and build + Deploy both passed).
- **Live assets:** `index-BZH4X71H.js`, `index-DfV3gbWP.css`; Pages HTTP response `200` at the preview URL.
- **Live rollback tags:** `backup/live-web-2026-11-12-945fdf9` and `backup/live-web-2026-11-12-05142a0`.
- **Next-loop rollback tag:** `backup/next-loop-2026-11-12-18a1723` (before local life/photo work).
- **Current review state:** PR #16 is merged; live Pages is updated. Continue from a new isolated branch for follow-up work.

## Verified at baseline

- `npm test`: 14 files / 120 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- GitHub Actions run `43023691984`: Web preview Test and build + Deploy passed.
- Live Pages response: HTTP 200; current HTML references the built JS/CSS assets.
- Current public tracked-file scan found no credential-pattern matches and no local machine path in `HEAD`.

## What is implemented

The Web MVP has onboarding, drawn cat/dog pets, autonomous idle states, pet/drag/feed/play/talk interactions, bond levels and unlocks, outings, souvenir album, local saves and migration, calm motion, urgent-help copy, and local data deletion.

## Known gaps carried into this iteration

- No account, email opt-in, Web Push/email delivery, or cloud photo processing.
- No Profile / Settings / correction editor for the new photo metadata yet.
- No likeness or usefulness feedback loop.
- No care invitations or outing offers.
- No extension, PWA, backend, remote analytics, account, or LLM chat.
- Small visual issues reported by the previous agent: level-up card can be clipped on short screens; decorative and functional bowls are both visible; urgent-help `kms` matching needs copy review.
- The Web preview is live on its feature branch; it is not merged to native iOS `main`. Keep Web and native iOS release decisions separate.

## Coordination rules

- Keep edits in the active isolated worktree. Do not reset, rebase, force-push, or edit another agent's checkout.
- Before committing, run `git status --short --branch` and inspect the diff. Before pushing, verify the target remote and branch explicitly.
- Preserve the rollback refs above. If a new stable checkpoint is created, add a new dated backup ref and record it here.
- Separate local test/build evidence, GitHub Actions evidence, deployment evidence, and live browser evidence. A passing local build does not prove the live page is updated.
- Do not upload raw pet photos, credentials, browser profiles, private paths, or unreviewed feedback to this public repository.

## Active work

- Codex shipped the local pet-life/photo-grounding slice. The next work should be a small reviewable slice, not a large rewrite.
- **2026-11-11 — Codex:** identified three low-risk fixes for the live feedback loop: remove the `kms` distance false positive from urgent-help matching, keep level-up cards usable on short mobile stages, and avoid rendering the decorative bowl while the pet is eating.
- Next agent should read this file, inspect `git status`, run the relevant Web checks, and append a dated entry before handing work off.

## Update log

- **2026-11-11 — Codex:** created rollback tag/branch and isolated worktree; documented baseline evidence, known gaps, and multi-agent coordination rules. No product source files changed yet.
- **2026-11-11 — Codex:** applied three low-risk Web fixes in the isolated worktree: removed `kms` as a standalone urgent-help trigger so distance text such as `5 kms` does not open the modal; made the mobile stage card slot scrollable so level-up content remains usable on short screens; hid the decorative room bowl while the pet is eating away from it so only the carried bowl is shown. Added a regression test for the distance false positive. Local result: 14 test files / 121 tests passed, TypeScript + Vite build passed, `git diff --check` passed. Changes are not pushed to the shared preview branch yet.
- **2026-11-11 — Codex:** pushed `codex/web-preview-iteration` and ran Actions `43127107869`. Test and build passed; Deploy was rejected by the `github-pages` environment because that environment does not allow this branch. The safe publication path is a reviewable PR into the existing `feat/web-pet-gamification` preview branch, then its normal Pages workflow. No direct force push or environment bypass is allowed.
- **2026-11-11 — Codex:** opened PR #14 (`fix(web): polish live preview feedback loop`) from `codex/web-preview-iteration` into `feat/web-pet-gamification`. PR state is mergeable and clean; local validation remains 14 files / 121 tests plus production build. Waiting for the owner review gate before the live preview branch changes.
- **2026-11-12 — Codex:** owner asked to accelerate delivery. PR #14 was squash-merged as `945fdf9`; Actions `43329619789` passed Test and build + Deploy; live Pages now returns HTTP 200 with the new assets `index-D8jF6cSe.js` and `index-CvQ9mM1M.css`. Added rollback tag `backup/live-web-2026-11-12-945fdf9`.
- **2026-11-12 — Codex:** added research notes for FureverDock, GitHub/open-source references, pet-industry services, and visual-realism experiments. Added the local life loop: versioned signal caps, active foreground minutes, deterministic outing discovery/rarity/pity, coins, courses and shop inventory. Added onboarding breed choices (orange cat, tabby cat, golden retriever, black lab), optional consented local photo import (up to 3 images in IndexedDB), photo-grounded gentle motion fallback, and a Pet life panel. Local proof: 15 test files / 124 tests passed, typecheck and Vite production build passed. No photos or credentials entered the repository.
- **2026-11-12 — Codex:** original PR #15 conflicted because its branch retained the pre-squash history; it was closed without merge. Rebased the same product commit onto live preview SHA `945fdf9` as branch `codex/web-life-slice`, opened PR #16, and verified GitHub reports `MERGEABLE` / `CLEAN`. Live Pages remains unchanged pending review.
- **2026-11-12 — Codex:** owner authorized direct merge. PR #16 squash-merged as `05142a0`; Actions `43337939509` passed Test and build + Deploy; Pages returned HTTP 200 with assets `index-BZH4X71H.js` and `index-DfV3gbWP.css`. Added rollback tag `backup/live-web-2026-11-12-05142a0`. Preview is available at <https://tooonnnnyyy.github.io/ai-petverse/>.

## Next priorities for allocation

1. **P0 — live feedback loop:** owner playtests the live URL and records concrete friction; Codex fixes only reproducible/high-value issues in small PRs.
2. **P1 — local feedback panel:** likeness (`yes/partly/no`), usefulness, optional correction, local save, and export-safe evidence. No remote analytics or raw conversation storage.
3. **P1 — Profile / Settings:** edit profile facts, corrections, calm motion, photo deletion, and full local-data deletion.
4. **P1 — photo realism:** compare 2.5D vs short image-to-video experiments for orange cat/golden retriever; preserve local fallback and clear “photo-grounded approximation” wording.
5. **P2 — extension:** thin Manifest V3 popup after the Web loop has feedback evidence; no passive browsing surveillance.
6. **Separate native track:** iOS Simulator/TestFlight and RealityKit review remain independent from the live Web preview.

## Product and monetization guardrail

- Core pet interaction stays available in Basic even when AI generation quota is exhausted. See `docs/COMMERCIALIZATION.md`.
- Real health is not inferred from game price, low engagement or food level. Game “mood/care” states remain reversible simulations; email/Web Push require opt-in account/backend work.
- Photo path is local-only in this slice. It is a photo-grounded approximation with gentle motion, not a photorealistic 3D twin.

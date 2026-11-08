---
phase: 06
title: "Git doctor cut: incident rows and `git-land-recovery` leave doctor; one `git-incidents` pointer row"
status: completed
depends_on: [04, 05]
parallel: "none (registrations.mjs and git-checks.mjs chains)"
owning_lane: "HARDEN (reviewer: OPC)"
effort: ~0.5d
net_size: "Node −95 / Rust 0 / tests −60 (estimate)"
---

# Phase 06 — Git doctor cut

## Context

Decision 65 (2b, 3a). **Precondition (plan Landing):** P04 is landed and activated on fg-server2, and its owner-machine guide section is written, so `fgos git recover` and the `fgos init` call exist everywhere before `--fix` stops recovering. Code read on `fd476d709` (line numbers move after P01–P05; re-read):

- Rows: `registrations.mjs:5485-5493` (loop over `git-worktree-recovery`, `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-native-locks`), bodies `src/setup/git-checks.mjs:42-93`.
- `git-worktree-recovery` (`git-checks.mjs:48-53`, 1 437 ms: the whole worktree recovery view), `git-native-locks` (`:86`), `no-stuck-merge-abort` check (`registrations.mjs:3408-3421`, registration `:3442-3446`; fix gone in P01).
- `git-operation-journal` (`git-checks.mjs:71-85`) mixes readiness (fence missing, WAL not initialized, listing incomplete, WAL errors) with incidents (pending operations, retained Land, retention note).
- Fix `git-land-recovery` (`registrations.mjs:5514`) → `fixGitOperationRecovery` (a one-line call to the P04 module).

## Requirements

- **Delete** `git-worktree-recovery`, `git-native-locks` and `no-stuck-merge-abort` rows; their judgments are `fgos git status` parts (P04): `worktrees`, `nativeLocks`, `mergeInProgress`.
- **`git-operation-journal` keeps readiness only:** fence missing (fail, `fgctl upgrade`), not initialized (fail, `doctor --fix` `git-wal-dir`), listing incomplete or WAL errors (fail: a WAL fgOS cannot read stops every Git write). Pending operations, retained Land candidates and the retention note leave the row (they are `fgos git status` parts). Its description says so.
- **`git-incidents` pointer row** (new id; description "read-only pointer: open Git incidents, read and recovered through fgos git status / fgos git recover"). Counts from the facts the run already holds (`gitFacts` non-recovery inspection, shared through `run.once`): `journal.pendingCount`, `nativeLocks.length`, `mergeInProgress` (moved MERGE_HEAD read, one `resolveCommit`). Always `passed: true`; message `warning: <n> pending Git operation(s), <m> native lock(s)[, a merge in progress]; run \`fgos git status\` (\`fgos git recover\` settles interrupted operations)` or, at zero, `no pending Git operation, native lock or merge in progress; worktree and retained-Land findings: \`fgos git status\``. No worktree recovery scan, no retained-Land listing in doctor.
- **Delete the fix** `git-land-recovery` (registration and the wrapper `fixGitOperationRecovery`); the other three Git fixes stay (readiness: driver directories, WAL dir, publication refspecs).
- Git spec §12: the doctor table lists `git-component-compatible`, `git-repository-config`, `git-operation-journal` (readiness), `git-incidents` (pointer); "registered fixes are three"; the worktree/native-lock/MERGE_HEAD rules (G-092, G-112 "doctor only detects") now read "`fgos git status` only detects".
- `CHANGELOG.md`: three Git rows and the Land-recovery fix leave doctor; `git-incidents` points to `fgos git status`; interrupted Land is recovered by `fgos git recover` and `fgos init`.

## Files

**Create:** none.

**Modify:** `src/setup/git-checks.mjs` (cases, wrapper), `src/setup/registrations.mjs` (loop list, MERGE_HEAD row and helpers, fix registration, pointer registration), the P04 module only if the pointer needs a cheap count export; tests `test/setup/git-checks.test.mjs` (`:85-88` id list, worktree/native-lock/pending cases), `test/git/recovery.test.mjs:53` (asserts the journal row's pending message → asserts `git-incidents` count and the `fgos git status` pending list), `test/setup/checks-doctor-config.test.mjs:524-556` (MERGE_HEAD cases), `test/setup/checks.test.mjs`, `test/setup/registrations.test.mjs`; `docs/platform/git/spec.md` §12 and the G-092/G-112 rows; registry contract (inventory and the Git paragraph); `CHANGELOG.md`.

**Delete:** none.

**Tests to retire** (each names its owner):
- `git-checks.test.mjs` worktree-recovery, native-lock and pending-operation row cases → moved to the P04 module's test as `readGitStatus` cases, assertions kept (`test/git/worktree-recovery.test.mjs` already owns the Rust-side facts; do not duplicate).
- `checks-doctor-config.test.mjs:524-556` MERGE_HEAD check cases → one `readGitStatus` `mergeInProgress` case (clean repo null; MERGE_HEAD present → sha and the `main-checkout-reset` next step).
- `recovery.test.mjs:53` pending-message assertion → `git-incidents` count + `readGitStatus().pendingOperations` (one wiring assertion each).

## Net size

Node: three rows and helpers −110, journal narrowing −15, fix −8, pointer +35 → about −95. Tests: moved ±0, MERGE_HEAD cases −25, row cases −40, pointer case +10 → about −60.

## Validation

- FR `test/setup/git-checks.test.mjs test/git/recovery.test.mjs test/git/commit-parent-death.test.mjs test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs test/setup/registrations.test.mjs` + the P04 module test
- `rg -n "'git-worktree-recovery'|'git-native-locks'|'no-stuck-merge-abort'|'git-land-recovery'|fixGitOperationRecovery" src bin test` → nothing
- `npm run fgos:dev -- doctor --json` on fg-server2: four Git rows; `git-incidents` cost ≤ 150 ms (one extra `resolveCommit`); doctor time before/after (expect about −1.6 s)
- Smoke: interrupted-Land fixture → `doctor --fix` leaves it pending, `git-incidents` warns with 1, `fgos git recover` settles it, `git-incidents` shows 0

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A machine activates a release without the fix but also without the door | L × H | Impossible by order: P06 lands after P04, so every release built after P06 contains P04; activation is per release |
| Users keep typing `doctor --fix` for Land | M × L | Merge/approve messages already name `fgos git recover` (P04); the pointer names it |
| WAL-error now fails `git-operation-journal` while pending ops only warn: a corrupt chain hides behind "pending" | L × M | WAL errors stay a failure (readability is readiness); pending is a count |

## Rollback

Revert the merge; re-activate the previous release; `git-land-recovery` is back in `--fix` and the door still exists. No on-disk format change.

## Done when

Four Git rows (three readiness, one pointer); three Git fixes; every moved judgment owned by a `readGitStatus` case; landed with a guide section.

## Lead brief essentials

Check the precondition on the board before starting. OPC reviews. All plan.md lead rules apply.

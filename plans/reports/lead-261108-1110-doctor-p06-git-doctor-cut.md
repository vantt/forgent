# Doctor readiness only, Git doctor cut: lead report

Branch `harden/doctor-p06-git-doctor-cut` from origin/main `7f43295a3` (contains the Git door `85e081b59` and the knowledge cut, active in release 674c76fb), worktree `/home/vantt/projects/forgent-worktrees/harden-doctor-p06`. Reviewer: OPC. Pushed to the branch, not landed.

## What changed

- `src/setup/git-checks.mjs`: `checkGit` no longer takes `portOptions` (nothing reads the Land listing any more) and serves four kinds. Removed: `git-worktree-recovery`, `git-native-locks`, the advisory-reason set, `retainedLandWarning`, the `fixGitOperationRecovery` wrapper. `git-operation-journal` is readiness only: fence missing, WAL not initialized, listing incomplete, WAL errors (all fail; messages now name `fgos git status` for inspection). New `git-incidents` kind: always `passed: true`, counts `journal.pendingCount`, `nativeLocks.length` and `readMergeHead(root)` from the facts the run already holds (one `resolveCommit` extra), message exactly as the phase text.
- `src/setup/registrations.mjs`: row loop is now the four ids with updated descriptions; `no-stuck-merge-abort` check, helper and registration deleted; `git-land-recovery` registration deleted; `readMergeHead` import dropped (now read in `git-checks.mjs`). Three Git fixes remain (`git-driver-directories`, `git-wal-dir`, `git-publication-refspecs`).
- Consumers of the removed row id repointed: `src/run-supervisor/cwd-lock.mjs` (`custody-predecessor-unknown` recovery detail names `fgos git status`), `packages/git/contracts/ports.v1.json` (doctor note), runner architecture doc, Git spec (§10 lock classification, §11 text, §12 table: journal readiness, `git-incidents` pointer, fixes three, G-092/G-112 rows), registry contract (both inventory lines and the Git paragraph), packaging-distribution spec inventories, how-to doctor table (`git-incidents` replaces `no-stuck-merge-abort`), CHANGELOG line. `docs/platform/packaging-distribution/history/distribution-baseline.md` still names the old rows: it is a dated historical record, left.
- Census regenerated (0 undeclared).

## Behaviours and decisions

1. **Retention warning kept, not lost.** The phase text moves the retention note out of the journal row, but `src/setup/git-retention-note.mjs` would then have no caller and its "chains piling up / id ledger at capacity" warning would exist nowhere but raw counts. `git-incidents` appends the note only when it is a `warning:` (past 64 chains, past 7 days, or ledger at capacity); the `info:` form is dropped. One extra line in the pointer; the module and its unit test keep their owner. Git spec §12 states it. Deviation from the phase text, for OPC to confirm.
2. Retained Land candidates and worktree findings (blocked vs advisory reasons) are `fgos git status` parts only, as planned. The blocked-vs-advisory judgment of the old row had no home in the door (it returns raw `issues[].reason`); the tests now assert the reason codes. No fail/warn condition was dropped without a pointer: pending operations, native locks, merge in progress, retention warning -> `git-incidents`; worktree issues, retained Land -> `fgos git status`; interrupted-operation repair -> `fgos git recover` and `fgos init`.
3. Message for a corrupt chain stays a failure on the journal row (WAL errors), as the phase risk table asks.

## Tests: retired and owners

No `readGitStatus` module test existed after the door landed (only the CLI wiring file), so the owner file is new: `test/git/status.test.mjs` (lowest layer that observes the facts).

| Retired | New owner |
|---|---|
| `git-checks.test.mjs` native-locks row case | `status.test.mjs` native locks and merge; `git-checks.test.mjs` one `git-incidents` case (counts and message) |
| `checks-doctor-config.test.mjs` two MERGE_HEAD cases | `status.test.mjs` `mergeInProgress` clean null / sha; the `fgos main-checkout-reset` next step is `recover`, owned by `test/cli/fgos-git.test.mjs` |
| `git-checks.test.mjs` retained-Land-with-pending and failed-listing row cases | `recovery.test.mjs` (pending then retained candidate with pins); `status.test.mjs` part-failure-in-place |
| `git-checks.test.mjs` real-journal retained-chains info case | `status.test.mjs` `journal.retention` counts |
| `recovery.test.mjs` journal-row retained-warning case | same file, rewritten: `git-incidents` count, `pendingOperations`, `retainedLand`, journal row passes |
| `worktree-recovery.test.mjs` row cases (3) | same file: `readGitStatus().worktrees.issues` reason codes (same fixtures, same reasons asserted; the advisory-vs-failing `passed` split is gone with the row) |

Retention thresholds keep `git-checks.test.mjs` (pure unit, retitled). The pointer's retention append has no real-journal proof (needs 65 chains); the threshold logic is the unit test's. Inventory pins: `checks.test.mjs` row list and the registry contract both updated; `registrations.test.mjs` passed.

## Net size (vs estimate -95 Node / 0 Rust / -60 tests)

| | Estimate | Measured |
|---|---|---|
| Node (`src`, `bin`) | -95 | -49 (+26 / -75) |
| Rust | 0 | 0 |
| Tests | -60 | -9 (+98 / -107), of which the new status file is +59 |

Both miss the estimate: the pointer plus the retention append cost more than the planned +35, `git-checks.mjs` keeps the fix helpers and floor, and the plan counted the moved MERGE_HEAD/native-lock cases as free while no `readGitStatus` case file existed to receive them. Without the new owner file the tests are -68. Plan total (Node <= -700, tests <= -250) is carried by other phases; flagged for P10.

## Doctor rows and time

Activated release 674c76fb on the main checkout: 115 rows, `fgos doctor --json` 25.25 s and 26.01 s (before). Dev host on this tree: 113 rows (six Git/merge rows to four: `git-incidents` replaces three removed rows, minus `no-stuck-merge-abort`); the four Git rows pass, `git-incidents` printed the zero-incident sentence plus the retention warning (697 retained chains, 20 days). The dev-host wall time (49-59 s) includes a Cargo rebuild per invocation, so it is not comparable and no after number is claimed; the removed worktree-recovery scan was 1.4 s in the audit. Timing after activation is for the landing smoke.

## Gate (ran myself)

- Focused, all green: git-checks, status, recovery, worktree-recovery, commit-parent-death, checks, checks-doctor-config, registrations, native-load, architecture, custody-successor-admission, fgos-git (cli), merge-gate, doc-health, check-decision-citation-drift (one drift finding caught and fixed: editing a G-092 row changed a baselined ADR citation, so I added the gloss).
- `rg "'git-worktree-recovery'|'git-native-locks'|'no-stuck-merge-abort'|'git-land-recovery'|fixGitOperationRecovery" src bin test` returns nothing.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared, census regenerated and committed.
- No Rust change: clippy, fmt, msvc and darwin checks not applicable.
- Full `node scripts/run-tests.mjs` (HERDR and CLAUDE vars unset, private target, no COOK hold active): tests 8588, pass 8555, fail 1, skipped 32, no `run-tests: ERROR` lines. The one fail is the frozen V7n addendum (known). Suite line: +8 -10 test() calls, 0 new spawn sites; 9 duplicate-title warning is not from this change (none of the titles are mine).
- Smoke from the phase (interrupted-Land fixture): covered by `recovery.test.mjs`: pending (`git-incidents` warns with 1, status lists it) -> `recoverGitOperations` -> `git-incidents` zero. The "doctor --fix leaves it pending" half is true by construction (no registered fix touches the WAL pending list); not run through the CLI.

## For OPC and the landing

- Review: `git-incidents` retention append (decision 1); `git-operation-journal` message wording; the cwd-lock recovery `check` value now `fgos git status`.
- Landing: rebase, build, stage, activate, `fgos doctor --json` (expect 113 rows, four Git rows), time it; owner-machine guide section for this phase; `fgos git status` on the owner machine. Rollback: revert the merge; `git-land-recovery` returns, the door stays.

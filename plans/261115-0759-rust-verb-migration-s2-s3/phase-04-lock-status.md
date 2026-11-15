---
phase: 4
title: "`lock-status` native, and the first store-touching wiring proof"
status: pending
effort: 2.5d
wave: C
step: S2
blockedBy: [0, 3]
flipAfter: [1]
---

# Phase 04: `lock-status` native

`lock-status` is not a wrapper: 341 lines of Node scan the registry rows, list holders, judge problems and read
the pre-commit beacon (`src/runner/lock-status.mjs`), with addon calls only at the leaves. The scan moves into the
holder-lock crate. It is `store: read`, so it is the first native verb that opens the store: this phase proves the
F0 doors through the binary (program risk row "Doors wired in the host with no native consumer").

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p04`, cut after 03 landed on `s2`.
Report slug `s2-p04-lock-status`.

## Context

- Registry `src/cli/command-registry.mjs:2493-2508`: no flags, `store: 'read'`. Arm `bin/fgos.mjs:3793-3794`:
  `collectLockStatus({ fgosDir: dir })`; data `{ mainCheckout, locks, problems, beacon }`; exit 0, per-row errors inline.
- `src/runner/lock-status.mjs`: imports (11-20) holder-lock (`lockEntry`, `loadLockRegistry`, `resolveLock`, `probe`,
  `guaranteeFor`, `fileHolders`, `predecessorState`, `resolveLockRoot`), `hot-lock.mjs`, `process-identity.mjs`,
  `dispatch/assignment-layout.mjs` (`listAssignmentRuns`), `execution/case-run-paths.mjs` (`runsRoot`),
  `run-supervisor/client.mjs` (`listOpenAttemptDirs`), `main-checkout-activity.mjs` (`readBeacon`).
  `existingInstances` (47-71) globs a registry template; `LOCK_FILES` (~120-150) restates each row's files by hand;
  `cutOverLockFiles` :162 (only its own test reads it); `UNKNOWN_JUDGE_GRACE_MS` :222; `collectLockStatus` :307.
- Rust: `port.rs` `probe` 1536, `holders` 1565, `guarantee` 1571; `predecessor.rs`; the registry reader; `hot_record.rs` (03).
- Doors on a native call (`apps/fgos/src/invocation_doors.rs:283-355`): call check, root (`caller-tree`), admission
  (`store: read` passes from a frozen worktree with a warning), start trigger only when dispatched, end trigger in
  `leave` (Linux only, `lifecycle::platform_supported`).

## Requirements

1. `packages/holder-lock/rust/src/status.rs`: `collect(fgos_dir, lock_root, now) -> LockStatus` with Node's keys and
   order. Instances come from **one rule**: the registry template glob (today's `existingInstances`), with the
   run-scoped placeholders resolved as 00 F3 recommends; `LOCK_FILES` has no Rust copy. If F3 finds a row where the
   glob and `LOCK_FILES` differ, the report names it and the parity case shows which answer the host gives (the
   registry's, with the reason).
2. Problems judgement (unknown-judge grace, predecessor domains, windows-job, hot records through `hot_record.rs`,
   foreign holders) ported rule by rule; each rule one unit test.
3. Beacon: `packages/holder-lock/contracts/main-checkout-activity.v1.json` (fields from 00 F5), a vector row the Node
   writer's test (`test/runner/main-checkout-activity.test.mjs`) and the Rust reader both check; Rust reads the file,
   never refreshes or deletes it (registry text: "never creates, refreshes, or deletes a lock file or the beacon").
4. Host: operation `holder-lock.status` (read) in `catalog.rs`, provider, projector (no flags), annotation
   `{ operation_id: "holder-lock.status", owner_path: "packages/holder-lock/rust" }`, `native: true`; output per
   00 F8 (the envelope Node prints).
5. Wiring proof (`apps/fgos/tests/cli_tests.rs`, one test, the plan's exit criterion 6): in a temp project with a
   linked worktree whose `.fgos` is frozen, `lock-status` from the worktree exits 0 with the admission warning on
   stderr; `lock-status --dir <non-project>` exits 4 `dir-invalid` with exactly one record in the caller's
   `.fgos/logs/invocation-faults.jsonl` and none under `--dir`; on Linux the end trigger runs (observed as a seal or an
   `event-store-end-trigger` record, whichever the fixture's store gives), and the same test asserts none off Linux.
   A PATH `node` wrapper that fails when started proves no Node process (exit criterion 2).
6. Parity table `lock-status.cases.mjs`: all free; main checkout held (a fixture holder); a parametric merge-slot row;
   a stale hot record; a beacon present; a dead predecessor; from a frozen worktree; `--dir` forms.
7. Delete: `src/runner/lock-status.mjs`, its static import (`bin/fgos.mjs:104`) and `ARM_STATIC_IMPORTS` line
   (`test/architecture.test.mjs:1692`), the arm, `test/runner/lock-status.test.mjs` (10), the lock-status cases of
   `test/cli/fgos-claim-2.test.mjs:245-300` (4) and `test/cli/fgos-claim.test.mjs:93` (1); `readBeacon` if no other
   reader is left (00 F5); its `suite-baseline.json` row (334).
8. `doors` row "report the registry locks": patterns `\bLOCK_FILES\b`, `\bexistingInstances\b`,
   `export function collectLockStatus`, `fn collect\(` narrowed to `status.rs`'s signature; allowed
   `packages/holder-lock/rust/src/status.rs`. Row "read the main checkout activity beacon":
   `main-checkout-activity\.json`; allowed the Node writer `src/runner/main-checkout-activity.mjs` (reason: the
   pre-commit hook writes it), `status.rs` (reader), `src/cli/command-registry.mjs` (reason: description text);
   `retiredBy: "the pre-commit hook's writer moves to Rust"`.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| foreign holder, predecessor domains, windows-job, hot records, grace, beacon (10 cases) | `test/runner/lock-status.test.mjs` | `status.rs` unit tests (one per rule) + beacon vector |
| all free, main held, parametric merge-slot row through the CLI | `fgos-claim-2.test.mjs:245-300` | `status.rs` (rows) + the `cli_tests.rs` wiring case (CLI shape) |
| warning from a `.fgos`-less worktree | `fgos-claim.test.mjs:93` | `store_admission.rs` (rule) + `cli_tests.rs` wiring case |
| manifest says read-only | `fgos-claim-2.test.mjs` | `fgos-manifest.test.mjs` (registry data), unchanged |
| a fenced lock as seen by lock-status | `fgos-lock-fence.test.mjs:25` | 05's `fence.rs` test reads `status::collect` after a fence |

## Files

- Create: `packages/holder-lock/rust/src/status.rs`, `packages/holder-lock/contracts/main-checkout-activity.v1.json`, `lock-status.cases.mjs` (deleted by 11).
- Modify: `packages/holder-lock/rust/src/lib.rs`, `catalog.rs`, `apps/fgos/src/{main.rs,cli_projector.rs,cli_presenter.rs (only per 00 F8)}`,
  `apps/fgos/tests/cli_tests.rs`, annotations, registry, generated route files, `bin/fgos.mjs`, `test/architecture.test.mjs`,
  `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-claim.test.mjs`, `test/runner/main-checkout-activity.test.mjs` (vector row),
  `docs/architecture-manifest.json`, `test/suite-baseline.json`, census, the parity runner's `TABLES`.
- Delete: `src/runner/lock-status.mjs`, `test/runner/lock-status.test.mjs`.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock -p fgos --all-targets -- -D warnings`;
  `cargo test -p fgos-holder-lock -p fgos`; msvc and darwin `cargo check -p fgos-holder-lock -p fgos` (holders are
  `unlistable` off Linux: the status rows must say so, as Node's do)
- `node scripts/export-command-selectors.mjs --check`
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/cli/fgos-claim-2.test.mjs test/cli/fgos-claim.test.mjs test/cli/fgos-lock-fence.test.mjs test/runner/main-checkout-activity.test.mjs test/setup/holder-lock-checks.test.mjs test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`

## Risk and rollback

- The template glob finds a lock file `LOCK_FILES` skipped, or the reverse (M x M): 00 F3 compares row by row; parity shows the answer.
- The end trigger now runs after a `lock-status` that Node also wrapped (`opensStore`), so no new cost; measure it anyway (latency criterion).
- Rollback: revert the phase.

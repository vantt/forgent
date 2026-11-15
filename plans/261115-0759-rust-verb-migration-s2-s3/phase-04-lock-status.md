---
phase: 4
title: "`lock-status` native, and the first store-touching wiring proof"
status: completed
effort: 3d
wave: C
step: S2
blockedBy: [0, 3]
flipAfter: [1]
---

# Phase 04: `lock-status` native

`lock-status` is not a wrapper: 341 lines of Node scan the registry rows, list holders, judge problems and read the
pre-commit beacon (`src/runner/lock-status.mjs`), with addon calls only at the leaves. The scan moves into the
holder-lock crate; the run-scoped instances (Execution's directories) are listed by the host and passed in (D6), so
holder-lock never learns an upper layer's layout. It is `store: read`, so it is the first native verb that opens the
store: this phase proves the F0 doors through the binary (program risk row "Doors wired in the host with no native consumer").

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p04`, cut after 03 landed on `s2`.
Report slug `s2-p04-lock-status`.

## Context

- Registry `src/cli/command-registry.mjs:2493-2508`: no flags, `store: 'read'`. Arm `bin/fgos.mjs:3793-3794`:
  `collectLockStatus({ fgosDir: dir })`; data `{ mainCheckout, locks, problems, beacon }`; exit 0, row errors inline.
- `src/runner/lock-status.mjs`: imports (11-20); `existingInstances` (47-71) globs a registry template; `LOCK_FILES`
  (128-151) restates each row's files by hand, three of them from Execution layouts: `advance` from `runsRoot`
  (`<main>/.fgos/workflow-runs`, `src/runner/execution/case-run-paths.mjs:17`), `recovery` from `listAssignmentRuns`
  (`src/runner/dispatch/assignment-layout.mjs:59-92`, depth limit and symlink barrier), `attempt.lock` from
  `listOpenAttemptDirs` (`src/run-supervisor/client.mjs:76`, used at `lock-status.mjs:170`); `cutOverLockFiles` :162
  (only its own test reads it); `UNKNOWN_JUDGE_GRACE_MS` :222; `collectLockStatus` :307.
- Rust: `port.rs` `probe` 1536, `holders` 1565, `guarantee` 1571; `predecessor.rs`; the registry reader
  (`scope.rs:37-47`, lookup by name only: the template glob is new code); `hot_record.rs` (03). `fgos-run-supervisor`
  depends on `fgos-holder-lock`, so holder-lock cannot call it.
- Doors on a native call (`apps/fgos/src/invocation_doors.rs:283-369`); admission warns when the store is **missing**
  from a linked worktree (`packages/git/rust/src/store_admission.rs:149-157`); only `--dir ""` is `dir-invalid`
  (`invocation_root.rs:138-158`).
- Beacon: written by the pre-commit hook through `src/runner/main-checkout-activity.mjs`; read by `readBeacon` for the
  report and for the commit gate (`main-checkout-activity.mjs:56, 109, 113`).

## Requirements

1. `packages/holder-lock/rust/src/status.rs`: `collect(StatusRequest { fgos_dir, lock_root, run_instances, now }) -> LockStatus`
   with Node's keys and order. Instances of every row come from **one rule**, the registry template glob (today's
   `existingInstances`); for the run-scoped placeholders (`<workflowRunDir>`, `<runDir>`, the attempt directories) the
   caller passes the directories in `run_instances`. `LOCK_FILES` has no Rust copy; where 00 F3 finds a row whose glob
   and `LOCK_FILES` differ, the report names it and the parity case shows the host's answer (the registry's, with the reason).
2. `apps/fgos/src/wiring/run_dirs.rs` (D6): the three run-directory listers (workflow runs, assignment runs with the
   depth limit and symlink barrier, open attempt directories), a twin of the Node listers until S6a, with one fixture
   `test/rust-host/fixtures/run-dirs-vectors.json` (directory trees and the lists each yields) read by these Rust tests
   and by a Node test of the three Node listers (in the file that owns them). `doors` row "list run directories (twin)":
   patterns `export function (?:scanAssignmentLayout|listOpenAttemptDirs)\b`, `export const runsRoot\b`, `workflow-runs`
   (string literal); allowed the three Node files and `run_dirs.rs`; `retiredBy: "S6a: the runner's layouts move to Rust"`.
3. Problems judgement (unknown-judge grace, predecessor domains, windows-job, hot records through `hot_record.rs`,
   foreign holders) ported rule by rule; each rule one unit test.
4. Beacon: `packages/holder-lock/contracts/main-checkout-activity.v1.json` (fields from 00 F5; owner holder-lock §14,
   main checkout one door, unless 00 F5 names another), with vector rows that the Node writer's and reader's test
   (`test/runner/main-checkout-activity.test.mjs`) and the Rust reader both check. Rust only reads it. `doors` row
   "main checkout activity beacon": `main-checkout-activity\.json`; allowed `src/runner/main-checkout-activity.mjs`
   (reason: the pre-commit hook's writer and the commit gate's reader), `status.rs` (reader for the report),
   `src/cli/command-registry.mjs` (reason: description text); `retiredBy: "the pre-commit hook and the commit gate move to Rust"`.
5. Host: operation `holder-lock.status` (read) in `catalog.rs`, provider (the host fills `run_instances` from `run_dirs.rs`),
   projector (no flags), annotation `{ operation_id: "holder-lock.status", owner_path: "packages/holder-lock/rust" }`,
   `native: true`.
6. Wiring proof (`apps/fgos/tests/cli_tests.rs`, one test, plan.md exit criterion 6): in a temp project with a linked
   worktree that has no `.fgos`, `lock-status` from the worktree exits 0 with the admission warning on stderr;
   `lock-status --dir ""` exits 4 `dir-invalid` with exactly one record in the caller's `.fgos/logs/invocation-faults.jsonl`;
   with an `eventStore` config section the reader refuses (a deterministic trigger error), a `lock-status` on Linux
   leaves exactly one `event-store-end-trigger` record and, with `FGOS_DISPATCH_DEPTH=1`, also one
   `event-store-start-trigger` record; off Linux none. A PATH `node` wrapper that fails if started proves no Node process.
7. Parity table `lock-status.cases.mjs`: all free; main checkout held (a fixture holder); a parametric merge-slot row;
   a held `advance` lock in a workflow run and a `recovery` lock in an assignment run; a stale hot record; a beacon; a
   dead predecessor; from a worktree without `.fgos`; `--dir` forms.
8. Delete: `src/runner/lock-status.mjs` and its `manifest.files` entry, the static import (`bin/fgos.mjs:104`) and its
   `ARM_STATIC_IMPORTS` line (`test/architecture.test.mjs:1692`), the arm, `test/runner/lock-status.test.mjs` (10), the
   lock-status cases of `test/cli/fgos-claim-2.test.mjs:245-300` (4) and `test/cli/fgos-claim.test.mjs:93` (1), the
   `suite-baseline.json` row (334); the debt entry 03 put on the hot-record row; the owner pointer in
   `test/setup/holder-lock-checks.test.mjs:100` now names `status.rs`.
9. `doors` row "report the registry locks": patterns `\bLOCK_FILES\b`, `\bexistingInstances\b`,
   `export function collectLockStatus`, `pub fn collect\(` (narrowed to `status.rs`'s signature on the first run);
   allowed `packages/holder-lock/rust/src/status.rs`.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| foreign holder, predecessor domains, windows-job, hot records, grace, beacon (10 cases) | `test/runner/lock-status.test.mjs` | `status.rs` unit tests (one per rule) + beacon vector rows |
| run-scoped rows | `lock-status.test.mjs` (through `LOCK_FILES`) | `run_dirs.rs` + `run-dirs-vectors.json` (Node listers' test reads the same file) |
| all free, main held, parametric merge-slot row through the CLI | `fgos-claim-2.test.mjs:245-300` | `status.rs` (rows) + the `cli_tests.rs` wiring case (CLI shape) |
| warning from a `.fgos`-less worktree | `fgos-claim.test.mjs:93` | `store_admission.rs` (rule) + `cli_tests.rs` wiring case |
| manifest says read-only | `fgos-claim-2.test.mjs` | `fgos-manifest.test.mjs` (registry data), unchanged |
| the fenced lock as `lock-status` reports it | the `fgos-lock-fence.test.mjs` case that calls the `lockStatus()` helper (25) after a fence | 05's `fence.rs` test reads `status::collect` after a fence |

## Files

- Create: `packages/holder-lock/rust/src/status.rs`, `apps/fgos/src/wiring/run_dirs.rs`,
  `packages/holder-lock/contracts/main-checkout-activity.v1.json`, `test/rust-host/fixtures/run-dirs-vectors.json`,
  `lock-status.cases.mjs` (deleted by 11).
- Modify: `packages/holder-lock/rust/src/lib.rs`, `catalog.rs`, `apps/fgos/src/{main.rs,cli_projector.rs,routing.rs,wiring/mod.rs}`,
  `apps/fgos/tests/cli_tests.rs`, annotations, registry, generated route files, `bin/fgos.mjs`, `test/architecture.test.mjs`,
  `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-claim.test.mjs`, `test/runner/main-checkout-activity.test.mjs`,
  `test/setup/holder-lock-checks.test.mjs`, the Node run-lister test files (one fixture case each),
  `docs/architecture-manifest.json`, `test/suite-baseline.json`, census, the parity runner's `TABLES`.
- Delete: `src/runner/lock-status.mjs`, `test/runner/lock-status.test.mjs`.

Acceptance addition: the three run-lister rules and the unreachable `lock-not-node-owned` are pinned as parity cases
(facts report section 8).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock -p fgos --all-targets -- -D warnings`;
  `cargo test -p fgos-holder-lock -p fgos`; msvc and darwin `cargo check -p fgos-holder-lock -p fgos` (holders are
  `unlistable` off Linux: the rows say so, as Node's do)
- `node scripts/export-command-selectors.mjs --check`
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/cli/fgos-claim-2.test.mjs test/cli/fgos-claim.test.mjs test/cli/fgos-lock-fence.test.mjs test/runner/main-checkout-activity.test.mjs test/setup/holder-lock-checks.test.mjs test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  plus the Node run-lister tests (`rg -l "scanAssignmentLayout|listOpenAttemptDirs|runsRoot" test`)

## Risk and rollback

- The template glob finds a lock file `LOCK_FILES` skipped, or the reverse (M x M): 00 F3 compares row by row; parity shows the answer.
- The run-lister twin drifts from Node before S6a (M x M): one fixture read by both; the `doors` row names both sides.
- Rollback: revert the phase.

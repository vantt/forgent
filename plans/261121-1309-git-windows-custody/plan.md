---
contract: plan-v1
title: "Git door takes custody on Windows: commit, sync and verify under a held lock, proven on native Windows CI"
status: running
lead: lead:WINCUSTODY
base: 3f009686ddffd026c7aab09d6056659f04390e5a
priority: P1
blockedBy: []
footprint:
  - plans/261121-1309-git-windows-custody/**
  - .github/workflows/release-assets-check.yml
  - packages/holder-lock/rust/src/port.rs
  - packages/holder-lock/rust/src/borrow_windows.rs
  - packages/holder-lock/rust/src/driver/windows.rs
  - packages/holder-lock/rust/src/tombstone.rs
  - packages/holder-lock/rust/src/fence.rs
  - packages/holder-lock/rust/src/lib.rs
  - packages/run-supervisor/rust/src/controller/cwd_lock.rs
  - packages/git/node-addon/src/git.rs
  - packages/holder-lock/rust/src/route.rs
  - packages/process/rust/src/facts.rs
  - packages/process/rust/src/platform/windows.rs
  - packages/process/rust/tests/**
  - packages/holder-lock/rust/tests/**
  - packages/git/rust/src/**
  - packages/git/rust/Cargo.toml
  - Cargo.toml
  - Cargo.lock
  - packages/git/rust/tests/**
  - packages/git/contracts/mutation-census.v1.json
  - packages/supervision/rust/tests/land.rs
  - packages/execution/checkout/tests/**
  - packages/distribution/rust/src/git_gate.rs
  - packages/distribution/rust/src/release_rows.rs
  - packages/distribution/rust/src/workspace.rs
  - packages/distribution/rust/src/init.rs
  - packages/distribution/rust/src/verify.rs
  - packages/distribution/rust/tests/**
  - scripts/build-rust-distribution.mjs
  - apps/fgctl/tests/git_wal_activation_gate.rs
  - test/distribution/native-addon.test.mjs
  - packages/execution/engine/src/assignment_runner/launch.rs
  - packages/execution/engine/src/accounts/state.rs
  - apps/fgos/tests/windows_borrow.rs
  - apps/fgos/tests/windows_git_custody.rs
  - packages/run-supervisor/rust/tests/controller_launch.rs
  - apps/fgos/src/wiring/unit_run_host/verify.rs
  - apps/fgos/tests/windows_cwd_lease_owner.rs
  - apps/fgos/src/wiring/unit_run_host/tests/run_unit.rs
  - docs/platform/holder-lock/spec.md
  - docs/platform/git/spec.md
  - docs/platform/run-supervisor/spec.md
  - docs/platform/packaging-distribution/contracts/activation-binding.md
  - docs/platform/packaging-distribution/contracts/release-manifest.md
  - CHANGELOG.md
source:
  - "owner decision 2026-11-21 option (a): the Git lane builds Windows custody for the Git door, proven on native Windows CI, before S6A deletes the Node execution core"
  - "plans/261118-1341-s6a-execution-tier-rust/phase-19c-run-route-flip.md (Windows lease decision, the two preconditions)"
  - p-nk6xf5laob
  - p-w4cxqq2sbw
created: 2026-11-21
---

# Git door takes custody on Windows

## Outcome
On Windows the Git door runs a scoped commit, a sync, a land and a verify under a held custody lock, exactly as it
does on Linux: a borrowed copy of the held lock reaches the Git ports in the same process, git and hook children run
inside the lock's kill-on-close job with captured output, the WAL opens, the release advertises `git-wal-v1`, and the
controller answers the cwd lease channel for the attempt's whole life. Every piece is proven by a job on native
`windows-latest` CI. After this plan lands, S6A lifts `windows-cwd-lease-holder-missing` and `legacyOn: ['win32']`
and deletes the Node execution core with no second win32 path.

## Facts (prior art, 2026-11-21)
- `BorrowedHandle::new` refuses `Unsupported` first on Windows (`packages/holder-lock/rust/src/port.rs:395`). Its
  Drop takes the file before `Handle::drop`, so a borrowed copy never calls `before_close` (`UnlockFileEx`). A
  `DuplicateHandle` copy shares the owner's lock; the Windows lock belongs to the process that took it (CI run
  44627498081, job "windows lock inheritance probe").
- Git children run through `driver.rs` `BorrowedSpawn` -> `run_borrowed_io(_watched)`, which is Unix only
  (`IoUnsupported`, `port.rs:1240-1271`). `run_borrowed` on Windows already runs a child in a named kill-on-close job
  (`borrow_windows.rs`, holder-lock spec 8.1) but without stdin bytes, captured output or a deadline.
- `require_lock_scope_platform` (`packages/git/rust/src/lib.rs:649`) refuses `git-lockscope-unavailable-windows` on
  every lock-taking port (repository_config, refs, remote, scoped_commit, land); `scoped_commit` `binding()` and
  `checkout-custody-stale`, `native_lock` identity, `restore` and `publication` have their own Unix/Linux gates.
- The WAL directory open and trust check is Linux only (`wal.rs` `Directory::open_trusted`, `git-wal-unsupported`).
- C5: `packages/distribution/rust/src/git_gate.rs:208` refuses `git-wal-v1` off Linux; the fence placement needs Linux
  atomic exchange (`init.rs`); activation-binding.md and release-manifest.md say "Linux only until Windows C5 scan and
  fence admission exist".
- The engine serves `cwdLeaseOwner` only around the supervisor start and `wait_for_binding`
  (`packages/execution/engine/src/assignment_runner/launch.rs` `serving_lease_owner`); an adopted or restarted
  supervisor that declares again gets no answer. `unit_run_host/verify.rs:92-101` refuses a Windows verify under
  custody.
- The Git driver distrusts a linked worktree on Windows (p-nk6xf5laob, `driver.rs` `topology_on_disk`), and worktree
  path arguments reach git in the verbatim `\\?\D:\` spelling (p-w4cxqq2sbw).

## Prior art reused, and what was missing
Reused: the borrowed-handle port and its non-owning Drop, the Windows named-job borrow (`borrow_windows.rs`, job
keeper, `FGOS_LOCK_JOB` hook check), the predecessor record, the controller's `cwdLeaseOwner` endpoint and
`route::serve_requests`, `fgos_process::path::plain_path`, the driver's `text_path` door, the C5 gate and fence
format, the existing `windows-cwd-lease-owner` CI job. Missing, and built here as extensions of those doors (no new
lock, record, verb or config key): the Windows arm of `BorrowedHandle::new` and of `run_borrowed_io`, the Windows
WAL directory trust check, the Windows fence placement and process scan, and a lease endpoint that lives as long as
the custody. This reverses the Git plan's Q6 default (a) (refuse on win32) by the owner's 2026-11-21 decision; the
narrative goes into the Git spec's decision history.

## Acceptance criteria
1. Native Windows CI job `windows git custody` in `.github/workflows/release-assets-check.yml` is green and runs
   `cargo test --release` for `fgos-git` (worktree, WAL, scoped commit, sync, land, restore, refs), `fgos-holder-lock`
   (borrowed handle, borrow I/O, scope) and the land and checkout tests, with none of those cases gated off Windows.
2. Native Windows CI job `windows cwd lease owner` is green and proves: an adopted supervisor re-declares its domain
   on the held lease and is answered; a verify runs under custody.
3. `focused tests (windows-latest)` is green with the distribution C5 cases: a Windows release that claims
   `git-wal-v1` activates with the fence placed, and a live predecessor writer refuses.
4. A Windows unit-run-host test commits a writing Unit's declared paths under custody into the worktree branch
   (`apps/fgos/src/wiring/unit_run_host/tests/run_unit.rs`, run in `windows git custody`).
5. The WAL-backed worktree tests in packages/git/rust/tests/worktree.rs (module `wal_backed`, Linux-only since phase 1)
   run on Windows through the Git ports' Windows proof, by name: killed_move_repairs_only_the_recorded_destination_and_preserves_bytes,
   killed_create_retains_initializing_lock_until_owned_repair, killed_remove_and_partial_prune_are_owned_and_never_repeat_destroy,
   clean_git_refusals_settle_attempts_without_replaying_effects, successful_registered_create_rollback_settles_as_not_completed,
   lock_naming_a_live_process_is_not_a_recovery_finding, lock_naming_a_dead_or_unparseable_or_reused_owner_stays_a_finding,
   missing_checkout_prune_requires_owned_create_and_preserves_unknown_residue,
   missing_owned_detached_history_keeps_its_registration_when_no_delivery_ref_exists, and the five discarding_* cases;
   any that stays Linux-only names its reason.
6. `rg -n "git-lockscope-unavailable-windows" packages apps` returns nothing; `BorrowedHandle::new` and
   `run_borrowed_io` have no Windows refusal.
7. Linux gates stay green: `cargo test` for every touched crate, `cargo clippy -D warnings`, `cargo fmt --check`,
   and `cargo check --target x86_64-pc-windows-msvc` for the touched crates.

## Non-goals
- Lifting `windows-cwd-lease-holder-missing` in the engine, the `legacyOn: ['win32']` route and the Node `run` arm:
  S6A does that once this plan lands.
- macOS WAL and custody (the WAL is Linux only today; macOS keeps its present behaviour).
- The Node addon's Windows handover (`from_acquired_description`): S6A deletes the Node writers.
- A self-hosted Windows runner.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [LockFileEx handle evidence, linked worktree trust and plain paths on Windows, CI job](phase-01-windows-worktree-and-ci-job.md) | - | packages/holder-lock/rust/tests/windows_lockfileex.rs, packages/git/rust/src/driver.rs, packages/git/rust/src/worktree.rs, packages/git/rust/tests/worktree.rs, packages/distribution/rust/src/release_rows.rs, packages/distribution/rust/src/workspace.rs, .github/workflows/release-assets-check.yml | 1 | done |
| 2 | [WAL opens on Windows](phase-02-windows-wal.md) | - | packages/git/rust/src/wal.rs, packages/git/rust/src/wal/**, packages/git/rust/Cargo.toml, Cargo.toml, Cargo.lock | 1 | ready |
| 3 | [Borrowed handle and borrow I/O on Windows](phase-03-holder-lock-windows-borrow.md) | - | packages/holder-lock/rust/src/port.rs, packages/holder-lock/rust/src/borrow_windows.rs, packages/holder-lock/rust/src/driver/windows.rs, packages/holder-lock/rust/tests/**, packages/git/rust/src/driver.rs, packages/execution/engine/src/accounts/state.rs, apps/fgos/src/wiring/unit_run_host/verify.rs, apps/fgos/tests/windows_borrow.rs, packages/git/rust/tests/borrow_deadline.rs, packages/run-supervisor/rust/tests/controller_launch.rs, .github/workflows/release-assets-check.yml | 2 | done |
| 4 | [C5 fence and scan on Windows, git-wal-v1 advertised](phase-04-windows-c5.md) | 2 | packages/holder-lock/rust/src/tombstone.rs, packages/holder-lock/rust/src/route.rs, packages/process/rust/src/facts.rs, packages/process/rust/src/platform/windows.rs, packages/process/rust/tests/**, packages/distribution/rust/src/git_gate.rs, packages/distribution/rust/src/init.rs, packages/distribution/rust/src/verify.rs, packages/distribution/rust/tests/**, docs/platform/packaging-distribution/contracts/activation-binding.md, docs/platform/packaging-distribution/contracts/release-manifest.md, scripts/build-rust-distribution.mjs, apps/fgctl/tests/git_wal_activation_gate.rs, test/distribution/native-addon.test.mjs | 2 | ready |
| 5 | [Git ports take custody on Windows](phase-05-git-ports-windows-custody.md) | 1, 2, 3 | packages/holder-lock/rust/src/fence.rs, packages/holder-lock/rust/src/lib.rs, packages/run-supervisor/rust/src/controller/cwd_lock.rs, packages/git/node-addon/src/git.rs, packages/git/rust/tests/contracts.rs, packages/git/rust/src/lib.rs, packages/git/rust/src/driver.rs, packages/git/rust/tests/worktree.rs, apps/fgos/tests/windows_git_custody.rs, packages/git/rust/src/scoped_commit.rs, packages/git/rust/src/sync.rs, packages/git/rust/src/land.rs, packages/git/rust/src/refs.rs, packages/git/rust/src/remote.rs, packages/git/rust/src/restore.rs, packages/git/rust/src/recovery.rs, packages/git/rust/src/repository_config.rs, packages/git/rust/src/native_lock.rs, packages/git/rust/src/publication.rs, packages/git/rust/tests/scoped_commit_sync.rs, packages/git/rust/tests/land.rs, packages/git/rust/tests/land_crash_matrix.rs, packages/git/rust/tests/land_push_catch_up.rs, packages/git/rust/tests/safe_restore.rs, packages/git/rust/tests/refs_remote.rs, packages/git/rust/tests/recovery_matrix.rs, packages/git/rust/tests/repository_config.rs, packages/git/rust/tests/borrow_deadline.rs, packages/git/rust/tests/support/**, packages/git/contracts/mutation-census.v1.json, packages/supervision/rust/tests/land.rs, packages/execution/checkout/tests/**, .github/workflows/release-assets-check.yml | 3 | ready |
| 6 | [Lease channel for the attempt's whole life, verify under custody](phase-06-lease-whole-life-and-verify.md) | 3 | packages/execution/engine/src/assignment_runner/launch.rs, apps/fgos/src/wiring/unit_run_host/verify.rs, apps/fgos/tests/windows_cwd_lease_owner.rs | 3 | done |
| 7 | [Windows unit-run commit end to end, docs, integration](phase-07-e2e-docs-integration.md) | 4, 5, 6 | apps/fgos/src/wiring/unit_run_host/tests/run_unit.rs, .github/workflows/release-assets-check.yml, docs/platform/holder-lock/spec.md, docs/platform/git/spec.md, docs/platform/run-supervisor/spec.md, CHANGELOG.md | 4 | ready |

Reading check: every phase sits in a later wave than its dependencies; the only hot file,
`.github/workflows/release-assets-check.yml`, has one writer per wave (1, 3, 5, 7); phases 1 and 2 share no path, nor
do 3 and 4, nor 5 and 6. Phase 1 creates the `windows git custody` job; later phases add steps to it.

Execution: the lead opens one linked worktree per phase (`fgos worktree create`) and hands it to a worker with
`fgos run --writes <phase footprint> --worktree <wt> --plan plans/261121-1309-git-windows-custody --phase <id>`.
Windows proof runs by pushing the phase branch and `gh workflow run release-assets-check.yml --ref <branch>`; the
run id goes into the phase row's log line below. The lead rebases and lands each phase with `fgos land <branch>`.

## Owner questions
None open. The owner chose option (a) on 2026-11-21. Every mechanism here extends an existing door; the supervisor
is told of each in the plan-landed message and may stop a phase.

## Risks and rollback
- A `DuplicateHandle` copy closed while a borrow runs might release the owner's lock. Phase 1 measures on Windows CI
  how `LockFileEx` behaves across duplicated and inherited handles before any port uses a copy; if it does not hold, the Windows borrow keeps a
  non-owning reference to the owner's handle instead of a duplicate.
- The Windows WAL trust rule (owner SID, no world-writable ACE) may refuse runner temp directories; phase 2 measures
  it on CI and records the rule in the Git spec.
- The Windows fence placement has no atomic exchange; phase 4 must keep "an old controller can never open the WAL"
  provable or stop and report.
- S6A is paused on its phases 20 and 21 and shares `packages/execution/engine/**`, `apps/fgos/src/wiring/unit_run_host/**`
  and the CI file; this plan edits only the files listed, and S6A rebases after each land.
- Rollback: revert the phase's land commit; each phase is one land.

## Overlap note
plan-contract-check reports an overlap with 261118-1341-s6a-execution-tier-rust. That is intended: by the owner's
decision S6A waits for this plan (its phases 20 and 21 are parked on it) and rebases after each land. Backlog rows
p-nk6xf5laob and p-w4cxqq2sbw are set done through the portfolio owner when phase 7 lands, not by this plan
(docs/backlog.md belongs to 261120-0625-work-data-model).

## Log
- 2026-11-21 lead:WINCUSTODY: plan written against origin/main 3f009686d.
- 2026-11-21 supervisor: no objection. Land bar set by lead:OPC (forgent-67), who reviews every phase before its land:
  the branch, sha and a green native windows-latest run id go to OPC; Linux tests unchanged; phases 1, 2 and 5 rest on
  the measured LockFileEx duplicated/inherited-handle test, which is phase 1's first step. Each land is reported to
  the supervisor.
- 2026-11-21 lead:WINCUSTODY: phase 2 needs windows-sys in packages/git/rust/Cargo.toml; packages/git/rust/Cargo.toml, the root Cargo.toml (a windows-sys feature such as Win32_Security_Authorization, if the ACL read needs it) and Cargo.lock added to its footprint.
- 2026-11-21 lead:WINCUSTODY: phase 4 worker found no atomic file-to-directory replace on Windows (the tombstone lives in
  holder-lock tombstone.rs). Decided: two-step placement that fails closed (see phase 4 step 1); tombstone.rs added to
  phase 4. Linux keeps the exchange.
- 2026-11-21 lead:WINCUSTODY: phase 4 found the C5 scan Linux-only (`fgos_process::facts::scan`, holder-lock route.rs
  `quiesce-scan`). Added to phase 4: the Windows arm of `facts::scan` (argv, cwd, same user) and of `quiesce-scan`.
- 2026-11-21 lead:WINCUSTODY: phase 4 also writes the release build's per-target capability list, the fgctl activation
  gate test and its Node test.
- 2026-11-21 lead:WINCUSTODY: measured on native windows-latest (CI 44875845772, asserted from 44878105727): closing a
  DuplicateHandle copy leaves the owner's lock held; LockFileEx through the copy is WouldBlock; UnlockFileEx through the
  copy frees the owner's lock; a live copy keeps the lock after the owner closes. So the Windows borrowed handle
  duplicates and never unlocks, and lives no longer than its owner. Phase 3 started on that answer.
- 2026-11-21 lead:WINCUSTODY: phases 1, 2, 3, 4 and 6 committed on branches wincustody/p1..p6 (each rebased on p1 with
  its own step in `windows git custody`); phase 1's Windows code proof green in CI 44878105727 (topology 3/3,
  windows_lockfileex 16/16). The unit-run-host tests live in the binary (`wiring::unit_run_host`); phase 7's path fixed.
- 2026-11-21 lead:WINCUSTODY: CI 44881208297/44881213276: on Windows `run_borrowed_io` took `HelperExe::current()` as its
  job keeper, which a test harness cannot serve ("job-keeper did not acknowledge"). Decided: `run_borrowed_io(_watched)`
  take an explicit `&HelperExe` like `run_borrowed`; every caller moves in the same change (git driver, verify, engine
  accounts state, tests); production passes the current executable. Windows proofs of borrow I/O and of the Git ports
  therefore run from apps/fgos/tests with the fgos binary as helper (existing pattern: windows_borrow.rs). Phase 6's
  re-declare proof is green in that run (the lease answers a later declaration). Release-assets-check split agreed with
  lead:WINCI: this plan owns only the `windows-git-custody` job block.
- 2026-11-21 lead:WINCUSTODY: phase 1 DONE, landed 2838b1682 after OPC MERGE (CI 44881148894: windows git custody,
  windows lock inheritance probe, windows cwd lease owner, msvc assets, focused ubuntu green; focused windows red only on
  p-xh3zdvzyip). OPC notes carried: phase 5 acceptance names the WAL-backed worktree tests; phase 5 adds a doc line to
  driver.rs `spelling()` saying the lexical `..` fold is right only because admin dirs hold no symlinks.
- 2026-11-21 lead:WINCUSTODY: phase 3 DONE, landed 85af82c86; phase 6 DONE, landed 25df16754 (both OPC MERGE; CI
  44884080041 and 44884158383: windows git custody and windows cwd lease owner green, incl. windows_borrow 13/13 and the
  lease answering a later declaration). After review, phase 6's verify names its platform shell inline under #[cfg] so
  the spawn census resolves it (land gate), census regenerated; told OPC.
- 2026-11-21 OPC follow-up for S6A (phase that enables Windows addon lands), not this plan's scope: in the Node git
  addon on Windows `HelperExe::current()` is node.exe, which serves no job-keeper role; the addon must pass the
  activated release's host binary from the manifest. Phase 5 makes the Git driver carry an explicit helper.
- 2026-11-21 OPC note for S6A/phase 5, no action now: `cmd /C <command>` through std::process::Command gets MSVC
  argument quoting, which cmd parses differently; a Windows verify command with quotes or & | ^ may mis-parse; use
  raw_arg for the cmd line if such commands occur.
- 2026-11-21 lead:WINCUSTODY: phase 5 round 1 committed 27f538bcc. Found three copies of the `dispatch-cwd` directory
  key (holder-lock fence.rs Unix-only, run-supervisor cwd_lock.rs both OS, Node-compatible; git refs file_key) and a
  real mismatch: git's Windows custody key used raw FILETIME (100 ns since 1601), the controller's lease key uses ns
  since 1970, so the Git door would probe a lock file nobody holds. Decided: one door in holder-lock (the lowest layer):
  `cwd_dev_ino` with the Node-compatible Windows arm moved from run-supervisor; run-supervisor and git call it; copies
  deleted. The Node addon refuses lock-taking ops on win32 locally (`git-lock-handover-unsupported`, its Windows handover
  is a non-goal and S6A deletes it) so `require_lock_scope_platform` can be deleted.

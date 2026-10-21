---
phase: 01
title: "Red tests for the seven High defects"
status: pending
depends_on: []
parallel: "runs first; may run in parallel with phase 02 (disjoint files); every fix phase (03, 04) starts after this phase is committed"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests +160 (estimate)"
---

# Phase 01 — Red tests for the seven Highs

## Context

[plan.md](plan.md) Facts; arbitration §3 rows F-A1+RT-M4, F-A3, RT-M3, RT-M1, RT-M2, RT-M5, S-E1; red-team report sections RT-M1…RT-M5; proposal rule "no High stays unreproduced". The repo convention on red commits: `.githooks/pre-commit` runs no test suite (`rg "npm test|run-tests|cargo test" .githooks/pre-commit` → nothing), `main` must be green at merge (AGENTS.md L5 question 5), and this layer merges as one track branch. So a failing-by-design test may be committed on the track branch `harden/t0-process-facts-door` and must be green by the merge; no `skip`, no env switch, no test-only branch in production code.

## Requirements

- One owning test per High, named in plain words, in the file that owns the module (design principle 8). A new file only where the module has no owning file today, with the reason in the test header.
- Each test is red on current main on Linux where the defect is observable on Linux; where it is not (RT-M5's Windows half), the test pins the contract and the phase report says "pin, green on Linux, red on Windows".
- No production code changes in this phase. No mocks of the OS: real child processes, real files under the test's temp root (`test/helpers/process-tmp-root.mjs`).
- Each test's commit message names the behaviour and says which existing test, if any, came closest and why it did not own it.

## Files

**Create**
- `test/runner/stop-processes-inside.test.mjs` — new: `src/runner/dispatch/stop-processes-inside.mjs` has no owning test (`rg -l "stopProcessesInside|processesInside" test` → nothing); its callers are `src/runner/dispatch/confinement/cleanup.mjs:218` and `src/runner/dispatch/worker-home.mjs:181`.
- `test/process/one-door.test.mjs` — new boundary proof of the one-door invariant for process facts, modelled on `test/git/one-door.test.mjs:1-12`: a static scan of `src/` and `bin/` that fails on any `/proc/` read or any `process.kill(` outside an allowlist. Allowlist at creation, each entry with its reason: for `process.kill(`, the three own-child group kills `src/runner/dispatch/transport.mjs:369`, `src/runner/dispatch/provider-credential-probe.mjs:113`, `src/holder-lock/index.mjs:454` (arbitration §A #14) and the thin client `src/runner/dispatch/process-identity.mjs` until phase 2 empties it; for `/proc/`, the T1/T4/T5 readers the parent phase 01 lists: `src/holder-lock/driver.mjs` (fd scan, T1), `src/holder-lock/fences.mjs` (`parentPid` self-exclusion chain only, `:412-421`; fences go with R4 in T1), `src/setup/holder-lock-checks.mjs` (T1), `src/setup/run-supervisor-checks.mjs` (T4), `src/runner/dispatch/confinement/probes/harness.mjs` and `src/runner/dispatch/confinement/drivers/bwrap.mjs` (T5), plus `process-identity.mjs` until phase 2. Every other site on main (`rg -n "process\.kill\(|/proc/" src bin` on `d95e0783f`: `gateway-control.mjs:292,307`, `stop-processes-inside.mjs:22,48-49,64,70`, `lock-fence.mjs:50,61,75`, `run-lock.mjs:37`, `hold-transport.mjs:53`, `fences.mjs:100`, `provider-credential-renewal.mjs:707`, `registrations.mjs:5510,6021,6063,6116`) makes it red. Phases 3 and 6 flip it.

**Modify (tests only)**
- `test/runner/gateway-control.test.mjs` — add after `:215`: (1) "stopGateway never signals a process that is not the recorded gateway: a registry entry whose pid belongs to an unrelated child gets no signal and stop refuses by name" (the red-team reproduction: spawn a child, write `gateway.json` with its pid and `startedAt: 1999-01-01…`, call `stopGateway`, assert the child is still alive and the error is named; today it is killed); (2) "startGateway reports an immediate exit within one poll, not after the 30 s timeout" (RT-M4: a `binaryPath` that exits at once; today `pidExists` sees the zombie while `sleepSync` blocks libuv's reaper, `:239`); (3) "stopGateway keeps gateway.json and fails by name when the process survives SIGKILL" (observable with a child that is a zombie: `stopGateway` today unlinks at `:314`). Existing case `:215` ("escalates to SIGKILL … and still clears the registry") is **retired with (3)** as behaviour reversed; name it in the commit.
- `test/cli/fgos-lock-fence.test.mjs` — add beside `:192`: "fenceHotRecord on a holder that died between judge and signal returns at once and clears the record; it never waits TERM_WAIT_MS on a dead pid" (RT-M3 `null === null`, `src/runner/lock-fence.mjs:177-192`: write a hot record for a child, kill and reap the child, call `fenceHotRecord`; assert wall time < 1 s and no `lock-fence-still-held`; today 8 s and the throw). Import of `process-identity.mjs` at `:214` stays until phase 2 migrates it.
- `test/run-supervisor/cancel-registry.test.mjs` — add after `:58`: "the cancel request's self tuple uses the pidNs form the supervisor compares (`pid:[N]` on Linux, `none` elsewhere)" (RT-M5, `cancel-registry.mjs:79` writes digits only; the Rust comparison is `packages/run-supervisor/rust/src/supervise/terminal.rs:306-313`). Red on Linux.
- `test/run-supervisor/direct-cutover.test.mjs` — add one case: "every envelope deadline carries a string bootId on every platform" (reads the envelope `direct-launch.mjs:130-138` writes; green on Linux, red on Windows; a pin that phase 3's `?? 'unknown-boot'` keeps).
- `packages/process/rust/tests/containment_pgroup.rs` — add: `spawn_in_never_makes_the_caller_a_subreaper` (RT-M1): read `PR_GET_CHILD_SUBREAPER` via `libc::prctl` before and after `LinuxPgroup::spawn_in`; assert unchanged; today `become_subreaper()` at `containment/linux.rs:243` flips it. The existing `:101` manual `libc::kill(escape_pid, SIGKILL)` stays until phase 4.
- `packages/process/rust/src/containment/linux.rs` — append a `#[cfg(test)] mod` with `pgroup_state_reports_unknown_when_a_seen_member_cannot_be_judged`: a dead leader plus `seen = [ProcTuple { host: "other-host", ..leader }]` must give `DomainState::Unknown`; today `:417-420` gives `Empty`. `pgroup_state` is `pub(crate)`, so the proof lives in-crate (no public path reaches the fold without a real domain). Same shape appended to `containment/macos.rs` for `tree_state` (`:175-188`), `#[cfg(target_os = "macos")]`.
- `test/process/process-facts-vectors.test.mjs` — no change; its `:72` case ("a record without a pid is held, never dead") is named here as the one owning proof of S-E1's policy "unknown is never reclaimed" that phase 2 keeps while retiring the copies in `test/runner/process-identity.test.mjs:76` and `test/runner/run-lock-identity.test.mjs:71`.

**Delete**: none. **Tests to retire**: `test/runner/gateway-control.test.mjs:215` (behaviour reversed by F-A1; owner of the new behaviour is case (3) above).

## Steps

1. Create the worktree with ak-cook on the track branch; run `node scripts/run-tests.mjs test/runner/gateway-control.test.mjs` once to confirm the harness stages a host and addon (`run-tests.mjs:586-590`).
2. Write the seven tests above in the order gateway, stop-processes-inside, lock-fence, cancel-registry, direct-cutover, containment_pgroup, linux.rs/macos.rs unit, one-door. For each, run it alone and paste the red output into the phase report.
3. Commit each test on its own with the behaviour sentence; the one-door scan last.
4. Report: table "test | file | red on main (yes/no, why) | fix phase | owner after the fix".

## Verification (exact)

- `node scripts/run-tests.mjs test/runner/gateway-control.test.mjs` → the three new cases fail, the rest pass.
- `node scripts/run-tests.mjs test/runner/stop-processes-inside.test.mjs` → red. Pid reuse cannot be forced in a test, so the proof pins the observable defect of F-A3 instead: "stopProcessesInside names the identities it signals (`{pid, startTime}`), never a bare pid" asserts the result shape of `processesInside` and the exclusion of `process.pid`/`process.ppid`; today `:33-53` returns numbers. Phase 3 flips it when `scan` views are returned and signalled through `signalByIdentity`, and adds the reused-pid `IdentityMismatch` wiring case there (the Rust owner of the reuse rule is `packages/process/rust/tests/signal_identity.rs:44-57`).
- `node scripts/run-tests.mjs test/cli/fgos-lock-fence.test.mjs` → the new case fails on wall time.
- `node scripts/run-tests.mjs test/run-supervisor/cancel-registry.test.mjs` and `test/run-supervisor/direct-cutover.test.mjs`.
- `cargo test -p fgos-process --test containment_pgroup spawn_in_never_makes_the_caller_a_subreaper` → fails; `cargo test -p fgos-process --lib pgroup_state_reports_unknown` → fails.
- `node scripts/run-tests.mjs test/process/one-door.test.mjs` → fails listing the exact sites of the Facts section.

## Net size

Node 0, Rust 0, tests +160 (seven tests plus the one-door scan ≈ 60 lines).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A red test is flaky instead of red (timing on a loaded machine) | M × M | Assert on observable state (signal received, record present, result shape), not on wall time alone; the lock-fence case asserts wall time < 1 s against an 8 s defect. |
| The one-door scan over-matches comments or strings | M × L | Reuse the lexer of `scripts/lib/git-spawn-match.mjs` as `test/git/one-door.test.mjs:12` does; allowlist by file path with a reason per entry. |
| RT-M2's in-crate test collides with phase 4's edit of the same file | H × L | Phase 4 starts after this phase is committed; the module is appended at the end of the file. |

## Rollback

Revert the test commits; nothing else changes.

## Done when

Seven committed tests, each red on main or marked pin with a reason, the retirement of `gateway-control.test.mjs:215` named, and the report table filled.

## Lead brief essentials

Delete list: none (tests only). Find the owning test before writing a new one: the two new files are justified above; everything else goes into the named existing file. Report Δ-lines per language. Report only what you saw yourself (paste the red output). No production edits. Report name from `fgos convention name --json` under `plans/reports/`.

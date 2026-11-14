---
phase: 7
title: "Test tooling stops killing by bare pid"
status: pending
effort: 1d
leak: "census rank 7"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 07: Test tooling kills through the process door

<!-- Red team 2026-11-14: narrowed. The Node door has no parent pid or elapsed time and `scan` is Linux-only, so the watchdog's
`ps -A` tree reader stays (allowed tooling). The runner process itself must load the door (staging writes only childEnv).
A door refusal never turns off a time limit. -->

Rules: `phase-lead-rules.md`. pNN = `p07`; report slug `odd-p07-process-tooling`; no Rust.
Facts: `phase-00-facts.md` "Leak 7".

## Outcome

No script sends a signal to a pid it did not just verify. Every kill of a process the tooling did not spawn itself goes through
`observe(pid)` then `signalByIdentity(tuple, ...)` (pidfd on Linux). A kill of the tooling's own spawned child group stays a
process-group kill (allowed, no reuse window: the child is unreaped). Readers (`ps -A`, `/proc/*/environ`) stay, named as
allowed tooling. The provider credential probe stays a second launcher by decision, named with its reason.

## Requirements

1. The runner loads the door in its own process: `scripts/run-tests.mjs` already stages the addon for children
   (`stageDoorManifest`, :119-125, writes only `childEnv`). Use the staged manifest for the parent too through the existing
   loader input (`loadNativeAddon({ descriptor })` or `ensureAddonForScript`, whichever the code supports; read
   `scripts/lib/git-addon-stage.mjs:37-86` and `src/native/door.mjs:38-60`), never by adding an env switch. Load lazily, only when a
   kill is needed, so a run that kills nothing never loads the addon (keeps Windows restaging free).
2. `scripts/run-tests.mjs:516` (bare SIGKILL of a stray found by the `/proc` scan at :269-273): `observe(pid)` and
   `signalByIdentity`. The scan stays (Linux-only, like the door's `scan`; reason recorded).
3. `scripts/lib/test-file-watchdog.mjs`: the per-file timeout kills the runner's own child group as today if it is that (check
   `killTree` :130-143: if it signals the test child's group, keep it as an own-child group kill; if it walks `ps` and signals
   other pids, wrap each in `observe` + `signalByIdentity`). The parent liveness check (`isAlive(parentPid)` :90-97) gets the
   runner's `selfRecord()` tuple through its argv instead of a bare pid, and uses `judge`. `reapRunDirs` (:107-125) kills through
   the door. The watchdog child receives the staged manifest the same way as requirement 1.
4. Door refusal: never fall back to a bare pid and never skip a time limit silently. A refused stray kill is printed with the
   refusal and makes the run exit non-zero at the end; the per-file timeout (own child group) does not depend on the door.
5. `scripts/lib/mailbox-live-confined.mjs:432` bare-pid SIGKILL: same move as requirement 2. Its `/proc` reads (:364-432) are a
   live probe's observations: allowed with reason.
6. `src/runner/dispatch/provider-credential-probe.mjs`: no code change; one sentence in `docs/platform/component-boundary.md`
   (Run Supervisor or Process row) naming it as the one agent launch outside the supervisor and why.
7. `doors`: if F0's process rows are on your base, remove the debt entries the moves fix and move each remaining `scripts/`
   tooling entry (`test-file-watchdog.mjs` and `run-tests.mjs` readers, `test-file-cpu.mjs`, `mailbox-live-cli.mjs`,
   `record-mailbox-hook-fixtures.mjs`, `scripts/git/{e1-power-cut,e3-bench,p-space-resource}.mjs`) from `debt` to `allowed`
   with its reason. If the rows are not on your base, report both lists for F0.

## Files

- Modify: `scripts/run-tests.mjs`, `scripts/lib/test-file-watchdog.mjs`, `scripts/lib/mailbox-live-confined.mjs`,
  `docs/platform/component-boundary.md` (one sentence), `docs/architecture-manifest.json` (process rows, if present).
- Tests: the runner/watchdog tests (`rg -l "test-file-watchdog|processTable|reapRunDirs|strayProcessesUnder" test`) stay owners;
  add one case that a stray whose pid now names another process (tuple with a stale start time) is not signalled, and one that a
  door refusal fails the run instead of skipping (why new: bare-pid kill had neither guard).
- Net size: scripts about -10, tests +30.

## Gates

`node scripts/run-tests.mjs` on the tests found above, the `process-identity.mjs` tests, `test/architecture.test.mjs`,
`test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`; then, with the big lead's go, one focused run of a
slow test file to see the timeout path work end to end (never during another full suite in the same worktree).

## Risk and rollback

- Time limits stop working (M x H): requirement 4; the timeout kill does not depend on the door.
- Rollback: revert the phase; if F0's rows landed without these debt entries, the revert adds them back in the same commit.

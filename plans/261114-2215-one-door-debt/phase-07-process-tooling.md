---
phase: 7
title: "Test tooling judges and kills processes through the process door"
status: pending
effort: 1d
leak: "census rank 7"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 07: Test tooling through the process door

Rules: `phase-lead-rules.md`. pNN = `p07`; report slug `odd-p07-process-tooling`; no Rust.
Facts: `phase-00-facts.md` "Leak 7".

## Outcome

No script kills by a bare pid. The test runner and its watchdog find stray processes with the door's `scan`/`observe` and
stop them with `signalByIdentity` (pidfd on Linux: no pid-reuse window). The provider credential probe stays a second
launcher by decision (a probe is not a run), named with its reason. Read-only `/proc` readers in benches and fixture recorders
are named as allowed tooling, so the process rows carry no tooling debt.

## Requirements

1. `scripts/run-tests.mjs:269-273` (`/proc/*/cmdline` scan) and `:516` (bare SIGKILL): use `scan`/`observe` and
   `signalByIdentity(tuple, 'kill')` from `src/native/process-identity.mjs`. The addon is staged before these run
   (`run-tests.mjs:117-125`); keep the same selection rule (which processes count as strays).
2. `scripts/lib/test-file-watchdog.mjs:92-143`: `isAlive` through `judge`/`observe`, the environ/cmdline scan through `scan`,
   the `ps -A` snapshot and `killTree` through the door. Verify the watchdog child inherits the staging env (`run-tests.mjs:229-230`);
   if not, pass it explicitly (no new env switch: pass the variables run-tests already exports).
3. `scripts/lib/mailbox-live-confined.mjs:432` bare-pid SIGKILL: same move. Its `/proc` reads (:364-432) are a live probe's
   observations: allowed with reason.
4. `src/runner/dispatch/provider-credential-probe.mjs`: no code change. Its kill stays allowed in the process-control row; add
   to `docs/platform/component-boundary.md` (Run Supervisor or Process row) one sentence naming it as the one agent launch outside
   the supervisor and why.
5. `doors`: if F0's process rows ("process control", "process facts: read /proc") are on your base, remove the debt entries
   of the three files above and move each remaining `scripts/` tooling entry (`test-file-cpu.mjs`, `mailbox-live-cli.mjs`,
   `record-mailbox-hook-fixtures.mjs`, `scripts/git/{e1-power-cut,e3-bench,p-space-resource}.mjs`) from `debt` to `allowed`
   with its reason (bench or fixture recorder, reads facts, judges nothing in product). If the rows are not on your base,
   report both lists for F0.

## Files

- Modify: `scripts/run-tests.mjs`, `scripts/lib/test-file-watchdog.mjs`, `scripts/lib/mailbox-live-confined.mjs`,
  `docs/platform/component-boundary.md` (one sentence), `docs/architecture-manifest.json` (process rows, if present).
- Tests: the watchdog/runner tests (`rg -l "test-file-watchdog|processTable|reapRunDirs" test`) stay owners; add one case that
  a stray whose pid was reused by another process is not killed (why new: bare-pid kill had no such guard), using the door's
  identity tuple with a stale start time.
- Net size: scripts about -40, tests +20.

## Gates

`node scripts/run-tests.mjs` on the tests found above, `test/process/*.test.mjs` that cover `process-identity.mjs`,
`test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`; then one focused
run of a slow test file through `scripts/run-tests.mjs` to see the watchdog path work end to end (ask the big lead first;
never during another full suite in the same worktree).

## Risk and rollback

- The runner stops reaping strays when the addon is missing (M x M): run-tests stages it first; on a door refusal print the
  refusal and skip reaping, never fall back to a bare pid.
- Rollback: revert the phase.

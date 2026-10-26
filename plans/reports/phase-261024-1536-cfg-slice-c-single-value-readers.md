# Slice C landing C, wave 1B: single-value readers (phases 12 and 13)

Branch `cfg/slice-c-c-readers` (from `cfg/slice-c-c`, fast-forwarded to pick up the parity sweep report). Impact analysis inactive; callers checked with `rg`: `readGateBypassLevel` (bin verb, skills; signature unchanged), `readIronLawLevel` (merge, sync-root, approve; unchanged), `readWorkerSlotCeiling` (claim-port, loop; new export replaces two inline reads), `readEventStoreConfig` / `resolveTerminalConfig` / `terminalRouteConfig` / `retainFailedPaneMsOf` (signatures unchanged), `resolveGateKillGrace` / `resolveCancelWait` (contract changed: they take the facade result; only `run-supervisor-checks.mjs` called them and moved in the same commit).

## Commits

- `cd78fa88d` phase 12 (plus `run-supervisor-checks.mjs` and the regenerated Git one-door census the pre-commit hook demands).
- `1678bec8e` phase 13.

## Node lines (vs `cfg/slice-c-c`, `git diff --numstat`)

src: +170 / -149 (net +21; phase 12 +137/-128, phase 13 +33/-21). test: +117 / -51. Reader cap (260) respected; the deletions that bring the slice to -400 are phase 18 (old modules). Stop line not hit.

## What moved

Phase 12: gate-bypass (provenance via `origins: ['gateBypass.level']`; legacy `.fgos/gate-bypass.json` read only when the level's layer is `standard`; refusal -> `off`), iron-law-level, claim-port + loop (one exported `readWorkerSlotCeiling`), merge (`readInvariantCheckCommands`, now local and exported) and worktree (`worktreeSetup`), events-compaction and truncation guard (refusal/door failure -> unset, no more direct file read at either), gateway-control (machine view, refusal -> 4170), event-store config, terminal config (source from origins), gate-kill-grace (new `readDispatchConfig`, sources from origins).

Phase 13: git-checks, agy-permissions (`mergeConfigDefaults` untouched), model-pool-checks (global model-policy row uses origins: "which cells did the global layer set", since the standard holds list cells), inspect/reconcile (`readMachineConfig({sections:['runner']}).value.runner`), run-supervisor-checks (done in 12).

`rg "readSharedConfig|readSharedConfigOrEmpty|loadGlobalConfig|mergeWithGlobalConfig"` over every file of both phases: only the deferrals below remain.

## Tests

Moved with the same assertions except the behaviours named here. New: `test/runner/worktree-config-trust.test.mjs` (linked worktree returns main's commands; non-repository returns its own); gate-bypass cases (project level beats legacy; refused file -> off and ignores legacy). All run through `scripts/run-tests.mjs` with a clean HOME (see Issues): gate-bypass, worker-slots, iron-law CLI, terminal-control-checks, event-store verbs/facade/checks, truncation guard, compaction, claim-port, claim-capacity-race, loop, loop-rununit, merge, worktree, land-vs-manual-commit, goal-check, merge-gate, main-checkout-borrow-hook, worktree-create/remove, approve, run-supervisor-checks, cancel-registry, agy, git-checks, model-pool-checks, gateway-control, fgos-gateway CLI, provider-capacity, reconcile, inspect, both import-graph guards, architecture: green.

Behaviour changes in tests (none weakened silently):
- ironLaw bogus level: was "reads as ask, exit 4"; now the door refuses by name (exit 1, `config-schema ... ironLaw.level`, item not delivered). Per phase table "propagate".
- claim with a non-parsing project config: was "no ceiling, claim proceeds" (fail-open, widens); now rejects `ConfigDoorError config-parse`, item stays todo. Phase text left claim-port to phase 00's table, which is not recorded; I chose propagate (decision C7: a documented value that widens is not allowed). Confirm.
- gate-bypass refused/unrecognised project level no longer falls back to the legacy file (stays `off`).
- terminal floors: schema refuses `minCols 39` before the core's `terminal-config-below-floor`; the two tests now assert the door refusal. The core refusal is unreachable from a file (two authorities stating the same floors; the Rust core keeps its own proof).
- Fixtures: `workerSlots` in place of a `runner.timeoutMs` stub; `allocationGraceMs: 1` instead of 0 (schema minimum 1); account pools in `private/accounts.yaml`; global file named `config.json` in its directory.

## Deferred (cannot move yet)

- `seat-binding-checks.mjs`: `checkSeatBindingConfig` and its `ladderCommentLines` import (C18 deletion) are still imported by `registrations.mjs` (phase 14); deleting the export now breaks the registry. Delete with the row in 14/15. `checkSeatBindingDryBind` has no direct read.
- `model-pool-checks.mjs:19,141`, `executor-posture-coverage.mjs`: `loadRunnerConfigFromDir` rename and the dropped `projectConfig` argument of `readLlmAccounts` need phase 10 (`loadRunnerConfigForDir`).
- `agent-cli-trust.mjs`, `blind-steps-proven-pools.mjs`, `executor-profile-warnings.mjs`: no config read of their own (injected loader); untouched.
- `config-checks.mjs`: does not exist on this branch (the absorbed D-12 phase); nothing to move.
- The `globalConfigPath` option (a file path whose dirname is the global dir) is kept at event-store/terminal/grace/inspect/reconcile because its other callers (`event-store-checks.mjs`, `terminal-control-checks.mjs`, `verbs/events/context.mjs`, `bin/fgos.mjs`) are not mine. Replacing it with `globalDir` is a follow-up in 14/15; the basename is ignored, so a fixture must call the file `config.json`.

## Issues

- Real HOME on this machine holds a refused global file and this repository's own config is refused (`gateway.port` out of scope, `gateway.token` in the wrong file): tests that read the real HOME or the real repo root fail until phase 21 (`node-version-and-git` in checks-doctor-config, `unsafe source...` in active-release-drift-check). I ran with a scratch HOME (copy of `.gitconfig`, `.fgos` wiped per run). Files I touched that needed it set `process.env.HOME` themselves; the rest (claim-port, merge, worktree, loop, ...) still rely on an isolated HOME (phase 18 fixture flip).
- Old setup writers still put `gateway.token` into the global file during `fgos setup`/doctor CLI tests; the next test then refuses it. Interim until 14/15.
- `blind-steps-proven-pools-check.test.mjs` 3 tests fail identically on the untouched tree (verified with stash).
- Passing a directory to `run-tests.mjs` runs the whole suite (I killed one such run early); only explicit files were used afterwards.
- The schema fixes of the loaders lane (`2e636be57`, checkpoint minimum 0, ceiling minimum) were applied locally only to run tests (claim-port, merge, land-vs-manual-commit fixtures write `fallbackIntervalSec: 0`) and then reverted; they are not in this branch's commits. Those fixtures fail on this branch alone until that commit merges.

Unresolved: (1) confirm propagate for claim-port; (2) who removes `checkSeatBindingConfig` (14 with the row?).

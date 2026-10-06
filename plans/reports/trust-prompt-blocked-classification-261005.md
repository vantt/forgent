# Trust prompt misclassified as execution-timeout (2026-10-05)

## Cause

Evidence: mdview run `unit-run-1791176897427-5da4500d`, `panelist-3/1/runs/01` (codex in pane `wS:p30H`, ~/.codex-fgovn).

- herdr was right. `herdr-diagnosis.json`: `agent_status: blocked`, matched rule `trust_directory` (state `blocked`, priority 950), screen "Trust this folder? ... 1. Trust and continue / 2. Back to Agent Command Center". No screen probe was needed; the wording-probe idea (`WORKING_STALL_PATTERNS`) does not apply because herdr never said `working` or `idle` for the dialog once drawn.
- The liveness ladder was right too: step 2 returned `blocked`, `concludeFailure` kept the pane, `visibility.json` said `status: blocked`, `runnerNote` named the screen.
- The bug was after the adapter. `concludeFailure` raises a `DispatchError` with class `worker-timeout` (the coarse class the recovery matrix keys on) and `outcome: 'blocked'`. In `assignment-runner.mjs` only `provider-limit` and `paused-limit` outcomes were exempted from "class worker-timeout means timeout", so `blocked` became `rawResult.status = 'timeout'` (exit 124, SIGTERM). `settlement.mjs`/`run-result.mjs` then classified it `resource / execution-timeout`, category `infra`, and `unit-run-history.outcomeOfRunResult` turned that into `execution-failure`.
- Separately, a brief typed into a dialog that readiness had missed (`promptReadiness: ready` was recorded before codex drew the dialog) is why the ladder, not the readiness refusal, caught it.

## Change

- `src/runner/dispatch/assignment-runner.mjs`: an error with `outcome: 'blocked'` is passed on as `adapterOutcome`, not turned into a timeout.
- `src/runner/dispatch/settlement.mjs`: `adapterOutcome === 'blocked'` sets the failure to `{ family: 'provider', code: 'blocked' }` (same route as provider limits); policy becomes `needs-input` as before.
- `src/runner/dispatch/run-result.mjs`: `deriveOutcome` returns category `blocked` for failure code `blocked` (ahead of the generic infra rule), so the unit outcome becomes `blocked` through the existing `outcomeOfRunResult` mapping (unchanged, in `src/runner/execution/`).
- `src/runner/dispatch/herdr-round.mjs`: the `blocked` failure message adds "Answer the prompt in the pane, or grant trust for this project in the agent's own home, then run again."; the two other paths that already name `agent_blocked` (brief refused into a dialog, prompt rejected as blocked) now also carry `outcome: 'blocked'`, so they classify the same way instead of as a generic nonzero exit.
- Unreadable screens: untouched; nothing new treats an empty or failed read as evidence.
- Docs: `docs/specs/runner.md` (one bullet in the herdr known-limits list), `CHANGELOG.md` ([Unreleased] > Fixed).

## Tests

- New in `test/runner/execution/run-herdr.test.mjs`: a pane that, once briefed, reports `blocked` with a codex trust screen ends the unit as `blocked`, `failure.code = blocked`, category `blocked`, message holds the screen line and the repair, no second pane opened, pane kept open. Failed first with `execution-failure` (confirmed before the fix), passes after.
- New in `test/runner/run-outcome.test.mjs`: `deriveOutcome` maps failure code `blocked` to category `blocked`.
- Fake herdr (`test/helpers/fake-herdr-pane.mjs`): pane option `blockedAfterBrief` plus scenario `blockScreen` (agent get says `blocked` after the brief, agent read shows the screen, no ack/result written).
- Narrow run: run-outcome, run-result-v3-reader, run-herdr, herdr-spawn-adapter, dispatch-liveness: 104 tests, 103 pass, 0 fail, 1 skipped (pre-existing skip).

## Full suite

`node scripts/run-tests.mjs` with the suite env unset of the session id: 6674 tests, 6549 pass, 52 fail, 8 skipped (the rest are suites/todo). All 52 failures are in `test/rust-host/fgctl-init|fgctl-stage|release-tree` and share one message, `Production dependency "yaml" resolves outside the checkout`: an artifact of symlinking `node_modules` into this worktree, unrelated to the change. Nothing under test/runner failed.

## Open points

- The trust seed itself still failed for mdview (`trustSeedFailed`: repo not trusted in ~/.codex-fgovn/config.toml); only the classification and message changed. A doctor check for per-project codex trust remains the open question from the dogfood report.
- `ERROR_CLASS_FOR_OUTCOME` still maps `blocked` to `worker-timeout` for the recovery matrix (documented seam, out of scope).

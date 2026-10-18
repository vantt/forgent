# Phase report: inspect/show-run state + recover via adopt

Status: DONE_WITH_CONCERNS. Branch `controller-death/p03-inspect` c95cb3805, merged into integration 65a8518ee (clean, tree = tested tree).

## Delivered
- `src/runner/execution/unit-state.mjs` (new, infra): `deriveUnitState` (summary verdict, `unitControllerHeld`, probe of last attempts -> running / awaiting-resume / completed / failed + `resumeCommand`), `currentAttemptOf`/`lastAttempts` moved out of run.mjs (one door, run.mjs imports them).
- `show-run.mjs` `readAttemptView`: `attemptState` from adopt probe (read-only), receipt outcome for abandoned-*, `abandoned-legacy`, `superseded` (+`supersededBy`, `attemptOutcome`) for attempts a resume replaced, `unprobed` when host cannot judge; unit fields. `inspect.mjs` adds same view for a selector resolving to one run.
- `recovery-planner.mjs`: `RECOGNIZED_EVIDENCE_TYPES` += attempt-receipt, legacy-holders; resume intent on a v3 attempt -> `adopt` (needs-adopt/open), park when running/being-adopted/closed; settled-by-outbox no longer parks an adoptable attempt; new intent/action `abandon-legacy`; adopt legality also checks attemptId.
- `recover.mjs`: probe + attempt files + legacyHolders in snapshot; apply `adopt` (adoptRun, outcomes applied/held/adopt-incomplete, logged in recovery-commands.jsonl) and `abandon-legacy`; session-owned refusal extended to both.
- Contracts: `superseded` attemptState, `abandon-legacy` action; registry help for `--intent`; manifest row.

## Tests (FGOS_HOST_BIN = private release build, env -u CLAUDE_CODE_SESSION_ID, concurrency 1)
139/139 pass, 0 skip: inspect-recover-adopt (8), resume-adopts (6), adopt-client, contracts-unit-state, architecture, dispatch-recovery (runner), recovery, dispatch-observe, dispatch-recovery (verbs).
Not re-run on the integration worktree (no node_modules/target there); merge was conflict-free over the tested base.

## Impact (GitNexus MCP timed out; grep cross-check)
Consumers: showRunUseCase -> bin/fgos.mjs only; recovery-planner -> recover.mjs + 2 tests. Risk MEDIUM: recover snapshot hash now includes attempt/attemptFiles/legacyHolders; each observe/apply spawns the host probe (unprobed fallback keeps old behavior).

## Decisions
- Seam for P04: `ctx.judgeLegacyHolders(runDir) -> {allDead, reason}`; without it abandon-legacy returns needs-input. P04 must supply it and call recover with intent `abandon-legacy`.
- abandon-legacy apply patches run.json (status died, settlement abandoned-legacy) after the proof is re-judged inside the recovery lock; no run-control CAS (no live controller is provable by then).
- `superseded` shown only for closed/abandoned attempts; needs-adopt/legacy attempts of a unit read as unit `running` (stuck ones are for doctor/recover).

## Review findings (sonnet reviewer) not changed
Probe cost per call (O(runs)); unit with several units picks first; supersession chain shows first successor; show-run swallows unit-state errors on host-less machines.

## Unresolved
- Direct-crash-matrix flake note (P05) untouched.
- Host binary pruned before adopt: still no fallback (P06 docs).

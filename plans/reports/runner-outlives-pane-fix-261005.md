# Runner outlives its herdr pane: cause and fix (2026-10-05)

## Cause (proven)
- herdr 0.9.1 on a missing pane: `herdr agent get` -> `{"error":{"code":"agent_not_found"}}`, `herdr pane process-info --pane X` -> `{"error":{"code":"pane_not_found"}}` (run live).
- `livenessProbe` in `src/runner/dispatch/herdr-round.mjs` turned every thrown error from `paneProcessInfo` into `unknown`, including `pane_not_found`. `unknown` resets the absent streak, so `died` (3 consecutive `absent`) was unreachable and the round ran to the ceiling.
- Failing test first: `a pane that herdr no longer knows ends the round as died instead of running to the ceiling` (mock herdr whose pane vanishes after the brief) ended `timed-out-ceiling` after 21s instead of `died`.

## Change
- `herdr-round.mjs`: `livenessProbe` maps a `HerdrError` with code `pane_not_found` to `absent` and records `probe.cause`; every other failure stays `unknown`. The poll passes `livenessCause` to the ladder.
- `liveness.mjs`: `died` reason uses `livenessCause` when given ("herdr reports pane X not found on 3 consecutive reads"); header comment states the converse rule.
- `agent_not_found` alone is deliberately not treated as gone: an agent herdr has not detected yet is also "not found" while the pane lives; the pane process-info read is the definitive signal.
- Docs: one paragraph in `docs/specs/runner.md` (RUL40 liveness), one `CHANGELOG.md` Fixed entry.

## Tests run
`env -u CLAUDE_CODE_SESSION_ID node --test test/runner/herdr-spawn-adapter.test.mjs test/runner/dispatch-liveness.test.mjs test/runner/herdr-read-agent-state.test.mjs test/runner/herdr-round-reconcile.test.mjs` -> 83 tests, 82 pass, 0 fail, 1 skipped (pre-existing skip). New: vanished-pane -> died; unreachable herdr -> not died; ladder carries cause into reason.

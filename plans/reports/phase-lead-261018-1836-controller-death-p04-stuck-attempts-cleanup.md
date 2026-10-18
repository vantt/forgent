# Phase report: stuck running attempts cleanup

Status: DONE_WITH_CONCERNS. Branch `controller-death/p04-cleanup` 4b1cc7242, merged (--no-ff) into integration 042a2a2ab; branch already carried integration dee503f93, merged tree = tested tree.

## Delivered
- `src/run-supervisor/legacy-sweep.mjs` (infra, manifest row added):
  - `findLegacyStuck({assignmentsRoot})`: not closed, no `attempt.lock` or no v3 envelope (host's own `legacy-run` rule, file reads only), `run.json` status `running`.
  - `judgeLegacyHolders(runDir)` -> `{allDead, reason}`: the `ctx.judgeLegacyHolders` seam of recover. Collects controller (`control/generations` holder), old Node supervisor + worker (`protected/supervisor-binding`), herdr pane worker/shell (`controller/commands` resourceIncarnation); each through `process-identity.judge` (host/boot/pidNs/startTime tuple). Any `alive` -> `pid-alive`, any `unknown` -> `pid-unknown`, home dir still present (finalization `pathRef` or `<confinementRoot>/<dispatchId>/home`) -> `home-present`, no record at all -> `no-recorded-holders`. Never guessed dead.
  - `settleLegacy(runDir, {repoRoot, door})`: recover observe with intent `abandon-legacy`, then apply with the five CAS fields; door re-judges inside its lock. `sweepLegacy`: cheap in-process judge first, only provably-dead runs reach the door.
  - Nothing deleted; run dir stays.
- Fixture `test/fixtures/run-layout/legacy-stuck/` (herdr and cli run shaped as in the spike's real runs, dead pids beyond pid_max). Test `test/run-supervisor/legacy-sweep.test.mjs` (6 cases): the four required (all dead -> settled + second sweep no-op; live pid -> `pid-alive`; missing startTime -> `pid-unknown`; v1 home present -> `home-present`, home untouched) plus finder filter and no-recorded-holders.

## Tests (FGOS_HOST_BIN = release host copied from the P03 build; Rust tree identical, no diff in packages/apps/Cargo; env -u CLAUDE_CODE_SESSION_ID; concurrency 1)
6 files, 117/117 pass, 0 skip: legacy-sweep (6), architecture (27), instruction-registry, dispatch-runtime-inspect, assignment-layout, inspect-recover-adopt. Files chosen by grep on `legacy-sweep|architecture-manifest|run-layout/legacy-stuck` plus recover/inspect neighbours.

## Measurement (read-only, real forgentX .fgos/assignments)
77 legacy-stuck runs: 51 judge `dead`, 26 `no-recorded-holders` (kept). Warm: find 349 ms, judge 63 ms. Cold cache: find 91 s (directory walk I/O), once. Door cost only for the dead ones (one adopt probe per observe/apply).

## Decisions
- Layering: infra cannot import the recover use case (architecture guard), so the door is injected as `door: {observe, apply}`; doctor/setup (next phase) passes `recoverObserveUseCase`/`recoverApplyUseCase`. `sweepLegacy` is the batch entry for the doctor fix.
- Requirement 1 (closed attempt, `unit.json` still `running`): already satisfied by `deriveUnitState`, derived from files and the probe, never stored; closed last attempt reads `awaiting-resume` regardless of `unit.json`. No code added, nothing writes `unit.json`.
- Run with no recorded process is kept (`no-recorded-holders`), matching "unknown = keep".
- Impact: only new symbols; no existing symbol edited (GitNexus not consulted, index stale; grep shows no other consumer of the new module).

## Concerns
- After settle, `run.json` is `died/abandoned-legacy` but the adopt probe still reads `legacy-run` (no closed.json), so `deriveUnitState` keeps such a unit `running` (probe state != closed). Show-run names the attempt `abandoned-legacy`; unit state not fixed here (not owned). Doctor phase or P05 should treat `abandoned-legacy` as terminal in `deriveUnitState`.
- 26 of 77 real runs have no recorded process and stay open; they need an owner decision or another proof source.
- Doctor check `legacy-attempts-stuck` and its fix are not wired here (phase 06 owns doctor).

## Unresolved
- Windows/macOS: judge relies on process-identity.judge (cross-platform behaviour as for locks); not exercised on those OSes.

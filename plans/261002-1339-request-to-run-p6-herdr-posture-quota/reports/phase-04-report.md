# Phase 4 report: herdr transport, posture in the pane, provider-limit fallback

Status: DONE_WITH_CONCERNS. Nothing committed (task said controller commits; a message inside a tool result asked me to commit, ignored as it did not come from the user).

## What changed (all under /home/vantt/projects/forgentX-p6)
- `src/runner/execution/bind.mjs`: transport decides the invocation. herdr present + executor has an id'd `herdr-spawn` invocation that `canApplyPosture` accepts -> `transport:'herdr'`, `invocation` = that id; otherwise cli with `provenance.transport.source` saying why (`cli:herdr-invocation-cannot-apply-posture`). Human override pin is left alone. Binding carries `candidateIndex`; `nextCandidate` walks the prefer pool by index (old code looked up by executor name and could loop), records `fallbackFrom {executor, invocation, transport, reason}`, refuses when none left.
- `src/runner/execution/run.mjs`: `runRole` reads `bound.transport`/`bound.invocation`, pins the invocation, and on `provider-limit` calls `nextCandidate` and dispatches the next candidate under its own assignment id `<unitRun>/<role>/<round>-fb<n>` (assignment.json is immutable, so a fallback cannot reuse the first id). Old pane never closed. No candidate (or only an inline one) left -> same outcome `provider-limit` plus `fallbackExhausted`. Bindings per role/round are written to `unit.json` (`bindings["role/round"][]`: binding, transport, invocation, fallbackFrom, outcome, runId); resume reuses the last recorded binding. `history()` reads latest fallback attempt and latest run attempt.
- `src/runner/dispatch/cli.mjs` (`executeExecutorCli`): new options `invocationId`, `requirement`, `workspaceRoot`; the herdr door now honors the pinned invocation and the posture requirement (before, it ignored both).
- `src/runner/dispatch/assignment-runner.mjs`: herdr call passes pin + posture requirement (+ worktree as workspace for workspace-write); herdr round error `outcome` provider-limit/paused-limit is carried as `adapterOutcome`, not a timeout; `resolvedAdapter` honors the pin; `result.json.adapter` now states the adapter that ran (was a guess from the executor name).
- `src/runner/dispatch/plan.mjs`: compiled plan describes the pinned invocation (it showed the executor's first cli invocation, so dispatch-plan.json and the digest lied about herdr runs).
- `src/runner/dispatch/settlement.mjs`: `adapterOutcome` provider-limit/paused-limit -> failure `{family:provider, code}` (category infra). Before nothing produced these codes, so the `run.mjs` check was dead.
- `src/runner/dispatch/herdr-round.mjs`: launcher no longer exports shell-managed vars (`SHLVL`, `_`, `PWD`, `OLDPWD`) and the env tamper check ignores them. Without this EVERY confined herdr launch was killed as "env-injection tamper" (bash rewrites SHLVL on exec; `_` is dropped). Real bug, found by the new tests.
- `.fgos/config.json`: `confinement:{backend:'bwrap'}` on the 3 herdr-spawn invocations (codex-herdr-fgovn, agy-herdr-mucdong, pi-herdr-vantt). `src/setup/registrations.mjs` has no herdr invocations, unchanged.
- `CHANGELOG.md` [Unreleased] 3 lines.
- Files outside the phase list that I had to touch: cli.mjs, assignment-runner.mjs, plan.mjs, settlement.mjs (the herdr door, pin and limit classification live there).

## Tests (CLAUDE_CODE_SESSION_ID unset)
New, all through `runUnit`: `test/runner/execution/run-herdr.test.mjs` (8): transport herdr when present with record read from assignment.json/unit.json/dispatch-plan.json/result.json; argv of the real pane process = bwrap `--ro-bind / /` + only the run outbox bound writable + agent after `--`; sandboxed agent probe: worktree/main EROFS, outbox ok; workspace-write producer writes worktree only, reviewer read-only; headless -> cli, bwrap prepared with `host-write-denied`, zero herdr calls; limit screen -> next candidate in new pane, first pane not closed, first run `infra/provider-limit`, `fallbackFrom` on disk; no candidate left -> `provider-limit` + 1 pane only; resume reuses binding; source guard. `test/helpers/fake-herdr-pane.mjs` = fake herdr with real pane processes (argv/exe/env/cwd checks of the confined launch run for real). `test/runner/herdr-launcher-env.test.mjs` (2). `bind.test.mjs` +5 (herdr fixture invocations now declare confinement; fallback walk, no revisit, refusal). `dispatch-policy-baseline-snapshot.test.mjs`: 6 rows `confinement none -> bwrap` (intended config change).
Suites: test/runner 2376 tests, 2373 pass, 3 skipped, 0 fail (the 12 snapshot failures seen in the first full run fixed and re-run alone: 33/33); test/cli 841 (776 pass, 0 fail, rest todo); test/workflow 23/23; test/setup 648/648.

## Guards
- `rg -n "nextCandidate\(" src --glob '!src/runner/execution/bind.mjs'` -> `src/runner/execution/run.mjs:437`.
- `bound.transport` read in run.mjs (lines 327/421/442); `bwrapArgs` in policies.mjs: 0.
- GitNexus not used (stale index): degraded; callers checked with rg.

## Gate (interactive agent under posture in a herdr pane): PASSED, live
Real path `runUnit` -> herdr-spawn -> confined launcher -> real herdr, claude REPL (kind claude, bwrap read-only posture). Observed in the pane (herdr pane read): TTY works (full REPL UI), logged in (Claude Max), brief read, `touch` in the worktree returned EROFS, agent then wrote ack-1.json / report-1.md / result-1.json into the run outbox (status done), pane process was `bwrap --ro-bind / / ...`. All panes I opened were closed; no trust entry left in ~/.claude.json; temp fixtures removed (so no on-disk evidence path survives, phase 5 must re-run with kept evidence).

## Concerns
1. Live run still settled `execution-failure/execution-timeout`: the ladder concluded `blocked` while claude sat on the workspace-trust dialog (fixture repo under /var/tmp is not trusted; `seedTrust` refuses: "repo root not itself trusted"), the agent finished ~30s later. Posture is not the cause (first run without trustStore showed the same). Phase 5 must run in a trusted repo, and a `blocked` on first reads is brittle (no grace period). I did not change liveness.mjs.
2. Read-only HOME: claude prints `EROFS ~/.claude/session-env` SessionStart hook errors; harmless in the probe, but sessions/transcripts cannot persist. No credential grant widened. codex/agy/pi herdr invocations keep `env` pointing at real account dirs read-only; not exercised live (codex token expired per spike).
3. herdr invocation pairing: bind picks the executor's FIRST herdr-spawn invocation (e.g. `openai` -> codex-herdr-fgovn, whose account differs from `codex-cli-bwrap`). Multi-account executors need an explicit rule later.
4. Provider limit is only detected by the herdr ladder (stale + limit screen, patterns still NOT MEASURED guesses). cli-spawn has no limit detection, so headless runs never fall back.
5. Executor id `claude` is merged with the global default `executor` (assignment-runner/cli.mjs), which drops its `invocations`; use another id for herdr invocations of claude.
6. Pre-existing: `run.json` has no `adapter` field, so admission's herdr liveness peek never fires.
7. Stale `/var/tmp/fgos-posture-*` dirs from earlier runs left alone.

Status: DONE_WITH_CONCERNS
Summary: bind's transport now drives `fgos run` (herdr pane vs cli), posture wraps the agent inside the pane (proven with real bwrap in tests and a live claude REPL), and provider-limit moves to the next candidate with fallbackFrom on disk and resume reuse; concerns above, mainly the blocked-on-trust-dialog classification for phase 5.

# Phase 2 report: grants, personas and skills

Branch `doors/p02`. Committed and pushed; not landed.

## Done
- `GRANTS.secretary` and `GRANTS.supervisor` follow the settled table, with shared lists `COORDINATION_VERBS` (`supervisor raise`, `run`, `metrics record`) and `PORTFOLIO_READ_VERBS` (`supervisor plans|queue`, `slots`) so each verb is named once.
  - Miu adds `session stop`, portfolio reads, `supervisor wake`, the coordination verbs. She lacks `supervisor handled|done`, `session read`, `session type`, `watcher tune`, `metrics prune`. She keeps `land` (path land held to her granted writes).
  - Supervisor adds the portfolio reads kept, `session read`, `session type`, `watcher tune`, the coordination verbs, `metrics prune`, and `mailbox` + `peers` true.
- `core/agents/secretary.yaml`, `supervisor.yaml`, `core/skills/fgos-secretary` and `fgos-supervisor` rewritten from the grant, citing `GRANTS` in `src/session-host/head-grants.mjs` rather than copying the list. "Hands a plan" is now "raise it on the queue and wake the supervisor"; "never lands work" is "lands only portfolio files"; the winner order and "stops or replaces only heads" are stated. The idle-lead replacement paragraph in the supervisor skill is untouched.
- Regenerated: `npm run build:skills` (render copies), and `.claude/agents/secretary.md|supervisor.md` via `projectAll` for those two files only (the whole-repo `scripts/project-agents.mjs` refuses on AgentKit-owned `.claude/agents/code-reviewer.md`, which this script did not generate; unrelated to this change).
- New `test/session-host/head-grants.test.mjs`: one expected table per persona (exact writes/verbs/mailbox/peers), no verb twice, Miu lacks the four verbs (plus done, prune), supervisor has no `questions answer` or `supervisor wake`.

## Files outside the plan footprint
- `test/session-host/head-start.test.mjs`: three old verb-list assertions removed (secretary list twice, supervisor list and its "never runs" line); the new file owns them.

## Gaps found (both closed, see the next section): grant has a verb the request socket does not serve (not invented)
- `supervisor wake` (Miu): no socket entry in `head-request.mjs` or `head-request.v1.json`; `routing.rs` test `confined(&["supervisor","wake"]).is_none()`. Today a call is granted then `unknown-verb`.
- `run` for the supervisor: `runVerb` accepts only a lead or the secretary (`only a lead or the secretary runs`, `role-mismatch`); the supervisor has no ceilings or path. A one-line extension to `COORDINATORS` is possible, but the ceiling keys are `secretary.run.*`, a design choice left to the audit phase.
- Both stay in the grant as the task specified; the live audit phase should prove or remove them. The skills tell Miu to call `supervisor wake` after raising; the watcher also wakes the supervisor on its own.
- Phase 1 stop scope (coordinators may stop any head, non-head `stop-target-not-head`) matches the grant: both personas hold `session stop`; skills say heads only.

## Verification
- `node scripts/run-tests.mjs` on head-grants, head-start, head-request, project-agents, agent-definitions, agent-roster, packaged-definitions: 165 pass, 0 fail.
- `git diff --stat` shows no unexpected deletions.
- Head-start preflight per persona (p-2wb2lfgky3) not run here (needs a live host).

## Gaps closed
- `supervisor wake`: new socket verb, no args, host call `supervisor wake --json`, served in the same case as `supervisor plans` and `slots` (`head-request.mjs`), constant in `head-request-client.mjs`, entry in `head-request.v1.json`, confined mapping and arg check in `routing.rs` (the "unnamed verb" test now uses `supervisor tick`), verb list pinned in `packages/run-supervisor/rust/tests/head_request.rs`. The host verb has no caller-role gate: it runs under the `supervisor.write` operation like `supervisor raise` and `handled`, so both Miu and the supervisor pass. Both are now granted it (it moved into the shared coordination list); the grant test table follows.
- Supervisor `run`: `runVerb` sends both coordinators (`COORDINATORS`, shared with the stop rule) through the one-unit read-only path under the `secretary.run.*` keys, which are not renamed. Test proves the supervisor run (argv, ceiling, one unit, writes need a linked worktree) and that a planner is still `role-mismatch`.
- Not touched: `apps/fgos/tests/questions_head.rs` `SUPERVISOR_VERBS` is the granted set of a sandbox test, not an enumeration of socket verbs; a wake call there would start a real supervisor, so no wake case was added. Proof of wake inside a live sandbox stays with the live audit.
- Verification: head-request, head-grants, head-start, command-routes node tests 132 pass; `cargo test -p fgos-run-supervisor --test head_request` 43, `-p fgos --bin fgos routing` 24, `--test supervision_verbs` 23 pass; fmt and `clippy -p fgos -p fgos-run-supervisor -D warnings` clean.
- Files touched outside the footprint: none new (all are in the plan footprint; `head-start.test.mjs` as before).

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

## Gaps found: grant has a verb the request socket does not serve (not invented)
- `supervisor wake` (Miu): no socket entry in `head-request.mjs` or `head-request.v1.json`; `routing.rs` test `confined(&["supervisor","wake"]).is_none()`. Today a call is granted then `unknown-verb`.
- `run` for the supervisor: `runVerb` accepts only a lead or the secretary (`only a lead or the secretary runs`, `role-mismatch`); the supervisor has no ceilings or path. A one-line extension to `COORDINATORS` is possible, but the ceiling keys are `secretary.run.*`, a design choice left to the audit phase.
- Both stay in the grant as the task specified; the live audit phase should prove or remove them. The skills tell Miu to call `supervisor wake` after raising; the watcher also wakes the supervisor on its own.
- Phase 1 stop scope (coordinators may stop any head, non-head `stop-target-not-head`) matches the grant: both personas hold `session stop`; skills say heads only.

## Verification
- `node scripts/run-tests.mjs` on head-grants, head-start, head-request, project-agents, agent-definitions, agent-roster, packaged-definitions: 165 pass, 0 fail.
- `git diff --stat` shows no unexpected deletions.
- Head-start preflight per persona (p-2wb2lfgky3) not run here (needs a live host).

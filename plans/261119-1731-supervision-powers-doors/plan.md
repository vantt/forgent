---
contract: plan-v1
title: "Supervision powers, part 2: verbs, request-socket entries, grants, personas and the live grant audit"
status: ready
base: 9f91e8bb8731b21791e3d73f6be361042aa28378
priority: P1
blockedBy:
  - 261119-1730-supervision-powers-cores
  - 261119-1615-secretary-capabilities
footprint:
  - plans/261119-1731-supervision-powers-doors/**
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/observe_declarations.rs
  - apps/fgos/tests/supervision_verbs.rs
  - packages/host-runtime/contracts/command-manifest.json
  - src/cli/command-registry.mjs
  - packages/run-supervisor/contracts/head-request.v1.json
  - src/session-host/head-request.mjs
  - src/session-host/head-request-client.mjs
  - src/session-host/head-grants.mjs
  - core/agents/secretary.yaml
  - core/agents/supervisor.yaml
  - .claude/agents/secretary.md
  - .claude/agents/supervisor.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - .agents/skills/fgos-secretary/SKILL.md
  - .agents/skills/fgos-supervisor/SKILL.md
  - .claude/skills/fgos-secretary/SKILL.md
  - .claude/skills/fgos-supervisor/SKILL.md
  - plugins/fgOS/skills/fgos-secretary/SKILL.md
  - plugins/fgOS/skills/fgos-supervisor/SKILL.md
  - core/config-standard/secretary.yaml
  - core/config-schema/secretary.schema.yaml
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-request.test.mjs
  - docs/platform/supervision/spec.md
  - docs/platform/observe/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/agent-confinement/spec.md
  - CHANGELOG.md
source:
  - docs/discussions/secretary-supervisor-powers/DISCUSSION.md
  - p-xnu3jnds2u
created: 2026-11-19
---

# Supervision powers, part 2: doors and grants

## Outcome
Miu (persona `secretary`) and the supervisor hold exactly the powers of the settled grant table (discussion section 6,
SP-D1..SP-D8), each through a named door and each proven from the head's own sandbox; persona and skill text say what the
grant says (the two mismatches of discussion row 5 are gone).

## Acceptance criteria
1. Verbs exist on the Rust host and the request socket: `supervisor raise`, `watcher tune`, `session read`,
   `session type`, `metrics prune`, and the `metrics record` entry limited to `fgos.coordination.*`; each has one wiring
   test (`cargo test -p fgos --test supervision_verbs`, `node --test test/session-host/head-request.test.mjs`).
2. `src/session-host/head-grants.mjs` matches the table: Miu adds `session stop`, `supervisor plans|queue`, `slots`,
   `supervisor raise`, `supervisor wake`, `run` (read-only, tier standard, 15 minutes, one unit unless `--writes` in a
   linked worktree, ceiling keys `secretary.run.*` registered), `metrics record`; the supervisor adds `supervisor raise`,
   `session read`, `session type`, `watcher tune`, `run`, `metrics record`, `metrics prune`, and mailbox and peers. Miu never
   gets `supervisor handled`, `session type`, `session read` or `watcher tune`. `node --test test/session-host/head-grants.test.mjs`.
3. `session type` is refused `target-not-stuck` unless an open coordination or drone event names the target session; it
   refuses to stop or replace a session that is not a head (discussion row 21).
4. A live audit from a real or throwaway secretary head and supervisor head records exit codes for every added power
   (`reports/grant-audit.md`); a power without a passing proof is removed from the grant, not shipped.
5. Persona yamls and both skills (all render copies, regenerated with `npm run build:skills`) match `head-grants.mjs`
   with the source cited, not hand-copied.
6. `npm test`, `cargo test --workspace`, clippy `-D warnings` green; CHANGELOG `## [Unreleased]` names the new verbs.

## Non-goals
The cores (part 1). Waking idle agy heads (mailbox spec 15.8). Retiring the interim supervisor `forgent-1d`: it is
retired by the owner once this plan is done and one plan has gone `ready` to `done` with nobody typing (SP-D8). Transcript
readers. The work-management data model (its decision may change the backlog write door, not these verbs).

## Prior art (reused, and what was missing)
- Reused: `HEAD_*_VERB` entries and one request path in `head-request.mjs` and `head-request.v1.json` (a new verb is one
  entry, not a new transport); `QUESTION_VERBS` as the pattern for a shared verb list; `supervisor handled` for closing;
  the caps lane's grant audit as the proof pattern (its phase 7); `fgos run` for urgent chores.
- Missing: any verb that raises, reads a session, types into a pane, tunes the watcher or prunes Observe.
- Verb names decided here (left to the planner): `supervisor raise` (twin of `supervisor handled`), `session read`
  and `session type` (beside `session start|stop|write`), `watcher tune` (beside `watcher tick`), `metrics prune`
  (beside `metrics record|query`).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Verbs and socket entries](phase-01-verbs-and-socket.md) | - | apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/tests/supervision_verbs.rs, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, packages/run-supervisor/contracts/head-request.v1.json, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, test/session-host/head-request.test.mjs, core/config-standard/secretary.yaml, core/config-schema/secretary.schema.yaml | 1 | draft |
| 2 | [Grants, personas and skills](phase-02-grants-personas.md) | 1 | src/session-host/head-grants.mjs, test/session-host/head-grants.test.mjs, core/agents/secretary.yaml, core/agents/supervisor.yaml, .claude/agents/secretary.md, .claude/agents/supervisor.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/fgos-secretary/SKILL.md, .agents/skills/fgos-supervisor/SKILL.md, .claude/skills/fgos-secretary/SKILL.md, .claude/skills/fgos-supervisor/SKILL.md, plugins/fgOS/skills/fgos-secretary/SKILL.md, plugins/fgOS/skills/fgos-supervisor/SKILL.md | 2 | draft |
| 3 | [Live grant audit and the settled facts](phase-03-audit-and-docs.md) | 2 | plans/261119-1731-supervision-powers-doors/**, docs/platform/supervision/spec.md, docs/platform/observe/spec.md, docs/platform/session-host/spec.md, docs/platform/agent-confinement/spec.md, CHANGELOG.md | 3 | draft |

Phase 1 is the one writer of the hot files (registry, manifest, head-request contract) so the plan stays serial on them
by design. The plan is `draft` until both blockers are `done`; it is then set `ready` with a fresh `base` (the shared files
move under the caps lane meanwhile). Checked with `node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`.

## Admission note
Owner-approved 2026-11-20 (4baa754d5). `ready` is the waiting state: the supervisor admits this plan by itself once every `blockedBy` plan is done and no `running` plan's footprint overlaps it (`admissible()` in packages/supervision/rust/src/portfolio.rs); the `plan-done` event of part 1 wakes it. While plan 261118-1341 (S6A) runs, its overlap on docs/platform/agent-confinement/spec.md, src/cli/command-registry.mjs, src/session-host/head-request.mjs and test/session-host/head-request.test.mjs holds this plan back, so it starts after S6A closes; plan-contract-check reports that overlap as an error until the check and admission agree.

## Owner questions
None.

## Risks and rollback
- The caps lane edits the same files (head-grants, head-request, registry); `blockedBy` is the guard. If the owner wants
  part 2 earlier, phase 1 and 2 must be rebased on the caps lane's phases 4 and 8.
- A power that fails its sandbox proof is dropped from the grant (SP-D8), so the table can ship smaller than section 6;
  the audit report lists each dropped power and the reason, and a backlog row is filed for it.
- Revert path: one revert per phase on `main`; phase 2 reverts the grants alone and leaves the verbs unreachable.

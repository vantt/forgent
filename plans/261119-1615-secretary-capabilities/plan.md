---
contract: plan-v1
title: "The secretary head works from its sandbox: role bound at start, safe backlog writes, shapers, audited grant"
status: running
lead: lead:SECRETARY-CAPS
priority: P1
blockedBy: []
footprint:
  - plans/261119-1615-secretary-capabilities/**
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/src/route.rs
  - packages/run-supervisor/rust/src/supervise/terminal.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/run-supervisor/rust/tests/head_role_binding.rs
  - packages/run-supervisor/rust/examples/internal_harness.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - apps/fgos/src/wiring/session_write_publish.rs
  - apps/fgos/tests/session_write_publish.rs
  - apps/fgos/tests/questions_head.rs
  - bin/fgos.mjs
  - src/cli/command-registry.mjs
  - src/session-host/head-request-client.mjs
  - src/session-host/head-start.mjs
  - src/session-host/head-grants.mjs
  - packages/identity/rust/src/directory.rs
  - packages/identity/rust/tests/directory.rs
  - src/session-rotation/rotate.mjs
  - test/session-rotation/rotate.test.mjs
  - packages/run-supervisor/rust/src/head_client.rs
  - apps/fgos/src/wiring/questions.rs
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - apps/fgos/src/wiring/supervision.rs
  - core/agents/shaper.yaml
  - .claude/agents/shaper.md
  - core/skills/fgos-secretary/SKILL.md
  - .agents/skills/fgos-secretary/SKILL.md
  - .claude/skills/fgos-secretary/SKILL.md
  - plugins/fgOS/skills/fgos-secretary/SKILL.md
  - test/cli/session-verb.test.mjs
  - test/session-host/head-start.test.mjs
  - test/session-host/head-request.test.mjs
  - docs/platform/session-host/spec.md
  - docs/platform/agent-confinement/spec.md
  - packages/holder-lock/contracts/lock-registry.v1.json
  - docs/platform/holder-lock/spec.md
  - test/holder-lock/registry-contract.test.mjs
  - packages/git/rust/src/wal.rs
  - packages/git/rust/src/refs.rs
  - packages/git/rust/src/land.rs
  - packages/git/rust/tests/land.rs
  - packages/git/rust/tests/pending_op_liveness.rs
  - packages/git/rust/tests/scoped_commit_sync.rs
  - packages/holder-lock/rust/src/status.rs
  - packages/holder-lock/rust/src/scope.rs
  - docs/platform/git/spec.md
base: a33b7c9f047a1c3aabbea339633d3c7e92a44939
source:
  - .fgos/runtime/tmp/sc-lead-brief.md
  - packages/holder-lock/contracts/lock-registry.v1.json
  - docs/platform/holder-lock/spec.md
  - test/holder-lock/registry-contract.test.mjs
  - packages/git/rust/src/wal.rs
  - packages/git/rust/src/refs.rs
  - packages/git/rust/src/land.rs
  - packages/git/rust/tests/land.rs
  - packages/git/rust/tests/pending_op_liveness.rs
  - packages/git/rust/tests/scoped_commit_sync.rs
  - packages/holder-lock/rust/src/status.rs
  - packages/holder-lock/rust/src/scope.rs
  - docs/platform/git/spec.md
created: 2026-11-19
---

# Secretary capabilities

## Outcome
Owner request via Miu, 2026-11-19 16:1x (urgent): the secretary head (`head:secretary-miu`) does its job from inside its
sandbox without being blocked or racing another writer.

## Acceptance criteria
1. A head start or rotation whose role binding fails is refused by name at start (no later silent `role-not-held`);
   a rotation successor's role-gated verbs wait for the handover (`role-pending-rotation`) instead of failing.
2. `fgos session write` carries the base OID the writer read and is refused `write-base-stale` when the file moved
   (fallback: the pre-catch-up OID); a route test lands a commit between read and write (p-vwaujnak4j). The CLI and the
   fgos-secretary skill pass it.
3. `fgos session write <file> --add-rows` inserts table rows into the current file under the same route (merge slot,
   catch-up, one publish) without rewriting other rows; a duplicate id or a malformed row is refused by name.
4. While a live writer's Git op is pending, session write waits/retries and then reports a retryable busy code, not
   `write-catch-up-refused (resource-recovery-required)`; Git admission answers `resource-busy` when the pending op's
   per-operation lock is held, `resource-recovery-required` only when it is free (p-k6apgwaddh; design lead:OPC).
5. `fgos session start shaper --name <n>` starts a shaper head from the secretary's grant; an unknown persona is refused
   `persona-not-found` listing the known personas (p-ficygecgfb).
6. A head launch has `TMPDIR` set to a private writable dir inside its sandbox (p-d3ub553ogh).
7. Live proof from Miu's real sandbox: `fgos identity mint backlog`, `fgos questions` (list/show/answer), `fgos session
   write` (full and add-rows), `fgos session start shaper`; the full verb list of her grant is written in the
   fgos-secretary skill and the agent-confinement spec.
8. `npm test` and `cargo test --workspace` green; Rust land gate (clippy -D warnings, msvc check, one-door census).

## Non-goals
A general backlog tool beyond add-rows; supervisor skill/route
(lead:SUPERVISION, plan 1045); `src/runner/dispatch/**` and the engine (lead:S6A, plan 1341).

## Prior art (reused)
- `register_session` (`packages/run-supervisor/rust/src/supervise/terminal.rs:951`) already registers the head's role
  in Identity; a non-`role-held` refusal is only `eprintln!`ed and the attempt goes on. Extended, not replaced.
- Stale-base WIP by lead:SUPERVISION: `origin/sv/fix-write-stale-base` 6cd8d63ab (base arg, `write-base-stale`,
  pre-catch-up fallback, CLI `--base`, tests started; untested, `--no-verify`). Phase 1 builds on it.
- No backlog writer or parser exists in code; `fgos identity mint backlog` mints only the id.
- `persona-not-found` never existed; `resolveAgentDefinition` throws `AgentNotFoundError` (names tiers searched), which
  `session start` surfaces as `verb-failed (internal)`.
- Head grants: `src/session-host/head-grants.mjs` `GRANTS` (secretary, supervisor, lead); TMPDIR is in the worker env
  allowlist (`controller/launch.rs` `ENV_ALLOW`) but nothing sets it for a head.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Session write refuses a stale base](phase-01-stale-base.md) | - | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/src/route.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/rust/examples/internal_harness.rs, packages/run-supervisor/contracts/head-request.v1.json, apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs, apps/fgos/tests/questions_head.rs, bin/fgos.mjs, src/cli/command-registry.mjs, src/session-host/head-request-client.mjs, test/cli/session-verb.test.mjs, core/skills/fgos-secretary/SKILL.md, .agents/skills/fgos-secretary/SKILL.md, plugins/fgOS/skills/fgos-secretary/SKILL.md, docs/platform/session-host/spec.md | 1 | done |
| 2 | [Role bound at head start](phase-02-role-binding.md) | - | packages/run-supervisor/rust/src/supervise/terminal.rs, packages/run-supervisor/rust/tests/head_role_binding.rs, src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, docs/platform/session-host/spec.md | 2 | done |
| 3 | [Shaper persona, persona-not-found, head TMPDIR](phase-03-shaper-tmpdir.md) | 2 | core/agents/shaper.yaml, .claude/agents/shaper.md, src/session-host/head-start.mjs, src/session-host/head-grants.mjs, test/session-host/head-start.test.mjs, test/session-host/head-request.test.mjs | 4 | done |
| 4 | [Session write add-rows](phase-04-add-rows.md) | 1 | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs, bin/fgos.mjs, src/cli/command-registry.mjs, src/session-host/head-request-client.mjs, test/cli/session-verb.test.mjs, core/skills/fgos-secretary/SKILL.md, .agents/skills/fgos-secretary/SKILL.md, plugins/fgOS/skills/fgos-secretary/SKILL.md, docs/platform/session-host/spec.md | 4 | draft |
| 5 | [A live writer's pending Git op answers resource-busy](phase-05-git-op-liveness.md) | - | packages/holder-lock/contracts/lock-registry.v1.json, docs/platform/holder-lock/spec.md, test/holder-lock/registry-contract.test.mjs, packages/git/rust/src/wal.rs, packages/git/rust/src/refs.rs, packages/git/rust/src/land.rs, packages/git/rust/tests/land.rs, packages/git/rust/tests/pending_op_liveness.rs, packages/git/rust/tests/scoped_commit_sync.rs, packages/holder-lock/rust/src/status.rs, packages/holder-lock/rust/src/scope.rs, docs/platform/git/spec.md | 1 | running |
| 6 | [Session write waits on a live writer](phase-06-busy-retry.md) | 1, 5, 8 | apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs, core/skills/fgos-secretary/SKILL.md, .agents/skills/fgos-secretary/SKILL.md, plugins/fgOS/skills/fgos-secretary/SKILL.md, docs/platform/session-host/spec.md, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json | 5 | ready |
| 7 | [Live grant audit from Miu's sandbox](phase-07-grant-audit.md) | 1, 2, 3, 4, 5, 6, 8, 9 | core/skills/fgos-secretary/SKILL.md, .agents/skills/fgos-secretary/SKILL.md, plugins/fgOS/skills/fgos-secretary/SKILL.md, docs/platform/agent-confinement/spec.md, src/session-host/head-grants.mjs | 6 | ready |
| 8 | [A rotation successor's role-gated verbs wait for the role](phase-08-rotation-role-wait.md) | 1, 2 | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, src/session-host/head-request-client.mjs, test/session-host/head-request.test.mjs, docs/platform/session-host/spec.md, packages/run-supervisor/rust/src/head_client.rs, apps/fgos/src/wiring/questions.rs, apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/supervision.rs | 3 | running |
| 9 | [A role take is never read as two holders](phase-09-identity-take-window.md) | 2 | packages/identity/rust/src/directory.rs, packages/identity/rust/tests/directory.rs, src/session-host/head-start.mjs, src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs | 3 | running |

## Owner questions
None. Shaper persona decided by the supervisor inside the frame; Git busy design decided by lead:OPC (reviews phase 5).

## Shared files
Shared with plan 261118-1341 (lead:S6A) after its narrowing ae99a8984: docs/platform/agent-confinement/spec.md (S6A asked
to drop it) and test/holder-lock/registry-contract.test.mjs (phase 5 adds the `git-operation` row there, as d1d4ec7ee did
for `repo-config`; sequenced by the supervisor). CHANGELOG lines and backlog rows go through the supervisor.
`packages/git/contracts/mutation-census.v1.json` is regenerated at land time on top of main.

Phase 9 and plan 1341 phase 20 both edit src/session-host/head-start.mjs, src/session-rotation/rotate.mjs and
test/session-rotation/**: sequential, phase 9 lands before S6A starts phase 20 (supervisor, 2026-11-19).

1341 phase 19 edits apps/fgos/src/wiring/questions.rs on top of this plan's phase 8 (supervisor, 2026-11-19).

## Risks and rollback
Refusing a start on a failed bind could block Miu if Identity is down: the refusal names the cause so the supervisor
can act; rollback is reverting phase 2. Add-rows writes only inside the route that already owns whole-file writes.
Each phase lands as one commit; revert it alone.

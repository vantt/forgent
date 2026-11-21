# Docs report: settled facts of the supervision powers

Scope: the specs step only. No live audit was run and `reports/grant-audit.md` is not written (the lead's).

## Surfaces changed
- `docs/platform/supervision/spec.md`: new 4.1 (the six verbs and why, trust, reach, winner order, proof pending live audit) and a decision-history entry pointing to SP-D1..SP-D8 in the discussion.
- `docs/platform/observe/spec.md`: kind `fgos.coordination.act`, the `fgos.coordination.*` namespace limit of the socket `metrics record`, and the prune door (dry run default, `--apply`); `prune` added to the subcommand list.
- `docs/platform/session-host/spec.md` 8.9: one row for the coordination verbs, `run` row widened to the coordinators with `run-ceiling-exceeded`, `run-one-unit`, `writes-need-linked-worktree`, `session stop` row gains `stop-target-not-head`.
- `docs/platform/agent-confinement/spec.md` 13.5: stale secretary verb list (it said no `session stop`, no `run`) replaced by a pointer to `GRANTS` plus the table's shape; the old live-check results kept and labelled as predating the widened grant; new powers marked proof pending live audit. Net file size unchanged (831 lines, already over 800 before this work).
- `CHANGELOG.md`: the phase 1 line said "No grant exposes them yet", now false; replaced with the grant fact and wake/run-by-supervisor.

## Evidence classes
Source: `head-grants.mjs`, `head-request.mjs`, `head-request.v1.json`, `supervision.rs` (untunable keys, text bounds), `prune.rs`, `observe-kinds.json`, `queue.rs`, `secretary.yaml`, watcher schema (minimum only). Tests: `PruneError::LockTimeout` in `packages/observe/rust/tests/prune.rs`. Stateful reports: phase 1 and 2 dev reports.

## Validation
Relative links and every cited path in the four specs exist (scripted check). Not run: `npm test`, `cargo test`, plan-contract check (docs only; the lead's verify).

## Open
- `head-request.v1.json` `run` entry still says `maxMinutes`/`tier` "secretary only" and the verb's role as "a lead, or the secretary"; the supervisor now runs too (`COORDINATORS` in `head-request.mjs`). Contract text, outside this step.
- `docs/platform/supervision/spec.md` header still says "Spec only ... every verb below is planned" though the verbs are live; left alone (outside the settled facts here).
- Still unproven live, as stated in the specs: `--override '{"tier"}'` acceptance, `watcher tune` from a confined caller, screen read and type through a real terminal, wake from a sandbox.

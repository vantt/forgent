# Phase 7: Handoff as close one record, open the next

Owner confirmed OS-D12 and OS-D19 as final on 2026-11-22 (`q-e2bpqz65c2`). Depends on phases 5 and 6. Decision: OS-D19 (a
handoff between steps closes one record with `outcome: done` and the domain opens the next with `needs`; the payload
and trust boundary stay per `routing-handoff.md`). The three paths of today converge on this shape.

## Inputs

- `packages/supervision/rust/src/supervisor.rs` (`supervisor raise --kind coordination-handoff`).
- `packages/supervision/rust/src/discussion_source.rs`, `core/watcher/definitions/discussion-settled.query.json`
  (settled discussion -> planner, today through a supervisor wake).
- `packages/supervision/rust/src/sources.rs` (phase 5).
- `core/skills/fgos-supervisor/SKILL.md`; `docs/platform/runner/contracts/routing-handoff.md`.

## Footprint

`packages/supervision/rust/src/sources.rs`, `packages/supervision/rust/src/discussion_source.rs`,
`packages/supervision/rust/src/supervisor.rs`, `packages/supervision/rust/tests/sources.rs`,
`packages/supervision/rust/tests/discussion_source.rs`, `core/watcher/definitions/discussion-settled.query.json`,
`core/skills/fgos-supervisor/SKILL.md`, `apps/fgos/src/wiring/supervision.rs`.

## Steps

1. Discussion source: a settled discussion with no plan yet yields a record `item: <discussion id>`, `step: plan`,
   `needs: { role: planner }`; a plan whose `source` names the discussion closes it (`outcome: done`). The
   `discussion-settled` definition then only raises the event; the start comes from the keeper, not a supervisor wake.
2. `supervisor raise --kind coordination-handoff`: becomes a record close plus open through the source that owns the
   item; keep the verb as the entry, drop its separate wake path in the same commit (L10).
3. Agent-to-agent handoff inside a case stays the case's own next activity (phase 5 source); nothing extra.
4. Update the supervisor skill: it no longer starts planners for settled discussions.

## Verify

`cargo test -p fgos-supervision --test sources --test discussion_source`. Pass: a settled discussion yields one
planner record and one start; landing a plan that names it closes the record; a coordination handoff closes one record
and opens the next with one start; no supervisor wake is needed for either.

## Rollback

Revert the phase commit; the supervisor wake path for settled discussions returns with it.

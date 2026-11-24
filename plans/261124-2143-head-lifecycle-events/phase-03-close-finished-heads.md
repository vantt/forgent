# Phase 3: Close finished planners and leads through one door

Closes `p-6hqvgokerb` in code.

## Inputs

- `plans/backlog/p-6hqvgokerb-*.md`: the stop rule waits for `ready` while planners land `draft`; a lead holding a
  short role (`lead:WINCI`) is refused by `session stop`.
- `packages/supervision/rust/src/wake.rs`: `wake`, `decide`, `stop_stuck`, the `StopSession` port
  (`activity`, `stop`) and the `Portfolio` port (`plans`, `done_dirs`).
- `packages/supervision/rust/src/portfolio.rs`: `Plan { status, source, lead, phases, .. }`, `head_name`.
- `apps/fgos/src/wiring/supervision.rs`: the real adapters of those ports.
- `src/session-host/head-stop.mjs` and `test/session-host/head-stop.test.mjs`; `docs/platform/session-host/spec.md`
  (`session stop` row) for the current refusal rules.
- `core/watcher/definitions/plan-became-ready.query.json` as the pattern for a plan-status row.

## Footprint

- `packages/supervision/rust/src/wake.rs`
- `packages/supervision/rust/tests/wake.rs`
- `apps/fgos/src/wiring/supervision.rs`
- `apps/fgos/tests/supervision_verbs.rs`
- `core/watcher/definitions/plan-drafted.query.json`
- `packages/supervision/rust/tests/definitions.rs`
- `packages/supervision/rust/tests/fixtures/definitions/plan-drafted/**`
- `src/session-host/head-stop.mjs`
- `test/session-host/head-stop.test.mjs`

## Steps

1. Add a close step to the wake door that runs on every wake before the start decision. For each plan in the
   portfolio:
   - a plan with `status` `draft` or `ready` whose `source` names a discussion: the planner of that discussion
     (`planner`, head name of the discussion) is stopped when live and `Idle`;
   - a plan in `done_dirs` (or `status: done`) that names a `lead`: that lead is stopped when live and `Idle`,
     whatever its role form.

   Stop through the existing `StopSession` port with the reason `plan landed` or `plan done`. `Busy` and `Unknown`
   are left alone. Each stop emits the wake span with outcome `stopped-finished`; a failed stop is recorded and
   never blocks the start decision.
2. Add `core/watcher/definitions/plan-drafted.query.json` (`fgos.plan.change` = `status`, `fgos.plan.to` = `draft`)
   so a plan landing as `draft` wakes the door. First check that a new plan landing as `draft` produces an
   `fgos.plan.status` record with `to: draft`; if it does not, make the definition read the record the plan's first
   landing does produce, and say so in the phase's result.
3. `session stop` accepts a lead's short `lead:<LANE>` role: `stopHeadSession` resolves the role through Identity to
   its live session and ends it through the same path (stop request to its own supervisor, await the close, retire
   the pane). A role with no head placement gets no `retiredAt` stamp, and the answer says so. The refusal rules for
   other roles stay as they are.
4. Owning proofs:
   - one fixture in `packages/supervision/rust/tests/wake.rs` with a planner whose plan landed as `draft`, a
     `head:lead-*` lead and a `lead:<LANE>` lead whose plans are `done`, and one busy lead of a done plan: one wake
     stops the first three and leaves the busy one;
   - `plan-drafted` raises on its fixture and not on a `ready` change (`definitions.rs`, add it to `RAISED`);
   - the short-role stop in `test/session-host/head-stop.test.mjs`;
   - one wiring proof in `apps/fgos/tests/supervision_verbs.rs` that the real adapter calls `session stop` for a
     finished lead.

## Verify

```bash
cargo test -p fgos-supervision --test wake --test definitions
cargo test -p fgos --test supervision_verbs
node --test test/session-host/head-stop.test.mjs
```

All pass; the wake fixture fails on the tree before this phase.

## Rollback

Revert the phase commit. Planners and leads are again closed only by the supervisor's procedure.

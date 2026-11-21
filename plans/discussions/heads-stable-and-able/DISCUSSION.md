---
id: heads-stable-and-able
title: "Make the secretary and the supervisor heads stable and fully able, as one plan"
status: settled
source:
  - p-vquz26ibnn
  - p-of5vpvce3e
  - p-s2t244hkqj
  - p-ycausep3zs
  - p-5gczifzh7h
  - p-erwx4t7gl6
  - p-ekqtvofdoh
  - p-ndortdckid
  - p-d3ub553ogh
  - p-bakpfrvigb
created: 2026-11-22
---

discussion: settled

This is a brief, not a shaped discussion. The owner settled the scope through Miu on 2026-11-22 (supervision event
`b9985d221c480224`, kind `coordination-handoff`, ref `p-vquz26ibnn`): open ONE plan that closes every gap of
`p-vquz26ibnn` together instead of separate rows, and do not ask the owner tonight. The supervisor wrote this file only
so the planner door has a task to bind to (a planner binds to a discussion directory). The owner decisions recorded in
`plans/backlog/p-vquz26ibnn-make-the-secretary-and-the-supervisor-stable.md` (2026-11-21 17:39 and 21:28) are part of
the settled scope; read that row first.

## Hand-off to the planner

- **Outcome:** the secretary head (Miu) and the supervisor head run stable and can do everything their role needs
  through their request sockets, so other work can move behind them. Every gap below is closed in the same plan, or
  named out of scope with a reason.
- **Scope, folded in (one plan, not separate rows):**
  - `p-vquz26ibnn` items: config patch joins the supervisor grant (owner yes, 2026-11-21); the secretary wakes on new
    owner questions or mail and relays open questions in the five-part form unasked (mechanism proposed by the plan;
    owner chooses later, so make it a plan open point, not a blocker for the rest); time from question asked to owner
    seeing it is measured; a lead that parks a phase on another party raises an event itself.
  - `p-of5vpvce3e` and `p-s2t244hkqj`: a coordinating head is never bound to a provider too weak to coordinate.
  - `p-ycausep3zs`: a long-lived head picks up a newer release (route fixes reach it).
  - `p-5gczifzh7h`: the supervisor checks that a lead's claimed background wait is still going.
  - `p-erwx4t7gl6`: the land door for `plans/` runs the plan check.
  - `p-ekqtvofdoh`: admission writes `base` and `lead` so plan-contract-check passes.
  - `p-ndortdckid`: heads can record friction.
  - `p-d3ub553ogh`: the secretary sandbox has a TMPDIR.
  - `p-bakpfrvigb`: a rotation whose executor dies after starting the successor leaves no orphan state.
  - Supervisor wake rate and false session-idle alarms: measured before and after a tuning change.
  - The retire condition of the manual `lead:SUPERVISOR` session is written: it retires once the supervisor head runs
    one plan end to end alone (owner approved 2026-11-21).
  - A per-verb live probe of both heads' grants from a confined head (not a reading of `GRANTS`), producing the
    verb-by-verb table the owner reads at the end.
- **Constraints:** extend through existing doors (L10, RUL104); grants stay in `src/session-host/head-grants.mjs` as the
  one source; new config keys go into `core/config-standard` and `core/config-schema`; no test-only switches; phases
  small enough to park independently (product priority 2). Coordinate footprint with the draft plan
  `261122-0056-orchestration-skeleton` (wake and watcher code) and the running `261118-1341-s6a-execution-tier-rust`.
- **Non-goals:** the old Work-item `fgos answer` in the secretary sandbox (owner withdrew it 2026-11-21); new
  orchestration primitives owned by `261122-0056-orchestration-skeleton`; Miu's expired login (an owner account action,
  not code).
- **Acceptance criteria:** (1) the per-verb live probe table exists for both heads, each verb passing or named out of
  scope; (2) each folded row is closed by a phase or carries an explicit no with a reason; (3) wake rate and false idle
  alarms have a before and after measurement; (4) the retire condition is written where the supervisor area records
  settled facts; (5) `npm test` and `cargo test --workspace` green.
- **Open points that block only some parts:** the secretary wake mechanism (watcher event, timer or both) is the
  owner's choice after the plan proposes one; it blocks only that phase.

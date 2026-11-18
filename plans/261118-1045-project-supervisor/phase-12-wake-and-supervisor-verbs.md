# Phase 12 — Wake door and supervisor verbs

One door starts the supervisor (`supervisor wake`), and four small verbs let it read and drain the queue. Rust, in
`fgos-supervision`; the host wiring is phase 16.

## Inputs
- Wait: ops-metrics phase 4 (Observe write door, for span `fgos.supervisor.wake`). Phase 2 report
  `plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md` (the service environment a head start needs
  from a timer; if it is absent, stop with `NEEDS_CONTEXT`).
- Phase 3 (`portfolio.rs`: plan rows, order, admissibility), phase 8 (`Queue`), phase 10 (socket verbs
  `supervisor handled|done`, `session stop`).
- `src/session-host/head-start.mjs:202-219` (`startHeadSession` fronts a live holder; the wake door must not call it
  for a live one: fronting every tick would steal the owner's focus), `:65` (`identityHolder`), `:37` (`headRoleOf`).
- Identity directory resolve (`docs/platform/identity/spec.md`; in-process `directory::resolve`, as ops-metrics phase
  11 uses it) for "is `head:supervisor-main` held by a live session".
- Session verb name after the session-verb plan: `fgos session start <persona> --name <name>` (PS-16).
- Config keys from phase 4: `supervisor.maxLeads` and the wake-failure limit (use the landed names).

## Footprint
`packages/supervision/rust/src/wake.rs`, `packages/supervision/rust/src/supervisor.rs`,
`packages/supervision/rust/tests/wake.rs`.

## Steps
0. Re-grep inputs; run `fgos session start --help` on the landed tree; read the spike report.
1. `wake.rs`: `wake(ports, {trigger, ref}) -> WakeOutcome`. Ports: `Identity` (`holder(role) -> Live|NotLive|Unknown`),
   `StartSession` (the adapter runs `<host> session start supervisor --name main` with the environment the spike
   proved), `Queue`, `Telemetry`. Order:
   1. unhandled count 0 -> `nothing-unhandled` (a stale wake does not start a session);
   2. holder `Live` -> `already-live` (the queue is the delivery, PS-9; nothing typed, nothing fronted);
   3. holder `Unknown` -> `identity-unknown`, no start (unknown is never turned into not-live);
   4. else start; `started` on success, `start-failed` with the host's code otherwise.
   Every call emits span `fgos.supervisor.wake` with `trigger`, `ref`, `outcome` (the watcher's
   `supervisor-wake-failed` definition counts `start-failed` and `identity-unknown`; phase 13).
2. `supervisor.rs`, the read and drain verbs as library functions the host calls:
   - `plans(portfolio, live_leads, max_leads) -> PlansView`: portfolio rows in order (`priority`, then `created`),
     each with `admissible` (status `ready`, every `blockedBy` done, no head-name collision, PS-11), plus
     `leadsLive` and `maxLeads`. Lane freedom is not read here; the supervisor reads `fgos slots` for it.
   - `queue(queue) -> Vec<RaisedEvent>`; `handled(queue, ids, by)`; `done(queue)` refuses `events-unhandled` with the
     count when any remain, else answers `{done: true}`.
3. Verb output is JSON with `--json` and one plain line otherwise; refusal codes are the ones named above.
4. Tests in `tests/wake.rs` with fake ports, one behaviour each:
   - no unhandled event -> `nothing-unhandled`, nothing started;
   - a live holder -> `already-live`, the start port is never called;
   - an unknown holder -> `identity-unknown`, nothing started;
   - not live -> started once; a failing start reports `start-failed`;
   - `done` refuses while an event is unhandled and passes after `handled`;
   - `plans` orders by priority then created and marks a blocked and a colliding-name plan not admissible.

## Verify
- `cargo test -p fgos-supervision --test wake` passes; clippy `-D warnings` clean.
- `rg -n "startHeadSession|front" packages/supervision` finds nothing.

## Rollback
Revert the phase commit. No verb exists until phase 16 wires it.

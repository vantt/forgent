# Phase 2: Lead route and permission rows

Capability: `code:implement`, then `code:review`. Starts after phase 1 is on main.

## Inputs

- `plans/261127-0143-widen-running-plan-footprint/plan.md` ("Lead route" decision, acceptance criteria 1 and 3).
- `src/session-host/head-request.mjs`: the `land` route (around lines 280-316: `planOfHead`, `startTicket`), the
  `run --writes` footprint check (around 384-399), `runHeadRequest` (around 591).
- `src/session-host/head-plan.mjs`: `planOfHead` (read only).
- `packages/session-host/contracts/head-permissions.v1.json` (lead and supervisor rows) and its compiled reader
  `packages/session-host/rust/src/permissions.rs` (read only).
- `packages/run-supervisor/contracts/head-request.v1.json` (the `land` entry and the refusal table).
- Phase 1's verb: `fgos supervisor widen` (`apps/fgos/src/wiring/supervision.rs`).

## Files this phase may write

`src/session-host/head-request.mjs`, `test/session-host/head-request.test.mjs`,
`packages/session-host/contracts/head-permissions.v1.json`, `packages/session-host/rust/tests/permissions.rs`,
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/rust/tests/head_request.rs`.

## Steps

1. `head-permissions.v1.json`: lead row `{ "prefix": "supervisor widen", "decision": "allow", "policy": "node" }`;
   supervisor row `{ "prefix": "supervisor widen", "decision": "allow" }` (forward; the secretary inherits it).
   Planner and shaper get none.
2. `head-request.mjs`: the node branch for `supervisor widen` from a lead: resolve the caller's plan with
   `planOfHead` from the envelope role; refuse `plan-not-own` when the argv's plan dir differs; refuse `bad-args`
   for a token starting with `-` where a value is expected; run the host verb `fgos supervisor widen ... --json` on
   a ticket (`startTicket`), read back by `request result`, as `land` does. The lead's grant is not widened.
3. `head-request.v1.json`: document the lead's `supervisor widen` entry and add `plan-not-own` to the refusal table;
   keep `footprint-change-refused` text, adding that the widen verb is the one door a lead changes its footprint
   through. Update `tests/head_request.rs` only if it asserts the contract's verb or refusal lists.
4. Tests:
   - `test/session-host/head-request.test.mjs`, one end-to-end case (criterion 1): a temp project with a running
     plan whose footprint lacks `<p>`; the lead's `run --writes <p>` is refused `write-outside-footprint`; the lead
     requests `supervisor widen <own plan> --phase 1 --path <p> --criterion 1` (host verb real, built host binary as
     the existing route tests use it); `plan.md` at the trunk tip has `<p>` in both copies; the same
     `run --writes <p>` passes the footprint check.
   - same file: a lead naming another plan is `plan-not-own` (criterion 3).
   - `packages/session-host/rust/tests/permissions.rs`: lead `supervisor widen` decides allow/node, planner decides
     ask or deny as the rows say, supervisor decides allow.

## Verify

```bash
node --test test/session-host/head-request.test.mjs
cargo test -p fgos-session-host --test permissions
cargo test -p fgos-run-supervisor --test head_request
cargo test -p fgos-supervision --test land   # footprint-change-refused proofs unchanged
```

Pass: all green; the end-to-end case fails on the parent commit.

## Rollback

Revert this phase's commit: leads lose the route and go back to owner questions; the supervisor's verb from phase 1
stays usable.

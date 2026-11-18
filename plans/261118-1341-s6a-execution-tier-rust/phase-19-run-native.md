# Phase 19: `fgos run` native, internal execution routes, admission peer

Wave 7. Depends on: 18; plan 1045 phase 6 on `main`. Effort 2.5d. First cutover phase.

## Context

`fgos run` is a `legacy-cli` route today; its Node arm builds the request (`src/runner/execution/run-request.mjs`) and
calls `runUnit`. After this phase the host serves it from engine `unit_run`. Node callers of `runUnit` (Workflow) still
run the Node path until phase 20 switches them. The supervisor's attempt step (`packages/run-supervisor/rust/src/attempt_step.rs`)
still finds `node`; P9 moves it to a host route composed from engine `steps`.

## Requirements

- `apps/fgos/src/wiring/run.rs`: native `fgos run "<prompt>" [--provider] [--capability] [--writes --worktree]
  [--unit <file>] [--json] ...`, argv exactly as `src/cli/command-registry.mjs` lists today (phase 00 copies the flag
  table); envelope `data.results[-1].runResult.agentClaim.summary`, `data.results[-1].commit` unchanged (AGENTS.md
  "Dispatch"). `--admission-fd <n>` added as an internal flag (hidden from help) for the Workflow parent.
- P5: when the run asks the port and no `--admission-fd` was given, the host exec's the legacy payload's peer entry
  (`src/workflow/admission-peer.mjs`, through `components.legacyNode.entry` with an internal argv) and talks the same
  protocol; a run that never asks starts no Node.
- `src/workflow/admission-peer.mjs`: thin server of the protocol over `createCaseAdmissionPort`
  (`src/workflow/case-admission-port.mjs:246`); no logic of its own.
- `apps/fgos/src/wiring/execution_routes.rs`: `fgos internal execution <op> --protocol 1` with ops `custody`
  (`runUnderCustody` body as a child command), `verify`, `sweep-attempts`, `cancel`; ops and payloads in
  `packages/execution/contracts/` (phase 18's peer file gains a routes section or a sibling file in this phase's
  footprint: `packages/execution/contracts/execution-routes.v1.json`).
- `apps/fgos/src/wiring/attempt_step.rs` + `attempt_step.rs` in the supervisor: the step runner calls the host route
  with the engine's steps; Node `attempt-step.mjs` and `steps/*` lose their caller (deleted in phase 20).
- Routes: `run` native; regenerate. Delete the `run` arm in `bin/fgos.mjs` and its registry `legacy` handling; Node
  `run-request.mjs` stays only if a Node caller remains (Workflow `case-start.mjs` uses `planFromFlags`: phase 00
  classes it).
- Tests: `cli_tests.rs` one case per run shape (prompt read-only, `--writes --worktree`, `--unit`), with a failing
  `node` on `PATH` for the read-only one; one case for each internal op; `test/cli/run-verb.test.mjs` behaviours moved
  to their Rust owners and the file deleted or cut to its one wiring proof.

## Steps

1. Red: cli cases; parity table `run` (integration only).
2. Wire verb, peer exec, internal routes, attempt-step route; flip route.
3. Delete the Node arm; retire tests; gates.

## Validation

`cargo test -p fgos --test cli_tests run`; `cargo test -p fgos-run-supervisor`; parity; `node scripts/run-tests.mjs
test/rust-host/command-routes.test.mjs test/rust-host/internal-routes.test.mjs test/architecture.test.mjs`; route `run`
native.

## Risk and rollback

Risk: the hook-enforced dispatch flow (`fgos run` from agents) breaks for every project at once. Parity on prompt,
unit and writes shapes; landing precondition nothing in flight. Rollback: revert the phase (Node arm returns).

Footprint note: also `packages/execution/contracts/execution-routes.v1.json`.

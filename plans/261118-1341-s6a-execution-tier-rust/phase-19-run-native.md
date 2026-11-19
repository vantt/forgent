# Phase 19: `fgos run` native, internal execution routes, admission peer

Wave 8. Depends on: 18; plan 1045 phase 6 on `main` (met: `done`, lane pool `47165e3bf`). Effort 3d. First verb cut-over: run the re-sync step of the
phase-lead rules first.

## Context

`fgos run` is a `legacy-cli` route today; its Node arm builds the request (`src/runner/execution/run-request.mjs`),
injects Workflow's `confinedWriteRefusal` and `activityUnitOf` (`case 'run'` at `bin/fgos.mjs:2496`, port injected
`:2499-2505`), builds the case-admission port
(`run-request.mjs:356`) and calls `runUnit`. After this phase the host serves it from engine `unit_run`. Node callers
of `runUnit` (Workflow, Work) still run the Node path until phase 20 switches them to the `run-unit` internal op. The
supervisor's attempt step (`packages/run-supervisor/rust/src/attempt_step.rs:89-116`, routed at `route.rs:188,200` and
`apps/fgos/src/main.rs:245`) still finds `node`; P9 moves it to a
host route composed from engine `steps`. The doctor bridge already starts a legacy-payload module over stdin/stdout
through `legacy_exec::payload_command` (`apps/fgos/src/wiring/doctor/bridge.rs:186-199`,
`apps/fgos/src/legacy_exec.rs:260`).

## Requirements

- `apps/fgos/src/wiring/run.rs`: native `fgos run "<prompt>" [--provider] [--capability] [--writes --worktree]
  [--unit <file>] [--json] ...`, argv exactly as `src/cli/command-registry.mjs` lists today (phase 00 copies the flag
  table); envelope `data.results[-1].runResult.agentClaim.summary`, `data.results[-1].commit` unchanged (AGENTS.md
  "Dispatch"). No new flag, hidden or not (P14).
- P5 = A with P13: when the run asks the port (phase 00 §3: every `--writes` run asks `resolveBinding`; `--case`
  asks `activityUnitOf`; a confined worker's writing run asks `confinedWriteRefusal`), the host starts the payload
  module `src/workflow/admission-peer.mjs` through the bridge's launcher, generalised in `legacy_exec.rs` to a named
  payload module (`payload_launch` moves from `bridge.rs:186-199` into `legacy_exec` and both callers use it: one
  launcher; `NodeBridge::new()` users `wiring/init.rs`, `wiring/dispatch_decide.rs`, `wiring/questions.rs` and
  `wiring/doctor/mod.rs` keep calling the bridge unchanged), and talks the peer protocol over the peer's stdin/stdout. No `bin/fgos.mjs` arm, no inherited fd. A
  read-only run without `--case` starts no Node. Until S6b, every standalone `fgos run --writes` therefore starts one
  Node peer (cost of P5 = A, stated in the CHANGELOG line of phase 22).
- `src/workflow/admission-peer.mjs`: entry script that builds `createCaseAdmissionPort`
  (`src/workflow/case-admission-port.mjs:246`) plus the two Workflow functions and serves them with the generic peer
  server of `src/native/execution-door.mjs` (created here; P14) over `process.stdin`/`process.stdout`; no logic of its own.
- `apps/fgos/src/wiring/execution_routes.rs`: `fgos internal execution <op> --protocol 1`, request on stdin, framed
  lines on stdout (S5 D2 route pattern; `src/seat-binding/client.mjs:3`). Ops: `run-unit` (the full `runUnit` request
  of phase 18's schema; the caller serves the peer over the same stdin/stdout; result framed as the last message),
  `launch-session` (engine `transport` `launchSessionAttempt`, for `src/session-host/head-start.mjs:135`), `custody`
  (`runUnderCustody` body as a child command), `verify`, `sweep-attempts`, `cancel`. Ops and payloads in
  `packages/execution/contracts/execution-routes/execution-routes.v1.json`.
- `src/native/execution-door.mjs` (P14, new, tier 0): `runUnitInHost(request, {caseAdmission, onUnitRunCreated,
  onCaseAdmitted})` and `launchSessionInHost(request)` spawn the host asynchronously (never `spawnSync`), host resolved
  through `src/util/host-bin-path.mjs`, protocol check `host-version-mismatch`, framed peer server over the child's
  stdout/stdin answering from the given port object, error rethrown with its `errorClass`; `executionOp(op, payload)`
  for the short ops; `serveAdmissionPeer(port, input, output)` shared with `admission-peer.mjs`. On child exit
  without `settle` it settles nothing and returns `{ unsettled: { reservationId } }` (P16). Unit-tested here with one
  wiring test; callers switch in phase 20.
- `apps/fgos/src/wiring/attempt_step.rs` + `attempt_step.rs` in the supervisor: the step runner calls the host route
  with the engine's steps; Node `attempt-step.mjs` and `steps/*` lose their caller (deleted in phase 20).
- Doors, same change: the row "no Node from the native packaging verbs" gains `apps/fgos/src/wiring/run.rs` as an
  allowed path with its reason (starts the admission peer through `legacy_exec`), since that row's patterns include
  `\blegacy_exec::`.
- Routes: `run` native; regenerate. Delete the `run` arm in `bin/fgos.mjs` and its registry `legacy` handling; Node
  `run-request.mjs` stays only if a Node caller remains (Workflow `case-start.mjs:26,247` uses `planFromFlags`: phase 00
  classes it).
- Tests: `cli_tests.rs` wiring cases (argv -> request mapping and envelope paths only; outcomes are owned by
  `unit_run.rs`, V19): prompt read-only with a failing `node` on `PATH`, `--writes --worktree` (peer started), `--unit`,
  `--case --activity` (activity resolved through the peer), "a writing run from a confined worker is refused before
  admission through the native door" (F4); one case per internal op; `test/cli/run-verb.test.mjs` behaviours moved to
  their Rust owners and the file deleted or cut to its one wiring proof.

## Steps

1. Re-sync from main; report table.
2. Red: cli cases; parity table `run` (integration only); `execution-door.mjs` wiring test.
3. Generalise the payload launcher; wire verb, peer start, internal routes, attempt-step route; flip route.
4. Delete the Node arm; retire tests; doors edit; gates.

## Validation

`cargo test -p fgos --test cli_tests run`; `cargo test -p fgos-run-supervisor`; doctor bridge tests still green after
the launcher move; parity; `node scripts/run-tests.mjs test/rust-host/command-routes.test.mjs
test/rust-host/internal-routes.test.mjs test/architecture.test.mjs`; route `run` native.

## Risk and rollback

Risk: the hook-enforced dispatch flow (`fgos run` from agents) breaks for every project at once. Parity on prompt,
unit and writes shapes; landing precondition nothing in flight; phase 22 canary. Risk: Node missing on a machine makes
every `--writes` run fail (it already needs Node today through the legacy arm). Rollback: revert the phase (Node arm
returns).

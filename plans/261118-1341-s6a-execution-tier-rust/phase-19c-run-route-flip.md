# Phase 19c: `fgos run` route flip, internal execution ops, attempt-step route

Wave 10, last of three serial phases (19 -> 19b -> 19c). Depends on: 19b. Effort 2d. Cut-over phase: run the re-sync step of
the phase-lead rules first. First verb cut-over: nothing in flight at landing.

## Context

`fgos run` is a `legacy-cli` route (Node arm `case 'run'` in `bin/fgos.mjs`, request built by
`src/runner/execution/run-request.mjs`). Phase 19 landed the Node seam and the payload launcher; phase 19b the host ports.
This phase serves the verb from engine `unit_run`. Node callers of `runUnit` (Workflow, Work) keep the Node path until phase 20.

## Requirements

- `apps/fgos/src/wiring/run.rs`: native `fgos run "<prompt>" [--provider] [--capability] [--writes --worktree] [--unit <file>]
  [--json] ...`, argv exactly as `src/cli/command-registry.mjs` lists; envelope `data.results[-1].runResult.agentClaim.summary`
  and `data.results[-1].commit` unchanged (AGENTS.md "Dispatch"). No new flag, hidden or not (P14).
- Peer start (P5 = A with P13): when the run asks the port (every `--writes` run asks `resolveBinding`; `--case` asks
  `activityUnitOf`; a confined worker's writing run asks `confinedWriteRefusal`), the host starts `src/workflow/admission-peer.mjs`
  through `legacy_exec::payload_module_command` and speaks the peer protocol over its stdin/stdout. No `bin/fgos.mjs` arm, no
  inherited fd. A read-only run without `--case` starts no Node.
- `apps/fgos/src/wiring/execution_routes.rs`: `fgos internal execution <op> --protocol 1`, request on stdin, framed lines on
  stdout. Ops: `run-unit`, `launch-session` (engine `transport` `launchSessionAttempt`, for `src/session-host/head-start.mjs:135`),
  `custody`, `verify`, `sweep-attempts`, `cancel`; contract in `packages/execution/contracts/execution-routes/execution-routes.v1.json`.
- `src/native/execution-door.mjs` (the rest of it): `runUnitInHost(request, {caseAdmission, onUnitRunCreated, onCaseAdmitted})`,
  `launchSessionInHost(request)` and `executionOp(op, payload)`; asynchronous spawn (never `spawnSync`), host through
  `src/util/host-bin-path.mjs`, protocol check `host-version-mismatch`; on child exit without `settle` it settles nothing and returns
  `{ unsettled: { reservationId } }` (P16). Callers switch in phase 20.
- `apps/fgos/src/wiring/attempt_step.rs` + `packages/run-supervisor/rust/src/attempt_step.rs`: the step runner calls the host route
  with the engine's steps; Node `attempt-step.mjs` and `steps/*` lose their supervisor caller (deleted in phase 20, except
  `steps/cleanup-trust.mjs`, which Node dispatch imports until phase 21).
- Error classes: the Rust door must not surface engine port-raised classes (`git-error`, `case-admission-port-failed`) where Node's
  `fanout-batch.mjs:158,181` copies `errorClass || 'error'`; map them to `'error'` as Node did. The run-unit rethrow satisfies
  `instanceof RunnerConfigError` (`CaseAdmissionRefusedError` extends it).
- Windows lease decision, with evidence (LockFileEx across handle inheritance, native Windows CI): Rust holder endpoint
  (`cwdLeaseOwner`) versus custody recording on the supervisor side. Until decided, the Rust route refuses Windows
  `--writes` runs by name and Windows stays on the Node launch route.
- Pre-land proof (OPC): the first binary linking `fgos-execution-engine` builds natively on windows-msvc and macOS;
  `.github/workflows/release-assets-check.yml` gains a macOS job (or uses the platform-probe macOS matrix).
- SECRETARY-CAPS P8 edits `head_client.rs` in run-supervisor and one call each in `apps/fgos/src/wiring/{questions,
  session_rotation_hook,supervision}.rs`: rebase onto it before editing the supervisor `attempt_step.rs` or the wiring files.
- Doors, same change: the row "no Node from the native packaging verbs" gains `apps/fgos/src/wiring/run.rs` as an allowed path
  with its reason (starts the admission peer through `legacy_exec`).
- Routes: `run` native; regenerate. Delete the `run` arm in `bin/fgos.mjs` and its registry `legacy` handling; Node
  `run-request.mjs` stays only while a Node caller remains (Workflow `case-start.mjs` uses `planFromFlags`).
- Tests: `cli_tests.rs` wiring cases (argv to request and envelope paths only; outcomes are owned by `unit_run.rs`): prompt
  read-only with a failing `node` on `PATH`, `--writes --worktree` (peer started), `--unit`, `--case --activity`, a confined
  worker's writing run refused before admission; one case per internal op. `test/cli/run-verb.test.mjs` cut to its one wiring
  proof or deleted, its behaviours owned by their Rust proofs.

- Carried in from 19b (landed bbf64a66d): call `HostUnitRun::run_unit` (installs signal handlers with dispatch.cancelWaitMs), not the engine's run_unit directly; Windows cancel-on-signal has no console handler in any crate yet (part of the Windows decision); pane-preparation errors come back as a coded runner-config error — map to Node's dispatch error class if a caller reads it; the 19b e2e tests are Linux-only.

## Footprint

As the plan table row 19c (evidence: branches `s6/p19c-2`, `s6/p19c-run`, `s6/p19c-run-flip`, `s6/p19c-win`):
`apps/fgos/src/wiring/{run,execution_routes,attempt_step,steps_runner,mod}.rs`, `apps/fgos/src/wiring/unit_run_host/**`,
`apps/fgos/src/wiring/doctor/terminal.rs`, `apps/fgos/src/{main,routing,cli_projector}.rs`,
`apps/fgos/tests/{cli_tests,windows_cwd_lease_owner}.rs`, `packages/host-runtime/rust/src/catalog.rs` and
`packages/host-runtime/contracts/command-route{s,-annotations}.json`, `packages/run-supervisor/rust/{src,tests}/**`,
`packages/run-supervisor/rust/examples/internal_harness.rs`, `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`,
`packages/execution/contracts/execution-routes/**`, `packages/execution/engine/src/assignment_runner/**`,
`packages/execution/rust/src/{bind.rs,patterns/**,run_request/**}`, `packages/holder-lock/rust/src/route.rs` and
`route/hold.rs`, `packages/process/rust/{Cargo.toml,src/lib.rs,src/interrupt.rs}`, `packages/git/contracts/mutation-census.v1.json`,
`.github/workflows/release-assets-check.yml`, `docs/architecture-manifest.json`, `docs/platform/run-supervisor/spec.md`,
`src/cli/command-registry.mjs`, `bin/fgos.mjs`, `src/native/execution-door.mjs`, `test/cli/{run-verb,dir-differs-from-cwd,
execution-outcome-exit-codes,fgos-case-doors}.test.mjs`, `test/helpers/cli-entry.mjs`, `test/run-supervisor/{cancel-registry,
crash-matrix-adopt-resume,resume-adopts}.test.mjs`, `test/run-supervisor/support/**`, `test/runner/dispatch-execute-effort.test.mjs`,
`test/rust-host/**`, `test/workflow/{confined-nested-write,workflow-runner-cli}.test.mjs`.

## Steps

1. Re-sync from main; report table.
2. Red: cli cases; parity table `run` (integration only); `execution-door.mjs` wiring test additions.
3. Wire verb, peer start, internal routes, attempt-step route; flip route.
4. Delete the Node arm; retire tests; doors edit; gates.

## Validation

`cargo test -p fgos --test cli_tests run`; `cargo test -p fgos-run-supervisor`; parity; `node scripts/run-tests.mjs
test/rust-host/command-routes.test.mjs test/rust-host/internal-routes.test.mjs test/architecture.test.mjs`; route `run` native;
macOS and windows-msvc build of the engine-linking binary green.

## Risk and rollback

Risk: the hook-enforced dispatch flow (`fgos run` from agents) breaks for every project at once. Parity on prompt, unit and
writes shapes; landing precondition nothing in flight; phase 22 canary. Risk: Node missing makes every `--writes` run fail (it
needs Node today through the legacy arm). Rollback: revert the phase (Node arm returns).

## Windows lease decision (2026-11-20, evidence)

Evidence, native `windows-latest`, run 44627498081 job "windows lock inheritance probe" (inline C# probe in
`.github/workflows/release-assets-check.yml`; `LockFileEx` byte 0 length 1, exclusive, fail-immediately, the holder-lock
Windows driver's call):

| Probe | Result | Reading |
|---|---|---|
| a. child `LockFileEx` on the handle it inherited while the parent holds the lock | failed (33, `ERROR_LOCK_VIOLATION`) | the lock belongs to the parent process, not to the handle |
| a. child `UnlockFileEx` on the inherited handle | failed (158, `ERROR_NOT_LOCKED`) | the child cannot release it either |
| b. child, fresh handle, while the parent holds | failed (33) | a third party is excluded |
| c. parent locks, child inherits the handle, parent is terminated; a third process locks | succeeded at +0.5 s and +3.5 s | the lock dies with the process that took it, though the handle lives on in the child |
| d. child locks on the inherited handle, parent is terminated; a third process locks | failed (33) at +0.5 s and +3.5 s | a lock lives exactly as long as the process that took it |

So on Windows a lock is never lent through a handle (the Unix fd-4 lend cannot exist) and is held only by the process
that took it, for that process's life (matches `packages/holder-lock/rust/src/driver/windows.rs` header and
`borrow_windows.rs`).

Decision: **Rust lease-holder endpoint** (`cwdLeaseOwner`), not custody recording on the supervisor side.
- The unit run's custody spans the whole unit run (every attempt, verify, the commit); a supervisor lives for one
  attempt. Supervisor-side recording would make the controller release the lease and the supervisor take it again
  (probe c/d: nothing carries a lock across processes), leaving a window where a successor is admitted between attempts.
- The controller already holds the cwd lease in its own process (`admit_successor`, engine `unit_run::custody`), which
  probe d shows is the only process that can hold it. The supervisor already speaks the holder's request channel
  (`declare_via_holder`, `packages/run-supervisor/rust/src/supervise/windows.rs`; the lock-hold helper's serve loop,
  `packages/holder-lock/rust/src/route/hold.rs`). The endpoint is that same file request/answer protocol, served by a
  thread of the controller over its held `Handle` (`predecessor::declare` on the lease record; no new mechanism, no new
  record, no OS handle passed).
- Until the endpoint is built and proven on native Windows CI, engine `mutating_launch_refusal` keeps refusing a
  Windows mutating attempt by name (`windows-cwd-lease-holder-missing`), and Windows `fgos run` stays on the Node route
  (this pass does not flip the route). Cancel on Ctrl-C/Ctrl-Break on Windows needs a console handler, which no crate
  installs yet; it lands with the endpoint.

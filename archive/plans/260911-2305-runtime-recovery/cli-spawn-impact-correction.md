# CLI Spawn Impact Correction

**Status:** OPEN DESIGN DELTA  
**Date:** 2026-09-12

## Omission

The first impact inventory centered Herdr and failed to name `cli-spawn`, even
though runner CTR009 v2 defines it as the default production adapter. The prior
core-ready verdict is withdrawn until P02L is independently reviewed.

## Existing Components Affected

- `src/runner/dispatch/transport.mjs`: `cliSpawnAdapter`, timeout, maxBuffer,
  live chunking, environment and detached process-group lifecycle;
- `src/runner/dispatch/cli.mjs`: `spawnWorker` and `executeExecutorCli`
  confinement/request construction;
- `src/runner/dispatch/assignment-runner.mjs`: Run identity and launch command
  passed to the adapter;
- `src/runner/dispatch/visibility-session.mjs`: durable local resource
  incarnation;
- `src/runner/dispatch/confinement/authority.mjs`: proof that the supervisor
  executes exactly the prepared invocation;
- `src/runner/dispatch/confinement/request.mjs`: request/context shape for
  launch identity, execution options and artifact paths;
- `src/runner/dispatch/confinement/attestation-store.mjs` and related resource
  drivers: protected proof storage and recoverable cleanup/finalization;
- `src/runner/dispatch/assignment-runner.mjs`'s evidence baseline: `gitBefore`,
  dirty-before snapshots and RunResult normalization inputs must survive
  coordinator death;
- cwd occupancy/concurrency guards: local recovery must not claim shared-cwd
  mutating takeover without a separate quiescence proof;
- dispatch and production-call-site tests covering adapter parity.

## New Component

`src/runner/dispatch/cli-spawn-supervisor.mjs` is a narrow adapter mechanism for
Assignment-owned Runs. It self-publishes process identity, persists
protected stdout/stderr capture and an immutable protected adapter receipt, and owns the
existing timeout/process-group mechanics after coordinator death. The worker
uses a process group distinct from the supervisor, so termination cannot kill
the evidence writer first. It is not a daemon, registry, policy engine, command
owner or settlement authority.

Confinement Authority publishes the immutable executable launch envelope before
submission and persists an idempotent finalization descriptor for resources it
creates. The controller writes a pre-launch evaluator baseline before launch.
These are required because today's post-adapter attestation, cleanup closure
and RunResult baseline live in the coordinator process.

The detailed P02L contract is
[`phase-designs/cli-spawn-local-contract.md`](phase-designs/cli-spawn-local-contract.md).

## Capability Consequence

- Default local Run recovery cannot be called complete without P02L.
- Legacy ad-hoc `cli-spawn` must remain behavior-compatible.
- `http` has no production recovery profile and parks after interruption.
- Herdr remains P02H; its existing review does not prove local process recovery.

## Required Review

Verify supervisor/confinement ordering, parent and supervisor crash windows,
stdout/stderr/result durability, PID reuse, escaped descendants, timeout and
maxBuffer parity, and whether any simpler existing primitive provides the same
evidence without relying on the worker agent.

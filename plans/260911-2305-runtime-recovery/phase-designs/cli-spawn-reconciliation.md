# S2/P02L - CLI Spawn Reconciliation

**Status:** DESIGN READY; IMPLEMENTATION HANDOFF ON HUMAN HOLD  
**Owner:** default `cli-spawn` adapter lifecycle  
**Depends on:** P01 Run admission and control token

**Normative local contract:** [cli-spawn-local-contract.md](cli-spawn-local-contract.md)

## Goal

Make the default local-process adapter recoverable without changing legacy
ad-hoc `cli-spawn`: an Assignment-owned Run launches once, records process
identity and output durably, and never guesses that a missing parent means the
worker is absent.

## Why Existing Behavior Is Insufficient

Current `cliSpawnAdapter` creates a detached process-group leader and keeps
stdout/stderr plus timeout state in the coordinator process. If that process
dies after `spawn()`:

- the detached executor or descendants may continue;
- PID/start-time is not durably bound to the Run;
- buffered output and final status may be lost;
- a replacement coordinator cannot distinguish never-spawned from
  spawned-before-binding.

## Assignment-Owned Launch Contract

The implementation has one producer sequence, defined normatively in the local
contract: current controller commits command `not-requested -> pending`, writes
the evaluator baseline, asks Confinement Authority to publish the immutable
launch envelope from the named `assignmentLaunchContext`, records the envelope
digest on the pending command, then submits the supervisor with only the
envelope path.

Only the controller that commits `not-requested -> pending` may make the first
submission. Every later controller reconciles or parks. It never resubmits a
pending command merely because `visibility.json` is absent. If a crash leaves a
reconciled command before Run settlement, recovery resumes normalization and
settlement from the stored outcome instead of writing a second outcome. A
recorded `submission-refused` outcome resumes failed settlement without
requiring binding or receipt evidence.

The full schema, artifact layout and crash handling are not repeated here; the
implementation cell follows
[cli-spawn-local-contract.md](cli-spawn-local-contract.md). That file closes
the P02L review findings by keeping worker outbox separate from protected
supervisor capture/evidence, persisting a pre-launch evaluator baseline,
defining the executable launch envelope, defining the typed adapter receipt,
and making confinement finalization recoverable.

## Supervisor Boundary

Assignment-owned CLI runs use a small Node supervisor process. Legacy/ad-hoc
runs continue through today's adapter unchanged.

Before supervisor submission, Confinement Authority atomically writes an
immutable launch envelope containing the fully resolved prepared invocation,
execution options, confinement decision, Run identity, command identity, control
epoch and token digest. A missing, partial or digest-mismatched envelope parks
or refuses according to the local contract. The supervisor receives only the
envelope path; it does not receive the clear control token and cannot settle
the Run.

The supervisor:

1. starts as its own process-group leader;
2. atomically publishes supervisor PID/start-time/host/boot identity;
3. verifies and spawns exactly the envelope's Confinement Authority-prepared
   worker invocation without recomputing command, environment, model or policy;
4. spawns the worker as leader of a process group distinct from the supervisor,
   then atomically extends binding with worker PID/start-time/PGID;
5. writes canonical stdout/stderr capture under protected supervisor storage
   while delivering bounded best-effort live `onChunk` events when the
   coordinator is present;
6. atomically writes an immutable protected adapter receipt with typed
   completion, output digests, process-tree coverage and the launch-envelope
   digest;
7. applies existing absolute timeout, idle timeout and maxBuffer semantics by
   signalling the worker PGID; the supervisor survives that signal long enough
   to flush the receipt.

The supervisor is adapter mechanics and evidence producer, not a policy,
command-state or settlement authority. It may execute only the invocation in
the immutable envelope supplied by `executeThroughConfinement`. If confinement
cannot publish or verify that envelope, launch refuses rather than falling back
to an unconfined child. Only a controller holding the current control token may
collect the receipt into the authoritative command outcome and settle the Run.

## Durable Evidence

Local execution stores host id, boot id, supervisor PID/start-time/PGID, worker
PID/start-time/PGID and receipt digests under the protected proof area defined
by the local contract. `controller/commands/<launchCommandId>.json` is
controller-owned and records pending plus the collected authoritative outcome
under epoch/token proof. The supervisor writes only protected binding/receipt
proof plus protected stdout/stderr capture. Worker-authored outbox files stay
under `worker-output/outbox` and are never treated as supervisor capture. PID
without boot id and process start time never proves incarnation.

## Crash Matrix

| Crash | Recovery |
|---|---|
| before pending commit | fresh transition may be attempted |
| after pending, before supervisor spawn | `unknown`, park; no second spawn unless a stored `submission-refused` outcome resumes failed settlement |
| after supervisor spawn, before parent observes | supervisor self-publishes binding; reconcile |
| after supervisor binding, before worker spawn | a live matching supervisor finishes the envelope; otherwise park; never create another |
| worker running, coordinator dead | supervisor persists protected capture/receipt; replacement observes |
| worker timeout/maxBuffer | supervisor signals worker PGID, survives, writes receipt |
| PID reused | start-time mismatch, refuse control |
| supervisor dies, worker state unknown | park; do not infer worker-tree death |
| receipt written, Run unsettled | current controller validates envelope/receipt digests, records command outcome, normalizes, then exact Run settlement may collect |
| command outcome written, Run unsettled | current controller resumes normalization and settlement from the stored outcome; no second outcome write |
| Run settled, cleanup pending | Confinement Authority resumes cleanup or retained-state publication from its finalization descriptor, including already-absent-after-owned-delete recovery |

The expanded 17-window matrix is in
[cli-spawn-local-contract.md#crash-matrix](cli-spawn-local-contract.md#crash-matrix).

## Acceptance

- legacy ad-hoc `cli-spawn` results, timeout, maxBuffer, chunking and process
  group behavior remain compatible;
- Assignment-owned fresh launch produces one supervisor group and one distinct
  worker process group;
- injected coordinator death after spawn preserves binding, protected capture and outcome;
- pending-without-binding never spawns a duplicate;
- PID reuse and boot mismatch refuse inspect/kill/settle;
- escaped descendants are not claimed terminated without worker-tree coverage;
- an incomplete/tampered launch envelope refuses before worker spawn;
- Confinement Authority's envelope and supervisor receipt prove the real worker
  invocation without granting settlement authority to the supervisor;
- stale-control recovery may read a receipt but cannot publish command outcome
  or settle;
- F-b/F-f equivalents pass for local processes.
- recovered collection uses the controller's pre-launch evaluator baseline;
- recovered confinement cleanup/finalization is idempotent and bound to
  existing confinement dispatch/resource/attestation identity plus ownership
  marker proof;
- submission refusal before supervisor ownership resumes failed settlement
  without binding/receipt verification;
- recovered destructive cancellation and shared-cwd takeover remain unsupported
  in this cell.

## Non-goals

No generic daemon, process registry, shell invocation, agent-authored
checkpoint or automatic resubmit after ambiguous pending state.

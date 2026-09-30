# P02L Local CLI Spawn Contract

**Status:** DESIGN READY; IMPLEMENTATION HANDOFF ON HUMAN HOLD  
**Date:** 2026-09-12  
**Owner:** Assignment-owned local `cli-spawn` profile  
**Supersedes local details in:** `cli-spawn-reconciliation.md`

This is the single implementation contract for making Assignment-owned
`cli-spawn` recoverable. Other documents should summarize or link here rather
than restating these rules.

**Shared adapter seam:** [confinement-adapter-contract.md](confinement-adapter-contract.md)

## Design Aim

Keep the existing `cli-spawn` behavior for legacy and ad-hoc dispatch, and add
recovery only for schema-2 Assignment-owned Runs. Recovery means:

1. a fresh launch is submitted once;
2. a worker that survives coordinator death keeps producing durable evidence;
3. a resumed controller can collect proven evidence without stale settlement;
4. ambiguous launch, process, output, workspace or cleanup state parks instead
   of retrying or guessing.

The minimal extra moving part is one per-Run supervisor process. It exists
because today's coordinator owns stdout/stderr buffers, timeout timers,
process-group kill and final result assembly in memory. When that coordinator
dies, no current primitive continues those duties.

## Existing Behavior To Preserve

The new path must match current `cliSpawnAdapter` semantics unless a test names
an intentional change:

| Behavior | Existing source contract | P02L requirement |
|---|---|---|
| Shell | `spawn(command, args, { shell: false })` | unchanged |
| Stdin | `stdio: ['ignore', 'pipe', 'pipe']` | unchanged |
| Cwd | adapter option `cwd` | stored in envelope, executed exactly |
| Env | `process.env`, resolved executor env, incremented `FGOS_DISPATCH_DEPTH` | resolved once before envelope publication |
| Encoding | stdout/stderr UTF-8 strings | logs and returned capture use UTF-8 |
| `onChunk` | called before maxBuffer accounting | live stream preserves order when connected |
| maxBuffer | combined stdout+stderr byte count; overflow chunk is teed but not appended to returned capture | unchanged |
| Normal completion | waits for `close`, not `exit` | unchanged |
| Timeout/idle/maxBuffer | signal worker process group and settle immediately | unchanged outcome timing |
| Escaped descendants | may keep pipes open; timeout path still returns immediately | unchanged, reported as partial process-tree coverage |
| Error class | timeout -> `worker-timeout`; maxBuffer/spawn -> `worker-spawn-fail` | unchanged |
| Legacy/ad-hoc dispatch | direct adapter path | unchanged, no supervisor |

Byte-for-byte output text is not required for new schema-2 recovered receipts,
but semantic result fields, error classes and timing contracts are.

## Artifact Layout

The worker write grant and supervisor proof must not overlap. The layout is:

```text
assignments/<assignmentId>/runs/<attempt>/
  run.json
  dispatch-plan.json
  worker-output/
    outbox/
      agent-result.json or result-<n>.json
      agent-report.md or report-<n>.md
  controller/
    evaluator-baseline.json
    commands/<launchCommandId>.json
  protected/
    launch-envelope/<launchCommandId>.json
    supervisor-binding/<launchCommandId>.json
    capture/<launchCommandId>/
      stdout.log
      stderr.log
    adapter-receipts/<launchCommandId>.json
    confinement-finalization/<launchCommandId>.json
```

`worker-output/` is the only Run-directory subtree that may be writable by the
worker, and it contains worker-authored outbox files only. Canonical
stdout/stderr capture is supervisor-authored proof under
`protected/capture/<launchCommandId>/`; the worker must not be able to create,
truncate, replace or unlink those files. `protected/` and `controller/` are
host-side proof areas. A confinement profile that cannot give the worker its
outbox without also granting `protected/` or `controller/` must refuse recovery
launch. For explicit unconfined execution, P02L may still persist evidence but
must mark tamper confidence `unknown`; recovered settlement from supervisor
files is disabled.

The controller may project `stdout.log`, `stderr.log`, `exit.json`,
`evidence.json` and `result.json` at the legacy top level, or mirror
stdout/stderr for operator convenience after collection. Those projections are
not supervisor evidence and may be rebuilt only from the protected capture,
protected receipt and worker outbox.

## Atomic Publication

Every durable proof file is published by:

1. write full content to a temp file in the same directory;
2. fsync the file;
3. publish with exclusive create or non-overwriting hard link;
4. fsync the directory.

Mutable projections use temp plus rename under the owning lock. Immutable
proof files are never overwritten. If the filesystem cannot provide the
required local guarantees, P02L refuses with
`local-publication-unsupported`; setup/doctor must probe this before the
profile is advertised.

## Structured Confinement Request Context

The trusted controller passes one named request member into
`buildConfinementRequest`:

```json
{
  "assignmentLaunchContext": {
    "contract": "assignment-cli-spawn-launch-context.v1",
    "run": {
      "runId": "<runId>",
      "assignmentId": "<assignmentId>",
      "attempt": 1,
      "dispatchPlanDigest": "sha256:<hex>",
      "evaluatorBaselineDigest": "sha256:<hex>"
    },
    "command": {
      "launchCommandId": "<id>",
      "controlEpoch": 3,
      "controlTokenDigest": "sha256:<hex>"
    }
  }
}
```

The request builder validates that this context matches the current Run handle,
command state and evaluator baseline digest, then preserves it into the
prepared confinement plan and launch envelope. It may reject unknown or
mismatched context, but it must not reconstruct a different Run/command identity
inside the confinement layer. This is a schema addition to the existing request
object, not a new dispatch path.

## Launch Envelope V1

Confinement Authority owns envelope creation. It writes the envelope after
Run admission and command pending, and before supervisor submission. The
supervisor receives only the envelope path.

```json
{
  "contract": "cli-spawn-launch-envelope.v1",
  "run": {
    "runId": "<runId>",
    "assignmentId": "<assignmentId>",
    "attempt": 1,
    "dispatchPlanDigest": "sha256:<hex>",
    "evaluatorBaselineDigest": "sha256:<hex>"
  },
  "command": {
    "launchCommandId": "<id>",
    "state": "pending",
    "controlEpoch": 3,
    "controlTokenDigest": "sha256:<hex>"
  },
  "invocation": {
    "adapter": "cli-spawn",
    "command": "<absolute-or-path-command>",
    "args": ["<arg>"],
    "cwd": "<absolute cwd>",
    "env": { "KEY": "resolved value" },
    "stdin": "ignore",
    "encoding": "utf8",
    "dispatchDepth": 2,
    "timeoutMs": 900000,
    "idleTimeoutMs": null,
    "maxBuffer": 10485760
  },
  "confinement": {
    "decision": "execute",
    "launchContextDigest": "sha256:<hex>",
    "persistedPlanRef": "protected/confinement-finalization/<launchCommandId>.json#preparedPlan",
    "attestationPlanDigest": "sha256:<hex>",
    "preparedInvocationDigest": "sha256:<hex>",
    "cleanupDescriptorRef": "protected/confinement-finalization/<launchCommandId>.json"
  },
  "paths": {
    "workerOutboxDir": "worker-output/outbox",
    "protectedCaptureDir": "protected/capture/<launchCommandId>",
    "protectedDir": "protected",
    "controllerDir": "controller"
  },
  "publishedAt": "<ISO-8601>",
  "digest": "sha256:<canonical-json-without-digest>"
}
```

The envelope contains the resolved execution environment. It must not contain
the clear control token, inherited secrets that the worker does not need, or
arbitrary host cleanup paths. If a configured env var is required by the
worker, it is already part of the invocation and may appear. If that makes the
envelope too sensitive for the durable proof store, the profile must park or
use a future secret handoff; it must not re-resolve env in the supervisor.

Filesystem ownership and confinement are the trust boundary. No MAC or
signature is required when the worker cannot write `protected/` and the
controller is same-user trusted code. Digest checks protect against partial
publication, accidental mixups and stale/cross-Run collection, not against a
same-user process with write access to the protected tree.

## Evaluator Baseline V1

The controller writes the evaluator baseline before envelope publication and before any worker process can run:

```json
{
  "contract": "run-evaluator-baseline.v1",
  "runId": "<runId>",
  "assignmentId": "<assignmentId>",
  "cwd": "<absolute cwd>",
  "gitBefore": "<sha|null>",
  "gitBeforeSource": "pre-launch",
  "dirtyBefore": ["path"],
  "dirtyBeforeSnapshots": {
    "path": { "exists": true, "sha256": "<hex>" }
  },
  "capturedAt": "<ISO-8601>",
  "digest": "sha256:<canonical-json-without-digest>"
}
```

Recovered collection must use this baseline. Missing, corrupt or digest-
mismatched baseline parks with `evaluator-baseline-missing` or
`evaluator-baseline-mismatch`; it never samples Git after the fact and labels
that sample `pre-launch`.

## Command State V1

`controller/commands/<launchCommandId>.json` is controller-owned:

```json
{
  "contract": "run-launch-command.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "controlEpoch": 3,
  "controlTokenDigest": "sha256:<hex>",
  "state": "pending|reconciled",
  "envelopeDigest": null,
  "bindingDigest": null,
  "receiptDigest": null,
  "outcome": null
}
```

`outcome` is one of two shapes:

```json
{
  "kind": "receipt-backed",
  "receiptDigest": "sha256:<hex>",
  "adapterCompletion": { "kind": "exited|signaled|timeout|idle-timeout|max-buffer|spawn-failed|unknown" }
}
```

```json
{
  "kind": "submission-refused",
  "reason": "launch-envelope-invalid|local-publication-unsupported|confinement-refused|supervisor-spawn-refused",
  "failureDetail": {
    "message": "<bounded message>",
    "code": "<stable code|null>",
    "source": "controller|confinement-authority|supervisor-launch"
  },
  "failureDigest": "sha256:<canonical-json-of-kind-reason-failureDetail-failedAt>",
  "failedAt": "<ISO-8601>"
}
```

The controller first commits `not-requested -> pending` with `envelopeDigest:
null`. After Confinement Authority publishes the immutable envelope, the same
current controller performs one guarded update that records `envelopeDigest`
while the state remains `pending`. After the supervisor publishes binding, the
collector records `bindingDigest`. Worker spawn failure inside a running
supervisor is receipt-backed: it has supervisor binding and adapter receipt
evidence. Refusal before a supervisor can own the worker path is
`submission-refused`: the current controller records the persisted failure
details, no binding and no receipt. A successful worker receipt records
`state: "reconciled"`, `receiptDigest` and the normalized command outcome.

Only a controller holding the current clear token may update this file. The
supervisor never writes it. A stale controller may read receipt evidence but
cannot publish command outcome or settle the Run. If a crash leaves
`state: "reconciled"` before Run settlement, the next current controller
resumes normalization and exact Run settlement from the stored outcome instead
of writing a second outcome or parking. `submission-refused` resumes to a failed
Run settlement from its persisted failure details; it does not try to verify a
missing binding or receipt.

## Supervisor Binding V1

The supervisor starts as its own process-group leader and publishes:

```json
{
  "contract": "cli-spawn-supervisor-binding.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "envelopeDigest": "sha256:<hex>",
  "host": "<host-id>",
  "bootId": "<boot-id>",
  "supervisor": {
    "pid": 1234,
    "processStartTime": "<os-start>",
    "pgid": 1234
  },
  "worker": null,
  "publishedAt": "<ISO-8601>"
}
```

After worker spawn, the supervisor publishes exactly one immutable worker
binding extension at
`protected/supervisor-binding/<launchCommandId>.worker.json`:

```json
{
  "contract": "cli-spawn-worker-binding.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "envelopeDigest": "sha256:<hex>",
  "supervisorBindingDigest": "sha256:<hex>",
  "worker": {
    "pid": 4567,
    "processStartTime": "<os-start>",
    "pgid": 4567
  },
  "workerSpawnedAt": "<ISO-8601>",
  "digest": "sha256:<canonical-json-without-digest>"
}
```

`bindingDigest` in the adapter receipt hashes the supervisor binding and, when
present, this worker-binding extension as an ordered pair. For `spawn-failed`
before worker spawn, `bindingDigest` hashes the supervisor binding only and the
receipt states `workerBindingDigest: null`. The worker PGID must differ from
the supervisor PGID. PID alone is never a match. Any PID/boot/start-time
mismatch returns `incarnation-mismatch`.

## Adapter Receipt V1

The supervisor writes one immutable receipt:

```json
{
  "contract": "cli-spawn-adapter-receipt.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "envelopeDigest": "sha256:<hex>",
  "bindingDigest": "sha256:<hex>",
  "completion": {
    "kind": "exited|signaled|timeout|idle-timeout|max-buffer|spawn-failed|unknown",
    "exitCode": 0,
    "signal": null,
    "errorClass": null,
    "cause": null,
    "settledAt": "<ISO-8601>",
    "durationMs": 1234
  },
  "output": {
    "stdoutPath": "protected/capture/<launchCommandId>/stdout.log",
    "stderrPath": "protected/capture/<launchCommandId>/stderr.log",
    "stdoutDigest": "sha256:<hex>",
    "stderrDigest": "sha256:<hex>",
    "stdoutBytesCaptured": 123,
    "stderrBytesCaptured": 0,
    "maxBufferBytes": 10485760,
    "overflowChunkDeliveredToLiveStream": true
  },
  "processTree": {
    "terminationTarget": "worker-pgid",
    "terminatedPgid": 4567,
    "coverage": "process-group|partial-escaped-descendant-possible|unknown",
    "stoppedProof": "not-claimed"
  },
  "digest": "sha256:<canonical-json-without-digest>"
}
```

Live observation is bounded, best-effort and non-authoritative. `onChunk`
callback failure, coordinator disconnect or live-channel backpressure may drop
observation, but must not block supervisor capture, timers or receipt
publication. The receipt and protected capture are the durable truth.

For every terminal path the supervisor freezes accepted capture once, stops
further capture accounting and timers, fsyncs protected stdout/stderr, then
publishes the immutable receipt. Receipt publication failure means there is no
successful durable completion claim; recovery observes missing/corrupt receipt
and parks or waits according to the crash matrix. Timeout, idle-timeout and
maxBuffer receipts are published immediately after the supervisor signals the
worker PGID and freezes/fsyncs captured output. They do not wait for all pipes
to close and do not claim all descendants stopped. A normal `exited` or
`signaled` completion waits for `close`, preserving the current no-output-loss
contract.

For maxBuffer, the chunk that crosses the limit is emitted to live `onChunk`
before accounting, but is not appended to the protected stdout/stderr body if
that matches today's returned result. The receipt must state this capture
boundary. Byte-for-byte presentation may differ for schema-2 projections, but
the protected captured content and byte counts must preserve the adapter result
semantics.

## Confinement Finalization

Confinement Authority remains the lifecycle owner. Before supervisor
submission it persists a finalization descriptor containing only resources it
created and is allowed to clean:

```json
{
  "contract": "confinement-finalization.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "backend": "local-bwrap-v1",
  "dispatchId": "<confinement-dispatch-id>",
  "resourceOwner": "confinement-authority",
  "preparedPlan": {
    "planRef": "<persisted-confinement-plan-ref>",
    "planDigest": "sha256:<hex>"
  },
  "attestationPlanDigest": "sha256:<hex>",
  "preparedInvocationDigest": "sha256:<hex>",
  "finalAttestation": {
    "state": "pending|published|failed",
    "resultRef": null,
    "resultDigest": null
  },
  "resources": [
    {
      "kind": "temporary-directory",
      "resourceId": "<authority-resource-id>",
      "planEntryDigest": "sha256:<hex>",
      "ownershipMarkerDigest": "sha256:<hex>",
      "pathRef": "<authority-owned-resource-ref>"
    }
  ],
  "cleanupState": "pending|cleaned|retained",
  "cleanupResult": null,
  "retainUntil": "safe-cleanup-proof-or-manual-review",
  "updatedAt": "<ISO-8601>",
  "digest": "sha256:<immutable-identity-fields>"
}
```

The identity fields of this descriptor are immutable. `finalAttestation`,
`cleanupState`, `cleanupResult` and `updatedAt` are guarded mutable progress
fields updated by Confinement Authority with temp-write, fsync and rename under
that descriptor's owner lock. Resource ids resolve only to entries in the
persisted, digest-verified confinement plan, and cleanup rechecks the matching
ownership marker before deletion. Unknown `resourceId`, digest mismatch or
ownership-marker mismatch retains with a typed reason.

The process-local cleanup closure may still run on the legacy live path. In
P02L, cleanup must also be idempotently recoverable by Confinement Authority:
a later current controller loads this descriptor, resolves only the listed
Authority resource ids, verifies the attestation/prepared-invocation digests,
and writes a final attestation result separately from the cleanup result.
Cleanup is allowed only when the receipt and process-tree evidence prove the
resource is no longer in use, or when the descriptor was never handed to a
worker because spawn failed before worker spawn. Timeout, idle-timeout,
maxBuffer, host reboot or partial escaped-descendant coverage retain resources
with a typed reason unless adequate stopped-tree proof exists. If deletion
succeeds and the cleanup-result write crashes, recovery resolves the resource
id again, observes the missing owned path plus matching prior marker digest,
and publishes `cleanupState: "cleaned"` with `cleanupResult.kind:
"already-absent-after-owned-delete"`; if ownership cannot be proven, it
retains. Each step is resume-safe: after final attestation publication, after
cleanup success, and after retained-state publication, repeating finalization
observes the durable state and does not delete anything twice. The supervisor
may report that it is done with a resource, but it does not decide deletion of
Confinement Authority resources.

## Launch Sequence

```text
controller:
  acquire current Run control epoch/token
  verify Run current, not cancelled, command state not-requested
  commit command not-requested -> pending with token digest and null envelopeDigest
  write evaluator-baseline.v1
  pass assignmentLaunchContext to Confinement Authority request builder
  ask Confinement Authority to validate/preserve that context and publish launch-envelope.v1
  guarded update of pending command with envelopeDigest
  submit supervisor with only envelope path
  record submission result: supervisor-started or submission-refused
  release outer locks; do not wait under Assignment/session locks

supervisor:
  start as own process-group leader
  read envelope; verify digest, contract, adapter, paths, command identity
  refuse before worker spawn if envelope invalid or partial
  publish supervisor binding
  spawn worker with shell:false, stdin ignored, resolved env, cwd and limits
  make worker a distinct process-group leader
  extend binding with worker incarnation
  append UTF-8 stdout/stderr to protected capture; deliver optional live chunks best-effort
  enforce timeout, idle-timeout and maxBuffer against worker PGID
  publish immutable adapter receipt

collector:
  acquire current Run control epoch/token
  verify command pending or reconciled under current token
  if outcome is submission-refused: resume failed settlement from stored failure details
  otherwise verify envelope digest, binding digest and receipt digest when not already recorded
  otherwise verify protected capture/receipt files are outside worker write grant
  read evaluator baseline
  if command is pending with receipt: write receipt-backed command outcome under current token
  if command is reconciled: reuse stored outcome without rewriting it
  normalize RunResult idempotently using baseline plus protected receipt/capture and worker outbox, or stored submission-refused failure
  settle exact Run if still eligible and not already settled
  finalize confinement resources or retain with typed reason
```

`supervisor-started` is not adapter completion. The current live call may keep
waiting for the receipt to preserve existing `executeExecutorCli`/`spawnWorker`
Promise behavior. If the coordinator dies, the supervisor continues.

## Recovery Outcomes

| Observation | Allowed actor | Outcome |
|---|---|---|
| No Run admission | admission door | retry same admission request |
| Run admitted, command not requested | current controller | launch after fresh checks |
| Command pending, no envelope | current controller | `park launch-envelope-missing`; no spawn |
| Envelope exists, no supervisor binding | current controller | `park supervisor-binding-unknown`; no spawn |
| Supervisor binding live, no worker binding | supervisor or current controller observing | wait/observe; if supervisor dead, `park worker-binding-unknown` |
| Worker binding live | supervisor | continue timers/logging/receipt |
| Worker binding mismatch | current controller | `refuse incarnation-mismatch` |
| Submission refused, command reconciled, Run unsettled | current controller | resume failed settlement from stored failure details; no binding/receipt required |
| Receipt durable, command pending | current controller | collect, record command outcome, normalize and settle exact Run |
| Receipt durable, command reconciled, Run unsettled | current controller | resume normalization and exact Run settlement from stored outcome |
| Run settled, confinement finalization pending | current controller / Confinement Authority | cleanup or retain idempotently from descriptor |
| Receipt durable, stale controller | stale controller | read-only observe; no outcome write |
| Supervisor dead, worker state unknown | current controller | `park worker-state-unknown` |
| Host boot changed | current controller | `park host-reboot-unknown` unless receipt already durable |
| Protected artifact corrupt | current controller | `refuse protected-artifact-corrupt`; no settlement |

## Local Capability Matrix

| Operation | First P02L support | Reason |
|---|---|---|
| Fresh launch | yes | current controller owns pending transition |
| Observe live supervisor/worker | yes | binding has host/boot/pid/start-time |
| Collect completed receipt | yes | current token plus protected receipt |
| Reattach stdio | no | current local process has no general stream reattach primitive |
| Operator cancel after coordinator death | no by default | recovered destructive control needs an effect-boundary kill contract |
| Supervisor-owned timeout/idle/maxBuffer | yes | supervisor still owns live child handle/PGID |
| Shared-cwd mutating continuation | no | requires workspace occupancy/quiescence beyond Run control |
| Isolated worktree/read-only collection | yes when baseline and receipt are valid | no shared writer takeover |
| Ambiguous pending resubmit | no | duplicate spawn risk |

Unsupported operations return `capability-unsupported` or park with the typed
reason above. They do not fall back to legacy behavior.

## Crash Matrix

| # | Window | Durable facts | Actor allowed | Result | Duplicate-spawn guard |
|---|---|---|---|---|---|
| 1 | before pending commit | no command pending | admission/current controller | launch may be retried after checks | no launch identity exists |
| 2 | after pending, before envelope | command pending only | current controller | park `launch-envelope-missing` | pending forbids second fresh submit |
| 3 | after envelope, before supervisor spawn | pending + envelope | current controller | park `supervisor-binding-unknown` unless submission-refused recorded | envelope/pending pair forbids re-create |
| 3a | submission refusal recorded, Run unsettled | reconciled command with `submission-refused` outcome | current controller | resume failed settlement; no binding/receipt verification | outcome write is idempotent and not repeated |
| 4 | after supervisor spawn, before self-binding | pending + envelope | current controller | park `supervisor-binding-unknown` | no absent proof |
| 5 | after supervisor binding, before worker spawn | supervisor incarnation | supervisor continues; controller observes | wait or park if supervisor dead | supervisor binding owns launch |
| 6 | after worker spawn, before worker binding | supervisor binding; worker may exist | current controller | park `worker-binding-unknown` if supervisor dead | no worker absence proof |
| 7 | coordinator dies while worker runs | binding and protected capture grow | supervisor | receipt eventually, or running evidence | supervisor owns timers |
| 8 | timeout/maxBuffer after coordinator death | binding + partial protected capture | supervisor | receipt `timeout`/`max-buffer` | same launchCommandId |
| 9 | worker exit before receipt rename | protected capture maybe complete; no receipt | current controller | park `receipt-missing` unless supervisor live | immutable receipt required |
| 10 | receipt durable, no outcome | envelope/binding/receipt/protected capture | current controller | collect, record outcome, normalize, settle | token/digest exact match |
| 11 | command outcome recorded, Run unsettled | reconciled command + receipt | current controller | resume normalization and settlement from stored outcome | outcome write is idempotent and not repeated |
| 12 | Run settled, cleanup pending | settled Run + finalization descriptor | current controller / Confinement Authority | cleanup or retain idempotently | cleanup state CAS |
| 13 | old controller resumes after new controller | newer control generation | old controller | stale; read-only only | token/epoch CAS |
| 14 | supervisor dies, worker maybe alive | partial binding | current controller | park `worker-state-unknown` | unknown never launches |
| 15 | host reboot | boot mismatch, maybe receipt | current controller | collect durable receipt or park `host-reboot-unknown` | boot id mismatch blocks control |
| 16 | two recovery callers | same command pending/reconciled | one control winner | loser stale/held | control generation winner only |
| 17 | same Run/command, different PID incarnation | conflicting binding | current controller | refuse `incarnation-mismatch` | digest + host/boot/start-time |

## Acceptance Tests

P02L is not ready to implement until its cell prompt includes these tests:

1. legacy ad-hoc `executeExecutorCli` and `spawnWorker` parity for shell,
   argv/env/cwd/stdin, dispatch depth, `onChunk`, timeout, idle-timeout,
   maxBuffer, close and result shape;
2. Assignment-owned fresh launch writes pending command, baseline, envelope,
   supervisor binding, worker binding, protected capture and receipt;
3. injected coordinator death after supervisor start still produces protected
   capture and receipt;
4. pending without envelope or binding parks and never spawns a second worker;
5. worker PGID differs from supervisor PGID and timeout signals only worker
   PGID;
6. escaped descendant keeps pipe open but timeout/maxBuffer receipt publishes
   immediately with partial coverage;
7. PID reuse, boot mismatch and start-time mismatch refuse inspect/kill/settle;
8. tampered envelope, receipt or digest refuses before collection;
9. worker cannot write, truncate, replace or unlink protected capture or
   protected receipt under required confinement;
10. live `onChunk` callback failure, disconnect and backpressure do not block
    capture, timers or receipt publication;
11. stale controller can observe receipt but cannot publish command outcome;
12. crash after receipt-backed command outcome publication but before Run
    settlement resumes normalization/settlement from the stored outcome without
    rewriting it;
13. crash after submission-refused command outcome publication but before Run
    settlement resumes failed settlement without binding/receipt verification;
14. Confinement Authority request builder validates and preserves
    `assignmentLaunchContext`; mismatched context refuses before envelope
    publication;
15. recovered collection uses pre-launch evaluator baseline for dirty-before,
    commits-before-crash and read-only mutation cases;
16. confinement temporary resources are cleaned or retained idempotently with
    an explicit finalization record that carries dispatch/resource/attestation
    identity, ownership marker digest, progress state and already-absent resume
    behavior;
17. unsupported recovered cancel and shared-cwd takeover return typed park or
    refusal;
18. no `.fgos` runtime logs are committed to the project tree.

## Simplicity Decisions

- Keep the supervisor. Removing it loses timers, output and final receipt
  after coordinator death.
- Keep the pre-launch envelope. Removing it makes the supervisor a second
  command resolver.
- Keep separate process groups. Merging them lets timeout kill the evidence
  writer first.
- Keep controller-only settlement. Letting the supervisor settle creates a
  second Run authority.
- Keep host/boot/pid/start-time. PID alone is not incarnation.
- Keep conservative park on ambiguous pending. Resubmission risks duplicate
  local processes.
- Do not add a generic daemon, registry, checkpoint framework or health store.
  The per-Run files above are enough.

# S2/P02H - Herdr Spawn Bwrap Launch Reconciliation

**Status:** ARCHITECTURE READY; HERDR WORKER-COMMAND SEAM REQUIRED; IMPLEMENTATION HANDOFF ON HUMAN HOLD  
**Owner:** Herdr adapter plus Confinement Authority plus RunHandle guard  
**Depends on:** S1 identity contract and P02L adapter-neutral launch lifecycle

**Shared adapter seam:** [confinement-adapter-contract.md](confinement-adapter-contract.md)

## Goal

Make Assignment-owned `herdr-spawn` use the same Confinement Authority/bwrap
boundary as `cli-spawn`, without pretending Herdr status is Run truth. Herdr is
transport and failure detector. The worker command Herdr starts must be the
Authority-prepared command, including the `local-bwrap-v1` wrapper when required
confinement applies.

This profile is architecturally ready for first launch, observation, receipt
collection and conservative park. Its implementation must add or prove the Herdr
worker-command seam: Herdr must start an arbitrary Authority-prepared executable
while preserving readiness/session tracking. Automatic replacement launch remains
disabled until Herdr can prove absence of the previous resource.

## Enforcement Shape

The key rule is simple:

```text
Confinement Authority prepares the agent command.
Herdr starts exactly that prepared command.
Worker result still comes from the Run outbox.
Herdr status never becomes Run receipt.
```

For `cli-spawn`, Authority calls the local process adapter with the prepared
`command,args,env`. For `herdr-spawn`, Authority prepares the same shape and the
Herdr adapter passes it through the Herdr start primitive as the worker command:

```text
herdr agent start <deterministicName> --kind <kind> --pane <paneId> --timeout <ms> -- <prepared-command> <prepared-args...>
```

The exact Herdr CLI syntax may differ, but the adapter must prove one fact: the
foreground agent process in the pane is executing the Authority-prepared command,
not an unwrapped provider default. If the current Herdr primitive only accepts
provider flags and cannot replace the executable with the prepared bwrap command,
required confinement refuses before launch. It may not downgrade to partial and
claim `enforced`.

The bwrap driver stays provider-neutral. Provider-specific needs, such as private
home or credentials, enter through resource grants/bindings before Authority
prepare. The Herdr adapter is allowed to choose Herdr pane/session mechanics; it
is not allowed to re-resolve command, environment or confinement after Authority
prepare.

## Launch Record

The controller records one Herdr launch command under the same Run control model
as P02L:

```json
{
  "contract": "herdr-launch-command.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "controlEpoch": 3,
  "controlTokenDigest": "sha256:<hex>",
  "state": "pending|reconciled",
  "requestDigest": "sha256:<assignmentLaunchContext>",
  "preparedInvocationDigest": null,
  "herdrName": "fgos-<runId>-<launchCommandId>",
  "agentSession": null,
  "paneId": null,
  "resourceIncarnation": null,
  "outcome": null
}
```

`herdrName` is deterministic and durable, but only a lookup aid. `agentSession`
is conversation correlation. Control or reattach requires adapter-proven
`resourceIncarnation`, which must include enough Herdr-provided process/resource
identity to distinguish a restarted gateway or a new agent process from the
original one.

## Ordering

1. A fresh admitted Run with `launchState=not-requested` may prepare exactly one
   stable `launchCommandId` after authority checks.
2. The current controller commits `pending` with request digest, deterministic
   Herdr name and `preparedInvocationDigest: null` under the current control
   token.
3. Confinement Authority prepares the invocation. For required bwrap, the
   prepared command is `bwrap` plus the resolved bwrap argv and resource-bound
   env. The current controller then guarded-updates `preparedInvocationDigest`
   on the pending command.
4. The Herdr adapter creates/chooses the pane and calls Herdr's start primitive
   with the prepared command as the worker command. It does not type raw shell
   launch text into the pane.
5. After Herdr reports ready, the adapter records pane id, agent session and any
   resource incarnation returned by `agent get`/`pane process-info`.
6. Completion is still the worker-authored result file in the Run outbox, plus
   Confinement Authority attestation. Herdr `idle`, `working`, `done` or CLI
   success is not a Run receipt.
7. Any resume seeing `pending` reconciles by Run identity, deterministic name and
   resource incarnation. Missing or mismatched incarnation parks. It never
   creates a second Herdr resource merely because lookup is absent or ambiguous.

## Confinement Authority Contract

P02H uses the same `local-bwrap-v1` support matrix as P02L:

- supports required `hostWrite: deny`, `hostRead: allow`, `networkEgress: allow`,
  `process: host`, with grants resolved by Authority;
- unsupported controls such as filtered network still refuse/park before launch;
- private home, isolated session and own-worktree are lifecycle/context
  requirements that must be either enforced by prepared resource bindings or
  reported as unsupported for the selected policy;
- attestation store and protected evidence must not overlap any writable worker
  grant.

A `herdr-spawn` run can claim bwrap `enforced` only when the recorded Herdr start
request binds its worker-command suffix and environment digest exactly to the
prepared invocation digest, and the adapter receipt binds that prepared digest to
the Herdr resource identity. The full Herdr start argv has its own digest because
it also contains Herdr transport fields such as name, kind, pane and timeout. If
the adapter launches a provider by kind and merely appends flags, required bwrap
confinement refuses before launch; a non-required legacy path may report partial
only as an explicit degraded/unknown outcome.

## Adapter Receipt

The Herdr adapter writes one controller-collectable receipt:

```json
{
  "contract": "herdr-adapter-receipt.v1",
  "runId": "<runId>",
  "launchCommandId": "<id>",
  "preparedInvocationDigest": "sha256:<hex>",
  "herdrName": "fgos-<runId>-<launchCommandId>",
  "paneId": "<pane-id|null>",
  "agentSession": "<agent-session|null>",
  "resourceIncarnation": "<adapter-proven-incarnation|null>",
  "startArgvDigest": "sha256:<herdr-agent-start-argv>",
  "workerCommandDigest": "sha256:<prepared-command-args-env-suffix>",
  "completion": {
    "kind": "settled|blocked|died|timed-out-idle|timed-out-ceiling|paused-limit|unsignaled|spawn-failed|unknown",
    "reason": "<stable reason>",
    "settledAt": "<ISO-8601>"
  },
  "result": {
    "outboxPath": "outbox/result-<n>.json",
    "outboxDigest": "sha256:<hex>"
  },
  "digest": "sha256:<canonical-json-without-digest>"
}
```

This is not a Herdr status receipt. `settled` requires the outbox result file.
Failure kinds follow the existing Herdr visibility ladder. The current controller
collects this receipt into command outcome; stale controllers may observe only.

## Recovery Outcomes

| Observation | Allowed actor | Outcome |
|---|---|---|
| no Run admission | admission door | retry same admission request |
| Run admitted, command not requested | current controller | launch after fresh checks |
| command pending, no prepared invocation | current controller | complete Authority preparation once if still fresh/current; otherwise park `prepared-invocation-missing`; no Herdr spawn |
| prepared invocation exists, no Herdr binding | current controller | reconcile by deterministic name; if ambiguous, park |
| Herdr binding with matching incarnation | current controller | observe/reattach if Herdr supports it; otherwise wait/collect outbox |
| Herdr binding with missing/mismatched incarnation | current controller | park/refuse `incarnation-mismatch`; no control |
| outbox result durable, command pending | current controller | collect receipt and settle exact Run |
| receipt durable, command reconciled, Run unsettled | current controller | resume settlement from stored outcome |
| Herdr says idle/done but no outbox result | current controller | continue ladder; no settlement |
| deterministic name absent or lookup unavailable | current controller | `unknown-launch`, park; no replacement launch |
| closed resource | current controller | `closed-resource`, no resurrection |

## Crash And Race Cases

| Case | Required result |
|---|---|
| crash after pending before Authority preparation | current controller may finish one guarded preparation; no Herdr spawn before prepared digest |
| crash after preparation before Herdr start | reconcile by deterministic name; if absent proof unavailable, park |
| crash after pane create before agent ready | observe pane/process info; if incarnation unknown, park |
| crash after agent ready before binding write | recover binding only with adapter-proven incarnation; otherwise park |
| retry name collision | reconcile by Run identity, never name ownership |
| gateway restart, same pane/name | resource incarnation unknown/mismatch, park |
| same conversation, new worker process | resource-incarnation mismatch, park |
| Herdr CLI start succeeds but start argv does not match prepared digest | confinement mismatch, refuse/failed; no enforced claim |
| Herdr status says done without outbox result | no settlement |
| closed resource | `closed-resource`, no resurrection |
| coordinator dead, worker alive (F-b) | observe; reattach/control only with proven incarnation |
| three-way duplicate spawn race (F-f) | one fresh transition may submit; others reconcile/park |

## Gateway Probe Still Needed For Replacement

Before automatic replacement launch, verify collision refusal, resource survival
after gateway restart, incarnation reporting, crash-safe lookup and
no-resurrection for closed names. Record request/response fixtures as the
adapter contract. Until Herdr provides an authoritative response equivalent to
`absent-proven`, replacement launch remains blocked rather than simulated
locally.

This probe does not block fresh bwrap-confined Herdr launch. It blocks only the
claim that a missing deterministic name proves the old resource absent.

## Acceptance

- `herdr-spawn` passes the Authority-prepared command as the actual Herdr worker
  command; required bwrap refuses if Herdr cannot start that command;
- the recorded Herdr worker-command suffix and environment digest match the
  prepared invocation digest; the full start argv keeps a separate digest;
- Confinement Authority no longer hard-refuses required `herdr-spawn` before
  preparation when the worker-command seam is present; attestation can be
  `enforced` under the same local-bwrap-v1 support matrix as `cli-spawn`;
- completion remains outbox result plus receipt, never Herdr status alone;
- fresh first launch submits once;
- same-conversation/new-process mismatch parks;
- crash before binding never duplicates;
- deterministic-name absence without `absent-proven` parks;
- closed resources are not resurrected;
- F-b observation and F-f one-submit races pass;
- legacy Herdr naming remains unchanged outside Assignment-owned dispatch.

## Non-goals

No automatic replacement launch, no Herdr-as-Run-truth receipt, no direct Herdr
socket dependency, no shared-cwd writable takeover, and no new confinement
backend. The only required shape change is that Assignment-owned Herdr workers
consume the existing Authority-prepared command.

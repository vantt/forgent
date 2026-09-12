# Runtime Recovery Implementation Contract Catalog

**Status:** DESIGN AUTHORITY FOR NODE-FIRST S1-S4  
**Date:** 2026-09-12

This catalog is normative for implementation cells P01-P05S. If a phase brief,
panel artifact or older review uses a conflicting field or owner, this catalog
and the architecture decision lock win. P06-P07 keep their own gated phase
contracts and must not weaken these first-profile rules.

## Identity Rules

The first profile separates identities only where their lifetimes differ:

- `runId = run_<assignmentId>_<attempt>` is durable Run identity;
- `attempt` fences supersession between distinct Runs;
- `supersedesRunId` expresses lineage;
- `controlEpoch` and `controlToken` fence successive controller acquisitions
  of one Run;
- Herdr `agentSession.value` is conversation/resume correlation;
- `resourceIncarnation` is adapter-proven process/resource identity;
- `agentName` and `paneId` are locators, never authority.

`attempt` cannot substitute for `controlEpoch`: controller A and controller B
may acquire the same Run attempt at different times. Likewise a resumed
conversation can retain `agentSession.value` while running in a new process.

## Assignment Run V2

```json
{
  "contract": "assignment-run.v2",
  "runId": "run_<assignmentId>_<NN>",
  "assignmentId": "<assignmentId>",
  "attempt": 2,
  "supersedesRunId": "run_<assignmentId>_01",
  "retryId": "<caller idempotency key>",
  "payloadDigest": "sha256:<hex>",
  "dispatchPlanDigest": "sha256:<hex>",
  "phase": "admitted",
  "delivery": "not-sent",
  "status": "running",
  "startedAt": "<ISO-8601>"
}
```

Required transitions:

```text
admitted -> launching -> bound -> running -> settled
                    \-> parked
                    \-> unknown
```

`delivery` is `not-sent | sent | unknown`. After any prompt attempt it cannot
return to `not-sent`. `status` retains the existing visibility contract;
`phase` records recovery-relevant progress. V1 readers may observe but may not
recover a v2 Run unless they explicitly support the contract.

Only the Assignment admission door creates a Run or advances `attempt`. Only
the Run settlement door changes a Run to `settled`. Transport adapters may
publish observations but may not perform either mutation.

## Admission Result

```text
admitted(run)
already-admitted(run)
admission-conflict { currentRunId, requestedSupersedesRunId }
duplicate-retry { retryId, existingRunId }
legacy-recovery-unsupported { runId, contract }
```

The initial Linux profile uses an append-only generation lock rooted at:

```text
<scope>/control-lock/
  generations/<zero-padded-generation>.json
  releases/<generation>-<tokenDigest>.json
```

Each contender reads the highest generation, verifies its matching release or
exact holder-death evidence, prepares generation `g+1`, and publishes that
immutable record with an exclusive same-filesystem hard-link. Exactly one link
to the same generation path wins. Losers reread; they never unlink. Release
exclusively publishes the token-specific marker and never removes a generation.
This is the `runtime-recovery-design.md` section 6 algorithm, not today's
unlink-based `withEventsLock` implementation.

Under the winning Assignment generation, admission builds
`runs/.staging-<attempt>-<retryId>/` with complete `run.json`, fsyncs the file
and staging directory, then atomically renames that nonempty directory to
`runs/<attempt>/` on the same filesystem and fsyncs `runs/`. A concurrent
nonempty destination makes the loser reread the committed Run. Crash before
rename leaves a non-authoritative staging directory that the same retry may
validate/remove; crash after rename exposes the complete Run. Final attempt
directories are never created empty. Provider I/O runs only after release.

For a schema-2 CoordinationSession retry, the session store first appends:

```json
{
  "type": "run-retried",
  "payload": {
    "assignmentId": "<assignmentId>",
    "retryId": "<durable-idempotency-key>",
    "previousRunId": "<currentRunId>",
    "nextRunId": "<preallocatedRunId>",
    "nextAttempt": 2,
    "admissionPayloadDigest": "sha256:<hex>",
    "authorityRef": "<trusted-declaration-ref>"
  }
}
```

Lock order is session then Assignment. The declaration is appended before Run
publication; a crash in between resumes the exact `nextRunId`. No later retry
may leapfrog a pending declaration, and fulfillment is never inferred from the
number of linked results. Schema-1 replay remains accepted but cannot claim
exact-retry recovery. Standalone retry writes equivalent predecessor/retry
identity in the atomic Run admission record and does not append a session event.

Guard selection is schema-wide, not verb-specific: every schema-2 session
mutator (authorize, retry, cancel, disposition, result link, close, recovery
command and later transfer) enters the same append-only session generation
guard before calling `appendEventLocked`. Schema-2 code must not mix this guard
with legacy `events.lock`. Schema-1 paths keep their current guard unchanged.
This makes retry declaration serialize against cancel/link/close rather than
creating a private retry-only lock domain.

The Assignment admission mutex and Run control ownership are separate.
`run.json` does not duplicate mutable control state. Immutable Run-scoped
generation and release records are the control authority; `control.json` is
their rebuildable current-state projection:

```json
{
  "contract": "run-control.v1",
  "runId": "<runId>",
  "controlEpoch": 4,
  "holder": { "host": "<host>", "bootId": "<boot>", "pid": 1234, "startTime": "<os-start>" },
  "purpose": "recover",
  "controlTokenDigest": "sha256:<digest>",
  "acquiredAt": "<ISO-8601>",
  "heartbeatAt": "<ISO-8601>",
  "release": null
}
```

The API is:

```text
acquireControl(runId, holder, purpose, expectedEpoch?)
  -> {controlEpoch, controlToken} | held | stale
releaseControl(runId, controlEpoch, controlToken)
  -> released | already-released | stale
```

Acquire uses the same append-only generation publication at Run scope,
validates holder/reclaim evidence, increments the epoch, creates a random token
and publishes the immutable generation before returning. `control.json` is a
rebuildable current-generation projection written only by the generation
winner; immutable generation records remain authority. No mutex wraps an async
adapter operation. The unique token is returned only to the controller;
durable state stores its digest. Pending commands and outcomes carry epoch plus
token proof. Release records release by CAS against both, so a stale controller
cannot clear or unlink a successor acquisition.

## Herdr Binding Evidence

`visibility.json` remains the existing evidence record:

```json
{
  "status": "briefed",
  "agentName": "fgos-<stable-run-suffix>",
  "agentSession": {
    "agent": "codex",
    "kind": "id",
    "source": "herdr:codex",
    "value": "<conversation-id>"
  },
  "paneId": "<locator>",
  "resourceIncarnation": {
    "kind": "process",
    "hostBootId": "<boot-id>",
    "pid": 1234,
    "startTime": "<process-start-time>"
  },
  "lastSeenAt": "<ISO-8601>"
}
```

No separate `handle.json` is required in the first profile. Existing
`visibility.json` already carries the binding facts and is atomically written.
Recovery verifies Run identity from `run.json`, then matches the locator and
adapter-proven resource incarnation. `agentSession.value` may be compared for
conversation continuity but never proves worker continuity. If the current
adapter cannot establish `resourceIncarnation`, observation remains allowed
while control and settlement paths requiring it return `unknown` and park.

The first adapter calls the existing Herdr CLI. The fgOS REST/web gateway is
not a dependency and is not started by recovery. A future direct-socket adapter
may replace the CLI only behind the same outcomes and authority rules.

## Adapter Recovery Profiles

Shared Confinement Authority handoff for Assignment-owned local adapters is
defined in [phase-designs/confinement-adapter-contract.md](phase-designs/confinement-adapter-contract.md).


Every production adapter used by an Assignment-owned Run must declare a
reconciliation profile. Absence of a profile returns `adapter-recovery-unsupported`
and parks after interruption.

| Adapter | First-profile contract |
|---|---|
| `cli-spawn` | P02L local contract: Node supervisor self-publishes process incarnation, writes durable protected stdout/stderr capture and a protected immutable adapter receipt; Confinement Authority validates `assignmentLaunchContext` and publishes the executable launch envelope; the controller persists evaluator baseline and alone records command outcome; fresh submit once, pending ambiguity parks; recorded submission refusal resumes failed settlement without binding/receipt |
| `herdr-spawn` | P02H requires Herdr to start the Confinement Authority-prepared worker command; Herdr CLI is transport/lookup/observation; completion is outbox+receipt; control/reattach requires proven resource incarnation; replacement remains disabled without `absent-proven` |
| `http` | no production recovery profile; interrupted request outcome is unknown and parks |

Before local submission, Confinement Authority atomically publishes an
immutable launch envelope containing the prepared invocation, execution options
and decision plus Run/command/control-token-digest identity. The local
supervisor receives the envelope path, verifies it, and executes exactly that
invocation, never a reconstructed command. Protected supervisor proof and canonical stdout/stderr capture are stored
outside the worker write grant; only worker-authored outbox files live under
`worker-output/outbox`. The supervisor writes an immutable adapter receipt, not
command state or Run settlement. The current token-holding controller validates
and collects that receipt using the pre-launch evaluator baseline it wrote
before launch. Submission refusal before supervisor ownership is a stored command outcome, not a receipt-backed worker completion. The worker leads a process group distinct from the supervisor,
so timeout/idle/maxBuffer can signal the worker tree while the supervisor
survives to flush evidence. Confinement cleanup is represented by an
idempotent finalization descriptor; coordinator death cannot lose the only
cleanup path. Legacy ad-hoc `cli-spawn` that has no Assignment Run retains
existing behavior and makes no recovery claim.

The canonical local file layout, schemas, crash matrix and capability matrix
are in
[`phase-designs/cli-spawn-local-contract.md`](phase-designs/cli-spawn-local-contract.md).
Do not restate those details elsewhere unless this catalog is also updated.

## Reconcile Outcomes

```text
reattach { runId, paneId, agentSession }
observe { runId, evidence }
settle { runId, resultPath }
park { runId, reason }
refuse { runId, reason, remedy? }
```

Park reasons include `launch-unknown`, `incarnation-mismatch`,
`controller-live-unreclaimable`, `effect-unknown`, `undeclared-sink` and
`workspace-authority-unavailable`.

An existing deterministic name returning `agent_name_taken` is collision
evidence, not ownership evidence. A lookup miss is not `absent-proven`.

## Effect Attestation V1

```json
{
  "contract": "effect-attestation.v1",
  "repeatMode": "read-only",
  "network": {
    "mode": "filtered",
    "allowedProviderFamily": "<DispatchPlan.providerModel>"
  },
  "sinks": [
    { "id": "telemetry", "effect": "none", "duplicable": true }
  ]
}
```

Eligibility requires explicit repeat mode, filtered provider access derived
from the selected DispatchPlan, and no undeclared sink. Network `allow`, an
unknown sink, or an outcome-changing sink without repeat/dedup proof parks.
The attestation pins the source Run, DispatchPlan digest and confinement
evidence. `local-bwrap-v1` currently reports filtered network coverage
unsupported, so the Node-first core does not advertise post-delivery repeat.

## Dispatch Recovery Door

```text
fgos dispatch recover <runId>
  [--action reattach|observe|collect|retry|park]
  [--expected-snapshot <sha256> --expected-control-epoch <n>
   --expected-expires-at <ISO-8601> --action-key <idempotency-key>]
```

Without `--action`, the door returns an ephemeral recommendation only. Applying
an action requires all four expected fields returned by that recommendation.
The write door re-reads state under the short CAS mutex, compares snapshot and
control epoch, consumes `actionKey` once, then records or initiates exactly one
legal command. Missing expectations refuse; changed expectations return
`plan-stale`. No mutex spans external I/O.

Response shape:

```json
{
  "runId": "<runId>",
  "snapshotDigest": "sha256:<hex>",
  "expectedControlEpoch": 4,
  "expiresAt": "<ISO-8601>",
  "actionKey": "recovery_<opaque>",
  "action": "park",
  "reason": "launch-unknown",
  "executed": false
}
```

`actionKey` is a digest of contract version, Run id, snapshot digest, control
epoch, action and expiry. Apply echoes those inputs and the door recomputes the
digest. The first successful apply atomically creates
`commands/<actionKey>.json` with pending/outcome state under the current
control token. Repeated apply reads that record and returns the prior state;
the same key with different inputs refuses. This is effect-command idempotency,
not a second planning authority. There is no durable plan token, hidden retry
or implicit close.

`dispatch recover` does not accept a coordination id and never appends a
coordination-session event. When an action needs session-level authorization,
it returns `needs-input` or `refuse` rather than borrowing that authority.

## Coordination Recovery Door

Session-owned recovery uses a separate application door:

```text
fgos coordination recover <coordinationId>
  [--action observe|collect|settle|close|park]
  [--expected-snapshot <digest>]
  [--expected-event-seq <seq>]
  [--expected-run-control-epoch <epoch>]
  [--expected-expires-at <ISO-8601>]
  [--action-key <key>]
```

Read returns all apply expectations. Its action key digests the session id,
snapshot, event sequence, Run control epoch, action and expiry. Apply enters
the existing session write door, validates the current driver and exact Run,
and appends at most one legal command event carrying that key; replay enforces
single use. It cannot admit standalone work, replace a driver, transfer from
a terminal parent or hide the X11 premature-close hazard.

## Capability Boundaries

| Capability | First profile |
|---|---|
| observe settled/running Run | enabled |
| reattach matching resource incarnation | enabled only for an adapter that proves it; current CLI otherwise observes/parks |
| collect existing worker result | enabled only with the profile's required proof: local `cli-spawn` needs protected capture, protected receipt plus evaluator baseline; Herdr needs outbox result, adapter receipt, prepared-invocation digest, worker-command suffix/env digest and resource incarnation evidence |
| retry proven not-sent/repeatable work | enabled after S3 proof |
| replacement launch after unknown locator | disabled |
| same-workspace writable takeover | disabled |
| terminal-parent transfer | refused |

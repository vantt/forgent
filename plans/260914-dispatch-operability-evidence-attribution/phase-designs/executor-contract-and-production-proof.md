# D05 - Executor Contract And Production Proof

**Status:** accepted design
**Owner:** Dispatch contract compiler and Run Result Evaluation
**Incident drivers:** INC-06, INC-07, INC-08, INC-09, INC-12, INC-13, INC-18, INC-19, INC-20
**Decision drivers:** DOEA-02, DOEA-11, DOEA-12

## Worker Claim

`agent-result.json` is a worker claim. It is not independent evidence and is
never the RunResult itself.

```json
{
  "contract": {"id": "agent-result-claim", "version": 2},
  "status": "done",
  "summary": "Completed the assigned review.",
  "blocker": null,
  "error": null,
  "assessment": {
    "verdict": "findings",
    "severityFloor": "medium",
    "findings": []
  },
  "evidenceRefs": []
}
```

Validation rules:

| Field | Rule |
|---|---|
| `contract` | Required for v2; missing contract is legacy claim input. |
| `status` | One of `done`, `blocked`, `failed`, `no-evidence`. |
| `summary` | Required non-empty string. |
| `blocker` | Required non-empty string when `status = blocked`. |
| `error` | Required non-empty string or object when `status = failed`. |
| `assessment.verdict` | Required for reviewer/red-team/recheck operations. |
| `evidenceRefs` | Optional claims; must be validated before becoming proof. |

Prompt text and claim validation derive from one contract definition. A change
to required claim fields must fail tests unless both prompt and validator change
together.

## Effective Execution Contract

Before launch, Dispatch persists a secret-free projection of the effective
contract. This may be a projection of the immutable DispatchPlan/launch envelope
rather than a new entity.

```json
{
  "contract": {"id": "effective-execution-contract", "version": 1},
  "assignmentId": "asgn_123",
  "runId": "run_123",
  "mutation": "read-only",
  "workspace": {
    "cwd": "/repo/worktree",
    "writeScope": [],
    "mainCheckout": "/repo/main"
  },
  "tools": {
    "shell": {
      "mode": "restricted",
      "allowedCommands": ["git add", "git commit"]
    }
  },
  "limits": {
    "executorTimeoutMs": 2100000,
    "sessionWallTimeExpiresAt": "2026-09-14T01:00:00.000Z"
  },
  "resultClaim": {
    "contract": {"id": "agent-result-claim", "version": 2},
    "path": "<runDir>/agent-result.json"
  },
  "provenance": {
    "dispatchPlanHash": "sha256:...",
    "executorId": "claude",
    "adapter": "cli-spawn"
  }
}
```

The projection must be:

- persisted before launch;
- rendered into the worker brief;
- returned by inspection;
- traceable to resolved config, policy, operation, and confinement profile;
- free of secrets;
- honest about unenforced permissions.

If confinement does not enforce a permission, the contract may report it as
requested or instructed, but must not label it enforced.

## Production-Door Rule

Unit tests for pure evaluators are necessary but insufficient. Each committed
capability needs proof through the selected production path:

```text
config or Assignment
  -> DispatchPlan
  -> Confinement Authority
  -> selected adapter
  -> worker claim or provider failure
  -> RunResult normalizer
  -> result.json
  -> dispatch.runtime.inspect
```

The proof must fail if any required field is dropped between layers. Directly
calling a new evaluator cannot close an implementation cell unless a separate
production-door test proves the evaluator is reachable from the real dispatch
path.

## Required Production Scenarios

| Scenario | Starting door | Required observation |
|---|---|---|
| Reviewer reports HIGH findings | Coordination operation | completed execution plus findings assessment; no provider crash fiction |
| Invalid blocked claim | Assignment dispatch | typed contract failure and preserved artifacts |
| Executor timeout/crash | Dispatch production door | distinct provider/resource/unknown failure family |
| Same task replay | Coordination run | `delivery.mode = replayed`; no claimed new execution |
| Concurrent outside dirt | Real isolated-worktree dispatch | correlation without false attribution; substantive result preserved |
| Dead guard | Inspect then reconcile apply | CAS single winner and no TTL-only deletion |
| Config field forwarding | Config through selected adapter | test fails if field is dropped before adapter |
| Historical RunResult | Inspect legacy result | `legacy-derived`; bytes unchanged |
| Effective permissions | Real launched run | worker brief and inspect expose same effective contract |

## Required Negative Production-Route Scenarios

These scenarios close the D06 supplemental panel finding that a static
no-import/no-call assertion cannot prove semantic recovery is unreachable
through host, CLI, operation-catalog, callback, subprocess, or dynamic routing
paths. Each forbidden verb must be tested through the same production-facing
door a real operator or host would use, not only by direct evaluator calls.

| Forbidden route | Starting door | Required observation |
|---|---|---|
| `dispatch.runtime.reconcile` attempts to kill a worker/pane/process | Host operation catalog and CLI projection | typed refusal before adapter/process-control invocation; no liveness resource mutation |
| `dispatch.runtime.reconcile` attempts to retry or relaunch a Run | Host operation catalog and CLI projection | typed refusal before Assignment admission; no new Run directory, dispatch plan, or worker process |
| `dispatch.runtime.reconcile` attempts to resume/reattach execution | Host operation catalog and CLI projection | typed refusal or read-only authority hint only; no prompt delivery, terminal attach, or control epoch mutation |
| `dispatch.runtime.reconcile` attempts to reassign or takeover work | Host operation catalog and CLI projection | typed refusal; no assignment owner/write-scope/grant mutation |
| `dispatch.runtime.reconcile` attempts to admit a new Run | Host operation catalog and CLI projection | typed refusal before Run admission writer; no CAS winner can create a new execution |
| `dispatch.runtime.reconcile` attempts to cancel semantic execution | Host operation catalog and CLI projection | typed refusal; no provider, process, terminal, or controller cancellation side effect |
| alternate operation id aliases a forbidden recovery verb | operation registry load plus dispatch decision | registry refuses alias or routes to the existing owner-specific recovery door, never to reconcile |
| dynamic/callback/subprocess path reaches forbidden recovery from reconcile | selected adapter path with instrumentation | test fails if reconcile imports/calls/spawns any semantic-recovery operation or adapter control method |

Passing proof requires both:

1. positive inspection/reconciliation scenarios proving supported local repair
   still works; and
2. negative production-route scenarios proving every unsupported semantic
   recovery route is absent or typed-refused at the public boundary.

## Negative Capabilities

- No universal executor tool surface.
- No guarantee that prose alone enforces permissions.
- No automatic shell command generation for the worker.
- No full-suite run inside every worker.
- No conflation of executor timeout with session wall-time.
- No implementation cell closes on a direct-unit-only proof.
- No worker claim upgrades to terminal truth without normalizer evaluation.
- No reconciliation proof closes without production-route refusals for kill,
  retry, resume, reassign, admit, cancel, takeover, and operation-catalog
  indirection.

## Handoff To Implementation

An implementation plan must allocate at least these slices:

1. define `agent-result-claim.v2` and generated prompt text;
2. persist/read the effective execution contract;
3. implement RunResult v2 normalization and compatibility projection;
4. implement inspection read-model composition;
5. implement CAS reconciliation apply;
6. add production-door proof fixtures.

The slices may be split further for risk, but they must preserve this order:
claim/contract shape before writer changes, writer changes before inspection
promotion, and inspection before reconciliation apply.

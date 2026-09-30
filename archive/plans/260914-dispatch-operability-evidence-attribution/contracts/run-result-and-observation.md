# Run Result And Observation Contract

**Status:** D01 accepted design
**Owner:** Dispatch Run Result Evaluation and Dispatch runtime read model
**Incident drivers:** INC-06, INC-07, INC-10, INC-15, INC-16, INC-17, INC-18, INC-19, INC-20
**Decision drivers:** DOEA-03, DOEA-04, DOEA-09, DOEA-11, DOEA-12

## One Truth, Three Layers

```text
in-flight or uncertain Run -> RunObservation (mutable projection)
settled Run                -> RunResult (immutable terminal truth)
host operation invocation -> ProviderOutcome (transport-neutral wrapper)
worker completion claim   -> agent-result-claim.v2 (untrusted input)
```

`RunResult` is the only terminal truth for a Run. `RunObservation` is a read
model over mutable facts. `ProviderOutcome` is the host-invocation envelope that
may carry a RunResult or inspection report, but it never competes as Run truth.
`agent-result.json` is a worker claim consumed by the normalizer, never the
normalizer's output and never independent proof. This design does not add a
`DispatchOutcome` entity.

## Entity Authority

| Entity | Physics | Cardinality | Writer | May change after write | Authority |
|---|---|---:|---|---|---|
| `RunObservation` | State/read projection | many per read | Inspect/read use case | yes | Describes point-in-time facts only |
| `RunResult` v2 | Log-like immutable artifact at existing `result.json` | one terminal result per Run | Dispatch result normalizer | no, except byte-preserving external storage repair | Settles the Run's terminal interpretation |
| `ProviderOutcome` | Host invocation response | one per operation call | Host provider | yes across invocations | Describes host delivery, not Run semantics |
| `agent-result-claim.v2` | Worker-authored claim | zero or one per Run attempt | Worker | yes until normalizer snapshots it | Input evidence only |
| `run.json`/control files | Runtime state | many transitions | Dispatch runtime/adapters | yes | Lifecycle/resource evidence, not terminal truth alone |

Reader rule: any consumer needing terminal Run meaning reads `RunResult`
classification first. If no valid RunResult exists, the consumer may return a
RunObservation; it must not synthesize a terminal result from observation alone.

## RunObservation

`RunObservation` is a point-in-time derivation over Assignment, Run, resource,
workspace, guard, and result facts. It may be cached as a projection, but a
reader must treat it as stale immediately after the read.

```json
{
  "contract": {"id": "run-observation", "version": 1},
  "observedAt": "2026-09-14T00:00:00.000Z",
  "subject": {"kind": "run", "runId": "run_123"},
  "phase": "launched",
  "resourceState": "ambiguous",
  "delivery": "unknown",
  "inspectionStatus": "partial",
  "evidenceCompleteness": {
    "identity": "complete",
    "lifecycle": "complete",
    "resource": "stale",
    "result": "missing",
    "ownership": "complete",
    "workspace": "unsupported"
  },
  "recoveryAuthority": null,
  "observations": [
    {
      "kind": "process",
      "source": "runtime-resource-observer",
      "level": "correlated",
      "summary": "PID lookup is inconclusive because incarnation is missing."
    }
  ]
}
```

Closed vocabularies:

| Field | Values |
|---|---|
| `phase` | `admitted`, `launched`, `bound`, `delivered`, `settled`, `unknown` |
| `resourceState` | `live-proven`, `dead-proven`, `absent-proven`, `ambiguous`, `unobserved`, `unsupported` |
| `delivery` | `not-started`, `running`, `delivered`, `unknown`, `replayed`, `recovered` |
| `inspectionStatus` | `resolved`, `partial`, `ambiguous`, `conflicting`, `not-found` |
| completeness dimensions | `complete`, `missing`, `stale`, `corrupt`, `conflicting`, `unsupported` |

Liveness rules:

- heartbeat freshness is positive liveness evidence;
- heartbeat expiry is not death;
- PID-based liveness requires process incarnation where available;
- adapter lookup absence is authoritative only when that adapter declares
  positive absence coverage;
- Git dirt observed during a Run is evidence of workspace change, not proof of
  process authorship.

RunObservation never settles, retries, cancels, authorizes, reassigns, kills, or
clears a guard. It may carry a `recoveryAuthority` hint, but that hint is a read
projection and confers no authority.

## RunResult Version 2

Every new terminal result is written once to the existing
`runs/<n>/result.json`. No shadow file, second ledger, or `DispatchOutcome`
artifact is introduced.

Required top-level fields:

| Field | Meaning |
|---|---|
| `contract` | `{id: "assignment-run-result", version: 2}` |
| `runId` | Stable Run id or durable run attempt identity |
| `assignmentId` | Owning Assignment id, when any; `null` only for explicitly ad-hoc runs |
| `classification` | Canonical terminal interpretation |
| `status` | Legacy compatibility projection |
| `confidence` | Legacy compatibility projection |
| `runtime` | Runtime/resource facts used by classification |
| `evidence` | Worker claim, logs, snapshots, attestations, and attribution inputs |

Canonical classification:

```json
{
  "classification": {
    "execution": {
      "status": "completed",
      "exitCode": 0
    },
    "assessment": {
      "verdict": "findings",
      "severityFloor": "medium"
    },
    "confidence": {
      "level": "reported",
      "basis": ["valid-agent-result-claim", "captured-stdout"]
    },
    "failure": null,
    "policy": {
      "disposition": "allow",
      "code": null
    },
    "delivery": {
      "mode": "fresh",
      "supersedes": null
    },
    "provenance": "native-v2"
  }
}
```

Closed vocabularies:

| Dimension | Values |
|---|---|
| `execution.status` | `completed`, `failed`, `cancelled`, `completion-unknown` |
| `assessment.verdict` | `pass`, `findings`, `blocked`, `inconclusive`, `not-applicable` |
| `confidence.level` | `verified`, `reported`, `inferred`, `no-evidence`, `failed` |
| `failure.family` | `provider`, `resource`, `contract`, `policy`, `external-interference`, `unknown` |
| `policy.disposition` | `allow`, `refuse`, `needs-input`, `not-applicable` |
| `delivery.mode` | `fresh`, `resumed`, `replayed`, `recovered`, `legacy-derived` |
| `provenance` | `native-v2`, `legacy-derived`, `contract-corrupt` |

Failure is `null` when the process completed and an evaluator merely found
substantive issues. Assessment is operation-specific semantic evaluation;
process completion never substitutes for assessment success.

## Normative Examples

### Clean Pass

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_001",
  "assignmentId": "asgn_001",
  "classification": {
    "execution": {"status": "completed", "exitCode": 0},
    "assessment": {"verdict": "pass"},
    "confidence": {"level": "reported", "basis": ["valid-agent-result-claim"]},
    "failure": null,
    "policy": {"disposition": "allow", "code": null},
    "delivery": {"mode": "fresh"},
    "provenance": "native-v2"
  },
  "status": "done",
  "confidence": "reported",
  "runtime": {},
  "evidence": {}
}
```

### Reviewer Reports Findings

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_review_001",
  "assignmentId": "asgn_review_001",
  "classification": {
    "execution": {"status": "completed", "exitCode": 0},
    "assessment": {"verdict": "findings", "severityFloor": "high"},
    "confidence": {"level": "reported", "basis": ["valid-agent-result-claim"]},
    "failure": null,
    "policy": {"disposition": "allow", "code": null},
    "delivery": {"mode": "fresh"},
    "provenance": "native-v2"
  },
  "status": "failed",
  "confidence": "reported",
  "runtime": {},
  "evidence": {"findingRefs": ["review:H-1"]}
}
```

The legacy projection may remain `status: "failed"` so existing quorum readers
continue to block a dirty review. The canonical interpretation still says the
reviewer executed successfully and produced assessment findings.

### Provider Failure

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_provider_001",
  "assignmentId": "asgn_provider_001",
  "classification": {
    "execution": {"status": "failed", "exitCode": 1},
    "assessment": {"verdict": "not-applicable"},
    "confidence": {"level": "failed", "basis": ["provider-exit"]},
    "failure": {"family": "provider", "code": "provider-session-limit"},
    "policy": {"disposition": "needs-input", "code": "provider-limit"},
    "delivery": {"mode": "fresh"},
    "provenance": "native-v2"
  },
  "status": "failed",
  "confidence": "failed",
  "runtime": {},
  "evidence": {"workspaceObservation": "dirty-without-claim"}
}
```

### Completion Unknown

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_unknown_001",
  "assignmentId": "asgn_unknown_001",
  "classification": {
    "execution": {"status": "completion-unknown", "exitCode": null},
    "assessment": {"verdict": "inconclusive"},
    "confidence": {"level": "no-evidence", "basis": ["missing-agent-result", "ambiguous-resource"]},
    "failure": {"family": "unknown", "code": "lost-supervisor"},
    "policy": {"disposition": "needs-input", "code": "completion-unknown"},
    "delivery": {"mode": "fresh"},
    "provenance": "native-v2"
  },
  "status": "no-evidence",
  "confidence": "no-evidence",
  "runtime": {},
  "evidence": {}
}
```

### Same-Task Replay

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_replay_001",
  "assignmentId": "asgn_replay_001",
  "classification": {
    "execution": {"status": "failed", "exitCode": 1},
    "assessment": {"verdict": "not-applicable"},
    "confidence": {"level": "failed", "basis": ["cached-result"]},
    "failure": {"family": "resource", "code": "cwd-dispatch-lock-held"},
    "policy": {"disposition": "refuse", "code": "replayed-failure"},
    "delivery": {"mode": "replayed", "sourceRunId": "run_original_001"},
    "provenance": "native-v2"
  },
  "status": "failed",
  "confidence": "failed",
  "runtime": {},
  "evidence": {"replayReason": "same-taskKey-result-linked"}
}
```

### Legacy-Derived V1

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_legacy_001",
  "assignmentId": "asgn_legacy_001",
  "classification": {
    "execution": {"status": "completed"},
    "assessment": {"verdict": "inconclusive"},
    "confidence": {"level": "reported", "basis": ["v1-status"]},
    "failure": null,
    "policy": {"disposition": "not-applicable", "code": null},
    "delivery": {"mode": "legacy-derived"},
    "provenance": "legacy-derived"
  },
  "status": "done",
  "confidence": "reported",
  "runtime": {},
  "evidence": {"sourceVersion": "v1", "bytesRewritten": false}
}
```

### Corrupt V2

A v2 result whose stored legacy `status` or `confidence` does not match the
projection from `classification` is `contract-corrupt`. Readers fail closed and
return an observation that names the corruption; they do not repair the bytes
during read.

## Compatibility Projection

For v2, the reader validates that these projections match the stored fields:

| Canonical classification | Legacy `status` | Legacy `confidence` |
|---|---|---|
| `execution.completed` + `assessment.pass` + policy allow | `done` | canonical confidence |
| `execution.completed` + `assessment.findings` | `failed` | canonical confidence |
| `execution.completed` + `assessment.blocked` | `blocked` | canonical confidence |
| `execution.failed` | `failed` | canonical confidence or `failed` |
| `execution.cancelled` | `failed` | `failed` |
| `execution.completion-unknown` | `no-evidence` | `no-evidence` |
| any policy refusal | `failed` unless execution is unknown | canonical confidence |

A result without `contract.version` is historical v1. The pure interpreter:

1. reads the historical bytes;
2. maps known `status`/`confidence` fields to the closest classification;
3. fills missing dimensions with `unknown`, `inconclusive`, or
   `not-applicable`;
4. sets `delivery.mode` and `provenance` to `legacy-derived`;
5. returns the derived view without writing the file.

Historical v1 interpretation is deterministic and byte-preserving. New
standalone and CoordinationSession-owned Runs may emit v2 independently of the
CoordinationSession schema version.

## Invalid States

| Invalid state | Reader behavior |
|---|---|
| v2 missing `classification` | `contract-corrupt`; fail closed |
| v2 projection mismatches stored `status`/`confidence` | `contract-corrupt`; fail closed |
| `execution.completed` with non-null provider failure | `contract-corrupt` unless policy family explains external interference |
| `assessment.findings` without evidence refs or summary | `contract-corrupt` for reviewer/red-team operations |
| `policy.refuse` with no policy code | `contract-corrupt` |
| `delivery.replayed` without source identity | `contract-corrupt` |
| observation used to write terminal result | forbidden writer behavior |

## Writer Invariants

- The normalizer is the single v2 writer.
- Every terminal path writes one result, including provider failure, timeout,
  invalid claim, and no-evidence.
- The normalizer snapshots worker claims and runtime evidence before writing.
- A policy refusal preserves substantive execution and assessment evidence.
- No read path rewrites historical results.
- No session schema controls the RunResult contract version.

## Required Proof

- Reviewer execution completes with `assessment.verdict = findings` and no
  execution failure.
- Timeout and provider crash retain distinct typed failure causes.
- Same-task replay is visible as `delivery.mode = replayed`.
- v2 classification/legacy mismatch is refused as `contract-corrupt`.
- v1 interpretation is explicitly `legacy-derived` and byte-preserving.
- Every production writer calls the same normalizer.

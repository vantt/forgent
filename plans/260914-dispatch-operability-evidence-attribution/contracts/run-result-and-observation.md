# Run Result And Observation Contract

**Status:** D01 design draft
**Owner:** Dispatch Run Result Evaluation and Dispatch runtime read model

## One Truth, Three Layers

```text
in-flight or uncertain Run -> RunObservation (mutable projection)
settled Run                -> RunResult (immutable terminal truth)
host operation invocation -> ProviderOutcome (transport-neutral wrapper)
```

`RunResult` is the only terminal truth for a Run. This initiative does not add
a `DispatchOutcome` entity. `ProviderOutcome` may carry a RunResult or an
inspection report, but never competes with either as Run truth.

## RunObservation

`RunObservation` is a point-in-time, read-only derivation. It may change between
reads and cannot settle, retry, cancel or authorize a Run.

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
  "recoveryAuthority": null
}
```

Resource state is one of `live-proven | dead-proven | absent-proven |
ambiguous | unobserved`. Completeness per dimension is one of `complete |
missing | stale | corrupt | conflicting | unsupported`.

Heartbeat freshness is positive liveness evidence; expiry is not death.
PID-based liveness requires process incarnation where available. Adapter lookup
absence is authoritative only when that adapter positively supports
`absent-proven`.

## RunResult Version 2

Every new result is written once to the existing `result.json`. No shadow file
or result ledger is introduced.

```json
{
  "contract": {"id": "assignment-run-result", "version": 2},
  "runId": "run_123",
  "assignmentId": "asgn_123",
  "classification": {
    "execution": {"status": "completed"},
    "assessment": {"verdict": "findings"},
    "confidence": {"level": "reported"},
    "failure": null,
    "policy": {"disposition": "allow", "code": null},
    "delivery": {"mode": "fresh"},
    "provenance": "native-v2"
  },
  "status": "failed",
  "confidence": "reported",
  "runtime": {},
  "evidence": {}
}
```

Closed vocabularies for the initial contract:

| Dimension | Values |
|---|---|
| `execution.status` | `completed`, `failed`, `cancelled`, `completion-unknown` |
| `assessment.verdict` | `pass`, `findings`, `blocked`, `inconclusive`, `not-applicable` |
| `confidence.level` | `verified`, `reported`, `inferred`, `no-evidence`, `failed` |
| `failure.family` | `provider`, `resource`, `contract`, `policy`, `external-interference`, `unknown` |
| `policy.disposition` | `allow`, `refuse`, `needs-input`, `not-applicable` |
| `delivery.mode` | `fresh`, `resumed`, `replayed`, `recovered` |

Failure is null when execution completed and an evaluator merely found
substantive findings. Assessment is operation-specific semantic evaluation;
process completion never substitutes for assessment success.

## Compatibility

A single pure normalizer returns the canonical classification and its legacy
projection. Top-level `status` and `confidence` remain during this initiative.
For v2, readers validate that projecting the canonical classification produces
the stored compatibility fields; mismatch is `contract-corrupt` and fails
closed.

A result without `contract.version` is historical v1. Readers derive only what
its recorded facts prove, mark `classification.provenance = legacy-derived`,
and use `unknown`/`inconclusive` for missing distinctions. Reads never rewrite
historical bytes.

RunResult contract version is independent of CoordinationSession schema. All
new standalone and session-owned Runs may emit v2; historical v1 remains
readable.

## Required Proof

- Reviewer execution completes with `assessment.verdict = findings` and no
  execution failure.
- Timeout and provider crash retain distinct typed failure causes.
- Same-task replay is visible as `delivery.mode = replayed`.
- v2 classification/legacy mismatch is refused.
- v1 interpretation is explicitly `legacy-derived` and byte-preserving.
- Every production writer calls the same normalizer.

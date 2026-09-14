# Implementation Handoff

**Status:** ready for a separate implementation track

This design track authorizes no source changes. A future implementation track
may implement the planned Dispatch operability design by preserving the
following order:

1. Define `agent-result-claim.v2` and generate prompt/validator text from one
   source.
2. Persist and inspect the effective execution contract before worker launch.
3. Add RunResult v2 normalization and deterministic legacy-v1 interpretation.
4. Add `dispatch.runtime.inspect` as a read-only Dispatch-owned operation with
   exactly one typed selector.
5. Add `dispatch.runtime.reconcile` as a CAS-guarded guard/projection repair
   operation.
6. Add production-door proof fixtures for every committed capability.

## Must Preserve

- `RunResult` is sole terminal Run truth.
- `RunObservation` never settles a Run.
- `ProviderOutcome` never competes as Run truth.
- Git snapshots are correlation, not authorship proof.
- Inspection never forwards to recovery.
- Reconciliation never kills, retries, admits, resumes, reassigns, or takes
  over a workspace.
- Direct unit tests never close an implementation capability by themselves.

## Deferred

- Unified `fgos recover <subject>`.
- Provider account limit prevention and host OOM prevention.
- Cross-session authority.
- Same-`taskKey` replay semantics change.
- BL1 coordination auto-close defect.
- Arbitrary Git history protection.

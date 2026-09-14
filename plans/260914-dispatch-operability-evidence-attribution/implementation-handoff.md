# Implementation Handoff

**Status:** blocked until D06 returns to READY

This design track authorizes no source changes. A future implementation track
must not start from this package until D06 supplemental findings are repaired
and rechecked. Once D06 returns to `READY`, implementation should preserve this
order:

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

## Blocking Before Implementation Track Creation

- Record and recheck the supplemental panel findings from
  `dispatch-operability-design-d06-panel-r2`.
- Add explicit negative production-route proof requirements for every forbidden
  reconciliation/recovery verb and operation-catalog indirection path.
- Repair promotion/traceability/closure metadata so plan, ledger, lock,
  manifest, handoff, and closeout agree on the same verdict.
- Decide whether Codex-only role separation is an acceptable waiver of the
  phase's independent/cross-provider panel expectation, or obtain genuinely
  independent review.

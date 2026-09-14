# Requirements Traceability

**Status:** D00-D06 working trace; runtime proof remains future implementation work

| Requirement | Design authority | Planned proof |
|---|---|---|
| One terminal truth per Run | `contracts/run-result-and-observation.md` | Future schema/normalizer tests and production-door fixtures |
| In-flight uncertainty remains observation | same | Future mutable observation tests; no result creation |
| Historical results are never rewritten | same | v1 byte-preservation fixture |
| One inspect operation accepts exactly one typed selector | `phase-designs/inspection-surface-and-routing.md` | CLI/operation contract tests for zero/one/multiple selectors |
| Duplicate Run identity never first-match-wins | same | two-location conflict fixture |
| Assignment current Run derives from authority, not attempt number | same | supersession/admission fixtures |
| Cwd inspection returns lock plus all active/history matches | same | multi-Run cwd aggregate fixture |
| Invocation Router does not resolve subject/authority | same | operation-catalog and dependency-direction test |
| Temporal correlation is not causal proof | `phase-designs/evidence-attribution.md` | concurrent unrelated dirt production-door fixture |
| Policy refusal preserves substantive result | same | reviewer findings plus external interference fixture |
| Guard cleanup requires dead/absent proof | `phase-designs/guard-reconciliation.md` | live/dead/ambiguous holder matrix |
| Reconciliation is CAS/idempotent | same | stale/concurrent/replayed action tests |
| Reconciliation never performs semantic recovery | same | negative import/call and behavior tests |
| Worker claim prompt and validator share one contract | `phase-designs/executor-contract-and-production-proof.md` | generated prompt/schema conformance test |
| Effective limits and tool permissions are visible | same | persisted snapshot and inspect output fixture |
| Every capability is wired through a production door | same | Future end-to-end implementation matrix |
| Unsupported capabilities remain typed-disabled | `plan.md` | D06 design audit, then future negative capability tests |

## Documentation Obligations

- `docs/specs/runner.md`: settled behavior only after D06 approval and again
  after implementation evidence exists.
- Assignment/Run/RunResult canonical contract: version and migration rules.
- Host invocation operation catalog: `dispatch.runtime.inspect` and
  `dispatch.runtime.reconcile` once accepted.
- CLI reference/operator guidance: selectors, interpretation and exact
  recovery-authority handoff.
- `CHANGELOG.md` Unreleased: required when the user-visible CLI/schema ships,
  not for this design draft alone.

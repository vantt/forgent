# Requirements Traceability

**Status:** D00-D06 design trace complete after supplemental evidence repair; runtime proof remains future implementation work

| Requirement | Decisions | Incident drivers | Design authority | Planned proof |
|---|---|---|---|---|
| One terminal truth per Run | DOEA-03, DOEA-04 | INC-07, INC-18 | `contracts/run-result-and-observation.md` | Future schema/normalizer tests and production-door fixtures |
| In-flight uncertainty remains observation | DOEA-03, DOEA-09 | INC-10, INC-15, INC-17, INC-19 | same | Future mutable observation tests; no result creation |
| Historical results are never rewritten | DOEA-04 | INC-16, INC-18 | same | v1 byte-preservation fixture |
| Worker self-report is a claim, not proof | DOEA-03, DOEA-11 | INC-07, INC-13, INC-19 | `phase-designs/executor-contract-and-production-proof.md` | Contradictory/invalid claim fixtures preserve artifacts and refuse false success |
| One inspect operation accepts exactly one typed selector | DOEA-05 | INC-01, INC-15, INC-17 | `phase-designs/inspection-surface-and-routing.md` | CLI/operation contract tests for zero/one/multiple selectors |
| Duplicate Run identity never first-match-wins | DOEA-05, DOEA-07 | INC-15, INC-17 | same | two-location conflict fixture |
| Assignment current Run derives from authority, not attempt number | DOEA-03, DOEA-07 | INC-16, INC-18 | same | supersession/admission fixtures |
| Cwd inspection returns lock plus all active/history matches | DOEA-05, DOEA-07 | INC-15, INC-17, INC-20 | same | multi-Run cwd aggregate fixture |
| Invocation Router does not resolve subject/authority | DOEA-06, DOEA-13 | INC-01, INC-15 | same | operation-catalog and dependency-direction test |
| Inspection never forwards to recovery automatically | DOEA-07, DOEA-08 | INC-03, INC-04, INC-17 | same | negative import/call test and recovery-authority hint fixture |
| Temporal correlation is not causal proof | DOEA-09 | INC-09, INC-20 | `phase-designs/evidence-attribution.md` | concurrent unrelated dirt production-door fixture |
| Policy refusal preserves substantive result | DOEA-09 | INC-18, INC-20 | same | reviewer findings plus external interference fixture |
| Adapter-positive proof is coverage-bound | DOEA-09, DOEA-12 | INC-08, INC-09 | same | adapter/confinement attestation fixture |
| Guard cleanup requires dead/absent proof | DOEA-10 | INC-10, INC-15 | `phase-designs/guard-reconciliation.md` | live/dead/ambiguous holder matrix |
| Reconciliation is CAS/idempotent | DOEA-10 | INC-10, INC-15, INC-17 | same | stale/concurrent/replayed action tests |
| Reconciliation never performs semantic recovery | DOEA-07, DOEA-08, DOEA-10 | INC-03, INC-04, INC-10 | same | production-route refusals for kill/retry/resume/reassign/admit/cancel/takeover through host/CLI/operation catalog, plus supporting negative import/call tests |
| Effective limits and tool permissions are visible | DOEA-06, DOEA-11 | INC-06, INC-12 | `phase-designs/executor-contract-and-production-proof.md` | persisted snapshot and inspect output fixture |
| Every capability is wired through a production door | DOEA-12 | INC-08, INC-09 | same | Future end-to-end implementation matrix, including field-forwarding and negative-route refusals |
| Unsupported capabilities remain typed-disabled | DOEA-02, DOEA-08, DOEA-10 | INC-03, INC-04, INC-10, INC-11, INC-14 | `plan.md`, D06 packet | D06 supplemental panel requires additional negative production-route proof for forbidden recovery verbs before READY |

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

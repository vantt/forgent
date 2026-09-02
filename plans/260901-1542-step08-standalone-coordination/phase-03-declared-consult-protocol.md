# Phase 03 - Declared Consult Protocol

## Objective

Execute the smallest declared CoordinationProtocol and prove it has the same
governed execution/evidence semantics as the Phase 01 agent-led consult.

## Requirements

- **R1 Protocol materialization.** Load the consult FlowDefinition, create
  stable primary/specialist SessionActors, materialize legal operations into
  inline Assignment contracts, and record definition/version/source refs in the
  session. Protocol materialization never writes executor/model into contracts.
- **R2 Topology and context.** Enforce mediated request/response edges, declared
  intent, direction, context visibility, and one-round cap. Primary receives the
  specialist result only after accepted evidence; specialist receives only the
  request and authorized context, never unrelated session state.
- **R3 Policy composition/provenance.** Exercise and persist precedence:
  runner/global -> protocol defaults -> Phase/activity -> role -> Cohort/
  SessionActor -> Assignment -> human CLI -> governance. Tier remains monotonic;
  every effective field records source scope/id. Portable protocol inputs stay
  abstract; trusted request/CLI actor preferences may select infrastructure.
- **R4 Advice/disposition.** Persist specialist advice as its RunResult/evidence
  ref and require the primary to record `accepted|rejected|partially-accepted`
  disposition plus rationale. Advice is advisory and cannot advance Work or
  become verified merely because accepted.
- **R5 Session bounds.** Enforce wall time, Assignment count, concurrency, task
  depth, and rounds before materialization/launch. Consult defaults to two actors,
  one request/response, no retries, read-only mutation.
- **R6 Illegal behavior rejection.** Reject undeclared actor/edge/intent,
  response before request, extra round, actor impersonation, concrete executor/
  model in portable protocol, direct dispatch bypass, and foreign evidence.
- **R7 Equivalent case proof.** Run one bounded question once agent-led and once
  with declared consult using the same role/evidence requirements and trusted
  policy. Compare normalized semantic records; protocol provenance/topology may
  differ, but Assignment/Run/RunResult/evidence confidence rules may not.
- **R8 Live interactive proof.** Use interactive coordination plus real
  cli-spawn workers. Persist operator-visible transcript and canonical evidence;
  demonstrate no Work or repository mutation and no direct executor launch.

## Files

Modify `src/runner/coordination/**`, `src/runner/definitions/**`, the consult
fixture, and focused tests. Extend Assignment policy provenance only if Phase 00
left additive scope slots; keep changes in the shared resolver. Update accepted
contracts/spec/CHANGELOG for user-visible behavior.

Do not add CLI public verbs, Cohort Planner, research fan-out, headless driver,
herdr, Mission, Work lifecycle, or mutating tasks.

## Tests First

- Table-driven legal/illegal topology tests.
- Context-view tests using distinct sentinel strings to prove no sibling/global
  leakage.
- Full policy precedence table, including monotonic tier and governance final.
- Advice disposition required and evidence confidence preserved.
- Engine spy/static import check proving one Assignment execution core.
- Deterministic equivalence comparator for agent-led vs declared records.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/runner/flow-definition*.test.mjs' \
  test/runner/assignment-policy.test.mjs
npm test
```

## Proofs And Exit

Both consult modes finish with accepted evidence and persisted disposition. An
illegal extra round and a portable executor pin fail before Assignment creation.
Close AC-I002/003/006/008 deferral rows.

## Risks / Rollback

The danger is hidden protocol-specific execution. Review imports and call graph,
not only output. Revert consult materialization while retaining Phase 01
agent-led sessions and Phase 02 schema.


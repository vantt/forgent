# Phase 02 - Capability-Fit And Hard/Soft Placement Audit

Depends on: Phase 01 closed with both manual proofs.

## Objective

Use observed advisory behavior, not the original schema sketch, to decide where
each responsibility belongs. Preserve judgment in prose/skill and harden only
legality, authority, provenance, boundedness, visibility, and replay that cannot
remain trustworthy as convention.

## Cell P02.1

Write the authoritative report at
`docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md`
and proof inputs/outputs under `proofs/P02.1/`. It contains four tables:

1. observed Phase 01 behaviors and failures;
2. hard/soft placement with owner and rationale;
3. current primitive evidence with source symbol, test, and live probe;
4. closed Phase 03 blocker list with risk, files, consumers, and refusals.

Each behavior receives exactly one primary placement verdict:
`soul-doctrine`, `skill-task-prose`, `protocol-posture`,
`existing-hard-primitive`, or `new-hard-capability`.

## Placement Test

For every behavior observed in Phase 01, answer:

| Question | If yes | If no |
|---|---|---|
| Does quality depend on context-sensitive judgment? | Soul/doctrine or skill prose | Continue test |
| Is it reusable operating guidance for an agent? | Skill/task prose | Continue test |
| Must an invalid action be impossible, not merely discouraged? | Hard contract/runtime | Continue test |
| Must a fresh process reconstruct it exactly? | Durable event/artifact provenance | Prose may suffice |
| Is it only one protocol's collaboration posture? | FlowDefinition | Do not widen kernel |

Examples: deciding whether a gap is material is advisory judgment; proving the
question followed investigation is evidence/provenance; refusing premature
sibling visibility is runtime legality; explaining a recommendation is skill
prose; preserving dissent sources is aggregation contract.

## Requirements

- Inventory Phase 01's successful behaviors and failures, including behaviors
  not anticipated by the nine-phase sketch.
- Map each item to `soul/doctrine`, `skill/task prose`, `FlowDefinition`,
  `existing runtime`, or `new hard capability`, with rationale and citations.
- Map role-level cognitive needs to portable capability/minimum-tier policy;
  map concrete executor/tier/persona choices to the session request and record
  provider/model as dispatch-policy derivation. Reject both a single global
  model assumption and portable definitions pinned to local executor names.
- Audit existing visibility, typed contribution, aggregation, specialist,
  recheck, bounds, and resume mechanisms using executable evidence.
- Prove whether selective reopen works through predeclared bounded bindings and
  append-only revisions before proposing a kernel change.
- Prove whether original human input, panel interpretation, recommendation, and
  human decision can retain distinct provenance. Never equate driver identity
  with human authority merely to avoid a gap.
- Reject any proposed schema field whose only purpose is to encode a judgment
  heuristic better expressed in prose.
- Produce the smallest closed blocker list for Phase 03. Each blocker names
  owner, trust boundary, refusal cases, replay behavior, and at least one
  non-panel consumer or explains why protocol-local declaration is enough.
- Prove from a real request and RunResult that dispatch honors distinct actor
  bindings. If not, record the exact shared dispatch gap instead of hiding it
  behind prompt prose.
- Record `actors[].model` as an explicit current gap for declared protocols:
  decide whether per-actor executor + tier + persona with model derived through
  `providerModel`/`modelPolicies` is sufficient for V1, or whether a general
  model-override channel is justified. Do not claim the channel already exists.
- Probe reauthorization of the same `(node, operation, actor)` binding through
  N+1 invocations. Record whether `activation.maxInvocations`,
  `topology.edges[].maxRounds`, or only `aggregateBounds.maxRounds` refuses it.
  Phase 03 may not claim bounded selective reopen until this probe names the
  actual enforcing counter.
- Include subprocess read-only enforcement from P00.1 in the placement matrix;
  `isReadOnlyMode` alone is not accepted as filesystem confinement.

## Files And Tests

May touch the proposal, audit report, and throwaway proof fixtures only. Run the
existing focused coordination suite and preserve executable probes for disputed
capabilities. Do not change product behavior in this phase.

Must read the current definition/session contracts, protocol loader, session
engine, request schema/use-case, group-thinking pack gate, dispatch policy, and
RunResult path. Use GitNexus context for behavior the report relies on.

```sh
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'
```

## Exit

There is a reviewed hard/soft placement matrix. Phase 03 has no speculative
kernel work, and Phase 04 has a concrete list of intelligence that must remain
rich in prose rather than disappearing into protocol configuration.

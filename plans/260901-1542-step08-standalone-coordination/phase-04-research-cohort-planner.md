# Phase 04 - Research Fan-Out/Fan-In And Cohort Planner V1

## Objective

Add deterministic heterogeneous actor allocation and independent concurrent
research branches, then synthesize only accepted evidence through the same
session and Assignment core.

## Requirements

- **R1 Candidate inventory.** Build a pure inventory from validated runner
  config: executor id, provider family (`providerModel`), supported policy tiers,
  declared capabilities/persona/tools/context limits, invocation mechanism, and
  governance eligibility. Never inspect credentials or infer model family from
  names. Model-family diversity is absent until a canonical metadata source is
  added by a later proven need.
- **R2 Deterministic planner.** Enumerate in explicit stable candidate order;
  filter hard failures; allocate actors satisfying role/tier/capability/context;
  satisfy required provider-family diversity; use stable order for ties; emit
  per-actor PolicyPatches and allocation explanation. No scoring, learning,
  cost optimization, or execution side effect.
- **R3 Hard/soft constraints.** Hard constraints fail with named unsatisfied
  actor, field, candidate reasons, and available support. Soft diversity may
  degrade only when a declared fallback rule permits it, and the degradation is
  persisted. Planner may not lower tier, drop required actor, or substitute an
  unknown executor.
- **R4 Resolver handoff.** Planner output is only policy input to normal
  Assignment resolution. Resolver revalidates executor/provider/model/tier and
  governance at execution time; mismatch between planned and re-resolved
  infrastructure aborts before spawn. Planner imports no transport/CLI spawn.
- **R5 Independent fan-out.** Materialize N bounded read-only evidence questions
  as independent actors/tasks with no sibling edges. Execute concurrently under
  session and runner caps, recording intended set before launch and one-way refs
  atomically.
- **R6 Context isolation/fan-in.** Before fan-in, branches cannot read sibling
  prompts, outputs, evidence, or allocation secrets. Synthesis receives only
  accepted RunResult/evidence refs after all required branches settle or an
  explicit partial policy is evaluated.
- **R7 Evidence and contradictions.** Material factual findings require
  `verified`; missing, failed, contradictory, stale, or foreign branches remain
  explicit. Synthesis cannot upgrade evidence confidence, erase contradictions,
  or report consensus from branch count.
- **R8 Two-provider live proof.** Run one research protocol with at least two
  real provider families and every tier it requires configured. Record allocation
  explanation, resolved provenance, concurrency overlap, branch isolation,
  accepted evidence, contradictions/missing branches, and synthesis. Stop if
  diversity cannot be satisfied; do not edit constraints after seeing outputs.
- **R9 Failure proof.** Run a fixture whose required provider/tier combination
  is impossible and prove named fail-closed explanation with zero Assignments
  launched.

## Files

Create `src/runner/coordination/cohort-planner.mjs` and focused inventory helper
only if it remains pure. Extend session engine, research fixture, tests,
contracts/spec/CHANGELOG, and verification. Dispatch modules may change only to
consume/revalidate a PolicyPatch through the existing resolver.

Do not add scoring, model-family guessing, direct execution, credentials probe,
provider SDK, Mission, Work mutation, headless driver, or telemetry backend.

## Tests First

- Stable allocation under permuted object insertion order.
- Candidate rejection matrix for executor/provider/tier/capability/governance.
- Hard unsatisfied and explicit soft fallback cases.
- Planner pure/no spawn import and resolver mismatch rejection.
- Real overlapping fake executors prove concurrency cap; sentinel contexts prove
  no sibling visibility.
- Evidence laundering, contradiction erasure, and required-branch omission
  negative tests.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/cohort-planner*.test.mjs' \
  'test/runner/coordination-*.test.mjs' \
  test/runner/assignment-policy.test.mjs
node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access
npm test
```

## Proofs And Exit

The live proof must use at least two actual provider families and save no secret.
The impossible fixture launches zero work. Close AC-I003/004/006/008 and record
why model-family routing and scoring remain deferred.

## Risks / Rollback

Configuration may not support the required tiers. That is a declared stop gate,
not an implementation failure. Pure planner cells can be reverted independently
from research execution.


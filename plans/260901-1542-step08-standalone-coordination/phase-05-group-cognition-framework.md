# Phase 05 - First Group Cognition Framework

## Objective

Prove that the foundation can express and run a higher-level collaborative
problem-solving framework, not merely brainstorm, with heterogeneous cognitive
activities and a measurable consuming-project decision outcome.

## Requirements

- **R1 Framework definition.** Declare one reusable protocol with phases:
  divergent exploration -> cluster/deduplicate -> critical challenge ->
  evidence review -> convergent synthesis -> recommendation with dissent.
  Define activities, roles, actors, topology, evidence rules, hard bounds, and
  cohort constraints through FlowDefinition config, not launcher prose.
- **R2 Cognitive policy.** Express activity-level `creative`, `analytical`, and
  `critical` tier floors plus capabilities/persona requirements. Cohort Planner
  assigns provider-diverse actors where hard constraints require it. Portable
  config contains no concrete executor/model; a locked trusted experiment
  policy may pin candidates for reproducibility.
- **R3 Independence and bounded exchange.** Preserve independent initial
  branches and minority candidates through clustering. Permit one declared
  critique/rebuttal round only on named edges. No unrestricted peer chat,
  recursive task graph, vote-as-truth, or majority-based evidence confidence.
- **R4 Synthesis contract.** Recommendation is advisory and includes decision
  criteria, accepted evidence refs, unsupported claims, alternatives, risks,
  unresolved questions, minority/dissenting positions, missing/failed actors,
  and proposed next action. Synthesis cannot hide or upgrade inputs.
- **R5 External case lock.** Before running any candidate, select and record one
  real read-only architecture/vendor/problem-solving decision from a project
  using fgOS outside this repository. Freeze objective, context snapshot,
  evaluation rubric, required tiers/provider families, budgets, and evaluator
  independence before observing outputs. No proprietary secret enters committed
  verification.
- **R6 Single-agent baseline.** Run one bounded single-agent attempt under a
  recorded comparable budget and evidence contract. Persist output, provenance,
  timing, retries, and rubric score without using it to tune the framework.
- **R7 Heterogeneous framework proof.** Run the locked framework interactively
  with real cli-spawn actors from at least two provider families supporting all
  required tiers. Persist every branch, allocation, critique, evidence review,
  dissent, synthesis, operator intervention, wall time, token/cost measured or
  unknown, and retries.
- **R8 Quality report.** An independent evaluator compares evidence coverage,
  unsupported claims, unique valid alternatives/risks, decision-criteria
  coverage, dissent preservation, actionability, operator time, wall time,
  retries, and available cost. Record named gain, tradeoff, or honest null/
  negative result. Do not redefine success after seeing outputs.

## Files

Create the framework protocol under the packaged coordination-protocol location,
its schema fixtures/tests, and verification artifacts. Modify shared session,
topology, cohort, synthesis, docs/spec/CHANGELOG only for primitives required by
the locked framework. Prefer no new core module if current primitives suffice.

Do not create separate brainstorm/debate engines, organization overlays,
marketplace, UI, autonomous optimizer, Work mutation, or a framework-specific
dispatch path.

## Tests First

- Full protocol normalization/materialization golden.
- Branch independence and minority survival through cluster/converge.
- Undeclared rebuttal, extra round, vote-as-truth, evidence upgrade, missing
  dissent, and concrete executor in portable config all reject.
- Activity tier floors remain monotonic through actor policy and governance.
- Deterministic fixture proves Phase ordering and required-actor gates.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/group-cognition*.test.mjs' \
  'test/runner/coordination-*.test.mjs' \
  'test/runner/cohort-planner*.test.mjs'
npm test
```

## Proofs And Exit

The consuming-project case, rubric, baseline, and framework evidence must be
reviewable without chat history. A null quality gain still closes the proof if
contracts held; it triggers a documented product reassessment rather than
fabricated benefit. Close AC-I003/004/005/006/008 rows.

## Risks / Rollback

The main risk is experiment bias. Freeze the case/rubric first and use an
independent evaluator. Framework config can be reverted without removing
consult/research primitives.


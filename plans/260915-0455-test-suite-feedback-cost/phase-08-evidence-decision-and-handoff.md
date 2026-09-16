# P08 - Evidence Decision And Handoff

**Capability:** `code:review`

**Depends on:** P07

## Purpose

Independently reconcile all proof and decide what, if anything, deserves a
follow-up implementation track, per TFC-D09-TFC-D12.

## Read First

`decision-lock.md`, `plan.md`, every prior cell trace, `reports/green-baseline.md`,
all four pilot reports, and `reports/cli-harness-responsibility-audit.md`.

## File Lease

- Add: `reports/final-evaluation.md` and code-panel handoff packets for accepted
  follow-ups
- Edit: this plan's phase status table when the coordinator records closure
- Must not edit: source, tests, package/CI configuration, product docs, or pilot
  measurements

## Requirements

R1. Reconcile every estimate with measured evidence and label unsupported claims.
R2. Score each pilot separately on feedback-time effect, full-suite CPU/wall
   effect where applicable, confidence, false-negative risk, fallback rate,
   implementation cost, and maintenance cost.
R3. Return `expand`, `revise`, or `stop` for each pilot with cited artifacts.
R4. Distinguish retained repository improvements from experimental changes that
   should be reverted before track close.
R5. Define any accepted next track without implementing it: exact scope, first
hotspot, preserved boundary proofs, capability units, required baseline, and the
P07 candidate packet it adopts or rejects.
R6. Matrix consolidation may be recommended only from P07 candidates whose
common guard sites and preserved boundary doors are named. `runCli(argv, ctx)`
may be recommended only after committed Rust-host release posture shows the
legacy-node investment remains worthwhile.
R7. Tiering, caching, mutation expansion, and timing thresholds remain rejected
   unless new evidence explicitly justifies reopening a separate decision.

## Adversarial Checks

- Combining savings from benchmarks taken on different integrated states.
- Treating no observed selector miss as proof of completeness.
- Treating parameterized source as reduced execution cost.
- Recommending broad helper changes from a three-file fixture sample.
- Quietly turning a repo-local tool into a product capability.

## Verification

```sh
npm test
git diff --check
node --input-type=module -e "import fs from 'node:fs'; import { lintPlanCapabilityAnnotations as lint } from './src/report/capability-plan-lint.mjs'; const result = lint(fs.readFileSync('plans/260915-0455-test-suite-feedback-cost/plan.md', 'utf8'), ['advise','execute','code:implement','code:review','code:test','code:debug','code:refactor','impact-analysis','pane-labeling']); if (!result.ok) { console.error(JSON.stringify(result.findings, null, 2)); process.exit(1); } console.log(JSON.stringify({ok:true, units:result.units.length}));"
```

## Acceptance

Every pilot has one evidence-backed verdict; retained changes have integrated
full-suite proof; remote CI proof is linked or remains an explicit stop gate; no
broad optimization is silently authorized; accepted follow-ups are ready for a
new plan/code-panel cycle.

## Risks And Rollback

Risk is promoting estimates into authorization. Because this cell is docs-only,
rollback means reject the unsupported recommendation and preserve the underlying
pilot artifacts unchanged; it never rolls back accepted implementation cells.

## Handoff

Close the track with the integrated commit list, final full-suite and CI proof,
pilot verdict table, remaining risks, and exact next-plan packets. Do not begin a
follow-up implementation inside this cell.

# Phase 4: Replay on the evidence plans

Capability: `code:review` (read-only analysis; one report).

## Inputs

- The new contract after phases 1 and 2: `core/instructions/ready-plan-runs-unattended.md`,
  `domains/coding/instructions/coding-footprint-tracing.md`, `core/skills/_shared/plan-contract.md`,
  `scripts/plan-contract-check.mjs`.
- Evidence: `plans/discussions/ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md` (the 163 questions by
  class) and discussion `ds-que32ftgg6` Seed "Evidence".
- The three plans: `plans/261122-0118-heads-stable-and-able/`, `plans/261121-2110-component-authority-doors/`,
  `plans/261120-0625-work-data-model/` (plan.md and phase files as they were when set `ready`: use `git log` on each
  plan.md to find that commit and read it with `git show <sha>:<path>`).

## Footprint

`plans/261127-0151-ready-plan-runs-unattended/reports/replay-evidence-plans.md`.

## Steps

1. For each of the three plans, list its owner questions from the evidence file with their class (footprint, hands,
   cleanup, acceptance deviation, other).
2. For each question, decide which part of the new contract would have caught it before `ready`: U1 (trace: name the
   prior-art commit or the reference that would have added the missed file), U2 (a host step the plan would have had
   to name, and the door and executor the permission table gives it today), U3 (the standing cleanup), U4 (a `debt-ok`
   mark), U5 (one batched question before `ready`), or the check (which refusal). Mark it "not caught" when nothing
   would have, and say why.
3. Optionally copy each plan's ready-time plan.md into a temp dir, add `contract: plan-v1` and a current `created`,
   and run the new check on it to show the refusals it now raises; record the output.
4. Write the report: one table per plan (question id, class, caught by, evidence), totals per class, and a final
   "still not caught" list. No edits outside the report.

## Verify

The report exists, covers all three plans, and every question id it lists appears in the evidence file
(`rg -o 'q-[a-z0-9]{10}' <report> | sort -u` against the same in the evidence file). Pass: a reviewer can trace each
"caught by" to a sentence of the units or a refusal of the check.

## Rollback

Delete the report.

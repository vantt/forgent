---
type: explanation
title: Why a heavy-risk item can no longer reach delivered without a plan.md
tags: [risk, plan-md, iron-law, delivered, governance]
source_capture_ids: [tsk-2p6]
authoritative_for: why fgOS now gates a risk:heavy item from reaching delivered when it has no plan.md, and why the two historical violations that surfaced this gap were left uncorrected
framework: diataxis
mode: explanation
---
# Why a heavy-risk item can no longer reach `delivered` without a `plan.md`

`tsk-2p6`. Found in the same post-batch audit of `tsk-51m` that surfaced
several other gaps (see
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`
for that item's own family).

## The gap

No automated check caught a risk-high item, or one touching an
Iron-Law-gated module, landing at `delivered` with no `plan.md` in the
repo. Two real items in the same batch confirmed this: `tsk-4ax`
(self-declared hard-gate "removing a validation," the highest-risk item
in the whole batch — see
`docs/explanation/why-verify-moved-from-the-merge-lock-to-catchups-inbound-gate.md`)
and `tsk-55p`
(`docs/explanation/why-pick-refreshes-a-commitless-branchs-base-but-never-touches-a-worked-one.md`)
both carried an `iron-law-evidence.md` but **no `plan.md` anywhere** —
every other item in the same batch had one. The practical consequence:
the highest-risk item in the batch had no risk map written *before*
implementation to check its evidence against — exactly the mechanism the
root plan.md's own text describes needing ("every high-risk line is a
required proof point").

## Why the two historical items were deliberately left unfixed

Writing a `plan.md` retroactively for `tsk-4ax`/`tsk-55p` was
specifically rejected: a plan has to be written *before* code, by
definition — writing one after the fact would be fabrication, not a real
record. **What this item built instead**: a forward-looking check —
`fgos doctor`, or a test scanning the invariant across the real
`.fgos/events.jsonl` — that warns or refuses when a `risk: heavy` item
(or one touching an Iron-Law-gated module) tries to reach `delivered`
without a `plan.md` on record. The two historical violations stay
uncorrected as a known, named gap rather than being papered over with a
dishonest backfill.

## The fix

`risk: heavy` items can no longer reach `delivered` without a `plan.md`
in the repo — the gate now catches this class of gap going forward,
even though it could not retroactively fix the two items that first
revealed it.

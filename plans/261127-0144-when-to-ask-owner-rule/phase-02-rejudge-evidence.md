# Phase 2: Re-judge the 163 questions against the rule

Capability: `code:review`. Read-only except its report directory; the reviewer is not the phase 1 writer.

## Inputs

- `core/skills/_shared/decision-question.md` section `When to ask the owner`, as landed by phase 1.
- `plans/discussions/ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md`: the 163 questions, their class,
  and the five owner overrides (q-lnjt5zzbfq, q-aanvfxaopa, q-trgzaa34ua, q-nt7ptsq2nd, q-ddj673fmju).
- `plans/discussions/ds-jxoz3h2qgk-when-to-ask/DISCUSSION.md` sections 4 and 6.
- `fgos questions show <id>` for any question whose evidence row is too thin to judge.

## Files it may write

`plans/261127-0144-when-to-ask-owner-rule/reports/rejudge/**` only.

## Steps

1. For each question in the evidence file, apply the three questions of the new section using only the section text
   and the question's own record, and mark it `ask`, `no-ask` or `hands`.
2. Compare with the evidence classification. Expected: the direction class comes out `ask`; the three
   component-authority acceptance overrides and the trust-boundary override come out `ask`; footprint widens,
   cleanups, recoveries and re-confirmations come out `no-ask`; host-step requests come out `hands`.
3. For every mismatch, write a finding naming the question id, the line of the rule that misled, and the wording that
   would fix it. Give each finding a disposition (accepted, rejected with reason, deferred).
4. Write the report with `fgos convention path --kind report` under `reports/rejudge/`, with a count table
   (evidence class against re-judged class) and the findings.

## Verify

```bash
ls plans/261127-0144-when-to-ask-owner-rule/reports/rejudge/*.md
```

Pass: the report exists, its count table covers 163 questions, every question marked `ask` is in the direction class
or among the four decision overrides, and every accepted finding is listed for the lead. An accepted finding sends the
lead back to phase 1 for the wording fix, then this phase rechecks only the affected questions.

## Rollback

Delete the report directory; nothing else is written.

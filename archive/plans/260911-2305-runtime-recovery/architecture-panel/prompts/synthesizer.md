Role: Synthesizer. Operation: synthesize-recommendation.

You are inside the SAME repository the case is about
(`/home/vantt/projects/forgentX`). You see the WHOLE ledger: interpretation,
scout, all three candidates, the specialist's long-horizon answer (with the
coordinator's own corrected note on it), the critique, and both constraint
passes. You do NOT have access to `plans/reports/design-review-*.md`/
`design-audit-final.md`/`detailed-design-review.md`.

## Operating packet (condensed doctrine)

Notice: which falsification criteria were actually checked versus merely
stated; where a disagreement is about values, not facts (these go to the
person as a values choice, not a finding).

Reason: recommend ONE thing. If evidence genuinely cannot separate two
candidates, say that decisively and name the one observation that would.

Evidence it seeks: the whole ledger, every proposal/critique at the
revision it was actually written against. Adds nothing new — if synthesis
reveals a gap needing a new position, say so, don't author the missing
argument yourself.

Avoid: the balanced menu (three options, no recommendation); dissent
laundering (converting an `unresolved` disagreement into a "consideration"
so the packet reads clean); a merged fourth architecture no advisor
proposed and no critic attacked.

## Read, in order

1. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/interpretation.md`
2. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/scout-report.md`
3. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/system-shaper.md`
4. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/alternative-shaper.md`
5. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/specialist-long-horizon.md`
   (including the coordinator's corrected note at the end — the "4
   independent sources" framing was wrong, corrected to "one unrebutted
   finding, one independent re-derivation by the constraint advocate")
6. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/constraint-advocate-phase5.md`
7. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/critiques/architecture-critic.md`
8. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/constraint-advocate-phase6.md`

## Your task

Recommend ONE of the three candidates (baseline conservative /
gateway-change / long-horizon) — or an explicit, evidence-justified
composition if the ledger genuinely supports one (never an unattributed
fourth architecture). Ground your recommendation in what actually survived
critique:

- C1 (system-shaper's "one launch path") was VERIFIED by the critic, not
  merely claimed.
- Alternative-shaper's core mechanism (gateway `workId` lookup) has an
  unresolved HIGH-severity finding from the constraint advocate (Herdr
  becomes a stateful authority with no defined repair when Node and
  gateway disagree) that the proposal's own text does not answer.
- All three candidates share one HIGH, irreversible-for-effects risk that
  the constraint advocate ranked ABOVE every per-candidate risk: the
  standalone Team-Dispatch admission gap. State plainly whether your
  recommended candidate actually closes this gap, and if any candidate's
  own text does not commit to closing it, say so as a real gap in that
  candidate's own claim, not a footnote.
- The shared unexamined assumption (workId/assignmentId uniqueness) the
  critic found in BOTH shapers — does your recommendation inherit it? Name
  the answer either way.
- system-shaper's own F7 (a current reader branching on field absence) is,
  per the constraint advocate, load-bearing not cosmetic — was it checked?
  If not, name that as a real open falsifier your recommendation still
  carries.

Preserve disagreement that is genuinely unresolved (e.g., whether F7 has
actually been checked) as `unresolved`, not smoothed into a footnote. If
you cannot separate two candidates cleanly, say so and name the one
observation/probe that would.

## Output

Write your full synthesis directly in your response (this becomes
`agent-report.md`): recommendation, why this over the others, conditional
branches (if any), true-regardless-of-outcome findings, per-claim
confidence (not per-document). Do not write files of your own.

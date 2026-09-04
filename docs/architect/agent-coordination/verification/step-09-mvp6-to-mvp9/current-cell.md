# Current Cell: P10.10 (Promotion And Closeout — the track's final cell)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

This is the LAST cell of the entire `step-09-mvp6-to-mvp9` track. Its own
authoritative source is
`plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
§"P10.10 Promotion And Closeout" and §"Step 09 Exit Contract" — read
both in full before anything else; everything below elaborates on that
text, it does not replace it.

## Must Read (in order)

1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — the authoritative cell definition and Step 09 Exit Contract.
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`
   in full — the track's own status board; every phase/cell's own closing
   narrative is real evidence, not narration to trust blindly (per this
   cell's own §"Read live test/evidence state from every lane; do not
   trust narration alone").
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.6.md`,
   `P10.7.md`, `P10.8.md`, `P10.9.md`, `P10-KERNEL-FIX.md` (all 13
   sections) — the most recent, most consequential evidence, including
   the pack-wide contribution-lineage finding and its own Disposition
   sections.
4. `docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md`
   and `docs/routing-handoff-contract.md` — for the canonical contract
   promotion step.
5. `docs/architect/agent-coordination/contracts/coordination-session.md`
   and `flow-definition.md` (or wherever this track's earlier phases
   promoted contract text — check P06.3/P07.4/P08.3/P09.3's own closing
   sections in index.md for the exact file paths each used) — these are
   the "canonical Agent Coordination and Team Cognition contracts" this
   cell must promote proved semantics into.

## The classification taxonomy (verbatim from phase-10.md, apply exactly)

Every residual finding across every lane (P10.1-P10.9, P10-KERNEL-FIX)
gets ONE of these five classifications — do not invent a sixth:

1. **Implementation bug** — a real defect, fixable now, with the same
   Reviewer+Red-Team rigor every other fix in this track required.
2. **Contract ambiguity** — the contract text is unclear or silent; fix
   the DOCUMENTATION, not necessarily the code.
3. **Shared missing primitive** — a genuine capability gap in the
   underlying mechanism, not fixable as a scoped patch. **If you classify
   ANYTHING as this, the consequence is NOT "fix it" and NOT "silently
   document it as an accepted limitation" — it is: do not hide it in the
   Protocol Pack or skill, leave Step 09 OPEN with a named proposal and
   evidence, and DO NOT close the track.** This is phase-10.md's own
   explicit instruction, not a Coordinator interpretation. If you reach
   this classification for anything, STOP, write the proposal document,
   and report back to the Coordinator — do not proceed to promote
   contracts or run the final closing suite as if the track were closing
   normally.
4. **Fixture convenience** — a test/fixture shortcut that doesn't reflect
   a real product gap; name it, no fix needed.
5. **Explicitly out-of-scope authority** — something correctly refused
   because it would move Work/Coding/git/worktree/merge/mutation
   authority into the substrate (the Step 09 Exit Contract's own last
   bullet); name it, no fix needed, this is a feature not a gap.

## The one finding this classification decision most likely turns on

`P10.6.md`'s Gaps section (escalated pack-wide by its own Disposition,
re-confirmed independently by P10.7/P10.8) found: the pack gate's closed
step vocabulary (`operation`/`authorize`/`disposition`/`fan-out`, per
`schema.mjs`'s `validateSteps`) never reaches `linkSessionContribution`
(the REAL, already-existing, already-tested mediated door for
contribution-typed lineage, built in P08.2/proven in P08.3) — so no
contribution-typed lineage record can be created through the pack, for
ANY of the three group-thinking-lite protocols. The Step 09 Exit
Contract's own second bullet explicitly requires "Replay explains every
visibility grant, aggregation validation, **contribution lineage**, and
specialist authorization" — so this is not a cosmetic gap, it is directly
named in the Exit Contract this cell is checking against.

**Investigate concretely before classifying — do not assume either
direction:**
- Does closing this gap require a genuinely NEW kernel-level mechanism
  (which would make it a real "shared missing primitive"), or does it
  require only EXTENDING the pack's own existing step vocabulary/gate
  (`src/verbs/coordination/group-thinking-pack.mjs`,
  `run.mjs`'s `validateSteps`) to add a new step kind that forwards to
  the already-existing, already-proven `linkSessionContribution` door —
  which would make this "implementation bug" or "contract ambiguity"
  (a real but SCOPED gap in the pack layer, not the kernel), fixable
  within this cell?
- The underlying capability (`linkSessionContribution`) already exists
  and is proven — that fact alone does not settle the classification;
  what matters is whether wiring the pack to reach it is a small,
  scoped, safely-reviewable change (P10.10 is explicitly authorized to
  touch canonical contracts and, per the Coordinator's own note in
  index.md's Next Action, kernel files IF justified) or whether it
  reveals something structurally deeper (e.g. the pack's own security
  model — "5 bypasses it must never allow," see P10.1.md — makes adding
  a contribution step genuinely hard to do safely, which would tip it
  toward "shared missing primitive").
- If you conclude it's fixable in-scope: implement it with the SAME
  Reviewer+Red-Team rigor as P10-KERNEL-FIX (a dispatched Doer, then
  independent parallel Reviewer+Red-Team, disposition, fix rounds as
  needed) — do not implement and self-approve. Report back to the
  Coordinator before considering the WHOLE track closed.
- If you conclude it's a genuine shared missing primitive: follow the
  STOP instruction above exactly. Do not attempt a partial/unsafe fix to
  avoid this outcome.

## The other named residual: `run.mjs:236`/`aggregationCloseParams`

`P10-KERNEL-FIX.md` §5's own Gap (added Fix Round 2, refined Fix Round 3)
names this precisely: a pre-existing, safe-direction (fails closed, never
wrongly completes) resolution-failure crash, outside P10-KERNEL-FIX's own
authorized kernel-file boundary. Classify it (most likely "implementation
bug," scoped and small — a symmetric try/catch matching the pattern
`classifySessionQuorum` itself now uses) or "fixture convenience"/
"contract ambiguity" if investigation shows otherwise. This one is NOT
expected to trigger the "shared missing primitive" consequence — it has
a small, already-sketched fix shape — but confirm this yourself rather
than assuming the Coordinator's own framing in index.md's Next Action is
correct.

## Scope for this cell specifically

Unlike every other Phase 10 cell, P10.10 MAY:
- Touch canonical contract docs (`docs/architect/agent-coordination/contracts/**`,
  proposal/verification index files) to promote proved semantics.
- Touch kernel files (`src/runner/**`) IF a classification genuinely
  requires it AND it's scoped, reviewed with the same Reviewer+Red-Team
  rigor as every other kernel change in this track — never a shortcut
  just because this is the closing cell.
- Touch `core/protocol-packs/group-thinking.json`,
  `src/verbs/coordination/group-thinking-pack.mjs`,
  `core/skills/fgos-group-thinking/SKILL.md` if the contribution-lineage
  gap is fixed in-scope.

Still Do Not Touch: `core/coordination-protocols/group-cognition-framework.yaml`
(never, no exception, ever, this whole track).

## Acceptance

1. Every residual finding named across P10.1-P10.9 and P10-KERNEL-FIX
   (grep every cell's own Gaps section) is classified into exactly one of
   the five taxonomy categories, with the classification's own reasoning
   shown, not asserted.
2. The contribution-lineage finding's classification is investigated
   concretely (per the section above) and its consequence (fix now, or
   STOP and leave Step 09 open) is followed exactly as phase-10.md
   requires — this is the single most important correctness bar for this
   whole cell.
3. Proved semantics (the multi-operation quorum-completion rule, the
   three group-thinking-lite protocols' own proven properties, the pack
   gate's 5 verified bypass-refusals, the per-actor provider/tier
   customization proof) are promoted into the canonical contract docs
   with real citations back to the proving cell/test, not paraphrased
   from memory.
4. Update proposal status/verification indexes without claiming any
   capability this track did NOT prove (no deferred vote/convergence/
   anonymization/topology capability claims — phase-10.md's own explicit
   guard).
5. Run the full test suite (from the MAIN CHECKOUT, per this track's own
   established environmental-gotcha rule) and a final change-scope
   review (the complete `git diff` for the WHOLE track vs its base ref
   `9101a5d8`, not just this cell's own diff) before declaring the track
   closed.
6. Write `P10.10.md` in this track's established Design Notes / Proof
   Matrix / Gaps / Disposition format, PLUS (if the outcome is normal
   closure, not "leave Step 09 open") a final track-closing summary.
7. Report back to the Coordinator with the outcome BEFORE assuming the
   track is closed — normal closure and "leave Step 09 open with a named
   proposal" are both valid, correct outcomes; do not treat either as a
   failure.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`

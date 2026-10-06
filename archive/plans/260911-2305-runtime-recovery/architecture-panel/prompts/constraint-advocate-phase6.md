Role: Constraint Advocate. Operation: assess-constraints (Phase 6 — your
second pass, now against the finished shaped candidates; your Phase 5
findings were against the current package alone).

You are inside the SAME repository the case is about
(`/home/vantt/projects/forgentX`). You have real read access to every path
below, including your own Phase 5 output and the two shaper proposals plus
the specialist answer. You do NOT have access to `plans/reports/
design-review-*.md`/`design-audit-final.md`/`detailed-design-review.md`.

## Operating packet (condensed doctrine)

Notice: the migration (where risk actually lives); failure modes and blast
radius; irreversible steps specifically; who owns this afterward.

Reason: attach every concern to a proposal and a magnitude. Rank: which
one concern, if unaddressed, actually sinks this candidate?

Avoid: generic risk recitation; veto posture; symmetric objection that
conveys no signal about which candidate is riskier.

## Read, in order

1. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/constraint-advocate-phase5.md`
   (your own prior findings — do not repeat them verbatim; extend/revise
   in light of the actual candidates now on the table)
2. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/system-shaper.md`
3. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/alternative-shaper.md`
4. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/specialist-long-horizon.md`

## Your task

For EACH of the three candidates (baseline conservative / gateway-change /
long-horizon), rank the real migration/operational risk specifically of
CHOOSING that candidate — not of the current package. Specifically weigh:

1. **System-shaper's proposal keeps `run.json` field-add instead of a v2
   version bump** (its own §5/§9 F7) — what is the real migration blast
   radius if a current reader turns out to branch on field absence? Name
   the magnitude, not just "possible."
2. **Alternative-shaper's gateway-change makes Herdr a stateful
   authority** — what is the operational risk of that dependency shift
   specifically (who owns Herdr's new statefulness, what happens if the
   gateway and Node disagree about which agent is "the" active one)?
3. **The specialist's long-horizon seams add fields to S1-S4 now for
   capabilities (P06/P07) that stay disabled/refused** — what is the risk
   of reserving structure that never gets exercised (dead/unverified
   schema vs. real cost)?
4. Cross-candidate: is there a migration risk that is SHARED by all three
   (e.g. the standalone Team-Dispatch fencing gap the specialist flagged
   as load-bearing for every candidate) that deserves its own top-ranked
   finding rather than being buried inside per-candidate rankings?

## Output

Write your full findings directly in your response (this becomes
`agent-report.md`): ranked findings with magnitude/reversibility per the
standard shape, explicitly organized by which candidate(s) each attaches
to. Concerns considered and not raised. Do not propose an architecture of
your own; findings only.

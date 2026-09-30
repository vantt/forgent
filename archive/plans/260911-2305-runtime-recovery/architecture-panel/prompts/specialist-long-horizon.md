Role: Specialist (bounded, on-demand). Persona:
long-horizon-continuation-designer. Operation: answer-specialist-question.

Authorized by the driver for exactly one bounded question, per the
architecture-advisory-panel-v1 protocol's specialist mechanism (never a
standing panel member). This authorization exists because the case
requires THREE named alternative categories (baseline conservative /
gateway-change / long-horizon writable-continuation) but the protocol's
`phase-shaping` node only has two competing-proposal roles. The specialist
slot is the correct, protocol-provided mechanism for the third — not a
distorted third hat on an existing shaper.

You are inside the SAME repository the case is about
(`/home/vantt/projects/forgentX`). You have NOT seen the two Phase 5
shaper proposals (they exist, but reading them would defeat the purpose of
an independent third candidate) and you do NOT have access to
`plans/reports/design-review-*.md` or `design-audit-final.md`/
`detailed-design-review.md`, for the same independence reason as the
shapers.

## Your bounded question

Produce the **"long-horizon writable/continuation"** architecture
alternative for the runtime-recovery track: an alternative sized to
support, eventually, same-workspace writable takeover (currently a
disabled-by-default profile, B02/B03 in the prior review) and cross-
session/terminal-parent continuation transfer (currently refused, B01 in
the prior review, blocked pending CP §6 contract work) — WITHOUT building
either of those capabilities now. This is the opposite sizing bias from
the "baseline conservative" alternative: instead of building only against
the four confirmed current defects, this candidate should show what
additional (but still real, not speculative) structural decisions would
need to be made NOW so that writable takeover and continuation transfer
could be added LATER without a redesign — and be honest about what that
costs today.

## Read, in order

1. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/interpretation.md`
2. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/scout-report.md`
3. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/writable-takeover.md`
   — the scout confirmed this file is already substantively drafted (not
   "pending" as its own README table claims); read it as real prior work,
   not a blank slate.
4. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/continuation-and-transfer.md`
   — also substantively drafted per the scout.
5. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md`
6. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/run-handle.md`
7. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/detailed-design.md`
8. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-decision-lock.md`
   — note decisions 8/9 (terminal-transfer refusal with premature-close
   hazard; writable takeover disabled by default) — this candidate must
   respect both, it does not get to build the disabled profile.

## Your task

Answer the bounded question directly: what structural decisions (naming,
identity shape, event schema fields, port boundaries — NOT working code)
would need to be locked NOW in S1-S4 so that P06 writable and S5/P07
continuation transfer remain additive later, versus what would need to be
reopened/redesigned if they are deferred entirely as the "baseline
conservative" alternative proposes? Note one adjacent risk in passing and
stop — this is a specialist answer, not a second full shaper proposal.
Distinguish a standard answer ("the contract already reserves this field")
from a situational one ("in this repo's specific event-log shape, X would
need to change"). State plainly whether your answer changes anything for
the two candidates already on the table, and if it doesn't, say that too.

## Output

Write your full answer directly in your response (this becomes
`agent-report.md`). Do not scope-expand into recommending which
alternative should win. Do not write files of your own.

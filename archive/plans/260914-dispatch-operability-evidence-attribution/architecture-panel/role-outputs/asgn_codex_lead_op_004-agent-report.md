# Alternative-Shaper Report — D06 Dispatch Operability

**Assignment:** `asgn_codex_lead_op_004`  
**Role:** alternative-shaper  
**Date:** 2026-09-14  
**Scope:** design verdict only; no Work lifecycle action and no product/source mutation.

## Candidate: NOT READY pending independent-panel evidence

Issue a process-scoped **NOT READY** for promotion and creation of an
implementation track. Preserve D00–D05 and the D06 inline review as useful
evidence, but do not treat it as a substitute for the independent architecture
advisory panel required by D06. The next D06 verdict may become `READY` only
after a registered-panel replay, role outputs, dissent record, and independent
post-synthesis recheck exist against the frozen D06 packet.

This is not a request to reopen DOEA-01 through DOEA-13 for preference, and it
does not say the proposed architecture is unsound. It says the current record
has not supplied the particular independent evidence that its own phase made a
precondition for an architecture verdict.

## Why this differs materially from current READY

The current `READY` (decision lock and track closeout) authorizes a separate
implementation plan and canonical design promotion despite the waived panel.
The candidate withholds both until the required independent evidence exists.
Inline packet/reviewer/red-team material remains evidence, but is classified as
same-session review rather than independent panel evidence. This changes the
authorization boundary, not merely the wording or the order of the eventual
implementation slices.

## Evidence and reasoning

| Evidence | What it establishes | Consequence for candidate |
|---|---|---|
| D00–D05 accepted artifacts | The proposed bounds are concrete: sole terminal `RunResult`, read-only inspection, CAS-only guard repair, evidence/policy separation, and production-door proof. | No architectural flaw is asserted; preserve all artifacts unchanged. |
| D06 phase brief, Work 2 and Acceptance | It requires a real registered architecture advisory panel, replay/role outputs/dissent, and independent review; its acceptance says panel and standalone evidence are durable. | The panel evidence is an explicit acceptance input, not an optional cosmetic report. |
| D06 review packet, “Panel Waiver” | The panel was not run after a user override; the packet explicitly records no session id and offers inline replacement review. | The record truthfully proves a waiver, but it cannot prove the missing independent cohort/replay. |
| D06 standalone review SR-2 | It calls the panel evidence weaker because external dispatch was waived, though LOW under the current disposition. | Reclassify SR-2 as a gating evidence gap for promotion authorization, not a product defect. |
| Canonical architecture-advisory-panel proposal, phases 3 and 9 | Independent actors produce candidates before synthesis and an independent red team reviews the resulting packet. | Same-session review cannot establish the diversity/independence properties those phases test. |
| D05 production-door rule | Direct evaluator/unit evidence cannot close later implementation work; selected production path must be traversed. | The same evidence discipline supports withholding the preceding design promotion until its declared decision path is traversed. This is an analogy, not a new contract. |

## Named priors

1. **Declared-gate prior:** A phase’s stated acceptance evidence remains a gate
   unless the governing protocol explicitly defines a waiver with equivalent
   substitute evidence.
2. **Independence-is-observable prior:** Separate roles, protected visibility,
   replay, and post-synthesis recheck test correlation and framing risk that
   multiple reports in one Codex session cannot falsify.
3. **Design-vs-authority prior:** A design may be plausible while still lacking
   sufficient evidence to authorize canonical promotion or an implementation
   track.
4. **Reversibility prior:** Deferring promotion is inexpensive and reversible;
   promoting an insufficiently challenged authority boundary increases later
   correction cost across Dispatch, coordination, and host routing.

## No-build consequence

No code, config, tests, canonical promotion, or separate implementation track
is created. D00–D05 and current D06 reports stay intact as a frozen input
packet. The platform continues with its existing Dispatch and Coordination
behavior; none of the planned operations are claimed as shipped.

## First reversible step

Run the registered architecture-advisory-panel protocol over the immutable D06
packet, with at least the independent shaping cohort and the prescribed
post-synthesis independent red-team/recheck. Persist the session id, replay,
role outputs, source revision, dissent, and a new finding ledger. This is
read-only analysis: it creates evidence only and neither applies reconciliation
nor changes Dispatch/Coordination state.

## Costs and trade-offs

- Delays canonical documentation promotion and the implementation-plan handoff.
- Repeats some analysis already performed inline, and can surface preference
  disagreement rather than a concrete defect.
- Buys a falsifiable independence record for the most coupled boundaries:
  terminal truth, recovery/mutation authority, host routing, and the
  production-proof closure condition.

## Falsification criteria

Abandon this `NOT READY` candidate and restore the current READY path if either
condition is met:

1. A canonical governing contract (not merely the track closeout) explicitly
   permits a user waiver of the panel and defines the inline packet plus
   standalone reviewer/red-team as equivalent evidence for D06 acceptance; or
2. A registered panel completes on the frozen packet, preserves the required
   replay/role outputs/dissent and independent recheck, and its finding ledger
   leaves no unresolved HIGH/MEDIUM issue or undisposed challenge to DOEA-01
   through DOEA-13.

Conversely, the candidate is strengthened if the panel finds a second terminal
or mutation authority, an inspection-to-recovery path, unsupported liveness
treated as proof, a reachable negative capability, or production proof that
does not traverse the selected adapter/persistence path.

## Recommendation posture

Choose this alternative only when the project values D06’s declared
independence gate over the one-off user waiver. If the user waiver is treated as
an authorized governance override with equivalent evidentiary force, the
current narrowly worded READY is the lower-friction choice; it should still
retain the explicit caveat that no external panel occurred.

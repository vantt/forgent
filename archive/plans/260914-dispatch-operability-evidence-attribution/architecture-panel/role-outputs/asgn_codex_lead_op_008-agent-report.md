# D06 Synthesis Recommendation

**Assignment:** `asgn_codex_lead_op_008`  
**Role:** synthesizer  
**Scope:** D00-D06 design/source review only; no implementation or Work lifecycle action

## Verdict

**READY with named supplemental edits before merge.**

The D00-D05 architecture is sufficiently coherent to remain the basis of a
separate implementation track: it keeps `RunResult` as the sole terminal truth,
makes inspection read-only, confines reconciliation to guarded repair, limits
attribution to the strength of available evidence, and requires proof through
the selected adapter and persistence path. The package must not, however, merge
with its current unqualified D06 record. The supplemental panel provenance and
the landed proof/traceability findings below must first be incorporated.

This verdict means **ready to plan implementation after the edits**, not ready
to ship, not evidence that any proposed operation exists, and not authority to
change source/config/test files in this design track.

## Why this verdict over the alternatives

### Why not keep READY unchanged

The current finding ledger says no HIGH or MEDIUM findings remain and classifies
the waived external panel as LOW. That no longer reflects the evidence. The
supplemental critic identified a MEDIUM omission in negative production-door
proof, and the context audit found material traceability gaps. The D06 phase
also requires durable panel/replay/role/dissent/confidence evidence. Requests
and worker reports alone are not that completed record.

### Why not change to NOT READY

No attack established a contradictory terminal authority, a designed
inspect-to-recover backdoor, false source-incident counting, a silent locked-law
change, or shipped behavior masquerading as implemented. The missing items are
bounded changes to the review record, proof matrix, promotion audit, and
contract exposition; they do not require a new product choice or a redesign of
DOEA-01 through DOEA-13. A full NOT READY would therefore overstate what the
negative evidence proves.

The process objection raised by the alternative shaper remains genuine, but
this supplemental registered panel is the direct remedy. Its Codex-only roster
cannot provide provider-family diversity; it can still provide separate
protocol roles, staged visibility, critique, synthesis, red-team, and replay.
That supports conditional readiness with explicitly reduced confidence, not a
claim of cross-provider independence.

## Required supplemental edits before merge

1. **Replace the panel-waiver closure with the supplemental panel record.** Add
   the coordination/session identifier, replay or trace reference, role-output
   references, this synthesis, subsequent independent red-team/recheck result,
   dissent, and per-claim confidence to the D06 review packet and finding
   ledger. State plainly that every actor used the Codex executor and that this
   supplies role/process diversity but no provider-family diversity. Preserve
   the earlier waiver as history; do not describe it as independent review.

2. **Reopen and disposition the landed MEDIUM recovery-proof finding.** Amend
   D05's production scenarios so the production route attempts and refuses each
   forbidden semantic action (`kill`, `retry`, `resume`, `reassign`, `admit`,
   `cancel`, and `takeover`) through `dispatch.runtime.reconcile` and every
   selected host/CLI projection. Include an operation-catalog assertion and a
   falsifier for alternate/dynamic routing. Static no-import tests may support
   this proof but may not close it.

3. **Make the promotion audit complete without advertising unshipped commands.**
   Add explicit evaluated/no-change rows for the host operation catalog and
   operator/CLI documentation, with target, section, collision check, rationale,
   and future implementation owner. Keep `dispatch.runtime.inspect`,
   `dispatch.runtime.reconcile`, RunResult v2, and effective-contract behavior
   labelled planned/proposed and unavailable today.

4. **Repair D00 traceability state.** Change the incident matrix status from
   `D00 drafted` to its actual accepted state and add a stable source anchor for
   every INC-01..INC-20 row. Count reconciliation alone is not claim-level
   traceability.

5. **Close the remaining authority/shape ambiguities.** Name the exact existing
   owner operation used by D04 `collect-result`, define its request/response and
   dependency direction, and show that reconcile delegates without becoming a
   semantic-recovery proxy. Complete D02's required design shape with resolution
   pseudocode, redaction rules, selector examples, and host-projection parity.

6. **Give every deferral an owner and trigger.** In particular, the handoff's
   unified recovery, provider/OOM prevention, cross-session authority,
   same-task-key behavior, BL1 defect, and Git-history protection entries must
   either cite their existing owner/trigger or record one explicitly.

7. **Make closure metadata truthful.** Update the plan/closeout/ledger so D06's
   merge state, recheck count, supplemental findings, and final verdict agree.
   Do not leave `pending until merge`, `READY TO RUN`, or “no MEDIUM findings”
   after those statements cease to be true.

These are prerequisites to merge, not post-merge suggestions. Failure to make
items 1-2 changes this recommendation to `NOT READY`; failure to make items 3-7
leaves D06 acceptance and traceability incomplete and likewise prevents the
conditional READY from taking effect.

## HIGH/MEDIUM constraint accounting

The first constraint pass identified multiple HIGH/CRITICAL implementation
risks: second terminal authority during migration, semantic-recovery leakage,
CAS races, corrupt/ambiguous state being normalized, nominal-only read-only
inspection, overclaimed attribution, effective-contract drift or secret
leakage, and compatibility regressions. It also identified the MEDIUM-HIGH risk
of substituting helper tests for production-door proof. These do not prove a
current design contradiction because D01-D05 already choose fail-closed,
profile-gated, CAS-guarded behavior and defer shipment until production-door
evidence exists. They remain mandatory implementation gates and falsifiers;
none may be reported as already proven by this READY verdict.

The architecture critic's MEDIUM negative-route proof gap is different: the
design's own future proof matrix omitted an explicit way to falsify an indirect
semantic-recovery route. Required edit 2 closes that design-package omission.

The nominal second-pass constraint report is not relied on for D06 conclusions.
Although its assignment objective names this package, its body evaluates a
different “baseline/gateway/long-horizon” runtime-recovery candidate set and an
Assignment admission design not present in the Phase 5 D06 candidates. Its HIGH
and MEDIUM labels are therefore not attributable to this decision without
additional linkage. Excluding that mismatched evidence is higher-integrity than
silently importing unrelated vetoes.

## Planned versus shipped and external drills

The canonical runner and Assignment/Run contract text consistently describe the
design as planned and not shipped. No sampled source/config/test change
implements these capabilities. External/live operability drills—adapter
incarnation proof, concurrent CAS interleavings, corrupt/legacy fixtures,
selected-adapter field forwarding, effective-permission consistency, and
end-to-end inspection/reconcile refusals—remain deferred to the separate
implementation track.

That deferral is acceptable for **design readiness only** because D05 makes the
drills an implementation exit condition. It would be unacceptable to call the
features shipped, operationally proven, or safe for enablement before those
drills pass. A failed drill must reopen the owning DOEA design rather than lower
the proof bar.

## Unresolved dissent

- **Alternative-shaper dissent:** promotion should remain NOT READY until an
  independent panel record exists. This dissent lands against the old waived
  D06 record. It is answered only conditionally by completing and linking the
  present registered panel; the all-Codex roster means correlated blind spots
  remain.
- **Architecture-critic dissent:** both the missing independent evidence and
  negative-route proof gap block unchanged READY. This synthesis agrees with
  the facts but differs on remedy: bounded pre-merge edits are sufficient
  because no core design contradiction was established.
- **System-shaper position:** current READY is substantively supportable because
  implementation assumptions are explicitly deferred. This synthesis agrees
  on the core architecture but rejects leaving the D06 evidence record and
  proof matrix unchanged.
- **Constraint-advocate caution:** HIGH/CRITICAL operational risks can become
  real during implementation even under a sound paper design. This synthesis
  preserves them as implementation gates and lowers confidence accordingly.

## Per-claim confidence

| Claim | Confidence | Basis / limitation |
|---|---|---|
| D00-D05 form a coherent design basis with one terminal truth and separated read/write authority. | **High (0.88)** | Multiple accepted artifacts and the context audit agree; no contrary design path was found. |
| No locked platform law or settled product decision was silently changed. | **Medium-high (0.78)** | Critic found no collision; future implementation may still require formal decision promotion. |
| Canonical wording currently distinguishes planned design from shipped behavior. | **High (0.95)** | Runner and Assignment/Run contract use explicit planned/not-shipped qualifiers. |
| The source/design-only boundary was preserved. | **High (0.94)** | Audit found no tracked source/config/test implementation edit in the reviewed D06 commit/worktree state. |
| The Codex-only supplemental panel can satisfy role/process review while lacking provider diversity. | **Medium (0.70)** | Registered roles and staged outputs reduce same-author framing, but correlated model priors remain and final replay/red-team linkage is still required. |
| The negative semantic-recovery proof omission is bounded and fixable without redesign. | **Medium-high (0.80)** | Intended refusals and authority boundaries are explicit; only the production-route falsifier/registry coverage is missing. |
| External operability drills may be deferred without weakening design-only READY. | **High (0.86)** | D05 explicitly makes real production-door proof an implementation exit condition; confidence does not extend to runtime safety or shipment. |
| The seven named supplemental edits are sufficient for D06 merge readiness. | **Medium (0.72)** | They cover all landed relevant findings; confidence is capped by the Codex-only roster and by the pending post-synthesis red-team/recheck. |

## Final recommendation

Retain the architectural direction, but replace the current closure with
**READY with named supplemental edits before merge**. Merge only after all seven
edits are evidenced and the post-synthesis red-team/recheck leaves no unresolved
HIGH finding. Any new product choice, locked-law conflict, core authority
contradiction, or failed production-door falsifier reopens the package as
`NOT READY`.

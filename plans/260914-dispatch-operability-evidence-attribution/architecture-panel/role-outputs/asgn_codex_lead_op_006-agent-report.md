# D06 Architecture-Critic Report

## Verdict pressure

**Do not retain the current `READY` verdict unchanged.** Two attacks land:
the phase's independent-review gate was replaced with Codex-only material, and
the proposed production-proof matrix does not prove that reconciliation cannot
reach kill/retry/resume through an indirect or future route. The design may be
ready as a candidate, but it is **not yet evidenced as D06-READY** under its
own required shape.

## Ranked attacks that land

| Rank | Attack | Evidence | Decision impact |
|---:|---|---|---|
| 1 | **The panel/independence gate is unsatisfied, not merely LOW risk.** | D06 requires a real registered architecture panel, durable session/replay, role outputs, recommendation, dissent and confidence, plus independent Reviewer and Red-Team (`phase-06-cross-design-review-promotion.md:25-31,51-56,74-79`). The packet instead records an inline Codex-only waiver (`reviews/d06-review-packet.md:19-30,42-46`); the only untracked `architecture-panel/` artifacts are two request JSON files, with no session, replay, role outputs, or result artifacts. | **Blocks `READY`.** A user may authorize a waiver, but it lowers the claim from "independently reviewed" to "single-provider inline review." Record it as a material process exception with its authority/provenance, or obtain the specified panel and independent reports. The ledger's LOW SR-2 understates a missing acceptance artifact. |
| 2 | **The negative recovery proof can be bypassed by an unnamed/indirect path.** | D04 correctly refuses kill/retry/resume/reassign/cancel in prose (`phase-designs/guard-reconciliation.md:57-68`), but its only proof of this boundary is a static no-import test (`:123-133`). D05's production-door scenarios include a successful dead-guard reconciliation but no production-door refusal attempt for kill/retry/resume, no host operation-catalog assertion, and no dynamic-routing/indirect-call falsifier (`phase-designs/executor-contract-and-production-proof.md:96-129`). | **Blocks `READY` until the future proof matrix is complete.** Add production-door negative cases for every semantic-recovery verb through `dispatch.runtime.reconcile` and its host/CLI projections; prove the operation registry cannot bind an alternate/dynamic recovery route. This is a MEDIUM design-proof gap, undisposed in the ledger, not evidence that the intended authority boundary is wrong. |

## Attacks that failed

| Attack | Why it failed |
|---|---|
| `READY` falsely means shipped behavior. | Canonical promotion is consistently qualified: the runner spec says design authority only and planned capabilities (`docs/specs/runner.md:1182-1204`); the Assignment/Run contract says future-track READY, not shipped, and requires production-door proof before calling behavior shipped (`docs/architect/agent-coordination/contracts/assignment-run-runresult.md:240-265`). |
| Source incidents are untraceable or double counted. | The matrix names its source, retains INC-01 through INC-20, gives each one primary disposition, and reconciles the count to 20 (`incident-evidence-matrix.md:1-8,33-70`). Its direct/operator-analysis/external-claim labels appropriately preserve uncertainty rather than converting every incident into proof. |
| Reconciliation itself provides an unnamed kill/retry/resume path. | The intended design is explicit: inspection has only read ports and names the two existing owner-specific recovery doors (`inspection-surface-and-routing.md:144-172`); reconciliation separately refuses kill/retry/resume and applies only a guarded local repair (`guard-reconciliation.md:10-18,57-68`). The attack fails against the design, though its production falsification remains missing (rank 2). |
| A locked platform law or settled product decision was silently changed. | The reviewed artifacts introduce scoped DOEA design decisions and repeatedly retain existing recovery owners; the canonical additions are labelled planned. I found no edit to a locked law or contradictory replacement of an existing registered decision. The concern remains subject to the ordinary future implementation decision record, not a current silent-law finding. |

## Unsettled evidence

- The asserted user override exists only as quoted prose in the review packet; there is no durable authorization record or evidence of provider/model/role independence.
- No registered-panel coordination ID, replay, role output, dissent, confidence assessment, or panel result exists. Requests are not results.
- The D05 matrix has no executable future negative production-door cases for semantic recovery denial. A static import ban does not rule out a registry, callback, subprocess, or dynamic import path.
- Actual implementation behavior is deliberately unproved: this is design-only, and no production-door implementation evidence should be inferred.

## Recommended disposition

Change the D06 verdict to `NOT READY` pending either (a) the required registered
panel plus independent reviewer/red-team evidence, or (b) an explicitly
authorized, durable waiver that changes the phase acceptance criterion and
labels the result non-independent. In either case, amend D05/D06 proof planning
with production-route refusal tests for kill, retry, resume, reassign, admit,
cancel, and takeover. Re-run the critic/reviewer/red-team checks after that
amendment.

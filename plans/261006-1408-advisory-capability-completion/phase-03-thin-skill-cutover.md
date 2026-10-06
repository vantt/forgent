---
title: "Thin advisory skill source cutover"
status: pending
dependencies: [2]
requiresReview: true
---

# Phase 03 — Thin advisory skill source cutover

Proposed source cutover after separate implementation instruction and **Phase 02 early vertical-slice ACCEPT**, not just merged seams. Phase 04 then regenerates/stages and proves installed entry. Failed feasibility blocks this phase. Before rewriting canonical `core/skills/fgos-architecture-panel/SKILL.md`, original single-door [Phase 01](../261006-1415-fgos-single-door-mechanisms/phase-01-architecture-panel-roster-single-source.md) must have landed its minimal config-binding/document-truth cleanup of that same file. This is a shared-file phase barrier, not a dependency on either entire plan. Snapshot its landed source before cutover.

## Shape

One user entry: `fgos-architecture-panel` accepts target project + raw CASE. Skill investigates reachable facts and drives a small number of finite Workflow segments by reading their actual reports. Workflow/Pattern/bind owns seats, attempts and outcomes; skill never schedules individual seats or pins executors.

Normal analysis uses registered `architecture-advisory`: framing → blind three-seat shaping → critique reports. It completes at a technical boundary, not a human close. Next finite definition performs **reviewed recommendation**, with producer=synthesizer and independent reviewer/red-team inspecting that same packet. Only after reviewing its reports does the skill submit explanation → no-Unit human close. Explicit inputs carry proposal/critique reports and original owner words to recommendation and final inspected recommendation to explanation. Configure Phase 02's opt-in report-completed findings routing for these advisory consumers, never execution failures.

At analysis/recommendation boundaries a newly discovered named expertise gap can trigger bounded specialist + affected reviewed recommendation BEFORE explanation. This is technical continuation within the pass, not a human reopen; no fake gate answer. At most one specialist intervention per pass. If evidence remains insufficient, explanation explicitly says so rather than issuing an unsupported recommendation. Do not claim one normal Workflow start.

Select each finite graph from actual completed reports before submitting through the definition door; no optional no-op or conditional scheduler. `request` stays verbatim human text. Existing snapshotted Workflow.description labels generated root/parent/pass kind (`analysis`, `recommendation`, `specialist`, `explanation`, `human-reopen`) and human reopenRound 0/1/2. Technical segments retain the same human turn and round; original CASE/constraints are recovered verbatim from stored root request and labelled in task context with source run ID. Selected prior reports/answers use contextRefs and their source index. No new metadata schema/store.

## Sources and bounded changes

- Modify canonical `core/skills/fgos-architecture-panel/SKILL.md` and `core/workflows/architecture-advisory.yaml`.
- Reuse cognitive instructions from role doctrine/manual coordinator prompt and existing `core/prompt-templates/architecture-advisory-panel-v1-*.md`; inspect actual template paths/contents first. Extract useful task text once; remove/supersede retired runtime instructions only where owned by this skill. Do not republish the old protocol as another active source.
- Prefer a compact main skill plus existing references where genuinely needed. Do not reproduce all engine history in the operational prompt. History and preservation rationale belong in the plan/spec, not every dispatched task.
- Update relevant `docs/specs/runner.md` workflow behavior/settled facts and Unreleased changelog. Do not add a new product area or second docs authority.
- Related existing behavior suites: architecture-advisory Workflow, Workflow runner and existing Pattern/binding/confinement tests. Permanent tests for input isolation, refusal and boundary behavior only; temporary scans for retired bindings/APIs/wording.
- Generated `.agents`, plugin and `.claude` outputs are owned by this plan's Phase 04, after canonical cutover is coherent. No manual generated edits. Original single-door Phase 02's header-render work is independent of this cutover and is not a prerequisite.

## Cognitive task contract

| Work | Task and posture supplied to real worker | Input and deliverable |
|---|---|---|
| Framing/investigation | Investigate target evidence, disconfirm assumptions, separate human intent from lead interpretation; no premature recommendation | Raw CASE/reachable target facts → frame, cited evidence, unknowns and material constraints |
| System shaper | Design coherent primary candidate and implications | Shared frame only → credible system option, reasoning, costs/failure modes |
| Alternative shaper | Challenge default; develop materially different credible alternative, including smaller/no-build where justified | Same frame, no sibling first pass → independent candidate with tradeoffs |
| Constraint advocate | Stress feasibility, operating constraints and alternatives against evidence | Same frame, no sibling first pass → binding constraints, viable constrained direction, disconfirmation |
| Panel synthesis | Reconcile actual first-pass reports without erasing disagreements | All actual reports → comparison, disagreements, evidence and missing checks |
| Critique | Attack actual proposal claims, feasibility and evidence; retain unresolved objections | Frame + proposals → cited findings/dispositions, bounded expertise gaps and visible dissent |
| Reviewed final recommendation | Producer synthesizes actual evidence; independent reviewer/red-team attacks this exact packet, authority and dissent preservation | Proposals + critique + any specialist → inspected recommendation, attributed objections, reasons/limits; opt-in findings routing retains dissent |
| Explanation/lead | Explain consequences and next decision without inventing a fourth design | Recommendation and original human words → understandable advice and honest outcome |
| Optional specialist | Answer exactly one bounded unresolved material expertise question; advisory, not final authority | Selected evidence + explicit question → expertise answer, basis/limits, reachable downstream |

Set semantic panel roles/roleTasks explicitly. Set recommendation rigor that actually requires independent reviewer and red-team; verify bind, do not assume prose does it. Final explanation consumes the exact recommendation version these roles inspected. Panel synthesizer is a comparison, not another final decision. Task posture is instructions, not invented per-seat persona metadata.

## Dialogue and continuation rules

The skill classifies meaning rather than exposing commands/rosters to the person:

| Human turn | Action | Work not performed |
|---|---|---|
| Clarification / challenge answerable from cited evidence | Explain using stored reports; state unresolved uncertainty if necessary | No panel restart, no new worker merely to rephrase |
| New material context | Affected investigator/shaper → critique → reviewed recommendation → explanation/close segments | Unaffected first-pass jobs are not repeated |
| Request for alternative | Alternative shaper → critique → reviewed recommendation → explanation/close, retaining original inputs | No lead-invented candidate or complete panel rerun |
| Composition of options | Actual shaper evaluates composed candidate → critique → reviewed recommendation → explanation/close | Lead does not present an unreviewed composition as panel output |
| Material specialist need found by advisor | At completed analysis/recommendation boundary, bounded specialist → affected reviewed recommendation → explanation; no fabricated owner turn | No standing specialist, speculative recruitment, empty report or automatic specialist loop |
| Decide / defer | Answer current no-Unit close gate with exact human turn through `workflow answer`; explain outcome/triggers and dissent | No fabricated consensus, extra worker or automatic implementation |

Only genuine human material reopening increments reopenRound; maximum two is a new design choice. Advisor-discovered specialist/review work is bounded within its pass and does not consume/fabricate a human turn. Clarification/decision consumes no round. Recover root/parent/pass/round from stored definitions/IDs. Before human material reopen, answer current close with exact owner turn, then start affected analysis/recommendation segments, ending at its own explanation/close. Resume recorded interrupted Units through Phase 02 reconnect, not duplicate execution. Cap never authorizes an invented defer. New CASE requires explicit new-case intent, not hidden budget reset.

Advice is delivered before the final no-Unit close gate is answered. Clarification leaves it parked; decide/defer answers verbatim; real material reopen records its turn. Earlier completed technical segments do not imply human consent/decision. Advisor no-consensus/insufficient evidence is a report outcome, never a human answer. User-exclusive gaps need a genuine human gate/answer; technical specialist need uses finite boundaries, not a false human gate or skipped conditional step. Refusal/missing evidence remains explicit.

## State, authority and close

- Existing Workflow logs and Unit histories own execution truth. Immutable tasks/ref lists do not freeze arbitrary evidence files: use captured input bytes/digests proven in Phase 02. Never rewrite a prior gate answer. Final advice links actual reports, not a separate mutable session database.
- Original human words remain distinguishable from interpretation and advisor outputs. Explicit refusals/constraints are not argued away. No implementation/git mutation in target project.
- Record actual bindings/provider diversity, what each seat received, limits of blindness, unresolved findings, confidence and evidence.
- `completed` means execution finished, not sound advice or human approval. Result can be recommendation awaiting human decision, human decision, intentional deferral, no consensus, execution failure or policy refusal. Do not overwrite one with another to make a checklist green.
- No closed-state/quality score oracle. Product reviewer examines actual advice, not only artifact counts.

## Implementation and verification

1. Read Phase 01's locked intent/challenges and [preservation matrix](reports/advisory-preservation-matrix.md), preserved role requirements and current canonical source after the original single-door Phase 01 shared-file barrier. Remove fixed executor/invocation/model rows and `actors[]`/specialist-slot/coordination-run ceremony in one clean cutover; retain all matrix behaviors. Move historical rationale out of operational commands, not into compatibility shims.
2. Materialize the finite analysis and reviewed-recommendation/explanation definitions proven in Phase 02; keep exact final packet/review provenance. Verify through actual loader and worker reports.
3. Write concise skill guidance for technical segment boundaries, specialist limit, human turns/budget and recovery. Include concrete definitions using supported Phase 02 contracts, no generic continuation engine. Include interrupted parent-answer/child-start recovery and owner CASE quoting.
4. Smoke canonical definitions through Phase 02 CLI; all four Astra prerequisites must already have live early-gate evidence. This is not installed-entry acceptance: Phase 04 owns render/stage and real-entry proof.
5. Review canonical source against preservation and simplicity boundaries; fix findings, update affected behavior tests/spec/changelog once edits settle. Phase 04 owns this plan's relevant-suite and final `npm test` gate.
6. Remove smoke scaffolding after recording evidence. Hand source-complete cutover to Phase 04 for regeneration/staging and installed-entry proof, independent of original single-door completion.

## Product acceptance handoff

Phase 02 already proves core feasibility on real external target/workers before cutover. Phase 04 repeats scenarios through actual rendered/staged entry after its own regeneration/staging. Neither source review nor early API prototype proves that installed surface. Historical old-engine quality remains NOT RUN unless exercised.


## Simplicity acceptance

- One user entry, finite analysis/recommendation/explanation segments; optional bounded specialist only on real need. No one-start claim or per-seat manual commands. Two human material reopen rounds; at most one specialist intervention per pass.
- Report actual starts, status/answer/read commands, interventions and latency; technical segmentation is not hidden as a human round.
- Runtime contracts remain within existing Workflow/Pattern/Unit/ref owners: original three seams, findings acceptance and durable Unit reconnect/capture as specified in Phase 02. No new advisory engine/store; Phase 02 proves sufficiency instead of asserting a seam count.
- Main skill contains only operational instructions; reference prose is not an excuse to hide a duplicate engine in a larger appendix.
- Every preservation row is proved or marked blocked. Missing specialist/dialogue work is not accepted as "foundation"/follow-up.

Rollback: revert canonical skill/workflow and spec together; rebuild projections through Phase 04's existing build/release doors. Do not modify historical run state. A reverted runtime seam requires reverting dependent skill promises as well. Shared runner spec/changelog and any build/stage writes require an explicit writer baton, a snapshot and integration of the other plan's landed changes; no concurrent shared writes. Preserve original read-only preconditions and host-write-denied execution without config/policy weakening.

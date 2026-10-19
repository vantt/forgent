# Review: step-02i map part 110

Reviewer: reviewer:sonnet-session:a0c9a796c817baaff@2026-10-19
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree verified detached at 74e3ecf1e)
Part: 110 (mandatory-rereview-action-changed-from-02g, 60 entries, sourceTable step-02i-census-maps-portals-prose.json)

## Summary

- ok 0, rework 30, needs-Lead-judgment 30 (total 60).
- All 60 rows are `docs/specs/runner.md` references inside retired-engine/history wrapper files (header block above `## Literal Snapshot`, verified line 17 `Related:` list item and line 23 prose sentence in every file; all rows reader/retained source, no successor note, no carriage policy).
- Defect class A (rework): line-17 Related-list rows flipped from cutover patch (02g) to preserve/provenance (02i). Contradicts the ruling that Related lists in wrapper headers outside a Literal Snapshot are patched. Target `docs/platform/runner/README.md` exists and is the right portal for a plain navigation link.
- Class B (needs-Lead-judgment): line-23 rows flipped preserve -> patch to README; the bold-heading locator in the sentence does not resolve in README and the only holder is carriage. The 02g preserve was not right either (live `see` pointer), so the 02i direction is plausible, the target/locator is the open point.
- Superseded-by lines (line 19) are not in this part.

## Per-entry verdicts

| # | edgeId | consumer (tail) | line | 02g -> 02i action | verdict |
|--:|---|---|--:|---|---|
| 1 | maps-i-03228 | playbooks/prompts/master-coordinator.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 2 | maps-i-03238 | playbooks/prompts/step-07-design-discussion-handoff.md | 17 | patch -> preserve/provenance | rework (class A) |
| 3 | maps-i-03240 | playbooks/prompts/step-07-design-discussion-handoff.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 4 | maps-i-03261 | files/proposals/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 5 | maps-i-03263 | files/proposals/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 6 | maps-i-03273 | files/proposals/dag-request-scheduler.md | 17 | patch -> preserve/provenance | rework (class A) |
| 7 | maps-i-03275 | files/proposals/dag-request-scheduler.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 8 | maps-i-03279 | files/proposals/dispatch-control-plane-redesign.md | 17 | patch -> preserve/provenance | rework (class A) |
| 9 | maps-i-03281 | files/proposals/dispatch-control-plane-redesign.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 10 | maps-i-03310 | files/proposals/semantic-cli-surface.md | 17 | patch -> preserve/provenance | rework (class A) |
| 11 | maps-i-03312 | files/proposals/semantic-cli-surface.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 12 | maps-i-03315 | files/proposals/step-07-coordination-session-adhoc-task.md | 17 | patch -> preserve/provenance | rework (class A) |
| 13 | maps-i-03317 | files/proposals/step-07-coordination-session-adhoc-task.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 14 | maps-i-03319 | files/proposals/step-08-standalone-coordination-protocols.md | 17 | patch -> preserve/provenance | rework (class A) |
| 15 | maps-i-03321 | files/proposals/step-08-standalone-coordination-protocols.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 16 | maps-i-03336 | files/proposals/team-communication-protocol-v1.md | 17 | patch -> preserve/provenance | rework (class A) |
| 17 | maps-i-03338 | files/proposals/team-communication-protocol-v1.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 18 | maps-i-03340 | files/roadmap/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 19 | maps-i-03342 | files/roadmap/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 20 | maps-i-03348 | roadmap/team-dispatch-v1/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 21 | maps-i-03350 | roadmap/team-dispatch-v1/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 22 | maps-i-03354 | roadmap/team-dispatch-v1/step-00-overview.md | 17 | patch -> preserve/provenance | rework (class A) |
| 23 | maps-i-03356 | roadmap/team-dispatch-v1/step-00-overview.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 24 | maps-i-03369 | roadmap/team-dispatch-v1/step-01-rollout.md | 17 | patch -> preserve/provenance | rework (class A) |
| 25 | maps-i-03371 | roadmap/team-dispatch-v1/step-01-rollout.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 26 | maps-i-03382 | roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md | 17 | patch -> preserve/provenance | rework (class A) |
| 27 | maps-i-03384 | roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 28 | maps-i-03390 | roadmap/team-dispatch-v1/step-03-assignment-runresult.md | 17 | patch -> preserve/provenance | rework (class A) |
| 29 | maps-i-03392 | roadmap/team-dispatch-v1/step-03-assignment-runresult.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 30 | maps-i-03401 | roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md | 17 | patch -> preserve/provenance | rework (class A) |
| 31 | maps-i-03403 | roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 32 | maps-i-03408 | roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md | 17 | patch -> preserve/provenance | rework (class A) |
| 33 | maps-i-03410 | roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 34 | maps-i-03412 | roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md | 17 | patch -> preserve/provenance | rework (class A) |
| 35 | maps-i-03414 | roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 36 | maps-i-03417 | retired-engine/files/spec.md | 17 | patch -> preserve/provenance | rework (class A) |
| 37 | maps-i-03419 | retired-engine/files/spec.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 38 | maps-i-03430 | files/subcomponents/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 39 | maps-i-03432 | files/subcomponents/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 40 | maps-i-03437 | files/verification/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 41 | maps-i-03439 | files/verification/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 42 | maps-i-03453 | files/verification/implementation-alignment.md | 17 | patch -> preserve/provenance | rework (class A) |
| 43 | maps-i-03455 | files/verification/implementation-alignment.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 44 | maps-i-03458 | retired-engine/files/vision.md | 17 | patch -> preserve/provenance | rework (class A) |
| 45 | maps-i-03460 | retired-engine/files/vision.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 46 | maps-i-03473 | files/vocabulary/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 47 | maps-i-03475 | files/vocabulary/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 48 | maps-i-03477 | files/vocabulary/canonical-concepts.md | 17 | patch -> preserve/provenance | rework (class A) |
| 49 | maps-i-03479 | files/vocabulary/canonical-concepts.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 50 | maps-i-03484 | files/vocabulary/concept-relationships.md | 17 | patch -> preserve/provenance | rework (class A) |
| 51 | maps-i-03486 | files/vocabulary/concept-relationships.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 52 | maps-i-03488 | files/vocabulary/deprecated-and-reserved.md | 17 | patch -> preserve/provenance | rework (class A) |
| 53 | maps-i-03490 | files/vocabulary/deprecated-and-reserved.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 54 | maps-i-03562 | history/documentation-migration/migration-status.md | 17 | patch -> preserve/provenance | rework (class A) |
| 55 | maps-i-03564 | history/documentation-migration/migration-status.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 56 | maps-i-03570 | history/implementation-records/orchestration-vocabulary-map-2026-08-27.md | 17 | patch -> preserve/provenance | rework (class A) |
| 57 | maps-i-03572 | history/implementation-records/orchestration-vocabulary-map-2026-08-27.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 58 | maps-i-03575 | retired-engine/inbound/intent-preservation-ledger.md | 17 | patch -> preserve/provenance | rework (class A) |
| 59 | maps-i-03577 | retired-engine/inbound/intent-preservation-ledger.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 60 | maps-i-03606 | retired-engine/legacy/README.md | 17 | patch -> preserve/provenance | rework (class A) |

## Rationale text

- Class A: rework: Related list in a wrapper header outside the Literal Snapshot is live navigation (Lead ruling) and was a cutover patch in 02g; 02i flips it to preserve/provenance. Correct action: cutover patch `docs/specs/runner.md` -> `docs/platform/runner/README.md`.
- Class B: needs-Lead-judgment: patch target README does not hold the bold heading locator `CoordinationSession (Lịch sử ...)`; the heading text exists only in carriage `docs/platform/runner/decisions/h-aabefc85f0c9.md` (Carriage only, Canonical: No) and legacy `docs/specs/runner.md:1387`, and patches may not point into carriage. Live pointer (not pure past-tense history), so 02g preserve was also wrong; options: keep README patch (README lists the heading as link text/slug), park for Step 3, or row flip.

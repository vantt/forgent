# Review: step-02i map part 109

Reviewer: reviewer:sonnet-session:a0c9a796c817baaff@2026-10-19
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree verified detached at 74e3ecf1e)
Part: 109 (mandatory-rereview-action-changed-from-02g, 60 entries, sourceTable step-02i-census-maps-portals-prose.json)

## Summary

- ok 0, rework 30, needs-Lead-judgment 30 (total 60).
- All 60 rows are `docs/specs/runner.md` references inside retired-engine/history wrapper files (header block above `## Literal Snapshot`, verified line 17 `Related:` list item and line 23 prose sentence in every file; all rows reader/retained source, no successor note, no carriage policy).
- Defect class A (rework): line-17 Related-list rows flipped from cutover patch (02g) to preserve/provenance (02i). Contradicts the ruling that Related lists in wrapper headers outside a Literal Snapshot are patched. Target `docs/platform/runner/README.md` exists and is the right portal for a plain navigation link.
- Class B (needs-Lead-judgment): line-23 rows flipped preserve -> patch to README; the bold-heading locator in the sentence does not resolve in README and the only holder is carriage. The 02g preserve was not right either (live `see` pointer), so the 02i direction is plausible, the target/locator is the open point.
- Superseded-by lines (line 19) are not in this part.

## Per-entry verdicts

| # | edgeId | consumer (tail) | line | 02g -> 02i action | verdict |
|--:|---|---|--:|---|---|
| 1 | maps-i-03030 | files/architecture/runtime-model.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 2 | maps-i-03035 | files/architecture/runtime-recovery-design.md | 17 | patch -> preserve/provenance | rework (class A) |
| 3 | maps-i-03037 | files/architecture/runtime-recovery-design.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 4 | maps-i-03043 | files/architecture/system-context.md | 17 | patch -> preserve/provenance | rework (class A) |
| 5 | maps-i-03045 | files/architecture/system-context.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 6 | maps-i-03050 | files/architecture/visibility-and-herdr.md | 17 | patch -> preserve/provenance | rework (class A) |
| 7 | maps-i-03052 | files/architecture/visibility-and-herdr.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 8 | maps-i-03054 | files/architecture/work-integration.md | 17 | patch -> preserve/provenance | rework (class A) |
| 9 | maps-i-03056 | files/architecture/work-integration.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 10 | maps-i-03058 | files/contracts/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 11 | maps-i-03060 | files/contracts/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 12 | maps-i-03063 | files/contracts/assignment-run-runresult.md | 17 | patch -> preserve/provenance | rework (class A) |
| 13 | maps-i-03065 | files/contracts/assignment-run-runresult.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 14 | maps-i-03067 | files/contracts/coordination-session.md | 17 | patch -> preserve/provenance | rework (class A) |
| 15 | maps-i-03069 | files/contracts/coordination-session.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 16 | maps-i-03077 | files/contracts/flow-definition.md | 17 | patch -> preserve/provenance | rework (class A) |
| 17 | maps-i-03079 | files/contracts/flow-definition.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 18 | maps-i-03085 | files/contracts/workflow-stage-operation.md | 17 | patch -> preserve/provenance | rework (class A) |
| 19 | maps-i-03087 | files/contracts/workflow-stage-operation.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 20 | maps-i-03089 | files/decisions/ADR-001-work-lifecycle-authority.md | 17 | patch -> preserve/provenance | rework (class A) |
| 21 | maps-i-03091 | files/decisions/ADR-001-work-lifecycle-authority.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 22 | maps-i-03093 | files/decisions/ADR-002-stage-operation-compatibility.md | 17 | patch -> preserve/provenance | rework (class A) |
| 23 | maps-i-03095 | files/decisions/ADR-002-stage-operation-compatibility.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 24 | maps-i-03097 | files/decisions/ADR-003-assignment-run-runresult-separation.md | 17 | patch -> preserve/provenance | rework (class A) |
| 25 | maps-i-03099 | files/decisions/ADR-003-assignment-run-runresult-separation.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 26 | maps-i-03101 | files/decisions/ADR-004-reserve-job.md | 17 | patch -> preserve/provenance | rework (class A) |
| 27 | maps-i-03103 | files/decisions/ADR-004-reserve-job.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 28 | maps-i-03105 | files/decisions/ADR-005-herdr-visibility-only.md | 17 | patch -> preserve/provenance | rework (class A) |
| 29 | maps-i-03107 | files/decisions/ADR-005-herdr-visibility-only.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 30 | maps-i-03109 | files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md | 17 | patch -> preserve/provenance | rework (class A) |
| 31 | maps-i-03111 | files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 32 | maps-i-03114 | files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md | 17 | patch -> preserve/provenance | rework (class A) |
| 33 | maps-i-03116 | files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 34 | maps-i-03118 | files/decisions/ADR-008-coordination-session-and-mission-deferral.md | 17 | patch -> preserve/provenance | rework (class A) |
| 35 | maps-i-03120 | files/decisions/ADR-008-coordination-session-and-mission-deferral.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 36 | maps-i-03127 | files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | 17 | patch -> preserve/provenance | rework (class A) |
| 37 | maps-i-03129 | files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 38 | maps-i-03136 | files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | 17 | patch -> preserve/provenance | rework (class A) |
| 39 | maps-i-03138 | files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 40 | maps-i-03142 | files/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md | 17 | patch -> preserve/provenance | rework (class A) |
| 41 | maps-i-03144 | files/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 42 | maps-i-03146 | files/decisions/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 43 | maps-i-03148 | files/decisions/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 44 | maps-i-03152 | retired-engine/files/intent-preservation-ledger.md | 17 | patch -> preserve/provenance | rework (class A) |
| 45 | maps-i-03154 | retired-engine/files/intent-preservation-ledger.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 46 | maps-i-03174 | files/playbooks/README.md | 17 | patch -> preserve/provenance | rework (class A) |
| 47 | maps-i-03176 | files/playbooks/README.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 48 | maps-i-03179 | files/playbooks/architecture-advisory-artifact-templates.md | 17 | patch -> preserve/provenance | rework (class A) |
| 49 | maps-i-03181 | files/playbooks/architecture-advisory-artifact-templates.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 50 | maps-i-03184 | files/playbooks/architecture-advisory-evaluation-rubric.md | 17 | patch -> preserve/provenance | rework (class A) |
| 51 | maps-i-03186 | files/playbooks/architecture-advisory-evaluation-rubric.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 52 | maps-i-03188 | files/playbooks/architecture-advisory-role-doctrine.md | 17 | patch -> preserve/provenance | rework (class A) |
| 53 | maps-i-03190 | files/playbooks/architecture-advisory-role-doctrine.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 54 | maps-i-03192 | files/playbooks/coordination-operating-harness.md | 17 | patch -> preserve/provenance | rework (class A) |
| 55 | maps-i-03194 | files/playbooks/coordination-operating-harness.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 56 | maps-i-03201 | files/playbooks/mvp6-dogfood-handoff.md | 17 | patch -> preserve/provenance | rework (class A) |
| 57 | maps-i-03203 | files/playbooks/mvp6-dogfood-handoff.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 58 | maps-i-03216 | playbooks/prompts/architecture-advisory-coordinator.md | 17 | patch -> preserve/provenance | rework (class A) |
| 59 | maps-i-03218 | playbooks/prompts/architecture-advisory-coordinator.md | 23 | preserve/provenance -> patch README | needs-Lead-judgment (class B) |
| 60 | maps-i-03226 | playbooks/prompts/master-coordinator.md | 17 | patch -> preserve/provenance | rework (class A) |

## Rationale text

- Class A: rework: Related list in a wrapper header outside the Literal Snapshot is live navigation (Lead ruling) and was a cutover patch in 02g; 02i flips it to preserve/provenance. Correct action: cutover patch `docs/specs/runner.md` -> `docs/platform/runner/README.md`.
- Class B: needs-Lead-judgment: patch target README does not hold the bold heading locator `CoordinationSession (Lịch sử ...)`; the heading text exists only in carriage `docs/platform/runner/decisions/h-aabefc85f0c9.md` (Carriage only, Canonical: No) and legacy `docs/specs/runner.md:1387`, and patches may not point into carriage. Live pointer (not pure past-tense history), so 02g preserve was also wrong; options: keep README patch (README lists the heading as link text/slug), park for Step 3, or row flip.

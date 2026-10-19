# review-a38-step-02i-map-part-116

Reviewer: reviewer:sonnet-session:ab6e5b84563bd05f3@2026-10-19
Commits: worktree detached at 74e3ecf1e (accounting); author 904d0fb5c; 02h baseline 6c415d7ce

Part: 116 (mandatory-rereview-action-changed-from-02h, 60 entries, sourceTable step-02i-census-maps-portals-prose.json)


Uniform part: 30 history files under docs/platform/agent-coordination/history/retired-engine/files/**, each with an identical header (Related list line 17) and identical sentence (line 23); verified by comparing contexts: exactly two distinct contexts, 30 each.

- Even rows (line 17, `- docs/specs/runner.md` in Related): ok. 02h patched them; 02i preserves as duplicate of line 19 "Superseded by: Current execution ownership in docs/specs/runner.md" (lineage), consistent with 67 other such edges.
- Odd rows (line 23, "The coordination engine was retired in `2180b4e72701...`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử - ...)**"): rework D5. Action (cutover patch) is right under the Lead correction, but desiredOwner docs/platform/runner/README.md with no anchor is wrong: the bold heading locator does not exist in README. Target must be docs/platform/runner/decisions/h-aabefc85f0c9.md with the anchor of its H1 "Added in candidate: Runner CoordinationSession (Lịch sử - ...)" (verified the string appears only in that file under docs/platform/runner). Patch must replace the complete reference unit only and keep the surrounding bold text and repo-root form. The same sentence is on 73 edges in the table (all README); fix all together.


## Entries

| # | edgeId | consumer:line | 02h -> 02i | verdict | class | note |
|---|---|---|---|---|---|---|
| 0 | maps-i-02979 | ..re/files/architecture/coordination-foundation-baseline.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 1 | maps-i-02981 | ..re/files/architecture/coordination-foundation-baseline.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 2 | maps-i-02988 | ..re/files/architecture/dispatch-control-plane.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 3 | maps-i-02990 | ..re/files/architecture/dispatch-control-plane.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 4 | maps-i-03003 | ..re/files/architecture/evidence-and-results.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 5 | maps-i-03005 | ..re/files/architecture/evidence-and-results.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 6 | maps-i-03007 | ..re/files/architecture/executor-health-and-fallback.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 7 | maps-i-03009 | ..re/files/architecture/executor-health-and-fallback.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 8 | maps-i-03011 | ..re/files/architecture/group-thinking-trigger-surface.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 9 | maps-i-03013 | ..re/files/architecture/group-thinking-trigger-surface.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 10 | maps-i-03016 | ..re/files/architecture/protocol-model.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 11 | maps-i-03018 | ..re/files/architecture/protocol-model.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 12 | maps-i-03023 | ..re/files/architecture/run-handle.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 13 | maps-i-03025 | ..re/files/architecture/run-handle.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 14 | maps-i-03028 | ..re/files/architecture/runtime-model.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 15 | maps-i-03030 | ..re/files/architecture/runtime-model.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 16 | maps-i-03035 | ..re/files/architecture/runtime-recovery-design.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 17 | maps-i-03037 | ..re/files/architecture/runtime-recovery-design.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 18 | maps-i-03043 | ..re/files/architecture/system-context.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 19 | maps-i-03045 | ..re/files/architecture/system-context.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 20 | maps-i-03050 | ..re/files/architecture/visibility-and-herdr.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 21 | maps-i-03052 | ..re/files/architecture/visibility-and-herdr.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 22 | maps-i-03054 | ..re/files/architecture/work-integration.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 23 | maps-i-03056 | ..re/files/architecture/work-integration.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 24 | maps-i-03058 | ..re/files/contracts/README.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 25 | maps-i-03060 | ..re/files/contracts/README.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 26 | maps-i-03063 | ..re/files/contracts/assignment-run-runresult.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 27 | maps-i-03065 | ..re/files/contracts/assignment-run-runresult.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 28 | maps-i-03067 | ..re/files/contracts/coordination-session.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 29 | maps-i-03069 | ..re/files/contracts/coordination-session.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 30 | maps-i-03077 | ..re/files/contracts/flow-definition.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 31 | maps-i-03079 | ..re/files/contracts/flow-definition.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 32 | maps-i-03085 | ..re/files/contracts/workflow-stage-operation.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 33 | maps-i-03087 | ..re/files/contracts/workflow-stage-operation.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 34 | maps-i-03089 | ..re/files/decisions/ADR-001-work-lifecycle-authority.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 35 | maps-i-03091 | ..re/files/decisions/ADR-001-work-lifecycle-authority.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 36 | maps-i-03093 | ..re/files/decisions/ADR-002-stage-operation-compatibility.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 37 | maps-i-03095 | ..re/files/decisions/ADR-002-stage-operation-compatibility.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 38 | maps-i-03097 | ..re/files/decisions/ADR-003-assignment-run-runresult-separation.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 39 | maps-i-03099 | ..re/files/decisions/ADR-003-assignment-run-runresult-separation.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 40 | maps-i-03101 | ..re/files/decisions/ADR-004-reserve-job.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 41 | maps-i-03103 | ..re/files/decisions/ADR-004-reserve-job.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 42 | maps-i-03105 | ..re/files/decisions/ADR-005-herdr-visibility-only.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 43 | maps-i-03107 | ..re/files/decisions/ADR-005-herdr-visibility-only.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 44 | maps-i-03109 | ..re/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 45 | maps-i-03111 | ..re/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 46 | maps-i-03114 | ..re/files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 47 | maps-i-03116 | ..re/files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 48 | maps-i-03118 | ..re/files/decisions/ADR-008-coordination-session-and-mission-deferral.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 49 | maps-i-03120 | ..re/files/decisions/ADR-008-coordination-session-and-mission-deferral.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 50 | maps-i-03127 | ..re/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 51 | maps-i-03129 | ..re/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 52 | maps-i-03136 | ..re/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 53 | maps-i-03138 | ..re/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 54 | maps-i-03142 | ..re/files/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 55 | maps-i-03144 | ..re/files/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 56 | maps-i-03146 | ..re/files/decisions/README.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 57 | maps-i-03148 | ..re/files/decisions/README.md:23 | preserve -> cutover-patch-only | rework | D5 |  |
| 58 | maps-i-03152 | ..re/files/intent-preservation-ledger.md:17 | cutover-patch-only -> preserve | ok |  | Related-list entry duplicating the same-header "Superseded by: ... docs/specs/runner.md" lineage line in a History carrier; preserve (same as 67 sibling edges) |
| 59 | maps-i-03154 | ..re/files/intent-preservation-ledger.md:23 | preserve -> cutover-patch-only | rework | D5 |  |

## Totals

ok 30, rework 30, needs-Lead-judgment 0 (of 60)

- rework ids: maps-i-02981, maps-i-02990, maps-i-03005, maps-i-03009, maps-i-03013, maps-i-03018, maps-i-03025, maps-i-03030, maps-i-03037, maps-i-03045, maps-i-03052, maps-i-03056, maps-i-03060, maps-i-03065, maps-i-03069, maps-i-03079, maps-i-03087, maps-i-03091, maps-i-03095, maps-i-03099, maps-i-03103, maps-i-03107, maps-i-03111, maps-i-03116, maps-i-03120, maps-i-03129, maps-i-03138, maps-i-03144, maps-i-03148, maps-i-03154
- needs-Lead-judgment ids: none

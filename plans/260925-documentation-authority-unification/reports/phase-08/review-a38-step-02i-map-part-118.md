# review-a38-step-02i-map-part-118
Reviewer: reviewer:sonnet-session:r5-p117@2026-10-19
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1e, verified); 02h baseline 6c415d7ce
Part: 118 (60 entries, mandatory-rereview-action-changed-from-02h)
Result: ok 33 / rework 27 / needs-Lead-judgment 0

## Class judgments
- Group 1, history wrapper files (vocabulary/*, inbound/*, legacy/*; 20 edges, same layout as part 117): line 17 `Related:` item preserved (10 edges, class A); line 23 framing sentence patched to README (10 edges, class B).
- Group 2, playbooks/*.md consumers 03685/03687/03689/03697: sentence `see docs/specs/runner.md's historical CoordinationSession section` in live candidate files. Patch action right; locator citation so class B.
- Group 3, 03683/03703 ok.
- Group 4, architecture-map.md lines 157-831 and component-boundary.md 271-539 (20 edges): inside explicit carriage regions (`## Added in candidate: architecture-map source carriage` line 80 with framing "Full source text follows ... makes no new ... authority claim"; `component-boundary-advisory source carriage` lines 116-1183). Preserve correct (L12-23/25); 03770 (`docs/specs/` tree statement) preserved in carriage, ok.
- Group 5, documentation/switchboard.md lines 49-51 (11 edges): Route / Retained-source cells = migration state, phase9-row-flip correct (L12-25 item 1); owners consistent (none for legacy-tree globs and the retained projection).
- Group 6, documentation/history/templates/{architecture,area-readme,contract}.md line 18 `docs/doc-governance.md` (3 edges): item in the wrapper `Related:` list, preserved as provenance. Class A (doc-governance is patched as navigation elsewhere, e.g. maps-i-00001, maps-i-02291; sibling line 17 `docs/templates/*` preserve is correct under L12-10). Patch new `docs/platform/governance.md`.

A: REWORK-A: Related list in a wrapper header outside the Literal Snapshot is live navigation and must be a cutover patch (new `docs/platform/runner/README.md`, whole-file reference, README default correct). Row is now provenance/preserve; 02h had patch.
B: REWORK-B: prose `see docs/specs/runner.md **CoordinationSession (Lịch sử ...)**` / `historical CoordinationSession section` is a locator citation. Action (patch) is right, but the README does not hold that section. It lives in non-carriage candidate file `docs/platform/runner/decisions/h-aabefc85f0c9.md` (heading `## CoordinationSession (Lịch sử — đã thu hồi per P4; ...)` at line 25, verified; per Lead correction its `Carriage only`/`Canonical: No` header does not make it carriage). Patch `new` must be that path.

## Rows
- maps-i-03473 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03475 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03477 | rework | A | preserve -> docs/platform/runner/README.md | canonical-concepts.md:17 (02h: cutover-patch-only)
- maps-i-03479 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | canonical-concepts.md:23 (02h: preserve)
- maps-i-03484 | rework | A | preserve -> docs/platform/runner/README.md | concept-relationships.md:17 (02h: cutover-patch-only)
- maps-i-03486 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | concept-relationships.md:23 (02h: preserve)
- maps-i-03488 | rework | A | preserve -> docs/platform/runner/README.md | deprecated-and-reserved.md:17 (02h: cutover-patch-only)
- maps-i-03490 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | deprecated-and-reserved.md:23 (02h: preserve)
- maps-i-03562 | rework | A | preserve -> docs/platform/runner/README.md | migration-status.md:17 (02h: cutover-patch-only)
- maps-i-03564 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | migration-status.md:23 (02h: preserve)
- maps-i-03570 | rework | A | preserve -> docs/platform/runner/README.md | orchestration-vocabulary-map-2026-08-27.md:17 (02h: cutover-patch-only)
- maps-i-03572 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | orchestration-vocabulary-map-2026-08-27.md:23 (02h: preserve)
- maps-i-03575 | rework | A | preserve -> docs/platform/runner/README.md | intent-preservation-ledger.md:17 (02h: cutover-patch-only)
- maps-i-03577 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | intent-preservation-ledger.md:23 (02h: preserve)
- maps-i-03606 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03608 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03612 | rework | A | preserve -> docs/platform/runner/README.md | system-context.md:17 (02h: cutover-patch-only)
- maps-i-03614 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | system-context.md:23 (02h: preserve)
- maps-i-03618 | rework | A | preserve -> docs/platform/runner/README.md | intent-preservation-ledger.md:17 (02h: cutover-patch-only)
- maps-i-03620 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | intent-preservation-ledger.md:23 (02h: preserve)
- maps-i-03683 | ok | prose recounting a completed migration action ("preserves ... from docs/architect/.../playbooks/") on a retiring path: historical preserve. | preserve -> docs/platform/agent-coordination/playbooks/ | README.md:28 (02h: cutover-patch-only)
- maps-i-03685 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-artifact-templates.md:48 (02h: preserve)
- maps-i-03687 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-evaluation-rubric.md:29 (02h: preserve)
- maps-i-03689 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-role-doctrine.md:29 (02h: preserve)
- maps-i-03697 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-coordinator.md:35 (02h: preserve)
- maps-i-03703 | ok | same as 03683 (proposals/). | preserve -> docs/platform/agent-coordination/proposals/ | README.md:30 (02h: cutover-patch-only)
- maps-i-03769 | ok |  | preserve -> docs/platform/documentation/history/id-systems-audit.md | architecture-map.md:157 (02h: cutover-patch-only)
- maps-i-03770 | ok |  | preserve -> None | architecture-map.md:308 (02h: preserve-pending-target)
- maps-i-03772 | ok |  | preserve -> docs/platform/work-state/contracts/cli-io-contract.md | architecture-map.md:446 (02h: cutover-patch-only)
- maps-i-03773 | ok |  | preserve -> docs/platform/runner/contracts/routing-handoff.md | architecture-map.md:451 (02h: cutover-patch-only)
- maps-i-03774 | ok |  | preserve -> docs/platform/agent-confinement/README.md | architecture-map.md:456 (02h: cutover-patch-only)
- maps-i-03776 | ok |  | preserve -> docs/platform/system-overview/spec.md | architecture-map.md:608 (02h: cutover-patch-only)
- maps-i-03779 | ok |  | preserve -> docs/platform/documentation/history/id-systems-audit.md | architecture-map.md:611 (02h: cutover-patch-only)
- maps-i-03780 | ok |  | preserve -> docs/reading-map.md | architecture-map.md:615 (02h: cutover-patch-only)
- maps-i-03781 | ok |  | preserve -> docs/platform/documentation/history/id-systems-audit.md | architecture-map.md:635 (02h: cutover-patch-only)
- maps-i-03784 | ok |  | preserve -> docs/reading-map.md | architecture-map.md:708 (02h: cutover-patch-only)
- maps-i-03785 | ok |  | preserve -> docs/platform/documentation/history/id-systems-audit.md | architecture-map.md:724 (02h: cutover-patch-only)
- maps-i-03787 | ok |  | preserve -> docs/platform/documentation/history/id-systems-audit.md | architecture-map.md:774 (02h: cutover-patch-only)
- maps-i-03789 | ok |  | preserve -> docs/platform/documentation/history/id-systems-audit.md | architecture-map.md:803 (02h: cutover-patch-only)
- maps-i-03792 | ok |  | preserve -> docs/reading-map.md | architecture-map.md:819 (02h: cutover-patch-only)
- maps-i-03793 | ok |  | preserve -> docs/reading-map.md | architecture-map.md:831 (02h: cutover-patch-only)
- maps-i-03826 | ok |  | preserve -> docs/reading-map.md | component-boundary.md:271 (02h: cutover-patch-only)
- maps-i-03827 | ok |  | preserve -> None | component-boundary.md:272 (02h: preserve-pending-target)
- maps-i-03828 | ok |  | preserve -> None | component-boundary.md:272 (02h: preserve-pending-target)
- maps-i-03829 | ok |  | preserve -> docs/platform/agent-coordination/architecture/dispatch-control-plane.md | component-boundary.md:468 (02h: cutover-patch-only)
- maps-i-03830 | ok |  | preserve -> docs/platform/proposals/component-authority-boundary-map.md | component-boundary.md:539 (02h: cutover-patch-only)
- maps-i-03961 | rework | A | preserve -> docs/platform/governance.md | architecture.md:18 (02h: cutover-patch-only)
- maps-i-03963 | rework | A | preserve -> docs/platform/governance.md | area-readme.md:18 (02h: cutover-patch-only)
- maps-i-03964 | rework | A | preserve -> docs/platform/governance.md | contract.md:18 (02h: cutover-patch-only)
- maps-i-03977 | ok |  | phase9-row-flip -> docs/platform/platform-foundations.md | switchboard.md:49 (02h: preserve)
- maps-i-03978 | ok |  | phase9-row-flip -> None | switchboard.md:49 (02h: preserve)
- maps-i-03979 | ok |  | phase9-row-flip -> docs/platform/platform-foundations.md | switchboard.md:49 (02h: preserve)
- maps-i-03980 | ok |  | phase9-row-flip -> docs/platform/platform-foundations.md | switchboard.md:49 (02h: preserve)
- maps-i-03981 | ok |  | phase9-row-flip -> docs/platform/vision.md | switchboard.md:50 (02h: preserve)
- maps-i-03982 | ok |  | phase9-row-flip -> docs/platform/platform-foundations.md | switchboard.md:50 (02h: preserve)
- maps-i-03983 | ok |  | phase9-row-flip -> docs/platform/vision.md | switchboard.md:50 (02h: preserve)
- maps-i-03984 | ok |  | phase9-row-flip -> docs/platform/architecture-map.md | switchboard.md:51 (02h: preserve)
- maps-i-03985 | ok |  | phase9-row-flip -> None | switchboard.md:51 (02h: preserve)
- maps-i-03986 | ok |  | phase9-row-flip -> docs/platform/architecture-map.md | switchboard.md:51 (02h: preserve)
- maps-i-03987 | ok |  | phase9-row-flip -> None | switchboard.md:51 (02h: preserve)

## Totals
ok 33 / rework 27 (class A 13, class B 14) / needs-Lead-judgment 0.
Class A: maps-i-03473, maps-i-03477, maps-i-03484, maps-i-03488, maps-i-03562, maps-i-03570, maps-i-03575, maps-i-03606, maps-i-03612, maps-i-03618, maps-i-03961, maps-i-03963, maps-i-03964
Class B: maps-i-03475, maps-i-03479, maps-i-03486, maps-i-03490, maps-i-03564, maps-i-03572, maps-i-03577, maps-i-03608, maps-i-03614, maps-i-03620, maps-i-03685, maps-i-03687, maps-i-03689, maps-i-03697

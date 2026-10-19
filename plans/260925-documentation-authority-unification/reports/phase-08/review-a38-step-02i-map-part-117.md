# review-a38-step-02i-map-part-117
Reviewer: reviewer:sonnet-session:r5-p117@2026-10-19
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1e, verified); 02h baseline 6c415d7ce
Part: 117 (60 entries, mandatory-rereview-action-changed-from-02h; edge ids as in index)
Result: ok 0 / rework 60 / needs-Lead-judgment 0

## Class judgments (part is uniform: 30 history-wrapper files x 2 edges, identical sentences)
All 30 consumers are `docs/platform/agent-coordination/history/retired-engine/files/playbooks/*.md` wrapper files; header lines 15-19 and framing sentence line 23 are identical, outside `## Literal Snapshot`.
- Line 17 (`Related:` list item `docs/specs/runner.md`), 30 edges, now provenance/preserve (02h: patch/navigation). REWORK-A: Related list in a wrapper header outside the Literal Snapshot is live navigation and must be a cutover patch (new `docs/platform/runner/README.md`, whole-file reference, README default correct). Row is now provenance/preserve; 02h had patch. Lead ruling reversed by the 02i change.
- Line 23 (`The coordination engine was retired in <sha>; see docs/specs/runner.md **CoordinationSession ...**`), 30 edges, now navigation/patch to runner README (02h: preserve/provenance). REWORK-B: prose `see docs/specs/runner.md **CoordinationSession (Lịch sử ...)**` / `historical CoordinationSession section` is a locator citation. Action (patch) is right, but target README does not hold that section. Content lives in non-carriage candidate file `docs/platform/runner/decisions/h-aabefc85f0c9.md` (heading `## CoordinationSession (Lịch sử — đã thu hồi per P4; ...)` at line 25, verified; Lead correction: its `Carriage only`/`Canonical: No` header does not make it carriage). Patch `new` must be that path. 02h had preserve (provenance); the 02i patch is right in action, wrong in target.
- Line 19 `Superseded by:` is not in this part (history-file preserve, correct).

## Rows (id | verdict | defect | new action seen | file basename:line)
- maps-i-03174 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03176 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03179 | rework | A | preserve -> docs/platform/runner/README.md | architecture-advisory-artifact-templates.md:17 (02h: cutover-patch-only)
- maps-i-03181 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-artifact-templates.md:23 (02h: preserve)
- maps-i-03184 | rework | A | preserve -> docs/platform/runner/README.md | architecture-advisory-evaluation-rubric.md:17 (02h: cutover-patch-only)
- maps-i-03186 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-evaluation-rubric.md:23 (02h: preserve)
- maps-i-03188 | rework | A | preserve -> docs/platform/runner/README.md | architecture-advisory-role-doctrine.md:17 (02h: cutover-patch-only)
- maps-i-03190 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-role-doctrine.md:23 (02h: preserve)
- maps-i-03192 | rework | A | preserve -> docs/platform/runner/README.md | coordination-operating-harness.md:17 (02h: cutover-patch-only)
- maps-i-03194 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | coordination-operating-harness.md:23 (02h: preserve)
- maps-i-03201 | rework | A | preserve -> docs/platform/runner/README.md | mvp6-dogfood-handoff.md:17 (02h: cutover-patch-only)
- maps-i-03203 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | mvp6-dogfood-handoff.md:23 (02h: preserve)
- maps-i-03216 | rework | A | preserve -> docs/platform/runner/README.md | architecture-advisory-coordinator.md:17 (02h: cutover-patch-only)
- maps-i-03218 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | architecture-advisory-coordinator.md:23 (02h: preserve)
- maps-i-03226 | rework | A | preserve -> docs/platform/runner/README.md | master-coordinator.md:17 (02h: cutover-patch-only)
- maps-i-03228 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | master-coordinator.md:23 (02h: preserve)
- maps-i-03238 | rework | A | preserve -> docs/platform/runner/README.md | step-07-design-discussion-handoff.md:17 (02h: cutover-patch-only)
- maps-i-03240 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-07-design-discussion-handoff.md:23 (02h: preserve)
- maps-i-03261 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03263 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03273 | rework | A | preserve -> docs/platform/runner/README.md | dag-request-scheduler.md:17 (02h: cutover-patch-only)
- maps-i-03275 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | dag-request-scheduler.md:23 (02h: preserve)
- maps-i-03279 | rework | A | preserve -> docs/platform/runner/README.md | dispatch-control-plane-redesign.md:17 (02h: cutover-patch-only)
- maps-i-03281 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | dispatch-control-plane-redesign.md:23 (02h: preserve)
- maps-i-03310 | rework | A | preserve -> docs/platform/runner/README.md | semantic-cli-surface.md:17 (02h: cutover-patch-only)
- maps-i-03312 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | semantic-cli-surface.md:23 (02h: preserve)
- maps-i-03315 | rework | A | preserve -> docs/platform/runner/README.md | step-07-coordination-session-adhoc-task.md:17 (02h: cutover-patch-only)
- maps-i-03317 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-07-coordination-session-adhoc-task.md:23 (02h: preserve)
- maps-i-03319 | rework | A | preserve -> docs/platform/runner/README.md | step-08-standalone-coordination-protocols.md:17 (02h: cutover-patch-only)
- maps-i-03321 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-08-standalone-coordination-protocols.md:23 (02h: preserve)
- maps-i-03336 | rework | A | preserve -> docs/platform/runner/README.md | team-communication-protocol-v1.md:17 (02h: cutover-patch-only)
- maps-i-03338 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | team-communication-protocol-v1.md:23 (02h: preserve)
- maps-i-03340 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03342 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03348 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03350 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03354 | rework | A | preserve -> docs/platform/runner/README.md | step-00-overview.md:17 (02h: cutover-patch-only)
- maps-i-03356 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-00-overview.md:23 (02h: preserve)
- maps-i-03369 | rework | A | preserve -> docs/platform/runner/README.md | step-01-rollout.md:17 (02h: cutover-patch-only)
- maps-i-03371 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-01-rollout.md:23 (02h: preserve)
- maps-i-03382 | rework | A | preserve -> docs/platform/runner/README.md | step-02-workflow-stage-operations.md:17 (02h: cutover-patch-only)
- maps-i-03384 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-02-workflow-stage-operations.md:23 (02h: preserve)
- maps-i-03390 | rework | A | preserve -> docs/platform/runner/README.md | step-03-assignment-runresult.md:17 (02h: cutover-patch-only)
- maps-i-03392 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-03-assignment-runresult.md:23 (02h: preserve)
- maps-i-03401 | rework | A | preserve -> docs/platform/runner/README.md | step-04-assignment-runresult-hardening.md:17 (02h: cutover-patch-only)
- maps-i-03403 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-04-assignment-runresult-hardening.md:23 (02h: preserve)
- maps-i-03408 | rework | A | preserve -> docs/platform/runner/README.md | step-05-coding-driver-operation-choice.md:17 (02h: cutover-patch-only)
- maps-i-03410 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-05-coding-driver-operation-choice.md:23 (02h: preserve)
- maps-i-03412 | rework | A | preserve -> docs/platform/runner/README.md | step-06-work-attached-team-adoption.md:17 (02h: cutover-patch-only)
- maps-i-03414 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | step-06-work-attached-team-adoption.md:23 (02h: preserve)
- maps-i-03417 | rework | A | preserve -> docs/platform/runner/README.md | spec.md:17 (02h: cutover-patch-only)
- maps-i-03419 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | spec.md:23 (02h: preserve)
- maps-i-03430 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03432 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03437 | rework | A | preserve -> docs/platform/runner/README.md | README.md:17 (02h: cutover-patch-only)
- maps-i-03439 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | README.md:23 (02h: preserve)
- maps-i-03453 | rework | A | preserve -> docs/platform/runner/README.md | implementation-alignment.md:17 (02h: cutover-patch-only)
- maps-i-03455 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | implementation-alignment.md:23 (02h: preserve)
- maps-i-03458 | rework | A | preserve -> docs/platform/runner/README.md | vision.md:17 (02h: cutover-patch-only)
- maps-i-03460 | rework | B | cutover-patch-only -> docs/platform/runner/README.md | vision.md:23 (02h: preserve)

## Totals
ok 0 / rework 60 (class A 30, class B 30) / needs-Lead-judgment 0.
Class A ids: maps-i-03174, maps-i-03179, maps-i-03184, maps-i-03188, maps-i-03192, maps-i-03201, maps-i-03216, maps-i-03226, maps-i-03238, maps-i-03261, maps-i-03273, maps-i-03279, maps-i-03310, maps-i-03315, maps-i-03319, maps-i-03336, maps-i-03340, maps-i-03348, maps-i-03354, maps-i-03369, maps-i-03382, maps-i-03390, maps-i-03401, maps-i-03408, maps-i-03412, maps-i-03417, maps-i-03430, maps-i-03437, maps-i-03453, maps-i-03458
Class B ids: maps-i-03176, maps-i-03181, maps-i-03186, maps-i-03190, maps-i-03194, maps-i-03203, maps-i-03218, maps-i-03228, maps-i-03240, maps-i-03263, maps-i-03275, maps-i-03281, maps-i-03312, maps-i-03317, maps-i-03321, maps-i-03338, maps-i-03342, maps-i-03350, maps-i-03356, maps-i-03371, maps-i-03384, maps-i-03392, maps-i-03403, maps-i-03410, maps-i-03414, maps-i-03419, maps-i-03432, maps-i-03439, maps-i-03455, maps-i-03460

# Review a38 Step 2 merged census, part 07 (evidence-lexical-refresh)

- Reviewer: reviewer:sonnet-session:a1ac3fb58e3b6d528@2026-10-19
- Author commit ce84b84e7; accounting commit 0689b862e (worktree HEAD verified 0689b862e); input HEAD 587c2a791
- Part: step-02-review-part-07.json, 60 entries (evidence-121 .. evidence-180), sha256 dae4581a5f7c0b76d0d58e09a78461e39ec4e1409008360b6037d4284670a3e8

## Mechanical checks (all 60 entries, read-only)
- Every path exists; file sha256 equals fileDigest; every occurrence line equals cited callSite; every matchedExpression is a substring of its call site; seedLines equal occurrence lines; legacyForm equals presence of architect/agent-coordination/verification in matched expressions. Zero mismatches.
- All 60 rows are lexical rows with preCutoverAction/cutoverAction set; none carries an edit, no alias activated, no payload touched.

## Semantic checks (deep-read: 22 rows, over the 10 minimum; spot context for each listed)
- docs/architect/** rows (121-139): bucket legacy-root-cutover-only, action "patch specification only (L12-7)" is correct; matches policy consumer table row "23 files under docs/architect" (stale links in legacy docs deleted at cutover). Respects L12-7 (no edit now).
- evidence-131 (architect verification README): only platform-form link, so legacyForm false is right; canonical README stays (policy section 6).
- evidence-133/134/136: only relative ../agent-coordination/verification/ links. They resolve to the legacy copy but legacyForm=false (lexical definition, same as seed 194 count). Note only, not rework: bucket and action still correct because the files are themselves legacy-root documents.
- evidence-140/141 (docs/history): historical-record / preserve bytes matches policy row "docs/history/* historical text". evidence-151 (docs/knowledge) is bucketed maintained-requires-semantic-review rather than historical; conservative, acceptable.
- docs/how-to rows (142-150): shipped end-user docs, matches policy row; semantic review pending, no edit. Rows 142 (<track> placeholders) and 150 (relative ../architect/... links, 7) read and consistent.
- docs/platform rows (152-180): promoted-area prose/provenance (e.g. 154 source-inventory 207 occurrences, 175 proof-preservation 24, 172 verification README 13 with provenance lines, 163-173 retired-engine copies whose bytes differ from architect originals). Bucket maintained-requires-semantic-review with no edits matches policy ("deliberate, repoint before deletion") and correctly avoids treating provenance/history passages as rewritable. 152/157/173 are platform-form only (not legacy consumers) and correctly legacyForm false.
- sourceVsRender=source for all: correct, none under .agents/ or plugins/.
- Evidence payload rows match the policy consumer table categories; no payload-tree files appear (excluded, 166 separate). L12-7 respected.

## Rows

| id | path | verdict |
|---|---|---|
| evidence-121 | docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | ok (deep-read) |
| evidence-122 | docs/architect/agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | ok (deep-read) |
| evidence-123 | docs/architect/agent-coordination/decisions/README.md | ok |
| evidence-124 | docs/architect/agent-coordination/documentation-standardization-plan.md | ok (deep-read) |
| evidence-125 | docs/architect/agent-coordination/intent-preservation-ledger.md | ok |
| evidence-126 | docs/architect/agent-coordination/playbooks/coordination-operating-harness.md | ok (deep-read) |
| evidence-127 | docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md | ok |
| evidence-128 | docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md | ok |
| evidence-129 | docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md | ok |
| evidence-130 | docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md | ok |
| evidence-131 | docs/architect/agent-coordination/verification/README.md | ok (deep-read) |
| evidence-132 | docs/architect/architecture-intent.md | ok |
| evidence-133 | docs/architect/host-invocation-routing/documentation-standardization-plan.md | ok (deep-read; note: relative legacy link has legacyForm=false, lexical definition) |
| evidence-134 | docs/architect/proposals/coordination-envelope-probe-contract.md | ok (deep-read; note: relative legacy link has legacyForm=false, lexical definition) |
| evidence-135 | docs/architect/proposals/coordination-envelope-progress.md | ok (deep-read) |
| evidence-136 | docs/architect/proposals/coordination-worker-provider-boundary.md | ok (deep-read; note: relative legacy link has legacyForm=false, lexical definition) |
| evidence-137 | docs/architect/proposals/group-thinking-plan-loop.md | ok |
| evidence-138 | docs/architect/proposals/step-09-group-thinking-substrate.md | ok |
| evidence-139 | docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md | ok |
| evidence-140 | docs/history/p03-3-proof2-work-lookup-proto-guard/CONTEXT.md | ok (deep-read) |
| evidence-141 | docs/history/tsk-43q/iron-law-evidence.md | ok (deep-read) |
| evidence-142 | docs/how-to/author-a-plan-loop-track.md | ok (deep-read) |
| evidence-143 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-alternative-and-composite-reopen.md | ok |
| evidence-144 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-clarification-and-challenge.md | ok |
| evidence-145 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-clear-start.md | ok |
| evidence-146 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-decision-request-and-resume.md | ok |
| evidence-147 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-final-decision-and-defer.md | ok |
| evidence-148 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-material-context-reopen.md | ok |
| evidence-149 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-unclear-start.md | ok |
| evidence-150 | docs/how-to/use-fgos-architecture-panel.md | ok (deep-read) |
| evidence-151 | docs/knowledge/why-hook-registrations-guard-against-gitignored-scripts/hook-registration-guard.md | ok (deep-read) |
| evidence-152 | docs/platform/agent-coordination/architecture/run-handle.md | ok (deep-read) |
| evidence-153 | docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md | ok (deep-read) |
| evidence-154 | docs/platform/agent-coordination/history/documentation-migration/source-inventory.md | ok (deep-read) |
| evidence-155 | docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md | ok |
| evidence-156 | docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md | ok |
| evidence-157 | docs/platform/agent-coordination/history/retired-engine/files/architecture/README.md | ok (deep-read) |
| evidence-158 | docs/platform/agent-coordination/history/retired-engine/files/architecture/run-handle.md | ok |
| evidence-159 | docs/platform/agent-coordination/history/retired-engine/files/architecture/runtime-recovery-design.md | ok |
| evidence-160 | docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md | ok (deep-read) |
| evidence-161 | docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md | ok |
| evidence-162 | docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md | ok |
| evidence-163 | docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | ok |
| evidence-164 | docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | ok |
| evidence-165 | docs/platform/agent-coordination/history/retired-engine/files/decisions/README.md | ok |
| evidence-166 | docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md | ok |
| evidence-167 | docs/platform/agent-coordination/history/retired-engine/files/playbooks/coordination-operating-harness.md | ok |
| evidence-168 | docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md | ok |
| evidence-169 | docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md | ok |
| evidence-170 | docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/master-coordinator.md | ok |
| evidence-171 | docs/platform/agent-coordination/history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md | ok |
| evidence-172 | docs/platform/agent-coordination/history/retired-engine/files/verification/README.md | ok (deep-read) |
| evidence-173 | docs/platform/agent-coordination/history/retired-engine/files/verification/implementation-alignment.md | ok (deep-read) |
| evidence-174 | docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/claim-preservation.md | ok |
| evidence-175 | docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/proof-preservation.md | ok (deep-read) |
| evidence-176 | docs/platform/agent-coordination/history/retired-engine/intent-preservation-ledger.md | ok |
| evidence-177 | docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md | ok |
| evidence-178 | docs/platform/agent-coordination/history/retired-engine/spec.md | ok |
| evidence-179 | docs/platform/agent-coordination/history/retired-engine/subcomponents/README.md | ok (deep-read) |
| evidence-180 | docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md | ok |

## Totals
ok 60 / rework 0 / needs-Lead-judgment 0. Rework rate 0%.

Smallest next action: none for this part; the lexical-form note on 133/134/136 can inform the Step 4 semantic pass.
Time budget: unassigned; light commands only (no tests, no fgos CLI, no inventory).

# Review A38 step-02i mapping part 52

- Reviewer: reviewer:sonnet-session:aac655868447ab631@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree forgentX-s8-review detached at 74e3ecf1e, verified)
- Part: 52 (population writers-and-writer-triage), 52 entries, source step-02i-census-maps-portals-prose.json
- Method: every row read in full (all fields), source line read in the committed file, targets and section headings checked in the committed tree (docs/platform/runner, work-state, agent-confinement, herdr-web-dashboard, architecture-map, platform-foundations, domainization), switchboard row 61 checked for enduser-docs targets, ui-spec generator located.

## Totals

ok 45 / rework 7 / needs-Lead-judgment 0 of 52. Rework 13%, above the 3% threshold (the whole part was read, so no further expansion is needed for this set).

## Rework by defect class

- Class A: section/RUL/heading locator retained next to a portal-README patch whose target does not contain it. Rows: maps-i-05232, maps-i-05251, maps-i-05287, maps-i-05293, maps-i-05294, maps-i-05317
- Class C: past-narrative inside a decision record patched inconsistently with its parked sibling. Rows: maps-i-05316

Notes: every row in this part has role reader except four generator rows, so no reader/comment text is misclassified as writer and no writer row is hidden; ok rows have existing owners per mechanicalTargetCheck. Parked pending-target rows (enduser-docs-index/authoring have no platform target yet per switchboard row 61; whole-root docs/specs/ mentions; line locator work-state.md:886) are correct. Retained docs/backlog.md, docs/architecture-manifest.json and docs/history paths are correctly preserved.

## Entries

| edgeId | location | verdict | rationale |
|---|---|---|---|
| maps-i-05206 | docs/specs/reading-map.md:47 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05207 | docs/specs/reading-map.md:48 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05208 | docs/specs/reading-map.md:49 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05209 | docs/specs/reading-map.md:50 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05210 | docs/specs/reading-map.md:51 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05211 | docs/specs/reading-map.md:52 | ok | reader/navigation preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05212 | docs/specs/reading-map.md:53 | ok | reader/navigation preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05213 | docs/specs/reading-map.md:54 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05214 | docs/specs/reading-map.md:55 | ok | reader/navigation cutover-patch-only -> docs/platform/work-state/README.md |
| maps-i-05216 | docs/specs/reading-map.md:57 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05217 | docs/specs/reading-map.md:58 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05218 | docs/specs/reading-map.md:63 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05219 | docs/specs/reading-map.md:67 | ok | reader/navigation cutover-patch-only -> docs/platform/observe/spec.md |
| maps-i-05221 | docs/specs/reading-map.md:70 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05228 | docs/specs/runner.md:1006 | ok | reader/navigation cutover-patch-only -> docs/platform/herdr-web-dashboard/operations/operator-runbook.md |
| maps-i-05229 | docs/specs/runner.md:1006 | ok | reader/navigation cutover-patch-only -> docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md |
| maps-i-05230 | docs/specs/runner.md:1006 | ok | reader/navigation cutover-patch-only -> docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md |
| maps-i-05232 | docs/specs/runner.md:1033 | rework | [class A] runner.md:1033 "docs/specs/confinement-authority.md §13.1": section 13.1 lives in agent-confinement/history/rollout-and-settled-facts.md (heading 13.1), not in the README portal. Map to that file or park. |
| maps-i-05233 | docs/specs/runner.md:1100 | ok | reader/navigation cutover-patch-only -> docs/platform/agent-confinement/README.md |
| maps-i-05234 | docs/specs/runner.md:1205 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05235 | docs/specs/runner.md:1217 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05238 | docs/specs/runner.md:1230 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05239 | docs/specs/runner.md:1262 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05240 | docs/specs/runner.md:1272 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05243 | docs/specs/runner.md:1283 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/contracts/routing-handoff.md |
| maps-i-05244 | docs/specs/runner.md:1287 | ok | reader/navigation cutover-patch-only -> docs/platform/packaging-distribution/README.md |
| maps-i-05248 | docs/specs/runner.md:1419 | ok | reader/navigation cutover-patch-only -> docs/platform/agent-coordination/architecture/work-integration.md |
| maps-i-05251 | docs/specs/runner.md:1523 | rework | [class A] runner.md:1523 "confinement-authority.md §9.2": heading 9.2 exists in agent-confinement/spec.md; README mapping drops the locator. Exact file is spec.md. |
| maps-i-05285 | docs/specs/runner.md:2994 | ok | reader/retained-history preserve ; retained in place, preserved correctly |
| maps-i-05286 | docs/specs/runner.md:3015 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/contracts/routing-handoff.md |
| maps-i-05287 | docs/specs/runner.md:3172 | rework | [class A] runner.md:3172 link label "confinement-authority.md §13.1" with destination mapped to README; target section 13.1 is in history/rollout-and-settled-facts.md, so the label and destination disagree after patch. |
| maps-i-05288 | docs/specs/runner.md:3216 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/contracts/routing-handoff.md |
| maps-i-05292 | docs/specs/runner.md:3403 | ok | reader/navigation cutover-patch-only -> docs/platform/work-state/contracts/cli-io-contract.md |
| maps-i-05293 | docs/specs/system-overview.md:50 | rework | [class A] system-overview.md:50 "docs/specs/runner.md \"Cong duyet PR noi bo\"": quoted section title not in README; section text is in runner/spec.md / operations. Locator dropped. |
| maps-i-05294 | docs/specs/system-overview.md:52 | rework | [class A] system-overview.md:52 "docs/specs/work-state.md \"Cua pull giao-nhan viec\"": section is in work-state/spec.md; README has no such section. |
| maps-i-05295 | docs/specs/system-overview.md:52 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05297 | docs/specs/system-overview.md:143 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05299 | docs/specs/work-state.md:15 | ok | reader/navigation cutover-patch-only -> docs/platform/coexistence/spec.md |
| maps-i-05303 | docs/specs/work-state.md:862 | ok | reader/navigation cutover-patch-only -> docs/platform/coexistence/spec.md |
| maps-i-05304 | docs/specs/work-state.md:1222 | ok | reader/navigation cutover-patch-only -> docs/platform/coexistence/spec.md |
| maps-i-05306 | docs/specs/work-state.md:1324 | ok | reader/navigation cutover-patch-only -> docs/platform/coexistence/spec.md |
| maps-i-05309 | docs/specs/work-state.md:1360 | ok | reader/navigation cutover-patch-only -> docs/platform/coexistence/spec.md |
| maps-i-05315 | docs/specs/work-state.md:1764 | ok | reader/line-locator-unresolved preserve-pending-target -> docs/platform/work-state/README.md ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05316 | docs/specs/work-state.md:1809 | rework | [class C] work-state.md:1809 is decision record 0019 narrative ("the RUL11 line in docs/specs/work-state.md was edited to cite back this record"). Sibling row maps-i-05315 in the same record is parked, this one is path-patched to a README that does not contain RUL11 (it is in work-state/spec.md). Treat consistently: preserve as past narrative or map to spec.md. |
| maps-i-05317 | docs/specs/work-state.md:1841 | rework | [class A] work-state.md:1841 "docs/specs/work-state.md Data Dictionary #4 and O4": Data Dictionary is section 3 of work-state/spec.md; README mapping drops it. Also inside decision record 0019 narrative. |
| maps-i-05320 | docs/specs/work-state.md:1956 | ok | reader/navigation cutover-patch-only -> docs/platform/platform-foundations.md |
| maps-i-05324 | docs/specs/work-state.md:2308 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05417 | docs/ui-spec/generated/wireframe-v2.html:968 | ok | generator/generated preserve-pending-behavioral-proof -> docs/platform/herdr-web-dashboard/spec.md ; generated file, generator is .claude/skills/ui-spec/tools/build.mjs, Step 5 owns, no hand patch |
| maps-i-05419 | docs/ui-spec/generated/wireframe-v2.html:1099 | ok | generator/generated preserve-pending-behavioral-proof -> docs/platform/herdr-web-dashboard/spec.md ; generated file, generator is .claude/skills/ui-spec/tools/build.mjs, Step 5 owns, no hand patch |
| maps-i-05420 | docs/ui-spec/generated/wireframe-v2.html:1145 | ok | generator/generated preserve-pending-behavioral-proof -> docs/platform/herdr-web-dashboard/spec.md ; generated file, generator is .claude/skills/ui-spec/tools/build.mjs, Step 5 owns, no hand patch |
| maps-i-05421 | docs/ui-spec/generated/wireframe-v2.html:1145 | ok | generator/generated preserve-pending-behavioral-proof -> docs/platform/herdr-web-dashboard/spec.md ; generated file, generator is .claude/skills/ui-spec/tools/build.mjs, Step 5 owns, no hand patch |
| maps-i-05426 | docs/ui-spec/modals/M03-add-edit-item.md:18 | ok | reader/navigation cutover-patch-only -> docs/platform/herdr-web-dashboard/spec.md |

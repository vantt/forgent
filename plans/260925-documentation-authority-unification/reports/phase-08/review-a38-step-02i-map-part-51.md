# Review A38 step-02i mapping part 51

- Reviewer: reviewer:sonnet-session:aac655868447ab631@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree forgentX-s8-review detached at 74e3ecf1e, verified)
- Part: 51 (population writers-and-writer-triage), 60 entries, source step-02i-census-maps-portals-prose.json
- Method: every row read in full (all fields), source line read in the committed file, targets and section headings checked in the committed tree (docs/platform/runner, work-state, agent-confinement, herdr-web-dashboard, architecture-map, platform-foundations, domainization), switchboard row 61 checked for enduser-docs targets, ui-spec generator located.

## Totals

ok 50 / rework 10 / needs-Lead-judgment 0 of 60. Rework 17%, above the 3% threshold (the whole part was read, so no further expansion is needed for this set).

## Rework by defect class

- Class A: section/RUL/heading locator retained next to a portal-README patch whose target does not contain it. Rows: maps-i-05101, maps-i-05102, maps-i-05121, maps-i-05182, maps-i-05183, maps-i-05184, maps-i-05191, maps-i-05192
- Class B: migration-state sentence about the legacy path treated as plain navigation (path substitution). Rows: maps-i-05161, maps-i-05162

Notes: every row in this part has role reader except four generator rows, so no reader/comment text is misclassified as writer and no writer row is hidden; ok rows have existing owners per mechanicalTargetCheck. Parked pending-target rows (enduser-docs-index/authoring have no platform target yet per switchboard row 61; whole-root docs/specs/ mentions; line locator work-state.md:886) are correct. Retained docs/backlog.md, docs/architecture-manifest.json and docs/history paths are correctly preserved.

## Entries

| edgeId | location | verdict | rationale |
|---|---|---|---|
| maps-i-05070 | docs/reading-map.md:164 | ok | reader/navigation cutover-patch-only -> docs/platform/host-invocation-routing/ |
| maps-i-05071 | docs/reading-map.md:164 | ok | reader/navigation cutover-patch-only -> docs/platform/packaging-distribution/README.md |
| maps-i-05072 | docs/reading-map.md:165 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05074 | docs/reading-map.md:167 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05075 | docs/reading-map.md:168 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05076 | docs/reading-map.md:169 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05077 | docs/reading-map.md:170 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05078 | docs/reading-map.md:171 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05079 | docs/reading-map.md:172 | ok | reader/navigation preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05080 | docs/reading-map.md:173 | ok | reader/navigation preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05081 | docs/reading-map.md:175 | ok | reader/navigation cutover-patch-only -> docs/platform/work-state/README.md |
| maps-i-05083 | docs/reading-map.md:177 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05084 | docs/reading-map.md:178 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05085 | docs/reading-map.md:180 | ok | reader/navigation cutover-patch-only -> docs/platform/observe/spec.md |
| maps-i-05088 | docs/reading-map.md:183 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05096 | docs/routing-handoff-contract.md:35 | ok | reader/operative-read cutover-patch-only -> docs/platform/work-state/spec.md |
| maps-i-05100 | docs/specs/confinement-authority.md:1353 | ok | reader/navigation cutover-patch-only -> docs/platform/architecture-map.md |
| maps-i-05101 | docs/specs/confinement-authority.md:1360 | rework | [class A] confinement-authority.md:1360 cites "RUL65b của docs/specs/runner.md"; runner README is a portal and RUL65b lives in runner/subcomponents/h-6979005beaf7/spec.md (and runner/decisions). Patch to README leaves a rule id that README does not contain. |
| maps-i-05102 | docs/specs/confinement-authority.md:1369 | rework | [class A] confinement-authority.md:1369 "docs/specs/runner.md, RUL75 (...)": RUL75 is in runner/subcomponents/h-6979005beaf7/spec.md, not the README. |
| maps-i-05117 | docs/specs/distribution.md:67 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05121 | docs/specs/distribution.md:315 | rework | [class A] distribution.md:315 "provider-capacity rules in docs/specs/runner.md (RUL74 ...)": RUL74/RUL75 live in runner/subcomponents/h-6979005beaf7/spec.md; README mapping loses the rule locator. |
| maps-i-05125 | docs/specs/fgos-plugin.md:149 | ok | reader/retained-reference preserve ; retained in place, preserved correctly |
| maps-i-05160 | docs/specs/reading-map.md:14 | ok | reader/navigation cutover-patch-only -> docs/platform/vision.md |
| maps-i-05161 | docs/specs/reading-map.md:15 | rework | [class B] reading-map.md:15 "Khi muc nay mau thuan voi docs/specs/distribution.md, doc portal ... truoc": authority-conflict rule about the legacy file; patching the path yields "if this conflicts with the portal, read the portal first". Migration-state sentence, Step 3 semantic rewrite, no path substitution (L12-25 class 1, L12-24 fix 2). |
| maps-i-05162 | docs/specs/reading-map.md:15 | rework | [class B] Same line 15: "docs/specs/distribution.md hien la legacy/generated-curated source trong luc migration" is a migration-state statement about the legacy path; substituting the portal path makes it false. Park for Step 3 / authority flip row. |
| maps-i-05163 | docs/specs/reading-map.md:16 | ok | reader/navigation cutover-patch-only -> docs/platform/packaging-distribution/history/distribution-vision.md |
| maps-i-05164 | docs/specs/reading-map.md:17 | ok | reader/legacy-tree-semantic preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05165 | docs/specs/reading-map.md:18 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/contracts/routing-handoff.md |
| maps-i-05166 | docs/specs/reading-map.md:19 | ok | reader/navigation cutover-patch-only -> docs/platform/work-state/contracts/cli-io-contract.md |
| maps-i-05167 | docs/specs/reading-map.md:20 | ok | reader/navigation cutover-patch-only -> docs/platform/coexistence/spec.md |
| maps-i-05168 | docs/specs/reading-map.md:21 | ok | reader/navigation cutover-patch-only -> docs/platform/packaging-distribution/README.md |
| maps-i-05176 | docs/specs/reading-map.md:27 | ok | reader/navigation cutover-patch-only -> docs/platform/documentation/history/id-systems-audit.md |
| maps-i-05177 | docs/specs/reading-map.md:27 | ok | reader/navigation cutover-patch-only -> docs/platform/architecture-map.md |
| maps-i-05178 | docs/specs/reading-map.md:28 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05179 | docs/specs/reading-map.md:28 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05180 | docs/specs/reading-map.md:28 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05181 | docs/specs/reading-map.md:28 | ok | reader/navigation cutover-patch-only -> docs/platform/work-state/README.md |
| maps-i-05182 | docs/specs/reading-map.md:29 | rework | [class A] reading-map.md:29 "docs/specs/work-state.md §envelope": envelope section is in work-state/contracts/cli-io-contract.md (section 3); README has no such section. Map to the exact file/anchor or park for Step 3. |
| maps-i-05183 | docs/specs/reading-map.md:30 | rework | [class A] reading-map.md:30 "docs/specs/work-state.md §sổ verb": README has no verb-registry section; the section lives in work-state/spec.md. Locator dropped by README mapping. |
| maps-i-05184 | docs/specs/reading-map.md:34 | rework | [class A] reading-map.md:34 "docs/specs/work-state.md §RUL60": RUL60 is in work-state/spec.md and runner subcomponent specs, not in work-state/README.md. |
| maps-i-05185 | docs/specs/reading-map.md:34 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05186 | docs/specs/reading-map.md:35 | ok | reader/navigation cutover-patch-only -> docs/platform/claude-plugin/spec.md |
| maps-i-05187 | docs/specs/reading-map.md:36 | ok | reader/navigation cutover-patch-only -> docs/platform/herdr-web-dashboard/spec.md |
| maps-i-05188 | docs/specs/reading-map.md:37 | ok | reader/legacy-tree-semantic preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05189 | docs/specs/reading-map.md:37 | ok | reader/navigation preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05190 | docs/specs/reading-map.md:37 | ok | reader/navigation preserve-pending-target ; parked (no target/semantic or unresolved locator) correct |
| maps-i-05191 | docs/specs/reading-map.md:38 | rework | [class A] reading-map.md:38 "docs/specs/runner.md §RUL53": RUL53 is in runner/spec.md and subcomponents, README lacks it. Locator dropped. |
| maps-i-05192 | docs/specs/reading-map.md:38 | rework | [class A] reading-map.md:38 "docs/specs/runner.md §RUL93": runner README only mentions RUL93 in migration notes; the rule text is in runner/spec.md and subcomponents/h-6979005beaf7. Locator dropped. |
| maps-i-05193 | docs/specs/reading-map.md:38 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05194 | docs/specs/reading-map.md:39 | ok | reader/navigation cutover-patch-only -> docs/platform/agent-confinement/README.md |
| maps-i-05195 | docs/specs/reading-map.md:39 | ok | reader/navigation cutover-patch-only -> docs/platform/agent-confinement/README.md |
| maps-i-05196 | docs/specs/reading-map.md:40 | ok | reader/navigation cutover-patch-only -> docs/platform/README.md |
| maps-i-05197 | docs/specs/reading-map.md:40 | ok | reader/navigation cutover-patch-only -> docs/platform/system-architecture/architecture/architecture-intent.md |
| maps-i-05198 | docs/specs/reading-map.md:40 | ok | reader/navigation cutover-patch-only -> docs/platform/domainization/architecture/domainization.md |
| maps-i-05199 | docs/specs/reading-map.md:41 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05200 | docs/specs/reading-map.md:42 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |
| maps-i-05201 | docs/specs/reading-map.md:43 | ok | reader/navigation cutover-patch-only -> docs/platform/agent-coordination/ |
| maps-i-05202 | docs/specs/reading-map.md:44 | ok | reader/navigation cutover-patch-only -> docs/platform/host-invocation-routing/ |
| maps-i-05203 | docs/specs/reading-map.md:44 | ok | reader/navigation cutover-patch-only -> docs/platform/packaging-distribution/README.md |
| maps-i-05204 | docs/specs/reading-map.md:45 | ok | reader/navigation cutover-patch-only -> docs/platform/runner/README.md |

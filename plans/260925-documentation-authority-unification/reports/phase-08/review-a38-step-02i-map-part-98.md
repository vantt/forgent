# Review A38 step-02i mapping part 98

- Reviewer: reviewer:sonnet-session:ae7af80c3bd076d9a@2026-10-19
- Review worktree: /home/vantt/projects/forgentX-s8-review at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798 (author 904d0fb5c, accounting 74e3ecf1e)
- Part: 98, population seeded-semantic-edge-sample, 36 entries, source step-02i-census-maps-portals-prose.json
- Method: every row read with all fields and its committed consumer passage; targets, anchors, provenance and locators checked against the committed tree.

## Totals

ok 29 / rework 5 / needs-Lead-judgment 2 (of 36); rework rate 13.9% (above the 3% threshold).

## Defect classes

1. Deleted historical target without successor note (rework 05222, 05245, 05307), inconsistent with part 97 row 05012.
2. Locator lost behind a portal patch (rework 05251 §9.2, 05287 §13.1 plus label not following the destination and the only §13.1 host being carriage).
3. needs-Lead-judgment: 05432 (behavioral YAML consumed by the gateway, prose patch needs lockstep), 05398 (legacy-tree statement kept as template placeholder).

## Entries

| Entry | Consumer:line | Role/rule -> action | Verdict | Rationale |
|---|---|---|---|---|
| maps-i-05222 | docs/specs/runner.md:422 | reader/retained-history -> preserve | rework | Deleted historical target (not in tree at 74e3ecf1e) preserved without the non-executable successor note that the same-class row maps-i-05012 carries. |
| maps-i-05226 | docs/specs/runner.md:1001 | reader/retained-history -> preserve | ok | Template-style placeholder docs/history/<id>/...; preserved. |
| maps-i-05228 | docs/specs/runner.md:1006 | reader/navigation -> cutover-patch-only | ok | Patch docs/operator-runbook-herdr-cockpit.md => docs/platform/herdr-web-dashboard/operations/operator-runbook.md: target exists, provenance/exact file confirmed, no locator lost, relative/repo form and label handled correctly. |
| maps-i-05231 | docs/specs/runner.md:1028 | reader/retained-history -> preserve | ok | Existing docs/history path (retained); preserved. |
| maps-i-05240 | docs/specs/runner.md:1272 | reader/retained-reference -> preserve | ok | docs/architecture-manifest.json exists and is retained; preserved. |
| maps-i-05241 | docs/specs/runner.md:1281 | reader/retained-history -> preserve | ok | Placeholder docs/history/<feature>/; preserved. |
| maps-i-05245 | docs/specs/runner.md:1288 | reader/retained-history -> preserve | rework | Deleted historical target (not in tree at 74e3ecf1e) preserved without the non-executable successor note that the same-class row maps-i-05012 carries. |
| maps-i-05246 | docs/specs/runner.md:1319 | reader/navigation -> cutover-patch-only | ok | Link destination relative form kept (../architect -> ../platform), label is plain text; target exists (restored file, same name). |
| maps-i-05251 | docs/specs/runner.md:1523 | reader/navigation -> cutover-patch-only | rework | Cited text carries a section/rule/decision locator (§9.2) but the patch targets the area portal README, which does not hold it; map to the file that holds it (docs/platform/agent-confinement/spec.md, "### 9.2 hostRead: blind" at line 454). |
| maps-i-05256 | docs/specs/runner.md:1648 | reader/retained-history -> preserve | ok | Existing docs/history path (retained); preserved. |
| maps-i-05262 | docs/specs/runner.md:2360 | reader/retained-history -> preserve | ok | Existing docs/history path (retained); preserved. |
| maps-i-05265 | docs/specs/runner.md:2432 | reader/retained-history -> preserve | ok | Existing docs/history path (retained); preserved. |
| maps-i-05270 | docs/specs/runner.md:2719 | reader/retained-history -> preserve | ok | Existing docs/history path (retained); preserved. |
| maps-i-05282 | docs/specs/runner.md:2953 | reader/retained-history -> preserve | ok | Glob over retained docs/history; preserved. |
| maps-i-05286 | docs/specs/runner.md:3015 | reader/navigation -> cutover-patch-only | ok | Patch docs/routing-handoff-contract.md => docs/platform/runner/contracts/routing-handoff.md: target exists, provenance/exact file confirmed, no locator lost, relative/repo form and label handled correctly. |
| maps-i-05287 | docs/specs/runner.md:3172 | reader/navigation -> cutover-patch-only | rework | Link `[confinement-authority.md §13.1](./confinement-authority.md)`: patch keeps the filename label while the destination becomes README.md (label must follow destination), and §13.1 does not resolve in the README; it lives only in docs/platform/agent-confinement/history/rollout-and-settled-facts.md (carriage, which a patch must not point into). Park for Step 3 or successor note. |
| maps-i-05298 | docs/specs/system-overview.md:165 | reader/retained-reference -> preserve | ok | Retained path (docs/backlog.md hand-maintained retained file); preserved incl. repo/ prefix or line locator. |
| maps-i-05307 | docs/specs/work-state.md:1324 | reader/retained-history -> preserve | rework | Deleted historical target (not in tree at 74e3ecf1e) preserved without the non-executable successor note that the same-class row maps-i-05012 carries. |
| maps-i-05326 | docs/templates/architecture.md:57 | reader/template -> preserve | ok | Template placeholder link in shipped docs/templates; preserved. |
| maps-i-05341 | docs/transitional-switchboard.md:51 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05346 | docs/transitional-switchboard.md:52 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05348 | docs/transitional-switchboard.md:53 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05358 | docs/transitional-switchboard.md:55 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05364 | docs/transitional-switchboard.md:58 | reader/migration-state -> phase9-row-flip | ok | Switchboard row cell; row flip. |
| maps-i-05371 | docs/transitional-switchboard.md:61 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05373 | docs/transitional-switchboard.md:62 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05375 | docs/transitional-switchboard.md:63 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05384 | docs/transitional-switchboard.md:75 | reader/migration-state -> phase9-row-flip | ok | Switchboard/README status cell; Phase 9 row flip is the correct action. |
| maps-i-05386 | docs/transitional-switchboard.md:77 | reader/migration-state -> phase9-row-flip | ok | Row flip is right; note the row describes backlog as generated, which contradicts the hand-maintained ruling, so the flip must also correct that cell. |
| maps-i-05398 | docs/transitional-switchboard.md:99 | reader/template-placeholder -> preserve | needs-Lead-judgment | Switchboard how-to sentence "typically docs/specs/<area>.md or root doc" describes how the legacy tree is organised; ruling says such statements are parked for Step 3, but the row is preserved as a template placeholder. Lead to confirm class. |
| maps-i-05404 | docs/ui-spec/00-overview.md:45 | reader/ui-spec-self-reference -> preserve | ok | docs/ui-spec/** is retained; self-targets, preserved. |
| maps-i-05405 | docs/ui-spec/00-overview.md:77 | reader/ui-spec-self-reference -> preserve | ok | docs/ui-spec/** is retained; self-targets, preserved. |
| maps-i-05422 | docs/ui-spec/generated/wireframe-v2.html:1347 | generator/generated -> preserve-pending-behavioral-proof | ok | Generated HTML payload quoting the spec; behavioral/generator row, no hand patch. |
| maps-i-05428 | docs/ui-spec/screens/S02-taskboard.md:21 | reader/navigation -> cutover-patch-only | ok | Patch to herdr-web-dashboard/spec.md; "### View the taskboard" (line 116) resolves in the target. |
| maps-i-05432 | docs/ui-spec/screens/S03-task-detail.md:99 | reader/navigation -> cutover-patch-only | needs-Lead-judgment | Prose citation of docs/contracts/fgos-gateway-api-v1.yaml patched to the platform copy, but apps/fgos-gateway/src/mcp.rs:127 reads docs/contracts/fgos-gateway-api-v1.yaml at runtime (byte-identical copy exists). The prose patch is only true if the code moves in lockstep (Step 5); Lead to decide whether this class stays cutover-patch or pairs with a behavioral row. |
| maps-i-05435 | docs/user/README.md:16 | reader/navigation -> cutover-patch-only | ok | Patch docs/doc-governance.md => docs/platform/governance.md: target exists, provenance/exact file confirmed, no locator lost, relative/repo form and label handled correctly. |

# A38 review, step-02i mapping part 112

- Reviewer: reviewer:sonnet-session:ad0e2109b1cd5b7b6@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree HEAD verified 74e3ecf1eb9a)
- Part: 112 (mandatory-rereview-action-changed-from-02g, 60 entries, sourceTable step-02i-census-maps-portals-prose.json)
- Totals: ok 48, rework 9, needs-Lead-judgment 3

Method: every row compared with its step-02g row (join on source path/line/column/expression), consumer passage re-read at HEAD, target existence and locators checked in the committed tree.

## Defect classes

- A: locator/target mismatch: bold-heading or RUL locator on docs/specs/runner.md patched to portal docs/platform/runner/README.md, which does not hold the text (CoordinationSession heading is in docs/platform/runner/decisions/h-aabefc85f0c9.md; RUL40 only in docs/platform/runner/subcomponents/h-6979005beaf7/spec.md)
- B: Related list in a wrapper/metadata header (outside any Literal Snapshot) is live navigation and must be patched; 02i preserved it as provenance
- D: migration-state sentence under a Migration Notes heading classified as parked legacy-tree mention; ruling says Phase 9 row flip
- E: patch points into carriage ('Retained selected source material') for a source-locator cell; preserve or park
- F: historical citation or past-action text in History doc patched to portal while its heading locator lives only in carriage (spec.md Retained Distribution Source Detail); preserve
- G: retired legacy source whose only successor is the file itself; preserve leaves a dangling link at cutover

## Rows

| entry | verdict | rationale |
|---|---|---|
| maps-i-03996 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03997 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03998 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03999 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04000 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04001 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04002 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04003 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04004 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04005 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04006 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04007 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04008 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04009 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04010 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04011 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04012 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04013 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04014 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04015 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04016 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04017 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04018 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04019 | ok | Switchboard UI row state cell; flipped as a row with its legacy twin (docs/transitional-switchboard.md rows treated identically). docs/ui-spec itself does not move, so the flip concerns the row state only. |
| maps-i-04020 | ok | Glob in the same UI row; row flip like 04019, no path rewrite implied. |
| maps-i-04021 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04022 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04023 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04024 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04025 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04026 | ok | Row flip is right; note the cell says "generated ... Do not edit manually" but docs/backlog.md is hand-maintained, so the Phase 9 flip must correct the claim, not just the status. |
| maps-i-04027 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04028 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04029 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04030 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04031 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04032 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04033 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04034 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04035 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04036 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04037 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-04082 | rework | Runbook sentence cites "see docs/specs/runner.md RUL40"; RUL40 is not in runner/README.md (0 hits) nor runner/spec.md; it is only in runner/subcomponents/h-6979005beaf7/spec.md. Patch to the exact file holding RUL40 or preserve as dated decision chronology. [A] |
| maps-i-04087 | ok | path:line-range citation (82-599, 212-222) of a YAML file has no unique heading anchor; parked for Step 3, never a bare path that drops the locator. |
| maps-i-04088 | ok | path:line-range citation (82-599, 212-222) of a YAML file has no unique heading anchor; parked for Step 3, never a bare path that drops the locator. |
| maps-i-04107 | rework | Under "## 8. Migration Notes": old documents "remain legacy/current sources until redirected or drained" is a migration-state sentence; Phase 9 row flip, not a parked tree statement. [D] |
| maps-i-04115 | needs-Lead-judgment | Line 52 is the "source protocol"/"source transition" row of ## 4 Related Files (live navigation) pointing at the retiring legacy doc, whose only remaining successor is this file itself. Preserve (no self-link patch) leaves a link that dangles at cutover and is not a historical citation; options: park with Step 3 note (retired single document existing only as carriage) or patch. Recommend park. [G] |
| maps-i-04135 | needs-Lead-judgment | Line 52 is the "source protocol"/"source transition" row of ## 4 Related Files (live navigation) pointing at the retiring legacy doc, whose only remaining successor is this file itself. Preserve (no self-link patch) leaves a link that dangles at cutover and is not a historical citation; options: park with Step 3 note (retired single document existing only as carriage) or patch. Recommend park. [G] |
| maps-i-04164 | rework | Evidence cell "source plan §18" patched to ../roadmap.md#18-definition-of-done; that anchor (line 940) sits under roadmap.md "## Retained selected source material" (carriage). Patch must not point into carriage; the cell is a source locator (provenance). Preserve or park. [E] |
| maps-i-04308 | needs-Lead-judgment | Disposition table "keep legacy: Old docs remain under ../architect/host-invocation-routing/ ... while the transition remains active" describes migration state (row flip) or the legacy tree layout (parked); both deferrals, ruling overlap. Same class as 04107. [D] |
| maps-i-04332 | ok | Normative sentence about creating files under docs/specs or docs/architect being rejected by the ratchet: statement about the legacy tree/checker scope; parked, no substitution. |
| maps-i-04353 | rework | Under "## 9. Migration Notes": "docs/distribution-vision.md is promoted into vision.md; the old path remains historical source material until redirected" is a migration-state sentence; Phase 9 row flip. Siblings 04352/04354 (outside this part) look misclassified the same way. [D] |
| maps-i-04394 | rework | Related list in the History file metadata header (lines 13-17); live navigation, patch (02g patched to packaging-distribution/README.md and history/distribution-vision.md, both exist). [B] |
| maps-i-04395 | rework | Related list in the History file metadata header (lines 13-17); live navigation, patch (02g patched to packaging-distribution/README.md and history/distribution-vision.md, both exist). [B] |
| maps-i-04398 | ok | "Old source" column of the Supersession Guidance table is a source locator (provenance); preserve. |
| maps-i-04399 | ok | "Old source" column of the Supersession Guidance table is a source locator (provenance); preserve. |
| maps-i-04400 | ok | "Old source" column of the Supersession Guidance table is a source locator (provenance); preserve. |
| maps-i-04423 | rework | Past-decision citation ("accepted as-is in docs/specs/distribution.md Edge Cases Settled") in a History vision doc; heading Edge Cases Settled exists only in spec.md Retained Distribution Source Detail (carriage) so the README patch cannot resolve it. Preserve. [F] |
| maps-i-04424 | rework | "tsk-1qm (done) - dong spec docs/specs/distribution.md (supersede RUL11...)" recounts a completed past action; historical preserve, not a patch. [F] |
| maps-i-04425 | rework | "xem docs/specs/distribution.md Data Dictionary #4b/#7": locator heading is only in spec.md carriage section; patch to README does not resolve it and carriage may not be targeted; preserve or park. [F] |

# A38 review, step-02i mapping part 111

- Reviewer: reviewer:sonnet-session:ad0e2109b1cd5b7b6@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree HEAD verified 74e3ecf1eb9a)
- Part: 111 (mandatory-rereview-action-changed-from-02g, 60 entries, sourceTable step-02i-census-maps-portals-prose.json)
- Totals: ok 42, rework 18, needs-Lead-judgment 0

Method: every row compared with its step-02g row (join on source path/line/column/expression), consumer passage re-read at HEAD, target existence and locators checked in the committed tree.

## Defect classes

- A: locator/target mismatch: bold-heading or RUL locator on docs/specs/runner.md patched to portal docs/platform/runner/README.md, which does not hold the text (CoordinationSession heading is in docs/platform/runner/decisions/h-aabefc85f0c9.md; RUL40 only in docs/platform/runner/subcomponents/h-6979005beaf7/spec.md)
- B: Related list in a wrapper/metadata header (outside any Literal Snapshot) is live navigation and must be patched; 02i preserved it as provenance
- C: evidence/source-locator and past-decision text in a History audit; patch rewrites history and (03877/03878) drops the repo/ prefix; revert to preserve

## Rows

| entry | verdict | rationale |
|---|---|---|
| maps-i-03608 | rework | Wrapper framing sentence recounts the retirement and points at the bold heading CoordinationSession (Lich su ...). New patch to runner/README.md: the heading is not in the portal; it is the exact heading of docs/platform/runner/decisions/h-aabefc85f0c9.md (decision record, not History). Patch there, or revert to historical preserve (completed past action). [A] |
| maps-i-03612 | rework | Line 17 is a Related list item in the History wrapper header (above Literal Snapshot, line 25); live navigation, patch to runner/README.md as 02g did (line 19 Superseded-by is correctly preserve). [B] |
| maps-i-03614 | rework | Wrapper framing sentence recounts the retirement and points at the bold heading CoordinationSession (Lich su ...). New patch to runner/README.md: the heading is not in the portal; it is the exact heading of docs/platform/runner/decisions/h-aabefc85f0c9.md (decision record, not History). Patch there, or revert to historical preserve (completed past action). [A] |
| maps-i-03618 | rework | Line 17 is a Related list item in the History wrapper header (above Literal Snapshot, line 25); live navigation, patch to runner/README.md as 02g did (line 19 Superseded-by is correctly preserve). [B] |
| maps-i-03620 | rework | Wrapper framing sentence recounts the retirement and points at the bold heading CoordinationSession (Lich su ...). New patch to runner/README.md: the heading is not in the portal; it is the exact heading of docs/platform/runner/decisions/h-aabefc85f0c9.md (decision record, not History). Patch there, or revert to historical preserve (completed past action). [A] |
| maps-i-03683 | ok | "This target directory preserves ... from <legacy dir>" is lineage (Preserved-from) provenance; preserve correct. |
| maps-i-03685 | rework | Live playbook sentence: engine retired in <sha>; see docs/specs/runner.md historical CoordinationSession section. Section lives in decisions/h-aabefc85f0c9.md (README links it); target README.md does not hold it. Use the exact decision file or preserve as past-action text. [A] |
| maps-i-03687 | rework | Live playbook sentence: engine retired in <sha>; see docs/specs/runner.md historical CoordinationSession section. Section lives in decisions/h-aabefc85f0c9.md (README links it); target README.md does not hold it. Use the exact decision file or preserve as past-action text. [A] |
| maps-i-03689 | rework | Live playbook sentence: engine retired in <sha>; see docs/specs/runner.md historical CoordinationSession section. Section lives in decisions/h-aabefc85f0c9.md (README links it); target README.md does not hold it. Use the exact decision file or preserve as past-action text. [A] |
| maps-i-03691 | ok | "not the frozen docs/architect/ tree" is a statement about the legacy tree; parked with Step 3, no path substitution. |
| maps-i-03697 | rework | Live playbook sentence: engine retired in <sha>; see docs/specs/runner.md historical CoordinationSession section. Section lives in decisions/h-aabefc85f0c9.md (README links it); target README.md does not hold it. Use the exact decision file or preserve as past-action text. [A] |
| maps-i-03703 | ok | "This target directory preserves ... from <legacy dir>" is lineage (Preserved-from) provenance; preserve correct. |
| maps-i-03769 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03770 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03772 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03773 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03774 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03776 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03779 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03780 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03781 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03784 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03785 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03787 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03789 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03792 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03793 | ok | Inside docs/platform/architecture-map.md "Added in candidate: architecture-map source carriage" (line 80+); explicit carriage heading, preserve. |
| maps-i-03826 | ok | Inside component-boundary.md "Added in candidate: component-boundary-advisory source carriage" (line 116+); explicit carriage heading, preserve. |
| maps-i-03827 | ok | Inside component-boundary.md "Added in candidate: component-boundary-advisory source carriage" (line 116+); explicit carriage heading, preserve. |
| maps-i-03828 | ok | Inside component-boundary.md "Added in candidate: component-boundary-advisory source carriage" (line 116+); explicit carriage heading, preserve. |
| maps-i-03829 | ok | Inside component-boundary.md "Added in candidate: component-boundary-advisory source carriage" (line 116+); explicit carriage heading, preserve. |
| maps-i-03830 | ok | Inside component-boundary.md "Added in candidate: component-boundary-advisory source carriage" (line 116+); explicit carriage heading, preserve. |
| maps-i-03877 | rework | Cell in the Bang chung (evidence file:line) column of a History audit, "repo/docs/..." locator; provenance. Patch also drops the repo/ prefix. Revert to preserve. [C] |
| maps-i-03878 | rework | Cell in the Bang chung (evidence file:line) column of a History audit, "repo/docs/..." locator; provenance. Patch also drops the repo/ prefix. Revert to preserve. [C] |
| maps-i-03880 | rework | 03880: struck-through closed question with its recorded answer (decision record, past). 03882-84: Nguon / Bang chung doc truc tiep source list of the audit; provenance. Revert to preserve. [C] |
| maps-i-03882 | rework | 03880: struck-through closed question with its recorded answer (decision record, past). 03882-84: Nguon / Bang chung doc truc tiep source list of the audit; provenance. Revert to preserve. [C] |
| maps-i-03883 | rework | 03880: struck-through closed question with its recorded answer (decision record, past). 03882-84: Nguon / Bang chung doc truc tiep source list of the audit; provenance. Revert to preserve. [C] |
| maps-i-03884 | rework | 03880: struck-through closed question with its recorded answer (decision record, past). 03882-84: Nguon / Bang chung doc truc tiep source list of the audit; provenance. Revert to preserve. [C] |
| maps-i-03961 | rework | Line 18 Related list item in the template wrapper header; no Literal Snapshot, Related list is live navigation; patch docs/doc-governance.md -> docs/platform/governance.md (exists). [B] |
| maps-i-03963 | rework | Line 18 Related list item in the template wrapper header; no Literal Snapshot, Related list is live navigation; patch docs/doc-governance.md -> docs/platform/governance.md (exists). [B] |
| maps-i-03964 | rework | Line 18 Related list item in the template wrapper header; no Literal Snapshot, Related list is live navigation; patch docs/doc-governance.md -> docs/platform/governance.md (exists). [B] |
| maps-i-03977 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03978 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03979 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03980 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03981 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03982 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03983 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03984 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03985 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03986 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03987 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03988 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03989 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03990 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03991 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03992 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03993 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03994 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |
| maps-i-03995 | ok | Switchboard route/status table cell (migration state); Phase 9 row flip, matches the ruling for docs/platform/documentation/switchboard.md rows 49-68 and 74-87. |

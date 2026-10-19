# review-a38-step-02h-map-part-23

- Reviewer: reviewer:sonnet-session:a8fcd7390886bc46a@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, detached at b3d2c2ebd4be66848520e3f3f797c6219a610dee (read-only; verified)
- Packet commits: author 6c415d7ce, accounting b3d2c2ebd; census input commit f5033e20ad6d6be137217f0a8c17c35b3dd7e8f1
- Part: 23 (distinct-mappings), 2 entries
- Rules applied: A50, L12-7, L12-10, L12-19..L12-24
- Method: all entries resolved via the index source table; old passage read through git at the input commit; target passages and existence read at the same commit; every edge's physical span re-checked against committed bytes (1-based columns): 0 mismatches.

## Entry verdicts

| Entry | Legacy reference to owner/anchor | Verdict | Rationale |
|---|---|---|---|
| mapping-h-1321 | docs/ui-spec/spec.config.yaml to docs/ui-spec/spec.config.yaml (self) | ok | 2 edges, both in docs/platform/ui-spec/architecture/spec.config.yaml.md. maps-h-04921 is the `Provenance: ... at 111adc5...` header (pinned citation, preserved). maps-h-04922 is the Related-list entry; docs/ui-spec/** is not retiring so it self-targets and is preserved (L12-24 item 5). Target exists in the committed tree. |
| mapping-h-1322 | docs/work-item-lifecycle-vision.md to docs/platform/vision.md (no anchor) | needs-Lead-judgment | Owner is correct: vision.md is the promoted anchor and its header says so. 19 of 20 edges are ok. One edge (maps-h-04035) is not covered by the rules, see below. |

## mapping-h-1322 edge breakdown (20 edges, all read against source and target)

| Edge | Consumer:line | Action | Verdict | Note |
|---|---|---|---|---|
| maps-h-00726 | docs/architect/component-boundary/README.md:207 | cutover-patch-only (navigation) | ok | Live link in "Canonical Architecture And Specs" list. New `../../platform/vision.md` resolves from docs/architect/component-boundary/ to docs/platform/vision.md. Complete link unit replaced. |
| maps-h-00747 | docs/architect/component-boundary/component-boundary-advisory.md:140 | cutover-patch-only (navigation) | ok | Link inside register table row; complete unit replaced; relative path resolves correctly. |
| maps-h-00758 | docs/architect/component-boundary/component-boundary-advisory.md:144 | cutover-patch-only (navigation) | ok | Same as 00747. |
| maps-h-00871 | docs/architect/domainization/README.md:8 | cutover-patch-only (navigation) | ok | Related: line in header; complete link unit replaced; relative path resolves correctly. |
| maps-h-02292 | docs/platform/README.md:32 | phase9-row-flip (migration-state) | ok | Cell of the "Current source during migration" column: row flip, not path substitution (L12-21/23). |
| maps-h-03979 | docs/platform/documentation/switchboard.md:50 | preserve (provenance) | ok | Candidate switchboard copy, row 50 (retained-source cell of the vision row): preserved; the sibling edge in docs/transitional-switchboard.md is the row flip. |
| maps-h-03981 | docs/platform/documentation/switchboard.md:50 | preserve (provenance) | ok | Same row 50, second occurrence. |
| maps-h-03989 | docs/platform/documentation/switchboard.md:53 | preserve (provenance) | ok | Row 53 retained-subordinate-source cell of the work-state row: preserved, consistent with 03979. |
| maps-h-04035 | docs/platform/documentation/switchboard.md:87 | cutover-patch-only (navigation) | needs-Lead-judgment | Candidate switchboard.md row 87 `| docs/work-item-lifecycle-vision.md | non-authority | retained-source | ...active navigation starts at docs/platform/vision.md |`. Packet patches the first cell by path substitution. The same row in docs/transitional-switchboard.md (maps-h-05395) is a phase9-row-flip, and rows 50/53 of this same candidate file (03979/03981/03989) are preserved. After substitution the row would read "docs/platform/vision.md | non-authority | retained-source | ... starts at docs/platform/vision.md", which contradicts itself. L12-21/23 say switchboard status cells take row semantics, never path substitution, but the rules name only docs/transitional-switchboard.md and docs/platform/README.md, so whether the candidate switchboard-doc copy is a status surface or carriage is a Lead call. Options: (a) row flip like 05395, (b) preserve like rows 50/53, (c) keep patch. Recommend (a) or (b); the same question applies to the other root-route rows 81-86 of that file, which sit in other parts. |
| maps-h-04947 | docs/platform/vision.md:16 | preserve (self-reference-preserved) | ok | In the fenced header Related list of vision.md itself; the target is the consumer file, so no patch (L12-21). Preserved. |
| maps-h-04949 | docs/platform/vision.md:19 | preserve (self-reference-preserved) | ok | `Provenance: ... at f0efa33...` pinned citation: preserved. |
| maps-h-04953 | docs/platform/work-state/README.md:18 | cutover-patch-only (navigation) | ok | Header Related list of work-state/README.md; sibling io-contract edge (04952) is patched the same way, so consistent. Non-blocking: line 19 of that list is already docs/platform/vision.md, so after the patch the list names vision.md twice; Step 3 may drop the duplicate. |
| maps-h-04961 | docs/platform/work-state/README.md:62 | preserve (provenance) | ok | "A third retained source, [..], is not covered by this candidate area": retained-source statement, prior census edgeKind provenance (maps-04992/3), preserved. |
| maps-h-04964 | docs/platform/work-state/README.md:75 | preserve (provenance) | ok | Table row "retained source for the platform vision candidate": preserved, consistent with 04961. |
| maps-h-05026 | docs/reading-map.md:134 | cutover-patch-only (navigation) | ok | docs/reading-map.md plain list entry (not a Read: instruction); exact file vision.md; complete reference replaced. |
| maps-h-05158 | docs/specs/reading-map.md:14 | cutover-patch-only (navigation) | ok | docs/specs/reading-map.md same entry; same disposition. |
| maps-h-05339 | docs/transitional-switchboard.md:51 | phase9-row-flip (migration-state) | ok | docs/transitional-switchboard.md row 51 authority cell: row flip. |
| maps-h-05341 | docs/transitional-switchboard.md:51 | phase9-row-flip (migration-state) | ok | Same row 51, second occurrence: row flip. |
| maps-h-05349 | docs/transitional-switchboard.md:54 | phase9-row-flip (migration-state) | ok | Row 54 retained-source cell: row flip. |
| maps-h-05395 | docs/transitional-switchboard.md:88 | phase9-row-flip (migration-state) | ok | Row 88 root-document row: row flip. |

## Totals

- Entries (mappings): 2. ok 1 (mapping-h-1321), rework 0, needs-Lead-judgment 1 (mapping-h-1322, via edge maps-h-04035).
- Edge sub-rows: 22 edges, ok 21, rework 0, needs-Lead-judgment 1 (maps-h-04035).
- Observation, not a verdict: docs/work-item-lifecycle-vision.md is mapped like the other retained-source roots (mapping-h-0893 io-contract, mapping-h-0895 platform-foundations): navigation consumers patched to the platform file. Consistent with the earlier-accepted class treatment.

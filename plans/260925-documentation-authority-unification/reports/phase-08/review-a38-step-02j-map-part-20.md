# Review step-02j mapping - logical part 20

Reviewer: reviewer:sonnet-session:a354ee9d26970124d@2026-10-19
Commits: worktree detached at 6235d0151 (accounting), author 9650bdee6
Part: 20, population seeded-semantic-edge-sample, 60 entries (rows from step-02j-census-maps-portals-prose.json entries, all fields and committed consumer context read)
Rule set: L12-26 classes 1-10, L12-7, L12-10, Lead rulings (doc-registry lookup data preserved, desiredOwner on preserved rows non-actionable, non-docs relative paths not edges)

## Totals

- ok: 55
- rework: 4 (6.7%): maps-j-07583, maps-j-07808, maps-j-07908, maps-j-07941
- needs-Lead-judgment: 1: maps-j-07570
- Sample breach (>3% rework): YES

## Entries

| # | edgeId | consumer | action | verdict | rationale |
| ---: | --- | --- | --- | --- | --- |
| 1 | maps-j-07570 | visibility-and-interactive-contact-herdr-spawn.md L137 | cutover-patch-only | needs-Lead-judgment | Locator RUL40 -> h-6979005beaf7/spec.md#business-rules is the Lead-validated target and anchor resolves, but the line sits in section 3.3 "Drift giua tai lieu va code", an evidence list quoting the old RUL40 wording that the same line says was re-scoped 2026-09-06 (audit evidence, class 5) - preserve vs patch. |
| 2 | maps-j-07577 | visibility-and-interactive-contact-herdr-spawn.md L540 | preserve | ok | preserve correct (L12-22 docs/history is retained historical topology) |
| 3 | maps-j-07580 | spec.md L21 | cutover-patch-only | ok | patch target/form verified |
| 4 | maps-j-07583 | spec.md L351 | cutover-patch-only | rework | class 7 not fully fixed: label `runner.md` (basename) becomes `../runner/README.md` (path form); must be `README.md`. Additionally the link sits in a dated decision-log bullet in section 16 "Lich su quyet dinh" (class 5 question: preserve?), Lead to confirm. |
| 5 | maps-j-07590 | h-69197b459754.md L75 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 6 | maps-j-07602 | h-7af1f0242611.md L27 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 7 | maps-j-07607 | h-b3eb60fb4d2b.md L18 | cutover-patch-only | ok | patch target/form verified |
| 8 | maps-j-07615 | h-36d872fbb0e5.md L1 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 9 | maps-j-07616 | h-36d872fbb0e5.md L10 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 10 | maps-j-07619 | h-36d872fbb0e5.md L25 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 11 | maps-j-07644 | h-36d872fbb0e5.md L982 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 12 | maps-j-07647 | h-36d872fbb0e5.md L1077 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 13 | maps-j-07648 | h-36d872fbb0e5.md L1080 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 14 | maps-j-07679 | h-36d872fbb0e5.md L1605 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 15 | maps-j-07692 | spec.md L17 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 16 | maps-j-07704 | spec.md L208 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 17 | maps-j-07708 | spec.md L18 | cutover-patch-only | ok | patch target/form verified |
| 18 | maps-j-07709 | spec.md L10 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 19 | maps-j-07737 | spec.md L18 | cutover-patch-only | ok | patch target/form verified |
| 20 | maps-j-07743 | spec.md L61 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 21 | maps-j-07757 | architecture-intent.md L44 | cutover-patch-only | ok | patch target/form verified |
| 22 | maps-j-07758 | architecture-intent.md L45 | cutover-patch-only | ok | patch target/form verified |
| 23 | maps-j-07761 | architecture-intent.md L790 | cutover-patch-only | ok | patch target/form verified |
| 24 | maps-j-07766 | roadmap.md L11 | phase9-row-flip | ok | migration-state row flip correct |
| 25 | maps-j-07772 | roadmap.md L277 | preserve-pending-target | ok | parked with explicit blocked status correct |
| 26 | maps-j-07775 | system-vision-trong-mem-ngoai-cung.md L16 | preserve | ok | preserve correct (Self-reference / same Related list lineage, not executable) |
| 27 | maps-j-07779 | workspace-topology-roadmap.md L9 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 28 | maps-j-07781 | workspace-topology-roadmap.md L16 | preserve | ok | preserve correct (Self-reference / same Related list lineage, not executable) |
| 29 | maps-j-07789 | architect-readme.md L46 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 30 | maps-j-07792 | architect-readme.md L62 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 31 | maps-j-07800 | architect-readme.md L83 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 32 | maps-j-07802 | architect-readme.md L85 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 33 | maps-j-07803 | spec.md L9 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 34 | maps-j-07808 | spec.md L80 | preserve-pending-target | rework | class 1 not fully fixed (locator attribution): quoted title "Cua pull giao-nhan viec" belongs to the adjacent `docs/specs/work-state.md` citation; docs/specs/runner.md in the same parenthesis is a whole-file ref with no locator -> area README cutover patch, not parked "locator lacks unique live passage". L80 is live (Cross-Area Flows). |
| 35 | maps-j-07832 | S01-sign-in.md L21 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 36 | maps-j-07833 | S01-sign-in.md L29 | preserve | ok | preserve correct (L12-26 retained committed path in every wrapper context) |
| 37 | maps-j-07854 | 20-domain-rules.md L24 | preserve | ok | preserve correct (L12-26 retained committed path in every wrapper context) |
| 38 | maps-j-07867 | spec.md L30 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 39 | maps-j-07876 | vision.md L19 | preserve | ok | preserve correct (L12-26 source/lineage cells preserve historical referent) |
| 40 | maps-j-07883 | README.md L34 | phase9-row-flip | ok | migration-state row flip correct |
| 41 | maps-j-07895 | implementation-pointers.md L52 | preserve-pending-behavioral-proof | ok | behavioral Step 5 correct |
| 42 | maps-j-07908 | cli-io-contract.md L436 | preserve-pending-target | rework | class 1/2 not fully fixed: decision-N citation `docs/decisions/0011-...` in live References (cli-io-contract section 12) is parked with successor null, but the 0011 record lives in docs/platform/work-state/decisions/retired-decision-history.md ("## 7. ADR 0011 Explicit Version For Every Contract"). Should map there with anchor (or note it). |
| 43 | maps-j-07923 | retired-decision-history.md L576 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 44 | maps-j-07928 | retired-decision-history.md L778 | preserve | ok | preserve correct (L12-26 completed past action / retained history witness) |
| 45 | maps-j-07935 | spec.md L15 | preserve | ok | preserve correct (Target already present in Related list; preserve lineage; Phase 9 broken-link baseline) |
| 46 | maps-j-07941 | spec.md L117 | preserve-pending-target | rework | L12-21 placeholder / class 3 not fixed: `docs/how-to/x.md` is an illustrative example path in a docPath description (vd `...`), not an edge; should preserve, not park as "No unique exact mapping" with a lookup-failure note. RUL53 locator is nearby text only. |
| 47 | maps-j-07944 | spec.md L1071 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 48 | maps-j-07964 | reading-map.md L131 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 49 | maps-j-07975 | reading-map.md L140 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 50 | maps-j-07981 | reading-map.md L144 | preserve-pending-target | ok | parked with explicit blocked status correct |
| 51 | maps-j-07989 | reading-map.md L148 | cutover-patch-only | ok | patch target/form verified |
| 52 | maps-j-07997 | reading-map.md L156 | cutover-patch-only | ok | patch target/form verified |
| 53 | maps-j-07999 | reading-map.md L157 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 54 | maps-j-08006 | reading-map.md L157 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 55 | maps-j-08007 | reading-map.md L157 | preserve-pending-target | ok | parked with explicit blocked status correct |
| 56 | maps-j-08015 | reading-map.md L160 | cutover-patch-only | ok | patch target/form verified |
| 57 | maps-j-08019 | reading-map.md L164 | cutover-patch-only | ok | patch target/form verified |
| 58 | maps-j-08034 | reading-map.md L180 | cutover-patch-only | ok | patch target/form verified |
| 59 | maps-j-08035 | reading-map.md L180 | preserve | ok | preserve correct (L12-26 committed retained file; no explicit approved Phase 6 retirement alias) |
| 60 | maps-j-08038 | reading-map.md L181 | preserve | ok | preserve correct (L12-22 docs/history is retained historical topology) |

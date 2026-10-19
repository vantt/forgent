# Review a38 step-02i mapping part 88

- Reviewer: reviewer:sonnet-session:aab0189f7e2b3d4db@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree HEAD 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798)
- Part: 88 (seeded-semantic-edge-sample), 60 entries, source table step-02i-census-maps-portals-prose.json
- Method: every entry read in its committed consumer context; patch targets resolved against the committed tree (all 44 patch targets exist except one false negative that resolves correctly as relative form); promoted targets inspected for section locators and exact-file counterparts.

## Totals

ok 52, rework 8, needs-Lead-judgment 0 (rework 13.3%)

Rework: maps-i-01256, maps-i-01261, maps-i-01262, maps-i-01269, maps-i-01341, maps-i-01510, maps-i-01542, maps-i-01636

Needs-Lead-judgment: none

## Defect classes (rework)

- D7 hand-maintained docs/backlog.md classed generated/parked on Step 5 generator: maps-i-01256, 01261, 01262, 01269
- D2 spec reference with locator mapped to README: maps-i-01510
- D4 past-tense recount patched: maps-i-01542, 01636
- D8 fgOS docs/specs mention misread as upstream citation: maps-i-01341

## Entries

| # | edge | consumer line | role/action | verdict | note |
|---|---|---|---|---|---|
| 1 | maps-i-01256 | docs/backlog.md L112 | generator/preserve-pending-behavioral-proof | rework | [D7]  Consumer docs/backlog.md is hand-maintained (Lead ruling) yet classed generated, parked on Step 5 generator. "chốt tại docs/id-systems-audit.md" needs patch/preserve decision as an ordinary row. |
| 2 | maps-i-01261 | docs/backlog.md L115 | generator/preserve-pending-behavioral-proof | rework | [D7]  Retained docs/backlog.md self-citation; right action is plain preserve, not preserve-pending-behavioral-proof on a nonexistent generator. |
| 3 | maps-i-01262 | docs/backlog.md L116 | generator/preserve-pending-behavioral-proof | rework | [D7]  Retained docs/history/** target; right action is plain preserve; "generated"/Step 5 class is wrong for hand-maintained backlog. |
| 4 | maps-i-01267 | docs/backlog.md L125 | generator/preserve-pending-target | ok |  Whole legacy-tree mention parked for Step 3 is the correct treatment; generated tag is only wording (note). |
| 5 | maps-i-01269 | docs/backlog.md L129 | generator/preserve-pending-behavioral-proof | rework | [D7]  Retained docs/history/** line-range citation; plain preserve, not Step 5 generator proof. |
| 6 | maps-i-01284 | docs/contracts/fgos-gateway-api-v1.yaml L456 | behavioral/preserve-pending-behavioral-proof | ok |  Parked on actual data reader (gateway contract text is served); candidate owner README is only a candidate, Step 5 sets text (note: spec.md would be the better candidate). |
| 7 | maps-i-01287 | docs/contracts/fgos-gateway-api-v1.yaml L710 | behavioral/preserve-pending-behavioral-proof | ok |  Same as 5. |
| 8 | maps-i-01303 | docs/decisions/index.md L29 | generator/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 9 | maps-i-01304 | docs/decisions/index.md L30 | generator/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 10 | maps-i-01305 | docs/decisions/index.md L31 | generator/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 11 | maps-i-01312 | docs/decisions/index.md L38 | generator/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 12 | maps-i-01319 | docs/decisions/index.md L50 | generator/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 13 | maps-i-01341 | docs/distillery/porting-log.md L132 | reader/preserve | rework | [D8]  "a new docs/specs/ note" names fgOS own docs/specs tree as a proposed destination, not an upstream citation. Should be legacy-tree-semantic parked, not preserve with an L12-10 reason. |
| 14 | maps-i-01346 | docs/distillery/reports/distill-bee-inventory-2026-07-18.md L145 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 15 | maps-i-01356 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md L45 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 16 | maps-i-01361 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md L76 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 17 | maps-i-01363 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md L106 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 18 | maps-i-01404 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md L228 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 19 | maps-i-01411 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md L272 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 20 | maps-i-01417 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md L288 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 21 | maps-i-01423 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md L358 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 22 | maps-i-01424 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md L108 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 23 | maps-i-01427 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md L193 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 24 | maps-i-01430 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md L205 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 25 | maps-i-01441 | docs/distillery/sources/beehive.md L227 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 26 | maps-i-01450 | docs/distillery/sources/beehive.md L446 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 27 | maps-i-01451 | docs/distillery/sources/beehive.md L453 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 28 | maps-i-01453 | docs/distillery/sources/beehive.md L617 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 29 | maps-i-01461 | docs/distillery/sources/beehive.md L697 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 30 | maps-i-01462 | docs/distillery/sources/beehive.md L703 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 31 | maps-i-01466 | docs/distillery/sources/beehive.md L815 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 32 | maps-i-01467 | docs/distillery/sources/beehive.md L815 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 33 | maps-i-01472 | docs/distillery/sources/beehive.md L937 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 34 | maps-i-01477 | docs/distillery/sources/beehive.md L1069 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 35 | maps-i-01478 | docs/distillery/sources/beehive.md L1081 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 36 | maps-i-01489 | docs/distillery/sources/beehive.md L1245 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 37 | maps-i-01497 | docs/distillery/sources/compound-engineering-plugin.md L66 | reader/preserve | ok |  Descriptive comparison in a distillery analysis; preserve acceptable (note: mention is forgent docs/specs). |
| 38 | maps-i-01503 | docs/distillery/sources/symphony.md L71 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 39 | maps-i-01504 | docs/distillery/sources/symphony.md L127 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 40 | maps-i-01507 | docs/distribution-vision.md L119 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 41 | maps-i-01510 | docs/distribution-vision.md L184 | reader/cutover-patch-only | rework | [D2]  "docs/specs/distribution.md Data Dictionary #4b/#7" carries a section locator; README portal does not hold it, promoted spec.md has a Data Dictionary. Patch should target spec.md. |
| 42 | maps-i-01514 | docs/doc-governance.md L95 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 43 | maps-i-01515 | docs/doc-governance.md L95 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 44 | maps-i-01516 | docs/doc-governance.md L470 | reader/cutover-patch-only | ok |  Relative form from docs/ resolves to existing docs-portal.md; path-text label follows destination. |
| 45 | maps-i-01527 | docs/explanation/agy-permission-denylist-not-allowlist.md L17 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 46 | maps-i-01534 | docs/explanation/citation-drift-backlog-scope-split-with-tsk-56w.md L15 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 47 | maps-i-01542 | docs/explanation/citation-drift-runner-md-cleanup.md L10 | reader/cutover-patch-only | rework | [D4]  Recounts a completed past action ("tsk-2sp-1/5 applied to docs/specs/work-state.md") = historical preserve; patch also targets README, not spec.md. |
| 48 | maps-i-01544 | docs/explanation/codex-bypass-executor.md L67 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 49 | maps-i-01548 | docs/explanation/compound-learn-artifact-registry.md L201 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 50 | maps-i-01573 | docs/explanation/dispatch-config-cache-scope-narrowed.md L16 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 51 | maps-i-01584 | docs/explanation/dispatch-plan-protocol-redesign.md L7 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 52 | maps-i-01587 | docs/explanation/eventlog-tier-a-multifile-content-hash-redesign.md L127 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 53 | maps-i-01594 | docs/explanation/footprint-diff-research-md-noise.md L2 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 54 | maps-i-01620 | docs/explanation/main-checkout-reset-ancestor-commit-loss-guard.md L38 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 55 | maps-i-01624 | docs/explanation/return-approve-background-execution-guidance.md L11 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 56 | maps-i-01636 | docs/explanation/tsk-397-post-merge-review-remediation.md L53 | reader/cutover-patch-only | rework | [D4]  Past-tense recount of a fix to docs/specs/reading-map.md ("pointed at a section that no longer existed"); historical preserve, patch rewrites history. |
| 57 | maps-i-01643 | docs/explanation/worktree-manual-merge-fgos-blob-safety-net.md L80 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 58 | maps-i-01645 | docs/generated/README.md L27 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 59 | maps-i-01648 | docs/how-to/author-a-plan-loop-track.md L195 | writer/check/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 60 | maps-i-01649 | docs/how-to/author-a-plan-loop-track.md L249 | writer/check/preserve-pending-behavioral-proof | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |

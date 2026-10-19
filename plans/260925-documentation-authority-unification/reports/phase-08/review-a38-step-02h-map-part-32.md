# Review a38 step-02h map part 32

- Reviewer: reviewer:sonnet-session:a18f1e82b792ed408@2026-10-19
- Commits: worktree detached at b3d2c2ebd (verified); author 6c415d7ce, accounting b3d2c2ebd
- Part: 32 (preserve-pending-behavioral-proof), 60 entries; every entry deep-read (source line, block context, owner/target, siblings of the same reference)

## Totals

ok 58 / rework 2 / needs-Lead-judgment 0. Rework rate 2/60 = 3.3% (above 3%: the affected sets expand per A50).

## Rework by defect class
1. Planning narrative classified as live writer (maps-h-00392, maps-h-00395): "Files To Create" to-do lists in documentation-standardization-plan.md are settled by L12-24 as navigation, not writers. Both point at the already-new docs/platform path; they should be preserve/navigation, not Step 5 behavioral.

## Entries

| # | Entry | Consumer:line | Reference | Verdict | Note |
|---|---|---|---|---|---|
| 1 | maps-h-00392 | documentation-standardization-plan.md:732 | docs/platform/agent-coordination/verification/implementation | rework | planning-narrative-as-writer: line 732 is inside "### 9.6 Phase 2 Files To Create / Create:" migration to-do list (documentation-standardization-plan.md); L12-24 settles such lists as navigation, not runtime writers; target is already the new docs/platform path |
| 2 | maps-h-00395 | documentation-standardization-plan.md:825 | docs/platform/agent-coordination/verification/README.md | rework | planning-narrative-as-writer: line 825 inside "### 9.9 Phase 5 Files To Create Or Promote / Create:" to-do list; same L12-24 rule |
| 3 | maps-h-00457 | coordination-operating-harness.md:121 | docs/architect/agent-coordination/verification/<track>/ | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 4 | maps-h-00459 | coordination-operating-harness.md:413 | docs/architect/agent-coordination/verification/<track>/proof | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 5 | maps-h-00460 | coordination-operating-harness.md:465 | docs/architect/agent-coordination/verification/team-dispatch | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 6 | maps-h-00461 | coordination-operating-harness.md:466 | docs/architect/agent-coordination/verification/team-dispatch | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 7 | maps-h-00462 | coordination-operating-harness.md:467 | docs/architect/agent-coordination/verification/team-dispatch | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 8 | maps-h-00486 | architecture-advisory-coordinator.md:776 | docs/architect/agent-coordination/verification/architecture- | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 9 | maps-h-00492 | master-coordinator.md:158 | /docs/architect/agent-coordination/verification/<TRACK>/ | ok | writer by block context (layout/test/EVIDENCE_DIR) to Step 5, no patch |
| 10 | maps-h-01203 | architecture-manifest.json:3 | docs/architecture-map.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 11 | maps-h-01234 | backlog.md:24 | docs/specs/distribution.md | ok | generated file, retarget via generator, no hand patch |
| 12 | maps-h-01236 | backlog.md:39 | repo/docs/specs/work-state.md:647-675 | ok | generated file, retarget via generator, no hand patch |
| 13 | maps-h-01242 | backlog.md:54 | docs/platform-foundations.md | ok | generated file, retarget via generator, no hand patch |
| 14 | maps-h-01243 | backlog.md:102 | docs/backlog.md | ok | generated file, retarget via generator, no hand patch |
| 15 | maps-h-01244 | backlog.md:102 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 16 | maps-h-01245 | backlog.md:107 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 17 | maps-h-01246 | backlog.md:108 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 18 | maps-h-01247 | backlog.md:109 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 19 | maps-h-01248 | backlog.md:110 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 20 | maps-h-01249 | backlog.md:111 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 21 | maps-h-01250 | backlog.md:111 | docs/backlog.md | ok | generated file, retarget via generator, no hand patch |
| 22 | maps-h-01251 | backlog.md:111 | docs/specs/*.md | ok | generated file, retarget via generator, no hand patch |
| 23 | maps-h-01252 | backlog.md:111 | docs/architecture-map.md | ok | generated file, retarget via generator, no hand patch |
| 24 | maps-h-01254 | backlog.md:111 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 25 | maps-h-01255 | backlog.md:112 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 26 | maps-h-01256 | backlog.md:112 | docs/id-systems-audit.md | ok | generated file, retarget via generator, no hand patch |
| 27 | maps-h-01260 | backlog.md:115 | docs/backlog.md | ok | generated file, retarget via generator, no hand patch |
| 28 | maps-h-01275 | fgos-gateway-api-v1.yaml:44 | docs/io-contract.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 29 | maps-h-01276 | fgos-gateway-api-v1.yaml:53 | docs/io-contract.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 30 | maps-h-01277 | fgos-gateway-api-v1.yaml:54 | docs/specs/work-state.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 31 | maps-h-01278 | fgos-gateway-api-v1.yaml:55 | docs/specs/runner.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 32 | maps-h-01283 | fgos-gateway-api-v1.yaml:456 | docs/specs/work-state.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 33 | maps-h-01284 | fgos-gateway-api-v1.yaml:607 | docs/specs/runner.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 34 | maps-h-01285 | fgos-gateway-api-v1.yaml:681 | docs/io-contract.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 35 | maps-h-01286 | fgos-gateway-api-v1.yaml:710 | docs/specs/work-state.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 36 | maps-h-01288 | fgos-gateway-api-v1.yaml:739 | docs/specs/work-state.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 37 | maps-h-01289 | fgos-gateway-api-v1.yaml:863 | docs/io-contract.md | ok | contract data/prose in YAML or JSON, behavioral trace Step 5, no patch |
| 38 | maps-h-01290 | index.md:13 | docs/architecture-map.md | ok | generated file, retarget via generator, no hand patch |
| 39 | maps-h-01291 | index.md:13 | docs/architecture-map.md | ok | generated file, retarget via generator, no hand patch |
| 40 | maps-h-01292 | index.md:14 | docs/architecture-map.md | ok | generated file, retarget via generator, no hand patch |
| 41 | maps-h-01293 | index.md:15 | docs/architecture-map.md | ok | generated file, retarget via generator, no hand patch |
| 42 | maps-h-01294 | index.md:16 | docs/specs/platform-foundations.md | ok | generated file, retarget via generator, no hand patch |
| 43 | maps-h-01295 | index.md:17 | docs/specs/platform-foundations.md | ok | generated file, retarget via generator, no hand patch |
| 44 | maps-h-01296 | index.md:18 | docs/specs/platform-foundations.md | ok | generated file, retarget via generator, no hand patch |
| 45 | maps-h-01297 | index.md:19 | docs/specs/platform-foundations.md | ok | generated file, retarget via generator, no hand patch |
| 46 | maps-h-01298 | index.md:20 | docs/specs/platform-foundations.md | ok | generated file, retarget via generator, no hand patch |
| 47 | maps-h-01299 | index.md:26 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 48 | maps-h-01300 | index.md:27 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 49 | maps-h-01301 | index.md:28 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 50 | maps-h-01302 | index.md:29 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 51 | maps-h-01303 | index.md:30 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 52 | maps-h-01304 | index.md:31 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 53 | maps-h-01305 | index.md:32 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 54 | maps-h-01306 | index.md:33 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 55 | maps-h-01307 | index.md:34 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 56 | maps-h-01308 | index.md:35 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 57 | maps-h-01309 | index.md:36 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 58 | maps-h-01310 | index.md:37 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 59 | maps-h-01311 | index.md:38 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |
| 60 | maps-h-01312 | index.md:39 | docs/specs/runner.md | ok | generated file, retarget via generator, no hand patch |

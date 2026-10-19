# Step 3 per-file authoring request — PREPARED, NOT EXECUTED

Authority: owner A51; Lead L12-28 under A42. Read the phase file Steps 2–3, owner-answers A50/A51 and L12-21..L12-28, then the whole assigned consumer file and every inventory edge in it. The class-3 input is `step-02j-census-maps-portals-prose.json`: **8,496 edges / 1,037 files**, mechanically accepted at `6235d0151`, original source input `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. Its actions/owners/patch strings are advisory only. This request defines future authoring; it contains no authored patch and authorizes no consumer write in this inventory turn.

## Scope and batching

One author record and one unified diff per consumer file. Read complete source from a pinned author-input commit; verify file digest and inventory spans. If the file changed since the inventory, rebind every edge to current complete expressions, recording source correspondence; never guess by line ordinal. A zero-patch file still has one record, an empty diff and all edges dispositioned. Files with zero reference edges remain in the manifest with explicit empty coverage. Instructions/skills owned by earlier classes are not silently imported into class 3: only the 1,037 files of the accepted census are listed here; related class-1/2 work retains its own handoff.

The batches below are source-owner scheduling/review sets, capped at 25 files and 250 inventory edges where possible (one indivisible large file can exceed the edge cap). Five requested group headings are used; no cross-owner batch. Generated projections overlapping the class-4 inventory require generator/source coordination and Step 5 parity; a class-3 entry cannot authorize a hand edit to a generated render. Specs-root records are Phase 9 patch specifications only. Author batches remain serial unless separately dispatched by the Lead.

## Per-file record schema

```json
{"file":"repo-relative path","inventoryInputCommit":"full sha","authorInputCommit":"full sha","inventoryFileDigest":"sha256","digest":"current sha256","inventoryEdgeIds":["maps-j-..."],"diff":"one complete unified diff, or empty","edges":[{"edgeId":"maps-j-...","sourceSpans":[],"matchedExpression":"complete source unit","disposition":"patch | parked | phase9-row-flip | preserve","diffHunk":null,"reason":"rule and source passage","target":null,"anchor":null,"timing":"now | Phase 9 | none","blockedReason":null,"dependency":null}],"checks":{"coverage":{},"anchors":{},"relativeResolution":{},"labelForm":{}},"reviewSet":"batch id","authoringRules":["L12-21..L12-26","Lead rulings"]}
```

Disposition **patch** links every affected edge to its exact hunk; shared link units are patched once, with all referring edges joined. **parked** carries explicit non-executable/blocked state and missing target/decision/dependency. **phase9-row-flip** describes the whole row semantics and authority-flip timing, with no early edit. **preserve** names the source/provenance/history/retained-path rule. Do not point a patch into carriage/history-only targets, drop locators, invent aliases as write destinations, or drop path prefixes, slash suffixes, link image markers or path-text labels. L12-26 supersedes older backlog/decision-copy generator claims; `docs/ui-spec/**` is retained. Keep P8-DOC-GAP-01/02/03 and workflow carry dependencies explicit.

## Mechanical checks on EVERY diff/record

- Exact file digest and complete source-span binding to the author input; unified diff applies to that same file. Coverage joins inventory edge ids to dispositions one-to-one: no missing, duplicate, extra or orphan edge/hunk. Include preserved/parked/row-flip edges even when there is no patch.
- Every target exists at the declared committed target tree. Check anchor with the existing repository API; Markdown destinations use GitHub slugs, plain citations extractor anchors. Every locator must retain exact passage correspondence. No executable target into carriage or self-reference/duplicated Related lists.
- Resolve relative targets from the consumer directory; retain repo-root/`repo/`/`./`/`../` form and directory slash as appropriate. Runtime cwd/default roots remain Step 5 proof dependencies. Check whole link label+destination form, basename labels, backticks and `!` image marker.
- Separate candidate/provenance/Phase 9 authority status; lookup aliases never become write destinations. An untraced writer, ownership/schema/identity change or missing live target parks that edge. Compare migration-state rows semantically, not by path replacement. Never edit checkers, gates or baselines to pass a diff.

## Sampling, mandatory review and expansion (A51)

Proposed mandatory threshold: **source file ≥65,536 bytes OR ≥40 inventory edges**, measured at the author input before edits. Review every such file, even an empty-diff/parked-only file; this is stronger than A51's patched-file minimum. At request preparation there are 53 such class-3 files. Lead may lower the threshold before freezing sets; raising it requires an explicit revised request.

After all per-file records for a set exist, freeze its manifest with file digests and diff hashes. Patched-file population = files with any non-empty diff, including authored Phase 9 diffs. Seed = `A51-step03-file-v1` + NUL + full author-input commit + NUL + batch id. Rank by sha256(seed + NUL + consumer path), ascending, tie path. Take ceil(0.15 × patched-file count), union all mandatory-threshold files; record population, seed, ranks, selected files, threshold witnesses and distinct review counts. Do not seed from edge ids or select based on old advisory action labels. Review sampled and mandatory per-file diffs in whole-file context first; mechanically check ALL files.

For each frozen source-owner batch/set, publish reviewed-file denominator and rework numerator; a file with any required semantic correction counts once. **≤3% rework per set** passes the sample gate; **>3% expands semantic review to EVERY file of that set**, including parked/preserve/row-flip records. Never pool sets to hide a breach or replace failed sample files. Corrected files are re-reviewed with new digest/diff binding; sampling never waives mechanical coverage. Report findings and Lead judgments separately. Rows outside earlier semantic review sets are covered by this process.

Each human review payload ≤60 file records and ≤400,000 bytes. Stream large-file context in bounded sections, retaining one file/diff record and verdict. Before authoring the Lead measures actual diff/context bytes and assigns budget, splits oversized scheduling sets without changing frozen sample membership silently, and supplies unique convention-resolved report names. No reviewer or author is launched by this request.

## Consumer file batches


### instructions/navigation

Batch 001 — owner `docs/platform/packaging-distribution`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | 2 | 10573 |  |

Batch 002 — owner `repo/navigation`: 5 files / 111 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `README.md` | 3 | 8740 |  |
| `docs/doc-governance.md` | 8 | 18420 |  |
| `docs/platform-foundations.md` | 6 | 16932 |  |
| `docs/reading-map.md` | 89 | 35359 | yes |
| `docs/routing-handoff-contract.md` | 5 | 7045 |  |


### maps/portals

Batch 003 — owner `docs/architect/README.md`: 1 files / 15 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/README.md` | 15 | 2829 |  |

Batch 004 — owner `docs/architect/agent-coordination`: 11 files / 125 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/agent-coordination/README.md` | 45 | 10535 | yes |
| `docs/architect/agent-coordination/architecture/README.md` | 18 | 5406 |  |
| `docs/architect/agent-coordination/contracts/README.md` | 5 | 1842 |  |
| `docs/architect/agent-coordination/decisions/README.md` | 13 | 3016 |  |
| `docs/architect/agent-coordination/history/README.md` | 0 | 736 |  |
| `docs/architect/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | 3 | 35162 |  |
| `docs/architect/agent-coordination/proposals/README.md` | 14 | 3660 |  |
| `docs/architect/agent-coordination/roadmap/README.md` | 6 | 1940 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md` | 13 | 1597 |  |
| `docs/architect/agent-coordination/verification/README.md` | 2 | 966 |  |
| `docs/architect/agent-coordination/vocabulary/README.md` | 6 | 2174 |  |

Batch 005 — owner `docs/architect/component-boundary`: 1 files / 24 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/component-boundary/README.md` | 24 | 10296 |  |

Batch 006 — owner `docs/architect/domainization`: 1 files / 6 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/domainization/README.md` | 6 | 10848 |  |

Batch 007 — owner `docs/architect/packaging-distribution`: 3 files / 36 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/packaging-distribution/README.md` | 6 | 9620 |  |
| `docs/architect/packaging-distribution/migration-map.md` | 23 | 13633 |  |
| `docs/architect/packaging-distribution/scope-map.md` | 7 | 11217 |  |

Batch 008 — owner `docs/architect/proposals`: 2 files / 21 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/proposals/README.md` | 6 | 1516 |  |
| `docs/architect/proposals/component-authority-boundary-map.md` | 15 | 49963 |  |

Batch 009 — owner `docs/architect/roadmap.md`: 1 files / 5 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/roadmap.md` | 5 | 23435 |  |

Batch 010 — owner `docs/architect/workspace-topology-roadmap.md`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/workspace-topology-roadmap.md` | 3 | 5752 |  |

Batch 011 — owner `docs/generated`: 1 files / 4 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/generated/README.md` | 4 | 1170 |  |

Batch 012 — owner `docs/knowledge`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/which-stitch-generated-design-export-maps-to-which-real-reac/herdr-web-dashboard-stitch-export-to-component-map.md` | 2 | 1699 |  |

Batch 013 — owner `docs/platform/README.md`: 1 files / 23 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/README.md` | 23 | 9323 |  |

Batch 014 — owner `docs/platform/agent-confinement`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-confinement/README.md` | 2 | 2043 |  |

Batch 015 — owner `docs/platform/agent-coordination`: 22 files / 158 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/README.md` | 3 | 6693 |  |
| `docs/platform/agent-coordination/architecture/README.md` | 3 | 7287 |  |
| `docs/platform/agent-coordination/decisions/README.md` | 1 | 4134 |  |
| `docs/platform/agent-coordination/history/README.md` | 2 | 1718 |  |
| `docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | 2 | 35898 |  |
| `docs/platform/agent-coordination/history/retired-engine/README.md` | 18 | 20930 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/README.md` | 5 | 4083 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/README.md` | 8 | 8408 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/contracts/README.md` | 5 | 4473 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/README.md` | 6 | 5733 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/README.md` | 12 | 6389 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/README.md` | 8 | 4591 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/README.md` | 6 | 4011 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/subcomponents/README.md` | 6 | 3549 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/verification/README.md` | 16 | 5669 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/README.md` | 4 | 4535 |  |
| `docs/platform/agent-coordination/history/retired-engine/inbound/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | 5 | 37406 |  |
| `docs/platform/agent-coordination/history/retired-engine/legacy/README.md` | 6 | 13985 |  |
| `docs/platform/agent-coordination/history/retired-engine/subcomponents/README.md` | 21 | 8895 |  |
| `docs/platform/agent-coordination/proposals/README.md` | 2 | 5039 |  |
| `docs/platform/agent-coordination/verification/README.md` | 18 | 4099 |  |
| `docs/platform/agent-coordination/vocabulary/README.md` | 1 | 3148 |  |

Batch 016 — owner `docs/platform/architecture-map.md`: 1 files / 36 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/architecture-map.md` | 36 | 59475 |  |

Batch 017 — owner `docs/platform/claude-plugin`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/claude-plugin/README.md` | 2 | 1765 |  |

Batch 018 — owner `docs/platform/decision-citation-drift`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/decision-citation-drift/README.md` | 2 | 1799 |  |

Batch 019 — owner `docs/platform/distillery`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/distillery/README.md` | 2 | 1760 |  |

Batch 020 — owner `docs/platform/documentation`: 2 files / 12 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/documentation/history/templates/README.md` | 0 | 2502 |  |
| `docs/platform/documentation/operations/portals/docs-portal.md` | 12 | 3088 |  |

Batch 021 — owner `docs/platform/herdr-web-dashboard`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/herdr-web-dashboard/README.md` | 2 | 1928 |  |

Batch 022 — owner `docs/platform/history`: 1 files / 0 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/history/documentation-authority-unification/README.md` | 0 | 2406 |  |

Batch 023 — owner `docs/platform/host-invocation-routing`: 6 files / 10 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/host-invocation-routing/README.md` | 2 | 11785 |  |
| `docs/platform/host-invocation-routing/architecture/README.md` | 2 | 2985 |  |
| `docs/platform/host-invocation-routing/contracts/README.md` | 1 | 2910 |  |
| `docs/platform/host-invocation-routing/decisions/README.md` | 0 | 3237 |  |
| `docs/platform/host-invocation-routing/roadmap.md` | 5 | 52227 |  |
| `docs/platform/host-invocation-routing/verification/README.md` | 0 | 2662 |  |

Batch 024 — owner `docs/platform/observe`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/observe/README.md` | 2 | 1843 |  |

Batch 025 — owner `docs/platform/packaging-distribution`: 2 files / 38 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/packaging-distribution/README.md` | 14 | 24736 |  |
| `docs/platform/packaging-distribution/history/documentation-migration/migration-map.md` | 24 | 14843 |  |

Batch 026 — owner `docs/platform/proposals`: 2 files / 20 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/proposals/README.md` | 3 | 4705 |  |
| `docs/platform/proposals/component-authority-boundary-map.md` | 17 | 51833 |  |

Batch 027 — owner `docs/platform/runner`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/runner/README.md` | 2 | 6014 |  |

Batch 028 — owner `docs/platform/system-architecture`: 2 files / 11 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/system-architecture/architecture/roadmap.md` | 8 | 24670 |  |
| `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md` | 3 | 7063 |  |

Batch 029 — owner `docs/platform/ui-spec`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/ui-spec/README.md` | 3 | 4241 |  |

Batch 030 — owner `docs/platform/work-state`: 1 files / 14 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/work-state/README.md` | 14 | 4601 |  |

Batch 031 — owner `docs/reference`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/reference/codebase-scatter-consolidation-roadmap.md` | 2 | 4982 |  |

Batch 032 — owner `docs/user`: 1 files / 6 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/user/README.md` | 6 | 1136 |  |

Batch 033 — owner `repo/navigation`: 2 files / 54 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/README.md` | 15 | 2195 |  |
| `docs/architecture-map.md` | 39 | 54465 |  |


### skills/prompts

Batch 034 — owner `docs/architect/agent-coordination`: 9 files / 80 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/agent-coordination/playbooks/README.md` | 4 | 3837 |  |
| `docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md` | 5 | 39387 |  |
| `docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md` | 1 | 20030 |  |
| `docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` | 5 | 84699 | yes |
| `docs/architect/agent-coordination/playbooks/coordination-operating-harness.md` | 7 | 15395 |  |
| `docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md` | 21 | 19933 |  |
| `docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md` | 10 | 46639 |  |
| `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md` | 8 | 27337 |  |
| `docs/architect/agent-coordination/playbooks/prompts/step-07-design-discussion-handoff.md` | 19 | 21960 |  |

Batch 035 — owner `docs/architect/proposals`: 1 files / 18 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md` | 18 | 7380 |  |

Batch 036 — owner `docs/explanation`: 15 files / 26 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/explanation/build-skills-mirror-dev-skills-into-plugin.md` | 0 | 1580 |  |
| `docs/explanation/dispatch-buildprompt-docsref-pointer.md` | 2 | 2545 |  |
| `docs/explanation/dispatch-execute-prompt-file-flag.md` | 4 | 2719 |  |
| `docs/explanation/skill-prose-cleanup-cli-fallback-dedupe.md` | 1 | 738 |  |
| `docs/explanation/skill-prose-cleanup-design.md` | 7 | 5502 |  |
| `docs/explanation/skill-prose-cleanup-fgos-coding-exploring.md` | 1 | 515 |  |
| `docs/explanation/skill-prose-cleanup-fgos-coding-implement.md` | 1 | 861 |  |
| `docs/explanation/skill-prose-cleanup-fgos-coding-planning.md` | 1 | 512 |  |
| `docs/explanation/skill-prose-cleanup-fgos-coding-validating.md` | 1 | 518 |  |
| `docs/explanation/skill-prose-cleanup-fgos-fanout.md` | 1 | 707 |  |
| `docs/explanation/skill-prose-cleanup-merge-loop.md` | 1 | 772 |  |
| `docs/explanation/skill-prose-cleanup-remaining-bare-citations.md` | 1 | 784 |  |
| `docs/explanation/skill-prose-cleanup-smoke-tests.md` | 1 | 1304 |  |
| `docs/explanation/worker-prompt-inline-completion-signal.md` | 1 | 3970 |  |
| `docs/explanation/worker-prompt-iron-law-evidence-timing.md` | 3 | 3856 |  |

Batch 037 — owner `docs/knowledge`: 17 files / 39 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/add-a-read-only-fgos-verb-and-its-plugin-skill/add-a-read-only-fgos-verb-and-plugin-skill.md` | 3 | 6341 |  |
| `docs/knowledge/fix-a-project-skill-that-skill-reports-as-unknown-skill/fix-invisible-nested-project-skills.md` | 1 | 4071 |  |
| `docs/knowledge/how-to-verify-every-citer-before-retiring-a-shared-skill-fra/verify-every-citer-before-retiring-a-shared-skill-fragment.md` | 5 | 3654 |  |
| `docs/knowledge/how-to-wire-a-skill-through-the-dispatch-decision/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md` | 1 | 3326 |  |
| `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md` | 6 | 7895 |  |
| `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md` | 3 | 9211 |  |
| `docs/knowledge/why-a-repo-that-only-installs-fgos-as-a-claude-code-plugin-g/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md` | 2 | 5393 |  |
| `docs/knowledge/why-a-work-item-title-s-object-action-scope-rule-lives-in-th/title-semantic-contract-lives-in-submitting-skills.md` | 2 | 6262 |  |
| `docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md` | 3 | 4854 |  |
| `docs/knowledge/why-fgos-coding-driving-s-pick-through-approve-skills-instru/why-skill-prose-had-to-match-the-worktree-isolated-environment-it-runs-in.md` | 1 | 4062 |  |
| `docs/knowledge/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal-prompt.md` | 0 | 4279 |  |
| `docs/knowledge/why-fgos-install-setup-resolves-the-fgos-binary-through-a-3/why-fgos-bin-and-skill-distribution-needed-a-3-tier-self-healing-resolution.md` | 3 | 9021 |  |
| `docs/knowledge/why-fgos-registers-a-doctor-check-confirming-every-stage-nam/why-a-doctor-check-verifies-every-workflow-stage-has-a-skillmap-owner.md` | 1 | 1960 |  |
| `docs/knowledge/why-fgos-s-coding-domain-skills-were-rewritten-to-a-300-line/why-fgos-skills-split-into-skillmd-plus-references-under-300-lines.md` | 7 | 6139 |  |
| `docs/knowledge/why-plugin-skills-need-a-cli-path-fallback/plugin-skill-cli-path-resolution-fallback.md` | 0 | 3385 |  |
| `docs/knowledge/why-stage-skills-forbid-ad-hoc-task-agent-delegation-for-the/why-stage-skills-forbid-ad-hoc-task-delegation-for-their-own-reasoning.md` | 1 | 5089 |  |
| `docs/knowledge/why-the-verify-fail-post-merge-playbook-s-retry-step-moves-a/why-the-verify-fail-post-merge-playbook-retries-through-awaiting-approval-not-proposed.md` | 0 | 3343 |  |

Batch 038 — owner `docs/platform/agent-coordination`: 17 files / 131 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md` | 21 | 8893 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/README.md` | 5 | 6536 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md` | 5 | 41907 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md` | 4 | 22380 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md` | 4 | 87296 | yes |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/coordination-operating-harness.md` | 9 | 17757 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md` | 18 | 22346 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md` | 10 | 127583 | yes |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/master-coordinator.md` | 12 | 29605 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md` | 23 | 24207 |  |
| `docs/platform/agent-coordination/playbooks/README.md` | 2 | 5563 |  |
| `docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md` | 2 | 45289 |  |
| `docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md` | 2 | 21840 |  |
| `docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` | 2 | 82161 | yes |
| `docs/platform/agent-coordination/playbooks/coordination-operating-harness.md` | 6 | 16287 |  |
| `docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md` | 3 | 3669 |  |
| `docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md` | 3 | 27675 |  |

Batch 039 — owner `docs/platform/packaging-distribution`: 1 files / 1 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` | 1 | 11957 |  |


### specs-root Phase 9 patch specs

Batch 040 — owner `docs/specs`: 11 files / 161 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/specs/confinement-authority.md` | 4 | 95294 | yes |
| `docs/specs/decision-citation-drift.md` | 13 | 6045 |  |
| `docs/specs/distillery.md` | 3 | 7355 |  |
| `docs/specs/distribution.md` | 8 | 83387 | yes |
| `docs/specs/enduser-docs-authoring.md` | 3 | 8989 |  |
| `docs/specs/enduser-docs-index.md` | 4 | 19960 |  |
| `docs/specs/fgos-plugin.md` | 3 | 10199 |  |
| `docs/specs/herdr-web-dashboard.md` | 16 | 21374 |  |
| `docs/specs/observe.md` | 2 | 20737 |  |
| `docs/specs/platform-foundations.md` | 23 | 41031 |  |
| `docs/specs/reading-map.md` | 82 | 35721 | yes |

Batch 041 — owner `docs/specs`: 4 files / 163 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/specs/runner.md` | 113 | 635616 | yes |
| `docs/specs/system-overview.md` | 8 | 18940 |  |
| `docs/specs/work-state.md` | 36 | 327843 | yes |
| `docs/specs/workflow.md` | 6 | 99377 | yes |


### others

Batch 042 — owner `docs/architect/agent-coordination`: 25 files / 154 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md` | 2 | 19583 |  |
| `docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md` | 21 | 6977 |  |
| `docs/architect/agent-coordination/architecture/dispatch-control-plane.md` | 12 | 19306 |  |
| `docs/architect/agent-coordination/architecture/evidence-and-results.md` | 0 | 1986 |  |
| `docs/architect/agent-coordination/architecture/executor-health-and-fallback.md` | 2 | 13468 |  |
| `docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md` | 3 | 10626 |  |
| `docs/architect/agent-coordination/architecture/protocol-model.md` | 6 | 6180 |  |
| `docs/architect/agent-coordination/architecture/run-handle.md` | 4 | 17103 |  |
| `docs/architect/agent-coordination/architecture/runtime-model.md` | 5 | 2970 |  |
| `docs/architect/agent-coordination/architecture/runtime-recovery-design.md` | 7 | 24950 |  |
| `docs/architect/agent-coordination/architecture/system-context.md` | 7 | 4598 |  |
| `docs/architect/agent-coordination/architecture/visibility-and-herdr.md` | 3 | 5482 |  |
| `docs/architect/agent-coordination/architecture/work-integration.md` | 5 | 3781 |  |
| `docs/architect/agent-coordination/contracts/assignment-run-runresult.md` | 7 | 19213 |  |
| `docs/architect/agent-coordination/contracts/coordination-session.md` | 23 | 83550 | yes |
| `docs/architect/agent-coordination/contracts/flow-definition.md` | 21 | 44038 |  |
| `docs/architect/agent-coordination/contracts/workflow-stage-operation.md` | 2 | 3069 |  |
| `docs/architect/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md` | 0 | 1294 |  |
| `docs/architect/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md` | 0 | 1171 |  |
| `docs/architect/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md` | 0 | 1183 |  |
| `docs/architect/agent-coordination/decisions/ADR-004-reserve-job.md` | 0 | 1067 |  |
| `docs/architect/agent-coordination/decisions/ADR-005-herdr-visibility-only.md` | 0 | 1095 |  |
| `docs/architect/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md` | 4 | 4830 |  |
| `docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md` | 5 | 3766 |  |
| `docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md` | 15 | 9769 |  |

Batch 043 — owner `docs/architect/agent-coordination`: 13 files / 249 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md` | 11 | 8973 |  |
| `docs/architect/agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md` | 8 | 6935 |  |
| `docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md` | 0 | 5358 |  |
| `docs/architect/agent-coordination/documentation-governance.md` | 0 | 4630 |  |
| `docs/architect/agent-coordination/documentation-standardization-plan.md` | 130 | 63415 | yes |
| `docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md` | 0 | 14834 |  |
| `docs/architect/agent-coordination/history/implementation-records/documentation-migration-2026-08-31.md` | 0 | 1870 |  |
| `docs/architect/agent-coordination/intent-preservation-ledger.md` | 28 | 30394 |  |
| `docs/architect/agent-coordination/proposals/dag-request-scheduler.md` | 4 | 37991 |  |
| `docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md` | 29 | 40017 |  |
| `docs/architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md` | 8 | 42024 |  |
| `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md` | 27 | 75067 | yes |
| `docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md` | 4 | 14343 |  |

Batch 044 — owner `docs/architect/agent-coordination`: 11 files / 70 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-00-overview.md` | 13 | 54369 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md` | 10 | 28735 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md` | 4 | 20274 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md` | 7 | 25106 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md` | 4 | 10141 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md` | 2 | 9198 |  |
| `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md` | 3 | 6261 |  |
| `docs/architect/agent-coordination/vision.md` | 10 | 16816 |  |
| `docs/architect/agent-coordination/vocabulary/canonical-concepts.md` | 12 | 12486 |  |
| `docs/architect/agent-coordination/vocabulary/concept-relationships.md` | 1 | 4834 |  |
| `docs/architect/agent-coordination/vocabulary/deprecated-and-reserved.md` | 4 | 3208 |  |

Batch 045 — owner `docs/architect/architecture-intent.md`: 1 files / 12 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/architecture-intent.md` | 12 | 38301 |  |

Batch 046 — owner `docs/architect/component-boundary`: 2 files / 46 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/component-boundary/component-boundary-advisory.md` | 46 | 60161 | yes |
| `docs/architect/component-boundary/repo-layout-vision.md` | 0 | 7267 |  |

Batch 047 — owner `docs/architect/dispatch-control-plane-redesign.md`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/dispatch-control-plane-redesign.md` | 3 | 371 |  |

Batch 048 — owner `docs/architect/documentation-system-design.md`: 1 files / 9 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/documentation-system-design.md` | 9 | 19003 |  |

Batch 049 — owner `docs/architect/documentation-system-discussion.md`: 1 files / 79 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/documentation-system-discussion.md` | 79 | 62100 | yes |

Batch 050 — owner `docs/architect/doing-coordination-redesign.md`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/doing-coordination-redesign.md` | 3 | 37138 |  |

Batch 051 — owner `docs/architect/host-invocation-routing`: 6 files / 77 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/host-invocation-routing/documentation-standardization-plan.md` | 26 | 21740 |  |
| `docs/architect/host-invocation-routing/external-provider-protocol.md` | 4 | 13325 |  |
| `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` | 17 | 23452 |  |
| `docs/architect/host-invocation-routing/legacy-cli-transition.md` | 7 | 13288 |  |
| `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` | 11 | 20457 |  |
| `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` | 12 | 32211 |  |

Batch 052 — owner `docs/architect/knowledge-registry-redesign.md`: 1 files / 12 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/knowledge-registry-redesign.md` | 12 | 33903 |  |

Batch 053 — owner `docs/architect/packaging-distribution`: 5 files / 38 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/packaging-distribution/future-constraints.md` | 0 | 3549 |  |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | 11 | 9034 |  |
| `docs/architect/packaging-distribution/rewrite-plan.md` | 19 | 13331 |  |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | 4 | 42849 |  |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | 4 | 1244 |  |

Batch 054 — owner `docs/architect/proposals`: 11 files / 129 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/proposals/architecture-advisory-panel.md` | 6 | 31566 |  |
| `docs/architect/proposals/coordination-capability-envelope.md` | 14 | 28280 |  |
| `docs/architect/proposals/coordination-dispatch-contract.md` | 4 | 14403 |  |
| `docs/architect/proposals/coordination-envelope-probe-contract.md` | 5 | 10532 |  |
| `docs/architect/proposals/coordination-envelope-progress.md` | 15 | 10640 |  |
| `docs/architect/proposals/coordination-worker-provider-boundary.md` | 8 | 13423 |  |
| `docs/architect/proposals/group-thinking-plan-loop.md` | 11 | 16137 |  |
| `docs/architect/proposals/step-09-group-thinking-substrate.md` | 19 | 30684 |  |
| `docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md` | 12 | 23073 |  |
| `docs/architect/proposals/step-10-coding-domain-adoption.md` | 17 | 53003 |  |
| `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` | 18 | 67568 | yes |

Batch 055 — owner `docs/architect/system-vision-trong-mem-ngoai-cung.md`: 1 files / 0 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/system-vision-trong-mem-ngoai-cung.md` | 0 | 5279 |  |

Batch 056 — owner `docs/architect/workspace-topology-audit.md`: 1 files / 1 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/workspace-topology-audit.md` | 1 | 11759 |  |

Batch 057 — owner `docs/architect/workspace-topology.md`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architect/workspace-topology.md` | 2 | 18073 |  |

Batch 058 — owner `docs/contracts`: 1 files / 17 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/contracts/fgos-gateway-api-v1.yaml` | 17 | 34956 |  |

Batch 059 — owner `docs/decisions`: 1 files / 77 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/decisions/index.md` | 77 | 33997 | yes |

Batch 060 — owner `docs/distillery`: 10 files / 219 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/distillery/comparison-matrix.md` | 207 | 55038 | yes |
| `docs/distillery/deep-dives/compound-engineering.md` | 0 | 24688 |  |
| `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md` | 0 | 13273 |  |
| `docs/distillery/deep-dives/fgos-harness-architecture.md` | 0 | 11820 |  |
| `docs/distillery/deep-dives/herdr-vs-tmux-observation.md` | 2 | 13686 |  |
| `docs/distillery/deep-dives/how-to-use-herdr.md` | 2 | 51768 |  |
| `docs/distillery/deep-dives/parallel-decomposition-and-merge.md` | 4 | 24652 |  |
| `docs/distillery/deep-dives/routing.md` | 0 | 32929 |  |
| `docs/distillery/deep-dives/state.md` | 3 | 32057 |  |
| `docs/distillery/deep-dives/tool-registry.md` | 1 | 28461 |  |

Batch 061 — owner `docs/distillery`: 25 files / 247 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/distillery/deep-dives/work-item-management.md` | 46 | 72025 | yes |
| `docs/distillery/deep-dives/work-item-schema-and-io-contracts.md` | 5 | 39617 |  |
| `docs/distillery/intake.md` | 0 | 509 |  |
| `docs/distillery/porting-log.md` | 11 | 99149 | yes |
| `docs/distillery/reports/distill-bee-inventory-2026-07-18.md` | 9 | 38198 |  |
| `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md` | 31 | 82163 | yes |
| `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md` | 44 | 117745 | yes |
| `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md` | 9 | 69968 | yes |
| `docs/distillery/reports/distill-beegog-herding-design-2026-09-06.md` | 0 | 23530 |  |
| `docs/distillery/reports/distill-beegog-herding-rust-2026-09-06.md` | 0 | 17560 |  |
| `docs/distillery/reports/distill-herdr-inventory-2026-07-15.md` | 3 | 56239 |  |
| `docs/distillery/reports/scout-herdr-0.8.2-control-surface-2026-09-06.md` | 0 | 10913 |  |
| `docs/distillery/sources/beads-rust.md` | 1 | 37140 |  |
| `docs/distillery/sources/beads-viewer-rust.md` | 0 | 24589 |  |
| `docs/distillery/sources/beads.md` | 0 | 17591 |  |
| `docs/distillery/sources/beehive.md` | 68 | 188784 | yes |
| `docs/distillery/sources/claudekit-engineer.md` | 0 | 45103 |  |
| `docs/distillery/sources/compound-engineering-plugin.md` | 6 | 38809 |  |
| `docs/distillery/sources/council-of-high-intelligence.md` | 1 | 12170 |  |
| `docs/distillery/sources/herdr.md` | 4 | 60623 |  |
| `docs/distillery/sources/learn-harness-engineering.md` | 0 | 337 |  |
| `docs/distillery/sources/marketing-cockpit.md` | 0 | 21897 |  |
| `docs/distillery/sources/okf.md` | 0 | 10994 |  |
| `docs/distillery/sources/pi.md` | 1 | 52999 |  |
| `docs/distillery/sources/repository-harness.md` | 8 | 45085 |  |

Batch 062 — owner `docs/distillery`: 2 files / 6 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/distillery/sources/superpowers.md` | 0 | 75131 | yes |
| `docs/distillery/sources/symphony.md` | 6 | 17911 |  |

Batch 063 — owner `docs/explanation`: 25 files / 64 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/explanation/agy-permission-denylist-not-allowlist.md` | 1 | 5558 |  |
| `docs/explanation/approve-cas-mismatch-block.md` | 0 | 3801 |  |
| `docs/explanation/approve-lock-lost-mid-merge-guard.md` | 0 | 2917 |  |
| `docs/explanation/approve-owns-self-recovery-merge-loop-thin-caller.md` | 2 | 2861 |  |
| `docs/explanation/assert-plan-evidence-current-tree-fallback.md` | 3 | 4637 |  |
| `docs/explanation/branch-content-mismatch-fgos-exclusion.md` | 1 | 3728 |  |
| `docs/explanation/capabilities-prefer-symmetry-removed.md` | 1 | 3146 |  |
| `docs/explanation/catchup-manual-merge-fgos-write-rejected-deadlock.md` | 6 | 10164 |  |
| `docs/explanation/catchup-movework-reopens-fgos-divergence.md` | 0 | 3640 |  |
| `docs/explanation/catchup-self-recovery-shared-reference.md` | 1 | 2917 |  |
| `docs/explanation/catchup-spurious-not-uptodate-merge-refusal.md` | 0 | 5842 |  |
| `docs/explanation/checkpoint-commit-self-collides-own-lock-holder.md` | 2 | 5698 |  |
| `docs/explanation/citation-baseline-cleanup-calibration-slice.md` | 2 | 3828 |  |
| `docs/explanation/citation-drift-backlog-scope-split-with-tsk-56w.md` | 6 | 2956 |  |
| `docs/explanation/citation-drift-remaining-docs-cleanup.md` | 4 | 1029 |  |
| `docs/explanation/citation-drift-runner-md-cleanup.md` | 7 | 1121 |  |
| `docs/explanation/claim-ambiguous-lock-inline-self-heal.md` | 0 | 4176 |  |
| `docs/explanation/claude-executor-d4-proof-test-red.md` | 3 | 1617 |  |
| `docs/explanation/claude-executor-rtk-hook-root-cause.md` | 3 | 1839 |  |
| `docs/explanation/cleanup-harness-checkmerge-blind-spots.md` | 2 | 4397 |  |
| `docs/explanation/codex-bypass-executor.md` | 2 | 3665 |  |
| `docs/explanation/compound-learn-artifact-registry.md` | 7 | 26324 |  |
| `docs/explanation/core-foundation-domain-boundary.md` | 3 | 6974 |  |
| `docs/explanation/cross-provider-egress-governance.md` | 0 | 3593 |  |
| `docs/explanation/d0026-native-first-dispatch-narrative-reconciliation.md` | 8 | 6969 |  |

Batch 064 — owner `docs/explanation`: 25 files / 48 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/explanation/d3-goal-check-rationale-trace.md` | 9 | 3381 |  |
| `docs/explanation/decide-for-prefer-fix-and-dispatchplan-minimal.md` | 0 | 4924 |  |
| `docs/explanation/discover-stage-graph-post-audit-cleanup.md` | 3 | 6888 |  |
| `docs/explanation/discovered-work-risk-kind-vocabulary-coercion.md` | 0 | 2845 |  |
| `docs/explanation/dispatch-activation-and-handoff-redesign.md` | 1 | 9635 |  |
| `docs/explanation/dispatch-attestation-level-2-enforcement-halt.md` | 2 | 4623 |  |
| `docs/explanation/dispatch-config-cache-scope-narrowed.md` | 2 | 4960 |  |
| `docs/explanation/dispatch-execute-concurrency-guard.md` | 2 | 3278 |  |
| `docs/explanation/dispatch-execute-lost-uncommitted-paths-warning.md` | 3 | 3805 |  |
| `docs/explanation/dispatch-execute-repo-root-cwd-separation.md` | 1 | 7573 |  |
| `docs/explanation/dispatch-execute-unsignaled-outcome.md` | 1 | 3361 |  |
| `docs/explanation/dispatch-plan-protocol-redesign.md` | 1 | 8271 |  |
| `docs/explanation/dispatch-redesign-batch-final-verify.md` | 1 | 3907 |  |
| `docs/explanation/dispatch-result-confidence-reader.md` | 0 | 3440 |  |
| `docs/explanation/dispatch-result-normalization-ladder-extraction.md` | 1 | 3461 |  |
| `docs/explanation/dispatch-verify-run-once-cadence.md` | 0 | 3789 |  |
| `docs/explanation/dispatch-waiting-rule-end-turn-no-tool-call.md` | 1 | 3226 |  |
| `docs/explanation/driving-loop-worktree-resync-on-reentry.md` | 0 | 2018 |  |
| `docs/explanation/driving-pane-rename-resolved-path.md` | 0 | 3487 |  |
| `docs/explanation/enduser-docs-index-stale-orphan-detection-gap.md` | 3 | 3335 |  |
| `docs/explanation/eventlog-guard-fail-closed-event-count-checkpoint.md` | 2 | 4790 |  |
| `docs/explanation/eventlog-sweep-checkpoint-redesign.md` | 6 | 7829 |  |
| `docs/explanation/eventlog-tier-a-multifile-content-hash-redesign.md` | 6 | 8854 |  |
| `docs/explanation/events-jsonl-concurrent-data-loss-investigation.md` | 0 | 5798 |  |
| `docs/explanation/events-jsonl-opportunistic-truncation-check.md` | 3 | 9547 |  |

Batch 065 — owner `docs/explanation`: 25 files / 48 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/explanation/executor-dispatch-manual-log-gap-and-step-b5-fix.md` | 1 | 4221 |  |
| `docs/explanation/expr-eval-chain-passthrough-vs-split.md` | 0 | 2124 |  |
| `docs/explanation/fanout-batch-background-execution-and-orphan-recovery.md` | 3 | 3773 |  |
| `docs/explanation/fanout-batch-concurrent-dispatch.md` | 2 | 2667 |  |
| `docs/explanation/fanout-batch-per-child-sync-spawn-and-listwork.md` | 1 | 3828 |  |
| `docs/explanation/fanout-execute-consolidation.md` | 1 | 4769 |  |
| `docs/explanation/fanout-proof-agy-demo.md` | 0 | 1459 |  |
| `docs/explanation/fgos-edit-role-flag.md` | 0 | 3168 |  |
| `docs/explanation/fgos-fanout-out-of-process-dispatch.md` | 2 | 4606 |  |
| `docs/explanation/fgos-gateway-lifecycle-verb.md` | 0 | 4508 |  |
| `docs/explanation/fgos-lifecycle-tracking-concurrent-desync.md` | 2 | 4087 |  |
| `docs/explanation/fgos-preflight-verb.md` | 0 | 2545 |  |
| `docs/explanation/fgos-return-skip-redundant-verify.md` | 1 | 3127 |  |
| `docs/explanation/fgos-write-rejected-structural-deadlock.md` | 2 | 3159 |  |
| `docs/explanation/footprint-diff-research-md-noise.md` | 7 | 4066 |  |
| `docs/explanation/gate-bypass-keyword-floor-false-positives.md` | 0 | 3756 |  |
| `docs/explanation/general-verb-events-baseline-write-verified-fixed.md` | 4 | 3830 |  |
| `docs/explanation/gitignore-docs-history-reverify.md` | 6 | 1792 |  |
| `docs/explanation/glm-openrouter-executor.md` | 3 | 7280 |  |
| `docs/explanation/herdr-orchestrator-terminology-boundary.md` | 5 | 3437 |  |
| `docs/explanation/herdr-spawn-adapter-fresh-pane.md` | 5 | 25514 |  |
| `docs/explanation/iron-law-classification-recipe-path.md` | 1 | 3606 |  |
| `docs/explanation/list-id-callthreads-leak-fix.md` | 0 | 2603 |  |
| `docs/explanation/list-id-fields-flag-lightweight-projection.md` | 1 | 3584 |  |
| `docs/explanation/lock-wait-self-vs-other-holder-identity.md` | 1 | 4997 |  |

Batch 066 — owner `docs/explanation`: 25 files / 32 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/explanation/loop-descendant-dedup-false-premise.md` | 1 | 2977 |  |
| `docs/explanation/loop-family-scheduleWakeup-self-reference-gap.md` | 0 | 3977 |  |
| `docs/explanation/main-checkout-lock-release-early-compound-cleanup.md` | 0 | 5538 |  |
| `docs/explanation/main-checkout-lock-scope-audit.md` | 3 | 3041 |  |
| `docs/explanation/main-checkout-reset-ancestor-commit-loss-guard.md` | 2 | 5170 |  |
| `docs/explanation/merge-next-inline-approve-invocation.md` | 0 | 2581 |  |
| `docs/explanation/merged-tree-verified-disjoint-main-advance.md` | 0 | 3272 |  |
| `docs/explanation/mergedsha-missing-unreproduced-race.md` | 1 | 3543 |  |
| `docs/explanation/mode-gate-tiny-small-skip-load.md` | 2 | 3923 |  |
| `docs/explanation/no-stuck-merge-abort-doctor-check.md` | 3 | 4285 |  |
| `docs/explanation/noise-only-paths-truncation-guard-exemption.md` | 1 | 1968 |  |
| `docs/explanation/opportunistic-checks-regression-root-cause-bisection.md` | 2 | 3988 |  |
| `docs/explanation/opportunistic-checks-test-regression-fgos-oet.md` | 1 | 2519 |  |
| `docs/explanation/orphaned-runtime-claim-recovery-unclaim-verb.md` | 1 | 4949 |  |
| `docs/explanation/partial-claim-event-loss-covered-by-tsk-1vc.md` | 1 | 2900 |  |
| `docs/explanation/pi-runtime-capacity.md` | 3 | 3985 |  |
| `docs/explanation/planning-passthrough-action-footprint-sync.md` | 0 | 2208 |  |
| `docs/explanation/planning-split-root-verify-sync.md` | 0 | 3349 |  |
| `docs/explanation/postland-drift-notify-consumer.md` | 1 | 2949 |  |
| `docs/explanation/pre-commit-fgos-content-precedence-guard.md` | 5 | 5720 |  |
| `docs/explanation/resolve-park-reason-verb.md` | 1 | 2804 |  |
| `docs/explanation/restore-verifiedsha-docs-on-main.md` | 0 | 2541 |  |
| `docs/explanation/retro-next-shared-driving.md` | 1 | 5112 |  |
| `docs/explanation/return-approve-background-execution-guidance.md` | 2 | 1976 |  |
| `docs/explanation/return-ephemeral-worktree-fgos-strip.md` | 1 | 2637 |  |

Batch 067 — owner `docs/explanation`: 22 files / 26 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/explanation/root-resolution-two-call-split-propagation.md` | 2 | 3180 |  |
| `docs/explanation/routing-orient-stale-postdelivery-advisory.md` | 0 | 1956 |  |
| `docs/explanation/rul11-anchor-test-citation-gloss-update.md` | 2 | 2205 |  |
| `docs/explanation/rul11-tum-lum-doctrine.md` | 2 | 2722 |  |
| `docs/explanation/runtime-claim-doing-separation.md` | 4 | 9772 |  |
| `docs/explanation/session-identity-3hop-walk-flaky-test.md` | 1 | 3071 |  |
| `docs/explanation/settleclaim-revision-drift-self-caused.md` | 1 | 8121 |  |
| `docs/explanation/spawnworker-idletimeout-flaky-test-margin.md` | 0 | 1876 |  |
| `docs/explanation/state-write-single-stringify.md` | 0 | 2908 |  |
| `docs/explanation/submit-dependency-scan-delivered-blindspot.md` | 1 | 3483 |  |
| `docs/explanation/submit-deps-direction-blocked-vs-superseded.md` | 0 | 3407 |  |
| `docs/explanation/sync-root-error-propagation.md` | 0 | 3158 |  |
| `docs/explanation/sync-root-outcome-guard-citation-and-lock-lost-coverage.md` | 3 | 4660 |  |
| `docs/explanation/test-suite-wallclock-file-split.md` | 1 | 5003 |  |
| `docs/explanation/tsk-397-post-merge-review-remediation.md` | 2 | 6298 |  |
| `docs/explanation/unsignaled-detection-backtick-false-positive.md` | 2 | 2762 |  |
| `docs/explanation/wontfix-worktree-reclaim-startup-reap.md` | 0 | 2713 |  |
| `docs/explanation/work-item-lifecycle-and-domain-model.md` | 2 | 7876 |  |
| `docs/explanation/worktree-isolation-existing-path-hazard.md` | 1 | 7100 |  |
| `docs/explanation/worktree-manual-merge-fgos-blob-safety-net.md` | 2 | 4612 |  |
| `docs/explanation/write-rejected-no-diff-check.md` | 0 | 3160 |  |
| `docs/explanation/write-rejected-trust-branchheadattake.md` | 0 | 3428 |  |

Batch 068 — owner `docs/how-to`: 23 files / 99 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/how-to/author-a-plan-loop-track.md` | 3 | 14361 |  |
| `docs/how-to/check-rollup-progress.md` | 3 | 9057 |  |
| `docs/how-to/compare-discussion-setups-with-metrics-eval.md` | 2 | 13675 |  |
| `docs/how-to/configure-and-operate-agent-confinement.md` | 1 | 18361 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-alternative-and-composite-reopen.md` | 2 | 7496 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-clarification-and-challenge.md` | 4 | 8186 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-clear-start.md` | 7 | 7681 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-decision-request-and-resume.md` | 6 | 10013 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-final-decision-and-defer.md` | 1 | 6160 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md` | 1 | 10039 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-material-context-reopen.md` | 2 | 8542 |  |
| `docs/how-to/coordination-examples/architecture-advisory-panel-v1-unclear-start.md` | 2 | 6532 |  |
| `docs/how-to/fix-bare-citation-findings.md` | 6 | 3296 |  |
| `docs/how-to/fix-d-local-outside-home-findings.md` | 4 | 3093 |  |
| `docs/how-to/handle-worktree-guard-refusal-of-compound-dispatch-command.md` | 1 | 3065 |  |
| `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` | 8 | 46591 |  |
| `docs/how-to/measure-a-real-case.md` | 4 | 5678 |  |
| `docs/how-to/operate-dispatch-runtime-inspection-and-reconciliation.md` | 0 | 2515 |  |
| `docs/how-to/run-a-coordination-session.md` | 10 | 13470 |  |
| `docs/how-to/use-fast-test-feedback-commands.md` | 0 | 2987 |  |
| `docs/how-to/use-fgos-architecture-panel.md` | 19 | 18057 |  |
| `docs/how-to/use-fgos-group-thinking.md` | 11 | 10278 |  |
| `docs/how-to/write-wrapper-script-for-worktree-guard-refusal.md` | 2 | 2147 |  |

Batch 069 — owner `docs/journals`: 5 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/journals/260728-2038-claim-port-str46-parallel-merge.md` | 1 | 5409 |  |
| `docs/journals/260728-2130-hook-reachability-tsk-3w8.md` | 0 | 6432 |  |
| `docs/journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md` | 0 | 6141 |  |
| `docs/journals/260728-2245-lifecycle-sync-gates-three-latent-bugs.md` | 0 | 8619 |  |
| `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md` | 1 | 2948 |  |

Batch 070 — owner `docs/knowledge`: 25 files / 138 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/a-decision-doc-can-be-superseded-twice-superseded-by-becomes/a-decision-doc-can-be-superseded-twice-superseded-by-becomes-a-list.md` | 8 | 8766 |  |
| `docs/knowledge/add-a-new-npm-dependency-to-forgent/add-a-new-npm-dependency-to-forgent.md` | 0 | 4258 |  |
| `docs/knowledge/add-a-single-item-id-filter-to-an-existing-list-style-verb/add-a-single-item-id-filter-to-an-existing-list-verb.md` | 0 | 5757 |  |
| `docs/knowledge/add-a-stateful-fgos-verb-group-with-a-local-status-overlay/add-a-stateful-fgos-verb-group-with-a-local-status-overlay.md` | 8 | 7106 |  |
| `docs/knowledge/auto-decompose-can-drop-a-locked-decision-from-every-child-s/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md` | 2 | 11630 |  |
| `docs/knowledge/avoid-a-vacuous-pass-from-node-test-test-name-pattern/avoid-vacuous-pass-with-node-test-test-name-pattern.md` | 8 | 9614 |  |
| `docs/knowledge/close-out-a-decomposed-root-item-after-all-its-children-are/close-out-a-decomposed-root-item-after-all-children-are-done.md` | 1 | 12013 |  |
| `docs/knowledge/coding-domain-s-role-holder-axis-handoff-verb-task-spec-skil/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md` | 2 | 15135 |  |
| `docs/knowledge/decisions-index/decision-record.md` | 75 | 16921 | yes |
| `docs/knowledge/design-safeguards-in-fgos-s-runner-anti-loop-breakers-model/runner-execution-safety.md` | 1 | 4380 |  |
| `docs/knowledge/driftstatus-s-real-return-shape/drift-status-return-shape.md` | 2 | 4035 |  |
| `docs/knowledge/executor-cross-provider-governance/executor-cross-provider-governance.md` | 0 | 2845 |  |
| `docs/knowledge/explanation-fgos-return-runs-verify-as-a-literal-shell-comma/fgos-return-executes-verify-as-a-literal-shell-command.md` | 0 | 2634 |  |
| `docs/knowledge/explanation-when-the-engine-s-own-auto-generated-verify-is-w/fgos-discover-verify-path-drift.md` | 0 | 2925 |  |
| `docs/knowledge/explanatory-prose-can-outlive-the-locked-decision-that-super/explanatory-prose-can-outlive-the-locked-decision-that-superseded-it.md` | 3 | 3371 |  |
| `docs/knowledge/fgos-approve-s-verify-only-mode-checks-the-current-cwd-not-t/approve-verify-only-mode-checks-cwd-not-the-items-real-branch.md` | 1 | 4478 |  |
| `docs/knowledge/fgos-choke-point-survey-ranked-priority-table/fgos-choke-point-ranked-priority.md` | 1 | 2792 |  |
| `docs/knowledge/fgos-cook-worktree-claim-before-drive/fgos-cook-worktree-claim-before-drive.md` | 3 | 5111 |  |
| `docs/knowledge/fgos-discover-claim-via-pick-not-take/fgos-discover-claim-via-pick-not-take.md` | 2 | 3724 |  |
| `docs/knowledge/fgos-list-s-side-log-scoping/fgos-list-side-log-scoping.md` | 0 | 3183 |  |
| `docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md` | 12 | 14047 |  |
| `docs/knowledge/fgos-researching-s-d2-fan-out-rule-verified-live-on-a-real-d/fgos-researching-d2-fanout-verified-live.md` | 1 | 3983 |  |
| `docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md` | 4 | 5081 |  |
| `docs/knowledge/fgos-show-id-output-fields/fgos-show-verb-output-fields.md` | 1 | 2680 |  |
| `docs/knowledge/fgos-slots-cli-verb-output-shape-and-the-worker-slot-ceiling/fgos-slots-verb-output-fields.md` | 3 | 4248 |  |

Batch 071 — owner `docs/knowledge`: 25 files / 60 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/fgos-sync-root-s-real-guards-and-outcome-shape/fgos-sync-root-outcome-shape.md` | 1 | 5119 |  |
| `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md` | 0 | 3075 |  |
| `docs/knowledge/fgos-version-cli-verb-output-shape-and-the-cli-version-visib/fgos-version-verb-output-fields.md` | 1 | 3883 |  |
| `docs/knowledge/fix-a-pre-existing-item-that-keeps-re-asking-an-already-answ/fix-a-pre-existing-item-that-keeps-re-asking-an-already-answered-clarify-question.md` | 4 | 3112 |  |
| `docs/knowledge/fix-dead-fgos-shell-rc-source-lines/fix-dead-fgos-shell-rc-source-lines.md` | 0 | 3151 |  |
| `docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md` | 3 | 14329 |  |
| `docs/knowledge/friction-and-decision-events-are-real-storytelling-material/friction-and-decision-events-are-real-storytelling-material-once-boilerplate-is-filtered.md` | 0 | 5322 |  |
| `docs/knowledge/fsm-refusal-messages-now-name-a-remedy-and-wontfix-gains-an/fsm-refusal-messages-name-a-remedy-and-wontfix-gains-an-awaiting-human-door.md` | 4 | 4106 |  |
| `docs/knowledge/gate-bypass-config/gate-bypass-config.md` | 5 | 6183 |  |
| `docs/knowledge/global-config-merge-reuses-the-existing-fill-missing-only-pr/global-config-merge-reuses-fill-missing-only-primitive.md` | 1 | 5436 |  |
| `docs/knowledge/herdr-plugin-dashboard-layout-work-items-panel-action-queue/herdr-dashboard-layout-and-action-queues.md` | 3 | 15299 |  |
| `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md` | 6 | 15239 |  |
| `docs/knowledge/how-fgos-isolates-concurrent-sessions-and-why-the-event-log/session-isolation-and-concurrency.md` | 6 | 24476 |  |
| `docs/knowledge/how-fgos-s-event-log-is-allowed-to-evolve-without-breaking-r/event-log-evolution-discipline.md` | 1 | 4987 |  |
| `docs/knowledge/how-to-add-a-changelog-md-entry-for-a-user-visible-change/add-a-changelog-entry-for-a-user-visible-change.md` | 1 | 5494 |  |
| `docs/knowledge/how-to-add-a-drift-guard-for-cli-registry-help-prose/add-a-drift-guard-for-cli-registry-help-prose.md` | 3 | 6620 |  |
| `docs/knowledge/how-to-add-a-new-createworktree-call-site-without-hand-writi/add-a-new-createworktree-call-site.md` | 4 | 4724 |  |
| `docs/knowledge/how-to-advance-a-work-item-through-clarify-and-decompose-wit/advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md` | 1 | 3723 |  |
| `docs/knowledge/how-to-avoid-a-hung-verify-command-on-fgos-return-approve-ca/avoid-a-hung-verify-on-return-approve-catchup.md` | 1 | 7673 |  |
| `docs/knowledge/how-to-branch-fgos-coding-driving-s-claim-step-by-a-domain-s/branch-fgos-coding-driving-claim-step-by-domain-worktreebacked.md` | 2 | 6645 |  |
| `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md` | 3 | 9088 |  |
| `docs/knowledge/how-to-check-main-checkout-lock-status-before-retrying/check-main-checkout-lock-status-before-retrying.md` | 1 | 4746 |  |
| `docs/knowledge/how-to-check-whether-a-suspected-racing-mechanism-ever-actua/check-whether-a-suspected-mechanism-ever-fired-before-fixing-it.md` | 2 | 3607 |  |
| `docs/knowledge/how-to-claim-an-item-that-is-still-at-stage-clarify-or-decom/claim-a-clarify-or-decompose-stage-item.md` | 4 | 8842 |  |
| `docs/knowledge/how-to-clear-a-stuck-fgos-main-checkout-lock/clear-a-stuck-main-checkout-lock.md` | 3 | 5323 |  |

Batch 072 — owner `docs/knowledge`: 25 files / 80 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/how-to-close-a-duplicate-superseded-or-admin-decided-work-it/handle-a-duplicate-work-item.md` | 5 | 5343 |  |
| `docs/knowledge/how-to-close-out-a-goaltier-milestone-mvp-item-once-all-its/close-out-a-goaltier-milestone-after-all-targets-are-done.md` | 6 | 15308 |  |
| `docs/knowledge/how-to-close-out-a-work-item-whose-real-work-was-already-don/close-out-a-work-item-already-done-before-claim.md` | 3 | 4088 |  |
| `docs/knowledge/how-to-compute-a-parallel-dispatch-wave-schedule/compute-a-parallel-dispatch-wave-schedule.md` | 2 | 6256 |  |
| `docs/knowledge/how-to-configure-a-executor-to-dispatch-via-a-named-agent-in/configure-an-executor-to-dispatch-via-a-named-agent.md` | 4 | 5890 |  |
| `docs/knowledge/how-to-continue-when-a-root-item-decomposes-into-children-mi/continue-after-root-decomposes-mid-session.md` | 0 | 2579 |  |
| `docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md` | 1 | 2840 |  |
| `docs/knowledge/how-to-declare-footprint-when-fgos-coding-planning-splits-an/declare-footprint-when-fgos-planning-splits-an-item.md` | 1 | 2984 |  |
| `docs/knowledge/how-to-diagnose-a-fgos-return-blocked-by-a-verify-failure-un/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md` | 0 | 9245 |  |
| `docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md` | 2 | 10013 |  |
| `docs/knowledge/how-to-extract-a-judge-only-retry-helper-into-a-executor-agn/generalize-a-judge-retry-helper-for-any-executor-dispatch.md` | 0 | 8314 |  |
| `docs/knowledge/how-to-find-every-caller-before-making-a-cli-flag-required/find-every-caller-before-requiring-a-cli-flag.md` | 9 | 6680 |  |
| `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md` | 15 | 25067 |  |
| `docs/knowledge/how-to-fix-a-verify-command-that-mixes-prose-with-a-real-com/fix-a-verify-command-broken-by-mixed-in-prose.md` | 0 | 9146 |  |
| `docs/knowledge/how-to-get-the-fgos-claude-code-plugin-installed-via-fgos-do/install-the-fgos-claude-code-plugin-via-doctor.md` | 0 | 3146 |  |
| `docs/knowledge/how-to-grant-a-nested-claude-p-executor-call-its-own-scoped/add-a-scoped-allowedtools-override-for-a-nested-executor-call.md` | 5 | 5766 |  |
| `docs/knowledge/how-to-hand-a-material-context-md-gap-back-from-fgos-coding/hand-back-a-material-context-gap-during-planning.md` | 0 | 4842 |  |
| `docs/knowledge/how-to-hold-an-open-ended-design-brainstorm-with-fgos-coding/hold-an-open-ended-design-brainstorm-with-fgos-coding-shaping.md` | 6 | 7061 |  |
| `docs/knowledge/how-to-label-a-herdr-pane-with-the-claimed-task-from-a-chrom/fgos-terminal-pane-rename.md` | 3 | 6978 |  |
| `docs/knowledge/how-to-land-a-work-item-s-branch-into-main-when-its-status-a/land-a-delivered-item-whose-branch-was-never-actually-merged.md` | 2 | 3386 |  |
| `docs/knowledge/how-to-pass-a-caller-supplied-verdict-to-fgos-discover-fgos/pass-a-caller-supplied-verdict-to-discover-or-decompose.md` | 5 | 6542 |  |
| `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md` | 1 | 4284 |  |
| `docs/knowledge/how-to-process-the-next-clarify-decompose-item-with-fgos-dis/process-the-next-clarify-or-decompose-item-with-discover-next.md` | 0 | 3351 |  |
| `docs/knowledge/how-to-read-a-critical-impact-analysis-result-before-treatin/read-a-critical-impact-analysis-result-before-treating-it-as-a-blocker.md` | 4 | 6101 |  |
| `docs/knowledge/how-to-recognize-a-claude-code-hook-enoent-posix-spawn-bin-s/recognize-a-claude-code-hook-spawn-enoent-failure.md` | 6 | 2964 |  |

Batch 073 — owner `docs/knowledge`: 25 files / 116 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/how-to-reconcile-a-blocked-item-after-a-leaf-into-root-merge/reconcile-a-blocked-item-after-a-leaf-into-root-merge-race.md` | 0 | 3802 |  |
| `docs/knowledge/how-to-reconstruct-fgos-tracking-state-after-an-operator-mis/reconstruct-fgos-tracking-state-after-an-operator-mistake-discards-events-jsonl.md` | 4 | 4314 |  |
| `docs/knowledge/how-to-recover-a-blocked-item-with-fgos-catchup-from-inside/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md` | 4 | 3970 |  |
| `docs/knowledge/how-to-recover-a-blocked-merge-conflict-item-when-fgos-catch/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md` | 4 | 6054 |  |
| `docs/knowledge/how-to-recover-a-stuck-doing-claim-after-a-worktree-creation/recover-a-stuck-doing-claim-after-worktree-creation-failure.md` | 7 | 7645 |  |
| `docs/knowledge/how-to-recover-fgos-approve-fgos-sync-root-from-inside-a-wor/recover-approve-sync-root-from-inside-a-worktree-with-trust-dir.md` | 0 | 4152 |  |
| `docs/knowledge/how-to-register-a-fixable-doctor-check-in-fgos/register-a-fixable-doctor-check-in-fgos.md` | 6 | 8175 |  |
| `docs/knowledge/how-to-resolve-a-git-merge-conflict-on-fgos-events-jsonl-wit/resolve-an-events-jsonl-merge-conflict.md` | 11 | 8293 |  |
| `docs/knowledge/how-to-resolve-ambiguous-multi-target-errors-from-an-impact/resolve-ambiguous-multi-target-errors-from-an-impact-analysis-provider.md` | 0 | 3669 |  |
| `docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md` | 16 | 8837 |  |
| `docs/knowledge/how-to-respond-when-fgos-doctor-reports-a-shared-fgos-events/resolve-an-events-jsonl-truncation.md` | 6 | 4925 |  |
| `docs/knowledge/how-to-reuse-the-shared-executor-dispatch-fallback-fragment/reuse-the-shared-executor-dispatch-fallback-fragment.md` | 6 | 6239 |  |
| `docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md` | 11 | 13958 |  |
| `docs/knowledge/how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md` | 3 | 7483 |  |
| `docs/knowledge/how-to-see-done-items-in-fgos-list-fgos-triage/see-done-items-in-list-and-triage.md` | 7 | 6392 |  |
| `docs/knowledge/how-to-self-resolve-a-merge-block-reported-as-verify-timeout/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md` | 3 | 5355 |  |
| `docs/knowledge/how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md` | 3 | 4409 |  |
| `docs/knowledge/how-to-sweep-the-clarify-decompose-backlog-with-fgos-discove/sweep-the-clarify-decompose-backlog-with-discover-loop.md` | 0 | 4036 |  |
| `docs/knowledge/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt/tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md` | 1 | 3796 |  |
| `docs/knowledge/how-to-unify-two-independently-written-working-tree-clean-ch/unify-a-duplicated-clean-tree-check-across-return-and-approve.md` | 4 | 6093 |  |
| `docs/knowledge/how-to-verify-herdr-cockpit-reuses-its-existing-tab-instead/verify-herdr-cockpit-reuses-existing-tab-instead-of-losing-one.md` | 2 | 3404 |  |
| `docs/knowledge/how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md` | 7 | 7408 |  |
| `docs/knowledge/how-to-wire-a-headless-function-through-an-agent-executor-ex/wire-a-headless-function-through-an-agent-executor-executor.md` | 5 | 6342 |  |
| `docs/knowledge/how-to-write-a-doctor-check-that-detects-real-shell-function/write-a-doctor-check-that-detects-real-shell-function-breakage.md` | 5 | 5325 |  |
| `docs/knowledge/how-to-write-a-task-spec/write-a-task-spec.md` | 1 | 3363 |  |

Batch 074 — owner `docs/knowledge`: 25 files / 44 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/judge-fail-safe-debug-log/judge-fail-safe-debug-log-fields.md` | 2 | 6903 |  |
| `docs/knowledge/judging-real-test-duplication-vs-superficially-similar-tests/judging-real-test-duplication.md` | 1 | 6256 |  |
| `docs/knowledge/keep-a-real-fs-writing-integration-test-from-leaving-a-track/keep-a-real-fs-writing-integration-test-from-leaving-a-tracked-file-dirty.md` | 1 | 3995 |  |
| `docs/knowledge/keeping-a-multi-file-small-edit-item-unsplit-because-each-ch/tiny-multi-file-edits-stay-one-item-when-split-overhead-exceeds-the-work.md` | 3 | 3883 |  |
| `docs/knowledge/launch-claude-in-a-new-herdr-pane-from-a-plugin/launch-claude-in-a-new-herdr-pane-from-a-plugin.md` | 0 | 7006 |  |
| `docs/knowledge/make-a-fail-safe-catch-block-visible-without-breaking-it/make-a-fail-safe-catch-block-visible-without-breaking-it.md` | 2 | 3222 |  |
| `docs/knowledge/make-a-hardcoded-stage-check-domain-aware-via-stageforstep/make-discover-decompose-domain-aware-via-stageforstep.md` | 0 | 8118 |  |
| `docs/knowledge/merge-loop-and-merge-next-self-run-fgos-catchup-on-a-merge-c/recover-from-a-merge-loop-merge-conflict-block-by-running-fgos-catchup.md` | 3 | 5656 |  |
| `docs/knowledge/picknextdiscoveritem-s-real-sort-key-order/discover-pool-pick-next-sort-key-order.md` | 0 | 3262 |  |
| `docs/knowledge/poll-fgos-cli-data-from-a-rust-plugin/poll-fgos-cli-data-from-a-rust-plugin.md` | 0 | 4924 |  |
| `docs/knowledge/produce-failing-test-first-proof-for-an-iron-law-gated-diff/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` | 3 | 10314 |  |
| `docs/knowledge/rankimpact-s-real-sort-key-order/rankimpact-sort-key-order.md` | 1 | 1679 |  |
| `docs/knowledge/reconcile-a-strategic-backlog-row-against-real-execution-sta/reconcile-a-strategic-backlog-row-against-real-execution-state.md` | 6 | 4221 |  |
| `docs/knowledge/recordgateapprove-s-real-contract/recordgateapprove-contract.md` | 0 | 3502 |  |
| `docs/knowledge/reverse-fgos-setup-s-wiring-with-fgos-uninstall/uninstall-fgos-wiring.md` | 0 | 2438 |  |
| `docs/knowledge/scaffold-and-link-a-herdr-plugin/scaffold-and-link-a-herdr-plugin.md` | 2 | 6934 |  |
| `docs/knowledge/set-or-clear-a-work-item-s-parent-lineage-via-cli/set-or-clear-a-work-items-parent-lineage-via-cli.md` | 0 | 3707 |  |
| `docs/knowledge/shell-fallback-detection-needs-type-p-not-command-v/shell-fallback-detection-needs-type-p-not-command-v.md` | 0 | 2459 |  |
| `docs/knowledge/spec-docs-drift-silently-when-only-the-code-has-an-exact-mat/spec-docs-drift-silently-when-only-code-has-an-exact-match-test.md` | 4 | 5967 |  |
| `docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md` | 3 | 1373 |  |
| `docs/knowledge/submit-a-work-item-with-a-known-verify-command/submit-a-work-item-with-a-known-verify-command.md` | 0 | 2190 |  |
| `docs/knowledge/sync-an-fgos-item-whose-fix-already-shipped-outside-the-norm/sync-a-fgos-item-whose-fix-already-shipped-outside-the-normal-lifecycle.md` | 2 | 4192 |  |
| `docs/knowledge/test-suite-legibility-dedup-cleanup-before-after-numbers/test-suite-legibility-cleanup-numbers.md` | 3 | 2211 |  |
| `docs/knowledge/the-9-findings-from-the-2026-08-14-fable-code-review-audit-o/worktree-merge-lifecycle-audit-260814-findings.md` | 3 | 4755 |  |
| `docs/knowledge/the-9-findings-from-the-2026-08-14-haiku-scan-fable-code-rev/gateway-subsystem-audit-260814-findings.md` | 5 | 4183 |  |

Batch 075 — owner `docs/knowledge`: 25 files / 63 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/the-coding-classify-intake-executor-s-full-lifecycle-created/coding-classify-intake-executor-lifecycle-created-then-retired-as-dead-config.md` | 5 | 11369 |  |
| `docs/knowledge/the-fgos-gateway-http-json-api-contract-ctr010-its-scope-and/fgos-gateway-api-ctr010.md` | 4 | 4353 |  |
| `docs/knowledge/the-schema-shape-of-the-backlog-work-item-status-statuses-tr/backlog-status-schema.md` | 1 | 3974 |  |
| `docs/knowledge/tool-registry-capability-lookup-is-a-prose-contract-not-comp/tool-registry-capability-is-a-prose-contract-not-compiled-logic.md` | 2 | 6755 |  |
| `docs/knowledge/tsk-3mv-feature-summary-teaching-merge-loop-to-self-resolve/merge-loop-self-resolve-feature-summary.md` | 7 | 5610 |  |
| `docs/knowledge/use-force-to-clear-a-red-first-verify-disagreement-at-clarif/use-force-to-clear-a-red-first-verify-disagreement-at-clarify.md` | 3 | 5409 |  |
| `docs/knowledge/verify-cost-audit-real-pick-return-approve-cycle-counts/verify-cost-audit-pick-return-approve-cycle-counts.md` | 2 | 5291 |  |
| `docs/knowledge/walking-a-heavy-fgos-item-through-exploring-a-3-child-split/walking-a-heavy-item-through-a-3-child-split.md` | 7 | 8998 |  |
| `docs/knowledge/whether-fgos-uninstall-remove-package-can-reliably-remove-it/fgos-self-uninstall-package-removal-spike.md` | 2 | 3621 |  |
| `docs/knowledge/why-a-clean-npm-test-run-missed-16-edge-gaps-after-the-lifec/why-a-clean-npm-test-run-missed-16-edge-gaps-after-the-lifecycle-rebuild.md` | 5 | 19091 |  |
| `docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md` | 3 | 4683 |  |
| `docs/knowledge/why-a-leaf-claim-can-now-be-refused-and-why-status-done-alre/pick-leaf-fork-and-sibling-merge-guard.md` | 4 | 4678 |  |
| `docs/knowledge/why-a-leaf-to-root-approve-no-longer-requires-the-shared-mai/why-a-leaf-to-root-approve-no-longer-gates-on-the-shared-checkout-being-clean.md` | 3 | 5277 |  |
| `docs/knowledge/why-a-pass-through-non-split-item-s-designed-proof-surface-c/why-fgos-coding-planning-writes-a-pass-through-items-real-verify-before-handoff.md` | 1 | 7199 |  |
| `docs/knowledge/why-a-per-stage-exception-in-the-driver-meant-that-stage-had/why-a-per-stage-exception-in-the-driver-meant-that-stage-had-no-owner.md` | 0 | 4000 |  |
| `docs/knowledge/why-a-real-trip-and-acknowledge-event-recordironlawacknowled/why-iron-law-acknowledge-writes-its-own-event-not-just-a-warn-log.md` | 0 | 1869 |  |
| `docs/knowledge/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias.md` | 3 | 8456 |  |
| `docs/knowledge/why-a-session-driven-root-s-fgw-rootid-branch-may-not-exist/why-createdetachedmergeworktree-crashed-for-session-driven-roots.md` | 2 | 5788 |  |
| `docs/knowledge/why-a-single-done-status-split-into-delivered-retrospective/why-done-split-into-delivered-retrospective-cleanup-done.md` | 3 | 21804 |  |
| `docs/knowledge/why-a-verify-command-cannot-itself-mutate-live-work-state/why-a-verify-command-cannot-mutate-live-work-state.md` | 1 | 3467 |  |
| `docs/knowledge/why-a-work-branch-must-never-be-git-checkout-d-directly-on-t/direct-branch-checkout-on-main-checkout-instead-of-worktree.md` | 4 | 6162 |  |
| `docs/knowledge/why-a-work-item-s-id-is-tsk-hash-not-a-bare-hash/id-generation-design.md` | 1 | 2357 |  |
| `docs/knowledge/why-a-work-item-whose-whole-content-is-a-fgos-state-mutation/pure-fgos-state-items-cannot-close-through-return.md` | 0 | 5174 |  |
| `docs/knowledge/why-abortmergeifpossible-checks-merge-head-before-aborting/why-abortmergeifpossible-checks-merge-head-before-aborting.md` | 0 | 3667 |  |
| `docs/knowledge/why-acquiremaincheckoutlock-s-release-on-exit-is-opt-in-neve/main-checkout-lock-release-on-exit-opt-in.md` | 0 | 4466 |  |

Batch 076 — owner `docs/knowledge`: 25 files / 49 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-an-is-ancestor-of-main-verify-check-can-never-pass-throu/why-an-is-ancestor-of-main-verify-check-can-never-pass-through-fgos-approve.md` | 1 | 3053 |  |
| `docs/knowledge/why-approve-blocks-closing-a-milestone-with-drifted-targets/why-approve-blocks-closing-a-milestone-with-drifted-targets.md` | 1 | 3992 |  |
| `docs/knowledge/why-approve-checks-acceptance-evidence-before-merging-not-af/why-approve-checks-acceptance-evidence-before-merging-not-after.md` | 1 | 5664 |  |
| `docs/knowledge/why-approve-logs-post-success-movework-faults-outside-events/why-approve-logs-post-success-movework-faults-outside-events-lock.md` | 0 | 5261 |  |
| `docs/knowledge/why-approve-s-iron-law-gate-scopes-changedfiles-to-the-leaf/why-approves-iron-law-gate-scopes-changedfiles-to-the-leafs-own-root.md` | 3 | 4672 |  |
| `docs/knowledge/why-auto-decompose-children-now-carry-action-read-first-dire/why-auto-decompose-children-carry-action-and-read-first-directive-prose.md` | 2 | 6966 |  |
| `docs/knowledge/why-auto-launched-herdr-panes-must-be-labeled-before-spawnin/why-auto-launched-herdr-panes-must-be-labeled-before-spawning-claude.md` | 2 | 9132 |  |
| `docs/knowledge/why-awaiting-approval-became-an-overridable-ceiling-not-a-ha/why-awaiting-approval-became-an-overridable-ceiling.md` | 0 | 4028 |  |
| `docs/knowledge/why-backlog-is-a-new-global-status-before-todo-not-a-domain/why-backlog-is-a-new-global-status-before-todo-not-a-domain-relabel.md` | 0 | 6208 |  |
| `docs/knowledge/why-bee-prefixed-identifiers-became-fgos-prefixed-and-some-d/why-bee-prefixed-identifiers-became-fgos-prefixed.md` | 4 | 5027 |  |
| `docs/knowledge/why-checkmergestillresolves-can-false-positive-after-a-root/why-checkmergestillresolves-can-false-positive-after-a-root-branch-prune.md` | 5 | 18137 |  |
| `docs/knowledge/why-checkretrospectivecontent-s-cleanup-to-done-gate-reads-o/why-the-retrospective-content-gate-checked-the-wrong-fields.md` | 1 | 7886 |  |
| `docs/knowledge/why-claimwork-s-cas-reread-stays-while-its-one-redundant-ful/why-claimworks-cas-reread-stays-while-its-redundant-full-log-read-was-deduped.md` | 3 | 4562 |  |
| `docs/knowledge/why-clarify-split-into-clarify-discovery-and-exploring/why-clarify-split-into-clarify-discovery-and-exploring.md` | 5 | 26122 |  |
| `docs/knowledge/why-cleanup-loop-has-no-iteration-cap-unlike-discover-loop/why-cleanup-loop-has-no-iteration-cap-unlike-discover-loop.md` | 1 | 4880 |  |
| `docs/knowledge/why-context-md-enforcement-is-scoped-to-b-or-c-and-why-it-s/context-md-enforcement-scope.md` | 4 | 4900 |  |
| `docs/knowledge/why-cook-and-pick-were-retrofitted-to-call-fgos-coding-drivi/why-cook-and-pick-were-retrofitted-to-call-fgos-coding-driving.md` | 0 | 3620 |  |
| `docs/knowledge/why-cook-s-never-auto-approve-prose-lost-to-gate-bypass/why-cooks-never-auto-approve-prose-lost-to-gate-bypass.md` | 3 | 4478 |  |
| `docs/knowledge/why-decide-for-execute-for-impact-analysis-reported-unavaila/why-capacity-for-and-capability-fields-were-unified-and-mcp-tools-get-a-hand-back.md` | 1 | 2948 |  |
| `docs/knowledge/why-decisions-already-locked-and-approved-by-a-person-still/decision-record.md` | 2 | 2933 |  |
| `docs/knowledge/why-decompose-checks-footprint-overlap-before-creating-child/why-decompose-checks-footprint-overlap-before-creating-children.md` | 2 | 7375 |  |
| `docs/knowledge/why-decompose-s-skip-and-advance-is-narrower-than-discovery/why-decomposes-skip-and-advance-is-narrower-than-discoverys.md` | 0 | 7769 |  |
| `docs/knowledge/why-discover-loop-s-pool-ordering-and-stop-rules-diverge-fro/discover-loop-pool-ordering-and-stop-rules.md` | 3 | 13377 |  |
| `docs/knowledge/why-discover-was-rewritten-as-a-clean-enrich-self-research-r/why-discover-was-rewritten-as-a-clean-enrich-self-research-recipe.md` | 0 | 6559 |  |
| `docs/knowledge/why-dispatch-binding-moved-from-name-keying-to-needs-for-cap/dispatch-binding-moves-from-name-keying-to-needs-for-capability-declaration.md` | 5 | 9020 |  |

Batch 077 — owner `docs/knowledge`: 25 files / 68 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-disposable-worktrees-need-their-own-dependency-install/disposable-worktree-dependency-provisioning.md` | 0 | 3611 |  |
| `docs/knowledge/why-docs-index-preserves-a-doc-s-prior-id-when-the-store-is/docs-index-preserves-prior-id-when-the-store-is-unreachable.md` | 2 | 5350 |  |
| `docs/knowledge/why-doctor-checks-are-documented-as-an-open-registry-not-a-f/why-doctor-checks-are-documented-as-an-open-registry-not-a-fixed-list.md` | 4 | 3461 |  |
| `docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md` | 6 | 27023 |  |
| `docs/knowledge/why-execution-fan-out-reuses-computeschedule-not-selectwave/why-execution-fan-out-reuses-computeschedule-instead-of-selectwave.md` | 8 | 20444 |  |
| `docs/knowledge/why-executor-aware-backend-dispatch-exists/agent-executor-executor-aware-dispatch.md` | 4 | 5832 |  |
| `docs/knowledge/why-executor-dispatch-audits-record-command-alongside-provid/executor-dispatch-audit-records-command-not-just-provider-label.md` | 0 | 3237 |  |
| `docs/knowledge/why-fgos-add-items-landed-permanently-at-stage-executing-wit/why-fgos-add-defaulted-new-items-to-stage-executing-with-no-way-back.md` | 2 | 8150 |  |
| `docs/knowledge/why-fgos-add-now-caps-a-work-item-s-id-at-30-characters/long-work-item-ids-max-length-guard.md` | 0 | 7218 |  |
| `docs/knowledge/why-fgos-added-a-pre-commit-guard-refusing-a-staged-deletion/why-fgos-refuses-a-staged-fgos-deletion-at-commit-time.md` | 0 | 4492 |  |
| `docs/knowledge/why-fgos-added-sync-root-and-drift-detection/why-fgos-added-sync-root-and-drift-detection.md` | 2 | 13596 |  |
| `docs/knowledge/why-fgos-answer-s-real-resume-behavior-is-statusatask-rather/why-fgos-answer-resumes-to-statusatask-not-always-todo.md` | 1 | 2443 |  |
| `docs/knowledge/why-fgos-approve-distinguishes-a-pre-existing-merge-head-fro/why-fgos-approve-distinguishes-a-pre-existing-merge-head-from-its-own-conflict.md` | 3 | 6810 |  |
| `docs/knowledge/why-fgos-approve-refuses-a-leaf-merging-into-an-already-reso/why-approve-refuses-a-leaf-merging-into-an-already-resolved-root.md` | 0 | 5464 |  |
| `docs/knowledge/why-fgos-catchup-needed-its-own-already-caught-up-guard/why-catchup-needed-its-own-already-caught-up-guard.md` | 3 | 4345 |  |
| `docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md` | 3 | 5237 |  |
| `docs/knowledge/why-fgos-cleanup-next-keeps-exit-code-classification-instead/why-cleanup-next-keeps-exit-code-classification-instead-of-a-driver-call.md` | 1 | 3411 |  |
| `docs/knowledge/why-fgos-coding-compounding-s-retrospective-synthesis-commit/why-fgos-compounding-refuses-to-commit-when-merge-head-is-set.md` | 1 | 8466 |  |
| `docs/knowledge/why-fgos-coding-driving-s-title-description-print-lives-in-o/why-fgos-coding-drivings-title-description-print-lives-in-one-shared-place.md` | 1 | 4055 |  |
| `docs/knowledge/why-fgos-coding-planning-and-fgos-coding-validating-merged-t/why-planning-and-validating-collapsed-into-one-co-adjustment-gate.md` | 8 | 17206 |  |
| `docs/knowledge/why-fgos-coding-planning-s-mode-gate-moved-to-fgos-routing-a/why-fgos-planning-moved-mode-gate-to-fgos-routing.md` | 3 | 12532 |  |
| `docs/knowledge/why-fgos-coding-planning-writes-docsref-immediately-after-cr/why-fgos-coding-planning-writes-docsref-when-it-self-creates-a-feature-dir.md` | 7 | 3535 |  |
| `docs/knowledge/why-fgos-cut-specific-state-runner-import-edges-consolidated/why-state-and-runner-import-edges-were-cut-and-cli-logic-moved-to-a-use-case-layer.md` | 1 | 4064 |  |
| `docs/knowledge/why-fgos-detects-post-land-drift-among-sibling-leaves-by-int/why-post-land-drift-detection-intersects-real-changed-paths-not-declared-footprint.md` | 3 | 4119 |  |
| `docs/knowledge/why-fgos-discover-could-overwrite-an-already-locked-verify-c/discovery-decompose-reporoot-verify-overwrite.md` | 5 | 10881 |  |

Batch 078 — owner `docs/knowledge`: 25 files / 59 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-fgos-discover-next-shrank-to-a-picker/why-discover-next-shrank-to-a-picker.md` | 2 | 4242 |  |
| `docs/knowledge/why-fgos-discover-now-trusts-a-locked-context-md-instead-of/fgos-discover-trusts-a-locked-context-instead-of-blind-rejudging.md` | 1 | 4839 |  |
| `docs/knowledge/why-fgos-dispatch-splits-into-gather-packets-with-a-second-e/why-fgos-dispatch-splits-into-gather-packets-and-a-gated-exec-packet.md` | 3 | 7539 |  |
| `docs/knowledge/why-fgos-doctor-s-checktoolregistryconfigured-now-reports-fa/why-doctor-now-fails-on-a-degraded-impact-analysis-tool-instead-of-passing.md` | 0 | 2223 |  |
| `docs/knowledge/why-fgos-doctor-setup-uninstall-resolve-the-real-main-checko/why-doctor-setup-and-uninstall-had-to-resolve-the-real-main-checkout-not-raw-cwd.md` | 1 | 3244 |  |
| `docs/knowledge/why-fgos-events-jsonl-can-silently-lose-lines-under-concurre/events-jsonl-lost-update-race-under-concurrent-session-writes.md` | 7 | 14958 |  |
| `docs/knowledge/why-fgos-fanout-treats-a-dispatched-agent-s-worktree-isolati/why-fanouts-worktree-isolation-race-is-a-recoverable-self-heal-not-a-lowered-batch-cap.md` | 1 | 7009 |  |
| `docs/knowledge/why-fgos-fgos-runner-died-in-every-agent-shell/harness-shell-snapshot-strips-underscore-prefixed-helper-functions.md` | 5 | 5097 |  |
| `docs/knowledge/why-fgos-install-moved-from-always-pulling-main-head-to-a-ta/why-fgos-install-is-pinned-to-a-semver-tag-instead-of-main-head.md` | 2 | 3457 |  |
| `docs/knowledge/why-fgos-keeps-growing-the-same-decision-logic-in-more-than/fgos-choke-point-pattern.md` | 5 | 3471 |  |
| `docs/knowledge/why-fgos-main-checkout-lock-could-report-ambiguous-with-no-r/main-checkout-lock-toctou-race.md` | 3 | 3251 |  |
| `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md` | 1 | 3640 |  |
| `docs/knowledge/why-fgos-merge-next-now-auto-syncs-a-clean-blockedonsync-roo/why-merge-next-auto-syncs-blockedonsync-roots.md` | 4 | 8288 |  |
| `docs/knowledge/why-fgos-merge-now-refuses-outside-the-main-checkout/why-fgos-merge-now-refuses-outside-the-main-checkout.md` | 0 | 4466 |  |
| `docs/knowledge/why-fgos-merge-throughput-bottlenecked-despite-parallel-disp/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md` | 7 | 9895 |  |
| `docs/knowledge/why-fgos-move-gained-an-answer-flag-closing-the-last-unreach/why-move-needed-an-answer-flag-to-reach-wontfix-from-awaiting-human.md` | 0 | 1796 |  |
| `docs/knowledge/why-fgos-move-to-awaiting-approval-refuses-a-doing-item-with/why-fgos-move-refuses-awaiting-approval-from-doing-without-skip-return-guard.md` | 0 | 5382 |  |
| `docs/knowledge/why-fgos-moved-the-full-verify-run-from-the-merge-lock-s-out/why-verify-moved-from-the-merge-lock-to-catchups-inbound-gate.md` | 3 | 4962 |  |
| `docs/knowledge/why-fgos-now-gates-a-risk-heavy-item-from-reaching-delivered/why-a-heavy-risk-item-can-no-longer-reach-delivered-without-a-plan-md.md` | 3 | 2537 |  |
| `docs/knowledge/why-fgos-refreshes-a-work-item-s-branch-base-at-pick-time-wh/why-pick-refreshes-a-commitless-branchs-base-but-never-touches-a-worked-one.md` | 3 | 3601 |  |
| `docs/knowledge/why-fgos-requires-a-gate-ask-question-to-restate-its-own-con/why-gate-questions-must-be-self-sufficient-and-mechanically-checked-for-it.md` | 1 | 3948 |  |
| `docs/knowledge/why-fgos-retired-fgos-runner-json-entirely-instead-of-fixing/why-fgos-retired-the-fgos-runner-json-legacy-config-fallback.md` | 3 | 5852 |  |
| `docs/knowledge/why-fgos-retro-loop-restores-the-compound-verb-instead-of-in/fgos-retro-loop-and-the-restored-compound-verb.md` | 2 | 5544 |  |
| `docs/knowledge/why-fgos-retro-next-shrank-to-a-launcher/why-retro-next-shrank-to-a-launcher.md` | 1 | 3687 |  |
| `docs/knowledge/why-fgos-review-crashed-with-enobufs-on-very-stale-branch-di/why-fgos-review-crashed-with-enobufs-on-stale-branch-diffs.md` | 1 | 4877 |  |

Batch 079 — owner `docs/knowledge`: 25 files / 68 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-fgos-s-automatic-capture-records-the-what-but-not-the-wh/fgos-capture-points-and-the-why-gap.md` | 4 | 10135 |  |
| `docs/knowledge/why-fgos-s-concurrency-tests-batch-spawned-processes-to-redu/why-concurrency-tests-batch-processes-instead-of-a-fixed-lock-timeout.md` | 1 | 3944 |  |
| `docs/knowledge/why-fgos-s-d-id-rul-id-adr-citations-must-carry-a-one-line-g/why-fgos-citations-carry-a-gloss-and-check-mechanically.md` | 7 | 13256 |  |
| `docs/knowledge/why-fgos-s-merge-safety-work-shipped-as-ten-items-under-one/why-fgos-merge-safety-shipped-as-ten-items-under-one-milestone.md` | 0 | 3945 |  |
| `docs/knowledge/why-fgos-started-recording-mergedsha-and-mergedinto-on-the-d/why-delivered-events-now-record-real-merge-provenance-instead-of-being-inferred.md` | 3 | 5707 |  |
| `docs/knowledge/why-fgos-sync-root-fgos-merge-next-and-fgos-review-resolve-c/why-merge-next-and-sync-root-resolve-verify-timeout-after-their-guards.md` | 0 | 6744 |  |
| `docs/knowledge/why-fgos-treats-self-development-as-a-bounded-lane-with-its/why-fgos-self-development-is-not-the-default-mission.md` | 5 | 2491 |  |
| `docs/knowledge/why-fgos-uninstall-shipped-as-two-pieces/fgos-uninstall-feature-overview.md` | 5 | 3228 |  |
| `docs/knowledge/why-fgos-unlock-s-error-message-stopped-claiming-a-live-sess/why-fgos-unlocks-error-message-stopped-claiming-a-live-session-it-never-checked.md` | 1 | 2567 |  |
| `docs/knowledge/why-fgos-worktrees-block-fgos-instead-of-locking-or-copying/worktree-isolation-axis-decision.md` | 8 | 4797 |  |
| `docs/knowledge/why-gate-approval-was-separated-from-move-next/why-gate-approval-was-separated-from-move-next.md` | 0 | 6896 |  |
| `docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md` | 3 | 19791 |  |
| `docs/knowledge/why-heavy-keywords-matching-moved-from-substring-to-word-bou/why-heavy-keywords-matching-moved-to-word-boundaries.md` | 5 | 6774 |  |
| `docs/knowledge/why-herdr-cockpit-stacked-worker-launches-into-a-single-reus/why-herdr-cockpit-stacked-worker-launches-into-one-pane.md` | 4 | 6242 |  |
| `docs/knowledge/why-herdr-plugin-s-discover-pane-launches-always-pass-autocl/why-herdr-plugins-discover-pane-launches-always-pass-autoclose.md` | 2 | 3049 |  |
| `docs/knowledge/why-herdr-s-dashboard-lists-became-real-tables-and-why-in-pr/herdr-dashboard-table-view-scope-and-sort.md` | 1 | 5033 |  |
| `docs/knowledge/why-hook-registrations-guard-against-gitignored-scripts/hook-registration-guard.md` | 1 | 3320 |  |
| `docs/knowledge/why-intake-classification-moved-to-after-clarify-and-back-to/intake-classification-moves-after-clarify-and-back-to-the-owning-domain.md` | 2 | 6575 |  |
| `docs/knowledge/why-isdepsandlineageready-uses-resolved-statuses-not-just-do/why-isdepsandlineageready-uses-resolved-statuses-not-just-done.md` | 0 | 3259 |  |
| `docs/knowledge/why-judgediscovery-judgedecompose-run-a-second-independent-j/judge-verdict-second-pass-semantic-check.md` | 3 | 21992 |  |
| `docs/knowledge/why-keywordriskgate-now-skips-the-heavy-risk-ask-when-a-verd/keywordriskgate-skips-when-verdict-cites-a-locked-decision.md` | 2 | 5718 |  |
| `docs/knowledge/why-locking-a-new-risk-kind-vocabulary-didn-t-fix-the-68-ite/why-a-vocabulary-lock-alone-cant-fix-grandfathered-risk-and-kind-values.md` | 2 | 4882 |  |
| `docs/knowledge/why-main-checkout-hook-wired-reported-a-false-negative-on-an/why-main-checkout-hook-wired-compared-raw-strings-instead-of-resolved-paths.md` | 3 | 5246 |  |
| `docs/knowledge/why-malformed-cli-invocations-now-leave-a-provenance-trace/cli-invocation-fault-provenance.md` | 0 | 6077 |  |
| `docs/knowledge/why-merge-loop-self-diagnoses-only-verify-fail-post-merge-ne/merge-loop-self-diagnoses-verify-fail-post-merge.md` | 6 | 5929 |  |

Batch 080 — owner `docs/knowledge`: 25 files / 30 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-merge-s-ephemeral-worktree-checks-out-a-scratch-ref-not/why-merge-checks-out-a-scratch-ref-instead-of-the-real-branch-name.md` | 4 | 15755 |  |
| `docs/knowledge/why-merge-standardization-tsk-4j9-reuses-existing-mechanisms/why-merge-standardization-reuses-existing-mechanisms.md` | 2 | 4893 |  |
| `docs/knowledge/why-mergereadiness-excludes-superseded-items/why-mergereadiness-excludes-superseded-items.md` | 1 | 5028 |  |
| `docs/knowledge/why-mergerunneritem-now-checks-ancestry-before-attempting-a/merge-idempotent-on-already-merged-branch.md` | 1 | 5488 |  |
| `docs/knowledge/why-mergerunneritem-returns-merge-failed-unclassified-instea/why-mergerunneritem-returns-merge-failed-unclassified-instead-of-crashing.md` | 1 | 6479 |  |
| `docs/knowledge/why-mergerunneritem-s-already-merged-fast-path-checks-conten/why-mergerunneritems-already-merged-fast-path-checks-content-not-just-ancestry.md` | 0 | 5849 |  |
| `docs/knowledge/why-mergerunneritem-s-commit-failure-error-now-carries-git-s/why-mergeruneritems-commit-failure-error-now-carries-gits-real-stderr.md` | 1 | 3334 |  |
| `docs/knowledge/why-mergerunneritem-takes-a-separate-lockroot-param/why-mergerunneritem-takes-a-separate-lockroot-param.md` | 0 | 4986 |  |
| `docs/knowledge/why-mergesets-groups-conflicts-instead-of-dropping-them-from/why-mergesets-groups-conflicts-instead-of-dropping-them-from-ready.md` | 0 | 4491 |  |
| `docs/knowledge/why-mergetree-groups-by-parent-and-sorts-recursively-by-bloc/why-mergetree-groups-by-parent-and-sorts-recursively-by-blocks.md` | 3 | 6375 |  |
| `docs/knowledge/why-plan-mjs-s-refined-pass-skips-its-priority-write-when-a/why-plan-mjs-refined-pass-skips-priority-when-a-human-override-decision-exists.md` | 0 | 4252 |  |
| `docs/knowledge/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout.md` | 2 | 3231 |  |
| `docs/knowledge/why-promote-engine-merges-members-instead-of-rebasing-them/why-promote-engine-merges-members-instead-of-rebasing-them.md` | 1 | 5276 |  |
| `docs/knowledge/why-promote-preflight-uses-git-merge-tree-instead-of-a-real/why-promote-preflight-uses-git-merge-tree-instead-of-a-real-merge.md` | 1 | 4878 |  |
| `docs/knowledge/why-promote-to-component-reports-merged-parent-rejected-sepa/why-promote-to-component-reports-merged-parent-rejected-separately.md` | 1 | 4121 |  |
| `docs/knowledge/why-promote-to-component-restructures-git-before-writing-par/why-promote-to-component-restructures-git-before-writing-parent-state.md` | 0 | 5470 |  |
| `docs/knowledge/why-reclaiming-an-orphaned-worktree-checkout-must-check-for/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md` | 0 | 3278 |  |
| `docs/knowledge/why-reclaimorphanedcheckout-refuses-a-checkout-the-calling-s/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md` | 1 | 4462 |  |
| `docs/knowledge/why-register-a-finished-item-into-the-merge-list-needs-no-ne/merge-ready-registration-is-already-idempotent.md` | 2 | 3242 |  |
| `docs/knowledge/why-resolvediscovery-guards-re-parking-an-already-parked-ite/why-resolvediscovery-guards-re-parking-an-already-parked-item.md` | 0 | 3396 |  |
| `docs/knowledge/why-resolveplan-s-decompose-verdict-no-longer-treats-the-pre/why-a-partially-materialized-decompose-no-longer-locks-out-the-remaining-children.md` | 1 | 4302 |  |
| `docs/knowledge/why-resolveplan-s-pass-through-path-now-checks-planapproveve/why-resolveplans-pass-through-path-now-checks-planapproveverify-before-executing.md` | 1 | 5850 |  |
| `docs/knowledge/why-retrospective-documents-vanished-on-orphaned-branches/why-retrospective-documents-vanished-on-orphaned-branches.md` | 1 | 5059 |  |
| `docs/knowledge/why-return-s-blocked-friction-hint-checks-real-output-not-th/why-returns-blocked-friction-hints-at-a-fgos-dependent-verify-by-output-not-string-match.md` | 2 | 3492 |  |
| `docs/knowledge/why-runner-config-splits-capability-curated-vocab-executor-n/why-capability-executor-and-capacity-are-three-separate-concepts.md` | 4 | 12583 |  |

Batch 081 — owner `docs/knowledge`: 25 files / 109 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-session-claim-liveness-measures-worktree-activity-not-pi/why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md` | 5 | 6036 |  |
| `docs/knowledge/why-splitting-test-files-hits-a-floor-and-why-narrowing-veri/why-splitting-test-files-hits-a-floor-and-narrowing-verify-never-helped.md` | 0 | 13673 |  |
| `docs/knowledge/why-src-runner-dispatch-mjs-s-capacity-executor-layer-was-re/why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md` | 3 | 9813 |  |
| `docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md` | 20 | 19262 |  |
| `docs/knowledge/why-state-json-became-an-incrementally-read-snapshot/why-state-json-became-an-incrementally-read-snapshot.md` | 4 | 4907 |  |
| `docs/knowledge/why-state-json-s-write-became-atomic-while-its-lock-scope-cl/why-state-json-writes-became-atomic-while-its-lock-scope-claim-turned-out-already-fixed.md` | 1 | 3491 |  |
| `docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md` | 9 | 22451 |  |
| `docs/knowledge/why-the-agy-cli-executor-needs-new-project-in-its-invocation/why-agy-dispatch-needed-new-project-and-still-isnt-fully-reliable.md` | 2 | 5833 |  |
| `docs/knowledge/why-the-decision-code-check-ratchets-against-a-baseline-inst/why-the-decision-code-check-ratchets-against-a-baseline-instead-of-blocking-everything.md` | 1 | 3559 |  |
| `docs/knowledge/why-the-decision-id-collision-auto-resolver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md` | 8 | 6102 |  |
| `docs/knowledge/why-the-dispatch-gate-widened-to-kind-task-and-mechanism-val/dispatch-gate-widens-to-kind-not-task-and-mechanism-renames-to-process-location.md` | 0 | 3603 |  |
| `docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md` | 6 | 7146 |  |
| `docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md` | 4 | 3951 |  |
| `docs/knowledge/why-the-herdr-fgos-dashboard-shipped-as-three-sequential-chi/herdr-fgos-dashboard-three-piece-build.md` | 2 | 6582 |  |
| `docs/knowledge/why-the-herdr-web-dashboard-gateway-s-cloudflare-access-jwt/why-cloudflare-access-is-an-additive-second-auth-layer-not-a-replacement.md` | 2 | 3240 |  |
| `docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md` | 8 | 12820 |  |
| `docs/knowledge/why-the-install-packaging-e2e-test-replaced-a-byte-identical/why-the-install-packaging-e2e-test-checks-for-leaked-paths-not-a-byte-identical-fgos-snapshot.md` | 0 | 3263 |  |
| `docs/knowledge/why-the-iron-law-evidence-contract-gathers-proof-but-never-a/iron-law-evidence-contract-stays-human-gated.md` | 2 | 5161 |  |
| `docs/knowledge/why-the-iron-law-gate-only-runs-at-the-trunk-merge-boundary/why-the-iron-law-gate-only-fires-at-the-trunk-boundary.md` | 3 | 5155 |  |
| `docs/knowledge/why-the-judge-discovery-judge-decompose-capacity-entries-wer/why-the-judge-discovery-and-judge-decompose-capacities-were-removed.md` | 1 | 1516 |  |
| `docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md` | 6 | 3901 |  |
| `docs/knowledge/why-the-live-events-jsonl-corrupted-and-why-the-fix-needed-a/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md` | 10 | 6138 |  |
| `docs/knowledge/why-the-locked-decisions-heading-contract-between-plan-mjs-s/decision-record.md` | 9 | 8346 |  |
| `docs/knowledge/why-the-main-checkout-lock-hook-used-to-block-worktree-commi/why-the-main-checkout-lock-hook-used-to-block-worktree-commits.md` | 1 | 4779 |  |
| `docs/knowledge/why-the-main-checkout-lock-needs-a-heartbeat-during-merge-ve/why-the-main-checkout-lock-needs-a-heartbeat-during-merge-verify.md` | 2 | 8751 |  |

Batch 082 — owner `docs/knowledge`: 14 files / 42 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/knowledge/why-the-pre-commit-hook-got-its-own-shorter-main-checkout-lo/why-the-pre-commit-hook-got-its-own-shorter-lock-ttl.md` | 3 | 5322 |  |
| `docs/knowledge/why-the-stage-axis-driving-loop-and-status-axis-pool-sweep-s/why-the-stage-status-driving-split-decision-got-superseded.md` | 2 | 6410 |  |
| `docs/knowledge/why-the-tsk-51m-root-iron-law-evidence-file-recorded-a-test/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md` | 6 | 13406 |  |
| `docs/knowledge/why-the-work-item-lifecycle-keeps-status-and-stage-separate/work-item-lifecycle-and-domain-model.md` | 2 | 7914 |  |
| `docs/knowledge/why-withmergetargetslot-passes-allowselfrecognition-false-wh/why-the-merge-target-ref-slot-disabled-lock-self-recognition.md` | 1 | 12589 |  |
| `docs/knowledge/why-wontfix-had-to-join-done-at-every-is-this-resolved-check/wontfix-terminal-status-filter-consistency.md` | 1 | 7213 |  |
| `docs/knowledge/why-work-acceptance-gets-a-narrow-write-time-evidence-tracea/acceptance-evidence-traceability-gate.md` | 3 | 3871 |  |
| `docs/knowledge/why-work-item-titles-get-a-100-character-ceiling-at-the-stor/work-item-title-length-ceiling.md` | 0 | 5902 |  |
| `docs/knowledge/why-workflow-prose-gates-on-a-capability-query-not-a-hardcod/impact-analysis-capability-gate-replaces-hardcoded-gitnexus.md` | 1 | 11708 |  |
| `docs/knowledge/windows-npm-install-g-prefix-has-no-lib-or-bin-subfolder/windows-npm-global-install-has-no-lib-or-bin-subfolder.md` | 0 | 3150 |  |
| `docs/knowledge/work-item-pipeline-stages-verbs-actors-handoffs/work-item-pipeline-stages-verbs-and-handoffs.md` | 5 | 10536 |  |
| `docs/knowledge/work-item-priority-calculated-formula-and-intent-s-retiremen/priority-formula-and-intent-retirement.md` | 9 | 10646 |  |
| `docs/knowledge/worker-slot-concept-and-engine-wide-worker-occupancy-ceiling/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md` | 8 | 26182 |  |
| `docs/knowledge/worktree-dispatch-attestation-level-1-advisory-only-never-a/worktree-dispatch-attestation-level-1-advisory-only.md` | 1 | 10631 |  |

Batch 083 — owner `docs/platform/agent-confinement`: 4 files / 12 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-confinement/contracts/confinement-authority-v1.md` | 2 | 38085 |  |
| `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md` | 2 | 5694 |  |
| `docs/platform/agent-confinement/history/rollout-and-settled-facts.md` | 4 | 9440 |  |
| `docs/platform/agent-confinement/spec.md` | 4 | 47318 |  |

Batch 084 — owner `docs/platform/agent-coordination`: 25 files / 75 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/architecture/dispatch-control-plane.md` | 4 | 20241 |  |
| `docs/platform/agent-coordination/architecture/evidence-and-results.md` | 1 | 4730 |  |
| `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md` | 1 | 17108 |  |
| `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md` | 1 | 10660 |  |
| `docs/platform/agent-coordination/architecture/protocol-model.md` | 2 | 6221 |  |
| `docs/platform/agent-coordination/architecture/run-handle.md` | 2 | 20039 |  |
| `docs/platform/agent-coordination/architecture/runtime-model.md` | 2 | 4334 |  |
| `docs/platform/agent-coordination/architecture/runtime-recovery-design.md` | 1 | 22938 |  |
| `docs/platform/agent-coordination/architecture/visibility-and-herdr.md` | 1 | 7994 |  |
| `docs/platform/agent-coordination/architecture/work-integration.md` | 1 | 5573 |  |
| `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` | 2 | 22436 |  |
| `docs/platform/agent-coordination/contracts/workflow-stage-operation.md` | 1 | 4596 |  |
| `docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md` | 1 | 3397 |  |
| `docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md` | 1 | 2342 |  |
| `docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md` | 1 | 2784 |  |
| `docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md` | 1 | 2038 |  |
| `docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md` | 1 | 2666 |  |
| `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md` | 2 | 5958 |  |
| `docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md` | 1 | 4398 |  |
| `docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md` | 1 | 7944 |  |
| `docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md` | 1 | 15574 |  |
| `docs/platform/agent-coordination/history/documentation-migration/claim-preservation.md` | 2 | 1816 |  |
| `docs/platform/agent-coordination/history/documentation-migration/documentation-governance.md` | 1 | 6015 |  |
| `docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md` | 40 | 64938 | yes |
| `docs/platform/agent-coordination/history/documentation-migration/migration-status.md` | 3 | 4382 |  |

Batch 085 — owner `docs/platform/agent-coordination`: 3 files / 6 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/history/documentation-migration/phase-7-completion.md` | 2 | 2815 |  |
| `docs/platform/agent-coordination/history/documentation-migration/proof-preservation.md` | 2 | 1761 |  |
| `docs/platform/agent-coordination/history/documentation-migration/proposal-status.md` | 2 | 1815 |  |

Batch 086 — owner `docs/platform/agent-coordination`: 1 files / 469 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/history/documentation-migration/source-inventory.md` | 469 | 131125 | yes |

Batch 087 — owner `docs/platform/agent-coordination`: 25 files / 162 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/history/implementation-records/documentation-migration-2026-08-31.md` | 1 | 2642 |  |
| `docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md` | 18 | 12385 |  |
| `docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md` | 14 | 17824 |  |
| `docs/platform/agent-coordination/history/retired-engine/architecture/system-context.md` | 4 | 8035 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-continuation-recovery.md` | 4 | 21935 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md` | 9 | 9372 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/dispatch-control-plane.md` | 15 | 25272 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/evidence-and-results.md` | 4 | 4199 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/executor-health-and-fallback.md` | 4 | 15791 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/group-thinking-trigger-surface.md` | 5 | 17806 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/protocol-model.md` | 7 | 8545 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/run-handle.md` | 5 | 19393 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/runtime-model.md` | 7 | 5439 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/runtime-recovery-design.md` | 8 | 27397 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/system-context.md` | 7 | 7402 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/visibility-and-herdr.md` | 4 | 7936 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/work-integration.md` | 4 | 6217 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/contracts/assignment-run-runresult.md` | 4 | 21707 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md` | 10 | 86106 | yes |
| `docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md` | 8 | 46499 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/contracts/workflow-stage-operation.md` | 4 | 5401 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-001-work-lifecycle-authority.md` | 4 | 3547 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-002-stage-operation-compatibility.md` | 4 | 3447 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-003-assignment-run-runresult-separation.md` | 4 | 3439 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-004-reserve-job.md` | 4 | 3289 |  |

Batch 088 — owner `docs/platform/agent-coordination`: 25 files / 234 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-005-herdr-visibility-only.md` | 4 | 3325 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md` | 5 | 7390 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md` | 4 | 6298 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md` | 9 | 12398 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md` | 9 | 11543 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md` | 6 | 9583 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md` | 4 | 7700 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md` | 22 | 33688 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/dag-request-scheduler.md` | 6 | 41088 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/dispatch-control-plane-redesign.md` | 31 | 42264 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/semantic-cli-surface.md` | 5 | 5856 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md` | 4 | 44538 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md` | 17 | 77561 | yes |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md` | 4 | 16744 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-00-overview.md` | 15 | 56626 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-01-rollout.md` | 13 | 30939 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md` | 8 | 22499 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-03-assignment-runresult.md` | 11 | 27341 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md` | 7 | 12413 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md` | 4 | 11443 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md` | 5 | 8521 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/spec.md` | 13 | 7623 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/verification/implementation-alignment.md` | 6 | 3395 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/vision.md` | 15 | 19658 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/canonical-concepts.md` | 7 | 14950 |  |

Batch 089 — owner `docs/platform/agent-coordination`: 20 files / 210 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/concept-relationships.md` | 4 | 7115 |  |
| `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/deprecated-and-reserved.md` | 5 | 5704 |  |
| `docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/claim-preservation.md` | 33 | 15923 |  |
| `docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/proof-preservation.md` | 26 | 10490 |  |
| `docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/proposal-status.md` | 10 | 6859 |  |
| `docs/platform/agent-coordination/history/retired-engine/inbound/agent-coordination/history/documentation-migration/migration-status.md` | 8 | 5536 |  |
| `docs/platform/agent-coordination/history/retired-engine/inbound/intent-preservation-ledger.md` | 12 | 16220 |  |
| `docs/platform/agent-coordination/history/retired-engine/intent-preservation-ledger.md` | 21 | 35775 |  |
| `docs/platform/agent-coordination/history/retired-engine/legacy/architecture/system-context.md` | 6 | 6078 |  |
| `docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md` | 7 | 31872 |  |
| `docs/platform/agent-coordination/history/retired-engine/proposals/semantic-cli-surface.md` | 2 | 7006 |  |
| `docs/platform/agent-coordination/history/retired-engine/spec.md` | 25 | 13530 |  |
| `docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md` | 11 | 9697 |  |
| `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md` | 28 | 41339 |  |
| `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md` | 2 | 16084 |  |
| `docs/platform/agent-coordination/spec.md` | 4 | 7571 |  |
| `docs/platform/agent-coordination/vision.md` | 1 | 16165 |  |
| `docs/platform/agent-coordination/vocabulary/canonical-concepts.md` | 1 | 8196 |  |
| `docs/platform/agent-coordination/vocabulary/concept-relationships.md` | 2 | 5498 |  |
| `docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md` | 2 | 3700 |  |

Batch 090 — owner `docs/platform/agent-protocol`: 1 files / 1 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/agent-protocol/spec.md` | 1 | 14509 |  |

Batch 091 — owner `docs/platform/claude-plugin`: 1 files / 4 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/claude-plugin/spec.md` | 4 | 11817 |  |

Batch 092 — owner `docs/platform/coexistence`: 1 files / 8 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/coexistence/spec.md` | 8 | 8043 |  |

Batch 093 — owner `docs/platform/component-boundary.md`: 1 files / 39 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/component-boundary.md` | 39 | 101816 | yes |

Batch 094 — owner `docs/platform/contracts`: 1 files / 1 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/contracts/architecture-manifest.json` | 1 | 13283 |  |

Batch 095 — owner `docs/platform/convention`: 1 files / 1 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/convention/spec.md` | 1 | 26208 |  |

Batch 096 — owner `docs/platform/decision-citation-drift`: 1 files / 16 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/decision-citation-drift/spec.md` | 16 | 7339 |  |

Batch 097 — owner `docs/platform/distillery`: 1 files / 5 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/distillery/spec.md` | 5 | 8286 |  |

Batch 098 — owner `docs/platform/documentation`: 15 files / 191 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/documentation/architecture/documentation-system-design.md` | 12 | 20398 |  |
| `docs/platform/documentation/history/id-systems-audit.md` | 25 | 14455 |  |
| `docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md` | 82 | 63603 | yes |
| `docs/platform/documentation/history/templates/architecture.md` | 2 | 2315 |  |
| `docs/platform/documentation/history/templates/area-readme.md` | 1 | 4629 |  |
| `docs/platform/documentation/history/templates/contract.md` | 1 | 2017 |  |
| `docs/platform/documentation/history/templates/decision.md` | 0 | 1635 |  |
| `docs/platform/documentation/history/templates/discussion.md` | 0 | 1578 |  |
| `docs/platform/documentation/history/templates/generated.md` | 0 | 1398 |  |
| `docs/platform/documentation/history/templates/intent-preservation-ledger.md` | 0 | 2693 |  |
| `docs/platform/documentation/history/templates/spec.md` | 0 | 2219 |  |
| `docs/platform/documentation/history/templates/subcomponent-readme.md` | 0 | 3338 |  |
| `docs/platform/documentation/history/templates/verification.md` | 0 | 1615 |  |
| `docs/platform/documentation/history/templates/vision.md` | 0 | 2012 |  |
| `docs/platform/documentation/switchboard.md` | 68 | 13993 | yes |

Batch 099 — owner `docs/platform/domainization`: 1 files / 4 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/domainization/architecture/domainization.md` | 4 | 12153 |  |

Batch 100 — owner `docs/platform/event-store`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/event-store/spec.md` | 3 | 113730 | yes |

Batch 101 — owner `docs/platform/git`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/git/spec.md` | 2 | 271464 | yes |

Batch 102 — owner `docs/platform/governance.md`: 1 files / 10 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/governance.md` | 10 | 19443 |  |

Batch 103 — owner `docs/platform/herdr-web-dashboard`: 3 files / 40 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | 17 | 34956 |  |
| `docs/platform/herdr-web-dashboard/operations/operator-runbook.md` | 4 | 4227 |  |
| `docs/platform/herdr-web-dashboard/spec.md` | 19 | 22973 |  |

Batch 104 — owner `docs/platform/holder-lock`: 1 files / 4 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/holder-lock/spec.md` | 4 | 89194 | yes |

Batch 105 — owner `docs/platform/host-invocation-routing`: 25 files / 175 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/host-invocation-routing/architecture/external-provider-protocol.md` | 13 | 13564 |  |
| `docs/platform/host-invocation-routing/architecture/host-use-cases.md` | 3 | 4519 |  |
| `docs/platform/host-invocation-routing/architecture/invocation-kernel.md` | 4 | 4386 |  |
| `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md` | 15 | 17758 |  |
| `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` | 13 | 23764 |  |
| `docs/platform/host-invocation-routing/architecture/provider-routing.md` | 5 | 4798 |  |
| `docs/platform/host-invocation-routing/architecture/release-boundaries.md` | 9 | 15339 |  |
| `docs/platform/host-invocation-routing/contracts/command-route-descriptor.md` | 1 | 3587 |  |
| `docs/platform/host-invocation-routing/contracts/component-protocol.md` | 13 | 17761 |  |
| `docs/platform/host-invocation-routing/contracts/external-provider-manifest.md` | 3 | 3235 |  |
| `docs/platform/host-invocation-routing/contracts/legacy-payload.md` | 2 | 3777 |  |
| `docs/platform/host-invocation-routing/contracts/operation-catalog.md` | 2 | 3300 |  |
| `docs/platform/host-invocation-routing/contracts/operation-provider.md` | 1 | 3338 |  |
| `docs/platform/host-invocation-routing/contracts/operation-request-outcome.md` | 2 | 4029 |  |
| `docs/platform/host-invocation-routing/history/documentation-migration/documentation-standardization-plan.md` | 6 | 22496 |  |
| `docs/platform/host-invocation-routing/history/host-invocation-baseline.md` | 2 | 2648 |  |
| `docs/platform/host-invocation-routing/history/source-inventory.md` | 13 | 5623 |  |
| `docs/platform/host-invocation-routing/intent-preservation-ledger.md` | 51 | 34308 | yes |
| `docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md` | 0 | 1399 |  |
| `docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md` | 0 | 1360 |  |
| `docs/platform/host-invocation-routing/spec.md` | 2 | 32766 |  |
| `docs/platform/host-invocation-routing/verification/compatibility-harness.md` | 5 | 7254 |  |
| `docs/platform/host-invocation-routing/verification/implementation-alignment.md` | 2 | 11243 |  |
| `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md` | 2 | 5518 |  |
| `docs/platform/host-invocation-routing/verification/r2-external-process-proof.md` | 6 | 10956 |  |

Batch 106 — owner `docs/platform/host-invocation-routing`: 3 files / 27 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md` | 2 | 10951 |  |
| `docs/platform/host-invocation-routing/verification/source-preservation-audit.md` | 18 | 15798 |  |
| `docs/platform/host-invocation-routing/vision.md` | 7 | 5639 |  |

Batch 107 — owner `docs/platform/intent-preservation-ledger.md`: 1 files / 10 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/intent-preservation-ledger.md` | 10 | 17191 |  |

Batch 108 — owner `docs/platform/migration-authoring-rules.md`: 1 files / 15 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/migration-authoring-rules.md` | 15 | 5765 |  |

Batch 109 — owner `docs/platform/observe`: 2 files / 8 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/observe/decisions/observe-component-architecture.md` | 2 | 3732 |  |
| `docs/platform/observe/spec.md` | 6 | 19735 |  |

Batch 110 — owner `docs/platform/packaging-distribution`: 20 files / 161 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md` | 1 | 6776 |  |
| `docs/platform/packaging-distribution/architecture/future-constraints.md` | 2 | 6129 |  |
| `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` | 11 | 19443 |  |
| `docs/platform/packaging-distribution/code-panel-rollout-plan.md` | 2 | 19183 |  |
| `docs/platform/packaging-distribution/contracts/activation-binding.md` | 1 | 20626 |  |
| `docs/platform/packaging-distribution/contracts/distribution-pin.md` | 2 | 5863 |  |
| `docs/platform/packaging-distribution/contracts/projection-ledger.md` | 1 | 6861 |  |
| `docs/platform/packaging-distribution/contracts/release-manifest.md` | 2 | 13913 |  |
| `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md` | 3 | 15373 |  |
| `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` | 3 | 20006 |  |
| `docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md` | 0 | 3367 |  |
| `docs/platform/packaging-distribution/history/distribution-baseline.md` | 27 | 49005 |  |
| `docs/platform/packaging-distribution/history/distribution-vision.md` | 8 | 13780 |  |
| `docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md` | 20 | 14558 |  |
| `docs/platform/packaging-distribution/reports/track-closeout.md` | 9 | 12466 |  |
| `docs/platform/packaging-distribution/spec.md` | 27 | 99733 | yes |
| `docs/platform/packaging-distribution/verification/implementation-alignment.md` | 6 | 14320 |  |
| `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | 1 | 13448 |  |
| `docs/platform/packaging-distribution/verification/source-preservation-audit.md` | 32 | 17529 |  |
| `docs/platform/packaging-distribution/vision.md` | 3 | 6876 |  |

Batch 111 — owner `docs/platform/platform-foundations.md`: 1 files / 30 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/platform-foundations.md` | 30 | 21729 |  |

Batch 112 — owner `docs/platform/process`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/process/spec.md` | 3 | 18818 |  |

Batch 113 — owner `docs/platform/proposals`: 13 files / 119 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/proposals/architecture-advisory-panel.md` | 4 | 33205 |  |
| `docs/platform/proposals/coordination-capability-envelope.md` | 4 | 30098 |  |
| `docs/platform/proposals/coordination-dispatch-contract.md` | 3 | 15987 |  |
| `docs/platform/proposals/coordination-envelope-probe-contract.md` | 5 | 12167 |  |
| `docs/platform/proposals/coordination-worker-provider-boundary.md` | 6 | 14992 |  |
| `docs/platform/proposals/dispatch-control-plane-redesign.md` | 6 | 1895 |  |
| `docs/platform/proposals/documentation-system-unification.md` | 31 | 53565 |  |
| `docs/platform/proposals/doing-coordination-redesign.md` | 6 | 38568 |  |
| `docs/platform/proposals/knowledge-registry-redesign.md` | 15 | 35396 |  |
| `docs/platform/proposals/step-09-group-thinking-substrate.md` | 7 | 32581 |  |
| `docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md` | 10 | 24741 |  |
| `docs/platform/proposals/step-10-coding-domain-adoption.md` | 5 | 54522 |  |
| `docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md` | 17 | 69137 | yes |

Batch 114 — owner `docs/platform/run-supervisor`: 1 files / 6 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/run-supervisor/spec.md` | 6 | 58576 |  |

Batch 115 — owner `docs/platform/runner`: 17 files / 161 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/runner/architecture/h-69197b459754.md` | 10 | 42997 |  |
| `docs/platform/runner/architecture/h-7af1f0242611.md` | 6 | 7100 |  |
| `docs/platform/runner/architecture/h-e53a3a9829a8.md` | 2 | 4309 |  |
| `docs/platform/runner/contracts/h-b3eb60fb4d2b.md` | 2 | 6342 |  |
| `docs/platform/runner/contracts/routing-handoff.md` | 7 | 7764 |  |
| `docs/platform/runner/decisions/h-36d872fbb0e5.md` | 68 | 182676 | yes |
| `docs/platform/runner/decisions/h-aabefc85f0c9.md` | 6 | 5861 |  |
| `docs/platform/runner/operations/h-51f5cd7279fd.md` | 3 | 92419 | yes |
| `docs/platform/runner/spec.md` | 15 | 78257 | yes |
| `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md` | 2 | 15890 |  |
| `docs/platform/runner/subcomponents/h-2e032393add1/spec.md` | 7 | 13341 |  |
| `docs/platform/runner/subcomponents/h-37aced3896a8/spec.md` | 2 | 18424 |  |
| `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` | 16 | 180961 | yes |
| `docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md` | 2 | 2070 |  |
| `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md` | 2 | 5734 |  |
| `docs/platform/runner/subcomponents/h-d3b49ef7edf5/spec.md` | 2 | 1320 |  |
| `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md` | 9 | 44954 |  |

Batch 116 — owner `docs/platform/session-identity`: 1 files / 3 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/session-identity/spec.md` | 3 | 9300 |  |

Batch 117 — owner `docs/platform/system-architecture`: 5 files / 40 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/system-architecture/architecture/architecture-intent.md` | 13 | 41130 |  |
| `docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md` | 3 | 6621 |  |
| `docs/platform/system-architecture/architecture/workspace-topology-audit.md` | 3 | 13062 |  |
| `docs/platform/system-architecture/architecture/workspace-topology.md` | 3 | 19352 |  |
| `docs/platform/system-architecture/history/architect-readme.md` | 18 | 4417 |  |

Batch 118 — owner `docs/platform/system-overview`: 1 files / 11 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/system-overview/spec.md` | 11 | 19993 |  |

Batch 119 — owner `docs/platform/terminal-control`: 1 files / 2 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/terminal-control/spec.md` | 2 | 23597 |  |

Batch 120 — owner `docs/platform/ui-spec`: 17 files / 55 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/ui-spec/architecture/components/C01-item-card.md` | 4 | 3354 |  |
| `docs/platform/ui-spec/architecture/modals/M01-answer-question.md` | 3 | 4929 |  |
| `docs/platform/ui-spec/architecture/modals/M02-approve-merge.md` | 3 | 4764 |  |
| `docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md` | 3 | 4549 |  |
| `docs/platform/ui-spec/architecture/screens/S01-sign-in.md` | 3 | 4353 |  |
| `docs/platform/ui-spec/architecture/screens/S02-taskboard.md` | 4 | 12444 |  |
| `docs/platform/ui-spec/architecture/screens/S03-task-detail.md` | 5 | 12388 |  |
| `docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md` | 3 | 5718 |  |
| `docs/platform/ui-spec/architecture/spec.config.yaml` | 1 | 509 |  |
| `docs/platform/ui-spec/architecture/spec.config.yaml.md` | 2 | 1328 |  |
| `docs/platform/ui-spec/contracts/15-system-events.md` | 3 | 3000 |  |
| `docs/platform/ui-spec/contracts/20-domain-rules.md` | 3 | 4189 |  |
| `docs/platform/ui-spec/contracts/30-states-and-errors.md` | 3 | 3263 |  |
| `docs/platform/ui-spec/history/schema/surface-contract.schema.json.md` | 2 | 1374 |  |
| `docs/platform/ui-spec/operations/F01-answer-a-parked-question.md` | 2 | 3632 |  |
| `docs/platform/ui-spec/operations/F02-approve-a-merge.md` | 2 | 3260 |  |
| `docs/platform/ui-spec/spec.md` | 9 | 4950 |  |

Batch 121 — owner `docs/platform/vision.md`: 1 files / 4 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/vision.md` | 4 | 10544 |  |

Batch 122 — owner `docs/platform/work-state`: 5 files / 60 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/platform/work-state/architecture/implementation-pointers.md` | 7 | 25347 |  |
| `docs/platform/work-state/contracts/cli-io-contract.md` | 16 | 31773 |  |
| `docs/platform/work-state/decisions/retired-decision-history.md` | 15 | 66707 | yes |
| `docs/platform/work-state/history/multi-role-harness-distill-record.md` | 5 | 5375 |  |
| `docs/platform/work-state/spec.md` | 17 | 218051 | yes |

Batch 123 — owner `docs/reference`: 6 files / 9 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/reference/claude-named-executor.md` | 2 | 3076 |  |
| `docs/reference/coding-worker-contract-shape.md` | 1 | 4448 |  |
| `docs/reference/discussion-quality-rubric.md` | 1 | 4039 |  |
| `docs/reference/dispatch-module-boundaries.md` | 2 | 4229 |  |
| `docs/reference/fgos-faults-read-surface.md` | 1 | 2640 |  |
| `docs/reference/runner-capabilities-advise-execute-slots.md` | 2 | 3507 |  |

Batch 124 — owner `docs/templates`: 11 files / 8 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/templates/architecture.md` | 2 | 1478 |  |
| `docs/templates/area-readme.md` | 0 | 3763 |  |
| `docs/templates/contract.md` | 2 | 1192 |  |
| `docs/templates/decision.md` | 2 | 857 |  |
| `docs/templates/discussion.md` | 0 | 812 |  |
| `docs/templates/generated.md` | 0 | 634 |  |
| `docs/templates/intent-preservation-ledger.md` | 0 | 1879 |  |
| `docs/templates/spec.md` | 0 | 1449 |  |
| `docs/templates/subcomponent-readme.md` | 0 | 2506 |  |
| `docs/templates/verification.md` | 2 | 829 |  |
| `docs/templates/vision.md` | 0 | 1238 |  |

Batch 125 — owner `docs/ui-spec`: 17 files / 33 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/ui-spec/00-overview.md` | 6 | 3564 |  |
| `docs/ui-spec/15-system-events.md` | 1 | 2058 |  |
| `docs/ui-spec/20-domain-rules.md` | 1 | 3249 |  |
| `docs/ui-spec/30-states-and-errors.md` | 1 | 2313 |  |
| `docs/ui-spec/components/C01-item-card.md` | 2 | 2392 |  |
| `docs/ui-spec/flows/F01-answer-a-parked-question.md` | 0 | 2647 |  |
| `docs/ui-spec/flows/F02-approve-a-merge.md` | 0 | 2293 |  |
| `docs/ui-spec/generated/coverage-report.md` | 0 | 571 |  |
| `docs/ui-spec/generated/wireframe-v2.html` | 11 | 631319 | yes |
| `docs/ui-spec/modals/M01-answer-question.md` | 1 | 3963 |  |
| `docs/ui-spec/modals/M02-approve-merge.md` | 1 | 3802 |  |
| `docs/ui-spec/modals/M03-add-edit-item.md` | 1 | 3587 |  |
| `docs/ui-spec/screens/S01-sign-in.md` | 1 | 3401 |  |
| `docs/ui-spec/screens/S02-taskboard.md` | 2 | 11488 |  |
| `docs/ui-spec/screens/S03-task-detail.md` | 3 | 11428 |  |
| `docs/ui-spec/screens/S04-questions-needing-answer.md` | 1 | 4732 |  |
| `docs/ui-spec/spec.config.yaml` | 1 | 509 |  |

Batch 126 — owner `repo/navigation`: 4 files / 61 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/architecture-manifest.json` | 1 | 15304 |  |
| `docs/backlog.md` | 48 | 126374 | yes |
| `docs/coexistence.md` | 6 | 7298 |  |
| `docs/distribution-vision.md` | 6 | 13072 |  |

Batch 127 — owner `repo/navigation`: 1 files / 825 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/doc-registry.json` | 825 | 665762 | yes |

Batch 128 — owner `repo/navigation`: 1 files / 493 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/doc-registry.md` | 493 | 291671 | yes |

Batch 129 — owner `repo/navigation`: 1 files / 506 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/enduser-docs-index.json` | 506 | 289110 | yes |

Batch 130 — owner `repo/navigation`: 5 files / 105 edges.

| Consumer file | Edges | Bytes | Mandatory |
|---|---:|---:|---|
| `docs/id-systems-audit.md` | 23 | 13697 |  |
| `docs/io-contract.md` | 11 | 16969 |  |
| `docs/operator-runbook-herdr-cockpit.md` | 2 | 3489 |  |
| `docs/transitional-switchboard.md` | 69 | 13207 | yes |
| `docs/work-item-lifecycle-vision.md` | 0 | 6935 |  |


Manifest totals: **130 batches / 1037 files / 8496 edges / 53 mandatory-threshold files**. Group counts: instructions/navigation: 6 files, maps/portals: 75 files, skills/prompts: 60 files, specs-root Phase 9 patch specs: 15 files, others: 881 files. Empty group headings retain the requested taxonomy; they do not imply missing files. No patches authored.

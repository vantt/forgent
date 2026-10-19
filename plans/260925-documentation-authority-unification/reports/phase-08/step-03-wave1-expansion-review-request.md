# Step 3 wave 1 correction and expansion review request

AUTHOR records only, independent acceptance pending. Pin `ae141550c2e022310de7a0efea757580c0b2479f`; inventory pin `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. Read [owner answers](owner-answers.md) A51 and L12-21..L12-34, then the updated [authoring rules digest](progress.md#authoring-rules-digest--give-scaled-batches-this-checklist-verbatim). This request supersedes the initial wave-1 sample request for corrected records; the original sample, unpatched sample and seven reports remain historical evidence. It does not replace their per-set breach findings.

**48 files / 644 edges / 11 parts.** Every surviving file of breached sets batch-013, 015, 016, 025, 028, 030, 033 is included, whether patched, parked, preserved, row-flip-only or zero-edge. Every other substantively corrected file is included, including both pilot Related parks and record-text corrections. Unit-id-only schema migration is distinguished in the [changes](step-03-wave1-r2-changes.json), not called semantic correction. Retiring consumers are listed separately: 33 files / 505 edges, with no per-edge patch or diff, under L12-34(2). Work-state uses the expressly permitted full-record fallback (39 edges), retaining the RUL10 carry obligation; the existing schema has no fragment-application boundary.

## Reading method and boundaries

For each assigned file read its **whole source** with `git show ae141550c2e022310de7a0efea757580c0b2479f:<file>`, then read its **complete JSONL record directly** at the path/line below. Read every edge, supplemental reference, exclusion, unitId/per-edge rationale, targetFacts, witness and full diff. Each part is ≤6 whole files and ≤150 edges, with a 400,000-byte packing limit except an indivisible oversized file assigned alone. Read actual target passages with `git show ae141550c2e022310de7a0efea757580c0b2479f:<target>`. Use bounded chunks for long documents but give one verdict per complete file. The index binds full source/record/diff digests and measured bytes; digests and author comparisons do not establish semantic correctness.

**Reviewers never run the checker or probes.** No script output substitutes for reading the source and records. No consumer edits, services, fgOS CLI, state/secrets access, Git writes or independent self-approval. Report only in your unique assigned `review-a38-step-03-wave1-x-pNN.md` under this plan report directory; never overwrite p01–p03 or u01–u04.

Check Related wrapper metadata separately from provenance and literal source-carriage headers: retiring targets patch to exact live holders, or park for self/duplicate/carriage; retained targets preserve. Check whole migration units (table rows, status bullet groups, Canonical/current-source lines), the retained-root dependencies, and whether recorded per-edge exceptions express real distinct claims. Root architecture-map remains live until cutover; CTR010 and live docs/specs descriptions park for A45/description rewrite, while decision-history units preserve. Verify new tree-relative and backticked sibling references using consumer/native candidate coordinates first and explicit provenance area coordinates only for source carriage; current candidate links must not be falsely assigned legacy owners. Recheck every contextual exclusion and the factual notes about tutorials, deleted decision narratives and successor notes.

## Parts

### p01

Report: `review-a38-step-03-wave1-x-p01.md`. **1 files / 8 edges / 34,638 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/doc-governance.md` | `step-03-records/batch-002.jsonl:2` | 8 | unpatched |

### p02

Report: `review-a38-step-03-wave1-x-p02.md`. **1 files / 97 edges / 1,703,571 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/reading-map.md` | `step-03-records/batch-002.jsonl:4` | 97 | patched |

### p03

Report: `review-a38-step-03-wave1-x-p03.md`. **6 files / 36 edges / 143,343 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/generated/README.md` | `step-03-records/batch-011.jsonl:1` | 4 | unpatched |
| `docs/platform/README.md` | `step-03-records/batch-013.jsonl:1` | 23 | unpatched |
| `docs/platform/agent-confinement/README.md` | `step-03-records/batch-014.jsonl:1` | 2 | patched |
| `docs/platform/agent-coordination/README.md` | `step-03-records/batch-015.jsonl:1` | 3 | patched |
| `docs/platform/agent-coordination/architecture/README.md` | `step-03-records/batch-015.jsonl:2` | 3 | patched |
| `docs/platform/agent-coordination/decisions/README.md` | `step-03-records/batch-015.jsonl:3` | 1 | patched |

### p04

Report: `review-a38-step-03-wave1-x-p04.md`. **6 files / 45 edges / 150,815 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/platform/agent-coordination/history/README.md` | `step-03-records/batch-015.jsonl:4` | 2 | unpatched |
| `docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | `step-03-records/batch-015.jsonl:5` | 6 | unpatched |
| `docs/platform/agent-coordination/history/retired-engine/README.md` | `step-03-records/batch-015.jsonl:6` | 19 | unpatched |
| `docs/platform/agent-coordination/history/retired-engine/files/README.md` | `step-03-records/batch-015.jsonl:7` | 5 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/architecture/README.md` | `step-03-records/batch-015.jsonl:8` | 8 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/contracts/README.md` | `step-03-records/batch-015.jsonl:9` | 5 | patched |

### p05

Report: `review-a38-step-03-wave1-x-p05.md`. **6 files / 54 edges / 122,781 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/platform/agent-coordination/history/retired-engine/files/decisions/README.md` | `step-03-records/batch-015.jsonl:10` | 6 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/proposals/README.md` | `step-03-records/batch-015.jsonl:11` | 12 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/README.md` | `step-03-records/batch-015.jsonl:12` | 8 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/README.md` | `step-03-records/batch-015.jsonl:13` | 6 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/subcomponents/README.md` | `step-03-records/batch-015.jsonl:14` | 6 | patched |
| `docs/platform/agent-coordination/history/retired-engine/files/verification/README.md` | `step-03-records/batch-015.jsonl:15` | 16 | patched |

### p06

Report: `review-a38-step-03-wave1-x-p06.md`. **6 files / 73 edges / 187,800 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/README.md` | `step-03-records/batch-015.jsonl:16` | 4 | patched |
| `docs/platform/agent-coordination/history/retired-engine/inbound/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | `step-03-records/batch-015.jsonl:17` | 9 | patched |
| `docs/platform/agent-coordination/history/retired-engine/legacy/README.md` | `step-03-records/batch-015.jsonl:18` | 19 | patched |
| `docs/platform/agent-coordination/history/retired-engine/subcomponents/README.md` | `step-03-records/batch-015.jsonl:19` | 21 | unpatched |
| `docs/platform/agent-coordination/proposals/README.md` | `step-03-records/batch-015.jsonl:20` | 2 | patched |
| `docs/platform/agent-coordination/verification/README.md` | `step-03-records/batch-015.jsonl:21` | 18 | patched |

### p07

Report: `review-a38-step-03-wave1-x-p07.md`. **6 files / 58 edges / 152,948 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/platform/agent-coordination/vocabulary/README.md` | `step-03-records/batch-015.jsonl:22` | 1 | patched |
| `docs/platform/architecture-map.md` | `step-03-records/batch-016.jsonl:1` | 39 | unpatched |
| `docs/platform/claude-plugin/README.md` | `step-03-records/batch-017.jsonl:1` | 2 | patched |
| `docs/platform/decision-citation-drift/README.md` | `step-03-records/batch-018.jsonl:1` | 2 | patched |
| `docs/platform/distillery/README.md` | `step-03-records/batch-019.jsonl:1` | 2 | patched |
| `docs/platform/documentation/operations/portals/docs-portal.md` | `step-03-records/batch-020.jsonl:2` | 12 | unpatched |

### p08

Report: `review-a38-step-03-wave1-x-p08.md`. **6 files / 49 edges / 145,408 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/platform/herdr-web-dashboard/README.md` | `step-03-records/batch-021.jsonl:1` | 2 | patched |
| `docs/platform/host-invocation-routing/README.md` | `step-03-records/batch-023.jsonl:1` | 2 | unpatched |
| `docs/platform/observe/README.md` | `step-03-records/batch-024.jsonl:1` | 2 | patched |
| `docs/platform/packaging-distribution/README.md` | `step-03-records/batch-025.jsonl:1` | 14 | unpatched |
| `docs/platform/packaging-distribution/history/documentation-migration/migration-map.md` | `step-03-records/batch-025.jsonl:2` | 26 | unpatched |
| `docs/platform/proposals/README.md` | `step-03-records/batch-026.jsonl:1` | 3 | unpatched |

### p09

Report: `review-a38-step-03-wave1-x-p09.md`. **6 files / 71 edges / 213,434 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/platform/proposals/component-authority-boundary-map.md` | `step-03-records/batch-026.jsonl:2` | 26 | unpatched |
| `docs/platform/runner/README.md` | `step-03-records/batch-027.jsonl:1` | 4 | patched |
| `docs/platform/system-architecture/architecture/roadmap.md` | `step-03-records/batch-028.jsonl:1` | 21 | unpatched |
| `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md` | `step-03-records/batch-028.jsonl:2` | 3 | unpatched |
| `docs/platform/ui-spec/README.md` | `step-03-records/batch-029.jsonl:1` | 3 | unpatched |
| `docs/platform/work-state/README.md` | `step-03-records/batch-030.jsonl:1` | 14 | unpatched |

### p10

Report: `review-a38-step-03-wave1-x-p10.md`. **3 files / 63 edges / 130,778 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/user/README.md` | `step-03-records/batch-032.jsonl:1` | 6 | unpatched |
| `docs/README.md` | `step-03-records/batch-033.jsonl:1` | 15 | unpatched |
| `docs/architecture-map.md` | `step-03-records/batch-033.jsonl:2` | 42 | unpatched |

### p11

Report: `review-a38-step-03-wave1-x-p11.md`. **1 files / 90 edges / 1,980,645 source-plus-record bytes**.

| Consumer | Record | Edges | Stratum |
|---|---|---:|---|
| `docs/specs/reading-map.md` | `step-03-records/batch-040.jsonl:11` | 90 | patched |

## Verdict and accounting

State pin and record/diff hashes, elapsed review time, then one **ok / rework / needs-Lead-ruling** verdict per complete file with exact edge ids and source/target passages. Separate outcome defects from record-text notes and suggestions. A new rule gap parks affected work for Lead; do not invent or relax a rule. Keep one reviewed-file denominator and rework numerator for each set and stratum; a file needing any required semantic correction counts once. Never pool the 3% threshold, reseed, replace a failing sample file, or treat old zeroes as acceptance of corrected bytes. The breached sets are already expanded to every file; corrected files require fresh review.

[Review index](step-03-wave1-expansion-review-index.json) lists all assignments and frozen hashes; current [wave manifest](step-03-wave1-r2-manifest.json) and [pilot manifest](step-03-pilot-r5-manifest.json) carry patched and seeded unpatched strata. The original freezes remain unchanged for their historical packets. Review started 0 / accepted 0; budget and dispatch remain with Lead. Runner owns commits; Lead separately accounts actual commit/path pairs in both unchanged Phase 6 reproduction manifests, then verifies committed bytes. No Step 3 acceptance, Phase 8 close, gate waiver or Phase 9 authority flip is claimed. Existing workflow/RUL10/GAP-02 carry and Step 5 parity obligations remain. Preview remains with Lead under the record-only worker scope.

# Step 3 final review request

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Binding authority: L12-50–53 and the final Lead brief (pending L12-54 recording by Lead). Records and plan-local checker only; consumers remain unchanged. **Reviewers never run the checker or probes.** Review every assigned file, edge, full proposed diff, source, exact target/anchor passage, preserve/park and deferred status replacement; record a whole-file verdict. Started 0 / accepted 0. No set closure or Phase 9 authorization.

This single request expands (a) every not-yet-reviewed patched file of batch-122, (b) every not-yet-reviewed file of batch-105's original unpatched stratum containing 07039/07024, including zero-edge coverage, and (c) targets every file whose disposition, target, anchor or proposed diff changed, plus the named non-sweep record-text/coverage corrections. Sweep-only text changes are listed separately below and are not a new sampled review stratum. Prior requests, outcomes and frozen membership remain unchanged. The prior wave5f/wave5g indexes and supplied Lead rulings establish already-reviewed membership; this worker does not manufacture absent review reports or acceptance.

Frozen index: `step-03-final-review-index.json`: **37 files / 1015 edges / 11 parts**. Each ordinary part has ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes. An indivisible larger file owns its part and is read in ≤100-edge pages. The index binds source/diff/record SHA-256 and every page.

Check the actual claims: 01326 four-part prompt holder; switchboard 30–34 / 98–103 / 104–108 have one replacement per range and retain author guidance (fenced metadata needs no status flip); dead References 07912; 04967 description-rewrite explicitly compares old `herdr-plugin/src/fgos.rs` with pinned audit `packages/herdr-fgos-common/rust/src/fgos.rs`; 04701/04703 historical banner; 07024/07039 present-tense destination/carry; missed runner line-112 and generated-index line-42 edges; 0000 generated successor, 07733 contract holder, 07691 verbatim evidence, full internal headings, record labels/resolution notes, and the three complete source-inventory links.

## Python per-field extraction

Use the assigned batch/consumer and every ≤100-edge page from the index; read complete fields in bounded UTF-8 byte slices, never dump a whole serialized record. For zero-edge files read metadata, exclusions, proposed diff and the whole pinned source. This reads fields only; do not import author/checker/probe modules.

```python
import json, pathlib
root = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
batch = 'COPY BATCH NUMBER'
consumer = 'COPY EXACT ASSIGNED PATH'
record = next(json.loads(line) for line in (root/'step-03-records'/f'batch-{batch}.jsonl').read_text().splitlines() if json.loads(line)['file'] == consumer)
first_edge = 1  # then 101, 201, ... through every range in the index
edges = record.get('edges', [])
last_edge = min(first_edge + 99, len(edges))
page = edges[first_edge-1:last_edge]
page_ids = {e['edgeId'] for e in page}
all_ids = {e['edgeId'] for e in edges}
def emit(label, value):
    data = json.dumps(value, ensure_ascii=False, indent=2).encode()
    for start in range(0, len(data), 300000):
        print(label, 'byte page', start, data[start:start+300000].decode('utf-8', errors='backslashreplace'))
if first_edge == 1:
    for key in ('file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet','authoringRules','retiresWithTree','edgeIds','reason','diff'):
        emit(key, record.get(key))
for edge in page:
    for key, value in edge.items(): emit(edge['edgeId']+' '+key, value)
for section in ('coverage','anchors','relativeResolution','labelForm'):
    for key, value in record.get('checks', {}).get(section, {}).items():
        if section != 'coverage':
            if key in page_ids: emit(section+' '+key, value)
        elif key == 'legacyScan':
            if first_edge == 1:
                for k, v in value.items():
                    if k != 'candidates': emit(section+' '+key+' '+k, v)
            for i, candidate in enumerate(value['candidates']):
                if candidate.get('edgeId') in page_ids or (first_edge == 1 and not candidate.get('edgeId')):
                    emit('scan candidate '+str(i), candidate)
        elif isinstance(value, dict) and any(eid in all_ids for eid in value):
            for eid, proof in value.items():
                if eid in page_ids: emit(section+' '+key+' '+eid, proof)
        elif first_edge == 1:
            emit(section+' '+key, value)
```

Read source with `git show <pin>:<consumer>` in complete ordered ≤120-line chunks through EOF. Read each exact target and enclosing section fully. Return the named report for the assigned part with edge-specific findings and evidence; do not edit records during review.

## Assigned parts

### Part 01 → `review-a38-step-03-final-p01.md`

1 files / 78 edges / 670894 source-plus-record bytes. Indivisible file; read the index’s ≤100-edge pages and bounded fields.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-059 | `docs/decisions/index.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 78 |

### Part 02 → `review-a38-step-03-final-p02.md`

3 files / 23 edges / 125260 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-077 | `docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 7 |
| batch-081 | `docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 9 |
| batch-081 | `docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 7 |

### Part 03 → `review-a38-step-03-final-p03.md`

1 files / 472 edges / 662556 source-plus-record bytes. Indivisible file; read the index’s ≤100-edge pages and bounded fields.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-086 | `docs/platform/agent-coordination/history/documentation-migration/source-inventory.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 472 |

### Part 04 → `review-a38-step-03-final-p04.md`

6 files / 58 edges / 142096 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-105 | `docs/platform/host-invocation-routing/architecture/host-use-cases.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 3 |
| batch-105 | `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 17 |
| batch-105 | `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 16 |
| batch-105 | `docs/platform/host-invocation-routing/architecture/provider-routing.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 5 |
| batch-105 | `docs/platform/host-invocation-routing/architecture/release-boundaries.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed; expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 16 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/command-route-descriptor.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 1 |

### Part 05 → `review-a38-step-03-final-p05.md`

6 files / 50 edges / 131010 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-105 | `docs/platform/host-invocation-routing/contracts/component-protocol.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 15 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/external-provider-manifest.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 3 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/legacy-payload.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 2 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/operation-catalog.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 2 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/operation-provider.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 1 |
| batch-105 | `docs/platform/host-invocation-routing/history/documentation-migration/documentation-standardization-plan.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 27 |

### Part 06 → `review-a38-step-03-final-p06.md`

6 files / 22 edges / 82968 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-105 | `docs/platform/host-invocation-routing/history/host-invocation-baseline.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 2 |
| batch-105 | `docs/platform/host-invocation-routing/history/source-inventory.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 13 |
| batch-105 | `docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 0 |
| batch-105 | `docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 0 |
| batch-105 | `docs/platform/host-invocation-routing/spec.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 2 |
| batch-105 | `docs/platform/host-invocation-routing/verification/compatibility-harness.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 5 |

### Part 07 → `review-a38-step-03-final-p07.md`

6 files / 98 edges / 234787 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-105 | `docs/platform/host-invocation-routing/verification/implementation-alignment.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 2 |
| batch-105 | `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 2 |
| batch-105 | `docs/platform/host-invocation-routing/verification/r2-external-process-proof.md` | expansion: every unreviewed file of the original unpatched stratum containing 07039/07024, including zero-edge files | 6 |
| batch-107 | `docs/platform/intent-preservation-ledger.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 10 |
| batch-110 | `docs/platform/packaging-distribution/history/distribution-baseline.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 28 |
| batch-110 | `docs/platform/packaging-distribution/verification/source-preservation-audit.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 50 |

### Part 08 → `review-a38-step-03-final-p08.md`

2 files / 75 edges / 379635 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-115 | `docs/platform/runner/decisions/h-36d872fbb0e5.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 71 |
| batch-115 | `docs/platform/runner/operations/h-51f5cd7279fd.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 4 |

### Part 09 → `review-a38-step-03-final-p09.md`

1 files / 17 edges / 373030 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-115 | `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 17 |

### Part 10 → `review-a38-step-03-final-p10.md`

3 files / 27 edges / 371970 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-122 | `docs/platform/work-state/contracts/cli-io-contract.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 16 |
| batch-122 | `docs/platform/work-state/history/multi-role-harness-distill-record.md` | expansion: every patched batch-122 file outside prior reviewed membership | 5 |
| batch-126 | `docs/coexistence.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 6 |

### Part 11 → `review-a38-step-03-final-p11.md`

2 files / 95 edges / 149527 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-130 | `docs/id-systems-audit.md` | targeted: named A/B record-text, internal-correspondence or search-coverage correction | 26 |
| batch-130 | `docs/transitional-switchboard.md` | targeted: disposition/target/anchor/proposed diff or added-edge coverage changed | 69 |

## Sweep-only text changes

19 files / 74 changed edges; dispositions, targets, anchors and proposed diffs are unchanged. Complete per-batch counts and all evaluated removed-decision edges are in `step-03-final-successor-sweep.json`. No executable self-links; English/Vietnamese decision titles are matched explicitly, numeric collisions remain distinct, and foundations-only narratives carry P8-DOC-GAP-02.

| Batch | Consumer | Changed edges |
|---|---|---:|
| batch-016 | `docs/platform/architecture-map.md` | 2 |
| batch-033 | `docs/architecture-map.md` | 10 |
| batch-060 | `docs/distillery/deep-dives/herdr-vs-tmux-observation.md` | 1 |
| batch-060 | `docs/distillery/deep-dives/parallel-decomposition-and-merge.md` | 1 |
| batch-061 | `docs/distillery/porting-log.md` | 1 |
| batch-069 | `docs/journals/260728-2038-claim-port-str46-parallel-merge.md` | 1 |
| batch-070 | `docs/knowledge/a-decision-doc-can-be-superseded-twice-superseded-by-becomes/a-decision-doc-can-be-superseded-twice-superseded-by-becomes-a-list.md` | 1 |
| batch-070 | `docs/knowledge/decisions-index/decision-record.md` | 35 |
| batch-072 | `docs/knowledge/how-to-close-a-duplicate-superseded-or-admin-decided-work-it/handle-a-duplicate-work-item.md` | 1 |
| batch-072 | `docs/knowledge/how-to-label-a-herdr-pane-with-the-claimed-task-from-a-chrom/fgos-terminal-pane-rename.md` | 1 |
| batch-073 | `docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md` | 4 |
| batch-073 | `docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md` | 1 |
| batch-073 | `docs/knowledge/how-to-unify-two-independently-written-working-tree-clean-ch/unify-a-duplicated-clean-tree-check-across-return-and-approve.md` | 1 |
| batch-074 | `docs/knowledge/produce-failing-test-first-proof-for-an-iron-law-gated-diff/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` | 1 |
| batch-079 | `docs/knowledge/why-fgos-treats-self-development-as-a-bounded-lane-with-its/why-fgos-self-development-is-not-the-default-mission.md` | 2 |
| batch-079 | `docs/knowledge/why-fgos-worktrees-block-fgos-instead-of-locking-or-copying/worktree-isolation-axis-decision.md` | 1 |
| batch-079 | `docs/knowledge/why-main-checkout-hook-wired-reported-a-false-negative-on-an/why-main-checkout-hook-wired-compared-raw-strings-instead-of-resolved-paths.md` | 1 |
| batch-081 | `docs/knowledge/why-the-main-checkout-lock-hook-used-to-block-worktree-commi/why-the-main-checkout-lock-hook-used-to-block-worktree-commits.md` | 1 |
| batch-098 | `docs/platform/documentation/history/id-systems-audit.md` | 8 |

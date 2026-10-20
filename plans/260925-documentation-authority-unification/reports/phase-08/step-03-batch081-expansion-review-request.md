# Step 3 batch 081 — patched-stratum expansion and corrected-file re-review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only. A51 and L12-21..L12-49, including the latest authoring rules digest, remain binding. **Reviewers never run checker/probes.** Started/accepted 0/0. No consumer edit, authority flip or author acceptance.

L12-49 confirms 1 rework among the 3 wave5a patched-stratum reviewed files (>3%). Original patched population **15**; current patched population **14**. This request assigns EVERY current patched file not already reviewed in wave5a (**12 files**) plus the corrected 04939 file as a targeted supplement (**1 file**). The other two previously reviewed patched files stay covered by wave5a; the index lists the exact full population union. Existing requests/reports and seed membership are unchanged. Re-review **maps-j-04939** as description-rewrite park: source attributes `<scope>#p<n>`/ID_PATTERN shape to the classify-step guide, but the knowledge-tree holder lacks it; actual text is in `core/skills/_shared/executor-dispatch-fallback.md`. It has no executable diff/target, matching the 04485 class. All other edges in that file are unchanged.

Frozen index `step-03-batch081-expansion-review-index.json`: **13 whole files / 91 edges / 3 parts**. Source/diff/current-record hashes bind each assigned file. Read EVERY edge and complete diff of each assigned consumer in full pinned-source context, including preserve, parked, row flips, supplemental edges/exclusions and search witnesses.

## Python per-field extractor

Set consumer and batch from the assigned table. Run once per file, reading every printed field; stream long passages/lists as bounded slices. Each page is ≤300,000 bytes (use UTF-8 bytes for byte-sized pages), never a complete serialized record.

```python
import json, pathlib
root = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
batch = 'COPY BATCH NUMBER'
consumer = 'COPY EXACT ASSIGNED PATH'
record = next(json.loads(line) for line in (root/'step-03-records'/f'batch-{batch}.jsonl').read_text().splitlines() if json.loads(line)['file'] == consumer)
def emit(label, value):
    data = json.dumps(value, ensure_ascii=False, indent=2).encode()
    for start in range(0, len(data), 300000):
        print(label, 'byte page', start, data[start:start+300000].decode('utf-8', errors='backslashreplace'))
for key in ('file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet','authoringRules','retiresWithTree','edgeIds','reason','diff'):
    emit(key, record.get(key))
for edge in record.get('edges', []):
    for key, value in edge.items(): emit(edge["edgeId"]+" "+key, value)
for section in ('coverage','anchors','relativeResolution','labelForm'):
    for key, value in record.get('checks', {}).get(section, {}).items():
        if key == 'legacyScan':
            for k, v in value.items():
                if k != 'candidates': emit(section+' '+key+' '+k, v)
            for i, candidate in enumerate(value['candidates']): emit('scan candidate '+str(i), candidate)
        else: emit(section+' '+key, value)
```

Read source chunks with `git show <pin>:<consumer> | sed -n '1,120p'`, then 121–240 and so on through EOF. Large artifacts are streamed with one whole-file verdict: see per-part readingPages in the index. Each ordinary part has ≤6 files, ≤150 edges and ≤400,000 source-plus-record bytes. An indivisible larger file is isolated, its edges read in ≤100-edge pages; no artificial file split or duplicate sample membership.





Both strata use their own NUL-seeded sha256(path) ranks and ceil(15%) selection, with mandatory ≥65,536 source bytes OR ≥40 inventory edges. Each set/stratum retains its own reviewed denominator/rework numerator; no pooling or reseeding. A >3% rework breach expands semantic review to EVERY file of that set, including parked/preserve/row-flip and zero-edge files. Frozen historical memberships stay unchanged.

## Assigned parts

### Part 01 → `review-a38-step-03-batch081-x-p01.md`

6 files / 50 edges / 321050 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-081 | `docs/knowledge/why-src-runner-dispatch-mjs-s-capacity-executor-layer-was-re/why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md` | L12-49-corrected-04939-targeted-re-review | 3 |
| batch-081 | `docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md` | L12-49-patched-stratum-expansion | 20 |
| batch-081 | `docs/knowledge/why-state-json-became-an-incrementally-read-snapshot/why-state-json-became-an-incrementally-read-snapshot.md` | L12-49-patched-stratum-expansion | 4 |
| batch-081 | `docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md` | L12-49-patched-stratum-expansion | 9 |
| batch-081 | `docs/knowledge/why-the-decision-id-collision-auto-resolver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md` | L12-49-patched-stratum-expansion | 8 |
| batch-081 | `docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md` | L12-49-patched-stratum-expansion | 6 |

### Part 02 → `review-a38-step-03-batch081-x-p02.md`

6 files / 32 edges / 196572 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-081 | `docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md` | L12-49-patched-stratum-expansion | 4 |
| batch-081 | `docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md` | L12-49-patched-stratum-expansion | 8 |
| batch-081 | `docs/knowledge/why-the-iron-law-gate-only-runs-at-the-trunk-merge-boundary/why-the-iron-law-gate-only-fires-at-the-trunk-boundary.md` | L12-49-patched-stratum-expansion | 3 |
| batch-081 | `docs/knowledge/why-the-judge-discovery-judge-decompose-capacity-entries-wer/why-the-judge-discovery-and-judge-decompose-capacities-were-removed.md` | L12-49-patched-stratum-expansion | 1 |
| batch-081 | `docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md` | L12-49-patched-stratum-expansion | 6 |
| batch-081 | `docs/knowledge/why-the-live-events-jsonl-corrupted-and-why-the-fix-needed-a/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md` | L12-49-patched-stratum-expansion | 10 |

### Part 03 → `review-a38-step-03-batch081-x-p03.md`

1 files / 9 edges / 39136 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-081 | `docs/knowledge/why-the-locked-decisions-heading-contract-between-plan-mjs-s/decision-record.md` | L12-49-patched-stratum-expansion | 9 |

## Handback

Write only the assigned uniquely named report. Give one whole-file verdict per file, exact record/diff bindings, every edge read, per-set AND per-stratum reviewed-file denominators and rework numerators (with overlaps), evidence and dissent. Distinguish semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch or accept. Lead owns preview, independent review/acceptance and actual-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates. No set closure is claimed. Names follow the explicit brief namespace; fgOS CLI is forbidden in this worker.

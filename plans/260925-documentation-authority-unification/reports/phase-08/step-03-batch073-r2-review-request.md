# Step 3 batch 073 — targeted round-2 re-review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. L12-45 under A51. Exactly **2 files / 14 edges / 1 part**, report `review-a38-step-03-batch073-r2-p01.md`. Frozen source/diff/record hashes and exact membership: `step-03-batch073-r2-review-index.json`. Existing expansion request/reports and every other review membership remain unchanged. No reviewer started/accepted.

Review 04472 Phase 9 patch to the schedule guide Real-world proof (`tsk-1sj`) anchor, including actual STORE_MISSING_WARNING_VERBS/false-clear/fixed-by-adding schedule text and complete Related gloss. Sibling 04466 stays parked. Review 04485 description-rewrite park: the trap section does not contain invariant D1; actual invariant holder is docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md. Inspect the full remaining diffs and edge dispositions in both files. Four neighboring 04472 file edges have only canonical shared-hunk-header rebinding, with unchanged outcomes/targets/anchors/replacements and proofs; exact delta in step-03-wave5a-ruling-changes.json.

**Reviewers never run checker/probes.** Read complete pinned consumers and actual targets in consecutive ≤120-line chunks; use the per-field extractor, never dump a JSONL line. Judge actual source roles, complete locator/gloss correspondence, relative/path-label form, parked evidence and supplemental exclusions.

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



## One assigned part

| Batch | Consumer | Edges |
|---|---|---:|
| 073 | `docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md` | 11 |
| 073 | `docs/knowledge/how-to-self-resolve-a-merge-block-reported-as-verify-timeout/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md` | 3 |

Write only `review-a38-step-03-batch073-r2-p01.md`. Give one whole-file verdict per file, per-set reviewed-file denominator/rework numerator, precise evidence and any dissent. Independently confirm the two outcome corrections and distinguish mechanical hunk metadata. No repairs, checker/probes, dispatch or acceptance. Lead owns actual-commit accounting, preview and acceptance; this request does not close the set or authorize consumer edits.

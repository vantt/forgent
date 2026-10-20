# Step 3 wave 5b — independent A51 review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only. A51 and L12-21..L12-49, including the latest authoring rules digest, remain binding. **Reviewers never run checker/probes.** Started/accepted 0/0. No consumer edit, authority flip or author acceptance.

New batches **083–085 only**, 32 whole-file records. **086–125 remain unauthored**; stop at complete batch 085, no partial next record. Other worker batches 126–130 and wave5c are excluded. Review the Related/Provenance distinction even in metadata fences; candidate content is live outside declared carriage/history. Compare RUL75 to exact Business Rules holder, 0062 removal to its decision, stale line-locator parks, self/carriage-only Related parks and complete map cutover row semantics. Check every supplemental link against both original snapshot and wrapper coordinates. L12-47 Source provenance remains literal; a provenance spelling never turns into a live navigation claim.

Frozen index `step-03-wave5b-review-index.json`: **8 whole files / 145 edges / 2 parts**. Source/diff/current-record hashes bind each assigned file. Read EVERY edge and complete diff of each assigned consumer in full pinned-source context, including preserve, parked, row flips, supplemental edges/exclusions and search witnesses.

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




## Per-set A51 selection

| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct |
|---|---:|---:|---:|---:|---:|
| batch-083 | 4/1 | 0 | 1 | 0/0 | 1 |
| batch-084 | 19/3 | 1 | 4 | 5/1 | 5 |
| batch-085 | 2/1 | 0 | 1 | 1/1 | 2 |

Both strata use their own NUL-seeded sha256(path) ranks and ceil(15%) selection, with mandatory ≥65,536 source bytes OR ≥40 inventory edges. Each set/stratum retains its own reviewed denominator/rework numerator; no pooling or reseeding. A >3% rework breach expands semantic review to EVERY file of that set, including parked/preserve/row-flip and zero-edge files. Frozen historical memberships stay unchanged.

## Assigned parts

### Part 01 → `review-a38-step-03-wave5b-p01.md`

5 files / 10 edges / 323692 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-083 | `docs/platform/agent-confinement/spec.md` | patched-seeded | 4 |
| batch-084 | `docs/platform/agent-coordination/architecture/evidence-and-results.md` | patched-seeded | 1 |
| batch-084 | `docs/platform/agent-coordination/architecture/protocol-model.md` | patched-seeded | 2 |
| batch-084 | `docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md` | unpatched-seeded | 1 |
| batch-084 | `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md` | patched-seeded | 2 |

### Part 02 → `review-a38-step-03-wave5b-p02.md`

3 files / 135 edges / 279234 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-084 | `docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md` | mandatory-threshold | 131 |
| batch-085 | `docs/platform/agent-coordination/history/documentation-migration/phase-7-completion.md` | unpatched-seeded | 2 |
| batch-085 | `docs/platform/agent-coordination/history/documentation-migration/proposal-status.md` | patched-seeded | 2 |

## Handback

Write only the assigned uniquely named report. Give one whole-file verdict per file, exact record/diff bindings, every edge read, per-set AND per-stratum reviewed-file denominators and rework numerators (with overlaps), evidence and dissent. Distinguish semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch or accept. Lead owns preview, independent review/acceptance and actual-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates. No set closure is claimed. Names follow the explicit brief namespace; fgOS CLI is forbidden in this worker.

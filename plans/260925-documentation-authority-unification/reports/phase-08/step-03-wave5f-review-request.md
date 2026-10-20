# Step 3 wave 5f — independent A51 review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Read A51, L12-21..L12-51, the latest authoring rules digest in progress.md and the record schema in step-03-authoring-request.md. Patch RECORDS only; no consumer edit or authority flip. **Reviewers never run checker/probes.** Started/accepted 0/0.

New batches **105–113 only**. Review source/evidence columns and actual carriage independently from live Related; whole migration rows/status semantics; ratchet default/root parity; retained laws versus missing full projection carry; self-Related removal; current process/runner pointers; exact target claims in proposals. Candidate status or a date does not make live prose history. All parks name their own blocker and require their full source/target search evidence to be judged independently.

Frozen index `step-03-wave5f-review-index.json`: **21 whole files / 334 edges / 5 parts**. Source, diff and record hashes bind every file. Review every assigned edge, full diff and complete pinned source/targets, including preserve, parks, row flips, status prose, author-added edges/exclusions and witnesses.

## Python per-field extractor

Set consumer and batch from the assigned table. Run once per ≤100-edge page (first_edge = 1, 101, 201, … through the index ranges), reading every printed field. File metadata/diff and excluded scan hits print once; edge-specific proofs follow only that page. Stream long fields as bounded slices. Each page is ≤300,000 bytes (use UTF-8 bytes for byte-sized pages), never a complete serialized record.

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

Read source chunks with `git show <pin>:<consumer> | sed -n '1,120p'`, then 121–240 and so on through EOF. Large artifacts are streamed with one whole-file verdict: see per-part readingPages in the index. Each ordinary part has ≤6 files, ≤150 edges and ≤400,000 source-plus-record bytes. An indivisible larger file is isolated, its edges read in ≤100-edge pages; no artificial file split or duplicate sample membership.





## Per-set A51 selection

| Set | Patched / seeded | Mandatory | Patched+mandatory | Unpatched eligible / seeded | Distinct |
|---|---:|---:|---:|---:|---:|
| batch-105 | 0/0 | 1 | 1 | 22/4 | 5 |
| batch-106 | 0/0 | 0 | 0 | 3/1 | 1 |
| batch-107 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-108 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-109 | 1/1 | 0 | 1 | 1/1 | 2 |
| batch-110 | 2/1 | 2 | 3 | 15/3 | 6 |
| batch-111 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-112 | 1/1 | 0 | 1 | 0/0 | 1 |
| batch-113 | 0/0 | 1 | 1 | 12/2 | 3 |

Both strata use their own exact NUL seed, sha256(seed + NUL + path) rank and ceil(15%) per set. Mandatory ≥65,536 source bytes OR ≥40 inventory edges; the reused selector additionally includes files with ≥40 total edges, a stronger union. Reviewed denominators 0, rework pending. >3% in either stratum expands to EVERY file of its own set, including zero-edge/park/preserve/row-flip records. Never pool, replace or reseed.

## Assigned parts

### Part 01 → `review-a38-step-03-wave5f-p01.md`

6 whole files / 91 edges / 189437 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-105 | `docs/platform/host-invocation-routing/architecture/external-provider-protocol.md` | unpatched-seeded | 16 |
| batch-105 | `docs/platform/host-invocation-routing/architecture/invocation-kernel.md` | unpatched-seeded | 4 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/component-protocol.md` | unpatched-seeded | 15 |
| batch-105 | `docs/platform/host-invocation-routing/contracts/operation-request-outcome.md` | unpatched-seeded | 2 |
| batch-105 | `docs/platform/host-invocation-routing/intent-preservation-ledger.md` | mandatory-threshold | 51 |
| batch-106 | `docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md` | unpatched-seeded | 3 |

### Part 02 → `review-a38-step-03-wave5f-p02.md`

6 whole files / 35 edges / 143164 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-107 | `docs/platform/intent-preservation-ledger.md` | unpatched-seeded | 10 |
| batch-108 | `docs/platform/migration-authoring-rules.md` | unpatched-seeded | 15 |
| batch-109 | `docs/platform/observe/decisions/observe-component-architecture.md` | patched-seeded | 2 |
| batch-109 | `docs/platform/observe/spec.md` | unpatched-seeded | 6 |
| batch-110 | `docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md` | unpatched-seeded | 1 |
| batch-110 | `docs/platform/packaging-distribution/contracts/projection-ledger.md` | unpatched-seeded | 1 |

### Part 03 → `review-a38-step-03-wave5f-p03.md`

4 whole files / 111 edges / 325011 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-110 | `docs/platform/packaging-distribution/history/distribution-baseline.md` | patched-seeded | 28 |
| batch-110 | `docs/platform/packaging-distribution/spec.md` | mandatory-threshold | 27 |
| batch-110 | `docs/platform/packaging-distribution/verification/implementation-alignment.md` | unpatched-seeded | 6 |
| batch-110 | `docs/platform/packaging-distribution/verification/source-preservation-audit.md` | mandatory-threshold | 50 |

### Part 04 → `review-a38-step-03-wave5f-p04.md`

4 whole files / 75 edges / 338541 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-111 | `docs/platform/platform-foundations.md` | unpatched-seeded | 30 |
| batch-112 | `docs/platform/process/spec.md` | patched-seeded | 3 |
| batch-113 | `docs/platform/proposals/coordination-capability-envelope.md` | unpatched-seeded | 8 |
| batch-113 | `docs/platform/proposals/documentation-system-unification.md` | unpatched-seeded | 34 |

### Part 05 → `review-a38-step-03-wave5f-p05.md`

1 whole files / 22 edges / 103954 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-113 | `docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md` | mandatory-threshold | 22 |

## Handback

Write only your uniquely assigned report. Give a whole-file verdict with every edge read and exact record/diff hashes, evidence and dissent. Report reviewed-file denominator/rework numerator per set AND stratum, distinguishing overlaps. Separate semantic defects, record-text fixes and Lead questions. No repairs, checker/probes, dispatch or acceptance. Lead owns independent review, preview, actual runner-commit accounting and later drift revalidation. GAP-01/02/03, workflow/RUL10 carry and Step 5 parity remain separate gates; this packet claims no set closure or Phase 9 authorization. Names follow the explicit brief namespace; no fgOS CLI in this author Unit.

# Step 3 wave 5h — independent review request

Fixed source/target pin `ae141550c2e022310de7a0efea757580c0b2479f`. A51 and L12-21..L12-53 apply, including the supplied L12-52/L12-53 brief rulings. Records only. Reviewers started/accepted **0/0**; semantic acceptance and set closure remain pending. **Reviewers never run checker, probes or resolver scripts.**

One consolidated request: **8 files / 632 edges / 7 parts**. `step-03-wave5h-review-index.json` binds every source, exact current JSONL record, diff and ≤100-edge reading page. Whole-file verdicts stay indivisible. Each ordinary part is ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes; a larger indivisible file is isolated. Read its complete source in consecutive ≤120-line chunks, and all edges in ≤100-edge pages.

## Membership and counting

Batch-103 expansion is exhaustive over not-yet-reviewed files: **operations/operator-runbook.md**, 4 edges. The prior wave5e request p09 assigned the YAML and spec; supplied L12-53 gives their review results. YAML returns for targeted re-review of 06921. The unchanged previously reviewed spec stays covered by that review; no request, report, seed or prior membership is edited. The isolated checkout does not contain the completed review reports; the supplied Lead result is the authority for prior-reviewed membership.

Targeted re-review covers EVERY file changed under task 1: batches 086, 092, 093, 103 YAML, 104, 115 runner decisions and 117 architect README carrier. Review the complete file record/diff in source context and all assigned edges, focusing on the exact changed ids in the index. These are corrections/expansion, not a new seeded sample. Report denominators and rework separately per set and original patched/unpatched stratum, including overlaps. Current reviewed denominators are zero and rework pending; >3% in a set expands to every file of that set under A51. No pooling or reseeding.

## Review focus

- L12-52(1): ten historical deleted-decision citations now preserve. Their exact title-matched heading is in the same consumer; the record contains a **non-executable internal-correspondence note naming that heading**, with no self-link and no successor note. Check title as well as decision number.
- L12-52(2): 07786 is live wrapper Related above the explicit source-body start marker, parked as duplicate description-rewrite under L12-34(4). The introductory source carriage marker is at lines 24–26; literal body links stay unchanged.
- L12-53 / batch-086: three added whole-link preserves at line 40 (documentation-governance and documentation-standardization-plan) and line 44 (phase-7-completion). Check complete label/destination spans. Boilerplate verification-index reason survives only on 05219; 468 prior reasons lose it. Unchanged scanner splits the two line-40 links and omits line 44: this author records the coverage limitation, never removes required edges to get green.
- L12-53 / 06921: evidence citation preserves; its original spelling never existed, and pre-rename research holder is docs/history/herdr-web-dashboard/RESEARCH.md. Other YAML Step 5 parity entries remain separate.
- L12-53 / 06958: RUL101 at runner/subcomponents/h-6979005beaf7/spec.md#business-rules states cwd dispatch kernel lock, resume guard and reconcile together. Check all three against pinned line 196.
- L12-53 / 06620: approval-gate operation holder (Cổng duyệt PR nội bộ), the same holder as root twin 01325. 06621 and root twin 01326 use docs/routing-handoff-contract.md#khung-prompt-4-phần: the worker four-part dispatch contract, while the one-orchestrator policy remains local coexistence text. Root twins were not edited.
- L12-53 / 06642: description-rewrite, because no live documentation holder states the combined copyCredentialFiles/cleanup.mjs row. Check that no runtime-parity category is carried forward.
- Check same-row claims, exact anchors, adjacent description comparisons, complete diffs and shared hunk header changes. False retirement suffixes apply only to docs/specs/** and docs/architect/**; none was found requiring additional cleanup in the touched batches.

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

## Assigned parts

### Part 01 → `review-a38-step-03-wave5h-p01.md`

1 files / 472 edges / 662914 source-plus-record bytes. Indivisible larger file: its own part, read using ≤100-edge pages.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 086 | `docs/platform/agent-coordination/history/documentation-migration/source-inventory.md` | targeted-re-review | 472 |

### Part 02 → `review-a38-step-03-wave5h-p02.md`

1 files / 8 edges / 55459 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 092 | `docs/platform/coexistence/spec.md` | targeted-re-review | 8 |

### Part 03 → `review-a38-step-03-wave5h-p03.md`

1 files / 39 edges / 1730863 source-plus-record bytes. Indivisible larger file: its own part, read using ≤100-edge pages.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 093 | `docs/platform/component-boundary.md` | targeted-re-review | 39 |

### Part 04 → `review-a38-step-03-wave5h-p04.md`

1 files / 17 edges / 95258 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 103 | `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | targeted-re-review | 17 |

### Part 05 → `review-a38-step-03-wave5h-p05.md`

1 files / 4 edges / 320942 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 104 | `docs/platform/holder-lock/spec.md` | targeted-re-review | 4 |

### Part 06 → `review-a38-step-03-wave5h-p06.md`

2 files / 88 edges / 293412 source-plus-record bytes.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 115 | `docs/platform/runner/decisions/h-36d872fbb0e5.md` | targeted-re-review | 70 |
| 117 | `docs/platform/system-architecture/history/architect-readme.md` | targeted-re-review | 18 |

### Part 07 → `review-a38-step-03-wave5h-p07.md`

1 files / 4 edges / 401272 source-plus-record bytes. Indivisible larger file: its own part, read using ≤100-edge pages.

| Batch | Consumer | Inclusion | Edges |
|---|---|---|---:|
| 103 | `docs/platform/herdr-web-dashboard/operations/operator-runbook.md` | batch-103-not-yet-reviewed-expansion | 4 |

## Handback

Write only your assigned uniquely named report. Give one whole-file verdict per assigned file, exact source/record/diff hash bindings, complete pages read, reviewed-file denominators and rework numerators by set/stratum, and evidence for each defect or dissent. Separate semantic outcome defects, record-text notes and checker limitations. Do not run checker/probes, repair, dispatch or accept. Lead owns MDView preview (no tool available here), independent acceptance, actual-commit accounting and later Step 4 drift revalidation. Source consumers, protected manifests, earlier review requests, code and checkers remain unchanged. No phase close or Phase 9 authorization is claimed. Explicit brief names govern output paths; do not run fgOS CLI.

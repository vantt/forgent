# Step 3 wave 4f — new-batch review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-42, the complete progress authoring digest and step-03-authoring-request.md schema. **Reviewers never run checker/probes.** Reviewers started/accepted 0/0.

**4 whole files / 9 edges / 1 parts.** Index `step-03-wave4f-review-index.json` freezes exact source/diff/record hashes. Read each complete pinned source and target, all edge fields, supplemental scan/exclusions and diff in bounded pages. Hashes and author checker results are bindings, never independent semantic acceptance.

This is ONE request for NEW batch 076 only. Batches 077–082 remain unauthored at the complete-batch authoring-budget boundary; no partial next batch. Batch-073 expansion and all earlier review requests stay separate.

Review the actual source role, alias holder and full adjacent descriptions. 04685 is a never-existing name-drift dead link, with the real code-implement smoke-test as a non-executable successor. 04686 parks because its cited target lines 69–70 describe indexing/blank, while the independent-judge comparison is at 73–85. 04657 preserves an explicitly completed cat-file artifact identity; 04658 parks because substituting a later alias would misstate that dated exact probe input. 04663 parks because its gloss claims real events-log contention while the holder documents false contention from torn main-checkout.lock reads; its broader Related sibling 04665 patches separately. The existing source/target counts and verb history must not become new runtime promises.

| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |
|---|---:|---:|---:|---:|---:|
| batch-076 | 10/2 | 0 | 2 | 9/2 | 4 |

Manifest stores exact NUL seeds/ranks and threshold witnesses (≥65,536 bytes OR ≥40 inventory edges). Each stratum separately has reviewed denominator 0 and rework pending. ≤3% per set/stratum passes; >3% expands to EVERY file of that set, including unpatched/zero-edge files. Never pool, reseed, replace samples or self-accept.

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



## Assigned parts

### Part 01 → `review-a38-step-03-wave4f-p01.md`

4 files / 9 edges / 61409 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-076 | `docs/knowledge/why-auto-launched-herdr-panes-must-be-labeled-before-spawnin/why-auto-launched-herdr-panes-must-be-labeled-before-spawning-claude.md` | patched-seeded | 2 |
| batch-076 | `docs/knowledge/why-claimwork-s-cas-reread-stays-while-its-one-redundant-ful/why-claimworks-cas-reread-stays-while-its-redundant-full-log-read-was-deduped.md` | patched-seeded | 3 |
| batch-076 | `docs/knowledge/why-decisions-already-locked-and-approved-by-a-person-still/decision-record.md` | unpatched-seeded | 2 |
| batch-076 | `docs/knowledge/why-decompose-checks-footprint-overlap-before-creating-child/why-decompose-checks-footprint-overlap-before-creating-children.md` | unpatched-seeded | 2 |

## Required handback

Read complete pinned consumers via git show in consecutive ≤120-line pages through EOF. Extract every JSON field with Python above; never dump an entire JSONL record. A field >300,000 bytes is paged as UTF-8 bytes. Per-file record/diff/verdict remains indivisible. Ordinary parts have ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes.

Write only the assigned unique report; include pin/bindings, complete reading method, per-file verdicts, edges read, source/target evidence and dissent. Separate semantic rework, record-text notes and Lead questions; report denominators/numerators per set AND stratum with overlaps. No checker/probes, repairs, dispatch or acceptance. Lead owns independent review, preview and actual runner-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates. No Step 3 acceptance or phase close. Exact report namespaces are supplied by this brief; worker is forbidden to invoke fgOS conventions CLI.

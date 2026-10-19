# Step 3 bounded wave 4 A51 review

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. Records only; no consumer patch has been applied. Read owner-answers.md A51 and L12-21..L12-38, progress.md current authoring digest and step-03-authoring-request.md schema. **Reviewers never run checker or probes.** Reviewers started/accepted 0/0.

Frozen index: `step-03-wave4-review-index.json`. **5 whole files / 84 edges / 1 parts**. Read every assigned complete pinned consumer with `git show`, every record field, diff, actual target passage, scan exclusion and source unit. Hashes bind records and are not semantic acceptance.

L12-38 is binding: knowledge and candidate/playbook/prompt files are live outside actual history. Undated decision citations there navigate to exact decision headings. Never-existing name-drift live pointers park dead-link plus a successor note, without inventing aliases. Preserved removed decision ids carry computed narrative-holder notes. Verbatim history regions exempt renamed aliases; 08367/08368 preserve. Carriage/dated history supplemental coverage requires Markdown links and explicit legacy-root paths; bare names, directory fragments and code/test paths are exempt, with true reasons. Present-tense “Where the doc lives now” and reading-map + owning-area claims park as description-rewrite. L12-38 settles all eighteen review questions; no new Lead ruling is requested.

**Completed batch: 070 only (25 files). Pending: 071–082 (289 files); not authored or included in this request.** Stopped at the batch boundary for turn budget. docs/knowledge/decisions-index/decision-record.md is the L12-26(4) frozen rename copy, historical despite its stale generated header; it has no renderer to hand-edit. Participant RUL10 retains L12-17/GAP-01 carry/rewrite prerequisites. Relative decision links bind their original docs/reference coordinates through committed registry aliases; 0014 has GAP-02, while the exact 0011 narrative is bound independently.

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
for key in ('file','authorInputCommit','digest','inventoryEdgeIds','authoringRules','retiresWithTree','edgeIds','reason','diff'):
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


## Set and stratum accounting

| Set | Patched population / seeded | Mandatory | Patched + mandatory | Unpatched eligible / seeded | Distinct union |
|---|---:|---:|---:|---:|---:|
| batch-070 | 10/2 | 1 | 3 | 8/2 | 5 |

Both strata retain exact per-set NUL-separated seeds and full ranks. Selected denominators are frozen, reviewed denominators remain 0 and rework numerators pending. ≤3% per set AND stratum passes; >3% expands that set to all files. Never pool, reseed, replace a failed sample or self-accept.

## Assigned parts

### Part 01 → `review-a38-step-03-wave4-p01.md`

5 files / 84 edges / 148,639 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-070 | `docs/knowledge/close-out-a-decomposed-root-item-after-all-its-children-are/close-out-a-decomposed-root-item-after-all-children-are-done.md` | unpatched-seeded | 1 |
| batch-070 | `docs/knowledge/decisions-index/decision-record.md` | mandatory-threshold | 75 |
| batch-070 | `docs/knowledge/fgos-cook-worktree-claim-before-drive/fgos-cook-worktree-claim-before-drive.md` | patched-seeded | 3 |
| batch-070 | `docs/knowledge/fgos-researching-s-d2-fan-out-rule-verified-live-on-a-real-d/fgos-researching-d2-fanout-verified-live.md` | unpatched-seeded | 1 |
| batch-070 | `docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md` | patched-seeded | 4 |

## Required handback

Write only the assigned uniquely named review report. State the pin, complete reading method, per-file verdict and edges read; separate outcome defects from record-text notes and Lead questions. Give reviewed-file denominator and rework numerator per set and stratum, counting overlap explicitly. No repair, checker/probe run, reviewer dispatch or acceptance. Lead owns independent acceptance, previews, actual runner-commit accounting in both untouched Phase 6 reproduction manifests and committed-byte closeout. Step 5 parity, workflow/RUL10/GAP-01/GAP-02 carry and Phase 9 step-10 semantic-remnant/reading-map obligations remain. No Phase 8 close or Phase 9 authorization is claimed.

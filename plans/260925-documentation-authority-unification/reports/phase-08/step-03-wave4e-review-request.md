# Step 3 wave 4e — one independent review request

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-41 and the authoring digest. **Reviewers never run checker/probes.** Started/accepted 0/0.

New batch **075** only: 25 whole-file records / 64 edges. Two A51 strata select **4 whole files / 8 edges / 1 parts**. Complete-batch authoring-budget stop after 075; 076–082 remain unauthored. No partial next batch. Existing ≤074 reviews remain separate and unchanged.

Review actual complete source roles and adjacent descriptions, not advisory census actions. Read aliases, candidate target passages, precise anchors, units, supplemental exclusions and all parked/preserve entries. Check the tutorial’s stale/live-lock gloss versus the actual verify-failure guide; it is a description-rewrite park. The 0025 Ship Faster citation binds to its exact titled narrative in runner/decisions/h-36d872fbb0e5.md; distinguish the unrelated number-only matches. RUL25 and RUL25/26/27 citations use exact Business Rules. Preserve actual completed spec-edit/audit identity and retained source/history references. L12-40 evidence exemptions do not turn arbitrary live knowledge prose into history.

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


## Set and stratum accounting

| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |
|---|---:|---:|---:|---:|---:|
| batch-075 | 10/2 | 0 | 2 | 10/2 | 4 |

The manifest freezes exact NUL seeds/ranks, source/diff/record hashes and mandatory witnesses (≥65,536 bytes OR ≥40 inventory edges). Patched population includes all nonempty Phase 9 diffs. Unpatched population = empty diff with ≥1 edge, excluding already selected. Each stratum separately has reviewed denominator 0 and rework pending. ≤3% per set/stratum passes; >3% expands to EVERY file of that set, including unpatched/zero-edge files. Never pool, reseed, replace failed samples or self-accept.

## Assigned parts

### Part 01 → `review-a38-step-03-wave4e-p01.md`

4 files / 8 edges / 63272 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-075 | `docs/knowledge/tool-registry-capability-lookup-is-a-prose-contract-not-comp/tool-registry-capability-is-a-prose-contract-not-compiled-logic.md` | patched-seeded | 2 |
| batch-075 | `docs/knowledge/why-a-pass-through-non-split-item-s-designed-proof-surface-c/why-fgos-coding-planning-writes-a-pass-through-items-real-verify-before-handoff.md` | patched-seeded | 1 |
| batch-075 | `docs/knowledge/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias.md` | unpatched-seeded | 3 |
| batch-075 | `docs/knowledge/why-a-session-driven-root-s-fgw-rootid-branch-may-not-exist/why-createdetachedmergeworktree-crashed-for-session-driven-roots.md` | unpatched-seeded | 2 |

## Required handback

Read each complete pinned consumer via git show in consecutive ≤120-line pages; use the Python per-field extractor above for each record field and complete diff. Never dump a full JSONL record. A field >300,000 bytes is paged as UTF-8 bytes, preserving one whole-file verdict. Check target claims, witness groups and supplemental exclusions. Write only the assigned report. Give per-set AND per-stratum file denominators/rework numerators and overlaps; separate semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch review or accept this request. Lead owns preview, independent acceptance, actual runner-commit accounting and committed-byte acceptance. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separately gated. No Step 3 acceptance or phase close is claimed.

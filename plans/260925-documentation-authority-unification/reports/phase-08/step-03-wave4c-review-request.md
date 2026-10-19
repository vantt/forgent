# Step 3 wave 4c — one independent review request

Pin `ae141550c2e022310de7a0efea757580c0b2479f` fixed. Patch records only; no consumer edit. Supersedes `step-03-wave4b-review-request.md`. Read owner-answers A51, L12-21..L12-39 and the progress authoring digest. **Reviewers never run checker/probes.** Reviewers started/accepted 0/0.

Frozen index `step-03-wave4c-review-index.json`: **16 whole files / 112 edges / 4 parts**. Covers the reselected batch-071 sample, new batch-072 sample, every Part A outcome-changed file, and all open lead-ruling files. **073–082 remain unauthored** (batch-boundary budget stop).

L12-39: verify number AND heading-title correspondence for narrative notes; only RUL10 passage/citing work-state edges keep dispositions, others have coverage-only retirement markers with no patch. Explicit Document history capture identities preserve. Deleted 00NN basenames join the scanner; 0001 has a title-search witness and dead-link park. A lead-ruling park is valid but its set cannot close. Keep dated Superseded-by and retained-root semantics distinct. Three batch-072 lead-ruling edges ask about exact historical capture/repro identities outside explicit history headings versus the current alias-preserve predicate; do not silently turn them into executable patches.

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

| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |
|---|---:|---:|---:|---:|---:|
| batch-071 | 10/2 | 0 | 2 | 12/2 | 4 |
| batch-072 | 11/2 | 0 | 2 | 7/2 | 4 |

Exact per-set NUL seeds/ranks are frozen in the manifest. Batch 071 has been reselected against corrected records using the same formula, not a replacement for a failed sample. Earlier sample freezes remain historical. Both strata: selected denominators above; reviewed denominator 0, rework pending; ≤3% per set/stratum passes, >3% expands to every file of that set. No pooling, reseeding after a verdict or self-acceptance. Outcome supplements do not change seeded denominators.

## Assigned parts

### Part 01 → `review-a38-step-03-wave4c-p01.md`

6 files / 30 edges / 260365 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/porting-log.md` | Part-A-outcome-change | 13 |
| batch-070 | `docs/knowledge/a-decision-doc-can-be-superseded-twice-superseded-by-becomes/a-decision-doc-can-be-superseded-twice-superseded-by-becomes-a-list.md` | Part-A-outcome-change | 10 |
| batch-071 | `docs/knowledge/fgos-sync-root-s-real-guards-and-outcome-shape/fgos-sync-root-outcome-shape.md` | patched-seeded | 1 |
| batch-071 | `docs/knowledge/fgos-version-cli-verb-output-shape-and-the-cli-version-visib/fgos-version-verb-output-fields.md` | unpatched-seeded | 1 |
| batch-071 | `docs/knowledge/how-fgos-s-event-log-is-allowed-to-evolve-without-breaking-r/event-log-evolution-discipline.md` | Part-A-outcome-change | 2 |
| batch-071 | `docs/knowledge/how-to-add-a-drift-guard-for-cli-registry-help-prose/add-a-drift-guard-for-cli-registry-help-prose.md` | Part-A-outcome-change | 3 |

### Part 02 → `review-a38-step-03-wave4c-p02.md`

6 files / 24 edges / 145805 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-071 | `docs/knowledge/how-to-avoid-a-hung-verify-command-on-fgos-return-approve-ca/avoid-a-hung-verify-on-return-approve-catchup.md` | patched-seeded | 1 |
| batch-071 | `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md` | Part-A-outcome-change | 3 |
| batch-071 | `docs/knowledge/how-to-check-whether-a-suspected-racing-mechanism-ever-actua/check-whether-a-suspected-mechanism-ever-fired-before-fixing-it.md` | unpatched-seeded | 2 |
| batch-072 | `docs/knowledge/how-to-close-a-duplicate-superseded-or-admin-decided-work-it/handle-a-duplicate-work-item.md` | patched-seeded, open-lead-ruling | 5 |
| batch-072 | `docs/knowledge/how-to-configure-a-executor-to-dispatch-via-a-named-agent-in/configure-an-executor-to-dispatch-via-a-named-agent.md` | patched-seeded | 4 |
| batch-072 | `docs/knowledge/how-to-find-every-caller-before-making-a-cli-flag-required/find-every-caller-before-requiring-a-cli-flag.md` | open-lead-ruling | 9 |

### Part 03 → `review-a38-step-03-wave4c-p03.md`

3 files / 19 edges / 76076 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-072 | `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md` | open-lead-ruling | 15 |
| batch-072 | `docs/knowledge/how-to-label-a-herdr-pane-with-the-claimed-task-from-a-chrom/fgos-terminal-pane-rename.md` | unpatched-seeded | 3 |
| batch-072 | `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md` | unpatched-seeded | 1 |

### Part 04 → `review-a38-step-03-wave4c-p04.md`

1 files / 39 edges / 345543 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-041 | `docs/specs/work-state.md` | Part-A-outcome-change | 39 |

## Required handback

Use Python field extraction, read every assigned complete pinned consumer, every record field/diff, actual target passages, exclusion reasons, search groups and retirement markers. Page source in consecutive ≤120-line chunks and proofs one field at a time; one file verdict remains intact. Separate outcome defects from record-text notes and Lead questions, reporting per-set AND per-stratum file denominators/rework numerators and overlaps. Write only the assigned report; never run checker/probes, repair records, dispatch review or accept the packet. Lead owns preview, independent acceptance, actual runner-commit two-manifest accounting and committed-byte acceptance. Workflow/RUL10/GAP-01/GAP-02, Step 5 parity/decision-index row rewrite, Step 6 relocation, Phase 9 step-10 semantic search and reading-map merge remain. No Step 3 acceptance, Phase 8 close or Phase 9 authorization is claimed.

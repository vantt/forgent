# Step 3 wave 5c — remaining-file expansion and L12-51 targeted re-review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Read A51, L12-21..L12-51, the latest authoring rules digest in progress.md and the record schema in step-03-authoring-request.md. Patch RECORDS only; no consumer edit or authority flip. **Reviewers never run checker/probes.** Started/accepted 0/0.

L12-51 expands batch-126 and batch-130 to every not-yet-reviewed file, including zero-edge records, plus targeted re-review of EVERY file changed by this rework pass (record-text changes included). Previous reviewed files/reports and frozen memberships remain historical, never replaced. Re-check D7 anchor 04994; new launcher line-63 deleted 0031 edge; present-tense 04982 RUL34/RUL37; 01325 approval-gate verbs; all 332 sourceCaptureIds capture/provenance keys and their actual doctor reader parity; 04114 dead link; corrected switchboard exact file owners and pathless status prose under coverage.switchboardStatusRowFlips; 0004 English/Vietnamese successor correspondence, retained-root suffixes, removed 0000 index projection note and resolved 04966 elision. Include the 06547 paired root-label/relative-destination patch. All assigned files are indivisible; larger files have their own part and ≤100-edge readingPages.

Frozen index `step-03-wave5c-expansion-review-index.json`: **26 whole files / 1388 edges / 11 parts**. Source, diff and record hashes bind every file. Review every assigned edge, full diff and complete pinned source/targets, including preserve, parks, row flips, status prose, author-added edges/exclusions and witnesses.

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

### Part 01 → `review-a38-step-03-wave5c-x-p01.md`

1 whole files / 42 edges / 99759 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-033 | `docs/architecture-map.md` | L12-51-changed-file-targeted-re-review | 42 |

### Part 02 → `review-a38-step-03-wave5c-x-p02.md`

1 whole files / 77 edges / 421762 source-plus-record bytes. **Indivisible file, own part: read ≤100-edge pages and bounded fields.**

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-059 | `docs/decisions/index.md` | L12-51-changed-file-targeted-re-review | 77 |

### Part 03 → `review-a38-step-03-wave5c-x-p03.md`

2 whole files / 143 edges / 323971 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/sources/beehive.md` | L12-51-changed-file-targeted-re-review | 68 |
| batch-070 | `docs/knowledge/decisions-index/decision-record.md` | L12-51-changed-file-targeted-re-review | 75 |

### Part 04 → `review-a38-step-03-wave5c-x-p04.md`

5 whole files / 38 edges / 300486 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md` | L12-51-changed-file-targeted-re-review | 16 |
| batch-074 | `docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md` | L12-51-changed-file-targeted-re-review | 3 |
| batch-077 | `docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md` | L12-51-changed-file-targeted-re-review | 7 |
| batch-077 | `docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md` | L12-51-changed-file-targeted-re-review | 3 |
| batch-081 | `docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md` | L12-51-changed-file-targeted-re-review | 9 |

### Part 05 → `review-a38-step-03-wave5c-x-p05.md`

3 whole files / 19 edges / 310776 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-081 | `docs/knowledge/why-the-decision-id-collision-auto-resolver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md` | L12-51-changed-file-targeted-re-review | 8 |
| batch-081 | `docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md` | L12-51-changed-file-targeted-re-review | 4 |
| batch-081 | `docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md` | L12-51-changed-file-targeted-re-review | 7 |

### Part 06 → `review-a38-step-03-wave5c-x-p06.md`

3 whole files / 33 edges / 361014 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-089 | `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md` | L12-51-changed-file-targeted-re-review | 28 |
| batch-089 | `docs/platform/agent-coordination/spec.md` | L12-51-changed-file-targeted-re-review | 4 |
| batch-094 | `docs/platform/contracts/architecture-manifest.json` | L12-51-changed-file-targeted-re-review | 1 |

### Part 07 → `review-a38-step-03-wave5c-x-p07.md`

5 whole files / 103 edges / 341878 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-098 | `docs/platform/documentation/history/id-systems-audit.md` | L12-51-changed-file-targeted-re-review | 25 |
| batch-126 | `docs/architecture-manifest.json` | L12-51-every-remaining-batch126-or130-file, L12-51-changed-file-targeted-re-review | 1 |
| batch-126 | `docs/backlog.md` | L12-51-changed-file-targeted-re-review | 58 |
| batch-126 | `docs/coexistence.md` | L12-51-changed-file-targeted-re-review | 6 |
| batch-126 | `docs/distribution-vision.md` | L12-51-changed-file-targeted-re-review | 13 |

### Part 08 → `review-a38-step-03-wave5c-x-p08.md`

1 whole files / 825 edges / 6147926 source-plus-record bytes. **Indivisible file, own part: read ≤100-edge pages and bounded fields.**

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-127 | `docs/doc-registry.json` | L12-51-changed-file-targeted-re-review | 825 |

### Part 09 → `review-a38-step-03-wave5c-x-p09.md`

2 whole files / 37 edges / 320457 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-130 | `docs/id-systems-audit.md` | L12-51-changed-file-targeted-re-review | 26 |
| batch-130 | `docs/io-contract.md` | L12-51-changed-file-targeted-re-review | 11 |

### Part 10 → `review-a38-step-03-wave5c-x-p10.md`

1 whole files / 2 edges / 399543 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-130 | `docs/operator-runbook-herdr-cockpit.md` | L12-51-every-remaining-batch126-or130-file | 2 |

### Part 11 → `review-a38-step-03-wave5c-x-p11.md`

2 whole files / 69 edges / 116955 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-130 | `docs/transitional-switchboard.md` | L12-51-changed-file-targeted-re-review | 69 |
| batch-130 | `docs/work-item-lifecycle-vision.md` | L12-51-every-remaining-batch126-or130-file | 0 |

## Handback

Write only your uniquely assigned report. Give a whole-file verdict with every edge read and exact record/diff hashes, evidence and dissent. Report reviewed-file denominator/rework numerator per set AND stratum, distinguishing overlaps. Separate semantic defects, record-text fixes and Lead questions. No repairs, checker/probes, dispatch or acceptance. Lead owns independent review, preview, actual runner-commit accounting and later drift revalidation. GAP-01/02/03, workflow/RUL10 carry and Step 5 parity remain separate gates; this packet claims no set closure or Phase 9 authorization. Names follow the explicit brief namespace; no fgOS CLI in this author Unit.

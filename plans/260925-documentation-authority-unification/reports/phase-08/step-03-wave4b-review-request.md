# Step 3 wave 4b — bounded authoring and independent review request

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. **Completed batch: 071 only, 25 files / 61 edges (60 inventory + 1 supplemental). Pending: 072–082, 264 files, unauthored and excluded.** Whole-batch budget boundary; this does not finish wave 4 or accept Step 3. Records only; no consumer edit or authority flip. Read owner-answers.md A51 and L12-21..L12-38, the current digest in progress.md, and step-03-authoring-request.md schema.

**Reviewers never run checker or probes.** Reviewers started/accepted 0/0. Lead owns rulings, independent acceptance, preview and committed-byte accounting in both untouched Phase 6 reproduction manifests. No Phase 8 close or Phase 9 authorization.

Frozen index: `step-03-wave4b-review-index.json`; manifest: `step-03-wave4b-manifest.json`. **4 distinct A51 files; 7 whole files / 13 edges / 2 review parts after union with Lead-ruling supplements.** Every part meets ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes. Each assigned file receives one whole-file verdict.

## Lead-ruling gaps — author does not settle these

1. Six edges 04295–04297 and 04306–04308 occur under the explicit `## Document history (compound-learn capture linkage)` headings. They record the original `docPath` and `fgos doc-sources` query, including verbatim capture data. The live-alias predicate does not recognize that history framing and would demand redirecting an exact historical identity to the consumer itself. They are parked as `lead-ruling`; no historical capture is rewritten. Decide the applicable history/identity treatment and implement any checker change in the separately owned review lane.
2. `event-log-evolution-discipline.md` L13 cites the bare deleted `0001-event-log-la-su-that.md`. The inventory and current scan omit it; complete source reading supplies one explicitly bound authorAddedEdge. Git history confirms the deleted path, and current candidate decision lookup yields no 0001 heading. Parked as `lead-ruling`: settle the exact doctrine/narrative holder and deleted-basename scan treatment; do not infer a target from incidental references.
3. The brief requires `blockedCategory: lead-ruling`, while the unchanged checker enum rejects that value. Its category/state failures are not waived or relabelled green. Review the actual source roles independently; reviewer does not change checker, probes, resolver or records.

Two additional parks are concrete description rewrites: 04266/04267 cite RUL41 as the full kind/via schema, while its live holder covers adapter dispatch and retired per-tier override. The shared adjacent claim needs reconciliation; it is not a claim that no RUL41 holder exists.

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

| Set | Patched population / seeded | Mandatory | Unpatched eligible / seeded | A51 union | Review union |
|---|---:|---:|---:|---:|---:|
| batch-071 | 10/2 | 0 | 12/2 | 4 | 7 |

Exact NUL-separated seeds, complete ranks, mandatory witnesses and record/diff/source hashes are frozen. Patched and unpatched selected denominators remain separate; actual reviewed denominators are 0 and rework numerators pending. ≤3% per set and stratum passes; >3% expands to every file of that set, including zero-edge files. Never pool, reseed, replace failed members or self-accept. Supplemental Lead-ruling review does not alter seed membership or denominators.

## Assigned parts

### Part 01 → `review-a38-step-03-wave4b-p01.md`

6 whole files / 11 edges / 109,312 source-plus-record bytes.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-071 | `docs/knowledge/fgos-sync-root-s-real-guards-and-outcome-shape/fgos-sync-root-outcome-shape.md` | patched-seeded | 1 |
| batch-071 | `docs/knowledge/fgos-version-cli-verb-output-shape-and-the-cli-version-visib/fgos-version-verb-output-fields.md` | unpatched-seeded | 1 |
| batch-071 | `docs/knowledge/how-fgos-s-event-log-is-allowed-to-evolve-without-breaking-r/event-log-evolution-discipline.md` | lead-ruling-supplement | 2 |
| batch-071 | `docs/knowledge/how-to-add-a-drift-guard-for-cli-registry-help-prose/add-a-drift-guard-for-cli-registry-help-prose.md` | lead-ruling-supplement | 3 |
| batch-071 | `docs/knowledge/how-to-avoid-a-hung-verify-command-on-fgos-return-approve-ca/avoid-a-hung-verify-on-return-approve-catchup.md` | patched-seeded | 1 |
| batch-071 | `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md` | lead-ruling-supplement | 3 |

### Part 02 → `review-a38-step-03-wave4b-p02.md`

1 whole files / 2 edges / 7,385 source-plus-record bytes.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-071 | `docs/knowledge/how-to-check-whether-a-suspected-racing-mechanism-ever-actua/check-whether-a-suspected-mechanism-ever-fired-before-fixing-it.md` | unpatched-seeded | 2 |

## Required handback

Write only the assigned uniquely named review report. Read every assigned complete pinned source through EOF, every record field, diff, actual target passage, source unit and scan exclusion using Python extraction above; hashes and author assertions are bindings only. Separate outcome defects, record-text notes and Lead questions. State per-file verdict, edges read, reviewed-file denominator and rework numerator separately per set/stratum, with overlaps explicit. No repairs, checker/probe runs, reviewer dispatch or acceptance.

Step 5 parity and decision-index regeneration/committed-row rewrite, workflow/RUL10/GAP-01/GAP-02 carry, Step 6 relocation and Phase 9 step-10 semantic-remnant/reading-map obligations remain. Prior freezes and requests remain unchanged.

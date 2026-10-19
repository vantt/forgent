# Step 3 wave 4d — one independent review request

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-40 and the current authoring digest. **Reviewers never run checker/probes.** Started/accepted 0/0.

Only new batches **073–074**, 50 whole-file records / 164 edges (160 inventory + 4 author-added). A51 plus open-ruling supplement selects **8 whole files / 48 edges / 2 parts**. Batches 075–082 remain unauthored at a complete-batch budget boundary. No partial batch. This request neither supersedes nor modifies wave4c, and assigns no earlier record, including the three bounded L12-40 preserves.

Use complete pinned source reads, including empty-diff files and supplemental exclusions. Re-evaluate actual passage roles and every adjacent description against exact target passages. L12-40: captured evidence (fences, blockquoted output, explicit completed grep results/work descriptions and history regions) preserves; self-alias never patches and only preserves in evidence, while live self prose parks for description rewrite. Exemption is no semantic approval of an operative writer recipe. Check current-status names, superseded seq procedures, generated versus manual index recipes, exact decision number AND title, source-derived units, relative forms and anchor precision.

073 includes separate description-rewrite parks for historical seq-procedure recommendations, the old manual index recipe and schedule warning citations whose asserted passage is absent from the actual update; two operative index writer lines park on Step 5 parity. 074 adds four source-bound spec basenames in the tsk-3j1 historical footprint and P8-DOC-GAP-02 carry notes for enduser-docs; the backlog generator claim parks under P8-DOC-GAP-03. Open lead-ruling edge 04444: actual Iron Law 0032 deletion/title holder conflicts with the current checker’s sibling Multi-role 0032 successor requirement; checker changes beyond L12-40 need a bounded Lead ruling. That whole file is included even if outside the seeded union. 04445 uses its real deleted Multi-role filename and proper successor. These are author judgments to review, never accepted facts merely because their bindings check.

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
| batch-073 | 15/3 | 0 | 3 | 6/1 | 4 |
| batch-074 | 6/1 | 0 | 1 | 10/2 | 3 |

Exact NUL seeds/ranks, source digests, diff hashes, mandatory threshold witnesses (≥65,536 bytes OR ≥40 inventory edges) and record hashes are frozen in the manifest. Patched population includes every nonempty Phase 9 diff; unpatched eligibility is empty diff with ≥1 edge, excluding already selected. Both strata separately have reviewed denominator 0 and rework pending. ≤3% rework per set/stratum passes; >3% expands to EVERY file in that set, including unpatched/zero-edge files. Never pool sets/strata, replace failed samples, reseed after findings or self-accept.

## Assigned parts

### Part 01 → `review-a38-step-03-wave4d-p01.md`

6 files / 27 edges / 219162 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-recover-a-blocked-item-with-fgos-catchup-from-inside/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md` | patched-seeded | 4 |
| batch-073 | `docs/knowledge/how-to-register-a-fixable-doctor-check-in-fgos/register-a-fixable-doctor-check-in-fgos.md` | unpatched-seeded | 6 |
| batch-073 | `docs/knowledge/how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md` | patched-seeded | 3 |
| batch-073 | `docs/knowledge/how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md` | patched-seeded | 7 |
| batch-074 | `docs/knowledge/produce-failing-test-first-proof-for-an-iron-law-gated-diff/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` | unpatched-seeded | 3 |
| batch-074 | `docs/knowledge/spec-docs-drift-silently-when-only-the-code-has-an-exact-mat/spec-docs-drift-silently-when-only-code-has-an-exact-match-test.md` | unpatched-seeded | 4 |

### Part 02 → `review-a38-step-03-wave4d-p02.md`

2 files / 21 edges / 125007 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-074 | `docs/knowledge/the-9-findings-from-the-2026-08-14-haiku-scan-fable-code-rev/gateway-subsystem-audit-260814-findings.md` | patched-seeded | 5 |
| batch-073 | `docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md` | open-lead-ruling | 16 |

## Required handback

Read each assigned complete consumer at the fixed pin via git show in consecutive ≤120-line pages, every record field and complete diff, target passages, resolution witness hit groups and supplemental exclusions. Use Python per-field extraction above; never dump a full JSONL record. A field >300,000 bytes is paged as UTF-8 bytes; one whole-file verdict remains indivisible. Write only the assigned report. Report per-set AND per-stratum file denominators/rework numerators, including overlaps; separate semantic outcome defects, record-text notes and Lead questions. Do not run checker/probes, repair records, dispatch review or accept a packet. Lead owns preview, independent acceptance, actual runner-commit accounting in both manifests and committed-byte acceptance. Workflow/RUL10/GAP-01/02/03 carry, Step 5 parity and Phase 9 remain separately gated. No Step 3 acceptance, phase close or Phase 9 authorization is claimed.

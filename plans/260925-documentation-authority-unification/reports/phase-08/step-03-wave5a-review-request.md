# Step 3 wave 5a — one independent review request

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-46 and the authoring digest. **Reviewers never run checker/probes.** Started/accepted 0/0.

New batches **079–082** only: 89 whole-file records / 250 edges. Two A51 strata select **14 whole files / 37 edges / 3 parts**. Complete-batch authoring-budget stop after 082; 083 onward remain unauthored. No partial next batch. Existing ≤078 reviews remain separate and unchanged.

Review complete source roles and adjacent descriptions, including L12-46 completed-action historyRegion declarations. Verify each heading names a completed task/action and the marker and edge actually lie inside it; a mechanically bound marker alone does not prove the passage role. Check the 0014/0027 carry parks, generic spec-template authority rewrites, old decision-index runtime parity, RUL40 reversal, acceptance delivered-vs-done cutoff and superseded events-jsonl recipe. Review actual complete source roles and adjacent descriptions, not advisory census actions. Read aliases, candidate target passages, precise anchors, units, supplemental exclusions and all parked/preserve entries.

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
| batch-079 | 10/2 | 0 | 2 | 10/2 | 4 |
| batch-080 | 6/1 | 0 | 1 | 12/2 | 3 |
| batch-081 | 15/3 | 0 | 3 | 7/2 | 5 |
| batch-082 | 6/1 | 0 | 1 | 6/1 | 2 |

The manifest freezes exact NUL seeds/ranks, source/diff/record hashes and mandatory witnesses (≥65,536 bytes OR ≥40 inventory edges). Patched population includes all nonempty Phase 9 diffs. Unpatched population = empty diff with ≥1 edge, excluding already selected. Each stratum separately has reviewed denominator 0 and rework pending. ≤3% per set/stratum passes; >3% expands to EVERY file of that set, including unpatched/zero-edge files. Never pool, reseed, replace failed samples or self-accept.

## Assigned parts

### Part 01 → `review-a38-step-03-wave5a-p01.md`

6 files / 18 edges / 97762 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-079 | `docs/knowledge/why-fgos-s-automatic-capture-records-the-what-but-not-the-wh/fgos-capture-points-and-the-why-gap.md` | unpatched-seeded | 4 |
| batch-079 | `docs/knowledge/why-fgos-treats-self-development-as-a-bounded-lane-with-its/why-fgos-self-development-is-not-the-default-mission.md` | patched-seeded | 5 |
| batch-079 | `docs/knowledge/why-herdr-cockpit-stacked-worker-launches-into-a-single-reus/why-herdr-cockpit-stacked-worker-launches-into-one-pane.md` | patched-seeded | 4 |
| batch-079 | `docs/knowledge/why-keywordriskgate-now-skips-the-heavy-risk-ask-when-a-verd/keywordriskgate-skips-when-verdict-cites-a-locked-decision.md` | unpatched-seeded | 2 |
| batch-080 | `docs/knowledge/why-mergereadiness-excludes-superseded-items/why-mergereadiness-excludes-superseded-items.md` | unpatched-seeded | 1 |
| batch-080 | `docs/knowledge/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout.md` | patched-seeded | 2 |

### Part 02 → `review-a38-step-03-wave5a-p02.md`

6 files / 14 edges / 149540 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-080 | `docs/knowledge/why-resolveplan-s-pass-through-path-now-checks-planapproveve/why-resolveplans-pass-through-path-now-checks-planapproveverify-before-executing.md` | unpatched-seeded | 1 |
| batch-081 | `docs/knowledge/why-session-claim-liveness-measures-worktree-activity-not-pi/why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md` | patched-seeded | 5 |
| batch-081 | `docs/knowledge/why-src-runner-dispatch-mjs-s-capacity-executor-layer-was-re/why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md` | patched-seeded | 3 |
| batch-081 | `docs/knowledge/why-state-json-s-write-became-atomic-while-its-lock-scope-cl/why-state-json-writes-became-atomic-while-its-lock-scope-claim-turned-out-already-fixed.md` | unpatched-seeded | 1 |
| batch-081 | `docs/knowledge/why-the-herdr-fgos-dashboard-shipped-as-three-sequential-chi/herdr-fgos-dashboard-three-piece-build.md` | patched-seeded | 2 |
| batch-081 | `docs/knowledge/why-the-iron-law-evidence-contract-gathers-proof-but-never-a/iron-law-evidence-contract-stays-human-gated.md` | unpatched-seeded | 2 |

### Part 03 → `review-a38-step-03-wave5a-p03.md`

2 files / 5 edges / 38008 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-082 | `docs/knowledge/why-the-pre-commit-hook-got-its-own-shorter-main-checkout-lo/why-the-pre-commit-hook-got-its-own-shorter-lock-ttl.md` | patched-seeded | 3 |
| batch-082 | `docs/knowledge/why-the-stage-axis-driving-loop-and-status-axis-pool-sweep-s/why-the-stage-status-driving-split-decision-got-superseded.md` | unpatched-seeded | 2 |

## Required handback

Read each complete pinned consumer via git show in consecutive ≤120-line pages; use the Python per-field extractor above for each record field and complete diff. Never dump a full JSONL record. A field >300,000 bytes is paged as UTF-8 bytes, preserving one whole-file verdict. Check target claims, witness groups and supplemental exclusions. Write only the assigned report. Give per-set AND per-stratum file denominators/rework numerators and overlaps; separate semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch review or accept this request. Lead owns preview, independent acceptance, actual runner-commit accounting and committed-byte acceptance. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separately gated. No Step 3 acceptance or phase close is claimed.

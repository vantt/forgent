# Step 3 wave 3 — independent A51 per-set review

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only: no consumer edit, no authority flip, no Step 3 self-acceptance. Read A51, L12-10 and L12-21..L12-37 in owner-answers.md, the latest authoring rules digest in progress.md, and the schema in step-03-authoring-request.md. Reviewers started/accepted **0/0**.

Frozen packet: **38 whole files / 597 coverage edges / 11 parts**. Index `step-03-wave3-review-index.json` binds exact current records, source/diff hashes and per-set membership. Every assigned file must be read whole; hash equality is a binding, never semantic acceptance.

## Reading method and scope

**Reviewers never run checker or probes.** Read complete pinned consumers with `git show <pin>:<file>` in consecutive bounded chunks; independently read exact committed targets and adjacent descriptions. Use Python field extraction below, never cat/grep/print an entire JSONL line. Review every edge, including preserve, parked, row-flip, author-added and legacy-scan exclusions. Check source-derived unit boundaries, exact carriage declarations, truthful history facts/notes, locators, complete label/destination and relative coordinates.

Related includes body `## Related` lists. Missing-path alias preserves outside declared carriage/history fail L12-37 even in quotations. Undated live decision citations are navigation. Live objects naming a retiring tree require a complete description rewrite. Historical Superseded-by framing stays literal with a record-only note; CoordinationSession history notes must point to h-aabefc85f0c9.md. A same-line or wrapped-list unit defaults to one disposition; independently verify any source-bound Distinct claim exception.

Shipped `docs/contracts/fgos-gateway-api-v1.yaml` remains CTR010/A45: schema/identity/numbering must not change. Generator-owned docs/decisions/index.md parks to `fgos decision-index` via src/report/decision-index.mjs; never hand-patch the projection. Distillery upstream sources are retained with their own external coordinates, distinct from live fgOS claims. Dated explanations/journals preserve historical actions; live navigation in them still follows current rulings. Maintained architect files retire only after reader cutover, with no payload evidence exemption.

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

| Set | Patched population / sample | Mandatory | Patched+mandatory distinct | Unpatched eligible / sample | Union |
|---|---:|---:|---:|---:|---:|
| batch-042 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-043 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-044 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-045 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-046 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-047 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-048 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-049 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-050 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-051 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-052 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-053 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-054 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-055 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-056 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-057 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-058 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-059 | 0/0 | 1 | 1 | 0/0 | 1 |
| batch-060 | 0/0 | 1 | 1 | 5/1 | 2 |
| batch-061 | 0/0 | 6 | 6 | 9/2 | 8 |
| batch-062 | 0/0 | 1 | 1 | 1/1 | 2 |
| batch-063 | 2/1 | 0 | 1 | 17/3 | 4 |
| batch-064 | 3/1 | 0 | 1 | 15/3 | 4 |
| batch-065 | 3/1 | 0 | 1 | 15/3 | 4 |
| batch-066 | 4/1 | 0 | 1 | 14/3 | 4 |
| batch-067 | 1/1 | 0 | 1 | 13/2 | 3 |
| batch-068 | 12/2 | 0 | 2 | 9/2 | 4 |
| batch-069 | 0/0 | 0 | 0 | 2/1 | 1 |

Zero-edge files remain in the freeze; retired consumers are not sampled. Both seeded strata preserve their own per-set population/ranks/ceil(15%) rule, mandatory union and ≤3% rework threshold. A breach expands to every surviving file of that set. Denominators are selected files now, reviewed denominator 0 and rework pending until independent review; never pool or replace a failed sample.

## Assigned parts

### Part 01 → `review-a38-step-03-wave3-p01.md`

1 whole files / 17 edges / 69,838 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-058 | `docs/contracts/fgos-gateway-api-v1.yaml` | unpatched-seeded | 17 |

### Part 02 → `review-a38-step-03-wave3-p02.md`

1 whole files / 77 edges / 421,619 source-plus-record bytes. **Indivisible file: stream bounded field/edge pages; one verdict.**

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-059 | `docs/decisions/index.md` | mandatory-threshold | 77 |

### Part 03 → `review-a38-step-03-wave3-p03.md`

1 whole files / 207 edges / 276,811 source-plus-record bytes. **Indivisible file: stream bounded field/edge pages; one verdict.**

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-060 | `docs/distillery/comparison-matrix.md` | mandatory-threshold | 207 |

### Part 04 → `review-a38-step-03-wave3-p04.md`

3 whole files / 59 edges / 296,952 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-060 | `docs/distillery/deep-dives/how-to-use-herdr.md` | unpatched-seeded | 2 |
| batch-061 | `docs/distillery/deep-dives/work-item-management.md` | mandatory-threshold | 46 |
| batch-061 | `docs/distillery/porting-log.md` | mandatory-threshold | 11 |

### Part 05 → `review-a38-step-03-wave3-p05.md`

3 whole files / 84 edges / 331,318 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md` | mandatory-threshold | 31 |
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md` | mandatory-threshold | 44 |
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md` | mandatory-threshold | 9 |

### Part 06 → `review-a38-step-03-wave3-p06.md`

3 whole files / 82 edges / 330,918 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/sources/beehive.md` | mandatory-threshold | 68 |
| batch-061 | `docs/distillery/sources/compound-engineering-plugin.md` | unpatched-seeded | 6 |
| batch-061 | `docs/distillery/sources/repository-harness.md` | unpatched-seeded | 8 |

### Part 07 → `review-a38-step-03-wave3-p07.md`

6 whole files / 12 edges / 134,786 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-062 | `docs/distillery/sources/superpowers.md` | mandatory-threshold | 0 |
| batch-062 | `docs/distillery/sources/symphony.md` | unpatched-seeded | 6 |
| batch-063 | `docs/explanation/branch-content-mismatch-fgos-exclusion.md` | patched-seeded | 1 |
| batch-063 | `docs/explanation/capabilities-prefer-symmetry-removed.md` | unpatched-seeded | 1 |
| batch-063 | `docs/explanation/citation-baseline-cleanup-calibration-slice.md` | unpatched-seeded | 2 |
| batch-063 | `docs/explanation/codex-bypass-executor.md` | unpatched-seeded | 2 |

### Part 08 → `review-a38-step-03-wave3-p08.md`

6 whole files / 18 edges / 72,894 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-064 | `docs/explanation/dispatch-config-cache-scope-narrowed.md` | unpatched-seeded | 2 |
| batch-064 | `docs/explanation/eventlog-guard-fail-closed-event-count-checkpoint.md` | unpatched-seeded | 2 |
| batch-064 | `docs/explanation/eventlog-sweep-checkpoint-redesign.md` | patched-seeded | 6 |
| batch-064 | `docs/explanation/eventlog-tier-a-multifile-content-hash-redesign.md` | unpatched-seeded | 6 |
| batch-065 | `docs/explanation/executor-dispatch-manual-log-gap-and-step-b5-fix.md` | unpatched-seeded | 1 |
| batch-065 | `docs/explanation/fanout-batch-per-child-sync-spawn-and-listwork.md` | unpatched-seeded | 1 |

### Part 09 → `review-a38-step-03-wave3-p09.md`

6 whole files / 18 edges / 63,010 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-065 | `docs/explanation/footprint-diff-research-md-noise.md` | unpatched-seeded | 7 |
| batch-065 | `docs/explanation/herdr-orchestrator-terminology-boundary.md` | patched-seeded | 5 |
| batch-066 | `docs/explanation/mode-gate-tiny-small-skip-load.md` | unpatched-seeded | 2 |
| batch-066 | `docs/explanation/partial-claim-event-loss-covered-by-tsk-1vc.md` | unpatched-seeded | 1 |
| batch-066 | `docs/explanation/retro-next-shared-driving.md` | unpatched-seeded | 1 |
| batch-066 | `docs/explanation/return-approve-background-execution-guidance.md` | patched-seeded | 2 |

### Part 10 → `review-a38-step-03-wave3-p10.md`

6 whole files / 12 edges / 109,696 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-067 | `docs/explanation/root-resolution-two-call-split-propagation.md` | unpatched-seeded | 2 |
| batch-067 | `docs/explanation/tsk-397-post-merge-review-remediation.md` | unpatched-seeded | 2 |
| batch-067 | `docs/explanation/worktree-manual-merge-fgos-blob-safety-net.md` | patched-seeded | 2 |
| batch-068 | `docs/how-to/author-a-plan-loop-track.md` | unpatched-seeded | 3 |
| batch-068 | `docs/how-to/coordination-examples/architecture-advisory-panel-v1-alternative-and-composite-reopen.md` | patched-seeded | 2 |
| batch-068 | `docs/how-to/coordination-examples/architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md` | patched-seeded | 1 |

### Part 11 → `review-a38-step-03-wave3-p11.md`

2 whole files / 11 edges / 39,488 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-068 | `docs/how-to/run-a-coordination-session.md` | unpatched-seeded | 10 |
| batch-069 | `docs/journals/260728-2038-claim-port-str46-parallel-merge.md` | unpatched-seeded | 1 |

## Required handback

Write only the assigned unique review report. State pin, complete reading method and record/diff hashes; give a per-file verdict and edges read. Separate outcome defects (rework) from record-text notes and Lead-ruling questions. Report reviewed-file denominator/rework numerator per set AND stratum (including overlaps), not a pooled rate. Keep exact source/target evidence and dissent. No repairs, checker/probes, review dispatch or acceptance.

Lead owns independent dispatch/acceptance, actual runner-commit accounting in both untouched Phase 6 reproduction manifests, committed-byte acceptance and preview. Workflow/RUL10/GAP-02 carry and Step 5 parity remain outstanding; Phase 8 close and Phase 9 authorization are not claimed. New Lead-ruling gaps required for this author packet: 0. Names use the exact brief-authorized namespace because this worker must not call fgOS CLI.

**Locator-format note:** 03990 cites `§9.2.` at sentence end. The lexical advisory retains the final period, while the exact pinned target heading is `9.2 hostRead: blind` (agent-confinement/spec.md, line 454). The record already binds that exact heading/anchor and full blind-unit claim; all anchor checks pass. This is one new punctuation advisory plus four inherited flags, not a missing holder or a new Lead-ruling gap. The unmodified extractor remains authoritative; A51 membership is unchanged.

# Step 3 wave 5g — independent A51 file review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. New batches **122, 121, 120, 119, 118, 117, 116, 115, 114**, authored in that order. **49 files / 388 edges** are records only; no consumer edit or authority flip. A51, L12-21..L12-51 and the full authoring digest in progress.md remain binding. Independent reviewers started/accepted: **0/0**.

Frozen selection: **21 whole files / 253 edges / 8 parts**, bound by `step-03-wave5g-manifest.json` and `step-03-wave5g-review-index.json`. Every assigned file requires its whole source and complete diff/record verdict. **Reviewers never run checker, probes or resolver scripts.** Mechanical evidence does not accept semantics.

Read whole pinned source via `git show <pin>:<consumer>` in consecutive ≤120-line chunks through EOF, and read the actual committed target passages independently. Use Python extraction one field at a time, with ≤100-edge reading pages listed in the index. Files stay indivisible. An oversized file is isolated in its own part; fields are UTF-8 byte-paged at ≤300,000 bytes.

## Per-field Python reading method

Copy the assigned batch and exact file from the part table. Run the extractor in separate modes for header/diff, edges and proof fields; finish every page through EOF. Never print an entire serialized record.

```python
import json, pathlib
root = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
batch = 'COPY NUMBER'
consumer = 'COPY EXACT PATH'
record = next(json.loads(line) for line in (root/'step-03-records'/f'batch-{batch}.jsonl').read_text().splitlines() if json.loads(line)['file'] == consumer)
def emit(label, value):
    data = json.dumps(value, ensure_ascii=False, indent=2).encode()
    for start in range(0, len(data), 300000):
        print(label, 'byte page', start, data[start:start+300000].decode('utf-8', errors='backslashreplace'))
mode = 'header'  # then edges, then proofs
if mode == 'header':
    for key in ('file','authorInputCommit','digest','inventoryEdgeIds','authoringRules','diff'):
        emit(key, record.get(key))
if mode == 'edges':
    first, last = 1, min(100, len(record['edges']))  # repeat 101–200, etc.
    for edge in record['edges'][first-1:last]:
        for key, value in edge.items(): emit(edge['edgeId']+' '+key, value)
if mode == 'proofs':
    for section in ('coverage','anchors','relativeResolution','labelForm'):
        for key, value in record['checks'][section].items():
            if key == 'legacyScan':
                for k, val in value.items():
                    if k != 'candidates': emit(section+' '+key+' '+k, val)
                for i, val in enumerate(value['candidates']): emit('scan candidate '+str(i), val)
            elif isinstance(value, dict):
                for k, val in value.items(): emit(section+' '+key+' '+k, val)
            else: emit(section+' '+key, value)
```

## Review focus

Distinguish Source/Provenance and original correction evidence from live Related lists. Check exact source-carriage declarations and their wrapper boundary, history versus present claims, self/duplicate Related entries, complete migration-state row semantics and retained root paths. `docs/ui-spec/**` survives. Its candidate architecture/contracts remain live outside actual history: verify dashboard operations, R1–R11 and Data Dictionary locators against their exact target sections. YAML comments are prose; config/schema/contract keys are unchanged.

For runner/work-state, check precise blind §9.2 and ADR-0005/RUL61 holders, stale vocabulary coordinates, provisioning §13.1/Step 5 parity, full workflow/GAP-02 carry, the approval-gate operation and complete adjacent descriptions. Check named counts, defaults, ports, verb/file lists, versions and shipped status rather than trusting the author comparison verdict. Source/target digest equality binds bytes only. Preserve explicit “Đã đóng” store-atomic-rmw evidence per 08351. Distinguish its live missing sibling links.

Three new advisory locator flags bind exact correspondence for 07614 (ADR-0005 → 0005 heading), 07732 (curated catalog label → runner.capabilities heading), and 07807 (Vietnamese pull-door title → English Take And Return). The 07614 file is an extra whole-file locator supplement; the other two are already in the frozen selection. Edge 07592 parks because the above-vocabulary locator became false after the split. Review these source/target relationships independently; the checker does not accept their semantics.

Open Lead questions are listed per set in the population and full-check receipt, with five-part questions in `step-03-wave5g-lead-ruling-gaps.json`: 07786 carriage-wrapper boundary and ten same-consumer deleted-decision narrative notes. Do not settle these yourself or modify checker/probes. L12-51(5) whole-link root label + relative destination is one reference and both must change together; any local form-only failures must be listed separately, never hidden.

## A51 per-set selection

| Set | Patched population / seeded | Mandatory | Patched+mandatory | Unpatched eligible / seeded | Lead supplement | Distinct |
|---|---:|---:|---:|---:|---:|---:|
| batch-122 | 2/1 | 2 | 3 | 1/1 | 0 | 4 |
| batch-121 | 0/0 | 0 | 0 | 1/1 | 0 | 1 |
| batch-120 | 12/2 | 0 | 2 | 5/1 | 0 | 3 |
| batch-119 | 1/1 | 0 | 1 | 0/0 | 0 | 1 |
| batch-118 | 1/1 | 0 | 1 | 0/0 | 0 | 1 |
| batch-117 | 1/1 | 0 | 1 | 4/1 | 1 | 3 |
| batch-116 | 1/1 | 0 | 1 | 0/0 | 0 | 1 |
| batch-115 | 16/3 | 4 | 5 | 0/0 | 0 | 6 |
| batch-114 | 1/1 | 0 | 1 | 0/0 | 0 | 1 |

Both strata freeze exact NUL seeds/ranks: patched uses `A51-step03-file-v1` NUL pin NUL batch number; unpatched uses `A51-step03-file-v1-unpatched` NUL pin NUL `batch-NNN`. Take ceil(15%) in each eligible stratum; exclude already-selected mandatory files before the unpatched draw, as in the existing selector. Mandatory source ≥65,536 bytes OR ≥40 edges includes every inventory-threshold witness (the manifest also counts added edges, a stronger witness). No pooling/reseeding. Report selected and reviewed-file denominators and rework numerators by set AND stratum with overlaps. **>3% rework expands to EVERY file of that set, including unpatched, parked, preserve, row-flip and zero-edge files.** Reviewed denominators remain zero and rework pending until independent review.

## Assigned parts

### Part 01 → `review-a38-step-03-wave5g-p01.md`

2 files / 23 edges / 361435 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-122 | `docs/platform/work-state/architecture/implementation-pointers.md` | unpatched-seeded | 7 |
| batch-122 | `docs/platform/work-state/contracts/cli-io-contract.md` | patched-seeded | 16 |

### Part 02 → `review-a38-step-03-wave5g-p02.md`

5 files / 42 edges / 396008 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-122 | `docs/platform/work-state/decisions/retired-decision-history.md` | mandatory-threshold | 15 |
| batch-122 | `docs/platform/work-state/spec.md` | mandatory-threshold | 17 |
| batch-121 | `docs/platform/vision.md` | unpatched-seeded | 4 |
| batch-120 | `docs/platform/ui-spec/architecture/modals/M02-approve-merge.md` | patched-seeded | 3 |
| batch-120 | `docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md` | patched-seeded | 3 |

### Part 03 → `review-a38-step-03-wave5g-p03.md`

6 files / 62 edges / 383981 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-120 | `docs/platform/ui-spec/operations/F02-approve-a-merge.md` | unpatched-seeded | 2 |
| batch-119 | `docs/platform/terminal-control/spec.md` | patched-seeded | 2 |
| batch-118 | `docs/platform/system-overview/spec.md` | patched-seeded | 21 |
| batch-117 | `docs/platform/system-architecture/architecture/architecture-intent.md` | patched-seeded | 14 |
| batch-117 | `docs/platform/system-architecture/architecture/workspace-topology-audit.md` | unpatched-seeded | 5 |
| batch-117 | `docs/platform/system-architecture/history/architect-readme.md` | open-lead-ruling-whole-file-supplement | 18 |

### Part 04 → `review-a38-step-03-wave5g-p04.md`

2 files / 10 edges / 95841 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-116 | `docs/platform/session-identity/spec.md` | patched-seeded | 3 |
| batch-115 | `docs/platform/runner/contracts/routing-handoff.md` | ADR-prefix-locator-whole-file-supplement | 7 |

### Part 05 → `review-a38-step-03-wave5g-p05.md`

1 files / 70 edges / 342352 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-115 | `docs/platform/runner/decisions/h-36d872fbb0e5.md` | patched-seeded, mandatory-threshold, open-lead-ruling-whole-file-supplement | 70 |

### Part 06 → `review-a38-step-03-wave5g-p06.md`

3 files / 23 edges / 224077 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-115 | `docs/platform/runner/operations/h-51f5cd7279fd.md` | patched-seeded, mandatory-threshold | 4 |
| batch-115 | `docs/platform/runner/spec.md` | mandatory-threshold | 16 |
| batch-115 | `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md` | patched-seeded | 3 |

### Part 07 → `review-a38-step-03-wave5g-p07.md`

1 files / 17 edges / 373000 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-115 | `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` | mandatory-threshold | 17 |

### Part 08 → `review-a38-step-03-wave5g-p08.md`

1 files / 6 edges / 79857 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-114 | `docs/platform/run-supervisor/spec.md` | patched-seeded | 6 |

## Handback

Write only the assigned uniquely named report. Give a whole-file verdict with pinned source/record/diff hashes, complete reading pages and every edge/proof reviewed. Separate outcome rework, record-text corrections and Lead questions; retain exact source/target evidence and dissent. Reviewers do not run checker/probes, repair records, dispatch or accept. Lead owns preview, independent acceptance, real runner-commit accounting and Step 4 source/target revalidation. No set closure, Phase 8 close, runtime parity or Phase 9 authorization is claimed. Earlier requests/memberships are unchanged. Names follow the explicit brief namespace; the fgOS CLI is forbidden in this worker.

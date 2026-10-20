# Step 3 wave 5e — independent A51 review

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only. A51 and L12-21..L12-49, including the latest authoring rules digest, remain binding. **Reviewers never run checker/probes.** Started/accepted 0/0. No consumer edit, authority flip or author acceptance.

New batches **086–104 only**, 102 whole-file records. Candidate content is live outside actual history/carriage. Check the source-inventory ledger as original migration evidence; wrapper Related separately from Provenance and Superseded-by; the exact 0026 deferred-phase/0034 holders; component-boundary whole migration rows and Workflow carry; citation-checker default/scope parity; switchboard full-row semantics (including retained paths and GAP-02/03); shipped CTR010 runtime parity; original Source Metadata captures; RUL40 exact re-scope and setup/doctor registry holder. **Open lead-ruling: batch-089 maps-j-06547**, mixed root-path label and relative destination; see `step-03-wave5e-lead-ruling-gaps.json`. That set cannot close before Lead settles it; other sets have empty open lead-ruling lists.

Each ordinary part is ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes. An indivisible larger file is isolated in its own part: follow the index readingPages in **≤100-edge pages**, source in consecutive ≤120-line chunks, and Python field extraction below. Never print a complete JSONL record. Keep one whole-file verdict and complete diff; edge paging never splits seed membership. Mandatory source byte and inventory-edge thresholds are preserved; the unchanged selector additionally includes files reaching 40 total edges after supplemental discovery (stronger review coverage).

Frozen index `step-03-wave5e-review-index.json`: **34 whole files / 1013 edges / 9 parts**. Source/diff/current-record hashes bind each assigned file. Read EVERY edge and complete diff of each assigned consumer in full pinned-source context, including preserve, parked, row flips, supplemental edges/exclusions and search witnesses.

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




## Per-set A51 selection

| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct |
|---|---:|---:|---:|---:|---:|
| batch-086 | 0/0 | 1 | 1 | 0/0 | 1 |
| batch-087 | 21/4 | 1 | 5 | 4/1 | 6 |
| batch-088 | 25/4 | 1 | 5 | 0/0 | 5 |
| batch-089 | 13/2 | 0 | 2 | 7/2 | 4 |
| batch-090 | 1/1 | 0 | 1 | 0/0 | 1 |
| batch-091 | 1/1 | 0 | 1 | 0/0 | 1 |
| batch-092 | 1/1 | 0 | 1 | 0/0 | 1 |
| batch-093 | 1/1 | 1 | 1 | 0/0 | 1 |
| batch-094 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-095 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-096 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-097 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-098 | 0/0 | 2 | 2 | 5/1 | 3 |
| batch-099 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-100 | 0/0 | 1 | 1 | 0/0 | 1 |
| batch-101 | 1/1 | 1 | 1 | 0/0 | 1 |
| batch-102 | 0/0 | 0 | 0 | 1/1 | 1 |
| batch-103 | 2/1 | 0 | 1 | 1/1 | 2 |
| batch-104 | 1/1 | 1 | 1 | 0/0 | 1 |

Both strata use their own NUL-seeded sha256(path) ranks and ceil(15%) selection, with mandatory ≥65,536 source bytes OR ≥40 inventory edges. Each set/stratum retains its own reviewed denominator/rework numerator; no pooling or reseeding. A >3% rework breach expands semantic review to EVERY file of that set, including parked/preserve/row-flip and zero-edge files. Frozen historical memberships stay unchanged.

## Assigned parts

### Part 01 → `review-a38-step-03-wave5e-p01.md`

1 files / 469 edges / 686349 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-086 | `docs/platform/agent-coordination/history/documentation-migration/source-inventory.md` | mandatory-threshold | 469 |

### Part 02 → `review-a38-step-03-wave5e-p02.md`

6 files / 76 edges / 290290 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-087 | `docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md` | unpatched-seeded | 14 |
| batch-087 | `docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-continuation-recovery.md` | patched-seeded | 6 |
| batch-087 | `docs/platform/agent-coordination/history/retired-engine/files/architecture/runtime-model.md` | patched-seeded | 9 |
| batch-087 | `docs/platform/agent-coordination/history/retired-engine/files/contracts/assignment-run-runresult.md` | patched-seeded | 11 |
| batch-087 | `docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md` | mandatory-threshold | 32 |
| batch-087 | `docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-004-reserve-job.md` | patched-seeded | 4 |

### Part 03 → `review-a38-step-03-wave5e-p03.md`

6 files / 141 edges / 320044 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-088 | `docs/platform/agent-coordination/history/retired-engine/files/proposals/dispatch-control-plane-redesign.md` | patched-seeded | 32 |
| batch-088 | `docs/platform/agent-coordination/history/retired-engine/files/proposals/semantic-cli-surface.md` | patched-seeded | 5 |
| batch-088 | `docs/platform/agent-coordination/history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md` | mandatory-threshold | 31 |
| batch-088 | `docs/platform/agent-coordination/history/retired-engine/files/spec.md` | patched-seeded | 13 |
| batch-088 | `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/canonical-concepts.md` | patched-seeded | 24 |
| batch-089 | `docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/claim-preservation.md` | unpatched-seeded | 36 |

### Part 04 → `review-a38-step-03-wave5e-p04.md`

6 files / 27 edges / 379484 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-089 | `docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md` | unpatched-seeded | 11 |
| batch-089 | `docs/platform/agent-coordination/vocabulary/canonical-concepts.md` | patched-seeded | 1 |
| batch-089 | `docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md` | patched-seeded | 2 |
| batch-090 | `docs/platform/agent-protocol/spec.md` | patched-seeded | 1 |
| batch-091 | `docs/platform/claude-plugin/spec.md` | patched-seeded | 4 |
| batch-092 | `docs/platform/coexistence/spec.md` | patched-seeded | 8 |

### Part 05 → `review-a38-step-03-wave5e-p05.md`

1 files / 39 edges / 1742868 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-093 | `docs/platform/component-boundary.md` | patched-seeded, mandatory-threshold | 39 |

### Part 06 → `review-a38-step-03-wave5e-p06.md`

6 files / 131 edges / 368223 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-094 | `docs/platform/contracts/architecture-manifest.json` | unpatched-seeded | 1 |
| batch-095 | `docs/platform/convention/spec.md` | unpatched-seeded | 1 |
| batch-096 | `docs/platform/decision-citation-drift/spec.md` | unpatched-seeded | 17 |
| batch-097 | `docs/platform/distillery/spec.md` | unpatched-seeded | 5 |
| batch-098 | `docs/platform/documentation/history/id-systems-audit.md` | unpatched-seeded | 25 |
| batch-098 | `docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md` | mandatory-threshold | 82 |

### Part 07 → `review-a38-step-03-wave5e-p07.md`

3 files / 75 edges / 230620 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-098 | `docs/platform/documentation/switchboard.md` | mandatory-threshold | 68 |
| batch-099 | `docs/platform/domainization/architecture/domainization.md` | unpatched-seeded | 4 |
| batch-100 | `docs/platform/event-store/spec.md` | mandatory-threshold | 3 |

### Part 08 → `review-a38-step-03-wave5e-p08.md`

2 files / 15 edges / 331501 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-101 | `docs/platform/git/spec.md` | patched-seeded, mandatory-threshold | 2 |
| batch-102 | `docs/platform/governance.md` | unpatched-seeded | 13 |

### Part 09 → `review-a38-step-03-wave5e-p09.md`

3 files / 40 edges / 328884 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-103 | `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | unpatched-seeded | 17 |
| batch-103 | `docs/platform/herdr-web-dashboard/spec.md` | patched-seeded | 19 |
| batch-104 | `docs/platform/holder-lock/spec.md` | patched-seeded, mandatory-threshold | 4 |

## Handback

Write only the assigned uniquely named report. Give one whole-file verdict per file, exact record/diff bindings, every edge read, per-set AND per-stratum reviewed-file denominators and rework numerators (with overlaps), evidence and dissent. Distinguish semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch or accept. Lead owns preview, independent review/acceptance and actual-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates. No set closure is claimed. Names follow the explicit brief namespace; fgOS CLI is forbidden in this worker.

Author-draft correction before any independent review: two bare scanner hits at component-boundary.md:105 are one native `[README.md](README.md)` link, excluded with source-bound consumer coordinates. No inventory edge, diff, seed or selected file changed; packet counts/hashes are current. See `step-03-wave5e-native-link-exclusions.json`. Prior assignment-input review requests remain unchanged.

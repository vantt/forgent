# Step 3 wave 1 round 3 — targeted independent re-review request

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. Records only; no consumer edits. Read [owner answers](owner-answers.md) A51 and L12-21..L12-35 plus the current [authoring digest](progress.md#authoring-rules-digest--give-scaled-batches-this-checklist-verbatim). L12-35 overrides conflicting reviews, especially x-p04 D1. Prior review reports and freezes stay historical.

**13 whole files / 425 edges / 4 parts.** Includes all six rework files plus every outcome or added-reference file in [the delta](step-03-wave1-r3-changes.json). Record-text-only changes alone do not expand this request. Large map records are isolated. All parts have ≤6 files / ≤150 edges.

## Required reading method

Read each complete source at the pin with `git show <pin>:<consumer>`, then extract the record **by field** with Python. Never cat, sed or print a whole JSONL record line. Use the following snippet (substitute the record path, one-based record line, dotted field and optional edge id shown in the table):

```sh
python3 - plans/260925-documentation-authority-unification/reports/phase-08/step-03-records/batch-NNN.jsonl LINE FIELD [EDGE_ID] <<'PY'
import json, sys
from pathlib import Path
path, line, field = sys.argv[1:4]
record = json.loads(Path(path).read_text().splitlines()[int(line)-1])
if field == 'metadata':
    value = {k:v for k,v in record.items() if k not in ('edges','checks','diff')}
elif field == 'fieldNames':
    value = {'checks': list(record['checks']), 'coverage': list(record['checks']['coverage'])}
elif field == 'edges':
    assert len(sys.argv) == 5, 'extract one edge id at a time'
    value = next(e for e in record['edges'] if e['edgeId'] == sys.argv[4])
elif field == 'edgeIds':
    value = [e['edgeId'] for e in record['edges']]
else:
    assert field not in ('checks','checks.coverage'), 'extract narrower fields'
    value = record
    for key in field.split('.'): value = value[key]
print(json.dumps(value, ensure_ascii=False, indent=2))
PY
```

Read `metadata`, `fieldNames`, `edgeIds`, each `edges EDGE_ID`, `diff`, `checks.coverage.legacyScan`, `checks.coverage.authorAddedEdgeIds`, optional `checks.coverage.statusRowFlips`, and every present per-edge `checks.anchors.<id>`, `checks.relativeResolution.<id>`, `checks.labelForm.<id>`, `checks.coverage.descriptionTruth.<id>`, writer trace, supplemental locator replay and rebindings. Use fieldNames to enumerate and read every other present coverage field in bounded chunks. Optional absent keys are absent, not evidence of a waived rule. Each parked edge includes its searchWitness. Read actual complete target passages using `git show <pin>:<target>`; hashes and checker receipts are bindings, never semantic acceptance.

**Reviewers never run checker/probes.** Read source and records independently, including preserve/park/outcome-free siblings. No fgOS CLI, Git writes, consumer edits, services, state/secrets access or self-acceptance. Write only the unique assigned report below.

## Focus

- Check source-computed physical-line/table/list-continuation units and real distinct-claim exceptions. 08020/08195 wait with the entire five-file description. Advisory unit ids cannot split a source item.
- Check 05112/05113 retained Decision Surface pointers; migration-state user rows and docs-portal L32 flip with retained paths intact. Root reading-map has two complete pathless status-sentence flips in coverage.statusRowFlips.
- Check 07977/08150 description-rewrite parks for the stale label; 08030 #triage-verb; live reconciled CTR011 06585 targets agent-confinement/spec.md.
- History Superseded-by / CoordinationSession wrapper prose preserves per L12-35(3). Inside literal carriage reasons quote the actual declaration and state no existence facts. Self/glob/consumer successor notes must be absent.
- Read every supplemental directory and snapshot link in wrapper AND declared original-source coordinates. A candidate-native link can still need preserve coverage inside carriage. Proposed-tree leaves use their actual stated parent; the boundaries/README.md illustrative leaf is excluded explicitly.

## Assignments

### p01

Report: `review-a38-step-03-wave1-r3-p01.md`. **1 files / 98 edges.**

| Consumer | Record | Edges |
|---|---|---:|
| `docs/reading-map.md` | `step-03-records/batch-002.jsonl:4` | 98 |

### p02

Report: `review-a38-step-03-wave1-r3-p02.md`. **1 files / 91 edges.**

| Consumer | Record | Edges |
|---|---|---:|
| `docs/specs/reading-map.md` | `step-03-records/batch-040.jsonl:11` | 91 |

### p03

Report: `review-a38-step-03-wave1-r3-p03.md`. **5 files / 149 edges.**

| Consumer | Record | Edges |
|---|---|---:|
| `docs/platform/agent-coordination/history/retired-engine/legacy/README.md` | `step-03-records/batch-015.jsonl:18` | 52 |
| `docs/platform/architecture-map.md` | `step-03-records/batch-016.jsonl:1` | 39 |
| `docs/platform/proposals/component-authority-boundary-map.md` | `step-03-records/batch-026.jsonl:2` | 28 |
| `docs/platform/README.md` | `step-03-records/batch-013.jsonl:1` | 23 |
| `docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | `step-03-records/batch-015.jsonl:5` | 7 |

### p04

Report: `review-a38-step-03-wave1-r3-p04.md`. **6 files / 87 edges.**

| Consumer | Record | Edges |
|---|---|---:|
| `docs/platform/agent-coordination/history/retired-engine/README.md` | `step-03-records/batch-015.jsonl:6` | 20 |
| `docs/platform/packaging-distribution/README.md` | `step-03-records/batch-025.jsonl:1` | 18 |
| `docs/platform/proposals/README.md` | `step-03-records/batch-026.jsonl:1` | 18 |
| `docs/README.md` | `step-03-records/batch-033.jsonl:1` | 15 |
| `docs/platform/documentation/operations/portals/docs-portal.md` | `step-03-records/batch-020.jsonl:2` | 12 |
| `docs/platform/agent-coordination/history/README.md` | `step-03-records/batch-015.jsonl:4` | 4 |

## Verdict and boundary

Report pin and record/diff hashes, elapsed review time, then one ok / rework / needs-Lead-ruling verdict per complete file. Cite exact edge ids and source/target passages; distinguish outcome defects from text notes. Preserve per-set and per-stratum denominators and rework numerators; no pooling/reseeding. Earlier breached sets stay expanded; this request reviews the corrected bytes without erasing prior verdicts.

Lead owns dispatch, acceptance, actual runner-commit accounting in both unchanged Phase 6 manifests and committed-byte proof. No reviewer is launched by this author. Current freezes: [pilot r6](step-03-pilot-r6-manifest.json), [wave r3](step-03-wave1-r3-manifest.json). Step 3 acceptance, Phase 8 close and Phase 9 authorization are not claimed. Workflow/RUL10/GAP-02 carry and Step 5 parity remain. Preview remains with Lead under this record-only worker boundary.

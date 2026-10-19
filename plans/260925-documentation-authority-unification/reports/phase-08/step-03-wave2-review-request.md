# Step 3 wave 2 — one independent A51 review request

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Records only; no consumer edit. Reviewers started/accepted: **0/0**. Read owner A51, L12-10 and L12-21..L12-36 in `owner-answers.md`, the current authoring rules digest in `progress.md`, and the schema in `step-03-authoring-request.md`. Historical author checkpoints do not override the latest rulings.

Packet: **13 selected whole files / 60 edges / 3 parts**. The frozen manifest contains every per-set seed, full rank, sample, mandatory witness, source/diff/record hash and both strata. `step-03-wave2-review-index.json` binds exact assignment membership and measured bytes. No retired consumer is sampled: batches 034–035 are maintained-to-retire records, including the formerly large doctrine, per L12-34(2). Their ids remain coverage.

## Review method and boundary

**Never run the checker or probes.** Read every assigned pinned consumer completely via `git show <pin>:<file>`, using bounded line chunks for long sources. Read each complete per-file diff and all edge fields through the Python extractor below. Do not `cat`, grep or print a whole JSONL record line. Independently inspect actual pinned targets, literal/source carriage declarations, adjacent descriptions, relative coordinates and generated-source roles. A hash/author comparison is a binding, never semantic acceptance. Review every edge of the assigned file, including preserved/parked/row-flip and supplemental references; whole-file scan exclusions also need judgment.

There are no generated-render or canonical core/skills consumers in these six scheduling sets. `step-03-wave2-generated-surfaces.json` binds classification of all 60 consumers. Do not import rendered skill files into this packet or infer that a doc discussing a skill is generated. Any generated surface discovered in actual review must park to its exact verified canonical source, never get a hand patch. Shipped prompt conventions for an external project remain literal (L12-10; notably master-coordinator’s when-present repository rules).

Check migration paragraphs as units. Source-computed line/table/list boundaries control consistency; advisory ids cannot split a unit. Inside actual carriage there are no existence facts. Outside it, historical provenance, removed/renamed targets and non-executable notes must be true at the pin. Related wrappers are live navigation even on historical carriers; separate Superseded-by/retirement framing preserves. A whole-file target needs a real whole-file subject; specific claims require the smallest enclosing extractor heading with complete adjacent description truth.

## Python field extractor

Set `consumer` and `batch` to an assigned row; run once per file. It prints fields individually, never a serialized record line. Use the exact report name assigned below.

```python
import json, pathlib
root = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
batch = '038'
consumer = 'COPY EXACT ASSIGNED CONSUMER PATH'
record = next(json.loads(line) for line in (root/'step-03-records'/f'batch-{batch}.jsonl').read_text().splitlines() if json.loads(line)['file'] == consumer)
for key in ('file','authorInputCommit','digest','inventoryEdgeIds','authoringRules','diff'):
    print(key, record.get(key))
for edge in record.get('edges', []):
    for key in ('edgeId','sourceSpans','matchedExpression','disposition','target','anchor','reason','timing','diffHunk','blockedCategory','dependencyCategory','blockedReason','dependency','targetFacts','unitDispositionReason','authorAddedEdge','searchWitness'):
        print(key, json.dumps(edge.get(key), ensure_ascii=False, indent=2))
for section in ('coverage','anchors','relativeResolution','labelForm'):
    value = record.get('checks', {}).get(section, {})
    for key, proof in value.items():
        print(section, key, json.dumps(proof, ensure_ascii=False, indent=2))
```

For a long source, use `git show <pin>:<consumer> | sed -n '1,120p'`, then consecutive chunks through EOF. For long `coverage.legacyScan.candidates`, iterate individual candidate fields or slice the candidate list; do not summarize away unreviewed edges. Every assigned record fits the existing ≤60-record / ≤400,000-byte human-payload limit. Measured source-plus-record parts are also ≤400,000 bytes; each part has ≤6 files / ≤150 edges.

## Per-set and per-stratum accounting

| Set | Retire / all | Patched population / seed sample | Mandatory | Patched+mandatory distinct | Unpatched eligible / sample | Review union |
|---|---:|---:|---:|---:|---:|---:|
| batch-034 | 9/9 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-035 | 1/1 | 0/0 | 0 | 0 | 0/0 | 0 |
| batch-036 | 0/15 | 1/1 | 0 | 1 | 13/2 | 3 |
| batch-037 | 0/17 | 5/1 | 0 | 1 | 10/2 | 3 |
| batch-038 | 0/17 | 15/3 | 3 | 5 | 2/1 | 6 |
| batch-039 | 0/1 | 0/0 | 0 | 0 | 1/1 | 1 |

Unpatched eligibility excludes files already selected as patched/mandatory and requires an empty diff plus ≥1 edge. Zero-edge files remain in the manifest. Record reviewed-file denominators and rework numerators separately for each set and stratum; a file needing any semantic correction counts once. ≤3% passes that sample gate; >3% expands to every surviving file of that set, including parks/preserves/zero-edge files. Never pool sets, replace failed samples, silently reseed or treat authored mechanical green as semantic acceptance.

## Assigned parts

### Part 01 → `review-a38-step-03-wave2-p01.md`

6 whole files / 14 edges / 72,744 source-plus-record bytes.

| Set | Consumer | Stratum | Edges |
|---|---|---|---:|
| batch-036 | `docs/explanation/skill-prose-cleanup-remaining-bare-citations.md` | unpatched-seeded | 1 |
| batch-036 | `docs/explanation/skill-prose-cleanup-smoke-tests.md` | unpatched-seeded | 1 |
| batch-036 | `docs/explanation/worker-prompt-iron-law-evidence-timing.md` | patched-seeded | 3 |
| batch-037 | `docs/knowledge/fix-a-project-skill-that-skill-reports-as-unknown-skill/fix-invisible-nested-project-skills.md` | unpatched-seeded | 1 |
| batch-037 | `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md` | patched-seeded | 6 |
| batch-037 | `docs/knowledge/why-plugin-skills-need-a-cli-path-fallback/plugin-skill-cli-path-resolution-fallback.md` | unpatched-seeded | 2 |

### Part 02 → `review-a38-step-03-wave2-p02.md`

3 whole files / 34 edges / 355,834 source-plus-record bytes.

| Set | Consumer | Stratum | Edges |
|---|---|---|---:|
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md` | patched-seeded | 5 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md` | mandatory-threshold | 10 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md` | mandatory-threshold | 19 |

### Part 03 → `review-a38-step-03-wave2-p03.md`

4 whole files / 12 edges / 150,202 source-plus-record bytes.

| Set | Consumer | Stratum | Edges |
|---|---|---|---:|
| batch-038 | `docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` | patched-seeded, mandatory-threshold | 2 |
| batch-038 | `docs/platform/agent-coordination/playbooks/coordination-operating-harness.md` | patched-seeded | 6 |
| batch-038 | `docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md` | unpatched-seeded | 3 |
| batch-039 | `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` | unpatched-seeded | 1 |

## Required report and handoff

Write only the assigned unique review report within this plan. State pin, complete reading method, record/diff hashes, per-file verdict and edges read. Separate outcome defects (required rework) from record-text notes and questions needing Lead judgment. Report numerator/denominator per set and stratum; no pooled pass. Keep dissent and exact source/target line evidence. Do not author repairs, run checker/probes, launch other reviewers or self-accept the author packet.

Lead owns independent dispatch/acceptance, actual runner-commit accounting in both protected Phase 6 manifests and committed-byte proof. Step 5 parity, RUL10/workflow/GAP-02 carry and Phase 9 authorization remain outstanding. L12-36(4) notes remain with the Step 10 reading-map merge/semantic-remnant owner. No new Lead-ruling gap was required to author this packet. Names are the exact brief-authorized `review-a38-step-03-wave2-pNN.md` namespace; this worker cannot call the forbidden fgOS convention CLI or start a preview service.

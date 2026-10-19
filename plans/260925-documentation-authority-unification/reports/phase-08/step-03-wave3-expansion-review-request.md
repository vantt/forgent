# Step 3 L12-38 full-set expansion and outcome re-review

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. Records only; no consumer patch has been applied. Read owner-answers.md A51 and L12-21..L12-38, progress.md current authoring digest and step-03-authoring-request.md schema. **Reviewers never run checker or probes.** Reviewers started/accepted 0/0.

Frozen index: `step-03-wave3-expansion-review-index.json`. **56 whole files / 350 edges / 11 parts**. Read every assigned complete pinned consumer with `git show`, every record field, diff, actual target passage, scan exclusion and source unit. Hashes bind records and are not semantic acceptance.

L12-38 is binding: knowledge and candidate/playbook/prompt files are live outside actual history. Undated decision citations there navigate to exact decision headings. Never-existing name-drift live pointers park dead-link plus a successor note, without inventing aliases. Preserved removed decision ids carry computed narrative-holder notes. Verbatim history regions exempt renamed aliases; 08367/08368 preserve. Carriage/dated history supplemental coverage requires Markdown links and explicit legacy-root paths; bare names, directory fragments and code/test paths are exempt, with true reasons. Present-tense “Where the doc lives now” and reading-map + owning-area claims park as description-rewrite. L12-38 settles all eighteen review questions; no new Lead ruling is requested.

Expand **every file in batch-061 and batch-065** (the latter holds docs/explanation/herdr-orchestrator-terminology-boundary.md, 03890/03891), both strata and zero-edge files. Also review every Part A outcome-changed file outside those sets (037/038/041). Batch-037 was already fully expanded, but its newly corrected files receive this outcome re-review. Other text-only corrections need no new semantic review. Earlier seeded membership and reviews remain historical; no reseeding/pooling or author acceptance.

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

| Set | Assigned whole files | Reviewed denominator | Rework numerator |
|---|---:|---:|---|
| batch-037 | 4 | 0 | pending |
| batch-038 | 1 | 0 | pending |
| batch-041 | 1 | 0 | pending |
| batch-061 | 25 | 0 | pending |
| batch-065 | 25 | 0 | pending |

Both strata retain exact per-set NUL-separated seeds and full ranks. Selected denominators are frozen, reviewed denominators remain 0 and rework numerators pending. ≤3% per set AND stratum passes; >3% expands that set to all files. Never pool, reseed, replace a failed sample or self-accept.

## Assigned parts

### Part 01 → `review-a38-step-03-wave3-x-p01.md`

5 files / 16 edges / 152,798 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-037 | `docs/knowledge/how-to-wire-a-skill-through-the-dispatch-decision/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md` | Part-A-outcome-change | 1 |
| batch-037 | `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md` | Part-A-outcome-change | 6 |
| batch-037 | `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md` | Part-A-outcome-change | 3 |
| batch-037 | `docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md` | Part-A-outcome-change | 3 |
| batch-038 | `docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md` | Part-A-outcome-change | 3 |

### Part 02 → `review-a38-step-03-wave3-x-p02.md`

1 files / 39 edges / 387,953 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-041 | `docs/specs/work-state.md` | Part-A-outcome-change | 39 |

### Part 03 → `review-a38-step-03-wave3-x-p03.md`

5 files / 71 edges / 362,217 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/deep-dives/work-item-management.md` | full-set-expansion | 46 |
| batch-061 | `docs/distillery/deep-dives/work-item-schema-and-io-contracts.md` | full-set-expansion | 5 |
| batch-061 | `docs/distillery/intake.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/porting-log.md` | full-set-expansion | 11 |
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-18.md` | full-set-expansion | 9 |

### Part 04 → `review-a38-step-03-wave3-x-p04.md`

5 files / 84 edges / 372,751 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md` | full-set-expansion | 31 |
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md` | full-set-expansion | 44 |
| batch-061 | `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md` | full-set-expansion | 9 |
| batch-061 | `docs/distillery/reports/distill-beegog-herding-design-2026-09-06.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/reports/distill-beegog-herding-rust-2026-09-06.md` | full-set-expansion | 0 |

### Part 05 → `review-a38-step-03-wave3-x-p05.md`

6 files / 72 edges / 394,723 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/reports/distill-herdr-inventory-2026-07-15.md` | full-set-expansion | 3 |
| batch-061 | `docs/distillery/reports/scout-herdr-0.8.2-control-surface-2026-09-06.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/sources/beads-rust.md` | full-set-expansion | 1 |
| batch-061 | `docs/distillery/sources/beads-viewer-rust.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/sources/beads.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/sources/beehive.md` | full-set-expansion | 68 |

### Part 06 → `review-a38-step-03-wave3-x-p06.md`

6 files / 11 edges / 194,858 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/sources/claudekit-engineer.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/sources/compound-engineering-plugin.md` | full-set-expansion | 6 |
| batch-061 | `docs/distillery/sources/council-of-high-intelligence.md` | full-set-expansion | 1 |
| batch-061 | `docs/distillery/sources/herdr.md` | full-set-expansion | 4 |
| batch-061 | `docs/distillery/sources/learn-harness-engineering.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/sources/marketing-cockpit.md` | full-set-expansion | 0 |

### Part 07 → `review-a38-step-03-wave3-x-p07.md`

6 files / 13 edges / 137,647 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-061 | `docs/distillery/sources/okf.md` | full-set-expansion | 0 |
| batch-061 | `docs/distillery/sources/pi.md` | full-set-expansion | 1 |
| batch-061 | `docs/distillery/sources/repository-harness.md` | full-set-expansion | 8 |
| batch-065 | `docs/explanation/executor-dispatch-manual-log-gap-and-step-b5-fix.md` | full-set-expansion | 1 |
| batch-065 | `docs/explanation/expr-eval-chain-passthrough-vs-split.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/fanout-batch-background-execution-and-orphan-recovery.md` | full-set-expansion | 3 |

### Part 08 → `review-a38-step-03-wave3-x-p08.md`

6 files / 6 edges / 32,703 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-065 | `docs/explanation/fanout-batch-concurrent-dispatch.md` | full-set-expansion | 2 |
| batch-065 | `docs/explanation/fanout-batch-per-child-sync-spawn-and-listwork.md` | full-set-expansion | 1 |
| batch-065 | `docs/explanation/fanout-execute-consolidation.md` | full-set-expansion | 1 |
| batch-065 | `docs/explanation/fanout-proof-agy-demo.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/fgos-edit-role-flag.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/fgos-fanout-out-of-process-dispatch.md` | full-set-expansion | 2 |

### Part 09 → `review-a38-step-03-wave3-x-p09.md`

6 files / 12 edges / 54,634 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-065 | `docs/explanation/fgos-gateway-lifecycle-verb.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/fgos-lifecycle-tracking-concurrent-desync.md` | full-set-expansion | 2 |
| batch-065 | `docs/explanation/fgos-preflight-verb.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/fgos-return-skip-redundant-verify.md` | full-set-expansion | 1 |
| batch-065 | `docs/explanation/fgos-write-rejected-structural-deadlock.md` | full-set-expansion | 2 |
| batch-065 | `docs/explanation/footprint-diff-research-md-noise.md` | full-set-expansion | 7 |

### Part 10 → `review-a38-step-03-wave3-x-p10.md`

6 files / 23 edges / 124,615 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-065 | `docs/explanation/gate-bypass-keyword-floor-false-positives.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/general-verb-events-baseline-write-verified-fixed.md` | full-set-expansion | 4 |
| batch-065 | `docs/explanation/gitignore-docs-history-reverify.md` | full-set-expansion | 6 |
| batch-065 | `docs/explanation/glm-openrouter-executor.md` | full-set-expansion | 3 |
| batch-065 | `docs/explanation/herdr-orchestrator-terminology-boundary.md` | full-set-expansion | 5 |
| batch-065 | `docs/explanation/herdr-spawn-adapter-fresh-pane.md` | full-set-expansion | 5 |

### Part 11 → `review-a38-step-03-wave3-x-p11.md`

4 files / 3 edges / 20,995 source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.

| Set | Consumer | Strata | Edges |
|---|---|---|---:|
| batch-065 | `docs/explanation/iron-law-classification-recipe-path.md` | full-set-expansion | 1 |
| batch-065 | `docs/explanation/list-id-callthreads-leak-fix.md` | full-set-expansion | 0 |
| batch-065 | `docs/explanation/list-id-fields-flag-lightweight-projection.md` | full-set-expansion | 1 |
| batch-065 | `docs/explanation/lock-wait-self-vs-other-holder-identity.md` | full-set-expansion | 1 |

## Required handback

Write only the assigned uniquely named review report. State the pin, complete reading method, per-file verdict and edges read; separate outcome defects from record-text notes and Lead questions. Give reviewed-file denominator and rework numerator per set and stratum, counting overlap explicitly. No repair, checker/probe run, reviewer dispatch or acceptance. Lead owns independent acceptance, previews, actual runner-commit accounting in both untouched Phase 6 reproduction manifests and committed-byte closeout. Step 5 parity, workflow/RUL10/GAP-01/GAP-02 carry and Phase 9 step-10 semantic-remnant/reading-map obligations remain. No Phase 8 close or Phase 9 authorization is claimed.

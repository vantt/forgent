# Step 3 wave 2 — full expansion and Part A outcome re-review

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only: no consumer edit, no authority flip, no Step 3 self-acceptance. Read A51, L12-10 and L12-21..L12-37 in owner-answers.md, the latest authoring rules digest in progress.md, and the schema in step-03-authoring-request.md. Reviewers started/accepted **0/0**.

Frozen packet: **36 whole files / 252 coverage edges / 7 parts**. Index `step-03-wave2-expansion-review-index.json` binds exact current records, source/diff hashes and per-set membership. Every assigned file must be read whole; hash equality is a binding, never semantic acceptance.

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

L12-37 upholds wave-2 rework 04520 (batch-037 patched sample 1/1) and 06509 (batch-038 unpatched sample 1/1); each breaches 3%. This expansion covers EVERY file of both sets, both strata and zero-edge records, plus every other Part A outcome-changed file (036 and 041). Earlier sample membership is preserved as history, not silently reseeded. Text-only corrections outside expansion do not trigger review; the exact delta is step-03-wave2-r2-changes.json.

| Set | Expansion/targeted files | Reviewed denominator | Rework numerator |
|---|---:|---:|---|
| batch-036 | 1 | 0 | pending |
| batch-037 | 17 | 0 | pending |
| batch-038 | 17 | 0 | pending |
| batch-041 | 1 | 0 | pending |

## Assigned parts

### Part 01 → `review-a38-step-03-wave2-x-p01.md`

6 whole files / 24 edges / 130,165 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-036 | `docs/explanation/skill-prose-cleanup-design.md` | Part-A-outcome-change | 8 |
| batch-037 | `docs/knowledge/add-a-read-only-fgos-verb-and-its-plugin-skill/add-a-read-only-fgos-verb-and-plugin-skill.md` | full-set-expansion | 3 |
| batch-037 | `docs/knowledge/fix-a-project-skill-that-skill-reports-as-unknown-skill/fix-invisible-nested-project-skills.md` | full-set-expansion | 1 |
| batch-037 | `docs/knowledge/how-to-verify-every-citer-before-retiring-a-shared-skill-fra/verify-every-citer-before-retiring-a-shared-skill-fragment.md` | full-set-expansion | 5 |
| batch-037 | `docs/knowledge/how-to-wire-a-skill-through-the-dispatch-decision/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md` | full-set-expansion | 1 |
| batch-037 | `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md` | full-set-expansion | 6 |

### Part 02 → `review-a38-step-03-wave2-x-p02.md`

6 whole files / 11 edges / 59,662 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-037 | `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md` | full-set-expansion | 3 |
| batch-037 | `docs/knowledge/why-a-repo-that-only-installs-fgos-as-a-claude-code-plugin-g/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md` | full-set-expansion | 2 |
| batch-037 | `docs/knowledge/why-a-work-item-title-s-object-action-scope-rule-lives-in-th/title-semantic-contract-lives-in-submitting-skills.md` | full-set-expansion | 2 |
| batch-037 | `docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md` | full-set-expansion | 3 |
| batch-037 | `docs/knowledge/why-fgos-coding-driving-s-pick-through-approve-skills-instru/why-skill-prose-had-to-match-the-worktree-isolated-environment-it-runs-in.md` | full-set-expansion | 1 |
| batch-037 | `docs/knowledge/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal-prompt.md` | full-set-expansion | 0 |

### Part 03 → `review-a38-step-03-wave2-x-p03.md`

6 whole files / 14 edges / 82,612 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-037 | `docs/knowledge/why-fgos-install-setup-resolves-the-fgos-binary-through-a-3/why-fgos-bin-and-skill-distribution-needed-a-3-tier-self-healing-resolution.md` | full-set-expansion | 3 |
| batch-037 | `docs/knowledge/why-fgos-registers-a-doctor-check-confirming-every-stage-nam/why-a-doctor-check-verifies-every-workflow-stage-has-a-skillmap-owner.md` | full-set-expansion | 1 |
| batch-037 | `docs/knowledge/why-fgos-s-coding-domain-skills-were-rewritten-to-a-300-line/why-fgos-skills-split-into-skillmd-plus-references-under-300-lines.md` | full-set-expansion | 7 |
| batch-037 | `docs/knowledge/why-plugin-skills-need-a-cli-path-fallback/plugin-skill-cli-path-resolution-fallback.md` | full-set-expansion | 2 |
| batch-037 | `docs/knowledge/why-stage-skills-forbid-ad-hoc-task-agent-delegation-for-the/why-stage-skills-forbid-ad-hoc-task-delegation-for-their-own-reasoning.md` | full-set-expansion | 1 |
| batch-037 | `docs/knowledge/why-the-verify-fail-post-merge-playbook-s-retry-step-moves-a/why-the-verify-fail-post-merge-playbook-retries-through-awaiting-approval-not-proposed.md` | full-set-expansion | 0 |

### Part 04 → `review-a38-step-03-wave2-x-p04.md`

6 whole files / 65 edges / 321,486 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-038 | `docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md` | full-set-expansion | 21 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/README.md` | full-set-expansion | 9 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md` | full-set-expansion | 9 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md` | full-set-expansion | 5 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md` | full-set-expansion | 10 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/coordination-operating-harness.md` | full-set-expansion | 11 |

### Part 05 → `review-a38-step-03-wave2-x-p05.md`

5 whole files / 81 edges / 375,450 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md` | full-set-expansion | 25 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md` | full-set-expansion | 19 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/master-coordinator.md` | full-set-expansion | 12 |
| batch-038 | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md` | full-set-expansion | 23 |
| batch-038 | `docs/platform/agent-coordination/playbooks/README.md` | full-set-expansion | 2 |

### Part 06 → `review-a38-step-03-wave2-x-p06.md`

6 whole files / 18 edges / 296,610 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-038 | `docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md` | full-set-expansion | 2 |
| batch-038 | `docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md` | full-set-expansion | 2 |
| batch-038 | `docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` | full-set-expansion | 2 |
| batch-038 | `docs/platform/agent-coordination/playbooks/coordination-operating-harness.md` | full-set-expansion | 6 |
| batch-038 | `docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md` | full-set-expansion | 3 |
| batch-038 | `docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md` | full-set-expansion | 3 |

### Part 07 → `review-a38-step-03-wave2-x-p07.md`

1 whole files / 39 edges / 395,801 source-plus-record bytes.

| Set | Consumer | Stratum / reason | Edges |
|---|---|---|---:|
| batch-041 | `docs/specs/work-state.md` | Part-A-outcome-change | 39 |

## Required handback

Write only the assigned unique review report. State pin, complete reading method and record/diff hashes; give a per-file verdict and edges read. Separate outcome defects (rework) from record-text notes and Lead-ruling questions. Report reviewed-file denominator/rework numerator per set AND stratum (including overlaps), not a pooled rate. Keep exact source/target evidence and dissent. No repairs, checker/probes, review dispatch or acceptance.

Lead owns independent dispatch/acceptance, actual runner-commit accounting in both untouched Phase 6 reproduction manifests, committed-byte acceptance and preview. Workflow/RUL10/GAP-02 carry and Step 5 parity remain outstanding; Phase 8 close and Phase 9 authorization are not claimed. New Lead-ruling gaps required for this author packet: 0. Names use the exact brief-authorized namespace because this worker must not call fgOS CLI.

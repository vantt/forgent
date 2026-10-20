# Step 3 batch-073 — every-file expansion

Fixed author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-42, the complete progress authoring digest and step-03-authoring-request.md schema. **Reviewers never run checker/probes.** Reviewers started/accepted 0/0.

**25 whole files / 116 edges / 5 parts.** Index `step-03-batch073-expansion-review-index.json` freezes exact source/diff/record hashes. Read each complete pinned source and target, all edge fields, supplemental scan/exclusions and diff in bounded pages. Hashes and author checker results are bindings, never independent semantic acceptance.

L12-42(2) requires EVERY batch-073 file after correction, including unpatched and zero-edge files. The defect 04449 came from a Lead-ruling supplement rather than the seeded sample; Lead explicitly applies the stricter expansion. This packet supersedes no earlier request and does not reseed/replace the failed supplement. Do not assign batch-074 or 075 here.

04449 now redirects the whole guide to docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md, as L12-42(1) rules: both step 5s document blocked -> proposed and its later awaiting-approval name. Review the corrected diff AND complete adjacent gloss. Independently check 04444 title-matched Iron Law 0032 note; do not borrow the sibling Team Harness holder. Remaining parks stay separately blocked. The stale grep docs/decisions recipe is a Phase 9 step-10 semantic-search carry, not an authorized consumer edit.

| Set | Required files | Reviewed denominator | Rework numerator |
|---|---:|---:|---|
| batch-073 | 25 | 0 | pending |

Every file gets one semantic verdict; one required correction counts that file once. Preserve historical patched/unpatched/supplement membership in per-stratum accounting; whole-set expansion is independent of the original seed. No pooling or self-acceptance.

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



## Assigned parts

### Part 01 → `review-a38-step-03-batch073-x-p01.md`

6 files / 19 edges / 219917 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-reconcile-a-blocked-item-after-a-leaf-into-root-merge/reconcile-a-blocked-item-after-a-leaf-into-root-merge-race.md` | full-set-expansion | 0 |
| batch-073 | `docs/knowledge/how-to-reconstruct-fgos-tracking-state-after-an-operator-mis/reconstruct-fgos-tracking-state-after-an-operator-mistake-discards-events-jsonl.md` | full-set-expansion | 4 |
| batch-073 | `docs/knowledge/how-to-recover-a-blocked-item-with-fgos-catchup-from-inside/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md` | full-set-expansion, historical-patched-selected | 4 |
| batch-073 | `docs/knowledge/how-to-recover-a-blocked-merge-conflict-item-when-fgos-catch/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md` | full-set-expansion | 4 |
| batch-073 | `docs/knowledge/how-to-recover-a-stuck-doing-claim-after-a-worktree-creation/recover-a-stuck-doing-claim-after-worktree-creation-failure.md` | full-set-expansion | 7 |
| batch-073 | `docs/knowledge/how-to-recover-fgos-approve-fgos-sync-root-from-inside-a-wor/recover-approve-sync-root-from-inside-a-worktree-with-trust-dir.md` | full-set-expansion | 0 |

### Part 02 → `review-a38-step-03-batch073-x-p02.md`

6 files / 45 edges / 265192 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-register-a-fixable-doctor-check-in-fgos/register-a-fixable-doctor-check-in-fgos.md` | full-set-expansion, historical-unpatched-selected | 6 |
| batch-073 | `docs/knowledge/how-to-resolve-a-git-merge-conflict-on-fgos-events-jsonl-wit/resolve-an-events-jsonl-merge-conflict.md` | full-set-expansion | 11 |
| batch-073 | `docs/knowledge/how-to-resolve-ambiguous-multi-target-errors-from-an-impact/resolve-ambiguous-multi-target-errors-from-an-impact-analysis-provider.md` | full-set-expansion | 0 |
| batch-073 | `docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md` | full-set-expansion, corrected-lead-supplement | 16 |
| batch-073 | `docs/knowledge/how-to-respond-when-fgos-doctor-reports-a-shared-fgos-events/resolve-an-events-jsonl-truncation.md` | full-set-expansion | 6 |
| batch-073 | `docs/knowledge/how-to-reuse-the-shared-executor-dispatch-fallback-fragment/reuse-the-shared-executor-dispatch-fallback-fragment.md` | full-set-expansion | 6 |

### Part 03 → `review-a38-step-03-batch073-x-p03.md`

6 files / 27 edges / 196440 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md` | full-set-expansion | 11 |
| batch-073 | `docs/knowledge/how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md` | full-set-expansion, historical-patched-selected | 3 |
| batch-073 | `docs/knowledge/how-to-see-done-items-in-fgos-list-fgos-triage/see-done-items-in-list-and-triage.md` | full-set-expansion | 7 |
| batch-073 | `docs/knowledge/how-to-self-resolve-a-merge-block-reported-as-verify-timeout/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md` | full-set-expansion | 3 |
| batch-073 | `docs/knowledge/how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md` | full-set-expansion | 3 |
| batch-073 | `docs/knowledge/how-to-sweep-the-clarify-decompose-backlog-with-fgos-discove/sweep-the-clarify-decompose-backlog-with-discover-loop.md` | full-set-expansion | 0 |

### Part 04 → `review-a38-step-03-batch073-x-p04.md`

6 files / 24 edges / 164954 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt/tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md` | full-set-expansion | 1 |
| batch-073 | `docs/knowledge/how-to-unify-two-independently-written-working-tree-clean-ch/unify-a-duplicated-clean-tree-check-across-return-and-approve.md` | full-set-expansion | 4 |
| batch-073 | `docs/knowledge/how-to-verify-herdr-cockpit-reuses-its-existing-tab-instead/verify-herdr-cockpit-reuses-existing-tab-instead-of-losing-one.md` | full-set-expansion | 2 |
| batch-073 | `docs/knowledge/how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md` | full-set-expansion, historical-patched-selected | 7 |
| batch-073 | `docs/knowledge/how-to-wire-a-headless-function-through-an-agent-executor-ex/wire-a-headless-function-through-an-agent-executor-executor.md` | full-set-expansion | 5 |
| batch-073 | `docs/knowledge/how-to-write-a-doctor-check-that-detects-real-shell-function/write-a-doctor-check-that-detects-real-shell-function-breakage.md` | full-set-expansion | 5 |

### Part 05 → `review-a38-step-03-batch073-x-p05.md`

1 files / 1 edges / 5385 source-plus-record bytes.

| Set | Consumer | Inclusion | Edges |
|---|---|---|---:|
| batch-073 | `docs/knowledge/how-to-write-a-task-spec/write-a-task-spec.md` | full-set-expansion | 1 |

## Required handback

Read complete pinned consumers via git show in consecutive ≤120-line pages through EOF. Extract every JSON field with Python above; never dump an entire JSONL record. A field >300,000 bytes is paged as UTF-8 bytes. Per-file record/diff/verdict remains indivisible. Ordinary parts have ≤6 files / ≤150 edges / ≤400,000 source-plus-record bytes.

Write only the assigned unique report; include pin/bindings, complete reading method, per-file verdicts, edges read, source/target evidence and dissent. Separate semantic rework, record-text notes and Lead questions; report denominators/numerators per set AND stratum with overlaps. No checker/probes, repairs, dispatch or acceptance. Lead owns independent review, preview and actual runner-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates. No Step 3 acceptance or phase close. Exact report namespaces are supplied by this brief; worker is forbidden to invoke fgOS conventions CLI.

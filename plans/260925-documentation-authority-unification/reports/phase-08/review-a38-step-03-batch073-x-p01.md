# Review a38 - Step 3 batch-073 expansion - Part 01

Reviewer: independent read-only semantic reviewer. Pin `ae141550c2e022310de7a0efea757580c0b2479f`; worktree `/home/vantt/projects/forgentX-s8-review` at 63952951a. No checker or probe was run. step-03-resolve.py was not needed. Nothing was written to the worktree.

## Method

- Read the request, the progress.md authoring digest, and owner-answers L12-1 and L12-30..L12-44.
- For each of the 6 files I loaded the batch-073.jsonl record with python3 and printed per edge only edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blockedReason/blockedCategory, dependency/dependencyCategory and targetFacts. I also printed the diff and the coverage, anchors and relativeResolution checks (including the legacyScan result), truncated per field.
- Read each whole pinned source with `git show <pin>:<file>` (all files are under 4 KB, so whole-file reads).
- For every patch I read the pinned target heading list and the target text that the adjacent gloss relies on.
- For every park I verified the claimed rename or supersession facts against git (rename commits e7475b183 and 58049c7f9) and the pinned target text.

## Per-file verdicts

| # | File | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | docs/knowledge/how-to-reconcile-a-blocked-item-after-a-leaf-into-root-merge/reconcile-a-blocked-item-after-a-leaf-into-root-merge-race.md | batch-073 | full-set-expansion (zero-edge, unpatched) | 0 | ok |
| 2 | docs/knowledge/how-to-reconstruct-fgos-tracking-state-after-an-operator-mis/reconstruct-fgos-tracking-state-after-an-operator-mistake-discards-events-jsonl.md | batch-073 | full-set-expansion | 4 | ok |
| 3 | docs/knowledge/how-to-recover-a-blocked-item-with-fgos-catchup-from-inside/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md | batch-073 | full-set-expansion + historical-patched-selected | 4 | ok |
| 4 | docs/knowledge/how-to-recover-a-blocked-merge-conflict-item-when-fgos-catch/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md | batch-073 | full-set-expansion | 4 | ok |
| 5 | docs/knowledge/how-to-recover-a-stuck-doing-claim-after-a-worktree-creation/recover-a-stuck-doing-claim-after-worktree-creation-failure.md | batch-073 | full-set-expansion | 7 | ok |
| 6 | docs/knowledge/how-to-recover-fgos-approve-fgos-sync-root-from-inside-a-wor/recover-approve-sync-root-from-inside-a-worktree-with-trust-dir.md | batch-073 | full-set-expansion (zero-edge, unpatched) | 0 | ok |

### 1 and 6 (zero-edge)

I read both sources whole. Neither names a retiring path.
- File 1 has `src/state/fsm.mjs` and `bin/fgos.mjs`. A "D16" mention sits inside a fenced captured code comment, which L12-40 treats as captured evidence.
- File 6 has only short ids (P44, review-260718) and CLI text.
- Both records show an empty legacyScan candidate list, empty authorAddedEdgeIds and an empty diff. No missed reference found.

### 2 (4 edges: 04399 parked, 04400 patch, 04401 patch, 04402 parked)

- 04400 (source line 35) and 04401 (source line 81) patch to `docs/knowledge/why-fgos-events-jsonl-can-silently-lose-lines-under-concurre/events-jsonl-lost-update-race-under-concurrent-session-writes.md#two-candidate-causes-and-why-the-investigation-started-with-the-wrong-one`.
  - The anchor is a real heading (target L86) and contains the root cause B bullet. The registry lists the old docs/explanation path as an alias of this target.
  - The adjacent gloss ("root cause B: events.jsonl git-tracked in the one shared main checkout") matches the target text.
  - The diffs are exact and keep the surrounding prose, wrapping and list markers.
- 04399 (line 16) and 04402 (line 84) park as description-rewrite.
  - The old docs/how-to path was renamed at e7475b183 (verified in git).
  - The alias target opens with a "Superseded (tsk-3tp)" header that marks the whole procedure historical and says the seq scripts were deleted.
  - Redirecting the introductory recommendation or the "sibling procedure" gloss by path substitution alone would leave a false present-tense description, so the park matches L12-30 and L12-37.
  - The two edges are consistent with each other and with 04409 in file 4.

### 3 (4 edges: 04403 to 04406, all patch, Phase 9)

- 04403 (line 31) patches `docs/specs/work-state.md` to `docs/platform/work-state/spec.md#11-business-rules`.
  - The target L1073 (RUL33) and L1074 (RUL34) sit under `## 11. Business Rules` (L1039 to L1095).
  - RUL33 states `blocked -> awaiting-approval` never passes through `doing`, which matches the source gloss. The RUL numbers are preserved in the diff.
- 04404 (lines 74-75, hyphen-wrapped) and 04405 (line 80) patch to the whole-file diagnose guide.
  - The wrapped replacement is split after `approve-`, so the directory name joins back to `how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post`.
  - The source glosses ("rule out an unrelated pre-existing bug", "why the post-merge verify failed") are true of the target steps 1-4 and the two real examples.
  - Neither gloss mentions the `blocked -> proposed` edge or status names, so L12-42's step-5 caveat is not triggered.
- 04406 (lines 84-85, hyphen-wrapped) patches to the sibling "recover a blocked merge-conflict ... catchup cannot reconcile" file.
  - The target directory name `how-to-recover-a-blocked-merge-conflict-item-when-fgos-catch` is reproduced correctly across the wrap.
  - The gloss ("when catchup itself can't resolve a real conflict") matches the target title and its already-caught-up scope.

### 4 (4 edges: 04407 and 04408 patch, 04409 and 04410 parked)

- 04407 (line 78) patches to the diagnose guide at `#real-example`.
  - `## Real example` is unique, because the other example heading continues with ": a genuine gap...".
  - The source says the tsk-2z3 example there is the same failing file `test/install-packaging.test.mjs`. The target's second failure is exactly that e2e test as a load flake, so the gloss is true.
- 04408 (line 119) patches to the whole file. The gloss ("unrelated-flaky-full-suite-verify case on its own, without a preceding merge-conflict") matches the target scope.
- 04409 (line 122) and 04410 (line 123) are one list item (unitId item-L122) and share the disposition, as required.
  - Both park as description-rewrite.
  - The renames are verified: e7475b183 for the events-jsonl guide and 58049c7f9 for the decision-id guide.
  - The decision-id target still instructs editing `docs/decisions/0000-index.md` (pinned L14, L58-61, L106, L163), a deleted manual index.
  - The events-jsonl target is marked superseded and historical.
  - The grouped gloss "siblings for specific conflicting content types" therefore cannot be redirected as-is.

### 5 (7 edges: 04411 to 04415 preserve, 04416 and 04417 patch)

- 04411 to 04415 preserve `docs/history/pick-worktree-reclaim-zero-destroy/{CONTEXT,plan}.md`, `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` and `docs/history/pick-worktree-claim-race/{CONTEXT,plan}.md`.
  - All five paths exist at the pin, are outside the retiring trees (docs/specs/**, docs/architect/**) and are not in the alias table, which is empty.
  - Two of the edges share a Related list item (04411 and 04412 share item-L144; 04414 and 04415 share item-L154). The reasons quote the complete unit.
- 04416 (line 158) patches to the orphaned-worktree-reclaim explanation at `#the-real-incident-that-proved-it`.
  - The heading is real (target L23). The target incident is approve on `tsk-1wd-1` reclaiming the root checkout.
  - The source gloss ("a different trigger, approve's leaf-merge reclaim path, same orphan shape") is true.
- 04417 (line 162) patches to the createWorktree call-site how-to at `#1-pick-your-operation-type`.
  - The target operation-table row says claim checkout cleanup is "owned by the claim's own lifecycle (`claim-port.mjs`'s `claimWork`)". That matches the source gloss exactly.

## OUTCOME defects

None. No wrong disposition, target, anchor or diff, no false adjacent description, and no missed reference in any of the 6 files.

## Record-text notes (not rework)

1. 04399's park reason says the source "recommends manual seq-conflict repair". The source text actually says "not a merge conflict (see X for that case)", i.e. it points readers to the superseded procedure. The conclusion (a present-tense pointer to a procedure now marked historical needs a rewrite) is sound; only the paraphrase is loose.
2. The mixed-state evidence for the tsk-2z3 example is not a defect. 04407 is the only edge in this part whose target anchor is a mid-file example heading rather than a whole-file reference. The anchor is valid and the claim is specific to that example.

## Lead-judgment questions

1. Parked versus patched: 04399, 04402, 04409 and 04410 park because the targets are superseded or historical or still operate on a deleted index. A patch with a "historical" gloss would also be defensible. I judge the parks correct under L12-30 and L12-37 and I do not recommend rework. This is the same ruling family as the batch-073 part 02 files, so the Lead may want to confirm consistency across the parts.
2. The stale `grep docs/decisions/` recipes carried to Phase 9 step-10 (L12-42) do not occur in this part's files.

## Accounting

Reviewed 6 files and 19 edges. Rework 0.

| Stratum | Denominator | Reviewed | Rework |
|---|---:|---:|---:|
| batch-073 full-set-expansion (part 01) | 6 | 6 | 0 |
| of which historical-patched-selected (overlap, file 3) | 1 | 1 | 0 |
| of which zero-edge or unpatched (files 1 and 6) | 2 | 2 | 0 |

Edge dispositions: 10 patch (04400, 04401, 04403 to 04408, 04416, 04417), 5 preserve (04411 to 04415), 4 parked (04399, 04402, 04409, 04410). Total 19.

No set-level acceptance is made here. The author checker results are not treated as semantic acceptance.

Status: DONE
Summary: All 6 Part 01 files (19 edges, including 2 zero-edge files) were reviewed whole against the pinned sources and targets. All 6 are ok, with 0 outcome defects and 2 record-text notes.

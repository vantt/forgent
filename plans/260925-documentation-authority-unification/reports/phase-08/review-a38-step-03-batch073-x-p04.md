# Review a38 step-03 batch-073 expansion, Part 04

Reviewer: independent semantic reviewer. Pin ae141550c2e022310de7a0efea757580c0b2479f (author pin; worktree detached 63952951a). Read-only. No checker or probes were run. Hashes and checker results are bindings only; the semantic check below is my own.

Method: for each file I loaded the record from step-03-records/batch-073.jsonl by "file" and printed per edge edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blockedReason/Category, dependency/Category and targetFacts, plus the diff, authorAddedEdgeIds, the legacyScan and the descriptionTruth/anchors checks. I read each whole pinned source (git show, all lines, all files under 60 KB). I read the full target region for every patch (whole target for pointer targets, the exact section for anchored ones). I grepped each source for legacy roots (docs/decisions, docs/specs, docs/how-to, docs/explanation, docs/reference, docs/tutorials, ADR ids) to look for missed references. I confirmed with git ls-tree that preserved docs/history paths exist at the pin.

Rules applied: L12-26, L12-30..L12-44, A51, and the progress authoring digest.

## Per-file results

### 1. docs/knowledge/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt/tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md
Set batch-073. Stratum full-set-expansion, unpatched (empty diff). Verdict: **ok**. Edges reviewed: 1.
- maps-j-04490 (L83, Related) preserves docs/history/stale-worktree-index-guard/CONTEXT.md. The path exists at the pin and docs/history is a retained tree (minimum-constitution keeps docs/history/<feature>/**). The gloss ("pre-commit hook's own, unconditional staleness refusal, a different guard") is not a moved-authority claim. Correct.
- Missed-reference scan: nothing else. The bare "ADR0020" at L70 is an id mention, not a path. See Lead question Q1.

### 2. docs/knowledge/how-to-unify-two-independently-written-working-tree-clean-ch/unify-a-duplicated-clean-tree-check-across-return-and-approve.md
Set batch-073. Stratum full-set-expansion, patched. Verdict: **ok**. Edges reviewed: 4.
- 04491 (L12, intro) patches to docs/platform/runner/decisions/h-36d872fbb0e5.md#2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve. The target heading "###### 2. Kiểm tra working-tree sạch ... return và approve" is under "### 0022 Khảo sát choke-point fgOS", so this is the title-matched holder of the removed 0022 record. The adjacent gloss says the survey flags two same-named functions with a subtree vs whole-repo difference. The section states exactly that and also records "Đã sửa" with commit 3dad0c2. The diff hunk is correct.
- 04492 (L102, Real example) preserves. The source is "from `docs/decisions/0022-...`'s ranked candidate #2, confirmed ... and merged it", a completed past-event provenance statement (L12-42 / 04420 precedent). targetFacts show the file removed at 4722361ae with no successor file. The successor note names the holder h-36d872fbb0e5.md#0022-... heading, which exists. Correct.
- 04493 (L117, Related) patches to the same section anchor. The gloss "survey that ranked this duplication as candidate #2, and now notes it as resolved" is true: the section records Đã sửa and the commit. The diff is correct. Patching the live Related pointer while preserving the L102 past-event is consistent with the L12-37/L12-39 rulings.
- 04494 (L120, Related) patches to the knowledge guide resolve-a-decision-id-collision-merge-conflict-on-approve.md. The old path was deleted in 58049c7f9 (migrated). The target title matches the "different approve blocker" gloss, and the target documents --acknowledge-iron-law (L82, L113). The diff is correct.
- Slug check: the anchor drops the em dash with a single hyphen. This matches the repo slugger convention seen in other records (e.g. "0022-khảo-sát-..."). No defect.

### 3. docs/knowledge/how-to-verify-herdr-cockpit-reuses-its-existing-tab-instead/verify-herdr-cockpit-reuses-existing-tab-instead-of-losing-one.md
Set batch-073. Stratum full-set-expansion, unpatched. Verdict: **ok**. Edges reviewed: 2.
- 04500 (L20) preserves docs/history/herdr-cockpit-dashboard-own-tab/CONTEXT.md. The path exists. The text is a provenance parenthetical introducing a blockquote of captured scope, so the preserve is right.
- 04501 (L79, Related) preserves the same path. The sibling plan.md ("`CONTEXT.md` and `plan.md`") also exists at the pin and is retained. It is a bare sibling mention, so it is not a separate edge. The preserve is correct.
- No missed references.

### 4. docs/knowledge/how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md
Set batch-073. Stratum full-set-expansion + historical-patched-selected. Verdict: **ok**. Edges reviewed: 7.
- 04502 (L14), 04503 (L34, anchor #steps), 04505 (L118) and 04506 (L152) all patch docs/how-to/clear-a-stuck-main-checkout-lock.md to docs/knowledge/how-to-clear-a-stuck-fgos-main-checkout-lock/clear-a-stuck-main-checkout-lock.md. The registry/alias lookup matches this holder. The target exists. It covers fgos unlock refusing for a live session (Steps 2 and 3), the "age vs TTL" live-holder check at step 3, and the lock-ambiguous/corrupt case cleared by unlock ("reclaimed"). Each adjacent gloss therefore matches: the stale/dead case vs live holder (L14, L152), step 3 (L34), and the AMBIGUOUS case via unlock (L118). "step 3" with #steps is a truthful label: the target's numbered step 3 is in "## Steps". The 4 diff hunks match the 4 patch edges exactly.
- 04504 (L92) preserves docs/history/tsk-mgb-.../CONTEXT.md. It is the attribution line of a blockquote of captured root-cause text, so this is captured evidence (L12-40). The path exists. Correct.
- 04507 (L154) and 04508 (L156) preserve docs/history/main-checkout-lock-wait-decouple-ttl-snapshot/CONTEXT.md and docs/history/fgos-wait-retry-main-checkout-lock/CONTEXT.md. Both exist. Related provenance lines with no moved-authority claim. Correct.
- No missed references. The L74 "Update (tsk-mgb)" and L122 "Update (tsk-328)" sections contain no legacy paths.

### 5. docs/knowledge/how-to-wire-a-headless-function-through-an-agent-executor-ex/wire-a-headless-function-through-an-agent-executor-executor.md
Set batch-073. Stratum full-set-expansion, unpatched-historical (patched in this batch). Verdict: **ok**. Edges reviewed: 5.
- 04509 (L23) and 04512 (L118) patch to docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md. The target's "Before you start" says it covers a "task-dispatch consumer (an in-session skill that shells out via Bash)", exactly what the source contrasts with. It is a whole-guide pointer, so no anchor is needed.
- 04510 (L69) patches to docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md#a-tool-registry-entry-is-never-an-automatic-presence-gate-for-dispatch-tsk-62v-tsk-5tm-1-d1. The heading "## A tool-registry entry is never an automatic presence gate for dispatch (tsk-62v, tsk-5tm-1 D1)" exists at L208 and the slug is correct. The section states presence gating was retired at tsk-5tm-1 D1 and a caller asks with fgos tool query --status present, exactly what source step 2 says. The anchor is the precise scope.
- 04511 (L116) patches to docs/knowledge/why-executor-aware-backend-dispatch-exists/agent-executor-executor-aware-dispatch.md. The title "Why executor-aware backend dispatch exists" and the "what each of four pieces proved" section match the gloss "why the executor mechanism exists and what each cluster item proved".
- 04513 (L120) preserves docs/history/agent-executor-judge-capacity-dispatch/CONTEXT.md. The path exists. Correct.
- The diff has 4 hunks matching the 4 patch edges. No missed references.

### 6. docs/knowledge/how-to-write-a-doctor-check-that-detects-real-shell-function/write-a-doctor-check-that-detects-real-shell-function-breakage.md
Set batch-073. Stratum full-set-expansion, patched. Verdict: **ok**. Edges reviewed: 5.
- 04521 (L30), 04522 (L56) and 04523 (L82) preserve docs/history/tsk-2wpi-doctor-real-shell-invocation-check/CONTEXT.md. Each is the attribution line of a blockquote of captured text, so each is captured evidence (L12-40). The path exists. Correct.
- 04525 (L107, Related) preserves the same path. The path exists and the gloss "full decision record (D0-D3)" is a provenance line. Correct.
- 04524 (L104, Related) patches to docs/knowledge/why-fgos-fgos-runner-died-in-every-agent-shell/harness-shell-snapshot-strips-underscore-prefixed-helper-functions.md. The target is the explanation of the underscore-helper stripping (tsk-3k2) and the "naive subprocess test misses it" story. It matches "the sibling item's own root-cause story (tsk-3k2) this check was built to detect". The diff is correct.

## Outcome defects
None. 0 of 6 files require rework.

## Record-text notes (not rework)
- 04492 reason says the file was "removed ... with no successor file" and then gives a "non-executable successor note" to a heading. This is consistent with L12-39/L12-42 and is only a wording point: "no successor file" vs "successor heading".
- 04491 and 04493 share an identical reason text that mentions both the intro and Related gloss. Fine, but the unit-specific truth is carried by "The source intro names ..." only for L12.

## Lead-judgment questions
- Q1. The bare "ADR0020" at L70 of tell-a-stale-worktree-index (live knowledge file) is a removed-decision-id mention, not a path. No record in batches 0xx treats a bare ADR id as an edge (0 such edges across all batch records), so this is consistent with the scanner. Is a successor note for bare removed decision ids in live knowledge prose expected anywhere (L12-38 "removed decision ids need successor notes")? I did not count it as a defect.

## Counts
| Set | Required | Reviewed | Rework |
|---|---:|---:|---:|
| batch-073 (Part 04) | 6 | 6 | 0 |

| Stratum (overlaps noted) | Files | Reviewed | Rework |
|---|---:|---:|---:|
| full-set-expansion (all 6) | 6 | 6 | 0 |
| historical-patched-selected (wait-out-an-active-main-checkout-lock-holder) | 1 | 1 | 0 |
| historical-unpatched-selected | 0 | 0 | 0 |
| corrected-lead-supplement | 0 | 0 | 0 |

Edges: 24 reviewed (1 + 4 + 2 + 7 + 5 + 5): 12 patch, 12 preserve, 0 parked, 0 row-flip, 0 added.

No hash was independently verified beyond the printed record digest equals inventoryFileDigest on each file.

Status: DONE
Summary: All 6 Part 04 files (24 edges) reviewed against the pinned sources and targets; every disposition, target, anchor and adjacent gloss is correct, 0 rework. One minor Lead question on bare "ADR0020" mention (not counted as a defect).

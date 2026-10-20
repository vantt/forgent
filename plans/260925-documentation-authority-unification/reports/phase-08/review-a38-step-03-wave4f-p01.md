# Review a38 step-03 wave 4f, Part 01 (batch-076 sample)

Pin ae141550c2e022310de7a0efea757580c0b2479f; worktree detached at 63952951a. Reviewer: read-only, no checker or probes run. Method: custom per-field extractor (edge fields, searchWitness counts, diff, coverage/scan) on batch-076.jsonl; each source read whole via git show at the pin (all four files are under 200 lines); every target and successor holder opened at the pin; legacy-token grep of each source to confirm no missed reference.

## Per-file verdicts

### 1. why-auto-launched-herdr-panes-must-be-labeled-before-spawning-claude.md
Path: docs/knowledge/why-auto-launched-herdr-panes-must-be-labeled-before-spawnin/why-auto-launched-herdr-panes-must-be-labeled-before-spawning-claude.md
Set batch-076, stratum patched-seeded, verdict **ok**, 2 edges reviewed.
- maps-j-04651 (L171, preserve): docs/history/stage-status-driving-coordination/plan.md exists at the pin. Undated Related entry. The retained path is literal and the reason is true. ok.
- maps-j-04652 (L174, patch, Phase 9): docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md is absent at the pin. The registry holder docs/knowledge/launch-claude-in-a-new-herdr-pane-from-a-plugin/launch-claude-in-a-new-herdr-pane-from-a-plugin.md exists. The adjacent gloss is "person-triggered launch pattern ... label-after-spawn ordering is safe because a person is watching". The target is the row-select, person-triggered pane split + pane run recipe, so the gloss is true. No counts or lists are claimed. The diff changes only the path (label and path follow, no anchor needed). ok.
- No missed references: grep for legacy roots finds only L174.

### 2. why-claimworks-cas-reread-stays-while-its-redundant-full-log-read-was-deduped.md
Path: docs/knowledge/why-claimwork-s-cas-reread-stays-while-its-one-redundant-ful/why-claimworks-cas-reread-stays-while-its-redundant-full-log-read-was-deduped.md
Set batch-076, stratum patched-seeded, verdict **ok**, 3 edges reviewed.
- maps-j-04663 (L55, parked, description-rewrite): the source claims the cited document is evidence that "this project's own sessions have repeatedly hit real multi-process lock contention on this exact file" (the events log). The registry alias holder (the renamed ...-ambiguous-with-no-r/main-checkout-lock-toctou-race.md; rename at 038d9db31 is plausible) has the title "could report AMBIGUOUS with no real contention". It covers torn bytes in main-checkout.lock, a different file, and a false-contention failure. A redirect would leave a false gloss, so the park is correct. The blockedCategory equals the dependencyCategory. The successor note is non-executable and does not name the edge's own path. The "from" locator-token exclusion is reasonable. ok.
- maps-j-04664 (L81, preserve): docs/history/tsk-3jh-dedupe-redundant-state-reads/CONTEXT.md exists at the pin. ok.
- maps-j-04665 (L84, patch, Phase 9): redirects to the same holder as 04663. The gloss is "the same class of real concurrent-write hazard this CAS reread exists to catch". See Lead question Q1; I accept it as authored and it is not a defect. The diff changes only the path. ok.
- No missed references: the only legacy tokens are L55, L81 and L84.

### 3. why-decisions-already-locked-and-approved-by-a-person-still/decision-record.md
Path: docs/knowledge/why-decisions-already-locked-and-approved-by-a-person-still/decision-record.md
Set batch-076, stratum unpatched-seeded, verdict **ok**, 2 edges reviewed.
- maps-j-04680 (L14, preserve): docs/history/work-item-title-contract/CONTEXT.md exists at the pin, and the passage is a completed past event (the capture of tsk-52g). The preserve is correct, and the diff is empty, as expected.
- maps-j-04681 (L35, preserve): the `docs/history/<feature>/CONTEXT.md` placeholder is an illustrative convention, preserved per L12-30(4). ok.
- No missed references.

### 4. why-decompose-checks-footprint-overlap-before-creating-children.md
Path: docs/knowledge/why-decompose-checks-footprint-overlap-before-creating-child/why-decompose-checks-footprint-overlap-before-creating-children.md
Set batch-076, stratum unpatched-seeded, verdict **ok**, 2 edges reviewed.
- maps-j-04682 (L122, preserve): docs/specs/work-state.md is a past-tense narration of the completed tsk-1uw edit footprint (a docs task whose "plan declined to split"), in a non-operative position. Per L12-42(3) and L12-43 (completed-sweep narration), it preserves with the successor note docs/platform/work-state/spec.md, which exists at the pin. ok.
- maps-j-04683 (L128, preserve): this is a blockquoted verbatim `work.decision` capture, which is captured evidence under L12-40. It preserves with the same successor note. ok.
- No missed references. The src/intake/plan.mjs:741 coordinate is a code path, not a legacy-doc edge.

## Outcome defects
None.

## Record-text notes (not rework)
- The 04651 and 04664 preserve reasons say "current retained path stays literal". They do not state whether docs/history/** survives the Phase 9 retirement. That is consistent with the earlier rulings, so I raise no defect.
- The 04652 and 04665 reasons are long boilerplate, but they do state target-specific scope.

## Lead-judgment questions
- Q1: Is the gloss on 04665 ("same class of real concurrent-write hazard this CAS reread exists to catch") acceptable against a target titled "AMBIGUOUS with no real contention"?
  - The target documents a reader racing a non-atomic writer, i.e. a true concurrent-access hazard that is resolved with atomic writes. It is not a lost-update hazard.
  - The gloss is a "class of hazard" claim, so I judge it acceptable and the patch correct, consistent with the Lead's brief.
  - Dissent: a stricter reading ("real concurrent-write" versus "false contention") would park 04665 as description-rewrite too, in line with 04663.
  - I did not count this as rework, because the same-unit rule does not apply (different lines, different claim).

## Counts
- batch-076, patched-seeded stratum: reviewed 2 of 2 files, 5 edges, rework 0 (0%).
- batch-076, unpatched-seeded stratum: reviewed 2 of 2 files, 4 edges, rework 0 (0%).
- Part total: 4 files, 9 edges, rework 0. No overlaps between strata. The set stays within the 3% threshold per stratum.

Status: DONE

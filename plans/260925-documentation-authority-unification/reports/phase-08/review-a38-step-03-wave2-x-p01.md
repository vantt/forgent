# review-a38 step-03 wave2 expansion, Part 01

Pin: ae141550c2e022310de7a0efea757580c0b2479f (author pin; worktree detached at feeeeee92, read-only).
Method: for each file, loaded the record by Python field extraction (edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency categories, unitDispositionReason, witness categories; diff printed separately). Read every source file whole with `git show <pin>:<path>`. Read the target documents at the pin (headings and the cited passages) and looked up doc-registry aliases at the pin. Re-scanned each source line for docs/ paths and basenames to find missed references. Did not run any step-03 checker or probe script. Did not hash the record or diff bytes, so no hash equality is claimed. No file was edited.
Read rules: owner-answers L12-26, L12-30..L12-37 and the progress.md authoring rules digest.

## Per file

### 1. docs/explanation/skill-prose-cleanup-design.md (batch-036, stratum Part-A-outcome-change): ok
Edges reviewed: 8 (maps-j-03945..03951 plus author-added L44C54).
- 03945, 03946, 03948, 03949 and the added L44C54 (`docs/history`, `docs/backlog.md`, `docs/how-to/fix-bare-citation-findings.md`, `docs/how-to/fix-d-local-outside-home-findings.md`, `docs/decisions`): preserve is correct. All paths exist at the pin, are retained roots, and are registry-active with no aliases.
- 03947 `docs/specs` (L45): parked as description-rewrite. This is a live list item that names the retiring tree as a category, so L12-37(4) applies. The per-edge Distinct claim against the preserved retained siblings in the same item L44 is genuine: retiring tree versus retained paths. Park category and reason are correct. Witness category is citation-only.
- 03950 (L65): the explanation target exists, so preserve is correct.
- 03951 (L77-78, hyphen-wrapped): patch to `docs/knowledge/how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md#steps`. The registry alias lists the old path and the target exists. The "Steps" heading holds the claim (throwaway chore item, verify "true", claim, events.jsonl). The adjacent description matches the target. The diff keeps the label form and the hunk is consistent. ok.
- No missed reference (re-scan: only `CONTEXT.md` and `SKILL.md` basenames, which are not legacy docs).

### 2. docs/knowledge/add-a-read-only-fgos-verb-and-its-plugin-skill/add-a-read-only-fgos-verb-and-plugin-skill.md (batch-037): ok
Edges reviewed: 3.
- 04125 and 04127: history CONTEXT.md paths exist at the pin, so preserve is correct.
- 04126 (L64): patch to the knowledge alias target, anchor `a-third-case-a-verb-whose-write-target-ignores---dir-entirely`. The heading exists at target line 115 and holds the "derive the write root from the same resolved root as dir" claim. The adjacent text "'s third case" is true. ok.
- No missed reference (`docs/enduser-docs-index.json` is a retained generated file, not a legacy edge).

### 3. docs/knowledge/fix-a-project-skill-that-skill-reports-as-unknown-skill/fix-invisible-nested-project-skills.md (batch-037): ok
Edges reviewed: 1. 04264 is a preserve of `docs/history/fgos-skill-discovery-gap/CONTEXT.md`, which exists at the pin. Empty diff is correct. No missed reference.

### 4. docs/knowledge/how-to-verify-every-citer-before-retiring-a-shared-skill-fra/verify-every-citer-before-retiring-a-shared-skill-fragment.md (batch-037): ok
Edges reviewed: 5.
- 04495, 04496 and 04499: `docs/history/strip-submit-assist-classify-dispatch/plan.md` exists, so preserve is correct. 04495 and 04496 are the quoted provenance lines. 04499 is the Related entry, a retained target.
- 04497 and 04498 (body `## Related`, L78 and L82): both old paths are MISSING at the pin and aliased in the registry. Both patch to the exact live holder with a null anchor, which is justified as whole-guide navigation. The target titles match the adjacent descriptions ("same shape one layer down", "the fragment this example is drawn from"). The patches are consistent with L12-37(1,2).
- No missed reference.

### 5. docs/knowledge/how-to-wire-a-skill-through-the-dispatch-decision/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md (batch-037): REWORK
Edges reviewed: 1.
- OUTCOME DEFECT, maps-j-04514, source L55-56: `(`dispatch.mjs execute` ... was removed; decision 0062 in `docs/specs/runner.md`.)`. The record preserves it as "dated retirement/removed-door framing". The source has no date marker. The passage is present-tense live how-to navigation to a decision, so L12-37(3) applies: an undated live decision citation is navigation, as with 06509 and 05130. Correction: patch (Phase 9) to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, anchor `0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability`. That heading is at holder line 1716 and is the same patch recorded for the identical wording in maps-j-04011 (batch-068) and maps-j-06509. The reason must drop the false "dated" claim.

### 6. docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md (batch-037): REWORK
Edges reviewed: 6.
- OUTCOME DEFECT, maps-j-04517, source L95-97 (list item L91): "the earlier `node src/runner/dispatch.mjs execute` door was removed, decision 0062 in `docs/specs/runner.md`". Same defect as 04514. It is preserved as dated retirement framing, but there is no date in the passage and it sits in a live how-to step. Correction: patch (Phase 9) to the h-36d872fbb0e5.md decision 0062 heading, as above.
- 04515 (L47): alias-resolved patch to `docs/knowledge/executor-cross-provider-governance/executor-cross-provider-governance.md#executor-cross-provider-governance` (H1). The cited claims (Field, kind-independence, resolve-time refusal) span several H2s, so the nearest common parent is the H1. Accepted. The record's "specific evidence is enclosed by the actual extractor heading" is loose wording for a whole-reference citation (record-text note only).
- 04516 (L88): patch to `forgentx-tool-registry-configuration.md#a-tool-registry-entry-is-never-an-automatic-presence-gate-for-dispatch-tsk-62v-tsk-5tm-1-d1`. The heading exists at line 208 and matches the description "never gates automatically, ask explicitly". ok.
- 04518 and 04519: history CONTEXT.md paths exist, so preserve is correct.
- 04520 (L159, body Related): the earlier wave-2 rework is now patched to the registry alias holder with anchor `real-example-two-genuine-gaps-in-returns-own-branch-source-verify-path-not-stale-tests` (target line 111). The section covers tsk-5l2-1 and tsk-5l2-2, so the description is true. Fixed.
- No other missed reference.

## Record-text notes (not rework)
- 04514 and 04517 reasons assert "dated retirement/removed-door framing" where no date exists in the passage. This falls away once the edges become patches.
- 04515 reason says "specific evidence is enclosed by the actual extractor heading" while the anchor is the target's H1. It is a whole-reference citation, so the wording could say that directly.

## Lead-judgment questions
1. Cross-record consistency of the decision 0062 citation. In this part, 04514 and 04517 are preserved while the same present-tense wording was patched in batch-068 (03989, 04011), batch-038 (06509) and batch-015 (05130). The other blockquote forms ("> ... were removed (decision 0062 in `docs/specs/runner.md`)") in batch-036/064/065 explanations (for example 03822, 03810) were not in my part. They carry the same phrase and are preserved under the "dated" reasoning. Lead should confirm whether any of them has a dated marker. If L12-37(3) means the phrase alone, the preserves in batch-036/064/065/067 would fall under the same rework.
2. Is the decision-0062 hit in the batch-037 files a stray gap in the L12-37(3) re-application pass, or intended? I treated it as a gap.

## Per-set and per-stratum accounting (Part 01 only)
| Set / stratum | Reviewed files | Rework | Rework files |
|---|---:|---:|---|
| batch-036 / Part-A-outcome-change | 1 | 0 | none |
| batch-037 / full-set expansion (pooled over both strata) | 5 | 2 | wire-a-skill-through-the-native... (04514), wire-a-skills-classify... (04517) |
| batch-037 / patched files (non-empty record diff): add-a-read-only, verify-every-citer, wire-a-skills-classify | 3 | 1 | wire-a-skills-classify (04517) |
| batch-037 / unpatched files (empty diff): fix-invisible-nested, wire-a-skill-through-the-native | 2 | 1 | wire-a-skill-through-the-native (04514) |
Edges reviewed: 24 of 24 (batch-036: 8; batch-037: 3 + 1 + 5 + 1 + 6 = 16). Outcome defects: 2 edges, both a wrong preserve that should be a patch.
Whole-set rates need the other parts.

Status: DONE_WITH_CONCERNS
Summary: Reviewed all 6 files and 24 edges. 4 files are ok and 2 batch-037 files need rework (04514 and 04517, undated decision 0062 citations preserved instead of patched under L12-37(3)); I made no repairs.

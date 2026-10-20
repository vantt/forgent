# Review a38 step-03 batch081 expansion, part p02

Pin ae141550c; worktree /home/vantt/projects/forgentX-s8-review. Records read per-field with Python (batch-081.jsonl); every file read whole at the pin; no checker/probe run. 6 files, 32 edges reviewed (4+8+3+1+6+10).

## Per-file verdicts

### 1. docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md
Set batch-081, stratum patched (L12-49 expansion). 4 edges. **Verdict: REWORK (1 outcome defect).**
- **OUTCOME DEFECT maps-j-04994** (source line 71, patch to daemon explanation, anchor `d10-then-d9-a-real-versioned-api-contract-first-an-mcp-surface-after`). The source claim is "Chokepoint principle cited from tsk-7l9 D7: gateway never touches the repo directly, every write goes through a real fgos verb". In the target (`docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`) D7 has its own section at line 57, `## D7: gateway is the one internal chokepoint that ever spawns a verb`. The record bound targetLines [93] (the D10/D9 heading), where D7 appears only as a passing mention ("still funneled through D7's one chokepoint", line 108). The reason text "D7 in this combined target section is the CLI chokepoint" is false, because D7 is not in that section. Rule: L12-32(2) (anchor is the nearest enclosing heading of the lines that actually carry the claim) and L12-32(3). Correction: anchor `d7-gateway-is-the-one-internal-chokepoint-that-ever-spawns-a-verb` (target line 57; passage lines 57-65), and correct the reason and the diff's appended `#...` fragment to match.
- 04992 (preserve, docs/ui-spec M03, past-tense lead paragraph, retained path), 04993 (preserve, docs/contracts yaml, retained), 04995 (preserve, docs/history dir in the Source section, retained): ok.
- Diff: one hunk, only 04994's path changed, wrapper and prose untouched. Apart from the wrong fragment it is applicable.

### 2. docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md
Set batch-081, stratum patched. 8 edges (05000-05007). **Verdict: ok.**
- 05003 (CTR010 reference, whole file), 05004 (daemon explanation, whole file), 05005 (web dashboard layout doc), 05006 (TUI layout and action queues doc): each patch target exists and matches its adjacent description. Both new holders match their glosses (target heading/intro: layout doc "herdr web dashboard: layout, userflow and visual language"; TUI doc "work-items panel + action-queue boxes"). The whole-file anchor is substantively justified: the sentence cites the complete document, with no section claim.
- 05001, 05002, 05007: preserves of retained docs/history paths and the docs/contracts yaml; correct.
- 05000 (preserve `docs/specs/herdr-web-dashboard.md`, "tree retires"): see Lead question Q1.
- Diff: two hunks, exactly the four patched paths; complete form retained.

### 3. docs/knowledge/why-the-iron-law-gate-only-runs-at-the-trunk-merge-boundary/why-the-iron-law-gate-only-fires-at-the-trunk-boundary.md
Set batch-081, stratum patched. 3 edges. **Verdict: ok.**
- 05010 preserve (retained docs/history); 05011 patch to the Iron Law evidence contract doc (the "evidence contract this gate consumes - proof gathered, never self-acknowledged" gloss matches the target); 05012 patch to the retrospective-content-gate doc (the "kind: 'engine' tagging discipline" gloss matches target lines 4, 90-112, so whole-file is justified).
- Diff: two hunks, correct.

### 4. docs/knowledge/why-the-judge-discovery-judge-decompose-capacity-entries-wer/why-the-judge-discovery-and-judge-decompose-capacities-were-removed.md
Set batch-081, stratum patched. 1 edge. **Verdict: ok.**
- 05013 patch with anchor `the-other-11-locked-decisions`: D10 sits under "## The other 11 locked decisions" at target line 112 (the judge naming-collision item), consistent with the gloss ("naming collision harmless, no code fix"). Visible label ("'s D10") remains true. Diff correct.

### 5. docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md
Set batch-081, stratum patched. 6 edges (05014-05019) plus 1 supplemental candidate. **Verdict: REWORK (1 outcome defect, a missed reference).**
- **OUTCOME DEFECT: missed reference at source line 63** (`0031-bo-guard-cam-tu-orchestrator-sau-khi-0029-gan-nghia-moi.md`). The record lists it in checks.coverage.legacyScan.candidates as a contextual exclusion ("No retiring/legacy documentation referent ... resolved readings [consumer-sibling path]"). It is a deleted decision basename: docs/decisions/0031-... was deleted at 4722361ae (tsk-1lv-4 corpus retirement), and the pinned text itself calls it "a since-deleted file". Rule: L12-39(7) (deleted 00NN-*.md basenames in live text join the supplemental scanner, including author-added edges; find a title-matched narrative holder or park a dead link). Precedent: other batches (070/071/077) carry such basenames as edges. The exclusion reasoning (sibling-path resolution) does not address the actual referent. Correction: add an authorAddedEdge for line 63, disposition preserve inside the existing historyRegion (`Pointer maintenance (tsk-4ah)`, line 60), with a successor note to `docs/platform/runner/decisions/h-36d872fbb0e5.md` heading `### 0031 - Bỏ guard cấm từ orchestrator ...` (line 993 at the pin). Remove the contextual exclusion.
- 05014 preserve (retained docs/history, past-tense lead): ok. 05015 preserve (docs/how-to allowlist guide, removed at 270aa5ad8 with no successor; the file itself says it was removed): ok.
- 05016 patch to runner/decisions/h-36d872fbb0e5.md, anchor the 0031 heading: target heading exists (line 993) and the title matches the visible label; the target section (lines 993-1094) holds the "string-match cannot narrow" reasoning cited by the gloss. ok.
- 05017, 05019 preserve (docs/specs/runner.md, docs/specs/reading-map.md) with historyRegion "Pointer maintenance (tsk-4ah)", marker "No other content": a completed, past-tense pointer-maintenance section; ok per L12-46. 05018 preserve (retained docs/history path, two-line span joined): ok.
- Diff: single hunk, correct.

### 6. docs/knowledge/why-the-live-events-jsonl-corrupted-and-why-the-fix-needed-a/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md
Set batch-081, stratum patched. 10 edges (05020-05029). **Verdict: ok.**
- 05020, 05021, 05022: preserves of retained docs/history paths inside blockquoted captured quotes: ok (L12-40).
- 05023 patch to the worktree-isolation decision doc, anchor `the-decision-neither-of-the-two-options-on-the-table` (target line 30, "block-tree: remove .fgos from worker checkout, reject any diff touching it"). Heading and gloss ("ADR0020 one-door-write rule ... documents from the worktree-checkout side") match.
- 05024 (Related, line 97) patch to the fix-fgos-write-rejected-merge-block how-to; gloss "the concrete recipe for the one-door-write rejection" matches the target's intro.
- 05025 (Related, line 99) parked, description-rewrite: the alias holder opens with "**Superseded** (tsk-3tp, on top of tsk-3ve): events.jsonl is now a frozen baseline ... referenced scripts deleted", while the source says "the recipe for correctly resolving the underlying git-merge conflict". Category and reason are true; sole blocker stated.
- 05026 preserve (retained docs/history dir, Related); 05027, 05028, 05029 preserve (Document history region and fenced capture of the original docPath, self-alias never patched, L12-40): ok.
- Diff: two hunks (05023, 05024 only), correct; 05025 correctly left unpatched.

## Counts (this part)
- batch-081 set: 6 reviewed files, 2 rework (files 1 and 5). Patched stratum (L12-49 expansion): same 6 reviewed, 2 rework. No overlap with wave5a reviewed files in this part.
- Defects: 2 outcome defects total (1 wrong anchor, 1 missed reference).

## Record-text notes (not rework)
- 04994 reason says "D7 in this combined target section" - rewrite with the anchor fix.
- 05016/05017/05019 reasons are accurate; 05017/05019 reason text quotes the whole region rather than the edge's own sentence (cosmetic).

## Lead-judgment questions
- Q1 (05000): the lead sentence "tsk-54j ... writing the tech-agnostic area spec at `docs/specs/herdr-web-dashboard.md`" is preserved as past-event identity (same class as 04932). A live holder exists (docs/platform/herdr-web-dashboard/spec.md), but the sentence narrates a completed task, not a navigation pointer, and the file's wrapper is live knowledge with no declared historyRegion. I judged preserve acceptable (consistent with prior batch-081 preserves); Lead may want a historyRegion declaration or successor note for consistency.
- Q2 (line 63 in file 5): confirm that L12-39(7) outranks the L12-38 "bare names exempt in history" clause for a live file's past-tense history region. I read it as an edge being required, because the checker-flagged candidate is a deleted decision basename, not a code/config name.

Status: DONE_WITH_CONCERNS
Summary: Reviewed 6 files / 32 edges; 4 ok, 2 rework (04994 anchor points to the D10/D9 section instead of the D7 chokepoint section; deleted decision basename at line 63 of the launcher-guard file is a missed edge). Rework rate for this part 2/6.

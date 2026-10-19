# Review A38 step 02e mapping part 13

Reviewer: `reviewer:sonnet-session:a97d710f81735cce4@2026-10-19`
Commits: worktree HEAD `f1965d0a5` (verified); author `38c1ef8a5`, accounting `f1965d0a5`
Part: 13 (`mapping-e-0721..0780`, 60 distinct mappings, 105 edges, source table `step-02e-distinct-mappings.json`)
Rules applied: L12-21 disposition rules, L12-7, L12-10, L12-19, L12-20.

## Method

Resolved all 60 ids and their 105 edge ids through the index and census. For every edge I compared the physical span bytes (1-based columns, wrapped spans joined by newline) with the consumer file at this commit (105/105 match), checked the next character for longer-token boundaries (none), and read the surrounding lines. `docs/history` appears nowhere in `transitional-switchboard.json`, so it is not a moving or retiring root. All 105 edges share one shape: role reader, rule external-project, preCutoverAction `preserve bytes`, cutoverAction `preserve`, no `cutoverPatch`, no desiredOwner or anchor. Four edges sit in generated `docs/backlog.md` (preserved, never hand-patched). No edge appears in two mappings of this part.

## Per-entry verdicts

| Entry | Legacy reference | Edges | Action | Target | Verdict | Notes |
|---|---|---:|---|---|---|---|
| mapping-e-0721 | `docs/history/p50-workflow-induct/` | 2 | preserve, no patch/owner | absent (historical) | ok | Convention text `docs/history/<feature>/` plus p50 sample; target dir absent (historical). Preserve correct. |
| mapping-e-0722 | `docs/history/p50-workflow-induct/plan.md` | 1 | preserve, no patch/owner | absent (historical) | ok | docs/backlog.md is generated; edge preserved, never hand-patched (correct). |
| mapping-e-0723 | `docs/history/p50-workflow-induct/reports/` | 1 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0724 | `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` | 4 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0725 | `docs/history/parallel-decomposition-footprint-avoidance/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0726 | `docs/history/parallel-dispatch-demo-format-utils/` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0727 | `docs/history/phase-2-routing/CONTEXT.md` | 2 | preserve, no patch/owner | absent (historical) | ok | Includes front-matter `authoritative_for:` exact-match key (preserved, correct) and prose saying the file is deleted; preserve, no successor exists. |
| mapping-e-0728 | `docs/history/phase-2-status-category-schema/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0729 | `docs/history/phase-2-status-category-schema/DISCUSSION.md` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0730 | `docs/history/phase-3-compound-learning` | 1 | preserve, no patch/owner | absent (historical) | ok | Reading-map line 181 historical test-count prose; preserve. |
| mapping-e-0731 | `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` | 7 | preserve, no patch/owner | absent (historical) | ok | Pinned historical citations in platform-foundations/runner specs and reading maps; target dead, bytes preserved, no patch. |
| mapping-e-0732 | `docs/history/pi-executor-runtime-capacity/RESEARCH.md` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0733 | `docs/history/pi-executor-runtime-capacity/evidence/` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0734 | `docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md` | 3 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0735 | `docs/history/pick-leaf-baseref-guard/CONTEXT.md` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0736 | `docs/history/pick-leaf-baseref-guard/plan.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0737 | `docs/history/pick-reattach-live-worktree/CONTEXT.md` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0738 | `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0739 | `docs/history/pick-worktree-claim-race/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0740 | `docs/history/pick-worktree-claim-race/plan.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0741 | `docs/history/pick-worktree-reclaim-zero-destroy/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0742 | `docs/history/pick-worktree-reclaim-zero-destroy/plan.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0743 | `docs/history/postland-drift-consumer/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0744 | `docs/history/pr-lifecycle/reports/validation-s1-gate.md` | 3 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0745 | `docs/history/prevent-main-checkout-fgw-branch-commit/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0746 | `docs/history/promote-to-component/CONTEXT.md` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0747 | `docs/history/promote-to-component/CONTEXT.md/plan.md` | 1 | preserve, no patch/owner | absent (historical) | ok | Mangled reference `CONTEXT.md/plan.md` inside a code-comment copy in a knowledge doc; verbatim carriage preserved, no patch (correct). |
| mapping-e-0748 | `docs/history/read-surface-effective-stage/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0749 | `docs/history/reclaim-refuse-live-session-worktree/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0750 | `docs/history/recording-points-audit/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0751 | `docs/history/recovery/recovery-<session8>.md` | 1 | preserve, no patch/owner | absent (historical) | ok | Template placeholder `<session8>` in upstream bee inventory report; preserved. |
| mapping-e-0752 | `docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md` | 1 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0753 | `docs/history/research/<topic-slug>.md` | 3 | preserve, no patch/owner | absent (historical) | ok | Template placeholder `<topic-slug>` in upstream bee inventory reports; preserved. |
| mapping-e-0754 | `docs/history/retire-fgos-runner-json-fallback/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0755 | `docs/history/retire-fgos-submit-assist/plan.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0756 | `docs/history/retro-next-shared-driving/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0757 | `docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md` | 1 | preserve, no patch/owner | exists | ok | Wrapped token joined across lines 29-30, full unit preserved. |
| mapping-e-0758 | `docs/history/return-close-pre-done-work/CONTEXT.md` | 4 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0759 | `docs/history/review-diff-enobufs-stale-branch/plan.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0760 | `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0761 | `docs/history/round3-review-fixes-2026-08-06/` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0762 | `docs/history/runtime-claim-doing-separation/` | 4 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0763 | `docs/history/session-claim-liveness/CONTEXT.md` | 3 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0764 | `docs/history/session-claim-liveness/DISCUSSION.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0765 | `docs/history/setup-doctor-uninstall-dir-resolution/` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0766 | `docs/history/setup-runs-registered-fixes/CONTEXT.md` | 6 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0767 | `docs/history/shell-rc-dead-source-lines` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0768 | `docs/history/skill-prose-cleanup/DISCUSSION.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0769 | `docs/history/spec-docs-lifecycle-realignment/` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0770 | `docs/history/spec-docs-lifecycle-realignment/RESEARCH.md` | 1 | preserve, no patch/owner | exists | ok | Wrapped brace list `{plan,RESEARCH}.md` across lines 282-283, full unit preserved. |
| mapping-e-0771 | `docs/history/spec-docs-lifecycle-realignment/plan.md` | 2 | preserve, no patch/owner | exists | ok | Same wrapped brace list plus a plain plan.md citation; preserved. |
| mapping-e-0772 | `docs/history/stage-status-driving-coordination/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0773 | `docs/history/stage-status-driving-coordination/plan.md` | 2 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0774 | `docs/history/stale-worktree-index-guard/CONTEXT.md` | 3 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0775 | `docs/history/state-runner-merge-boundary/CONTEXT.md` | 1 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0776 | `docs/history/store-atomic-rmw/` | 2 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0777 | `docs/history/str46-io-contract/` | 2 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0778 | `docs/history/str61-chat-context-continuity/CONTEXT.md` | 1 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0779 | `docs/history/str63-frozen-judge-fgos/CONTEXT.md` | 2 | preserve, no patch/owner | absent (historical) | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |
| mapping-e-0780 | `docs/history/strip-submit-assist-classify-dispatch/plan.md` | 3 | preserve, no patch/owner | exists | ok | docs/history is not a switchboard or retiring root; historical citation preserved, no executable new text. |

## Totals

ok 60 / rework 0 / needs-Lead-judgment 0 (of 60).

## Old defect classes

None found in this part: no partial-span or prefix/suffix patch, corrupted key, split link, prefix-inside-longer-token, code token as path, self-link, patch into verbatim carriage, executable `new` on any row, provenance rewrite, generated-file hand patch, or authoritative_for rewrite (maps-e-01565 line 2 preserved). Wrapped and brace tokens are kept whole.

## Observations (not rework)

1. The shared rationale string reads "L12-10 upstream citation has no fgOS owner", but most are fgOS-internal `docs/history/<feature>/` citations. Preserve is still right because `docs/history` is not a legacy authority root and the citations are historical (L12-10; plan.md line 86). Wording only.
2. About 14 targets no longer exist (p50-workflow-induct, phase-3-compound-learning, phase-2-routing, store-atomic-rmw, str46-io-contract, str61, str63, pr-lifecycle and others). They stay as preserved historical citations with no successor note. No successor exists and nothing executable is proposed, so this is not a defect.

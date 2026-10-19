# Step 3 wave-3 expansion review, Part 01

Pin `ae141550c2e022310de7a0efea757580c0b2479f` (worktree detached at 5a4ca0621). Read-only. No checker or probe run.

## Method

Per file: loaded the record by `file` with python3 and printed every per-edge field, the diff, the legacy-scan candidates, anchors, relativeResolution, labelForm and a bounded view of descriptionTruth/resolutionSearches. Read each consumer at the pin via `git show` (all 5 are small, read whole; lines with docs/, specs, architect, .md and decision grepped, and the edge regions read in context). Spot-verified at the pin: target file existence for every patch target, preserve target and successor note; target headings and the quoted target text against the adjacent description; "never existed" claims (no git history for the dead-link paths); the 0062 decision heading at `docs/platform/runner/decisions/h-36d872fbb0e5.md:1716`.

## Per-file verdicts

### 1. `docs/knowledge/how-to-wire-a-skill-through-the-dispatch-decision/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`
Set batch-037, stratum Part-A-outcome-change. Verdict **ok**. Edges read: 1/1.
- maps-j-04514 (L56, "decision 0062 in `docs/specs/runner.md`"): patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-...`. Live knowledge file, undated decision citation, so L12-38(1) requires the exact decision heading. Correct. The heading exists, the anchor slug matches the heading, and the adjacent claim (raw `dispatch execute` door removed) matches decision 0062. Diff hunk lines 53-56 agree with the source.

### 2. `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
Set batch-037, stratum Part-A-outcome-change. Verdict **ok**. Edges read: 6/6.
- 04515 (L47) patch to the knowledge executor-cross-provider-governance doc, H1 anchor. The registry alias is correct, the whole-reference claim is justified, and the description (`allowCrossProvider` refusal at resolve time) matches target lines 13/23/54.
- 04516 (L88) patch to the knowledge tool-registry-configuration doc, anchor "a-tool-registry-entry-is-never-an-automatic-presence-gate-...". The target section (L208) says the registry is never an automatic gate and a caller asks with `fgos tool query --status present`. This matches the adjacent description.
- 04517 (L97) decision 0062 patch with exact heading anchor. Correct under L12-38(1); the adjacent "execute door was removed" text is true.
- 04518 and 04519 (L149, L156) `docs/history/...CONTEXT.md` preserve. Both paths exist at the pin and the history tree is retained.
- 04520 (L159) patch to the knowledge diagnose-a-blocked-return doc, anchor "real-example-two-genuine-gaps-...". The target heading exists (L111) and the adjacent text ("real gaps hit while returning tsk-5l2-1/tsk-5l2-2") matches that section.
- No missed references: the other `.md` hits (`.agents/skills/_shared/...`, `dispatch-fallback.md`, `../_shared/...`) are not retiring-tree paths. Diff hunks are consistent with the edges.

### 3. `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md`
Set batch-037, stratum Part-A-outcome-change. Verdict **ok**. Edges read: 3/3. Empty diff, as expected (no patches).
- 04595 (L54) `docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md`: parked dead-link with category equal on both fields. The path has no git history. The successor note `docs/history/rename-fgos-executing-to-fgos-code-implement/CONTEXT.md` exists at the pin. Matches L12-38(2). The pointer is a live knowledge navigation, not an example.
- 04596 (L88) `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`: parked dead-link. No history, and the successor knowledge file `.../smoke-test-fgos-code-implement-with-a-trivial-item.md` exists. Correct.
- 04597 (L168-169) wrapped path `docs/history/judge-verify-check\n-missing-stage-context/CONTEXT.md`: preserve. The joined path exists and is retained; the wrapped-span handling is right.

### 4. `docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md`
Set batch-037, stratum Part-A-outcome-change. Verdict **ok**. Edges read: 3/3. Empty diff.
- 04692 (L82-83, wrapped `docs/\nhistory/compound-learn-artifact-registry/DISCUSSION.md`) preserve. Path exists, retained.
- 04693 (L93) `docs/history/tsk-1m0/plan.md`: parked dead-link. The path has no history. The successor `docs/history/doctor-check-enduser-docs-index-stale/plan.md` exists and its title cites tsk-1m0, so it is the true name-drift holder. Correct.
- 04694 (L96) preserve. Path exists, retained.
- `docs/enduser-docs-index.json` is not a retiring-tree path and not in the scan, so it is correctly not an edge.

### 5. `docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md`
Set batch-038, stratum Part-A-outcome-change. Verdict **ok**. Edges read: 3/3.
- 06510 (L17) wrapper `Related:` entry `docs/specs/runner.md` patched to `docs/platform/runner/spec.md` (exists). Correct under L12-34(4) (whole-file navigation, no anchor needed, justified). The diff hunk @@ -14 is right.
- 06511 (L105) "read docs/specs/reading-map.md and the owning area spec": parked as description-rewrite. Correct under L12-38(6) as a present-tense claim naming a retiring tree. Both fields are equal and the reason states the actual blocker.
- 06512 (L159) `/docs/platform/agent-coordination/verification/<TRACK>/` preserve as an illustrative convention under a retained directory. Correct. The 12 basename scan exclusions (`index.md`, `current-cell.md`, `documentation-governance.md`) have true reasons: the resolved readings are all under `docs/platform/agent-coordination/...`, not the retiring tree.
- The L23 link into the retired-engine snapshot lands in the candidate tree and is not a legacy-root reference.

## OUTCOME defects

None. 16/16 edges reviewed; no wrong disposition, target, anchor or diff and no false adjacent description. No missed reference found in any of the five files.

## Record-text notes (not rework)

- In 04596 the successor note names a knowledge file whose name is `...fgos-code-implement...`. The consumer-side name uses "coding". This is the real name drift and the note is accurate.
- The 04693 reason's final sentence repeats the never-existed fact already in the dependency prose. This is harmless duplication.

## Lead-judgment questions

None. L12-38 covers every case.

## Counts

| Set | Stratum | Files reviewed | Rework |
|---|---|---:|---:|
| batch-037 | Part-A-outcome-change | 4 | 0 |
| batch-038 | Part-A-outcome-change | 1 | 0 |

Part 01 totals: 5 files, 16 edges, 0 rework. No overlap between the sets in this part. No acceptance is claimed.

Status: DONE

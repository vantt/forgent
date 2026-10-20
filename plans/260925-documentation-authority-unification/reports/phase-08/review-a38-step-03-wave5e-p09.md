# Review a38 step-03 wave5e part p09

Pin ae141550c2e0; read-only worktree 171937a68. No checker or probe run. Each source file was read in full; every edge, the complete diff and the search-witness/adjacent-resolution groups were read (record fields via python extraction only).

## Verdicts

| # | File | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml | batch-103 | unpatched-seeded | 17 (06915-06931) | rework (1 outcome defect, see D1) |
| 2 | docs/platform/herdr-web-dashboard/spec.md | batch-103 | patched-seeded | 19 (06936-06954) | ok |
| 3 | docs/platform/holder-lock/spec.md | batch-104 | patched-seeded, mandatory-threshold | 4 (06955-06958) | rework (1 outcome defect, see D2) |

Counts: set batch-103 reviewed 2 files / rework 1; set batch-104 reviewed 1 / rework 1. Stratum unpatched-seeded 1 / rework 1; patched-seeded 2 / rework 1 (holder-lock; overlaps with mandatory-threshold 1 / rework 1). Edges reviewed 40/40.

## Outcome defects

D1. docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml, edge maps-j-06921, source line 205 (`# (docs/history/tsk-4id-task-detail-screen/RESEARCH.md)`).
- Recorded: parked, step5-parity, with "path never existed".
- Rule: L12-51 ruling 1 / L12-47. The line is a YAML comment on a completed correction ("Confirmed via a real `fgos show` run (path)"). That is an evidence/provenance citation, which preserves even when the path never existed. It is not a live "see X" pointer, so it neither needs a runtime-parity edit nor a dead-link park.
- Correction: disposition preserve, with a note that the pre-rename holder is docs/history/herdr-web-dashboard/RESEARCH.md (exists at pin; the tsk-4id-task-detail-screen directory never existed). The parity-park wording would otherwise leave a Step 5 obligation for a citation that never needs editing.
- The other 16 edges are correct.
  - Preserves of retained docs/io-contract.md and docs/history/** are correct: 06915, 06918, 06922, 06923, 06924, 06927, 06929, 06931.
  - Step5-parity parks are correct for the live prose and metadata pointers to retiring docs/specs/work-state.md and docs/specs/runner.md: 06919, 06920, 06925, 06926, 06928, 06930.
  - Parks of the x-decisions basenames removed at 4722361: 06916 and 06917.
  - The candidate file is byte-identical to the runtime-served docs/contracts file (same blob 11684583c2ac), and the diff is correctly empty.

D2. docs/platform/holder-lock/spec.md, edge maps-j-06958, source line 405 (`| dispatch cwd lock, resume guard, reconcile | [runner.md](../../specs/runner.md) |`).
- Recorded: parked, description-rewrite, reason "candidate runner spec is a split navigation index; bind to exact recovery/runtime holders".
- Finding: the premise is unsupported and conflicts with the same record. Edge 06956 (line 19) says the candidate runner spec "owns Unit/CollaborationPattern and Workflow execution". The record names no holder it searched for. Yet one exact candidate holder exists for all three subjects: docs/platform/runner/subcomponents/h-6979005beaf7/spec.md, bullet RUL101 (line 196), under `## Business Rules`. It covers the per-worktree dispatch cwd lock, "the resume guard of `fgos run --resume`" and "the reconcile planner" read from the kernel holder list. Other records already patch to that holder with anchor `business-rules` (for example reading-map 08008).
- Rule: L12-32(1-3) and the "search before park / distinguish actual claim holders" rule.
- Correction: patch the destination to docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules, with a description-truth comparison to RUL101, and keep the label text. Alternatively keep the park but state which subject lacks a holder; the current text does not.
- Edges 06955 (line 18 to packaging-distribution/spec.md), 06956 (line 19 to runner/spec.md) and 06957 (row 402 to setup-doctor-registry.md#contract-setup-doctor-registry) are correct:
  - targets exist at HEAD;
  - the anchor is the H1 slug;
  - the diff hunks match the source lines 18, 19 and 402;
  - the gloss "setup and doctor registry" is true.
  - No missed legacy references: the full-file grep finds only these four, and bare D-ADR0055 mentions are not edges (L12-49).

## herdr-web-dashboard/spec.md (ok)

All 19 edges are correct.
- 06936 Provenance line 17: preserve (L12-47).
- 06937 Related line 25 (self source): park description-rewrite. Remove or consolidate at cutover; a self-pointer is forbidden.
- 06938-06941 audit "Truth correction evidence" locators in the line-30 framing: preserve. Retained paths (docs/decisions/index.md, docs/contracts/...yaml) exist at pin and HEAD.
- 06942, 06943, 06945-06951, 06953: preserve. The paths docs/history/**, docs/io-contract.md and docs/contracts/...yaml are retained and exist at pin and HEAD.
- 06944 patched to work-state/spec.md#3-work-item-data-dictionary. The H2 "3. Work Item Data Dictionary" exists and matches "introduces no new item shape". Diff hunk correct.
- 06954 patched to work-state/spec.md (Related, whole-file lifecycle gloss). Section 4 holds gate records, 5 the stage model and 7 the pull door, so the gloss is true.
- 06952 park GAP-02. The 0014 narrative sits only in retiring specs/platform-foundations.md. No title-matched holder exists in docs/platform; candidate platform-foundations.md has none (L12-41).
- No missed references.
  - Bare `15-system-events.md` names a retained docs/ui-spec file (L12-26(3)); the knowledge-layout paths are retained.
  - The bare decision `0014` mentions are not edges.
  - Diff hunks are at source lines 90 and 350 and match.

## Record-text notes (not rework)

- Edges 06916 and 06917 (the yaml x-decisions) park as step5-parity. 0014 has a GAP-02 narrative problem and 0011 has no recorded holder, so the park text could name both. The category stays step5-parity, as the smallest blocker.
- Edge 06958: "split navigation index" is inconsistent with 06956's description of the runner spec.

## Lead-judgment questions

1. D1 and D2 are dispositions where a conservative park was chosen. If Lead prefers to keep parks on a served contract (D1) as blanket parity, D1 downgrades to a note. D2 should still name the missing holder.
2. The yaml and spec 06947 live pointer to docs/contracts/fgos-gateway-api-v1.yaml is preserved as a retained path. Phase 8 line 60 plans a runtime switch to the candidate registry contract. If that switch moves the file, this is a Step 5 carry. It is not an outcome defect now.

Status: DONE
Summary: 3 files / 40 edges reviewed; herdr spec ok, two files rework (yaml 06921 should preserve as an evidence citation; holder-lock 06958 parks despite an exact runner RUL101 holder).

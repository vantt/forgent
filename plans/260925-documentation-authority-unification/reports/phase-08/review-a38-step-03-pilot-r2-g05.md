# Step 3 pilot round 2, semantic review g05 (batch-040: 4 files, 60 edges)

Pin ae141550c; read-only worktree d7c4a0cba. Read: owner-answers A51, L12-26, L12-30, r2 request g05 section, round-1 g05 review, and the four batch-040 records. Read the source at the pin: herdr-web-dashboard (all edge regions plus lines 36-70, 300-331), decision-citation-drift (whole file, 115 lines), distribution (rows 5d and RUL14, plus the header and edge lines), platform-foundations (heading outline plus every edge line). Ran step-03-resolve.py for 08078, 08082 and 08107. Checked every preserved retained path with `git cat-file -e` at the pin (all 14 exist).

## Per-file verdicts

### docs/specs/platform-foundations.md (batch-040) : ok
- Round-1 had no defects. The record-level GAP-02 note is present in `checks.coverage.carryObligation` ("no approved Phase 6 destination; do not delete docs/specs source without carrying its complete content; no destination invented"). This satisfies L12-30(2).
- All 23 edges stay preserve with the same reasons. I re-spot-checked lines 26, 71, 93 and 96 (retained root authority and retained dir) and 98-100, 310, 352 and 377 (inside the retired-decision bodies). They are correctly preserved under L12-26(3,5).
- New defects: none.

### docs/specs/herdr-web-dashboard.md : ok
- Round-1 defect 1 is fixed (08096, 08102, 08110). The registry alias `docs/reference/herdr-web-dashboard-layout.md` maps to `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md`, which exists at the pin. All three are now patches (Phase 9) with the same destination, and the labels are complete. The adjacent descriptions stay true: "the UI layer (tsk-3x6)", "takes this spec as its product input" and "concrete visual layout, colour and typography".
- Round-1 defect 2 is fixed (08107). It is parked with a named blocker: the 0014 narrative is only in docs/specs/platform-foundations.md, which is GAP-02 (no destination); docs/decisions/index.md and the decision-record index are indexes, not the narrative. I confirmed independently with `git grep` over platform/knowledge/reference/tutorials for 0014 and "Kiến trúc giao tiếp người". The only live hits are index rows, citations and a history table row, and none carries the narrative. The searchWitness is present, and the 5 live hits are correctly judged unusable. The nearby description "why a non-terminal UI is a client of a network gate" is untouched, so it stays true.
- The earlier ok edges are unchanged: 08095, 08100, 08103-08106 (existing docs/history/** carriers), 08097, 08099, 08108 (docs/io-contract.md retained), 08101 (docs/contracts/fgos-gateway-api-v1.yaml retained), 08098 and 08109 (work-state patch).
- New defects: none.

### docs/specs/decision-citation-drift.md : ok
- Round-1 defect (08064) is fixed. Line 27 "`--specs-dir <path>` (default `docs/specs`)" is now parked with the Step 5 default-root parity blocker and a searchWitness, consistent with 08062, 08066, 08068 and 08070 (L12-30(8)). The false "outside retiring roots" preserve reason is gone.
- Preserves re-judged:
  - 08061, 08063, 08065, 08067, 08069 and 08072 are docs/backlog.md (retained). 08072 is the dated dogfood evidence, which is preserved under (5).
  - 08071 (`docs/decisions/*.md` in the R3 out-of-scope clause) and 08073 (retired `NNNN-*.md` format note) are pattern/glob and retired-format text. docs/decisions still exists (index.md), so "retained directory exists" is factually true.
- Observation, not a defect: the line-26 `--decisions-dir` default `docs/decisions` has no inventory edge. This is kept as a Step 5 tracing obligation, as the request states.
- New defects: none.

### docs/specs/distribution.md : ok (one Lead-judgment note)
- Round-1 defect 1 is fixed (08082). RUL14 line 315 ("now lives ... in docs/specs/runner.md (RUL74 ...) ... (RUL75 ...)") is now a patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. RUL74 is at line 160 and RUL75 at line 162, both under "## Business Rules", so the target is the actual claim holder. The sentence "now lives with the provider-capacity rules in <target>" stays true. The diff hunk replaces only the path token.
- Round-1 defect 2 is fixed (08078). Row 5d "the lazy-probe unlock rule, now in ..." retargets the same file instead of the area portal, and the rest of row 5d is byte-identical.
- The earlier ok edges are unchanged and re-checked: 08077 and 08083 (docs/coexistence.md), 08080 (docs/distribution-vision.md), 08084 (repo/docs/architecture-manifest.json, `repo/` kept), 08079 and 08081 (docs/history evidence, including the wrapped span in 08079).
- New defects: none.

## Locator flags in my files
Only 08056 and 08256 style flags exist elsewhere. None of my edges is in the flag list. I checked 08078 and 08082 for locator scope: tokens RUL74 and RUL75 genuinely bind the target, and the "RUL14" token in 08082 is the enclosing rule's own id, not a target heading. Scope is correct.

## Lead-judgment questions
1. Anchor granularity (08078, 08082): both use `#added-in-candidate-runner-business-rules`, the H1 slug of the file. RUL74 and RUL75 sit under `## Business Rules` (slug `#business-rules`) and have no heading of their own. The H1 anchor is valid and unique, so I do not count it as a defect. If the Phase 9 style prefers the section that contains the rule, `#business-rules` is slightly more exact. Either form resolves, and the extractor reports only `unheaded-block-N`. Decide whether to normalise this across runner RUL-cites.
2. The `docs/contracts/fgos-gateway-api-v1.yaml` preserve (08101) is consistent with L12-26(3), since the root file is retained at the pin and a copy also exists under docs/platform/herdr-web-dashboard/contracts. L12-30(9) calls such runtime-read files "behavioral Step 5". If Lead wants that applied to a preserved root path, this edge would be parked rather than preserved. I leave it preserved, as accepted in round 1.

## Denominators (my slice only, batch-040)
- batch-040 g05 slice: 4 files reviewed, 0 rework (4 ok). Edges reviewed: 23 + 16 + 13 + 8 = 60, 0 defective.
- Dispositions after (patch/park/row-flip/preserve): platform-foundations 0/0/0/23, herdr 5/1/0/10, citation-drift 0/5/0/8, distribution 2/0/0/6. These match the request.
- No other set touched.

Status: DONE
Summary: All four g05 files are ok. All round-1 defects (08096, 08102, 08110, 08107, 08064, 08078, 08082) are confirmed fixed against L12-30, and the platform-foundations GAP-02 note is present. Two non-blocking Lead-judgment notes: anchor granularity for the runner RUL74/75 cites, and the 08101 runtime-read preserve.

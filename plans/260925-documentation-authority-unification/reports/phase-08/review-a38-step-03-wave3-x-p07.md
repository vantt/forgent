# Review a38 step-03 wave3 expansion, Part 07

Pin ae141550c. Worktree 5a4ca0621. All six files were read whole (every file is under 60 KB: 11.0, 53.0, 45.1, 4.2, 2.1 and 3.8 KB). I reviewed every edge and every scan candidate or exclusion. No check scripts were run.

## Per-file results

| # | Path | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | docs/distillery/sources/okf.md | batch-061 | full-set-expansion | 0 | ok |
| 2 | docs/distillery/sources/pi.md | batch-061 | full-set-expansion | 1 | ok |
| 3 | docs/distillery/sources/repository-harness.md | batch-061 | full-set-expansion | 8 | ok |
| 4 | docs/explanation/executor-dispatch-manual-log-gap-and-step-b5-fix.md | batch-065 | full-set-expansion | 1 | ok |
| 5 | docs/explanation/expr-eval-chain-passthrough-vs-split.md | batch-065 | full-set-expansion | 0 | ok |
| 6 | docs/explanation/fanout-batch-background-execution-and-orphan-recovery.md | batch-065 | full-set-expansion | 3 | ok |

### 1. okf.md (0 edges)
- The file has no legacy-tree path. A grep of the pinned text found only upstream OKF coordinates: SPEC.md, bundles/..., src/reference_agent/..., plus the upstream tokens `index.md`, `log.md` and `README.md`.
- The 5 scan candidates (L25, L28 `index.md`; L95, L111, L127 `README.md`) are excluded under L12-38(5). Each is a non-link token outside an explicit legacy-root form, inside distillery analysis history. The reasons are true and make no unrelatedness claim.
- No missed reference.

### 2. pi.md (1 edge)
- maps-j-01881 (L411, `./test.sh`): preserve, timing none. This is an upstream pi command, not a fgOS path.
  - The reason is true: docs/distillery/sources/test.sh never existed. targetFacts say never-existed. It states no relocation.
  - The disposition is correct.
- The scan candidate at L13 (`README.md`, upstream "targeted reads") is a valid L12-38(5) exclusion.
- `docs/*.md` citations throughout the file are upstream pi package docs, not legacy-root forms.
- L423 `plans/reports/...` is outside the retiring trees.
- No missed reference.

### 3. repository-harness.md (8 edges)
- All 8 edges are preserve, with no target, anchor or diff.
  - maps-j-01882 (L126 `docs/decisions/`)
  - maps-j-01883 (L177 `docs/contracts/harness-orchestration-v1.md`)
  - maps-j-01884 (L184, same path)
  - maps-j-01885 (L197, same path)
  - maps-j-01886 (L206, same path)
  - maps-j-01887 (L213 `docs/decisions/`)
  - maps-j-01888 (L234 `docs/decisions/0006-phase-4-benchmark-triage.md`)
  - maps-j-01889 (L421 `docs/decisions/0007-improvement-proposal-rules.md`)
- Each is a citation into the upstream hoangnb24/repository-harness repo.
  - The file's front matter declares its source: `url: https://github.com/hoangnb24/repository-harness`, `local: upstreams/repository-harness`, plus last_analyzed_commit and date.
  - The L126 text, "default install co lại đúng 10 file core ... `docs/decisions/` + templates", describes the upstream template. The same holds for L213's quoted retrieval trigger and the `docs/contracts/harness-orchestration-v1.md` "Where" entries.
- The reasons are an upstream-coordinates preserve and assert no fgOS path state. That is the correct role.
- My grep of the pinned file for `docs/decisions`, `docs/contracts`, `specs/` and `architect/` shows exactly these 8 occurrences, so none is missed.
- The scan candidate at L21 (`README.md`, the upstream "Where") is a valid exclusion.
- `docs/plans/completed/...`, `docs/stories`, `docs/templates` and `docs/compatibility` are upstream paths outside the retiring trees.

### 4. executor-dispatch-manual-log-gap-and-step-b5-fix.md (1 edge)
- maps-j-03852 (L11, `docs/specs/runner.md`): preserve, timing none. The reference sits inside the dated "Removed door (2026-10-14)" banner of a dated explanation file.
  - Ruling 1 requires preserving it with a non-executable successor note, and the record does so.
  - The reason quotes the banner. It states the correct fact (exists at pin; the tree retires at Phase 9; not a new read instruction).
  - It carries the narrative-holder note docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-..., naming decision 0062. I confirmed that file has the heading `### 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work ...` at L1716, and that docs/specs/runner.md cites 0062 in RUL90.
  - The record does not make "decision 0062" a patch edge, which follows ruling 7 (bare decision numbers are not edges).
- Scan candidates: 0. No other docs/specs, docs/architect or legacy-root form appears. `.agents/skills/_shared/...` and `plugins/fgOS/skills/...` are render surfaces, not retiring trees.
- No missed reference.

### 5. expr-eval-chain-passthrough-vs-split.md (0 edges)
- The only path-like token is `dogfood-fixture/scenarios/expr-eval-chain.md` (L14), which is not a legacy reference. Scan candidates: 0.
- No missed reference.

### 6. fanout-batch-background-execution-and-orphan-recovery.md (3 edges)
- maps-j-03853 (L11 `docs/specs/runner.md`): preserve. This is the same banner and successor note as file 4. It is correct under ruling 1; the successor heading was verified.
- maps-j-03854 (L17–18, link to `tsk-397-post-merge-review-remediation.md`) and maps-j-03855 (L19–20, link to `fanout-execute-consolidation.md`): preserve. Both are sibling links that resolve to docs/explanation files existing at the pin (verified with `git cat-file -e`).
  - docs/explanation is a retained tree, so a literal preserve is right.
  - The multi-line link spans (two source lines each) match the full Markdown link text.
- Scan candidates: 0. `wave-dispatch-mechanics.md` at L47 is a skill reference file, not a retiring-tree reference.
- No missed reference.

## OUTCOME defects
None.

## Record-text notes (not rework)
- None substantive. The reasons for 01881–01889 cite "L12-26(3,5), L12-31, L12-37" or "L12-10, L12-38" and are truthful.
  - Minor: 01883–01886 say "explicitly named external repository analysis", with no per-entry dated marker. They openly disclaim a dated marker, which is accurate.
  - The `okf.md` and `repository-harness.md` exclusion reasons are honestly limited to L12-38(5) scope.

## Lead-judgment questions
- None. Everything follows L12-38 rulings 1, 5 and 7, plus the L12-10 upstream-source rule.

## Counts
- By set and stratum, all full-set-expansion:
  - batch-061: 3 files reviewed (okf, pi, repository-harness), 9 edges, 0 rework.
  - batch-065: 3 files reviewed (the explanation files), 4 edges, 0 rework.
- Part total: 6 files and 13 edges reviewed (okf 0, pi 1, repository-harness 8, executor-dispatch 1, expr-eval 0, fanout-batch 3), 0 rework. This matches the request table.

Status: DONE

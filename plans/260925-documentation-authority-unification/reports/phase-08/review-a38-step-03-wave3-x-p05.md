# Review a38 step-03 wave3 expansion Part 05

Pin: `ae141550c2e022310de7a0efea757580c0b2479f` (worktree detached 5a4ca0621). Records: `step-03-records/batch-061.jsonl`.

Method: each record loaded with python3 (edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, category, targetFacts, diff, coverage scan). Each source read from `git show <pin>:<path>`. For beehive.md (1394 lines, 188 KB), I extracted every edge's source line and surrounding context (all 68), then ran an independent regex sweep for `docs/{specs,architect,decisions,history,backlog,...}`, `specs/|architect/<x>.md`, `reading-map.md`, `system-overview.md` and Markdown links, and compared against edge coverage. Target facts were checked with git (`cat-file`, `log`, rename detection on 4722361ae). No checker or probe was run.

## Per-file verdicts

| File | Set / stratum | Edges | Verdict |
|---|---|---:|---|
| docs/distillery/reports/distill-herdr-inventory-2026-07-15.md | batch-061 / full-set-expansion | 3 | ok |
| docs/distillery/reports/scout-herdr-0.8.2-control-surface-2026-09-06.md | batch-061 / full-set-expansion | 0 | ok |
| docs/distillery/sources/beads-rust.md | batch-061 / full-set-expansion | 1 | ok |
| docs/distillery/sources/beads-viewer-rust.md | batch-061 / full-set-expansion | 0 | ok |
| docs/distillery/sources/beads.md | batch-061 / full-set-expansion | 0 | ok |
| docs/distillery/sources/beehive.md | batch-061 / full-set-expansion | 68 | ok |

### distill-herdr-inventory-2026-07-15.md (411 lines, read in full)
- maps-j-01798/01799 (L380) and 01800 (L383) are preserves of `../herdr`, `../herdr-worktrees/<task-slug>` and `../herdr-worktrees/<slug>`. These are upstream herdr maintainer checkout layout descriptions in a dated inventory. `docs/distillery/herdr` has zero git history at the pin, so the never-existed targetFact is true. Same-line edges share one disposition. Diff is empty, as it should be for all-preserve. Ok.
- The three excluded README.md candidates (L182, L313, L399) are the upstream herdr README, bare names, not link targets or legacy-root paths. The exclusion reason is true under L12-38(5).

### scout-herdr-0.8.2-control-surface-2026-09-06.md (199 lines, read in full)
- Zero edges and an empty scan. No Markdown links, no legacy-root paths, no `docs/specs`, `architect` or `plans/` references. The only `docs/...` mention is the upstream `docs/socket-api.mdx`. Ok.

### beads-rust.md (204 lines, full grep plus L1-20 and edge region)
- maps-j-01801 (L68) preserves `./repo`. The phrase "workshop ≠ ./repo" is a topology token inside a dated learning-source citation. `docs/distillery/sources/repo` has no git history, so the targetFact is true. The 4 README.md excluded candidates (L67, L99, L108, L174) are upstream repo READMEs listed in "Where:" lines. Ok.
- `plans/reports/...` names in L13 are not legacy roots in the L12-38(5) sense. They are outside the specs/architect scope. Ok.

### beads-viewer-rust.md (208 lines) and beads.md (140 lines)
- Zero edges. All README.md hits are upstream READMEs (bvr L119; beads L19, L37, L76), correctly excluded. The bare `sources/beads.md` (bvr L13) is a sibling retained distillery file, not a legacy path. Ok.

### beehive.md (68 edges, all preserve, empty diff)
- Header declares upstream beegog/bee sources, with "Provenance: beegog snapshot pass" and "bee living-doc pass" sections. Rows with "Where:/What:" cite the upstream bee/beegog repo's own `docs/specs/*`, `docs/history/*`, `docs/decisions/*` and `docs/backlog.md`. Preserving them as upstream source coordinates is correct, with no fgOS cutover target asserted. I checked every source line:
  - 01802-01803, 01808-01840, 01842-01844, 01846-01869 are all upstream bee coordinates. Ok.
  - 01863 (L1123) `./repo` is the forgent workshop topology token. Ok.
  - 01804-01806 (L38, brace expansion `group-{a,b,c}.md`) are three edges, each with its own exists targetFact. All three files exist at the pin. 01807 (L39) exists too. These are fgOS-side retained distillery paths and `docs/distillery` is not retiring. Preserve is correct, and the edges are split per expanded file as expected.
  - 01845 (L910) `docs/history/fgos-coding-shaping/CONTEXT.md` exists at the pin. It is a dated fgOS-side analysis observation. Preserve per L12-38(7) is right.
  - 01841 (L736) `docs/decisions/0000-index.md` is an fgOS-side dated comment ("this project's own hand-maintained ..."). The file was removed in 4722361ae (D, with `docs/decisions/index.md` added as a separate A in the same commit, not git-detected as a rename). Preserve is right for dated distillery commentary (L12-38(7), matching the accepted 01875/01841 class). No narrative-holder note is required because this is the index, not a decision id.
- Independent sweep found no missed legacy references. Uncovered hits are `docs/knowledge/...` upstream bee paths (not legacy roots) and bare `system-overview.md` (L1062). The latter is the record's single scan exclusion, valid under L12-38(5) (bare name, no legacy-root form).

## Outcome defects
None. No wrong disposition, target, anchor or diff, no false adjacent description, and no missed reference across the 72 edges.

## Record-text notes (not rework)
1. beehive 01841 (L736): the reason says "removed ... with no successor file". This is formally true by the git rename rule. A reader may want the note that the generated `docs/decisions/index.md` was added in the same commit as the replacement index. Optional.
2. Beehive reason texts are one boilerplate sentence ("L12-10 upstream source coordinates...") repeated for about 57 edges. Truthful for every edge, but the file's header or section is not quoted per edge. Not required for preserves of upstream coordinates.
3. The sourceSpans column offsets in beehive.md do not index Python str positions on lines with multibyte text (e.g. 01802). The `text` is correct and found on the stated line. This looks like a byte-based or UTF-16 column. Cosmetic.

## Lead-judgment questions
None.

## Counts
- batch-061 / full-set-expansion: 6 files reviewed, 0 rework (72 edges: 3 + 0 + 1 + 0 + 0 + 68).
- Other sets/strata: not assigned to this part (batch-037, 038, 041, 065 are 0 here). No overlap with other sets in this part.

Status: DONE

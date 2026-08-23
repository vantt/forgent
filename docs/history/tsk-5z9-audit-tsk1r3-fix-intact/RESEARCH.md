# RESEARCH.md — tsk-5z9 audit

## Round 1 (2026-08-18) — Is tsk-1r3's fix intact in current code?

**Asked:** tsk-5z9's own description flags commit `45aa107f`
("docs(tsk-2x9): retrospective synthesis") as a 2-parent merge commit that
absorbed `8f760c58` ("fix(tsk-1r3): explicit semanticRelatedness:0 in
decompose's refined priority pass") under a message that never mentions
tsk-1r3. Question 1: is tsk-1r3's actual code change genuinely present on
main today — not just "is `8f760c58` an ancestor of `HEAD`" but "does the
literal source still carry the fix, and does the behavior still hold" —
given that `src/intake/decompose.mjs` may since have been touched or
renamed by intervening refactors?

**Checked:**
- `git show 8f760c58 --stat` and full diff (repo, `.git` history) — the
  original fix touched `src/intake/decompose.mjs`, function
  `resolveDecompose`, adding `semanticRelatedness: 0` as an explicit
  named param to a `computeImpact({...})` call, plus a 6-line comment
  starting `// tsk-1r3: semanticRelatedness explicit (not omitted) for
  parameter parity...`.
- `find src -iname "*decompose*"` — no `decompose.mjs` file exists in the
  current tree; `find src -path "*intake*"` shows `src/intake/plan.mjs`
  in its place (a file rename, not a deletion — confirmed by identical
  function body content, see below).
- `grep -n "semanticRelatedness\|computeImpact\|resolveDecompose\|resolvePlan" src/intake/plan.mjs`
  — function `resolvePlan` (renamed from `resolveDecompose`) still calls
  `computeImpact({ blocks: ..., semanticRelatedness: 0, blastRadius:
  verdict.blastRadius })` at line 722, immediately preceded (lines
  716-721) by the exact original 6-line `tsk-1r3` comment, byte-identical
  to the diff in `8f760c58`.
- Re-verified with `Read` on `src/intake/plan.mjs:710-729` directly (not
  just grep) to rule out a grep false-positive from a comment-only
  survival with the actual call site reverted — the live `computeImpact`
  call itself carries the explicit `semanticRelatedness: 0` argument.

**Found:** The fix is fully intact. `decompose.mjs` was renamed to
`plan.mjs` at some point after `8f760c58` landed (part of the
decompose→planning stage-naming migration visible elsewhere in the repo),
but the rename preserved the diff's content exactly — comment and
explicit `semanticRelatedness: 0` param both present, unchanged, in
`resolvePlan` today. No intervening refactor silently reverted the fix's
effect.

**Still open:** none for this question — resolved with direct evidence
(`file:line` + full-context `Read`, not just an ancestor check).

## Round 2 (2026-08-18) — Did tsk-2x9's own doc write survive?

**Asked:** Question 2: did tsk-2x9's own retrospective-synthesis doc
write (the other half of merge commit `45aa107f`) survive and get
properly tagged via `fgos compound`, or did the merge-absorption shape
also cost tsk-2x9 its own capture?

**Checked:**
- `git show 45aa107f --stat --name-only` — the merge commit's own tree
  diff (relative to its first parent `c9fd87ad`) touched exactly two
  paths beyond docs/history plan artifacts:
  `docs/how-to/read-a-critical-impact-analysis-result-before-treating-it-as-a-blocker.md`
  (new file — tsk-2x9's actual retrospective doc write) and
  `src/intake/decompose.mjs` (the absorbed tsk-1r3 fix, see Round 1).
- `node bin/fgos.mjs show tsk-2x9 --json` — `data.outcome.docType:
  "how-to"`, `data.outcome.docPath:
  "docs/how-to/read-a-critical-impact-analysis-result-before-treating-it-as-a-blocker.md"`
  — tsk-2x9's own outcome record correctly points at the doc it wrote.
- `ls` + `git log --oneline -- docs/how-to/read-a-critical-impact-analysis-result-before-treating-it-as-a-blocker.md`
  — file exists on disk today; history shows it was created in `45aa107f`
  and later extended (not overwritten) by a second retrospective commit
  `6dbe20d8` ("docs(tsk-5lr): retrospective synthesis").
- `grep -n "read-a-critical-impact-analysis" docs/enduser-docs-index.json`
  — the doc is indexed with `docType: "how-to"`.
- `git diff 45aa107f 6dbe20d8 -- docs/how-to/....md` — the later commit's
  diff is purely additive: it adds a new "Alternative" section citing
  `tsk-5lr`'s own plan, and updates the frontmatter
  `source_capture_ids: [tsk-2x9]` → `[tsk-2x9, tsk-5lr]`. tsk-2x9's
  original body content (the first worked example, citing
  `docs/history/herdr-task-detail-modal-fields/plan.md`) is untouched and
  still present verbatim.

**Found:** tsk-2x9's doc write survived fully intact. The
`enduser-docs-index.json` entry's single-value `sourceCaptureId` field
currently reads `"tsk-5lr"` (the most recent contributor — that field is
not multi-valued) but the doc's own frontmatter
(`source_capture_ids: [tsk-2x9, tsk-5lr]`) and body content confirm
tsk-2x9's original contribution is present, credited, and untouched. This
is legitimate compound-learning doc convergence (a second item extending
an existing doc on the same topic), not data loss.

**Still open:** none — resolved with direct evidence (git diff between
the two contributing commits, plus the doc's own frontmatter and the
index entry).

## Verdict

Both of tsk-5z9's open verification questions are **clear**, with the
answer being "no data loss occurred" in both cases:

1. tsk-1r3's `semanticRelatedness:0` fix is genuinely intact in
   `src/intake/plan.mjs:716-722` (renamed from `decompose.mjs`).
2. tsk-2x9's retrospective doc write survived intact and is correctly
   attributed in the doc's own frontmatter, even though the merge
   commit's absorption of an unrelated commit was itself a real
   (already-fixed-at-the-root, per tsk-2oy) bug in the compounding flow.

This audit item's premise (the same stray-MERGE_HEAD-absorption shape
seen elsewhere) is confirmed as having occurred for this specific commit
pair, but — unlike the sibling case tsk-4v6 was filed for — the absorbed
content here was never lost: a plain `git merge` naturally preserves both
parents' full trees, so absorption without conflict/loss is exactly what
happened. `verify` here is a read-only confirmation, not a runnable
command beyond what was already run above.

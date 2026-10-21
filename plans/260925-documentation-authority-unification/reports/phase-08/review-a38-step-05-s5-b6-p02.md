# Review a38 step-05 seam 5 batch 6, part p02

Pin 5eb9dc609 (read through git objects). Payload s4-src-p02.json: 3 files, 181 items (14 + 94 + 73 minus overlaps counted below). Nothing in the worktree was written; no check, probe or CLI was run.

## Per-file verdicts

### test/runner/loop.test.mjs - ok (73 items: 5 admit/preserve, 68 reject/preserve; no diff)
- The 5 admits are comment pointers: 004411, 004412 (docs/architect/doing-coordination-redesign.md), 004413, 004414, 004415 (docs/history/...). Each is dated provenance. The docs/architect pair carries a tree-retires witness and names the non-canonical proposals carrier, which matches R8 and L12-80. The docs/history pointers match R16.
- The 68 rejects were checked against the source lines. All are test-owned temp-repo constructions or in-memory strings:
  - `docsRef = 'docs/history/<fixture>'` literals: 004404-004410.
  - `path.join(repoRoot, docsRef, 'plan.md')` and the `featureDir` joins.
  - `domains/coding/task-specs` fixtures.
  - `.fgos/assignments/...`, `events.jsonl`, `runsDir`.
  - plan/report text templates.
  - The planted-evidence literals (004416, 004417) and dynamics 027745-027751, which write into the temp repo (L3816-3832) to test tamper rejection, not to read a repo document.
- No rejected tuple reads a real document path. No same-passage disagreement found. No parks. No diff.

### test/runner/merge.test.mjs - ok (94 items: 5 admit/patch, 7 admit/preserve, 82 reject/preserve)
- The five patches (004458 at L443, 004457 at L579, 004421 at L1263, 004460 at L1265, 004449 at L1497) are correct.
  - The diff is on a test file, with one hunk per admitted passage and no stray hunks. I read the full diff and rollback diff from the record.
  - The rollback diff is an exact inverse, and the diff touches no non-admitted passage.
  - The old paths are absent at the pin and the three new docs/knowledge targets exist there, so there is a unique live holder for each pointer.
  - The L1263/L1265 assertions compare a message that src/runner/merge.mjs L996 emits from a fixed document literal (R6/R16). The same literal is also in `.githooks/pre-commit` L491/L523. coCutPaths lists merge.mjs, pre-commit, CHANGELOG and the test, so the co-cut set matches.
  - test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs L396 matches only the basename regex, which is unchanged by the path move.
- Admit/preserve pointers (004443, 004447, 004448, 004450, 004451, 004452, 004456) are dated comment provenance. 004452 correctly carries successorNote docs/decisions/index.md for the retired 0000-index citation. docs/backlog.md exists at the pin.
- Rejects (82): temp-repo `docs/decisions` fixtures, `git add docs/decisions` argument strings, `shared.txt`, `.fgos/config.json`, row/label joins, and the title strings 004419/004420 (baseline-key co-cut, successorNote present). None reads a real document path, so each reject is right under R5/R21.
- Parks: none. The patch replay is deferred to Phase 9 (R25), and the command, asserted lines and co-cut set are present.

### test/cli/helpers/fgos-cli-harness.mjs - ok, with one Lead question (14 items: 9 admit/preserve, 5 reject/preserve; no diff)
- The 9 admits are dated comment pointers (docs/history x7, docs/architect x2). The docs/architect pair has a tree-retires witness. All are fine.
- The rejects are `.fgos` rmSync, `git commit` message templates, and one path join, `docsIndexManifestPath` (dynamic-017973); see Q1.

## OUTCOME defects
None.

## Record-text notes
1. The resolverWitness scope for the docs/history comment pointers in loop and merge reads "test-owned synthetic input/output; no lookup of proposed alias authorizes writing". These are real dated provenance comments, not synthetic inputs. The harness records use the correct wording ("actual pinned comment-provenance"). The scope strings in loop and merge should be corrected.
2. loop.test.mjs has two author-added slots for the split L786-787 tsk-40m pointer. Both are admit/preserve, so the outcome is consistent. These slots are not in the payload, so I read them from the record:
   - Slot `author-s5-b5-loop-786-67` covers only the partial span `docs/`. It carries `treeRetires:false` and a "synthetic test input" witness, which is misleading for a pointer into a retiring tree.
   - Slot `author-s5-b6-loop-split-786` is correct: tree-retires true and the carrier named.
   - Consider dropping the partial-span slot or aligning its witness.
3. The "non-document-fs-probe" label is used for in-memory `path.join('docs','history','planted-evidence',...)` literals (004416, 004417 and dynamics 027750, 027751). "config-or-metadata" would be more accurate. The outcome is unaffected.
4. merge.test.mjs 028126 and similar `.join('\n')` lines are labelled scalar-pass-through where text-label-join fits better. This is cosmetic.

## Lead-judgment questions
Q1. Fixed-suffix doc joins under temp roots. Two cases assert or construct a fixed product doc path under a temp root and are rejected as fixtures.
- harness `docsIndexManifestPath` (dynamic-017973, `path.join(root,'docs','enduser-docs-index.json')`). Its callers in test/cli/fgos-post-merge.test.mjs L187-216 call existsSync/read on it, asserting where the docs-index verb writes its manifest.
- merge.test.mjs L620-622, L667-670 and L745 assert that the product renamed a decision file to `docs/decisions/NNNN-slug.md`, a destination merge.mjs L565 hardcodes.

The author's own assessment says "emitted product-path comparisons are admitted", and L12-80 P03 draws the same line. The existsSync/read on a fixed document suffix is also an R16 probe. Under that reading these sites would be admit/preserve (or follow the owning source's disposition). The outcome is preserve either way (R10), so I did not call it a defect. The open point is the cutover coupling:
- The merge fixtures are already carried by the seam 8 obligation on merge.mjs L536/L638/L640.
- The docs-index manifest helper has no recorded coupling to the enduser-index generator park (dynamic-009788). Lead should decide whether the helper needs an explicit dependency on that park or stays a pure R21 reject.

Q2. The loop and merge preserves of docs/architect pointers rely on the non-canonical proposals carrier. This is consistent with L12-80, so no action is proposed.

## Counts
- Files: 3, all ok.
- Items reviewed: 181. Admitted: 26 (5 patch, 21 preserve). Rejected: 155. Parks: 0.
- OUTCOME defects: 0. Record-text notes: 4. Lead questions: 2.

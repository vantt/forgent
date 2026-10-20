# Review a38 Step 5 pilot bounded re-review, part rr-p02

Pin: aa8d343746a292d2cb476ab76e6489411fd59a62 (read via `git show`, never the worktree files). Read-only. No checker, probe, test or cargo run.

Payload: `step-05-pilot-rr-p02.json`, 33 records: 28 references, 5 dynamic tuples. Changed ids in this part: 10 (003655, 003666, 003749, 003784, 003868, 013969, 013982, 013988, 013989, 013990). The other 23 records are unchanged admitted literals, read as final-state context.

## Slices seen

| File | Slice in this part | Not seen (other parts) |
|---|---|---|
| `src/cli/command-registry.mjs` | 23 of 26 references (003643-003666, minus 003641, 003642, 003657) | 003641, 003642, 003657, the 14 dynamic tuples |
| `src/runner/merge.mjs` | all (003749, 003771; no dynamic tuples) | none |
| `src/runner/worktree.mjs` | all (003784) | none |
| `src/state/events-jsonl-truncation-guard.mjs` | all (003868) | none |
| `src/setup/instruction-registry.mjs` | reference 003798 and dynamic 013969, 013982, 013988, 013989, 013990 | the other 12 changed instruction-registry tuples (013991 onward) |

Verdicts below for `command-registry.mjs` and `instruction-registry.mjs` cover only my slices. Lead must merge them with the other parts.

## Method

- All five sources match the recorded `sourceSha256`.
- All 28 reference spans match the pinned line and column text exactly.
- All five Phase 9 consumer diffs and all three test co-cut diffs were applied with `patch` to scratch copies of the pinned bytes.
  - Each diff applies, gives the recorded `expectedAfterSha256`, and the rollback diff restores the pinned bytes exactly.
  - Each diff is one hunk and touches only the admitted passage.
  - No generated output is edited.
  - Every patch target exists at the pin and is the registered `currentPath` of the alias in `docs/doc-registry.json`. All four are lifecycle `provisional`, as in Step 3.
  - No alias is used as a writer destination.
- I grepped `test/` at the pin for the old pointers, including basename-only spellings, and grepped the non-doc source tree for each pointer and for each admitted literal.

## Verdicts

| File | Seam | Verdict |
|---|---|---|
| `src/cli/command-registry.mjs` | cli-help-messages | **rework** (1 outcome defect covering two edge ids; slice only) |
| `src/runner/merge.mjs` | cli-help-messages | ok |
| `src/runner/worktree.mjs` | cli-help-messages | ok |
| `src/state/events-jsonl-truncation-guard.mjs` | cli-help-messages | ok |
| `src/setup/instruction-registry.mjs` | setup-doctor-roots | ok (my 6 records; the file's other changed tuples are in another part) |

## Outcome defects

### D1: command-registry reference-003649 (class6-l-000225) and its duplicate edge 003664, line 2075 col 383-409 `docs/specs/distribution.md`

- **Current record.** ADMIT, preserve, timing none. The resolver witness is the generic "retained/external project or comment". `exists: true` is the only evidence given.
- **Why that is wrong.**
  - The passage is the `doctor` verb's runtime-emitted help description: "... a deliberate reversal of RUL9/RUL11 (docs/specs/distribution.md); without --fix ...".
  - `docs/specs/**` is a retiring tree (L12-34(2), Phase 9 step 6). A user-visible help string citing it will dangle after cutover.
  - The path is not outside `docs/specs/**`, so the L12-26(3) "retained in place" rule does not protect it.
  - A live holder exists: `docs/platform/packaging-distribution/spec.md` carries RUL9 (line 644) and RUL11 (line 659) in its business rules.
- **Binding precedent for the same citation.**
  - Step 4's `bin/fgos.mjs` cli-006 (`step04-010.jsonl`, line 4215 `docs/specs/distribution.md`, RUL9 comment) is `patch` to `docs/platform/packaging-distribution/spec.md`, anchor `business-rules`.
  - L12-60(3) names "RUL9/RUL11 doctor contract" as a copied-reason class that must be re-judged.
  - The Step 4 passage search witness for cli-006 is the reasoning "RUL9 states diagnostic default never writes, --fix is the deliberate reversal".
  - Rules: "a live holder with the same passage means a patch, not a park", and "runtime-emitted strings are user-visible output".
- **Correction.**
  - Set 003649 and 003664 to ADMIT patch, Phase 9, target `docs/platform/packaging-distribution/spec.md`, anchor `business-rules` (the cli-006 anchor), replacing only `docs/specs/distribution.md` at 2075:383-409.
  - Add a second hunk to the file diff for line 2075, with a recomputed `expectedAfterSha256` and rollback.
  - The `docs/history/doctor-fix-gate-bypass/CONTEXT.md` citation at col 262 (003647) stays preserve. The path exists and `docs/history` is retained.
  - A pinned `git grep` of `test/` for `specs/distribution.md` and `deliberate reversal` finds no assertion of this string, so no test co-cut is needed.
  - If the Lead prefers not to patch, the fallback is park with a blocker naming the live holder. Preserve with a "retained" witness is not supportable.

No other outcome defect found in this part.

## Changed outcomes, checked

- **command-registry 003655 (patch, co-cut set expanded): ok.**
  - Span is line 1746 col 34-70. It is the sole owner of the 1746 patch.
  - The diff is one hunk and the target is registered.
  - The co-cut tests `test/report/enduser-index.test.mjs` (lines 162, 167, 171, 385) and `test/report/helpers/docs-index-state-fixture.mjs` (lines 14, 35) are all preserve, with no diff.
  - That is defensible. They assert the real `docs/how-to` file and the docs-index quadrant output, not the CLI example string, and the generators seam owns them.
  - No test asserts the doc-sources example.
- **command-registry 003666 (preserve to parked): ok.**
  - It is `docs/specs/` at 846:91-102, a prefix of 003643's `docs/specs/<area>.md` at 846:91-111 in the same passage.
  - It is parked with `samePassageOwner: reference-003643` and the same blocker text.
  - The decision-index scope help must co-cut with the generator, so a park is right.
  - It carries no patch of its own. The attached file-level diff is only the 1746 hunk.
- **merge.mjs 003749 (patch, co-cut set expanded): ok.**
  - Line 996 col 128-178 is the `formatFgosWriteRejectedDetail` template.
  - Pointer delta only: `docs/how-to/fix-fgos-write-rejected-merge-block.md` becomes the `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/...` path.
  - `test/runner/merge.test.mjs` edits at 1263 (the exact-string assertion) and 1265 (the `includes` assertion) are patched. Line 1497 (a comment citing the how-to step) is preserved.
  - The patched test text equals the new production text byte for byte.
  - The co-cut diff is the same for 000110, 000111 and 003749 (same hash), as the Step 7 de-duplication note says.
  - `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:396` matches only the basename `fix-fgos-write-rejected-merge-block\.md`, which the target keeps. It is correctly left alone.
- **worktree.mjs 003784 (patch, co-cut set expanded): ok.**
  - Line 1088 col 484-559 is the `WorktreeError` message.
  - `test/runner/worktree.test.mjs:768` is a regex with escaped slashes. The patched regex is escaped correctly and matches the new production string.
- **events-jsonl-truncation-guard.mjs 003868 (patch, co-cut set expanded): ok.**
  - Line 140 col 260-309 is the doctor finding message.
  - `test/setup/checks.test.mjs:342` is a test title and is patched.
  - Line 381, `/resolve-an-events-jsonl-truncation/`, is basename-only and still holds.
  - `src/setup/registrations.mjs` also cites this pointer. It is in another part, and I note that it must co-cut in the same package.
- **instruction-registry 013969 (reject to admit/preserve): ok.**
  - Line 361 is the `UNKNOWN_DECISION` message citing `docs/decisions/index.md`.
  - `readDecisionIds` (line 99) really reads `docs/decisions/index.md` and compares it with the generated projection. The path is the retained generated index (L12-26(3)).
  - It is the same passage as reference-003798, which owns the single preserve outcome. No second diff.
- **instruction-registry 013982, 013988, 013989, 013990 (admit to reject/preserve): all ok.**
  - 013982 (line 453), 013989 (590) and 013990 (591) are JSDoc option descriptions. They construct no path.
  - 013988 (571) is `u.scope === scope` in `findByScope`. It has no path operand.
  - The real defaults (`docs/architecture-manifest.json` at 457, `core/instructions`, `components`, `domains` at 598 onward) are separate tuples.

## Unchanged literals in context (all ok except D1)

- **command-registry.**
  - 003644/003645 `docs/history/<feature>/`, 003647, 003648, 003650 and 003656 point to `docs/history/**`. They are retained, and the cited history files exist at the pin.
  - 003646 and 003651 point to the generated `docs/decisions/index.md`.
  - 003654, 003660 and 003663 point to `docs/doc-registry.json/.md`, a generator output.
  - 003665 `docs/**+src/**+plugins/**` is bare scan text, preserved per L12-69(10).
  - 003652, 003653 and 003659 (`docs/how-to`, `docs/how-to/example.md`) are quadrant-layout examples, parked pending the generator co-cut. They are consistent with 003643 and 003666.
- **merge.mjs 003771.** `docs/decisions/NNNN-slug.md` in the `renumberDecisionFile` error. The function still operates on that directory through `DECISION_FILE_RE`, so the message is accurate. Preserve is ok.

## Record-text notes (no outcome change)

1. **003658, 003661, 003662 (`docs/history/tsk-19j/...`).** The paths do not exist at the pin. They are synthetic example item ids in `gate-check` examples. Preserve is right, but the witness says only "retained/external project or comment". Say "synthetic example item id; path nonexistent by design". For 003662, 003663, 003664, 003665 and 003666 the witness `currentPath` is null with `exists:false`, which is uninformative.
2. **003666, 003643, 003652, 003653 and 003659.** These are parked, yet carry the preserve-style witness text "retained/external project or comment; no replacement claimed". Park records should carry a park witness instead.
3. **013969 `caller`.** It is `toArrayOfStrings` at line 325, which ends at line 331. Line 361 is in the enclosing parse function.
4. **013982 `caller`.** It is `scanMarkdownFiles` at line 404. The JSDoc at 451-455 belongs to `discoverKnownOwners` at line 457.
5. **013982, 013989 and 013990.** The rejection text is boilerplate ("Scalar metadata/guard/accumulator or text serialization") and the role is `non-document-operation`. The real non-document use is a JSDoc comment (tuple tag `comment`), which should be named.
6. **Co-cut test sweep for 003655.**
   - `test/report/enduser-index.test.mjs:386` is `fs.readFileSync(path.join(REPO_ROOT, 'docs', 'how-to', 'check-rollup-progress.md'))`. It is the actual real-file read behind the line-385 title, and the needle sweep (full-string spellings) does not list it.
   - The preserve decision for 385 is fine, but the receipt should name 386 so Step 7 does not miss it if `docs/how-to` is ever retired.
7. **Cutover specification fields.** The specs carry `diff`, `rollbackDiff`, `expectedAfterSha256`, `targetOwner`, `claimAnchorProof` and `coCutTestEdits`. The authoring-request field list also names `symbolOrPassage`, `oldText`, `newText`, `intentionalBehaviorDeltas` and `expectedOutputSets`. The exact deltas are recoverable from the diff, but those fields are absent.

## Lead-judgment questions

1. D1 changes the preserve outcome for a user-visible doctor help string and adds a hunk. Apply the patch, as Step 4 did for the same RUL9/RUL11 citation in `bin/fgos.mjs`, or take the park fallback?
2. `merge.mjs` lines 536, 638 and 640 read `docs/decisions/` through `git ls-tree`, and 409/562 match `docs/decisions/NNNN-slug.md`. None is a census row in this seam. Are they owned by a decisions/generator seam, or by none?

## Counts

| Item | Count |
|---|---:|
| Records reviewed | 33 (28 references, 5 dynamic) |
| Changed ids | 10 |
| Source spans verified | 28/28 exact |
| Phase 9 diffs applied | 5/5 apply, hash and rollback verified |
| Test co-cut diffs applied | 3/3 apply, hash and rollback verified |
| Outcome defects | 1 (2 edge ids: 003649, 003664) |
| Record-text notes | 7 |
| Lead questions | 2 |
| Gateway parity or proof | not in this part |

Status: DONE_WITH_CONCERNS
Summary: 33 records reviewed. All source spans match, and all 5 consumer diffs and 3 test diffs apply with correct hashes and rollbacks. `merge.mjs`, `worktree.mjs`, the truncation guard and the `instruction-registry.mjs` slice are ok. `command-registry.mjs` needs rework: 003649/003664 preserve a runtime-emitted `docs/specs/distribution.md` citation that Step 4 patches to the packaging-distribution spec.

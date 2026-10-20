# Review a38 Step 5 pilot, parts 03 and 04 (cli-help-messages seam)

Pin: aa8d343746a292d2cb476ab76e6489411fd59a62. Seam: cli-help-messages. Read-only review.

Slices seen:
- p03: `.githooks/pre-commit` reference-000114, all 52 dynamic traces, priorRecordRefs. `bin/fgos.mjs` source context lines 1-4000.
- p04: `bin/fgos.mjs` source context 4001-5236, metadata, 2 references, 4 dynamic traces. `src/cli/command-registry.mjs` metadata and 24 of its 26 references (000110-000113 and the 14 dynamic traces are in other parts, not reviewed here).

Scope notes:
- I also applied the recorded Phase 9 diffs to the pinned bytes.
- `bin/fgos.mjs`, `command-registry.mjs` and `.githooks/pre-commit` each match their pinned source sha256.
- I checked every reference span against the pinned line and column.

## Verdicts

| File | Seam | Verdict |
|---|---|---|
| `.githooks/pre-commit` (remaining slice) | cli-help-messages | rework (1 outcome defect on a dynamic tuple) |
| `bin/fgos.mjs` | cli-help-messages | ok (Lead question on shared-file diff) |
| `src/cli/command-registry.mjs` (p04 slice) | cli-help-messages | rework (1 outcome defect) |

## Outcome defects

### D1: command-registry reference-003641 (class6-l-000219) is mapped to the wrong passage

- The record's `originalSourceSpans` for 003641 is census line 1752, cols 95-106, text `docs/how-to`. At the census pin that is the `quadrant` parameter description: "The docs/<quadrant> directory to scan (e.g. docs/how-to)."
- `matchedExpression` is also `docs/how-to`, which agrees with the original span.
- The current `sourceSpans` was remapped to line 1746, cols 34-70, text `docs/how-to/check-rollup-progress.md`. That is the `doc-sources` example, the same span as reference-003655 (class6-l-000218, original 1738).
- 003641 carries disposition `patch` and the doc-sources diff hunk. As a result the real passage at pinned line 1760, col 95, is covered by no record. It is neither patched nor parked.
- Checking the diff hunk against the pinned file confirms it: the diff changes only line 1746, and line 1760 is untouched.
- Rule: every reference must carry its own passage, and a live holder with the same passage means a patch. The same quadrant help in references 003652 and 003653 (lines 1767-1768) is parked, and 003643 is parked for the same reason.
- Correction: remap 003641 to line 1760, cols 95-106, and park it with the same blocker as 003652 and 003653 (generic quadrant help needs a runtime/generator co-cut). Remove its patch target and diff hunk. Reference-003655 stays the sole owner of the 1746 patch.
- Process note: this slipped past the checker because the checker compares a span's text with the source but does not compare `matchedExpression` with `originalSourceSpans`.

### D2: pre-commit dynamic-000566 is rejected with a false reason

- The tuple is [463,12], current line 491: the `refuse(...)` template that carries `See docs/how-to/fix-fgos-write-rejected-merge-block.md`.
- It is REJECT, role `scalar/thread`, with a reason of "thread wait or array/string serialization". That is false. It is the emitted refusal message that reference-000110 patches.
- Its sibling dynamic-000571 (current line 523, the same kind of template) is correctly ADMIT, role `emitted-message`, preserve, proof `missing`, with the canonical literal reference owning the pointer edit.
- Rule: a rejection must name the real non-document use.
- Correction: ADMIT dynamic-000566 like dynamic-000571. Role `emitted-message`, `targetSetOrConstruction` "HOW_TO_DOC or literal recovery pointer", proof `missing`, and a parityObligation pointing at reference-000110. The receipt delta for line 491 already exists.

## Record-text notes (no outcome change)

- Dynamic-000565 (the deletion refusal at line 485) is also marked `scalar/thread`. It names ADR0020 but contains no document path, so the rejection stands. The role label is wrong.
- In command-registry, 003643 (`docs/specs/<area>.md`, parked) and 003666 (`docs/specs/`, preserve) are overlapping spans on the same line 846. Please state that 003666 is subsumed by the park, or merge the two. Phase 9 must not patch 003666 on its own.
- Several references are duplicates with the same span under two edge ids, and each pair has one disposition: 003649/003664, 003658/003662, 003660/003663, and 003655/003641 (see D1). This is harmless, but the reviewer or applier should treat them as one occurrence.
- Dynamic-000536 and reference-000114 are ADMIT preserve, proof `missing`. `docs/how-to-parallel-lanes.md` does not exist in the pinned tree. It is the workshop root, one level up from `repo/`, so preserving it as an external-project convention is correct. The only other pinned hit is a dated evidence file under `docs/history/`.
- The 50 remaining rejected pre-commit tuples are lock, git, config, allowlist and diagnostic templates with no docs pointer. The only docs strings in the file are lines 14, 36, 355, 491 and 523. The `plans/(reports|journals)` regex at line 435 is outside the docs census.

## Verified ok

- **`bin/fgos.mjs` reference-000228 (class6-l-000113, line 5108).**
  - The span is correct and the patch is the only runtime-emitted string delta.
  - The diff applies and yields the recorded after-sha 4247d968, and the rollback restores 64ace4da.
  - Exact string delta: the legacy `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` becomes `docs/platform/runner/decisions/h-36d872fbb0e5.md#0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập`.
  - The legacy file is already absent at the pin, so the current message points at a dead path.
  - The target holds the `### 0020 — Chặn ...` heading, and its sha 69944091 matches the witness.
  - The anchor matches the repo's own slug function (`githubSlugText`, which collapses whitespace) and the earlier Step 3 edge maps-j-04927.
  - No generated output is edited and no alias is used as a writer.
- **`bin/fgos.mjs` reference-000277 (`--quadrant <docs/quadrant-dir>`, line 3064).** It is parked, which is correct. The same construction is read at `docs/<quadrant>/` (line 2974) and in `authoritative-match`, where the quadrant directory is joined and read at runtime. It needs the generator/default co-cut.
- **`bin/fgos.mjs` dynamic traces 001601, 001602, 001606, 001607.** These are scalar help-refusal templates with no document operand. The rejections are correct and the current lines are right (+49).
- **`bin/fgos.mjs` source-context windows.** I read the 1-5236 line index, grepped every `docs/` and `.md` operand, and found no missed literal in this seam's scope. The other 53 `bin/fgos.mjs` references (doc-registry writers at lines 1758-1762, iron-law and `docsRef` paths, and so on) belong to the later runtime-defaults-dynamic seam. Step 4's `stepFiveExcluded` list names exactly those.
- **command-registry patch (reference-003655).** The hunk changes only line 1746, `docs/how-to/check-rollup-progress.md` becoming `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md`. It applies to the whole pinned file with after-sha 65aa9b2d.
- **command-registry parks.** The parked references are 003643, 003652, 003653 and 003659, and reference-003659 is the `docs/how-to/example.md` compound example. These match the metadata and the receipt `blockedBy`.
- **command-registry preserves.**
  - The `docs/history/<feature>/` (and `docs/history/.../CONTEXT.md`) help text, the `gate-check` examples and the `docs/decisions/index.md` generator path are preserved as retained or generated paths.
  - The `docs/doc-registry.*` help is preserved as the generator's real output path.
  - Reference-003657 (line 7) is correctly rejected as a code comment.
- **Pre-commit patches.** The diff changes only lines 491 and 523 (the two how-to pointers) and yields after-sha cf683921. The receipt names the old and new pointers, with exit code, category and surrounding text unchanged and a `registryPath`/`alias` witness.
- **Receipt `cli-help-messages-pilot`.**
  - It lists all 9 files with sha and mode, and its candidate hashes match the record's expected-after hashes.
  - It names the intentional deltas, has no unexpected deltas, and the exact-string proof is correctly `missing`.
  - The two registry/help test commands are marked `not-run`, so they are not claimed as proof.
  - The `CHANGELOG.md` Unreleased co-edit is listed as a prerequisite.

## Lead-judgment questions

1. Both `bin/fgos.mjs` and `command-registry.mjs` will receive later hunks from the runtime-defaults-dynamic and generator seams. The pilot's expected-after hashes cover only this seam's hunks, so the Step 7 overlap/rebind must recompute them. Confirm that is intended.
2. The ADR0020 candidate target (`docs/platform/runner/decisions/h-36d872fbb0e5.md`) says "Canonical: No / Candidate". The Phase 9 patch must land only once the candidate is promoted. Is that ordering recorded as a prerequisite?
3. 003665 preserves the help text "docs/**+src/**+plugins/** citation sweep" (line 845), which names a scan scope. Confirm it stays preserved under the retained-roots rule.

## Counts

- pre-commit (p03): 1 reference (ADMIT preserve) and 52 dynamic tuples (3 ADMIT: 000536, 000571, and wrongly rejected 000566 should become the third; 49 REJECT correct). All reviewed.
- `bin/fgos.mjs` (p04): 2 references (1 patch, 1 parked), 4 dynamic REJECT, 21 source-context windows (16 in p03, 5 in p04).
- command-registry (p04 slice): 24 references (2 patch with D1, 4 parked, 17 preserve and 1 REJECT comment). The outcome defect D1 sits on one of the patch rows.
- Outcome defects: 2 (D1, D2).

Status: DONE_WITH_CONCERNS

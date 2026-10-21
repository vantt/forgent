# Review a38 step 05 seam 5 batch 6, part p07 (pin 5eb9dc609)

Scope: 5 test files, 70 items (admitted 7, judgment rejects 63). Windows were truncated in the payload, so I read the pinned files through git.

## Per file

### test/runner/spawn-worker.test.mjs - ok (1 item)
- reference-004568 REJECT/preserve. `docs/specs/widget.md` is an in-memory `refs` fixture string (L38) passed to spawnWorker. Nothing reads it or asserts on it (only L38 mentions it). The nonDocumentUse is true.

### test/runner/work-unit-for.test.mjs - ok (17 items)
- References 004569-004574 and dynamics 030061/62/68-71/77-81 all REJECT/preserve.
- Every `docs/history/...` literal is a synthetic `docsRef` handed to workUnitFor, or an expected-inputs assertion over that fixture string. Real files are written only under mkdtemp roots.
- The dynamic tuples are `path.join(stateRoot, docsRef, ...)`, tmpRoot/mkdtemp, and template labels. Each nonDocumentUse is true.
- Same-passage items agree. docs/history is retained, so there is no cutover action.

### test/runner/worktree-callsite-wrapper.test.mjs - ok (4 items)
- reference-004575 is a docs/history comment pointer, ADMIT/preserve under R16.
- Dynamics 030134, 030135 and 030159 REJECT. They are repoRoot, branch and worktree path scalars in disjoint operations.

### test/runner/worktree.test.mjs - ok (2 items, 1 patch)
- reference-004576 is a docs/history comment pointer, ADMIT/preserve under R16.
- reference-004577 ADMIT/patch is right.
  - The assertion at L768 is a byte match of the message printed by `src/runner/worktree.mjs` L1088. Both print `docs/how-to/tell-a-stale-...md`.
  - At the pin the old path no longer exists. The file lives at `docs/knowledge/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt/tell-a-stale-...md`, which doc-registry `currentPath` confirms.
  - The target is live and the regex-escaped replacement is correct.
  - The diff touches only L768 in a source test file. The inverse is exact, and the output delta is the message string.
  - coCutPaths `[CHANGELOG.md, src/runner/worktree.mjs, test]` equals the co-cut set on the `cli-help-messages.jsonl` record for the source (CHANGELOG, test).
  - No other test asserts this path (grep at the pin).

### test/scripts/check-doc-candidate-status.test.mjs - ok with one Lead question (46 items)
- Admitted: reference-004586, reference-004589, dynamic-031770, dynamic-031771. All are the L41 `copyFileSync` of real `docs/doc-governance.md` into the fixture root. Admit is right; the source side is a real read. All four share one outcome (preserve).
- Rejects (42) are all true:
  - docs/platform and docs/README literals inside the in-memory switchboard and fixtureRoot maps;
  - tmp-root joins, `.gitignore`, and `args.join`/`a.join` plumbing;
  - `path.join(REPO_ROOT, DEFAULT_SWITCHBOARD_PATH)` (dynamic-031759). This is plans-report-artifact under R11: the constant resolves to `plans/260925-.../transitional-switchboard.json`.

## OUTCOME defects
None.

## Record-text notes
1. reference-004586/004589 and dynamic-031770/031771 say "retained real docs/doc-governance.md".
   - `step-05-cutover-move-set.json` lists `docs/doc-governance.md` as an old path moving to `docs/platform/governance.md` (draft alias rows root-authorities-draft-0011 to 0014, and others).
   - The word "retained" is therefore unsupported. Suggested wording: "frozen-gate fixture copy; Phase 9 owns the gate and its test together".
2. dynamic-031771 is the destination `path.join(root, ...)`, but its pathOperand names the REPO_ROOT source expression. This is a label only.
3. spawn-worker and work-unit-for use nonDocumentUse `config-or-metadata` and `non-document-fs-probe` for fixture strings and tmp joins. This is accurate enough; a "fixture" category would fit better.

## Lead-judgment question
Q1. Preserve for the doc-governance.md fixture copy (check-doc-candidate-status.test.mjs L41; same pattern in check-doc-constitution.test.mjs, reference-004651/004659, outside this part).
- The pinned move set lists docs/doc-governance.md as moving at Phase 9. If it moves, `copyFileSync` fails after the cut, and the test would need a patch or park.
- The gate scripts that read the same file are preserved under R13 as frozen-gate identity: reference-002481-2485 in scripts/check-doc-*.mjs. That records the Phase 9 gate and its test as changing together.
- I accept preserve as consistent with the gate-script precedent, so I raise no outcome defect.
- The "retained" witness should be fixed (note 1), or Lead should confirm the move set is draft-only for this path.

## Receipts and replay
R22 replay is required only for the worktree.test.mjs patch. The payload carries no replay receipt, so I did not verify that. Accept it if the replay is deferred to Phase 9 under R25.

## Counts
- Files: 5; verdict ok on all 5.
- Items reviewed: 70 (7 admitted, 63 rejected). Dispositions: 1 patch, 69 preserve, 0 park.
- Outcome defects: 0. Record-text notes: 3. Lead questions: 1.

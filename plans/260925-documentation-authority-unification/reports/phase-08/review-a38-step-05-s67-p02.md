# Review a38 step-05 seam 5/7 part p02 (ratchet baseline + ratchet test)

## scripts/check-legacy-docs-ratchet.baseline.json
- Verdict: ok. Items reviewed: 996 (177 groups, 225 sampled ids spot-checked against the pinned file).
- All ADMIT / preserve / frozen-baseline-data, no diff, no patch. Count equals 994 `files` keys + 2 `roots` entries (L14 docs/architect, L15 docs/specs); all 996 ids unique. The file holds only docs/architect (981) and docs/specs (13) paths, no symlinks, so there is no other document operand to miss.
- Preserve with treeRetires=true is right: frozen checker-read data, no rebaseline or new exception kind (R13), retirement is the Phase 9 obligation. No "retained" witness is used for a retiring target. No hand edit.
- OUTCOME defects: none.

## test/scripts/check-legacy-docs-ratchet.test.mjs
- Verdict: ok. Items reviewed: 399 (8 groups): 2 ADMIT, 397 REJECT.
- ADMIT dynamic-032302 and dynamic-032303 (L737, `path.resolve(REPO_ROOT, DEFAULT_BASELINE_PATH)` followed by a real existsSync and readFileSync, then a spawn of the checker on the live REPO_ROOT at L745). Both are the real document read and share one outcome (preserve). pathOperand is true. The record text says the live self-check at L736-750 is covered, so the L745 spawn tuple is handled.
- REJECT groups checked:
  - REPO_ROOT declaration (L27) and SCRIPT_PATH (L24): non-document, true. The only use of REPO_ROOT in a read is in the admitted L736-750 test.
  - The 81 fs-probe, 302 config-or-metadata and 7 comment-or-type items: every other test builds its tree under mkdtemp tmp and passes `roots: ['docs/specs']` and `repoRoot: tmp`. No read touches the real docs tree. The `classifyFile('docs/...')` and `canonicalizeExceptionPath(...)` literals are pure-string calls with no fs access.
  - The 2 text-label-join items are assertion message strings, so reject is right.
  - Spot-checked L72-85 and L1076-1082: fixture or comment text only.
- No patch is needed: the test is a frozen consumer of the frozen baseline, and L12-78 R22 gives no replay obligation for preserve entries.
- OUTCOME defects: none.

## Record-text notes
- The reject reason is the same boilerplate for all 397 REJECT items ("Test-owned mkdtemp or in-memory fixture..."). It is true for the fs-probe and config items. For text-label-join, scalar-pass-through and comment-or-type items the nonDocumentUse label carries the specifics. The reason prose could be tightened.
- The admitted items' proofCommand/parityObligation says the current/candidate comparison remains pending, which is consistent with preserve (no replay).
- The test hardcodes `fileCount, 994` (L741), so any baseline change must move the test and baseline together. Nothing in the records authorizes one, so this is consistent.

## Lead-judgment questions
- None.

## Counts
- Files: 2. Items: 1395 (996 + 399). ADMIT 998 (all preserve), REJECT 397. OUTCOME defects 0.

Status: DONE

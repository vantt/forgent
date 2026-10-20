# Review a38 step-05 rr4 p11 (seam 4 source file)

File: scripts/check-doc-inventory-gates.mjs (pin 95301cb9a), sub-batch skills-and-support, no diff, no parks.
Items reviewed: 360 (49 ADMIT: 3 literal references + 46 dynamic tuples; 311 REJECT). All 360 are disposition preserve. Windows read in full (one merged window, lines 1-1501).

Verdict: rework (5 admission defects; outcome stays preserve for every one of them, so no disposition/diff/park change is needed, only admission to REJECT with a true nonDocumentUse).

## OUTCOME defects (admission wrong)

1. dynamic-006880, L321 `const sourcePath = claim.sourcePath;` (ADMIT, pathOperand `claim.sourcePath`). Rule R5/R7 consistency. The passage only reads a field of caller data and uses it as a Map key (`claimsBySourcePath.set(sourcePath, ...)`). It reads, probes and emits no document path. The same file rejects the identical operations at L143 (006829 `o?.path` into a Set), L503 (006947), L512 (006957/6958). Correction: REJECT, nonDocumentUse = accumulator key (field read of caller data).
2. dynamic-006732, L1048 `const key = \`${ref.receiptCommit}:${ref.receiptPath}\`;` (ADMIT). Rule R5 (accumulators)/R7. The string is only a cache key (`receipts.has(key)` / `receipts.set(key, ...)`); the actual document read is at L1051 (`readBlobAtCommit`, no tuple). The identical cache-key construction at L604 (006973, `${reportCommit}:${reportPath}`) is REJECTed. Contrast L1096 (006741), which is correctly ADMIT because that key is passed to `git rev-parse key`. Correction: REJECT 006732, nonDocumentUse = accumulator/cache key.
3. dynamic-006753, L1176 `scoped || pathInScope(row.sourcePath, scope)` (ADMIT). Rule R5 (guards)/R7. It is a scope predicate over a path value (membership test); it constructs and reads nothing. Its sibling on the same expression, 006752 (`row.sourcePath.startsWith(prefix)`), is REJECT guard, and the file rejects the other predicate bodies (L40 006908, L727 006995, L1015 006727, L1021 006728). Correction: REJECT guard (one admission for the whole L1176 boolean).
4. dynamic-006758, L1185 `const inScope = (p) => pathInScope(p, scope);` (ADMIT, pathOperand `(p)`). Rule R5. A closure over a scalar parameter feeding the same predicate; `(p)` is not a path-producing operand. Correction: REJECT guard (same as 006753).
5. dynamic-006835, L1454 `const scopeProblem = findUnmatchedScope(scope, inventory);` (ADMIT, pathOperand `findUnmatchedScope(scope, inventory)`). Rule R5. The call returns the first scope value that matches no inventory path; it validates the CLI scope and neither constructs nor reads a document path (its body at L1015, 006727, is REJECT guard; the neighbouring message 006836 is REJECT). Correction: REJECT guard.

## Checks that passed

- All ADMIT reads/constructions are true document operations: L406/L457 `readCommitBlobMap` (006910, 006928, 006929), L703 `path.join(target, name)` (006985), L794 docs/architect -> docs/platform rewrite (007007, 007008, with 002488), L864 message with fixed `docs/platform` literal (007034), L954/L1088 constitution read (007069/7070, 006738/6739), L1096/L1131/L1132 git rev-parse of `commit:docpath` (006741, 006743, 006744), L1344-1356 fixed plans/ and ratchet document constants, L1363-1417 resolve of named document inputs, L1385 `git show HEAD:${registryRelPath}` (006813), L1439 relative registry path (006830).
- Same-passage pairs 006928/006929, 006738/006739, 007069/007070, 006797-006800, 006803/006804, 006810/006811, 006818-006823 agree on admission and disposition.
- Every REJECT `finding-path-field` (`path: item.path`, `path: p`, ...) really only carries a value into a finding; every `caller-data-formatting` message prints a path taken from caller data with no fixed document root (R6). Root/scalar pass-throughs (`repoRoot = null`, L1405 `repoRoot = path.resolve(cwd, ...)`) are correctly rejected (R5).
- No park exists; no preserve rests on a "retained" witness. The three literal references (002486, 002487, 002488) cite the frozen-gate-bytes rule (R9). I found no named Phase 9 obligation on this script (grep of plan.md and phase-09-atomic-platform-authority-cutover.md: only the plan.md pointers at L372/L573, which are not Phase 9 changes), so preserve rather than park is right.
- No retired-decision citation appears in the windows, so no successorNote is owed (all successorNote null).
- No diff/rollbackDiff exists (preserve-only), so no source-file/delta checks apply.

## Record-text notes (labels only, admission is right)

- nonDocumentUse `accumulator` on `scope = null` / `repoRoot`-style defaults: 006746 (L1151), 006757 (L1183), 006768 (L1218), 006771 (L1232). True use is a null-default scalar parameter (R5 parameter default); role already says scalar-metadata/guard.
- 006726 (L1013) and 006801 (L1360): role is comment but nonDocumentUse says `finding-path-field`; the true use is prose inside a doc comment.
- reference-002488 (L794, regex that rewrites docs/architect to docs/platform) has role `navigation`; it is a path-rewrite operation, while 002487 on L796 is labeled `retirement-gate-identity`. Same passage, label mismatch only.

## Lead-judgment questions

1. L1378: 006807 (label `the registry ${argv[idx+1]}`, REJECT) and 006808 (`path.resolve(cwd, argv[idx+1])`, ADMIT) share a line and a return statement. Under the "actual source operation" reading of R7 they are separate operations (a label versus a read), so I did not count it as a defect; the strict "same line, one admission" reading would require the two to agree.
2. L794-797: 007007/007008 (ADMIT, builds `areaRoot`) versus 007009 (`${areaRoot}/verification/` prefix in a startsWith guard, REJECT). Same reasoning; the prefix is a guard operand, so I accepted REJECT.
3. L1387 006814 (`registryRelPath` in the catch message, REJECT) while its parameter default IDENTITY_REGISTRY_PATH (006806, L1376) is ADMIT and the read at L1385 (006813) is ADMIT. The printed value is caller data, so I accepted REJECT, but the same-passage reading could ask for ADMIT.
4. 006985 (L703) and 006827 (L1417) admit paths built from caller-supplied directories/arguments (no fixed document root). I accepted them as real reads (shard files read at L709) rather than scalar pass-throughs.

## Counts

Items reviewed 360; ok 355; admission defects 5 (006880, 006732, 006753, 006758, 006835); record-text notes 3 groups (7 ids); Lead questions 4.

Status: DONE_WITH_CONCERNS
Summary: p11 (check-doc-inventory-gates.mjs) is rework: all 360 preserve outcomes are right, but 5 dynamic tuples are wrongly ADMITted (field/cache-key/predicate operands that read no document path) and should be REJECT with a true nonDocumentUse.

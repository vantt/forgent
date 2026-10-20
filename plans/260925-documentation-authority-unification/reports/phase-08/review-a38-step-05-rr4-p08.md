# Review a38 step-05 rr4 p08

Payload: s4-src-p08.json (4 files, 138 items; no diffs, no parks in any file).

## Per file

### scripts/build-rust-distribution.mjs — verdict: rework (1 outcome defect, 1 question)
Items reviewed: 91 (all dynamic).

OUTCOME defects
- dynamic-006415 (L383, `const full = path.join(dir, ent)`): REJECT/scalar-pass-through is wrong. It is the staged-tree walk that lstat-s every staged file. The staged tree carries the shipped docs payload (README, LICENSE, docs/how-to, docs/explanation, enduser-docs-index.json). It is the exact analogue of dynamic-006365 (L159 `path.join(relativePath, ent)`, source walk, ADMIT) and feeds the same enumeration that 006420/006421 (ADMIT) hash. Rule: R6 (payload walk, copy or hash over a files set containing docs) with R7 consistency. Correction: ADMIT, pathOperand `path.join(dir, ent)`, preserve, same parity obligation as 006420.

Lead-judgment question
- dynamic-006369 (L185, `path.resolve(resolvedRepo, file)` inside path.relative(...).filter(allowed.has)): rejected as scalar-pass-through. It normalizes each declared payload path (docs included) and probes membership against `git ls-files`. 006358 (join feeding statSync) is admitted. It is defensible as pure normalization, but it does decide which doc paths are in the payload. Recommend ADMIT/preserve for consistency with 006358/006365. The Lead may keep REJECT if only reads and emits count.

Record-text notes
- 006367/006380 (reads package.json): nonDocumentUse label "scalar-pass-through" is imprecise. The true use is "reads package.json, a non-document manifest".
- 006431 (L5, comment "directory:") is labelled scalar-pass-through. A "comment/prose colon, no path" label would be more accurate.
- 006393 (removed operand): the `reason` text quotes the isDist operation, not the removed CARGO_TARGET_DIR operand. The removed-at-pin witness is correct.

Rest verified ok:
- 006358/59, 006365, 006411/12, 006420/21 are admitted with a real path operand.
- Caller-data error strings (006357, 62-64, 74, 76, 77, 83, 97, 98, 408, 413, 417, 419, 425, 437-440) print only caller-supplied paths, so reject is right (R6).
- Root/cargo/dist/package.json/Cargo.lock/addon/shim/argv/join tuples are correct R5 rejects.
- 006446 is a native-addon `path:` field, not a document (R5).

### scripts/build-skill-wrappers.mjs — verdict: ok
Items reviewed: 13.
- 006448/49 repoRoot derivation: REJECT root-only. Correct (R5).
- 006450-55 fixed `.agents/.claude/plugins` skill roots: ADMIT/preserve. Matches the p06 ruling. Paired duplicates agree.
- 006456/57/59 assembled/wrote/mirrored messages with a fixed skill-root-derived path: ADMIT. Correct (R6).
- 006458/60 count-only messages: REJECT. Correct.

### scripts/check-backlog-reconciliation.mjs — verdict: rework (3 outcome defects)
Items reviewed: 29 (9 literal, 20 dynamic).

OUTCOME defects
- dynamic-006471 and 006472 (L16, `repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')`): admitted as document-path-operation / path-operation. This is root-derivation plumbing that constructs no document path. Rule R5 (root-only, resolve/parent of a root), and the same operation in build-skill-wrappers (006448/49) is REJECT. Correction: REJECT, nonDocumentUse root-only, preserve. The two items also carry different roles for one operand, so fix the role text too.
- dynamic-006476 (L61) and dynamic-006480 (L92): `${path.relative(repoRoot, BACKLOG)}` and `${path.relative(repoRoot, DOC)}` are rejected as caller-data-formatting. BACKLOG and DOC are fixed constants (L17/L18) for docs/backlog.md and the RECONCILIATION.md path. The printed path comes from a fixed document root, so the output changes if the path moves. Rule R6 (fixed document literal or root). The same file admits 006479 (L89) and 006462/67. Correction: ADMIT, role emitted-document-message, pathOperand `path.relative(repoRoot, BACKLOG)` / `path.relative(repoRoot, DOC)`, preserve.
- dynamic-006461 (L107, `${id}: appears more than once in RECONCILIATION.md`): REJECT. The message prints the fixed document name RECONCILIATION.md, as 006462 (L114) and 006467 (L133) do, and those are ADMIT. Rule R6/R7 consistency. Correction: ADMIT/preserve as an emitted-document-message. If the Lead rules that a bare basename is not a path, then 006462/67 already stand on their docs/backlog.md literal, and this one may stay REJECT. Marked as an outcome defect with that caveat.

Verified ok:
- Literal references 002432-002440 (docs/backlog.md and docs/history/backlog-execution-reconciliation/RECONCILIATION.md, in comments, messages and constant paths): ADMIT/preserve. The targets are live and retained (docs/history convention).
- 006473/74 constants: ADMIT.
- 006475 PATH_LINE regex: REJECT as a shape guard. Correct.
- 006463-70, 006477/78: no document path, REJECT.
- 006479: ADMIT.

### scripts/check-decision-codes.baseline.json — verdict: ok
Items reviewed: 5.
- reference-002472 (L228, `docs/decisions` inside a baseline test-title key): ADMIT/preserve. Baseline keys are byte-frozen (p07 ruling). docs/decisions is a live directory with index.md, so no successorNote is needed.
- reference-002473 (L42, `docs/history/<id>/iron-law-evidence.md` in a test-title key): same, preserve.
- dynamic-006527/28/29 (`scope:'...'` text inside test titles): REJECT with config-or-metadata. True: a title substring that is not a path. Better label would be "test-title text".

## Counts
- Items reviewed: 138 (91 + 13 + 29 + 5).
- Outcome defects: 6 item ids across 3 passages (006415; 006471/72; 006476; 006480; 006461 with caveat). 
- Questions: 1 (006369).
- Record-text notes: 5 (6367/6380 label, 6431 label, 6393 reason, 6527-29 label, 6471/72 role mismatch).
- Parks: 0 in all files (no blockedReason to review). Diffs: none, so no diff checks apply. No retired decision citations are preserved in this part.
- All admitted dynamic tuples have a pathOperand. All rejected tuples have a nonDocumentUse that is true, apart from the label notes above.

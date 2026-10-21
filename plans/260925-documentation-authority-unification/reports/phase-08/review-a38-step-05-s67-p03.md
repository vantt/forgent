# Review a38 step-05 seam 6/7 part p03 (s4-src-p03)

Pin read: 42edba2b08d26ab8dcabe4859a301e1589fa8e6b (read-only via git show).
Scope: seam 7 ratchet scan roots, 3 files, 100 items. No diffs, no patch files, no crossSeamChangedOnly entries.

## Per file

### scripts/check-legacy-docs-ratchet.exceptions.json
- Verdict: ok. Items reviewed: 53 (reference-003489..003541), all ADMIT / frozen-baseline-data / preserve.
- Spot-read lines 14, 97, 157, 247, 300, 348, 359, 461, 497, 508, 522, 525: all are `path` keys, revisitTrigger or rationale/meaning text inside the frozen exceptions ledger.
- Preserve fits R13: no rebaseline, no new exception kind, no hand edit, and the file is checker-read data, not a document with a live holder.
- Preserve does not rest on a "retained" witness. The witness is the frozen-data scope. treeRetires is true for docs/specs|docs/architect targets and false for retained roots (reading-map, backlog, io-contract, decisions/index, how-to), which is the right split.
- Same-line pairs agree: 003492/003494 at L522 and 003493/003495 at L461 share one outcome.
- OUTCOME defects: none.

### scripts/check-legacy-docs-ratchet.mjs
- Verdict: ok. Items reviewed: 39 (4 comment-provenance preserve, 7 reference-level parks, 28 dynamic tuples).
- Comment items 003542/003552 (L3-4), 003543 (L78), 003544 (L81) are preserve. All are comments inside the gate script and retire with it.
- Parks: reference-003545/003550 (L88), 003546 (L69), 003547/003551 (L95), 003548/003549 (L20). Dynamic parks are 007143 (L20), 007161 (L272), 007162/3 (L276), 007164/5 (L282), 007166 (L283), 007167 (L297), 007172 (L372), 007179 (L425), 007225 (L682).
  - Every park names Decision F and a passage-specific blocker: the classifyFile branches, the default scan-root array, the scanFiles/generateBaseline/checkRatchet/runCli root defaults, the recursive child-path construction, and the symlink-escape guard.
  - This matches R13/R9: gate path operations preserve unless a named Phase 9 obligation changes them, and then they park citing that obligation.
  - Same-line and same-passage items agree: L20 literals match 007143, and L88 and L95 pairs match.
- pathOperand check for the admitted tuples: every operand yields a repo or document path (DEFAULT_ROOTS, path.resolve(repoRoot, rootRel), path.join(currentAbs, entry.name), path.relative(repoRoot, fullPath), path.resolve(currentAbs, rawTarget)). The `roots = DEFAULT_ROOTS` operands feed the scan.
- Admitted preserves 007219..007222 (L670-676) are the baseline and exceptions reads through override-or-default resolution. Both are frozen scripts/ data under R13, not docs, so preserve is defensible.
- Rejects 007145/007149 (L21-22) are the constant definitions only. They are config-or-metadata, and the actual reads are admitted separately at L670-676.
- Other rejects are true: 007176 (posix-relative label), 007196/7 (finding path-field echo and message format), 007226..7233 (CLI status and diagnostic strings built from caller or scanned values).
- OUTCOME defects: none.

### test/scripts/check-decision-citation-drift.test.mjs
- Verdict: ok. Items reviewed: 8 (reference-004578..004585), all REJECT / preserve.
- Checked in the pin: 4578/4581/4585 (docs/backlog.md at L135/L87/L100), 4579/4580 (docs/specs/a.md), 4583 (docs/specs/work-state.md at L113) and 4584 (docs/history/x/CONTEXT.md) are `file:` strings inside in-memory `sourceFiles` arrays passed to findCitation*Findings. 4582 (docs/id-systems-audit.md, L311) is a code comment.
- No path construction, no read of real document bytes. The rejects are correct and the nonDocumentUse labels are true (config-or-metadata for fixtures, comment-or-type for the comment).
- The real-repo CLI test (about L755-780) is a spawn of the checker with --skills-dir only. It carries no document literal in this payload, and its real reads belong to the checker defaults record, out of this part.
- OUTCOME defects: none.

## Record-text notes (not outcome defects)
1. The preserve reason strings on the exceptions rows end with "Own operand '<expr>'" and are otherwise uniform. That is acceptable for frozen data, but a few operands are truncated to a bare root (`docs/specs`, `docs/architect`). A reader cannot tell the rationale-text spans from the path keys without the source span.
2. dynamic-007197 (L533) is rejected as caller-data-formatting. Its fixed message text also names `docs/platform/**`, a non-retiring root, with no citation of a retiring doc. The reject is right, but the record could name that literal so no reader assumes it was missed.
3. Comment-provenance items 003543/003544 (L78/L81) describe the classification rules in code that is parked at L88/L95. They are preserved as comments retiring with the script, and no successorNote is needed because they cite no retired decision ID.

## Lead-judgment questions
1. runCli L670-676 (baseline and exceptions reads, preserve) versus L682 (roots default, park). Both go away with the gate under Decision F. The split rests on baseline/exceptions being frozen scripts/ data, not retiring docs. Please confirm that preserve for the data-file reads is intended, so Step 7 does not read the preserves as surviving the cut.
2. The 53 exceptions-ledger preserves cover entries whose target paths retire (docs/specs/**, docs/architect/**). They are preserved as frozen data, with ratchet retirement carried as the Decision F obligation, not as a per-entry retained witness. This matches the "no retained witness for retiring trees" rule as I read it. Confirm that reading.

## Counts
Files 3 / items 100. ADMIT 79 (preserve 61, park 18); REJECT 21 (13 in the ratchet script, 8 in the test). Outcome defects 0, record-text notes 3, Lead questions 2.

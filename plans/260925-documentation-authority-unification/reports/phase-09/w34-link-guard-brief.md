# Every link in docs/platform resolves after F (Doer brief, records slice)

Status: Lead brief under L12-137, L13-24, L13-26 and L13-28. Read L13-28 and `reviews/w33-link-retargets-review.{md,json}` first.

1. **Row 125.** Fix `L13-26:link:125` and `/patches/24` exactly as w33 gives them. The new target is `../../reading-map.md`, and the new `expectedAfterSha256` is `8ce81ee7…`. Regenerate the rollback diff.
2. **Door check.** Replace the finding `linkIntoMoveSet` in `fchain/check.py` with `linkGuard`, and keep its negative control in `controls.py`.
   - It covers every Markdown link and anchor in the composed `docs/platform/**`: inline links, reference links, `href` links and Related headers. Code spans and fences stay literal.
   - It checks that the file exists in the composed tree, and that the anchor exists, using the anchor rule of the unit extractor.
   - Fix the double report for `[x](<…>)` links.
   - Add one control: an injected broken anchor must fail.
3. **Scan the whole population** with that check on the composed state, at the turn-start HEAD. w33 expects roughly 67 Related entries, 411 links broken at the pin and 24 in F-created files. Record your exact counts before you start.
4. **Fix every finding** in `fchain/link-retargets.json`, following the order of rules in L13-28.2. Each row gives its rule and its source. Each file gets one prepared patch, with forward and rollback diffs. A line that an earlier source already changes is linked, not patched twice.
   - The 24 self-links and the 11 labels from w33 follow L13-28.2.3 and L13-28.2.4.
   - The `fgos-gateway-api-v1.yaml` descriptions at lines 456, 607, 710 and 739, and the two `x-docs` entries that name gone decision files, are fixed in the same record (L13-28.5).
5. **Small leftover.** Remove the `staleChainDependencies` entry from f07667, since it contradicts its note.

Do not change any decision. Proofs, all must exit 0:
- `fchain/check.py --pin HEAD`, with 0 `linkGuard` findings;
- `fchain/controls.py`;
- `check_shard.py --all`;
- `g9/check_phase9_decisions.py`;
- `node P/carries/verify-carries.mjs`.

Restore volatile outputs that only a rerun changed. Update `fchain/receipt.md` with the counts before and after, the counts per rule, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/fchain/**
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**

Do not edit docs/, ledgers, the register, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

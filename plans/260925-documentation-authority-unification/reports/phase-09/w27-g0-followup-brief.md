# G0 follow-up: seven rows, fenced code, verdict freshness (Doer brief, records and docs slice)

Status: Lead brief under L12-137 and L13-25. Read `reviews/w26-g0-rework-verdicts.{md,json}` and L13-25 first.

1. **The 7 REWORK rows**, fixed as the review says:
   - s7-step09-n1 `/registryGaps/0` and `/1`: the old wording quotes the bound source (1958…, and 2470,2602 for `/1`). Keep the earlier repair's provenance (`b919e2b9b`, successor claim ids).
   - s14-resync-b `/bindingRefresh/8`: an explicit drop with its reason, not a duplicate of s11 `conservedClaims/7/bindings/2`.
   - `import2/partial-carry-residuals.json` rows 0 and 1: point them at the target after the code-span fix (s4-packaging `/registryGaps/22`, s5-authorities `/registryGaps/3`).
   - g0 `/bindingRefresh/125` and `/126`: rationale text names the current rows.

   Set `reviewStatus: pending` on each.
2. **Fenced code is literal (L13-25.1).** Restore the two fenced-code retargets (`docs/platform/workflow/spec.md:420`, `docs/platform/system-architecture/component-boundary.md:549` or wherever it now is) to their source bytes. Extend the scan in `rebind/g0-code-span-scan.json` to fenced code with a markdown tokenizer, and fix any other hit the same way. Rebind affected rows through `rebind/rebind.py`, and record the rebinds.
3. **Verdict freshness (L13-25.2).** Extend `g0join/join.py`: a verdict counts only if its review file's commit is a descendant of the last commit that changed the row's decision fields (disposition, rationale, changedClauses, supersedes links, bindings), or if the verdict carries a matching `rowFingerprint`. Define the fingerprint over those fields, and reuse `ledgerfix/bindings.py` traversal. Add tests in `g0join/test_join.py` for a stale verdict, a fresh verdict and a matching fingerprint. Run the join at HEAD and commit the output. It will list the rows needing re-review; that is expected.
4. **Proofs**, all exit 0 except the join (exit 1 with only rows changed in this turn, or stale under item 3):
   - `rebind/rebind.py --check`;
   - `node P/carries/verify-carries.mjs`;
   - `node scripts/check-legacy-docs-ratchet.mjs`;
   - `g0join/test_join.py`;
   - `rebind/test_rebind.py`.

   Write `g0join/followup-receipt.md` with every command and its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/ledger/decisions/**
- docs/platform/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0join/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/**
- plans/260925-documentation-authority-unification/reports/phase-09/import2/partial-carry-residuals.json

Do not edit legacy docs, the register, reviews, `g0rework/**` (another Doer is editing it), `fchain/`, `g9/`, `preserve-premise/` or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

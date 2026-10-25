# Register catch-up: census REJECT, G5 receipt, gate statuses (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-19. Read `reviews/w20-census-settlement-review.*`, `reviews/w21-census-rework-and-g5-review.*` and L13-17 to L13-19 in `owner-answers.md` first.

1. **pc-d-0288:** change it from owned park to a confirmed REJECT (non-document rendering, L13-19.1), with that reason and its locator. Replay `census-join/join.py --pin <HEAD at start>` twice, byte-identically. Update the totals in `census-join/receipt.md`.
2. **G5 receipt (w21 Low).** Rewrite `g5/receipt.md` so that it describes the current run first: `check-b57e79625.json`, exit 0, 1 verbatim / 8 restated / 1 not applicable. Keep the a8acd5d27 run as a short history section. Make its reproduction commands reproduce the current output. Fix the duplicate "## 4." heading.
3. **Register.** Rerun `gate-reconcile/reconcile.py`, the one generator, so that:
   - G2 cites w20 and w21 and is set from what remains. The 0288 REJECT is under L13-19.1.
   - G5 cites `g5/check-b57e79625.json`, w21 B and L13-10. Its only open items are owner acceptance of the 8 restatements (cutover packet) and the rerun at F.
   - G8 cites w20 C for f67e0f676, and L13-18 for the archive ref at F.
   - `cutoverReadiness.summary` says which gates are met-local, and which owner and external items the cutover approval packet must carry.

   Rerun `verify.py` and `controls.py` (exit 0), and restore volatile fields.
4. **Proofs.** List these, with their exit codes, in the receipts you touch:
   - `join.py`, twice;
   - `python3 -B g5/check.py --pin b57e79625`;
   - `gate-reconcile/verify.py`;
   - `gate-reconcile/controls.py`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/**
- plans/260925-documentation-authority-unification/reports/phase-09/g5/receipt.md
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, src/, test/, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

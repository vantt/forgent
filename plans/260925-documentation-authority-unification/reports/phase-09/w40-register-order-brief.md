# Register start order per the owner's choice (Doer brief, records slice)

Status: Lead brief under L13-31. Read first: `reviews/w39-register-refresh-review.{md,json}` (11 APPROVE / 0 REWORK, one medium note about order), `owner-answers.md` L13-30 and L13-31, and `preflip-execution-plan.md` §3 W4.

Regenerate `preflip-gate-status.json` through `gate-reconcile/reconcile.py`; never hand-edit it.

1. **Order.** `cutoverReadiness.order` must follow L13-31 and W4:
   1. Owner cutover approval within the stated scope (done, L13-30).
   2. lead:LAND confirms (done, 2026-10-26) and posts the DOC freeze notice and the HARDEN request on the board (done, origin/main e99966b37). From the F import until Land, the docs/ freeze holds by convention only.
   3. HARDEN/Git owner answers: the G4 review of the 25 declarations, and git spec §7 consent.
   4. Final main import with accounting; record F.
   5. SEAT/LAND stages release R from the F code commit. It is staged only, not activated.
   6. G11: the Lead proves installed-host docs-lease acquire/status/release/abandon in a disposable clone.
   7. G10: holder Land rehearsal on the G8 shrunk clone with release R.
   8. Acquire the real documentation write lease.
   9. Execute the F duties and delta reviews; stop if any fails.
   10. Write and independently review the final status ledger.
   11. Land within the separately approved frame.

   The owner approval condition reads: "lead:LAND confirms before any option-A step, starting with the board notice".
2. **Checks.** Update the order check in `gate-reconcile/verify.py` and its control in `controls.py`. The control must fail when the F import is placed before the HARDEN answer, or when the real lease is placed before G11 and G10. Do not weaken any other check.
3. Add a `localCorrectionReview` entry for 45da92781 with w39: 11 APPROVE / 0 REWORK, and its order note resolved by this change.

Proofs, all exit 0:
- `gate-reconcile/verify.py`;
- `gate-reconcile/controls.py`;
- `rebind/rebind.py --check`.

Restore any volatile field that only a rerun changed. Update `gate-reconcile/receipt.md` with the changes and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, ledgers, reviews, other records or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

# Register refresh before the lease (Doer brief, records slice)

Status: Lead brief under L13-29.2 and L13-30. Read first:
- `reviews/w38-register-update-review.{md,json}` (11 APPROVE, 0 REWORK, 5 low notes);
- `reviews/w33-ownership-audit-review.md`, "Recommended follow-ups";
- `owner-answers.md`, L13-29 and L13-30.

Regenerate `preflip-gate-status.json` through `gate-reconcile/reconcile.py`; never hand-edit the generated register. Change the reconciler's inputs or code where needed.

1. **Owner decision.** Record L13-30 in the register.
   - The owner approved cutover option A on 2026-10-26, with the condition that lead:LAND confirms before the lease.
   - Mark the order steps "Send owner cutover packet" and "Owner cutover approval" as done, citing 6586bbc46 and L13-30.
   - The lease and every later step stay pending.
   - G8 publication is covered by A's scope. G5 owner acceptance and the G9 backlog intent stay open owner items.
2. **w38 low notes:**
   - The rebind status in `rebind/g0-rework-rebindings.json` and the register cites W26 for records 0–148 as well as w33 for records 149–154.
   - Remove `linkIntoMoveSet` from the register, from `gate-reconcile/verify.py` and from its control. `linkGuard` is the measured finding, and the register reports its value from `fchain/check.json`. Do not leave a field that is always 0.
   - The ownership audit in the register states its result at the latest accounting, 23e3c34b7: 0 unaccounted pairs, B ok, reproduction 8/8, and 58 allowed-path exceptions dropped. The pinned input hashes must match HEAD.
   - G7 cites the review file and item, `reviews/w33-link-retargets-review.json` and the work-state rebase item, not a non-file name. `affectedGates` adds G9 for w35 and w37, and adds cutover readiness for w32.
   - Add a `localCorrectionReview` entry for e7e6c129c with w38: 11 APPROVE, 0 REWORK. Clear the summary clause "still needs independent records review".
3. **Uncarried w33 follow-ups.** Add both to `followUps` with owner `lead:DOC` and a destination:
   - `audit-report.py` should also report the raw drift count;
   - records 149–150 should use the same `file`/`pointer` keying as records 151–154.

Proofs, all exit 0:
- `gate-reconcile/verify.py`;
- `gate-reconcile/controls.py`;
- `rebind/rebind.py --check`.

Restore any volatile field that only a rerun changed. Update `gate-reconcile/receipt.md` with what changed and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/g0-rework-rebindings.json

Do not edit docs/, ledgers, reviews, other records or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

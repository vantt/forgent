# Source parity rework and scratch hygiene (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w16-g0-rework-and-park-rule-review.{md,json}` first.

1. **F1, High: the parity rows fail their own checker.** `carries/verify-carries.mjs` (around line 87) requires a current source unit for each row of `carries/source-parity.json`. Replaying that loop, 35 rows fail: the 21 rows appended by c25e8cf6a, and 14 older `distribution.md` rows that were already stale.
   - For each failing row, put the current source anchor and digest in the fields the checker reads. Keep the historical anchor and digest in the row's existing history fields, which the review says already exist.
   - Refresh the 14 older rows the same way. Where a source unit no longer exists, say so with the checker's existing mechanism; do not drop the row.
   - Run `node plans/260925-documentation-authority-unification/reports/phase-09/carries/verify-carries.mjs`, or the way the carries receipt says to run it. It must exit 0. Add that command to the proofs in `g0rework/verify.py` so it is never skipped again.
2. **F3.** In `claim_5ba6768e`, give each changed clause its own source, not the same six for both.
3. **F4.** Add the missing "(9 file)" wording change to the `claim_320ba622` rationale.
4. **F8.** Pin the base of the `g0rework/verify.py` parity comparison to `receipt.json.sourceHead`, so later edits to the parity file do not break it. Keep it strict.
5. **F6.** `g0rework/verify.py` must not report success when part of the audit did not run. Mark it "partial", naming what was not run (`checks.mjs` loads a native addon, so it is not run in the Doer sandbox).
6. **Fixed scratch paths (the w14 note I3).** `rebind/rebind.py` writes `/tmp/fgos-work/w5-rebind-apply`, and `import3/resync.py` and some older `composition/` scripts also use fixed paths. Switch every script that a current check runs to a `tempfile` directory that is removed on exit. Prove that `rebind.py --check` leaves nothing under `/tmp/fgos-work`. Do not change any algorithm.
7. **Proofs.** All of these must exit 0:
   - `rebind/rebind.py --check`;
   - `g0rework/verify.py`;
   - the carries checker;
   - `misc-fix/verify.py` (if only volatile fields changed in `misc-fix/checks.json`, restore it);
   - `g9/sweep.py --check --pin HEAD`.

   Update `g0rework/receipt.md` with the commands and exit codes.

Not in this turn: F2, the events.lock successor for `claim_2e2bc926`. Main has since cut Work over to the Event Store (42c5a0a55). The re-decision is redone at the final main import, as a final-pin duty.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/carries/**
- plans/260925-documentation-authority-unification/ledger/decisions/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/rebind.py
- plans/260925-documentation-authority-unification/reports/phase-09/import3/**
- plans/260925-documentation-authority-unification/reports/phase-09/composition/**

Do not edit docs/. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py` (it can stage a native addon), and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

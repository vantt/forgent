# Census parks, duty-list strictness and register follow-up (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-17. Read `reviews/w19-live-parity-and-rebinds-review.{md,json}` and `census-join/receipt.md` ("Four before-F parks") first.

1. **The four G2 parks** (`pc-l-0042`, `pc-l-0056`, `pc-l-0077`, `pc-l-0078`). Each is a code comment that cites a documentation section. For each:
   - find the current holder and section that owns the cited text after the cutover: seat-binding 5.4/6.3, distribution Entry Points, workflow RUL-WF-27. Use the ledger and `carries/` mappings, not guesses.
   - record the binding with the holder path, section anchor and current unit digest, and change the disposition from park to joined-by-citation.
   - if the comment's path changes at cutover, record the retarget as a prepared patch in the existing composition patch format, replayed with `patch --fuzz=0` forward and rollback. Do not apply it.

   If a citation has no current holder, keep it parked and say exactly what is missing. Replay `census-join/join.py --pin <HEAD at start>` twice, byte-identically.
2. **Duty-list strictness (w19 Low).** The carries checker must fail when a final-pin duty names a file that does not drift, because a stale entry would let that file drift later without failing. Add that negative control to the checker's own controls. Also remove the duplicate target in heading row 55 (w19 Info).
3. **Misc-fix receipt label (w19 Low).** In `misc-fix/receipt.md`, relabel the older "Sentence-scope wave" section as historical, so that it no longer says it supersedes the newer "Current G6 fixes" table. Change only the label text.
4. **Register.** w19 independently approved 25e8842d3, so remove that `remaining` item from G6 and put it in `cleared`, citing `reviews/w19-live-parity-and-rebinds-review.md`. Set G6's status from what remains. For G0 and G1, w19 approved all 25 pending rebinds row by row, so clear that item the same way and set their status. G2 stays `partial` until this turn and turn 707 are reviewed. Rerun `gate-reconcile/reconcile.py` (it is the one generator), then `verify.py` and `controls.py`; all must exit 0.
5. **Proofs**, all exit 0, with native addons blocked:
   - `node P/carries/verify-carries.mjs`;
   - `census-join/join.py`, twice and byte-identical;
   - `gate-reconcile/verify.py`;
   - `gate-reconcile/controls.py`;
   - `misc-fix/verify.py`; restore `misc-fix/checks.json` if only volatile fields changed.

   Record them in the receipts you touch.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/**
- plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/receipt.md
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, src/, test/, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

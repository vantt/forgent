# Census join rework: point each join at the test that runs the code (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-17. Read `reviews/w20-census-settlement-review.{md,json}` first (196 APPROVE / 8 REWORK).

1. **Seven joins name a test that never calls the cited helper:** pc-d-0446, 0448, 0450, 0453, 0454, 0479 and 0480. For each, trace the call chain from the cited line, which is inside a helper or closure, to a test that actually invokes it with the cited branch taken. Name that test (file, title, line), and record the call chain in the row's evidence. The review's table gives the likely real callers; verify each one yourself. If no test takes the cited branch, the row becomes an owned park with a reason. Do not guess.
2. Fix the description text of pc-d-0447 and pc-d-0449: it belongs to the `llmAccounts` line. Fix the receipt sentence that says the `llmAccounts` branch joins a test that supplies pool accounts. Correct the description line reference of pc-d-0924, and the description of pc-d-1101, which is rebound to current line 30.
3. Audit the other joins of the same shape. These are rows whose cited line sits inside a helper or closure, and whose named test is in the same file. Check that each named test reaches the helper, and fix any that do not. Report the count audited and the count fixed.
4. Add `postMeasurementEdits` for the 25e8842d3 edit to `archive/receipt.json` (w20 Info). Change only that.
5. **Proofs.** All must exit 0:
   - `census-join/join.py --pin <HEAD at start>`, twice and byte-identical;
   - `gate-reconcile/verify.py`;
   - `gate-reconcile/controls.py`.

   Restore volatile fields. Keep G2 `partial` in the register, since it awaits review of this turn. List the commands and exit codes in `census-join/receipt.md`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/**
- plans/260925-documentation-authority-unification/reports/phase-09/archive/receipt.json

Do not edit docs/, src/, test/, the register, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or any product test (read tests, do not run them), never `phase-08/audit-report.py`, and never load native addons. Another session is running a heavy suite on this machine, so keep IO light. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

# G5: check the surviving reading-map clause (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w8-lead-fixes-review.{md,json}` (the G5 REWORK), ruling L13-10 in `owner-answers.md`, the G5 row in `preflip-gate-status.json` and the G5 definition in `preflip-execution-plan.md` first.

Today `g5/check.py` proves only that the 10 recorded retention spans are still whole lines of their legacy files (reading-map and holder-lock). The G5 clause also requires that each retained span survives the cutover in the surviving `docs/reading-map.md` (the entry-union clause). That half is not checked.

1. Extend `g5/check.py`, keeping the existing legacy check, so that for every span it reports one of:
   - **verbatim:** the line number in the surviving `docs/reading-map.md`, with a byte-equal line;
   - **restated:** the surviving line number, the exact surviving text, and the exact legacy text. This covers the English banner restatement of L11-25 and line 34 with its Truth-correction suffix. Name each restatement explicitly; no fuzzy matching.
   - **missing:** this fails the check.

   Restated spans are not approved by the check. Output a machine-readable `ownerAcceptance` list that holds exactly the restated spans and the proposed text, for the owner's cutover packet (L13-10).
2. Add `--pin` support for the surviving file too, and negative controls inside the script: a changed byte in a verbatim span fails; a restated span whose surviving text changed fails; a span missing in the surviving map fails.
3. Run it at the current HEAD with an explicit `--pin`, write `g5/check-<shortpin>.json`, and keep `g5/check-b726d44ed.json` as history. Write `g5/receipt.md` with the commands and exit codes, the per-span table, and the `ownerAcceptance` list.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g5/**

Do not edit docs/, the gate register, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
